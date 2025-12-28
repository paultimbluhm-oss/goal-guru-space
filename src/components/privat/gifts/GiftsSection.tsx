import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, Plus, Gift, User, ChevronDown, Trash2, ExternalLink, ShoppingCart, Check, Euro } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface GiftRecipient {
  id: string;
  name: string;
  notes: string | null;
  created_at: string;
}

interface GiftIdea {
  id: string;
  recipient_id: string;
  title: string;
  description: string | null;
  price: number | null;
  url: string | null;
  purchased: boolean;
  purchased_date: string | null;
  account_id: string | null;
  created_at: string;
}

interface Account {
  id: string;
  name: string;
  balance: number;
}

interface GiftsSectionProps {
  onBack: () => void;
}

export function GiftsSection({ onBack }: GiftsSectionProps) {
  const { user } = useAuth();
  const [recipients, setRecipients] = useState<GiftRecipient[]>([]);
  const [ideas, setIdeas] = useState<GiftIdea[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [expandedRecipients, setExpandedRecipients] = useState<Set<string>>(new Set());
  
  // Dialogs
  const [addRecipientOpen, setAddRecipientOpen] = useState(false);
  const [addIdeaOpen, setAddIdeaOpen] = useState(false);
  const [selectedRecipientForIdea, setSelectedRecipientForIdea] = useState<string | null>(null);
  
  // Form states
  const [recipientName, setRecipientName] = useState('');
  const [recipientNotes, setRecipientNotes] = useState('');
  const [ideaTitle, setIdeaTitle] = useState('');
  const [ideaDescription, setIdeaDescription] = useState('');
  const [ideaPrice, setIdeaPrice] = useState('');
  const [ideaUrl, setIdeaUrl] = useState('');

  useEffect(() => {
    if (user) {
      fetchRecipients();
      fetchIdeas();
      fetchAccounts();
    }
  }, [user]);

  const fetchRecipients = async () => {
    const { data, error } = await supabase
      .from('gift_recipients')
      .select('*')
      .eq('user_id', user!.id)
      .order('name');
    if (!error && data) setRecipients(data);
  };

  const fetchIdeas = async () => {
    const { data, error } = await supabase
      .from('gift_ideas')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    if (!error && data) setIdeas(data);
  };

  const fetchAccounts = async () => {
    const { data, error } = await supabase
      .from('accounts')
      .select('id, name, balance')
      .eq('user_id', user!.id)
      .order('name');
    if (!error && data) setAccounts(data);
  };

  const toggleRecipient = (id: string) => {
    const newSet = new Set(expandedRecipients);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedRecipients(newSet);
  };

  const addRecipient = async () => {
    if (!recipientName.trim()) return;
    
    const { error } = await supabase.from('gift_recipients').insert({
      user_id: user!.id,
      name: recipientName.trim(),
      notes: recipientNotes.trim() || null,
    });

    if (!error) {
      toast.success('Person hinzugefügt');
      setRecipientName('');
      setRecipientNotes('');
      setAddRecipientOpen(false);
      fetchRecipients();
    } else {
      toast.error('Fehler beim Hinzufügen');
    }
  };

  const deleteRecipient = async (id: string) => {
    const { error } = await supabase.from('gift_recipients').delete().eq('id', id);
    if (!error) {
      toast.success('Person gelöscht');
      fetchRecipients();
      fetchIdeas();
    }
  };

  const addIdea = async () => {
    if (!ideaTitle.trim() || !selectedRecipientForIdea) return;
    
    const { error } = await supabase.from('gift_ideas').insert({
      user_id: user!.id,
      recipient_id: selectedRecipientForIdea,
      title: ideaTitle.trim(),
      description: ideaDescription.trim() || null,
      price: ideaPrice ? parseFloat(ideaPrice) : null,
      url: ideaUrl.trim() || null,
    });

    if (!error) {
      toast.success('Geschenkidee hinzugefügt');
      resetIdeaForm();
      setAddIdeaOpen(false);
      fetchIdeas();
    } else {
      toast.error('Fehler beim Hinzufügen');
    }
  };

  const deleteIdea = async (id: string) => {
    const { error } = await supabase.from('gift_ideas').delete().eq('id', id);
    if (!error) {
      toast.success('Idee gelöscht');
      fetchIdeas();
    }
  };

  const togglePurchased = async (idea: GiftIdea, accountId?: string) => {
    if (!idea.purchased && !accountId && accounts.length > 0) {
      // Show account selection if not purchased yet and has accounts
      return false;
    }

    const updates: any = {
      purchased: !idea.purchased,
      purchased_date: !idea.purchased ? format(new Date(), 'yyyy-MM-dd') : null,
    };

    if (accountId && !idea.purchased && idea.price) {
      updates.account_id = accountId;
      
      // Create transaction for the purchase
      await supabase.from('transactions').insert({
        user_id: user!.id,
        account_id: accountId,
        amount: idea.price,
        transaction_type: 'expense',
        category: 'Geschenke',
        description: `Geschenk: ${idea.title}`,
        date: format(new Date(), 'yyyy-MM-dd'),
      });

      // Update account balance
      const account = accounts.find(a => a.id === accountId);
      if (account) {
        await supabase.from('accounts').update({
          balance: account.balance - idea.price,
        }).eq('id', accountId);
      }
    }

    const { error } = await supabase
      .from('gift_ideas')
      .update(updates)
      .eq('id', idea.id);

    if (!error) {
      toast.success(idea.purchased ? 'Als nicht gekauft markiert' : 'Als gekauft markiert');
      fetchIdeas();
      fetchAccounts();
    }
    return true;
  };

  const resetIdeaForm = () => {
    setIdeaTitle('');
    setIdeaDescription('');
    setIdeaPrice('');
    setIdeaUrl('');
    setSelectedRecipientForIdea(null);
  };

  const openAddIdea = (recipientId: string) => {
    setSelectedRecipientForIdea(recipientId);
    setAddIdeaOpen(true);
  };

  const getIdeasForRecipient = (recipientId: string) => {
    return ideas.filter(i => i.recipient_id === recipientId);
  };

  const totalBudget = ideas.filter(i => !i.purchased && i.price).reduce((sum, i) => sum + (i.price || 0), 0);
  const totalSpent = ideas.filter(i => i.purchased && i.price).reduce((sum, i) => sum + (i.price || 0), 0);
  const openIdeas = ideas.filter(i => !i.purchased).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shrink-0">
              <Gift className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold truncate">Geschenke</h2>
              <p className="text-xs text-muted-foreground hidden sm:block">Ideen & Einkäufe verwalten</p>
            </div>
          </div>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <Dialog open={addRecipientOpen} onOpenChange={setAddRecipientOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="gap-1 h-7 px-2 text-xs">
                <User className="w-3 h-3" />
                <span className="hidden sm:inline">Person</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Person hinzufügen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input 
                    value={recipientName} 
                    onChange={(e) => setRecipientName(e.target.value)} 
                    placeholder="z.B. Mama, Papa, Lisa..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Notizen (optional)</Label>
                  <Input 
                    value={recipientNotes} 
                    onChange={(e) => setRecipientNotes(e.target.value)} 
                    placeholder="z.B. Geburtstag, Interessen..."
                  />
                </div>
                <Button onClick={addRecipient} className="w-full">Hinzufügen</Button>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={addIdeaOpen} onOpenChange={(open) => {
            setAddIdeaOpen(open);
            if (!open) resetIdeaForm();
          }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1 h-7 px-2 text-xs bg-gradient-to-r from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700">
                <Plus className="w-3 h-3" />
                <span className="hidden sm:inline">Idee</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
              <DialogHeader>
                <DialogTitle>Geschenkidee hinzufügen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Für wen?</Label>
                  <Select value={selectedRecipientForIdea || ''} onValueChange={setSelectedRecipientForIdea}>
                    <SelectTrigger>
                      <SelectValue placeholder="Person wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {recipients.map(r => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Geschenk</Label>
                  <Input 
                    value={ideaTitle} 
                    onChange={(e) => setIdeaTitle(e.target.value)} 
                    placeholder="z.B. Buch, Parfum..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Beschreibung (optional)</Label>
                  <Input 
                    value={ideaDescription} 
                    onChange={(e) => setIdeaDescription(e.target.value)} 
                    placeholder="z.B. Größe, Farbe..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Preis (€)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={ideaPrice} 
                      onChange={(e) => setIdeaPrice(e.target.value)} 
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Link (optional)</Label>
                    <Input 
                      value={ideaUrl} 
                      onChange={(e) => setIdeaUrl(e.target.value)} 
                      placeholder="https://..."
                    />
                  </div>
                </div>
                <Button onClick={addIdea} className="w-full" disabled={!selectedRecipientForIdea || !ideaTitle.trim()}>
                  Hinzufügen
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-pink-500/20 shrink-0">
                <Gift className="w-3.5 h-3.5 text-pink-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Offen</p>
                <p className="text-lg font-bold">{openIdeas}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-500/20 shrink-0">
                <Euro className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Budget</p>
                <p className="text-lg font-bold">{totalBudget.toLocaleString('de-DE')}€</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
          <CardContent className="p-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 shrink-0">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Ausgegeben</p>
                <p className="text-lg font-bold">{totalSpent.toLocaleString('de-DE')}€</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recipients List */}
      {recipients.length === 0 ? (
        <Card className="border-border/50 border-dashed">
          <CardContent className="p-6 text-center">
            <User className="w-8 h-8 mx-auto text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">Noch keine Personen hinzugefügt</p>
            <Button 
              variant="link" 
              className="text-xs mt-1"
              onClick={() => setAddRecipientOpen(true)}
            >
              Erste Person hinzufügen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {recipients.map(recipient => {
            const recipientIdeas = getIdeasForRecipient(recipient.id);
            const openCount = recipientIdeas.filter(i => !i.purchased).length;
            const isExpanded = expandedRecipients.has(recipient.id);
            
            return (
              <Collapsible 
                key={recipient.id} 
                open={isExpanded} 
                onOpenChange={() => toggleRecipient(recipient.id)}
              >
                <Card className="border-border/50 overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <button className="w-full p-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500/20 to-rose-500/20 shrink-0">
                          <User className="w-4 h-4 text-pink-500" />
                        </div>
                        <div className="text-left min-w-0">
                          <div className="font-medium truncate">{recipient.name}</div>
                          {recipient.notes && (
                            <div className="text-xs text-muted-foreground truncate">{recipient.notes}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {openCount > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {openCount} offen
                          </Badge>
                        )}
                        <ChevronDown className={cn(
                          "w-4 h-4 text-muted-foreground transition-transform",
                          isExpanded && "rotate-180"
                        )} />
                      </div>
                    </button>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-3 pb-3 space-y-2 border-t border-border/50 pt-2">
                      {recipientIdeas.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-2">
                          Keine Geschenkideen
                        </p>
                      ) : (
                        recipientIdeas.map(idea => (
                          <GiftIdeaCard 
                            key={idea.id} 
                            idea={idea} 
                            accounts={accounts}
                            onToggle={togglePurchased}
                            onDelete={deleteIdea}
                          />
                        ))
                      )}
                      <div className="flex gap-2 pt-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 h-7 text-xs"
                          onClick={() => openAddIdea(recipient.id)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Idee hinzufügen
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs text-destructive hover:text-destructive"
                          onClick={() => deleteRecipient(recipient.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Sub-component for gift idea cards
function GiftIdeaCard({ 
  idea, 
  accounts, 
  onToggle, 
  onDelete 
}: { 
  idea: GiftIdea; 
  accounts: Account[];
  onToggle: (idea: GiftIdea, accountId?: string) => Promise<boolean>;
  onDelete: (id: string) => void;
}) {
  const [showAccountSelect, setShowAccountSelect] = useState(false);

  const handleCheckChange = async () => {
    if (!idea.purchased && accounts.length > 0 && idea.price) {
      setShowAccountSelect(true);
    } else {
      await onToggle(idea);
    }
  };

  const handleAccountSelect = async (accountId: string) => {
    await onToggle(idea, accountId);
    setShowAccountSelect(false);
  };

  return (
    <div className={cn(
      "p-2 rounded-lg border transition-all",
      idea.purchased 
        ? "bg-muted/30 border-border/30" 
        : "bg-card border-border/50"
    )}>
      <div className="flex items-start gap-2">
        <Checkbox 
          checked={idea.purchased}
          onCheckedChange={handleCheckChange}
          className="mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className={cn(
            "font-medium text-sm truncate",
            idea.purchased && "line-through text-muted-foreground"
          )}>
            {idea.title}
          </div>
          {idea.description && (
            <div className="text-xs text-muted-foreground truncate">{idea.description}</div>
          )}
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {idea.price && (
              <Badge variant={idea.purchased ? "secondary" : "outline"} className="text-xs">
                {idea.price.toLocaleString('de-DE')}€
              </Badge>
            )}
            {idea.url && (
              <a 
                href={idea.url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-0.5 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                Link <ExternalLink className="w-2.5 h-2.5" />
              </a>
            )}
            {idea.purchased && idea.purchased_date && (
              <span className="text-xs text-muted-foreground">
                Gekauft: {format(new Date(idea.purchased_date), 'dd.MM.yy', { locale: de })}
              </span>
            )}
          </div>
          
          {showAccountSelect && (
            <div className="mt-2 p-2 bg-muted/50 rounded-lg space-y-2">
              <p className="text-xs font-medium">Von welchem Konto?</p>
              <div className="flex flex-wrap gap-1">
                {accounts.map(account => (
                  <Button 
                    key={account.id}
                    variant="outline"
                    size="sm"
                    className="h-6 text-xs px-2"
                    onClick={() => handleAccountSelect(account.id)}
                  >
                    {account.name}
                  </Button>
                ))}
                <Button 
                  variant="ghost"
                  size="sm"
                  className="h-6 text-xs px-2"
                  onClick={() => {
                    onToggle(idea);
                    setShowAccountSelect(false);
                  }}
                >
                  Ohne Konto
                </Button>
              </div>
            </div>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive shrink-0"
          onClick={() => onDelete(idea.id)}
        >
          <Trash2 className="w-3 h-3" />
        </Button>
      </div>
    </div>
  );
}
