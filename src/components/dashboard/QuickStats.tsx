import { ListTodo, Target, TrendingUp, Loader2 } from 'lucide-react';

interface QuickStatsProps {
  tasksPending: number;
  averageGrade: number | null;
  totalBalance: number;
  loadingPrices?: boolean;
}

export function QuickStats({ tasksPending, averageGrade, totalBalance, loadingPrices }: QuickStatsProps) {
  const stats = [
    {
      icon: ListTodo,
      label: 'Offene Aufgaben',
      value: tasksPending.toString(),
      color: 'text-warning',
      bgColor: 'bg-warning/20',
      highlight: tasksPending > 0,
    },
    {
      icon: Target,
      label: 'Notenschnitt',
      value: averageGrade !== null ? averageGrade.toFixed(1) + ' Pkt' : '—',
      color: 'text-accent',
      bgColor: 'bg-accent/20',
      highlight: false,
    },
    {
      icon: TrendingUp,
      label: 'Vermögen',
      value: new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(totalBalance),
      color: 'text-primary',
      bgColor: 'bg-primary/20',
      loading: loadingPrices,
      highlight: false,
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={`glass-card p-3 ${stat.highlight ? 'ring-1 ring-warning/50' : ''}`}
        >
          <div className={`p-1.5 rounded-lg ${stat.bgColor} w-fit mb-2`}>
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
          </div>
          <div className="flex items-center gap-1">
            <p className="text-base md:text-lg font-bold font-mono truncate">{stat.value}</p>
            {stat.loading && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
          </div>
          <p className="text-[10px] text-muted-foreground truncate">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
