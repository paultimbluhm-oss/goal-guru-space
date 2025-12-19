import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { User, Wallet, ListChecks, Calendar, Sparkles } from 'lucide-react';
import { FinanceSection } from '@/components/privat/finance/FinanceSection';

const sections = [
  { id: 'finanzen', icon: Wallet, label: 'Finanzen', desc: 'Konten, Ausgaben, Investments' },
  { id: 'checklisten', icon: ListChecks, label: 'Checklisten', desc: 'Eigene Listen erstellen' },
  { id: 'aufgaben', icon: Calendar, label: 'Aufgaben', desc: 'Planer & To-Dos' },
  { id: 'langeweile', icon: Sparkles, label: 'Langeweile', desc: 'Aktivitäten-Ideen' },
];

export default function Privat() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  if (activeSection === 'finanzen') {
    return (
      <AppLayout>
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <FinanceSection onBack={() => setActiveSection(null)} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-accent/20">
            <User className="w-6 h-6 text-accent" />
          </div>
          <h1 className="text-2xl font-bold">Privat</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((s, i) => (
            <div
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="glass-card p-6 hover:border-primary/50 transition-colors cursor-pointer fade-in"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/20">
                  <s.icon className="w-6 h-6 text-primary" />
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
