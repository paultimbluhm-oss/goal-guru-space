import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getSupabase } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { AddSubjectDialog } from '@/components/schule/AddSubjectDialog';
import { SubjectCard } from '@/components/schule/SubjectCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, BookOpen, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Subject {
  id: string;
  name: string;
  grade_year: number;
  written_weight: number;
  oral_weight: number;
}

interface Homework {
  id: string;
  title: string;
  due_date: string;
  completed: boolean;
  subjects: { name: string } | null;
}

interface SchoolEvent {
  id: string;
  title: string;
  event_date: string;
  event_type: string;
  subjects: { name: string } | null;
}

export default function Schule() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [upcomingHomework, setUpcomingHomework] = useState<Homework[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<SchoolEvent[]>([]);
  const [averageGrade, setAverageGrade] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const fetchData = async () => {
    if (!user) return;
    const supabase = getSupabase();
    if (!supabase) return;

    const { data: subjectsData } = await supabase
      .from('subjects')
      .select('*')
      .eq('user_id', user.id)
      .order('name');
    
    if (subjectsData) setSubjects(subjectsData);

    const today = new Date().toISOString().split('T')[0];
    const { data: homeworkData } = await supabase
      .from('homework')
      .select('id, title, due_date, completed, subjects(name)')
      .eq('user_id', user.id)
      .eq('completed', false)
      .gte('due_date', today)
      .order('due_date')
      .limit(5);
    
    if (homeworkData) setUpcomingHomework(homeworkData as Homework[]);

    const { data: eventsData } = await supabase
      .from('school_events')
      .select('id, title, event_date, event_type, subjects(name)')
      .eq('user_id', user.id)
      .gte('event_date', today)
      .order('event_date')
      .limit(5);
    
    if (eventsData) setUpcomingEvents(eventsData as SchoolEvent[]);

    const { data: gradesData } = await supabase
      .from('grades')
      .select('points, grade_type, subject_id')
      .eq('user_id', user.id);
    
    if (gradesData && gradesData.length > 0 && subjectsData) {
      const subjectGrades: Record<string, { oral: number[], written: number[], weights: { oral: number, written: number } }> = {};
      
      subjectsData.forEach(subject => {
        subjectGrades[subject.id] = { 
          oral: [], 
          written: [], 
          weights: { oral: subject.oral_weight, written: subject.written_weight } 
        };
      });

      gradesData.forEach(grade => {
        if (subjectGrades[grade.subject_id]) {
          if (grade.grade_type === 'oral') {
            subjectGrades[grade.subject_id].oral.push(grade.points);
          } else {
            subjectGrades[grade.subject_id].written.push(grade.points);
          }
        }
      });

      const finalGrades: number[] = [];
      Object.values(subjectGrades).forEach(({ oral, written, weights }) => {
        const oralAvg = oral.length > 0 ? oral.reduce((a, b) => a + b, 0) / oral.length : null;
        const writtenAvg = written.length > 0 ? written.reduce((a, b) => a + b, 0) / written.length : null;

        if (oralAvg !== null && writtenAvg !== null) {
          finalGrades.push((writtenAvg * weights.written + oralAvg * weights.oral) / 100);
        } else if (oralAvg !== null) {
          finalGrades.push(oralAvg);
        } else if (writtenAvg !== null) {
          finalGrades.push(writtenAvg);
        }
      });

      if (finalGrades.length > 0) {
        setAverageGrade(Math.round((finalGrades.reduce((a, b) => a + b, 0) / finalGrades.length) * 10) / 10);
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 space-y-4 md:space-y-6 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl md:text-3xl font-bold">Schule</h1>
          <AddSubjectDialog onSubjectAdded={fetchData} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1.5 md:gap-2">
                <GraduationCap className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                <span className="truncate">Fächer</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{subjects.length}</div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1.5 md:gap-2">
                <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                <span className="truncate">Durchschnitt</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold text-primary">
                {averageGrade !== null ? `${averageGrade} P` : '-'}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1.5 md:gap-2">
                <BookOpen className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                <span className="truncate">Hausaufgaben</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{upcomingHomework.length}</div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1.5 md:gap-2">
                <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
                <span className="truncate">Termine</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-xl md:text-2xl font-bold">{upcomingEvents.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          <Card className="glass-card border-border/50">
            <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                Nächste Hausaufgaben
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              {upcomingHomework.length === 0 ? (
                <p className="text-muted-foreground text-sm">Keine offenen Hausaufgaben</p>
              ) : (
                <div className="space-y-2">
                  {upcomingHomework.map((hw) => (
                    <div key={hw.id} className="flex justify-between items-center gap-2 p-2 rounded-lg bg-secondary/30">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm md:text-base truncate">{hw.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{hw.subjects?.name}</div>
                      </div>
                      <div className="text-xs md:text-sm text-muted-foreground shrink-0">
                        {format(new Date(hw.due_date), 'dd.MM.', { locale: de })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Calendar className="h-4 w-4 md:h-5 md:w-5 text-primary shrink-0" />
                Nächste Termine
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              {upcomingEvents.length === 0 ? (
                <p className="text-muted-foreground text-sm">Keine anstehenden Termine</p>
              ) : (
                <div className="space-y-2">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex justify-between items-center gap-2 p-2 rounded-lg bg-secondary/30">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm md:text-base truncate">{event.title}</div>
                        <div className="text-xs text-muted-foreground truncate">{event.subjects?.name} • {event.event_type}</div>
                      </div>
                      <div className="text-xs md:text-sm text-muted-foreground shrink-0">
                        {format(new Date(event.event_date), 'dd.MM.', { locale: de })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3 md:space-y-4">
          <h2 className="text-lg md:text-xl font-semibold">Deine Fächer</h2>
          {subjects.length === 0 ? (
            <Card className="glass-card border-border/50">
              <CardContent className="py-6 md:py-8 text-center">
                <GraduationCap className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 text-muted-foreground" />
                <p className="text-muted-foreground text-sm md:text-base">Noch keine Fächer vorhanden</p>
                <p className="text-xs md:text-sm text-muted-foreground">Füge dein erstes Fach hinzu, um loszulegen.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-3 md:gap-4">
              {subjects.map((subject) => (
                <SubjectCard 
                  key={subject.id} 
                  subject={subject} 
                  onDeleted={fetchData}
                  onDataChanged={fetchData}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
