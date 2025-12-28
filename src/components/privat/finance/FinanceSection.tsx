import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ArrowLeft, Wallet, TrendingUp, ArrowUpDown, RefreshCw, Trash2, ChevronDown, Banknote, Coins, Bitcoin, BarChart3 } from 'lucide-react';
import { useAuth, getSupabase } from '@/hooks/useAuth';
import { AccountCard } from './AccountCard';
import { AddAccountDialog } from './AddAccountDialog';
import { AddInvestmentDialog } from './AddInvestmentDialog';
import { AddTransactionDialog } from './AddTransactionDialog';
import { InvestmentCard } from './InvestmentCard';
import { LoansSection } from './LoansSection';
import { format, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

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
  currency: string;
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

interface BalanceHistory {
  date: string;
  total_balance: number;
  accounts_balance: number;
  investments_balance: number;
}

interface FinanceSectionProps {
  onBack: () => void;
}

export function FinanceSection({ onBack }: FinanceSectionProps) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistory[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loadingPrices, setLoadingPrices] = useState<Record<string, boolean>>({});
  
  // Collapsible states
  const [bankOpen, setBankOpen] = useState(false);
  const [cashBillsOpen, setCashBillsOpen] = useState(false);
  const [cashCoinsOpen, setCashCoinsOpen] = useState(false);
  const [stocksOpen, setStocksOpen] = useState(false);
  const [cryptoOpen, setCryptoOpen] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const supabase = getSupabase();

    const [accountsRes, investmentsRes, transactionsRes, historyRes] = await Promise.all([
      supabase.from('accounts').select('*').eq('user_id', user.id).order('name'),
      supabase.from('investments').select('*').eq('user_id', user.id).order('name'),
      supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(20),
      supabase
        .from('balance_history')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true }),
    ]);

    if (accountsRes.data) setAccounts(accountsRes.data);
    if (investmentsRes.data) {
      setInvestments(investmentsRes.data);
      fetchPrices(investmentsRes.data);
    }
    if (transactionsRes.data) setTransactions(transactionsRes.data);
    if (historyRes.data) setBalanceHistory(historyRes.data);
  };

  // Save today's balance to history
  const saveBalanceHistory = async (accountsBalance: number, investmentsBalance: number) => {
    if (!user) return;
    const supabase = getSupabase();
    const today = format(new Date(), 'yyyy-MM-dd');
    const totalBalance = accountsBalance + investmentsBalance;

    await supabase
      .from('balance_history')
      .upsert({
        user_id: user.id,
        date: today,
        total_balance: totalBalance,
        accounts_balance: accountsBalance,
        investments_balance: investmentsBalance,
      }, { onConflict: 'user_id,date' });

    // Refresh history
    const { data } = await supabase
      .from('balance_history')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: true });
    
    if (data) setBalanceHistory(data);
  };

  const fetchPrices = async (invs: Investment[]) => {
    const cryptoInvs = invs.filter((i) => i.investment_type === 'crypto' && i.symbol);
    const cryptoByEur = cryptoInvs.filter(i => i.currency === 'EUR' || !i.currency);
    const cryptoByUsd = cryptoInvs.filter(i => i.currency === 'USD');
    
    const fetchCryptoPrices = async (invList: Investment[], vsCurrency: string) => {
      if (invList.length === 0) return;
      const ids = invList.map((i) => i.symbol?.toLowerCase()).join(',');
      setLoadingPrices((prev) => {
        const newState = { ...prev };
        invList.forEach((i) => (newState[i.id] = true));
        return newState;
      });

      try {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vsCurrency}`
        );
        const data = await res.json();

        const newPrices: Record<string, number> = {};
        invList.forEach((inv) => {
          const symbol = inv.symbol?.toLowerCase();
          if (symbol && data[symbol]?.[vsCurrency]) {
            newPrices[inv.id] = data[symbol][vsCurrency];
          }
        });
        setPrices((prev) => ({ ...prev, ...newPrices }));
      } catch (error) {
        console.error('Error fetching crypto prices:', error);
      }

      setLoadingPrices((prev) => {
        const newState = { ...prev };
        invList.forEach((i) => (newState[i.id] = false));
        return newState;
      });
    };

    await Promise.all([
      fetchCryptoPrices(cryptoByEur, 'eur'),
      fetchCryptoPrices(cryptoByUsd, 'usd'),
    ]);

    const stockInvs = invs.filter(
      (i) => (i.investment_type === 'etf' || i.investment_type === 'stock') && i.symbol
    );
    
    for (const inv of stockInvs) {
      if (!inv.symbol) continue;
      setLoadingPrices((prev) => ({ ...prev, [inv.id]: true }));
      try {
        const supabaseClient = getSupabase();
        const { data, error } = await supabaseClient.functions.invoke('get-stock-price', {
          body: { symbol: inv.symbol, targetCurrency: inv.currency || 'EUR' },
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
    const currency = investment.currency || 'EUR';
    const vsCurrency = currency.toLowerCase();
    
    setLoadingPrices((prev) => ({ ...prev, [investment.id]: true }));
    
    try {
      if (investment.investment_type === 'crypto') {
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${investment.symbol.toLowerCase()}&vs_currencies=${vsCurrency}`
        );
        const data = await res.json();
        const price = data[investment.symbol.toLowerCase()]?.[vsCurrency];
        if (price) {
          setPrices((prev) => ({ ...prev, [investment.id]: price }));
        }
      } else {
        const supabaseClient = getSupabase();
        const { data, error } = await supabaseClient.functions.invoke('get-stock-price', {
          body: { symbol: investment.symbol, targetCurrency: currency },
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
    // If we have a current price, calculate current value (quantity * current price)
    // Otherwise use the purchase_price as total value (it's already the total, not per-unit)
    if (prices[inv.id]) {
      return sum + inv.quantity * prices[inv.id];
    }
    return sum + inv.purchase_price;
  }, 0);

  // Save balance when totals change
  useEffect(() => {
    if (accounts.length > 0 || investments.length > 0) {
      saveBalanceHistory(totalBalance, totalInvestments);
    }
  }, [totalBalance, totalInvestments]);

  const bankAccounts = accounts.filter((a) => a.account_type === 'bank');
  const cashBills = accounts.filter((a) => a.account_type === 'cash_bills');
  const cashCoins = accounts.filter((a) => a.account_type === 'cash_coins');
  const cryptoInvestments = investments.filter((i) => i.investment_type === 'crypto');
  const stockInvestments = investments.filter(
    (i) => i.investment_type === 'etf' || i.investment_type === 'stock'
  );

  // Prepare chart data
  const last90Days = balanceHistory.slice(-90);
  const allTimeData = balanceHistory;

  const formatCurrency = (value: number) => 
    value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card/95 backdrop-blur border border-border rounded-lg p-3 shadow-xl">
          <p className="text-xs text-muted-foreground mb-1">
            {format(new Date(label), 'dd. MMM yyyy', { locale: de })}
          </p>
          <p className="text-sm font-bold text-primary">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CollapsibleSection = ({ 
    title, 
    icon: Icon, 
    color,
    open, 
    onOpenChange, 
    total,
    children,
    count
  }: { 
    title: string; 
    icon: any; 
    color: string;
    open: boolean; 
    onOpenChange: (open: boolean) => void;
    total: number;
    children: React.ReactNode;
    count: number;
  }) => (
    <Collapsible open={open} onOpenChange={onOpenChange}>
      <CollapsibleTrigger asChild>
        <div className={`group relative overflow-hidden rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 p-2.5 sm:p-3 cursor-pointer hover:border-primary/30 transition-all`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-5`} />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${color}`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{title}</h3>
                <p className="text-[10px] text-muted-foreground">{count} Einträge</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm sm:text-base">{formatCurrency(total)}</span>
              <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform duration-200",
                open && "rotate-180"
              )} />
            </div>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Compact Mobile Header */}
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-card via-card to-secondary/30 border border-border/50 p-3 sm:p-5">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl" />
        
        <div className="relative z-10">
          {/* Title Row */}
          <div className="flex items-center gap-2 mb-3">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8 shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/5 border border-amber-500/20">
              <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg sm:text-xl font-bold truncate">Finanzen</h1>
            </div>
          </div>

          {/* Main Total - Prominent */}
          <div className="bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg p-3 border border-primary/20 mb-3">
            <p className="text-[10px] sm:text-xs text-muted-foreground">Gesamtvermögen</p>
            <p className="text-xl sm:text-2xl font-bold text-primary">{formatCurrency(totalBalance + totalInvestments)}</p>
          </div>

          {/* Secondary Stats - Compact Row */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-secondary/30 rounded-lg p-2 sm:p-3 border border-border/50">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Konten</p>
              <p className="text-sm sm:text-lg font-bold">{formatCurrency(totalBalance)}</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-2 sm:p-3 border border-border/50">
              <p className="text-[10px] sm:text-xs text-muted-foreground">Investments</p>
              <p className="text-sm sm:text-lg font-bold">{formatCurrency(totalInvestments)}</p>
            </div>
          </div>

          {/* Action Buttons - Integrated */}
          <div className="flex gap-1.5 mt-3 flex-wrap">
            <AddTransactionDialog accounts={accounts} onTransactionAdded={fetchData} />
            <AddInvestmentDialog onInvestmentAdded={fetchData} />
            <AddAccountDialog onAccountAdded={fetchData} />
          </div>
        </div>
      </div>

      {/* Charts - Mobile Optimized */}
      {balanceHistory.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
          {/* 90-Day Chart */}
          <Card className="glass-card overflow-hidden">
            <CardHeader className="p-2 sm:p-3 pb-1">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5 text-primary" />
                Letzte {Math.min(90, balanceHistory.length)} Tage
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <div className="h-32 sm:h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={last90Days} margin={{ top: 5, right: 10, left: 5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradient90" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => format(new Date(value), 'dd.MM', { locale: de })}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `${(value/1000).toFixed(1)}k`}
                      width={35}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="total_balance" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      fill="url(#gradient90)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* All-Time Chart */}
          <Card className="glass-card overflow-hidden">
            <CardHeader className="p-2 sm:p-3 pb-1">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-accent" />
                Gesamtverlauf ({allTimeData.length} Einträge)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pb-2">
              <div className="h-32 sm:h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={allTimeData} margin={{ top: 5, right: 10, left: 5, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gradientAll" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--accent))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => format(new Date(value), 'dd.MM', { locale: de })}
                      interval="preserveStartEnd"
                    />
                    <YAxis 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(value) => `${(value/1000).toFixed(1)}k`}
                      width={35}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area 
                      type="monotone" 
                      dataKey="total_balance" 
                      stroke="hsl(var(--accent))" 
                      strokeWidth={2}
                      fill="url(#gradientAll)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Collapsible Account Sections */}
      {bankAccounts.length > 0 && (
        <CollapsibleSection
          title="Bankkonten"
          icon={Banknote}
          color="from-blue-500 to-indigo-600"
          open={bankOpen}
          onOpenChange={setBankOpen}
          total={bankAccounts.reduce((sum, a) => sum + (a.balance || 0), 0)}
          count={bankAccounts.length}
        >
          {bankAccounts.map((acc) => (
            <AccountCard key={acc.id} account={acc} onUpdated={fetchData} />
          ))}
        </CollapsibleSection>
      )}

      {/* Loans Section */}
      <LoansSection onRefresh={fetchData} />

      {cashBills.length > 0 && (
        <CollapsibleSection
          title="Bargeld (Scheine)"
          icon={Banknote}
          color="from-green-500 to-emerald-600"
          open={cashBillsOpen}
          onOpenChange={setCashBillsOpen}
          total={cashBills.reduce((sum, a) => sum + (a.balance || 0), 0)}
          count={cashBills.length}
        >
          {cashBills.map((acc) => (
            <AccountCard key={acc.id} account={acc} onUpdated={fetchData} />
          ))}
        </CollapsibleSection>
      )}

      {cashCoins.length > 0 && (
        <CollapsibleSection
          title="Bargeld (Münzen)"
          icon={Coins}
          color="from-yellow-500 to-amber-600"
          open={cashCoinsOpen}
          onOpenChange={setCashCoinsOpen}
          total={cashCoins.reduce((sum, a) => sum + (a.balance || 0), 0)}
          count={cashCoins.length}
        >
          {cashCoins.map((acc) => (
            <AccountCard key={acc.id} account={acc} onUpdated={fetchData} />
          ))}
        </CollapsibleSection>
      )}

      {/* Stocks & ETFs */}
      <Collapsible open={stocksOpen} onOpenChange={setStocksOpen}>
        <CollapsibleTrigger asChild>
          <div className="group relative overflow-hidden rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 p-2.5 sm:p-3 cursor-pointer hover:border-primary/30 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 opacity-5" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                  <TrendingUp className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Aktien & ETFs</h3>
                  <p className="text-[10px] text-muted-foreground">{stockInvestments.length} Positionen</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base">
                  {formatCurrency(stockInvestments.reduce((sum, inv) => {
                    if (prices[inv.id]) {
                      return sum + inv.quantity * prices[inv.id];
                    }
                    return sum + inv.purchase_price;
                  }, 0))}
                </span>
                <ChevronDown className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-200",
                  stocksOpen && "rotate-180"
                )} />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-1.5">
          {stockInvestments.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-4 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground text-xs">Keine Aktien oder ETFs</p>
              </CardContent>
            </Card>
          ) : (
            stockInvestments.map((inv) => (
              <InvestmentCard
                key={inv.id}
                investment={inv}
                currentPrice={prices[inv.id] || null}
                loading={loadingPrices[inv.id] || false}
                onDeleted={fetchData}
                onRefresh={() => refreshPrice(inv)}
              />
            ))
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Crypto */}
      <Collapsible open={cryptoOpen} onOpenChange={setCryptoOpen}>
        <CollapsibleTrigger asChild>
          <div className="group relative overflow-hidden rounded-lg bg-card/80 backdrop-blur-sm border border-border/50 p-2.5 sm:p-3 cursor-pointer hover:border-primary/30 transition-all">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-amber-600 opacity-5" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600">
                  <Bitcoin className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">Kryptowährungen</h3>
                  <p className="text-[10px] text-muted-foreground">{cryptoInvestments.length} Positionen</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm sm:text-base">
                  {formatCurrency(cryptoInvestments.reduce((sum, inv) => {
                    if (prices[inv.id]) {
                      return sum + inv.quantity * prices[inv.id];
                    }
                    return sum + inv.purchase_price;
                  }, 0))}
                </span>
                <ChevronDown className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform duration-200",
                  cryptoOpen && "rotate-180"
                )} />
              </div>
            </div>
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2 space-y-1.5">
          <div className="flex justify-end mb-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchPrices(cryptoInvestments)}
              className="gap-1.5 text-xs h-7 px-2"
            >
              <RefreshCw className="w-3 h-3" />
              Kurse aktualisieren
            </Button>
          </div>
          {cryptoInvestments.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="py-4 text-center">
                <Bitcoin className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-muted-foreground text-xs">Keine Kryptowährungen</p>
              </CardContent>
            </Card>
          ) : (
            cryptoInvestments.map((inv) => (
              <InvestmentCard
                key={inv.id}
                investment={inv}
                currentPrice={prices[inv.id] || null}
                loading={loadingPrices[inv.id] || false}
                onDeleted={fetchData}
                onRefresh={() => refreshPrice(inv)}
              />
            ))
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* Recent Transactions - Compact */}
      <Card className="glass-card overflow-hidden">
        <CardHeader className="p-2 sm:p-3 pb-1">
          <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5" />
            Letzte Transaktionen
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="py-6 text-center">
              <ArrowUpDown className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground text-xs">Keine Transaktionen</p>
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {transactions.map((tx) => {
                const account = accounts.find((a) => a.id === tx.account_id);
                const isIncome = tx.transaction_type === 'income';
                return (
                  <div key={tx.id} className="flex items-center justify-between gap-2 p-2 sm:p-3 group hover:bg-secondary/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs sm:text-sm truncate">
                        {tx.description || tx.category || 'Transaktion'}
                      </div>
                      <div className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        {account?.name} • {format(new Date(tx.date), 'dd.MM.yy', { locale: de })}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div
                        className={cn(
                          'font-semibold text-xs sm:text-sm',
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
                        className="h-6 w-6 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                        onClick={() => deleteTransaction(tx.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
