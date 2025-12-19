import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, ChevronDown, ChevronUp, BookOpen, Calendar, CheckCircle2 } from 'lucide-react';
import { getSupabase, useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { AddGradeDialog } from './AddGradeDialog';
import { AddHomeworkDialog } from './AddHomeworkDialog';
import { AddEventDialog } from './AddEventDialog';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Subject {
  id: string;
  name: string;
  grade_year: number;
  written_weight: number;
  oral_weight: number;
}

interface Grade {
  id: string;
  points: number;
  grade_type: string;
  description: string | null;
  date: string | null;
}

interface Homework {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  completed: boolean;
}

interface SchoolEvent {
  id: string;
  title: string;
  description: string | null;
  event_date: string;
  event_type: string;
}

interface SubjectCardProps {
  subject: Subject;
  onDeleted: () => void;
  onDataChanged: () => void;
}

export function SubjectCard({ subject, onDeleted, onDataChanged }: SubjectCardProps) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [events, setEvents] = useState<SchoolEvent[]>([]);

  const fetchData = async () => {
    if (!user) return;
    const supabase = getSupabase();
    if (!supabase) return;

    const [gradesRes, homeworkRes, eventsRes] = await Promise.all([
      supabase.from('grades').select('*').eq('subject_id', subject.id).order('date', { ascending: false }),
      supabase.from('homework').select('*').eq('subject_id', subject.id).order('due_date', { ascending: true }),
      supabase.from('school_events').select('*').eq('subject_id', subject.id).order('event_date', { ascending: true }),
    ]);

    if (gradesRes.data) setGrades(gradesRes.data);
    if (homeworkRes.data) setHomework(homeworkRes.data);
    if (eventsRes.data) setEvents(eventsRes.data);
  };

  useEffect(() => {
    fetchData();
  }, [user, subject.id]);

  const calculateFinalGrade = () => {
    const oralGrades = grades.filter(g => g.grade_type === 'oral');
    const writtenGrades = grades.filter(g => g.grade_type === 'written');

    if (oralGrades.length === 0 && writtenGrades.length === 0) return null;

    const oralAvg = oralGrades.length > 0
      ? oralGrades.reduce((sum, g) => sum + g.points, 0) / oralGrades.length
      : null;

    const writtenAvg = writtenGrades.length > 0
      ? writtenGrades.reduce((sum, g) => sum + g.points, 0) / writtenGrades.length
      : null;

    if (oralAvg !== null && writtenAvg !== null) {
      return Math.round((writtenAvg * subject.written_weight + oralAvg * subject.oral_weight) / 100);
    } else if (oralAvg !== null) {
      return Math.round(oralAvg);
    } else if (writtenAvg !== null) {
      return Math.round(writtenAvg);
    }
    return null;
  };

  const handleDelete = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    
    const { error } = await supabase.from('subjects').delete().eq('id', subject.id);
    if (error) {
      toast.error('Fehler beim Löschen');
    } else {
      toast.success('Fach gelöscht');
      onDeleted();
    }
  };

  const toggleHomework = async (hw: Homework) => {
    const supabase = getSupabase();
    if (!supabase) return;
    
    const { error } = await supabase
      .from('homework')
      .update({ completed: !hw.completed })
      .eq('id', hw.id);
    
    if (!error) {
      fetchData();
    }
  };

  const deleteGrade = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    
    await supabase.from('grades').delete().eq('id', id);
    fetchData();
    onDataChanged();
  };

  const deleteHomework = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    
    await supabase.from('homework').delete().eq('id', id);
    fetchData();
  };

  const deleteEvent = async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return;
    
    await supabase.from('school_events').delete().eq('id', id);
    fetchData();
  };

  const finalGrade = calculateFinalGrade();
  const oralGrades = grades.filter(g => g.grade_type === 'oral');
  const writtenGrades = grades.filter(g => g.grade_type === 'written');
  const oralAvg = oralGrades.length > 0 
    ? (oralGrades.reduce((sum, g) => sum + g.points, 0) / oralGrades.length).toFixed(1) 
    : '-';
  const writtenAvg = writtenGrades.length > 0 
    ? (writtenGrades.reduce((sum, g) => sum + g.points, 0) / writtenGrades.length).toFixed(1) 
    : '-';

  return (
    <Card className="glass-card border-border/50">
      <CardHeader className="p-3 md:p-6 pb-2">
        <div className="flex items-start sm:items-center justify-between gap-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 min-w-0">
            <CardTitle className="text-base md:text-lg truncate">{subject.name}</CardTitle>
            <Badge variant="secondary" className="w-fit text-xs">Klasse {subject.grade_year}</Badge>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {finalGrade !== null && (
              <div className="text-lg md:text-2xl font-bold text-primary">{finalGrade} P</div>
            )}
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-1 sm:gap-4 text-xs md:text-sm text-muted-foreground mt-1">
          <span>Mündlich: {oralAvg} ({subject.oral_weight}%)</span>
          <span>Schriftlich: {writtenAvg} ({subject.written_weight}%)</span>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="p-3 pt-0 md:p-6 md:pt-0 space-y-3 md:space-y-4">
          <div className="flex flex-wrap gap-2">
            <AddGradeDialog 
              subjectId={subject.id} 
              subjectName={subject.name} 
              onGradeAdded={() => { fetchData(); onDataChanged(); }} 
            />
            <AddHomeworkDialog 
              subjectId={subject.id} 
              subjectName={subject.name} 
              onHomeworkAdded={fetchData} 
            />
            <AddEventDialog 
              subjectId={subject.id} 
              subjectName={subject.name} 
              onEventAdded={fetchData} 
            />
            <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1 sm:ml-auto text-xs md:text-sm">
              <Trash2 className="h-3 w-3" />
              <span className="hidden sm:inline">Fach löschen</span>
              <span className="sm:hidden">Löschen</span>
            </Button>
          </div>

          {grades.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-xs md:text-sm text-muted-foreground">Noten</h4>
              <div className="grid gap-2">
                {grades.map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-secondary/30">
                    <div className="flex flex-wrap items-center gap-1.5 md:gap-2 min-w-0">
                      <Badge variant={grade.grade_type === 'oral' ? 'secondary' : 'default'} className="text-xs shrink-0">
                        {grade.grade_type === 'oral' ? 'M' : 'S'}
                      </Badge>
                      <span className="font-medium text-sm md:text-base">{grade.points} P</span>
                      {grade.description && <span className="text-xs md:text-sm text-muted-foreground truncate">- {grade.description}</span>}
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => deleteGrade(grade.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {homework.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-xs md:text-sm text-muted-foreground flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 md:h-4 md:w-4" /> Hausaufgaben
              </h4>
              <div className="grid gap-2">
                {homework.map((hw) => (
                  <div key={hw.id} className={`flex items-center justify-between gap-2 p-2 rounded-lg ${hw.completed ? 'bg-primary/10' : 'bg-secondary/30'}`}>
                    <div className="flex items-center gap-1.5 md:gap-2 min-w-0">
                      <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => toggleHomework(hw)}>
                        <CheckCircle2 className={`h-4 w-4 ${hw.completed ? 'text-primary' : 'text-muted-foreground'}`} />
                      </Button>
                      <div className="min-w-0">
                        <span className={`text-sm md:text-base truncate block ${hw.completed ? 'line-through text-muted-foreground' : ''}`}>{hw.title}</span>
                        <div className="text-xs text-muted-foreground">
                          {format(new Date(hw.due_date), 'dd.MM.yy', { locale: de })}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => deleteHomework(hw.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {events.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-xs md:text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" /> Termine
              </h4>
              <div className="grid gap-2">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-secondary/30">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 md:gap-2">
                        <Badge variant="outline" className="text-xs shrink-0">{event.event_type}</Badge>
                        <span className="text-sm md:text-base truncate">{event.title}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(event.event_date), 'dd.MM.yy', { locale: de })}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => deleteEvent(event.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
