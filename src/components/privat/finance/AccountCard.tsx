import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Banknote,
  Coins,
  Landmark,
  TrendingUp,
  Bitcoin,
  Edit,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { getSupabase } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Account {
  id: string;
  name: string;
  account_type: string;
  balance: number;
}

interface AccountCardProps {
  account: Account;
  onUpdated: () => void;
}

const typeIcons: Record<string, React.ElementType> = {
  bank: Landmark,
  cash_bills: Banknote,
  cash_coins: Coins,
  crypto: Bitcoin,
  stocks: TrendingUp,
};

const typeLabels: Record<string, string> = {
  bank: 'Bankkonto',
  cash_bills: 'Bargeld (Scheine)',
  cash_coins: 'Bargeld (Münzen)',
  crypto: 'Krypto',
  stocks: 'Aktien/ETFs',
};

export function AccountCard({ account, onUpdated }: AccountCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [newBalance, setNewBalance] = useState(account.balance.toString());
  const [loading, setLoading] = useState(false);

  const Icon = typeIcons[account.account_type] || Landmark;

  const handleUpdateBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const supabase = getSupabase();

    const { error } = await supabase
      .from('accounts')
      .update({ balance: parseFloat(newBalance) || 0 })
      .eq('id', account.id);

    if (error) {
      toast.error('Fehler beim Aktualisieren');
    } else {
      toast.success('Kontostand aktualisiert');
      setEditOpen(false);
      onUpdated();
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!confirm(`Möchtest du "${account.name}" wirklich löschen?`)) return;

    const supabase = getSupabase();
    const { error } = await supabase.from('accounts').delete().eq('id', account.id);

    if (error) {
      toast.error('Fehler beim Löschen');
    } else {
      toast.success('Konto gelöscht');
      onUpdated();
    }
  };

  return (
    <Card className="glass-card border-border/50 group">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/20">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base">{account.name}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {typeLabels[account.account_type] || account.account_type}
            </p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <Edit className="w-4 h-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Kontostand bearbeiten</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleUpdateBalance} className="space-y-4">
                <div className="space-y-2">
                  <Label>Neuer Kontostand (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newBalance}
                    onChange={(e) => setNewBalance(e.target.value)}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  Speichern
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive"
            onClick={handleDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          className={cn(
            'text-2xl font-bold',
            account.balance >= 0 ? 'text-success' : 'text-destructive'
          )}
        >
          {account.balance.toLocaleString('de-DE', {
            style: 'currency',
            currency: 'EUR',
          })}
        </div>
      </CardContent>
    </Card>
  );
}
