import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { User, Wallet, ListChecks, Calendar, Sparkles, Lightbulb, ChefHat, BookOpen, Wrench } from 'lucide-react';
import { FinanceSection } from '@/components/privat/finance/FinanceSection';
import { ChecklistSection } from '@/components/privat/checklists';
import { TaskSection } from '@/components/privat/tasks';
import { BoredomSection } from '@/components/privat/boredom';
import { IdeasSection } from '@/components/privat/ideas';
import { RecipesSection } from '@/components/privat/recipes';
import { TermsSection } from '@/components/privat/terms';
import { OptimizationsSection } from '@/components/privat/optimizations';

const sections = [
  { id: 'finanzen', icon: Wallet, label: 'Finanzen', desc: 'Konten, Ausgaben, Investments' },
  { id: 'checklisten', icon: ListChecks, label: 'Checklisten', desc: 'Eigene Listen erstellen' },
  { id: 'aufgaben', icon: Calendar, label: 'Aufgaben', desc: 'Planer & To-Dos' },
  { id: 'langeweile', icon: Sparkles, label: 'Langeweile', desc: 'Projekte & Skills lernen' },
  { id: 'ideen', icon: Lightbulb, label: 'Ideen', desc: 'Gedanken & Einfälle festhalten' },
  { id: 'rezepte', icon: ChefHat, label: 'Rezepte', desc: 'Kochbuch mit Portionsrechner' },
  { id: 'fachbegriffe', icon: BookOpen, label: 'Fachbegriffe', desc: 'Vokabeln & professionelle Sprache' },
  { id: 'optimierungen', icon: Wrench, label: 'Optimierungen', desc: 'Probleme & Verbesserungen' },
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
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <FinanceSection onBack={() => setActiveSection(null)} />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === 'checklisten') {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <ChecklistSection onBack={() => setActiveSection(null)} />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === 'aufgaben') {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <TaskSection onBack={() => setActiveSection(null)} />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === 'langeweile') {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <BoredomSection onBack={() => setActiveSection(null)} />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === 'ideen') {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <IdeasSection onBack={() => setActiveSection(null)} />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === 'rezepte') {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <RecipesSection onBack={() => setActiveSection(null)} />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === 'fachbegriffe') {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <TermsSection onBack={() => setActiveSection(null)} />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === 'optimierungen') {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <OptimizationsSection onBack={() => setActiveSection(null)} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2.5 md:p-3 rounded-xl bg-accent/20">
            <User className="w-5 h-5 md:w-6 md:h-6 text-accent" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold">Privat</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {sections.map((s, i) => (
            <div
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="glass-card p-3 md:p-6 hover:border-primary/50 transition-colors cursor-pointer fade-in"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                <div className="p-2 md:p-3 rounded-xl bg-primary/20 shrink-0">
                  <s.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm md:text-base">{s.label}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">{s.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
