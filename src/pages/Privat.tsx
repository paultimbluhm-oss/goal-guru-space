import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Wallet, ListChecks, Calendar, ChefHat, Check, Gift } from 'lucide-react';
import { FinanceSection } from '@/components/privat/finance/FinanceSection';
import { ChecklistSection } from '@/components/privat/checklists';
import { TaskSection } from '@/components/privat/tasks';
import { RecipesSection } from '@/components/privat/recipes';
import { HabitsSection } from '@/components/privat/habits';
import { GiftsSection } from '@/components/privat/gifts';

const sections = [
  { id: 'habits', icon: Check, label: 'Habits', color: 'from-emerald-500 to-green-600' },
  { id: 'finanzen', icon: Wallet, label: 'Finanzen', color: 'from-amber-500 to-orange-600' },
  { id: 'checklisten', icon: ListChecks, label: 'Checklisten', color: 'from-blue-500 to-indigo-600' },
  { id: 'aufgaben', icon: Calendar, label: 'Aufgaben', color: 'from-violet-500 to-purple-600' },
  { id: 'rezepte', icon: ChefHat, label: 'Rezepte', color: 'from-red-500 to-orange-600' },
  { id: 'geschenke', icon: Gift, label: 'Geschenke', color: 'from-pink-500 to-rose-600' },
];
export default function Privat() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeSection, setActiveSection] = useState<string | null>(searchParams.get('section'));

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  // Sync URL params with activeSection
  useEffect(() => {
    const section = searchParams.get('section');
    if (section && sections.some(s => s.id === section)) {
      setActiveSection(section);
    }
  }, [searchParams]);

  const handleSetSection = (sectionId: string | null) => {
    setActiveSection(sectionId);
    if (sectionId) {
      setSearchParams({ section: sectionId });
    } else {
      setSearchParams({});
    }
  };

  if (loading || !user) return null;

  if (activeSection === 'habits') {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <HabitsSection onBack={() => handleSetSection(null)} />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === 'finanzen') {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <FinanceSection onBack={() => handleSetSection(null)} />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === 'checklisten') {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <ChecklistSection onBack={() => handleSetSection(null)} />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === 'aufgaben') {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <TaskSection onBack={() => handleSetSection(null)} />
        </div>
      </AppLayout>
    );
  }


  if (activeSection === 'rezepte') {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <RecipesSection onBack={() => handleSetSection(null)} />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === 'geschenke') {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <GiftsSection onBack={() => handleSetSection(null)} />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
        {/* Section Cards Grid - compact for mobile */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
          {sections.map((s, i) => (
            <div
              key={s.id}
              onClick={() => handleSetSection(s.id)}
              className="group relative overflow-hidden rounded-xl bg-card/80 backdrop-blur-sm border border-border/50 p-3 md:p-4 hover:border-primary/50 transition-all duration-300 cursor-pointer fade-in"
              style={{ animationDelay: `${i * 0.05}s` }}
            >
              {/* Gradient overlay on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${s.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
              
              <div className="relative z-10 flex flex-col items-center gap-2 text-center">
                <div className={`p-2.5 md:p-3 rounded-xl bg-gradient-to-br ${s.color} shadow-lg`}>
                  <s.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <h3 className="font-medium text-xs md:text-sm group-hover:text-primary transition-colors">{s.label}</h3>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
