import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Edit2, Trash2, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Subject {
  id: string;
  name: string;
}

interface TimetableEntry {
  id: string;
  day_of_week: number;
  period: number;
  subject_id: string | null;
  teacher_short: string;
  room: string | null;
  subjects?: Subject | null;
}

interface TimetableSectionProps {
  onBack: () => void;
}

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export function TimetableSection({ onBack }: TimetableSectionProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);

  // Form state
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [period, setPeriod] = useState('1');
  const [subjectId, setSubjectId] = useState<string>('');
  const [teacherShort, setTeacherShort] = useState('');
  const [room, setRoom] = useState('');

  const fetchData = async () => {
    if (!user) return;

    const [entriesRes, subjectsRes] = await Promise.all([
      supabase
        .from('timetable_entries')
        .select('*, subjects(id, name)')
        .eq('user_id', user.id)
        .order('day_of_week')
        .order('period'),
      supabase
        .from('subjects')
        .select('id, name')
        .eq('user_id', user.id)
        .order('name'),
    ]);

    if (entriesRes.error) console.error(entriesRes.error);
    if (subjectsRes.error) console.error(subjectsRes.error);

    setEntries(entriesRes.data || []);
    setSubjects(subjectsRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const resetForm = () => {
    setDayOfWeek('1');
    setPeriod('1');
    setSubjectId('');
    setTeacherShort('');
    setRoom('');
    setEditingEntry(null);
  };

  const openEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setDayOfWeek(entry.day_of_week.toString());
    setPeriod(entry.period.toString());
    setSubjectId(entry.subject_id || '');
    setTeacherShort(entry.teacher_short);
    setRoom(entry.room || '');
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!teacherShort.trim()) {
      toast.error('Bitte gib ein Lehrerkürzel ein');
      return;
    }

    const data = {
      user_id: user.id,
      day_of_week: parseInt(dayOfWeek),
      period: parseInt(period),
      subject_id: subjectId || null,
      teacher_short: teacherShort.trim(),
      room: room.trim() || null,
    };

    if (editingEntry) {
      const { error } = await supabase
        .from('timetable_entries')
        .update(data)
        .eq('id', editingEntry.id);

      if (error) {
        toast.error('Fehler beim Speichern');
        console.error(error);
      } else {
        toast.success('Stunde aktualisiert');
        setDialogOpen(false);
        resetForm();
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from('timetable_entries')
        .insert(data);

      if (error) {
        if (error.code === '23505') {
          toast.error('Diese Stunde ist bereits belegt');
        } else {
          toast.error('Fehler beim Speichern');
          console.error(error);
        }
      } else {
        toast.success('Stunde hinzugefügt');
        setDialogOpen(false);
        resetForm();
        fetchData();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('timetable_entries')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Fehler beim Löschen');
    } else {
      toast.success('Stunde gelöscht');
      fetchData();
    }
  };

  const getEntryForSlot = (day: number, period: number) => {
    return entries.find(e => e.day_of_week === day && e.period === period);
  };

  // Find the max period that has an entry
  const maxPeriod = entries.length > 0 
    ? Math.max(...entries.map(e => e.period), 6) 
    : 6;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Stundenplan</h2>
            <p className="text-sm text-muted-foreground">Dein Wochenplan</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Hinzufügen</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingEntry ? 'Stunde bearbeiten' : 'Stunde hinzufügen'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tag</Label>
                  <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>{day}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Stunde</Label>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIODS.map(p => (
                        <SelectItem key={p} value={p.toString()}>{p}. Stunde</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Fach</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Fach auswählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {subjects.length === 0 && (
                  <p className="text-xs text-muted-foreground">Lege zuerst Fächer unter "Fächer" an.</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lehrerkürzel *</Label>
                  <Input
                    value={teacherShort}
                    onChange={(e) => setTeacherShort(e.target.value)}
                    placeholder="z.B. Mü, Sch"
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Raum</Label>
                  <Input
                    value={room}
                    onChange={(e) => setRoom(e.target.value)}
                    placeholder="z.B. A201"
                  />
                </div>
              </div>
              <Button onClick={handleSubmit} className="w-full">
                Speichern
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Timetable Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          <div className="grid grid-cols-6 gap-1">
            {/* Header row */}
            <div className="p-2 font-medium text-center text-muted-foreground text-sm">Std.</div>
            {DAYS.map((day, i) => (
              <div key={i} className="p-2 font-medium text-center text-sm bg-muted/50 rounded-t-lg">
                {day.slice(0, 2)}
              </div>
            ))}

            {/* Period rows */}
            {Array.from({ length: maxPeriod }, (_, i) => i + 1).map(periodNum => (
              <>
                <div key={`period-${periodNum}`} className="p-2 text-center text-muted-foreground text-sm flex items-center justify-center">
                  {periodNum}.
                </div>
                {DAYS.map((_, dayIndex) => {
                  const entry = getEntryForSlot(dayIndex + 1, periodNum);
                  return (
                    <Card
                      key={`${dayIndex}-${periodNum}`}
                      className={`p-2 min-h-[60px] flex flex-col justify-center items-center text-center cursor-pointer transition-all hover:bg-accent/50 ${
                        entry ? 'bg-primary/10 border-primary/30' : 'bg-card/50 border-dashed'
                      }`}
                      onClick={() => {
                        if (entry) {
                          openEdit(entry);
                        } else {
                          setDayOfWeek((dayIndex + 1).toString());
                          setPeriod(periodNum.toString());
                          setDialogOpen(true);
                        }
                      }}
                    >
                      {entry ? (
                        <>
                          <span className="font-medium text-xs truncate w-full">
                            {entry.subjects?.name || 'Kein Fach'}
                          </span>
                          <span className="text-xs text-muted-foreground">{entry.teacher_short}</span>
                          {entry.room && (
                            <span className="text-xs text-muted-foreground">{entry.room}</span>
                          )}
                        </>
                      ) : (
                        <Plus className="w-4 h-4 text-muted-foreground/50" />
                      )}
                    </Card>
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Entry List (for editing) */}
      {entries.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Alle Einträge ({entries.length})</h3>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {entries.map(entry => (
              <Card key={entry.id} className="p-3 bg-card/80 backdrop-blur-sm border-border/50 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">
                      {DAYS[entry.day_of_week - 1]}, {entry.period}. Std
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {entry.subjects?.name || 'Kein Fach'} • {entry.teacher_short}
                    {entry.room && ` • ${entry.room}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(entry)}>
                    <Edit2 className="w-3.5 h-3.5" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(entry.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
