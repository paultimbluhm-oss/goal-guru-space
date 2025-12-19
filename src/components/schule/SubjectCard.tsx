import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, ChevronDown, ChevronUp, BookOpen, Calendar, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
    const { error } = await supabase.from('subjects').delete().eq('id', subject.id);
    if (error) {
      toast.error('Fehler beim Löschen');
    } else {
      toast.success('Fach gelöscht');
      onDeleted();
    }
  };

  const toggleHomework = async (hw: Homework) => {
    const { error } = await supabase
      .from('homework')
      .update({ completed: !hw.completed })
      .eq('id', hw.id);
    
    if (!error) {
      fetchData();
    }
  };

  const deleteGrade = async (id: string) => {
    await supabase.from('grades').delete().eq('id', id);
    fetchData();
    onDataChanged();
  };

  const deleteHomework = async (id: string) => {
    await supabase.from('homework').delete().eq('id', id);
    fetchData();
  };

  const deleteEvent = async (id: string) => {
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
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg">{subject.name}</CardTitle>
            <Badge variant="secondary">Klasse {subject.grade_year}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {finalGrade !== null && (
              <div className="text-2xl font-bold text-primary">{finalGrade} P</div>
            )}
            <Button variant="ghost" size="icon" onClick={() => setExpanded(!expanded)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>Mündlich: {oralAvg} ({subject.oral_weight}%)</span>
          <span>Schriftlich: {writtenAvg} ({subject.written_weight}%)</span>
        </div>
      </CardHeader>

      {expanded && (
        <CardContent className="space-y-4">
          {/* Actions */}
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
            <Button variant="destructive" size="sm" onClick={handleDelete} className="gap-1 ml-auto">
              <Trash2 className="h-3 w-3" />
              Fach löschen
            </Button>
          </div>

          {/* Grades */}
          {grades.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground">Noten</h4>
              <div className="grid gap-2">
                {grades.map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                    <div className="flex items-center gap-2">
                      <Badge variant={grade.grade_type === 'oral' ? 'secondary' : 'default'}>
                        {grade.grade_type === 'oral' ? 'Mündlich' : 'Schriftlich'}
                      </Badge>
                      <span className="font-medium">{grade.points} Punkte</span>
                      {grade.description && <span className="text-sm text-muted-foreground">- {grade.description}</span>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteGrade(grade.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Homework */}
          {homework.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <BookOpen className="h-4 w-4" /> Hausaufgaben
              </h4>
              <div className="grid gap-2">
                {homework.map((hw) => (
                  <div key={hw.id} className={`flex items-center justify-between p-2 rounded-lg ${hw.completed ? 'bg-primary/10' : 'bg-secondary/30'}`}>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => toggleHomework(hw)}>
                        <CheckCircle2 className={`h-4 w-4 ${hw.completed ? 'text-primary' : 'text-muted-foreground'}`} />
                      </Button>
                      <div>
                        <span className={hw.completed ? 'line-through text-muted-foreground' : ''}>{hw.title}</span>
                        <div className="text-xs text-muted-foreground">
                          Fällig: {format(new Date(hw.due_date), 'dd.MM.yyyy', { locale: de })}
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteHomework(hw.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events */}
          {events.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" /> Termine
              </h4>
              <div className="grid gap-2">
                {events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{event.event_type}</Badge>
                        <span>{event.title}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(event.event_date), 'dd.MM.yyyy', { locale: de })}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteEvent(event.id)}>
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
