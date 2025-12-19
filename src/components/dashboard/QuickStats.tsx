import { CheckCircle2, ListTodo, Target, TrendingUp, Loader2 } from 'lucide-react';

interface QuickStatsProps {
  tasksCompleted: number;
  tasksPending: number;
  averageGrade: number | null;
  totalBalance: number;
  loadingPrices?: boolean;
}

export function QuickStats({ tasksCompleted, tasksPending, averageGrade, totalBalance, loadingPrices }: QuickStatsProps) {
  const stats = [
    {
      icon: CheckCircle2,
      label: 'Erledigte Aufgaben',
      value: tasksCompleted.toString(),
      color: 'text-success',
      bgColor: 'bg-success/20',
      loading: false,
    },
    {
      icon: ListTodo,
      label: 'Offene Aufgaben',
      value: tasksPending.toString(),
      color: 'text-warning',
      bgColor: 'bg-warning/20',
      loading: false,
    },
    {
      icon: Target,
      label: 'Notendurchschnitt',
      value: averageGrade !== null ? averageGrade.toFixed(1) + ' Pkt' : '—',
      color: 'text-accent',
      bgColor: 'bg-accent/20',
      loading: false,
    },
    {
      icon: TrendingUp,
      label: 'Gesamtvermögen',
      value: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totalBalance),
      color: 'text-primary',
      bgColor: 'bg-primary/20',
      loading: loadingPrices,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="glass-card p-3 md:p-4 fade-in"
          style={{ animationDelay: `${i * 0.1}s` }}
        >
          <div className={`p-1.5 md:p-2 rounded-lg ${stat.bgColor} w-fit mb-2 md:mb-3`}>
            <stat.icon className={`w-4 h-4 md:w-5 md:h-5 ${stat.color}`} />
          </div>
          <div className="flex items-center gap-2">
            <p className="text-lg md:text-2xl font-bold font-mono truncate">{stat.value}</p>
            {stat.loading && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
