import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { User, Wallet, ListChecks, Calendar, Sparkles, Lightbulb, ChefHat, BookOpen, Wrench, Check, ChevronRight } from 'lucide-react';
import { FinanceSection } from '@/components/privat/finance/FinanceSection';
import { ChecklistSection } from '@/components/privat/checklists';
import { TaskSection } from '@/components/privat/tasks';
import { BoredomSection } from '@/components/privat/boredom';
import { IdeasSection } from '@/components/privat/ideas';
import { RecipesSection } from '@/components/privat/recipes';
import { TermsSection } from '@/components/privat/terms';
import { OptimizationsSection } from '@/components/privat/optimizations';
import { HabitsSection } from '@/components/privat/habits';

const sections = [
  { id: 'habits', icon: Check, label: 'Habits', desc: 'Tägliche Gewohnheiten tracken', color: 'from-emerald-500 to-green-600' },
  { id: 'finanzen', icon: Wallet, label: 'Finanzen', desc: 'Konten, Ausgaben, Investments', color: 'from-amber-500 to-orange-600' },
  { id: 'checklisten', icon: ListChecks, label: 'Checklisten', desc: 'Eigene Listen erstellen', color: 'from-blue-500 to-indigo-600' },
  { id: 'aufgaben', icon: Calendar, label: 'Aufgaben', desc: 'Planer & To-Dos', color: 'from-violet-500 to-purple-600' },
  { id: 'langeweile', icon: Sparkles, label: 'Langeweile', desc: 'Projekte & Skills lernen', color: 'from-pink-500 to-rose-600' },
  { id: 'ideen', icon: Lightbulb, label: 'Ideen', desc: 'Gedanken & Einfälle festhalten', color: 'from-yellow-500 to-amber-600' },
  { id: 'rezepte', icon: ChefHat, label: 'Rezepte', desc: 'Kochbuch mit Portionsrechner', color: 'from-red-500 to-orange-600' },
  { id: 'fachbegriffe', icon: BookOpen, label: 'Fachbegriffe', desc: 'Vokabeln & professionelle Sprache', color: 'from-cyan-500 to-teal-600' },
  { id: 'optimierungen', icon: Wrench, label: 'Optimierungen', desc: 'Probleme & Verbesserungen', color: 'from-slate-500 to-zinc-600' },
];

export default function Privat() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  if (activeSection === 'habits') {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <HabitsSection onBack={() => setActiveSection(null)} />
        </div>
      </AppLayout>
    );
  }

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
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-secondary/30 border border-border/50 p-6 md:p-8">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 industrial-grid opacity-20" />
          
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-3 md:p-4 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/20">
              <User className="w-6 h-6 md:w-8 md:h-8 text-accent" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Privat</h1>
              <p className="text-muted-foreground text-sm md:text-base">Dein persönlicher Bereich</p>
            </div>
          </div>
        </div>

        {/* Section Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sections.map((s, i) => (
            <div
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="group relative overflow-hidden rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 p-4 md:p-5 hover:border-primary/50 transition-all duration-300 cursor-pointer fade-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              
              <div className="relative z-10 flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${s.color} shadow-lg`}>
                  <s.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-base md:text-lg group-hover:text-primary transition-colors">{s.label}</h3>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">{s.desc}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
