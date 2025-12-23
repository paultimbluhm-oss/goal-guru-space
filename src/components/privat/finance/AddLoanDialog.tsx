import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth, getSupabase } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { HandCoins, Plus } from 'lucide-react';

interface AddLoanDialogProps {
  onLoanAdded: () => void;
}

export function AddLoanDialog({ onLoanAdded }: AddLoanDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [loanType, setLoanType] = useState<'lent' | 'borrowed'>('lent');
  const [description, setDescription] = useState('');
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !personName || !amount) return;

    const supabase = getSupabase();
    const { error } = await supabase.from('loans').insert({
      user_id: user.id,
      person_name: personName.trim(),
      amount: parseFloat(amount),
      loan_type: loanType,
      description: description.trim() || null,
      loan_date: loanDate,
      due_date: dueDate || null,
    });

    if (error) {
      toast.error('Fehler beim Hinzufügen');
    } else {
      toast.success(loanType === 'lent' ? 'Verliehenes Geld hinzugefügt' : 'Geliehenes Geld hinzugefügt');
      setOpen(false);
      resetForm();
      onLoanAdded();
    }
  };

  const resetForm = () => {
    setPersonName('');
    setAmount('');
    setLoanType('lent');
    setDescription('');
    setLoanDate(new Date().toISOString().split('T')[0]);
    setDueDate('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <HandCoins className="w-4 h-4 mr-2" />
          Verliehen
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <HandCoins className="w-5 h-5" />
            Geld verliehen/geliehen
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Typ</Label>
            <Select value={loanType} onValueChange={(v) => setLoanType(v as 'lent' | 'borrowed')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lent">Ich habe verliehen</SelectItem>
                <SelectItem value="borrowed">Ich habe geliehen</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="personName">
              {loanType === 'lent' ? 'An wen verliehen?' : 'Von wem geliehen?'}
            </Label>
            <Input
              id="personName"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              placeholder="Name der Person"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Betrag (€)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="loanDate">Datum</Label>
              <Input
                id="loanDate"
                type="date"
                value={loanDate}
                onChange={(e) => setLoanDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Fällig am (optional)</Label>
              <Input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Wofür?"
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Abbrechen
            </Button>
            <Button type="submit">
              <Plus className="w-4 h-4 mr-2" />
              Hinzufügen
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}