import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, GraduationCap, BookOpen, Calendar, TrendingUp, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { AddSubjectDialog } from './AddSubjectDialog';
import { SubjectCard } from './SubjectCard';
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

interface SubjectsSectionProps {
  onBack: () => void;
}

export function SubjectsSection({ onBack }: SubjectsSectionProps) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [upcomingHomework, setUpcomingHomework] = useState<Homework[]>([]);
  const [upcomingEvents, setUpcomingEvents] = useState<SchoolEvent[]>([]);
  const [averageGrade, setAverageGrade] = useState<number | null>(null);

  const fetchData = async () => {
    if (!user) return;

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="p-2.5 rounded-xl bg-blue-500/20">
            <GraduationCap className="w-5 h-5 text-blue-500" />
          </div>
          <h2 className="text-xl font-bold">Fächer</h2>
        </div>
        <div className="hidden sm:block">
          <AddSubjectDialog onSubjectAdded={fetchData} />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <GraduationCap className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span>Fächer</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{subjects.length}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span>Durchschnitt</span>
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
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span>Hausaufgaben</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{upcomingHomework.length}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-border/50">
          <CardHeader className="pb-1 md:pb-2 p-3 md:p-6">
            <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
              <span>Termine</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="text-xl md:text-2xl font-bold">{upcomingEvents.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
        <Card className="glass-card border-border/50">
          <CardHeader className="p-3 md:p-6 pb-2 md:pb-4">
            <CardTitle className="text-base md:text-lg flex items-center gap-2">
              <BookOpen className="h-4 w-4 md:h-5 md:w-5 text-primary" />
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
                      <div className="font-medium text-sm truncate">{hw.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{hw.subjects?.name}</div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
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
              <Calendar className="h-4 w-4 md:h-5 md:w-5 text-primary" />
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
                      <div className="font-medium text-sm truncate">{event.title}</div>
                      <div className="text-xs text-muted-foreground truncate">{event.subjects?.name} • {event.event_type}</div>
                    </div>
                    <div className="text-xs text-muted-foreground shrink-0">
                      {format(new Date(event.event_date), 'dd.MM.', { locale: de })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subjects List */}
      <div className="space-y-3">
        <h3 className="font-semibold">Deine Fächer</h3>
        {subjects.length === 0 ? (
          <Card className="glass-card border-border/50">
            <CardContent className="py-8 text-center">
              <GraduationCap className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Noch keine Fächer vorhanden</p>
              <p className="text-sm text-muted-foreground">Füge dein erstes Fach hinzu.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
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

      {/* Mobile button */}
      <div className="sm:hidden">
        <AddSubjectDialog onSubjectAdded={fetchData} />
      </div>
    </div>
  );
}
