import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { HandCoins, ChevronDown, Check, Trash2, ArrowUpRight, ArrowDownLeft, Clock } from 'lucide-react';
import { useAuth, getSupabase } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, isPast } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AddLoanDialog } from './AddLoanDialog';

interface Loan {
  id: string;
  person_name: string;
  amount: number;
  loan_type: 'lent' | 'borrowed';
  description: string | null;
  loan_date: string;
  due_date: string | null;
  is_returned: boolean;
  returned_date: string | null;
}

interface LoansSectionProps {
  onRefresh: () => void;
}

export function LoansSection({ onRefresh }: LoansSectionProps) {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [open, setOpen] = useState(true);

  const fetchLoans = async () => {
    if (!user) return;
    const supabase = getSupabase();
    const { data } = await supabase
      .from('loans')
      .select('*')
      .eq('user_id', user.id)
      .order('is_returned', { ascending: true })
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('loan_date', { ascending: false });
    
    if (data) setLoans(data as Loan[]);
  };

  useEffect(() => {
    fetchLoans();
  }, [user]);

  const markAsReturned = async (loan: Loan) => {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('loans')
      .update({ 
        is_returned: true, 
        returned_date: new Date().toISOString().split('T')[0] 
      })
      .eq('id', loan.id);
    
    if (error) {
      toast.error('Fehler beim Aktualisieren');
    } else {
      toast.success(loan.loan_type === 'lent' ? 'Geld zurückerhalten!' : 'Geld zurückgezahlt!');
      fetchLoans();
      onRefresh();
    }
  };

  const deleteLoan = async (id: string) => {
    if (!confirm('Eintrag wirklich löschen?')) return;
    
    const supabase = getSupabase();
    const { error } = await supabase.from('loans').delete().eq('id', id);
    
    if (error) {
      toast.error('Fehler beim Löschen');
    } else {
      toast.success('Eintrag gelöscht');
      fetchLoans();
      onRefresh();
    }
  };

  const formatCurrency = (value: number) => 
    value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' });

  const activeLoans = loans.filter(l => !l.is_returned);
  const lentTotal = activeLoans.filter(l => l.loan_type === 'lent').reduce((sum, l) => sum + l.amount, 0);
  const borrowedTotal = activeLoans.filter(l => l.loan_type === 'borrowed').reduce((sum, l) => sum + l.amount, 0);
  const netBalance = lentTotal - borrowedTotal;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <div className="group relative overflow-hidden rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 p-4 cursor-pointer hover:border-primary/30 transition-all">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-5" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500">
                <HandCoins className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Verliehen & Geliehen</h3>
                <p className="text-xs text-muted-foreground">{activeLoans.length} offen</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className={cn(
                  "font-bold text-lg",
                  netBalance > 0 ? "text-success" : netBalance < 0 ? "text-destructive" : ""
                )}>
                  {netBalance > 0 ? '+' : ''}{formatCurrency(netBalance)}
                </span>
                <p className="text-xs text-muted-foreground">Netto</p>
              </div>
              <ChevronDown className={cn(
                "w-5 h-5 text-muted-foreground transition-transform duration-200",
                open && "rotate-180"
              )} />
            </div>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="pt-3 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex gap-4 text-sm">
            <span className="text-success">Verliehen: {formatCurrency(lentTotal)}</span>
            <span className="text-destructive">Geliehen: {formatCurrency(borrowedTotal)}</span>
          </div>
          <AddLoanDialog onLoanAdded={fetchLoans} />
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {loans.map((loan) => {
            const isOverdue = loan.due_date && isPast(new Date(loan.due_date)) && !loan.is_returned;
            
            return (
              <Card key={loan.id} className={cn(
                "glass-card relative overflow-hidden",
                loan.is_returned && "opacity-60"
              )}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {loan.loan_type === 'lent' ? (
                        <ArrowUpRight className="w-4 h-4 text-success" />
                      ) : (
                        <ArrowDownLeft className="w-4 h-4 text-destructive" />
                      )}
                      <span className="font-medium">{loan.person_name}</span>
                    </div>
                    <Badge variant={loan.is_returned ? "secondary" : loan.loan_type === 'lent' ? "default" : "destructive"}>
                      {loan.is_returned ? 'Erledigt' : loan.loan_type === 'lent' ? 'Verliehen' : 'Geliehen'}
                    </Badge>
                  </div>
                  
                  <p className={cn(
                    "text-xl font-bold mb-2",
                    loan.loan_type === 'lent' ? "text-success" : "text-destructive"
                  )}>
                    {loan.loan_type === 'lent' ? '+' : '-'}{formatCurrency(loan.amount)}
                  </p>
                  
                  {loan.description && (
                    <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{loan.description}</p>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                    <span>{format(new Date(loan.loan_date), 'dd.MM.yyyy', { locale: de })}</span>
                    {loan.due_date && (
                      <span className={cn("flex items-center gap-1", isOverdue && "text-destructive")}>
                        <Clock className="w-3 h-3" />
                        Fällig: {format(new Date(loan.due_date), 'dd.MM.yyyy', { locale: de })}
                      </span>
                    )}
                  </div>
                  
                  {!loan.is_returned && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => markAsReturned(loan)}>
                        <Check className="w-3 h-3 mr-1" />
                        {loan.loan_type === 'lent' ? 'Zurückerhalten' : 'Zurückgezahlt'}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteLoan(loan.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  )}
                  
                  {loan.is_returned && loan.returned_date && (
                    <p className="text-xs text-muted-foreground">
                      Erledigt am {format(new Date(loan.returned_date), 'dd.MM.yyyy', { locale: de })}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
        
        {loans.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <HandCoins className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Keine Einträge vorhanden</p>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}