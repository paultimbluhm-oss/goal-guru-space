import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Briefcase, Users, ClipboardList, TrendingUp, Package } from 'lucide-react';

const sections = [
  { icon: Users, label: 'Kontakte', desc: 'Kontaktverzeichnis' },
  { icon: ClipboardList, label: 'Aufträge', desc: 'Status & Übersicht' },
  { icon: TrendingUp, label: 'Investitionen', desc: 'Prognosen & Planung' },
  { icon: Package, label: 'Produkte', desc: 'Produkte & Dienstleistungen' },
];

export default function Business() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-warning/20">
            <Briefcase className="w-6 h-6 text-warning" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Business</h1>
            <p className="text-muted-foreground">Geschäftliche Verwaltung</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((s, i) => (
            <div key={s.label} className="glass-card p-6 hover:border-primary/50 transition-colors cursor-pointer fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-warning/20">
                  <s.icon className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <h3 className="font-semibold">{s.label}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
