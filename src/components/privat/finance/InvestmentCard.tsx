import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { getSupabase } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface Investment {
  id: string;
  name: string;
  symbol: string | null;
  investment_type: string;
  quantity: number;
  purchase_price: number;
  currency: string;
}

interface InvestmentCardProps {
  investment: Investment;
  currentPrice: number | null;
  loading: boolean;
  onDeleted: () => void;
  onRefresh: () => void;
}

export function InvestmentCard({
  investment,
  currentPrice,
  loading,
  onDeleted,
  onRefresh,
}: InvestmentCardProps) {
  const [deleting, setDeleting] = useState(false);

  const currency = investment.currency || 'EUR';
  const purchaseValue = investment.purchase_price;
  const currentValue = currentPrice ? investment.quantity * currentPrice : null;
  const profitLoss = currentValue ? currentValue - purchaseValue : null;
  const profitLossPercent = profitLoss && purchaseValue ? (profitLoss / purchaseValue) * 100 : null;
  const isProfit = profitLoss !== null && profitLoss >= 0;

  const handleDelete = async () => {
    if (!confirm(`"${investment.name}" wirklich löschen?`)) return;
    setDeleting(true);

    const supabase = getSupabase();
    const { error } = await supabase.from('investments').delete().eq('id', investment.id);

    if (error) {
      toast.error('Fehler beim Löschen');
    } else {
      toast.success('Investment gelöscht');
      onDeleted();
    }
    setDeleting(false);
  };

  const typeLabel =
    investment.investment_type === 'crypto'
      ? 'Krypto'
      : investment.investment_type === 'etf'
      ? 'ETF'
      : 'Aktie';

  const currencyLabel = currency === 'USD' ? '($)' : '';

  return (
    <Card className="glass-card border-border/50 group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          {/* Left: Name and details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold truncate">{investment.name}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary shrink-0">
                {typeLabel}
              </span>
              {currency === 'USD' && (
                <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground shrink-0">
                  USD
                </span>
              )}
            </div>
            {investment.symbol && (
              <p className="text-xs text-muted-foreground uppercase">{investment.symbol}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {investment.quantity.toLocaleString('de-DE', { maximumFractionDigits: 8 })} Stück
            </p>
          </div>

          {/* Right: Current value and change */}
          <div className="text-right shrink-0">
            {loading ? (
              <div className="flex items-center justify-end gap-2">
                <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
                <span className="text-sm text-muted-foreground">Laden...</span>
              </div>
            ) : currentValue !== null ? (
              <>
                {/* Current value - prominent */}
                <div className="text-xl font-bold">
                  {currentValue.toLocaleString('de-DE', {
                    style: 'currency',
                    currency: currency,
                  })}
                </div>
                
                {/* Profit/Loss percentage and amount */}
                <div
                  className={cn(
                    'flex items-center justify-end gap-1 text-sm font-medium',
                    isProfit ? 'text-success' : 'text-destructive'
                  )}
                >
                  {isProfit ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  <span>
                    {profitLossPercent !== null && (
                      <>
                        {profitLossPercent >= 0 ? '+' : ''}
                        {profitLossPercent.toFixed(2)}%
                      </>
                    )}
                  </span>
                  <span className="text-muted-foreground">
                    ({profitLoss?.toLocaleString('de-DE', {
                      style: 'currency',
                      currency: currency,
                      signDisplay: 'always',
                    })})
                  </span>
                </div>
                
                {/* Purchase price - smaller */}
                <div className="text-xs text-muted-foreground mt-1">
                  Kaufpreis: {purchaseValue.toLocaleString('de-DE', {
                    style: 'currency',
                    currency: currency,
                  })}
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Kaufpreis:{' '}
                {purchaseValue.toLocaleString('de-DE', {
                  style: 'currency',
                  currency: currency,
                })}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={onRefresh}
              disabled={loading}
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
