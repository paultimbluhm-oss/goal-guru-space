import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { GraduationCap, FolderKanban, Users, BookMarked } from 'lucide-react';
import { SubjectsSection } from '@/components/schule/SubjectsSection';
import { ProjectsSection } from '@/components/schule/ProjectsSection';
import { SchoolTasksSection } from '@/components/schule/SchoolTasksSection';

const sections = [
  { id: 'faecher', icon: GraduationCap, label: 'Fächer', desc: 'Noten, Hausaufgaben & Termine', color: 'blue' },
  { id: 'projekte', icon: FolderKanban, label: 'Projekte', desc: 'Schulische Projekte verwalten', color: 'purple' },
  { id: 'mitschueler', icon: Users, label: 'Für Mitschüler', desc: 'Aufgaben für Klassenkameraden', color: 'orange' },
  { id: 'lehrer', icon: BookMarked, label: 'Für Lehrer', desc: 'Aufgaben von Lehrern', color: 'red' },
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

  if (activeSection === 'projekte') {
    return (
      <AppLayout>
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
          <ProjectsSection onBack={() => setActiveSection(null)} />
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
      <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2.5 md:p-3 rounded-xl bg-blue-500/20">
            <GraduationCap className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold">Schule</h1>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {sections.map((s, i) => (
            <div
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="glass-card p-3 md:p-6 hover:border-primary/50 transition-colors cursor-pointer fade-in"
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              <div className="flex flex-col items-start gap-2">
                <div className={`p-2 md:p-3 rounded-xl bg-${s.color}-500/20`}>
                  <s.icon className={`w-5 h-5 md:w-6 md:h-6 text-${s.color}-500`} />
                </div>
                <div>
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
