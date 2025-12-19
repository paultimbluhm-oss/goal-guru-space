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

  const purchaseValue = investment.quantity * investment.purchase_price;
  const currentValue = currentPrice ? investment.quantity * currentPrice : null;
  const profitLoss = currentValue ? currentValue - purchaseValue : null;
  const profitLossPercent = profitLoss ? (profitLoss / purchaseValue) * 100 : null;

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

  return (
    <Card className="glass-card border-border/50 group">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{investment.name}</span>
              <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary">
                {typeLabel}
              </span>
            </div>
            {investment.symbol && (
              <p className="text-xs text-muted-foreground uppercase">{investment.symbol}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              {investment.quantity.toLocaleString('de-DE')} Stück
            </p>
          </div>

          <div className="text-right">
            {loading ? (
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full" />
            ) : currentValue !== null ? (
              <>
                <div className="text-lg font-bold">
                  {currentValue.toLocaleString('de-DE', {
                    style: 'currency',
                    currency: 'EUR',
                  })}
                </div>
                <div
                  className={cn(
                    'flex items-center gap-1 text-sm',
                    profitLoss && profitLoss >= 0 ? 'text-success' : 'text-destructive'
                  )}
                >
                  {profitLoss && profitLoss >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {profitLoss?.toLocaleString('de-DE', {
                    style: 'currency',
                    currency: 'EUR',
                    signDisplay: 'always',
                  })}{' '}
                  ({profitLossPercent?.toFixed(2)}%)
                </div>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Kaufwert:{' '}
                {purchaseValue.toLocaleString('de-DE', {
                  style: 'currency',
                  currency: 'EUR',
                })}
              </div>
            )}
          </div>

          <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
