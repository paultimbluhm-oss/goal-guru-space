import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Calendar, Clock, Stethoscope, Thermometer, FolderKanban, HelpCircle, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface TimetableEntry {
  id: string;
  day_of_week: number;
  period: number;
  teacher_short: string;
  subjects: { id: string; name: string } | null;
}

interface LessonAbsence {
  id: string;
  date: string;
  reason: 'sick' | 'doctor' | 'school_project' | 'other';
  excused: boolean;
  description: string | null;
  timetable_entry_id: string;
  timetable_entries: TimetableEntry;
}

interface AbsencesSectionProps {
  onBack: () => void;
}

const HOURS_PER_DAY = 8;
const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];

const reasonLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  sick: { label: 'Krank', icon: Thermometer, color: 'from-red-500 to-rose-600' },
  doctor: { label: 'Arztbesuch', icon: Stethoscope, color: 'from-blue-500 to-indigo-600' },
  school_project: { label: 'Schulprojekt', icon: FolderKanban, color: 'from-purple-500 to-violet-600' },
  other: { label: 'Sonstiges', icon: HelpCircle, color: 'from-gray-500 to-slate-600' },
};

export function AbsencesSection({ onBack }: AbsencesSectionProps) {
  const { user } = useAuth();
  const [absences, setAbsences] = useState<LessonAbsence[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reason, setReason] = useState<'sick' | 'doctor' | 'school_project' | 'other'>('sick');
  const [selectedLessons, setSelectedLessons] = useState<string[]>([]);
  const [description, setDescription] = useState('');

  const fetchData = async () => {
    if (!user) return;

    const [absencesRes, timetableRes] = await Promise.all([
      supabase
        .from('lesson_absences')
        .select('*, timetable_entries(id, day_of_week, period, teacher_short, subjects(id, name))')
        .eq('user_id', user.id)
        .order('date', { ascending: false }),
      supabase
        .from('timetable_entries')
        .select('id, day_of_week, period, teacher_short, subjects(id, name)')
        .eq('user_id', user.id)
        .order('period'),
    ]);

    if (absencesRes.error) console.error(absencesRes.error);
    if (timetableRes.error) console.error(timetableRes.error);

    setAbsences(absencesRes.data || []);
    setTimetableEntries(timetableRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  // Get the day of week for the selected date (1 = Monday, 5 = Friday)
  const getSelectedDayOfWeek = () => {
    const dateObj = new Date(date);
    const day = dateObj.getDay();
    // Convert Sunday (0) to 7, then map to 1-5 for Mon-Fri
    return day === 0 ? 7 : day;
  };

  // Get lessons for the selected day
  const getLessonsForSelectedDay = () => {
    const dayOfWeek = getSelectedDayOfWeek();
    return timetableEntries
      .filter(e => e.day_of_week === dayOfWeek)
      .sort((a, b) => a.period - b.period);
  };

  const handleSubmit = async () => {
    if (!user) return;

    if (selectedLessons.length === 0) {
      toast.error('Bitte wähle mindestens eine Stunde aus');
      return;
    }

    const inserts = selectedLessons.map(entryId => ({
      user_id: user.id,
      date,
      timetable_entry_id: entryId,
      reason,
      description: description || null,
      excused: false,
    }));

    const { error } = await supabase
      .from('lesson_absences')
      .insert(inserts);

    if (error) {
      if (error.code === '23505') {
        toast.error('Diese Stunden wurden bereits eingetragen');
      } else {
        toast.error('Fehler beim Speichern');
        console.error(error);
      }
    } else {
      toast.success(`${selectedLessons.length} Fehlstunde(n) eingetragen`);
      setDialogOpen(false);
      resetForm();
      fetchData();
    }
  };

  const toggleExcused = async (id: string, currentExcused: boolean) => {
    const { error } = await supabase
      .from('lesson_absences')
      .update({ excused: !currentExcused })
      .eq('id', id);

    if (error) {
      toast.error('Fehler beim Aktualisieren');
    } else {
      toast.success(currentExcused ? 'Als nicht entschuldigt markiert' : 'Als entschuldigt markiert');
      fetchData();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('lesson_absences')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Fehler beim Löschen');
    } else {
      toast.success('Fehlstunde gelöscht');
      fetchData();
    }
  };

  const resetForm = () => {
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setReason('sick');
    setSelectedLessons([]);
    setDescription('');
  };

  // Calculate statistics
  const totalHours = absences.length;
  const realAbsenceHours = absences.filter(a => a.reason === 'sick' || a.reason === 'doctor').length;
  const projectHours = absences.filter(a => a.reason === 'school_project').length;
  const excusedCount = absences.filter(a => a.excused).length;
  const unexcusedCount = absences.filter(a => !a.excused).length;

  const hoursToDay = (h: number) => (h / HOURS_PER_DAY).toFixed(1);

  // Group absences by teacher for overview
  const absencesByTeacher = absences.reduce((acc, absence) => {
    const teacher = absence.timetable_entries.teacher_short;
    if (!acc[teacher]) {
      acc[teacher] = { total: 0, excused: 0, unexcused: 0 };
    }
    acc[teacher].total++;
    if (absence.excused) {
      acc[teacher].excused++;
    } else {
      acc[teacher].unexcused++;
    }
    return acc;
  }, {} as Record<string, { total: number; excused: number; unexcused: number }>);

  const lessonsForDay = getLessonsForSelectedDay();
  const isWeekend = getSelectedDayOfWeek() > 5;

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
            <h2 className="text-xl md:text-2xl font-bold">Fehltage</h2>
            <p className="text-sm text-muted-foreground">Übersicht deiner Abwesenheiten</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Eintragen</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Fehlstunden eintragen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Datum</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setSelectedLessons([]);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Grund</Label>
                <Select value={reason} onValueChange={(v) => setReason(v as typeof reason)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sick">Krank</SelectItem>
                    <SelectItem value="doctor">Arztbesuch</SelectItem>
                    <SelectItem value="school_project">Schulprojekt</SelectItem>
                    <SelectItem value="other">Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Fehlende Stunden auswählen</Label>
                {timetableEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Bitte erstelle zuerst deinen Stundenplan.
                  </p>
                ) : isWeekend ? (
                  <p className="text-sm text-muted-foreground">
                    Am Wochenende gibt es keinen Unterricht.
                  </p>
                ) : lessonsForDay.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Keine Stunden für {DAYS[getSelectedDayOfWeek() - 1]} im Stundenplan.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {lessonsForDay.map((entry) => (
                      <div
                        key={entry.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                      >
                        <Checkbox
                          id={entry.id}
                          checked={selectedLessons.includes(entry.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedLessons([...selectedLessons, entry.id]);
                            } else {
                              setSelectedLessons(selectedLessons.filter(id => id !== entry.id));
                            }
                          }}
                        />
                        <label htmlFor={entry.id} className="flex-1 cursor-pointer text-sm">
                          <span className="font-medium">{entry.period}. Stunde</span>
                          <span className="text-muted-foreground ml-2">
                            {entry.subjects?.name || 'Kein Fach'} ({entry.teacher_short})
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Beschreibung (optional)</Label>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="z.B. Zahnarzt, Kopfschmerzen..."
                />
              </div>

              <Button 
                onClick={handleSubmit} 
                className="w-full"
                disabled={selectedLessons.length === 0}
              >
                {selectedLessons.length} Stunde(n) eintragen
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-gray-500 to-slate-600">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gesamt</p>
              <p className="text-lg font-bold">{totalHours} Std</p>
              <p className="text-xs text-muted-foreground">= {hoursToDay(totalHours)} Tage</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-600">
              <Thermometer className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Krank/Arzt</p>
              <p className="text-lg font-bold">{realAbsenceHours} Std</p>
              <p className="text-xs text-muted-foreground">= {hoursToDay(realAbsenceHours)} Tage</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600">
              <CheckCircle2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Entschuldigt</p>
              <p className="text-lg font-bold">{excusedCount} Std</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600">
              <XCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nicht entschuldigt</p>
              <p className="text-lg font-bold">{unexcusedCount} Std</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Absences by Teacher */}
      {Object.keys(absencesByTeacher).length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Nach Lehrer</h3>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(absencesByTeacher).map(([teacher, stats]) => (
              <Card key={teacher} className="p-3 bg-card/80 backdrop-blur-sm border-border/50">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{teacher}</span>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-500">{stats.excused}✓</span>
                    <span className="text-orange-500">{stats.unexcused}✗</span>
                    <span className="text-muted-foreground">= {stats.total}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Absences List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Alle Einträge</h3>

        {absences.length === 0 ? (
          <Card className="p-8 text-center bg-card/80 backdrop-blur-sm border-border/50">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Noch keine Fehlstunden eingetragen</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {absences.map((absence) => {
              const reasonInfo = reasonLabels[absence.reason];
              const Icon = reasonInfo.icon;
              const entry = absence.timetable_entries;

              return (
                <Card
                  key={absence.id}
                  className={`p-4 bg-card/80 backdrop-blur-sm border-border/50 flex items-center gap-4 ${
                    absence.excused ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-orange-500'
                  }`}
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${reasonInfo.color}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">
                        {format(new Date(absence.date), 'dd.MM.yyyy', { locale: de })}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {entry.period}. Std • {entry.subjects?.name || 'Kein Fach'}
                      </span>
                      <span className="text-sm font-medium text-primary">
                        ({entry.teacher_short})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted">
                        {reasonInfo.label}
                      </span>
                      {absence.description && (
                        <span className="text-xs text-muted-foreground truncate">
                          {absence.description}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={absence.excused ? 'default' : 'outline'}
                      size="sm"
                      className="gap-1"
                      onClick={() => toggleExcused(absence.id, absence.excused)}
                    >
                      {absence.excused ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Entschuldigt</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Offen</span>
                        </>
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(absence.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
