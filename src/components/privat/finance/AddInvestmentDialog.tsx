import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { getSupabase } from '@/hooks/useAuth';
import { useAuth } from '@/hooks/useAuth';

interface AddInvestmentDialogProps {
  onInvestmentAdded: () => void;
}

const investmentTypes = [
  { value: 'etf', label: 'ETF' },
  { value: 'stock', label: 'Aktie' },
  { value: 'crypto', label: 'Kryptowährung' },
];

export function AddInvestmentDialog({ onInvestmentAdded }: AddInvestmentDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');
  const [investmentType, setInvestmentType] = useState('');
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !investmentType || !quantity || !purchasePrice) return;

    setLoading(true);
    const supabase = getSupabase();

    const { error } = await supabase.from('investments').insert({
      user_id: user.id,
      name,
      symbol: symbol.toUpperCase() || null,
      investment_type: investmentType,
      quantity: parseFloat(quantity),
      purchase_price: parseFloat(purchasePrice),
    });

    if (error) {
      toast.error('Fehler beim Hinzufügen');
      console.error(error);
    } else {
      toast.success('Investment hinzugefügt');
      setOpen(false);
      setName('');
      setSymbol('');
      setInvestmentType('');
      setQuantity('');
      setPurchasePrice('');
      onInvestmentAdded();
    }
    setLoading(false);
  };

  const getSymbolPlaceholder = () => {
    switch (investmentType) {
      case 'crypto':
        return 'z.B. bitcoin, ethereum';
      case 'etf':
      case 'stock':
        return 'z.B. AAPL, MSFT';
      default:
        return 'Symbol/ID';
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Investment hinzufügen
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neues Investment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Typ</Label>
            <Select value={investmentType} onValueChange={setInvestmentType} required>
              <SelectTrigger>
                <SelectValue placeholder="Typ auswählen" />
              </SelectTrigger>
              <SelectContent>
                {investmentTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Bitcoin, Apple Inc."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="symbol">Symbol/ID (für Live-Kurse)</Label>
            <Input
              id="symbol"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              placeholder={getSymbolPlaceholder()}
            />
            {investmentType === 'crypto' && (
              <p className="text-xs text-muted-foreground">
                Verwende den CoinGecko-ID (z.B. bitcoin, ethereum, solana)
              </p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Menge</Label>
              <Input
                id="quantity"
                type="number"
                step="0.00000001"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Kaufpreis (€)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Füge hinzu...' : 'Hinzufügen'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
