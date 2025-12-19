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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Schule</h1>
            <p className="text-muted-foreground">Verwalte deine Fächer, Noten und Aufgaben</p>
          </div>
          <AddSubjectDialog onSubjectAdded={fetchData} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Fächer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subjects.length}</div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Durchschnitt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-primary">
                {averageGrade !== null ? `${averageGrade} P` : '-'}
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Offene Hausaufgaben
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingHomework.length}</div>
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Anstehende Termine
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingEvents.length}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                Nächste Hausaufgaben
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingHomework.length === 0 ? (
                <p className="text-muted-foreground text-sm">Keine offenen Hausaufgaben</p>
              ) : (
                <div className="space-y-2">
                  {upcomingHomework.map((hw) => (
                    <div key={hw.id} className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                      <div>
                        <div className="font-medium">{hw.title}</div>
                        <div className="text-xs text-muted-foreground">{hw.subjects?.name}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(hw.due_date), 'dd.MM.', { locale: de })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="glass-card border-border/50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 text-primary" />
                Nächste Termine
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingEvents.length === 0 ? (
                <p className="text-muted-foreground text-sm">Keine anstehenden Termine</p>
              ) : (
                <div className="space-y-2">
                  {upcomingEvents.map((event) => (
                    <div key={event.id} className="flex justify-between items-center p-2 rounded-lg bg-secondary/30">
                      <div>
                        <div className="font-medium">{event.title}</div>
                        <div className="text-xs text-muted-foreground">{event.subjects?.name} • {event.event_type}</div>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {format(new Date(event.event_date), 'dd.MM.', { locale: de })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Deine Fächer</h2>
          {subjects.length === 0 ? (
            <Card className="glass-card border-border/50">
              <CardContent className="py-8 text-center">
                <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">Noch keine Fächer vorhanden</p>
                <p className="text-sm text-muted-foreground">Füge dein erstes Fach hinzu, um loszulegen.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
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
