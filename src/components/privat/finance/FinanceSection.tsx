import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wallet, TrendingUp, ArrowUpDown, RefreshCw, Trash2 } from 'lucide-react';
import { useAuth, getSupabase } from '@/hooks/useAuth';
import { AccountCard } from './AccountCard';
import { AddAccountDialog } from './AddAccountDialog';
import { AddInvestmentDialog } from './AddInvestmentDialog';
import { AddTransactionDialog } from './AddTransactionDialog';
import { InvestmentCard } from './InvestmentCard';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

import { toast } from 'sonner';

interface Account {
  id: string;
  name: string;
  account_type: string;
  balance: number;
}

interface Investment {
  id: string;
  name: string;
  symbol: string | null;
  investment_type: string;
  quantity: number;
  purchase_price: number;
}

interface Transaction {
  id: string;
  account_id: string;
  transaction_type: string;
  amount: number;
  description: string | null;
  category: string | null;
  date: string;
}

interface FinanceSectionProps {
  onBack: () => void;
}

export function FinanceSection({ onBack }: FinanceSectionProps) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loadingPrices, setLoadingPrices] = useState<Record<string, boolean>>({});

  const fetchData = async () => {
    if (!user) return;
    const supabase = getSupabase();

    const [accountsRes, investmentsRes, transactionsRes] = await Promise.all([
      supabase.from('accounts').select('*').eq('user_id', user.id).order('name'),
      supabase.from('investments').select('*').eq('user_id', user.id).order('name'),
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(20),
    ]);

    if (accountsRes.data) setAccounts(accountsRes.data);
    if (investmentsRes.data) {
      setInvestments(investmentsRes.data);
      fetchPrices(investmentsRes.data);
    }
    if (transactionsRes.data) setTransactions(transactionsRes.data);
  };

  const fetchPrices = async (invs: Investment[]) => {
    // Fetch crypto prices from CoinGecko
    const cryptoInvs = invs.filter((i) => i.investment_type === 'crypto' && i.symbol);
    if (cryptoInvs.length > 0) {
      const ids = cryptoInvs.map((i) => i.symbol?.toLowerCase()).join(',');
      setLoadingPrices((prev) => {
        const newState = { ...prev };
        cryptoInvs.forEach((i) => (newState[i.id] = true));
        return newState;
      });

      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=eur`
        );
        const data = await res.json();

        const newPrices: Record<string, number> = {};
        cryptoInvs.forEach((inv) => {
          const symbol = inv.symbol?.toLowerCase();
          if (symbol && data[symbol]?.eur) {
            newPrices[inv.id] = data[symbol].eur;
          }
        });
        setPrices((prev) => ({ ...prev, ...newPrices }));
      } catch (error) {
        console.error('Error fetching crypto prices:', error);
      }

      setLoadingPrices((prev) => {
        const newState = { ...prev };
        cryptoInvs.forEach((i) => (newState[i.id] = false));
        return newState;
      });
    }

    // Fetch ETF/stock prices via Edge Function
    const stockInvs = invs.filter(
      (i) => (i.investment_type === 'etf' || i.investment_type === 'stock') && i.symbol
    );
    
    for (const inv of stockInvs) {
      if (!inv.symbol) continue;
      setLoadingPrices((prev) => ({ ...prev, [inv.id]: true }));
      try {
        const supabaseClient = getSupabase();
        const { data, error } = await supabaseClient.functions.invoke('get-stock-price', {
          body: { symbol: inv.symbol },
        });
        if (!error && data?.price) {
          setPrices((prev) => ({ ...prev, [inv.id]: data.price }));
        }
      } catch (error) {
        console.error('Error fetching stock price:', error);
      }
      setLoadingPrices((prev) => ({ ...prev, [inv.id]: false }));
    }
  };

  const refreshPrice = async (investment: Investment) => {
    if (!investment.symbol) return;
    
    setLoadingPrices((prev) => ({ ...prev, [investment.id]: true }));
    
    try {
      if (investment.investment_type === 'crypto') {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${investment.symbol.toLowerCase()}&vs_currencies=eur`
        );
        const data = await res.json();
        const price = data[investment.symbol.toLowerCase()]?.eur;
        if (price) {
          setPrices((prev) => ({ ...prev, [investment.id]: price }));
        }
      } else {
        // ETF/Stock via Edge Function
        const supabaseClient = getSupabase();
        const { data, error } = await supabaseClient.functions.invoke('get-stock-price', {
          body: { symbol: investment.symbol },
        });
        if (!error && data?.price) {
          setPrices((prev) => ({ ...prev, [investment.id]: data.price }));
        }
      }
    } catch (error) {
      console.error('Error refreshing price:', error);
    }
    
    setLoadingPrices((prev) => ({ ...prev, [investment.id]: false }));
  };

  const deleteTransaction = async (id: string) => {
    if (!confirm('Transaktion wirklich löschen?')) return;
    
    const supabaseClient = getSupabase();
    const { error } = await supabaseClient.from('transactions').delete().eq('id', id);
    
    if (error) {
      toast.error('Fehler beim Löschen');
    } else {
      toast.success('Transaktion gelöscht');
      fetchData();
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
  const totalInvestments = investments.reduce((sum, inv) => {
    const price = prices[inv.id] || inv.purchase_price;
    return sum + inv.quantity * price;
  }, 0);

  const bankAccounts = accounts.filter((a) => a.account_type === 'bank');
  const cashBills = accounts.filter((a) => a.account_type === 'cash_bills');
  const cashCoins = accounts.filter((a) => a.account_type === 'cash_coins');
  const cryptoWallets = accounts.filter((a) => a.account_type === 'crypto');
  const stockAccounts = accounts.filter((a) => a.account_type === 'stocks');

  const cryptoInvestments = investments.filter((i) => i.investment_type === 'crypto');
  const stockInvestments = investments.filter(
    (i) => i.investment_type === 'etf' || i.investment_type === 'stock'
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/20">
              <Wallet className="w-6 h-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Finanzen</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <AddTransactionDialog accounts={accounts} onTransactionAdded={fetchData} />
          <AddInvestmentDialog onInvestmentAdded={fetchData} />
          <AddAccountDialog onAccountAdded={fetchData} />
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Gesamtvermögen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {(totalBalance + totalInvestments).toLocaleString('de-DE', {
                style: 'currency',
                currency: 'EUR',
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Konten & Bargeld
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalBalance.toLocaleString('de-DE', {
                style: 'currency',
                currency: 'EUR',
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Investments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalInvestments.toLocaleString('de-DE', {
                style: 'currency',
                currency: 'EUR',
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bank Accounts */}
      {bankAccounts.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Bankkonten</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.map((acc) => (
              <AccountCard key={acc.id} account={acc} onUpdated={fetchData} />
            ))}
          </div>
        </div>
      )}

      {/* Cash Bills */}
      {cashBills.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Bargeld (Scheine)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cashBills.map((acc) => (
              <AccountCard key={acc.id} account={acc} onUpdated={fetchData} />
            ))}
          </div>
        </div>
      )}

      {/* Cash Coins */}
      {cashCoins.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Bargeld (Münzen)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {cashCoins.map((acc) => (
              <AccountCard key={acc.id} account={acc} onUpdated={fetchData} />
            ))}
          </div>
        </div>
      )}

      {/* ETFs & Stocks */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Aktien & ETFs</h2>
        </div>
        {stockInvestments.length === 0 ? (
          <Card className="glass-card border-border/50">
            <CardContent className="py-8 text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Keine Aktien oder ETFs vorhanden</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {stockInvestments.map((inv) => (
              <InvestmentCard
                key={inv.id}
                investment={inv}
                currentPrice={prices[inv.id] || null}
                loading={loadingPrices[inv.id] || false}
                onDeleted={fetchData}
                onRefresh={() => refreshPrice(inv)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Crypto */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Kryptowährungen</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchPrices(cryptoInvestments)}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Kurse aktualisieren
          </Button>
        </div>
        {cryptoInvestments.length === 0 ? (
          <Card className="glass-card border-border/50">
            <CardContent className="py-8 text-center">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Keine Kryptowährungen vorhanden</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {cryptoInvestments.map((inv) => (
              <InvestmentCard
                key={inv.id}
                investment={inv}
                currentPrice={prices[inv.id] || null}
                loading={loadingPrices[inv.id] || false}
                onDeleted={fetchData}
                onRefresh={() => refreshPrice(inv)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Transactions */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ArrowUpDown className="w-5 h-5" />
          Letzte Transaktionen
        </h2>
        {transactions.length === 0 ? (
          <Card className="glass-card border-border/50">
            <CardContent className="py-8 text-center">
              <ArrowUpDown className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Keine Transaktionen vorhanden</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="glass-card border-border/50">
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {transactions.map((tx) => {
                  const account = accounts.find((a) => a.id === tx.account_id);
                  const isIncome = tx.transaction_type === 'income';
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-4 group">
                      <div className="flex-1">
                        <div className="font-medium">
                          {tx.description || tx.category || 'Transaktion'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {account?.name} • {format(new Date(tx.date), 'dd.MM.yyyy', { locale: de })}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'font-semibold',
                            isIncome ? 'text-success' : 'text-destructive'
                          )}
                        >
                          {isIncome ? '+' : '-'}
                          {tx.amount.toLocaleString('de-DE', {
                            style: 'currency',
                            currency: 'EUR',
                          })}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                          onClick={() => deleteTransaction(tx.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
