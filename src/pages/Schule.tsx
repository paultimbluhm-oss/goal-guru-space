import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { GraduationCap, FolderKanban, Users, BookMarked, CalendarX, CalendarDays, ChevronRight } from 'lucide-react';
import { SubjectsSection } from '@/components/schule/SubjectsSection';
import { ProjectsSection } from '@/components/schule/ProjectsSection';
import { SchoolTasksSection } from '@/components/schule/SchoolTasksSection';
import { AbsencesSection } from '@/components/schule/AbsencesSection';
import { TimetableSection } from '@/components/schule/TimetableSection';

const sections = [
  { id: 'faecher', icon: GraduationCap, label: 'Fächer', desc: 'Noten, Hausaufgaben & Termine', color: 'from-blue-500 to-indigo-600' },
  { id: 'stundenplan', icon: CalendarDays, label: 'Stundenplan', desc: 'Dein Wochenplan', color: 'from-teal-500 to-cyan-600' },
  { id: 'projekte', icon: FolderKanban, label: 'Projekte', desc: 'Schulische Projekte verwalten', color: 'from-purple-500 to-violet-600' },
  { id: 'fehltage', icon: CalendarX, label: 'Fehltage', desc: 'Abwesenheiten verwalten', color: 'from-rose-500 to-red-600' },
  { id: 'mitschueler', icon: Users, label: 'Für Mitschüler', desc: 'Aufgaben für Klassenkameraden', color: 'from-orange-500 to-amber-600' },
  { id: 'lehrer', icon: BookMarked, label: 'Für Lehrer', desc: 'Aufgaben von Lehrern', color: 'from-red-500 to-rose-600' },
];

export default function Schule() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  if (activeSection === 'faecher') {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <SubjectsSection onBack={() => setActiveSection(null)} />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === 'stundenplan') {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <TimetableSection onBack={() => setActiveSection(null)} />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === 'projekte') {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <ProjectsSection onBack={() => setActiveSection(null)} />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === 'fehltage') {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <AbsencesSection onBack={() => setActiveSection(null)} />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === 'mitschueler') {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <SchoolTasksSection onBack={() => setActiveSection(null)} taskType="classmate" />
        </div>
      </AppLayout>
    );
  }

  if (activeSection === 'lehrer') {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <SchoolTasksSection onBack={() => setActiveSection(null)} taskType="teacher" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-secondary/30 border border-border/50 p-6 md:p-8">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 industrial-grid opacity-20" />
          
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-3 md:p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-indigo-500/5 border border-blue-500/20">
              <GraduationCap className="w-6 h-6 md:w-8 md:h-8 text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Schule</h1>
              <p className="text-muted-foreground text-sm md:text-base">Alles für deinen Schulalltag</p>
            </div>
          </div>
        </div>

        {/* Section Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
