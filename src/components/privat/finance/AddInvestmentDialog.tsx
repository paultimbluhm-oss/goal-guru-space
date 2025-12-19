import { useState, useEffect } from 'react';
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
import { Plus, Search, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getSupabase } from '@/hooks/useAuth';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AddInvestmentDialogProps {
  onInvestmentAdded: () => void;
}

interface SearchResult {
  symbol: string;
  name: string;
  type?: string;
  price?: number;
}

const investmentTypes = [
  { value: 'etf', label: 'ETF' },
  { value: 'stock', label: 'Aktie' },
  { value: 'crypto', label: 'Kryptowährung' },
];

const currencies = [
  { value: 'EUR', label: '€ Euro' },
  { value: 'USD', label: '$ US-Dollar' },
];

export function AddInvestmentDialog({ onInvestmentAdded }: AddInvestmentDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [investmentType, setInvestmentType] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<SearchResult | null>(null);
  const [quantity, setQuantity] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);

  // Search for assets when query changes
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 2 || !investmentType) {
      setSearchResults([]);
      return;
    }

    const searchAssets = async () => {
      setSearching(true);
      try {
        if (investmentType === 'crypto') {
          // Search CoinGecko
          const res = await fetch(
            `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(searchQuery)}`
          );
          const data = await res.json();
          const results: SearchResult[] = (data.coins || []).slice(0, 8).map((coin: any) => ({
            symbol: coin.id,
            name: coin.name,
            type: coin.symbol?.toUpperCase(),
          }));
          setSearchResults(results);
        } else {
          // Search stocks/ETFs via edge function
          const supabaseClient = getSupabase();
          const { data, error } = await supabaseClient.functions.invoke('search-stocks', {
            body: { query: searchQuery },
          });
          if (!error && data?.results) {
            setSearchResults(data.results);
          }
        }
      } catch (error) {
        console.error('Search error:', error);
      }
      setSearching(false);
    };

    const debounce = setTimeout(searchAssets, 500);
    return () => clearTimeout(debounce);
  }, [searchQuery, investmentType]);

  // Fetch current price when asset is selected
  useEffect(() => {
    if (!selectedAsset) return;

    const fetchPrice = async () => {
      try {
        if (investmentType === 'crypto') {
          // CoinGecko uses 'eur' or 'usd'
          const vsCurrency = currency.toLowerCase();
          const res = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=${selectedAsset.symbol}&vs_currencies=${vsCurrency}`
          );
          const data = await res.json();
          const price = data[selectedAsset.symbol]?.[vsCurrency];
          if (price) {
            setSelectedAsset((prev) => prev ? { ...prev, price } : null);
          }
        } else {
          const supabaseClient = getSupabase();
          const { data, error } = await supabaseClient.functions.invoke('get-stock-price', {
            body: { symbol: selectedAsset.symbol, targetCurrency: currency },
          });
          if (!error && data?.price) {
            setSelectedAsset((prev) => prev ? { ...prev, price: data.price } : null);
          }
        }
      } catch (error) {
        console.error('Price fetch error:', error);
      }
    };

    fetchPrice();
  }, [selectedAsset?.symbol, investmentType, currency]);

  const handleSelectAsset = (result: SearchResult) => {
    setSelectedAsset(result);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedAsset || !investmentType || !quantity || !purchasePrice) return;

    setLoading(true);
    const supabaseClient = getSupabase();

    const { error } = await supabaseClient.from('investments').insert({
      user_id: user.id,
      name: selectedAsset.name,
      symbol: selectedAsset.symbol,
      investment_type: investmentType,
      quantity: parseFloat(quantity),
      purchase_price: parseFloat(purchasePrice),
      currency: currency,
    });

    if (error) {
      toast.error('Fehler beim Hinzufügen');
      console.error(error);
    } else {
      toast.success('Investment hinzugefügt');
      setOpen(false);
      resetForm();
      onInvestmentAdded();
    }
    setLoading(false);
  };

  const resetForm = () => {
    setInvestmentType('');
    setCurrency('EUR');
    setSearchQuery('');
    setSearchResults([]);
    setSelectedAsset(null);
    setQuantity('');
    setPurchasePrice('');
  };

  const currencySymbol = currency === 'EUR' ? '€' : '$';

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="w-4 h-4" />
          Investment
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Neues Investment</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Typ</Label>
              <Select value={investmentType} onValueChange={(val) => {
                setInvestmentType(val);
                setSelectedAsset(null);
                setSearchQuery('');
                setSearchResults([]);
              }} required>
                <SelectTrigger>
                  <SelectValue placeholder="Typ wählen" />
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
              <Label>Währung</Label>
              <Select value={currency} onValueChange={(val) => {
                setCurrency(val);
                // Re-fetch price when currency changes
                if (selectedAsset) {
                  setSelectedAsset({ ...selectedAsset, price: undefined });
                }
              }} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currencies.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {investmentType && (
            <div className="space-y-2">
              <Label>
                {investmentType === 'crypto' ? 'Kryptowährung suchen' : 'Aktie/ETF suchen'}
              </Label>
              
              {selectedAsset ? (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold flex items-center gap-2">
                        <Check className="w-4 h-4 text-primary" />
                        {selectedAsset.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {selectedAsset.type || selectedAsset.symbol}
                      </div>
                      {selectedAsset.price && (
                        <div className="text-sm font-medium text-primary mt-1">
                          Aktueller Kurs: {selectedAsset.price.toLocaleString('de-DE', {
                            style: 'currency',
                            currency: currency,
                          })}
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedAsset(null)}
                    >
                      Ändern
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={
                      investmentType === 'crypto'
                        ? 'z.B. Bitcoin, Ethereum...'
                        : 'z.B. Apple, MSCI World...'
                    }
                    className="pl-9"
                  />
                  {searching && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                  )}
                  
                  {searchResults.length > 0 && (
                    <div className="absolute z-50 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
                      {searchResults.map((result, index) => (
                        <button
                          key={`${result.symbol}-${index}`}
                          type="button"
                          onClick={() => handleSelectAsset(result)}
                          className={cn(
                            'w-full px-3 py-2 text-left hover:bg-accent transition-colors',
                            index !== searchResults.length - 1 && 'border-b border-border/50'
                          )}
                        >
                          <div className="font-medium">{result.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {result.type || result.symbol}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {selectedAsset && (
            <>
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
                  <Label htmlFor="price">Kaufpreis gesamt ({currencySymbol})</Label>
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

              {quantity && purchasePrice && selectedAsset.price && (
                <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Aktueller Wert:</span>
                    <span className="font-medium">
                      {(parseFloat(quantity) * selectedAsset.price).toLocaleString('de-DE', {
                        style: 'currency',
                        currency: currency,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Differenz:</span>
                    <span className={cn(
                      'font-medium',
                      parseFloat(quantity) * selectedAsset.price - parseFloat(purchasePrice) >= 0
                        ? 'text-success'
                        : 'text-destructive'
                    )}>
                      {(parseFloat(quantity) * selectedAsset.price - parseFloat(purchasePrice)).toLocaleString('de-DE', {
                        style: 'currency',
                        currency: currency,
                        signDisplay: 'always',
                      })}
                      {' '}
                      ({(((parseFloat(quantity) * selectedAsset.price - parseFloat(purchasePrice)) / parseFloat(purchasePrice)) * 100).toFixed(2)}%)
                    </span>
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Füge hinzu...' : 'Hinzufügen'}
              </Button>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
