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
import { ArrowLeft, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, BookOpen, Coffee, UtensilsCrossed } from 'lucide-react';
import { toast } from 'sonner';
import { format, addWeeks, subWeeks, startOfWeek, addDays, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';

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

interface LessonAbsence {
  id: string;
  date: string;
  reason: 'sick' | 'doctor' | 'school_project' | 'other';
  excused: boolean;
  timetable_entry_id: string;
}

interface Homework {
  id: string;
  title: string;
  due_date: string;
  completed: boolean;
  subject_id: string;
}

interface TimetableSectionProps {
  onBack: () => void;
}

const DAYS = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
// Periods with break info: period 7 is lunch
const PERIOD_STRUCTURE = [
  { period: 1, showBreakAfter: false },
  { period: 2, showBreakAfter: true, breakDuration: '20 Min' },
  { period: 3, showBreakAfter: false },
  { period: 4, showBreakAfter: true, breakDuration: '20 Min' },
  { period: 5, showBreakAfter: false },
  { period: 6, showBreakAfter: false },
  { period: 7, isLunch: true, lunchDuration: '65 Min' },
  { period: 8, showBreakAfter: false },
  { period: 9, showBreakAfter: false },
];

export function TimetableSection({ onBack }: TimetableSectionProps) {
  const { user } = useAuth();
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [absences, setAbsences] = useState<LessonAbsence[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  
  // Week navigation
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // Form state for timetable entry
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [period, setPeriod] = useState('1');
  const [subjectId, setSubjectId] = useState<string>('');
  const [teacherShort, setTeacherShort] = useState('');
  const [room, setRoom] = useState('');
  const [isDoubleLesson, setIsDoubleLesson] = useState(false);

  // Absence dialog state
  const [absenceDialogOpen, setAbsenceDialogOpen] = useState(false);
  const [absenceFromDate, setAbsenceFromDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [absenceFromPeriod, setAbsenceFromPeriod] = useState('1');
  const [absenceToDate, setAbsenceToDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [absenceToPeriod, setAbsenceToPeriod] = useState('9');
  const [absenceReason, setAbsenceReason] = useState<'sick' | 'doctor' | 'school_project' | 'other'>('sick');
  const [absenceDescription, setAbsenceDescription] = useState('');

  const fetchData = async () => {
    if (!user) return;

    const weekEnd = addDays(currentWeekStart, 6);
    const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd');
    const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

    const [entriesRes, subjectsRes, absencesRes, homeworkRes] = await Promise.all([
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
      supabase
        .from('lesson_absences')
        .select('id, date, reason, excused, timetable_entry_id')
        .eq('user_id', user.id)
        .gte('date', weekStartStr)
        .lte('date', weekEndStr),
      supabase
        .from('homework')
        .select('id, title, due_date, completed, subject_id')
        .eq('user_id', user.id)
        .gte('due_date', weekStartStr)
        .lte('due_date', weekEndStr),
    ]);

    if (entriesRes.error) console.error(entriesRes.error);
    if (subjectsRes.error) console.error(subjectsRes.error);
    if (absencesRes.error) console.error(absencesRes.error);
    if (homeworkRes.error) console.error(homeworkRes.error);

    setEntries(entriesRes.data || []);
    setSubjects(subjectsRes.data || []);
    setAbsences(absencesRes.data || []);
    setHomework(homeworkRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user, currentWeekStart]);

  const resetForm = () => {
    setDayOfWeek('1');
    setPeriod('1');
    setSubjectId('');
    setTeacherShort('');
    setRoom('');
    setIsDoubleLesson(false);
    setEditingEntry(null);
  };

  const openEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setDayOfWeek(entry.day_of_week.toString());
    setPeriod(entry.period.toString());
    setSubjectId(entry.subject_id || '');
    setTeacherShort(entry.teacher_short);
    setRoom(entry.room || '');
    setIsDoubleLesson(false);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!teacherShort.trim()) {
      toast.error('Bitte gib ein Lehrerkürzel ein');
      return;
    }

    const periodNum = parseInt(period);
    const dayNum = parseInt(dayOfWeek);

    // Check if it's lunch period
    if (periodNum === 7) {
      toast.error('Die 7. Stunde ist Mittagspause');
      return;
    }

    // For double lessons, check if next period is valid
    if (isDoubleLesson) {
      const nextPeriod = periodNum + 1;
      if (nextPeriod > 9 || nextPeriod === 7) {
        toast.error('Doppelstunde kann hier nicht eingetragen werden');
        return;
      }
    }

    const baseData = {
      user_id: user.id,
      day_of_week: dayNum,
      subject_id: subjectId || null,
      teacher_short: teacherShort.trim(),
      room: room.trim() || null,
    };

    if (editingEntry) {
      const { error } = await supabase
        .from('timetable_entries')
        .update({ ...baseData, period: periodNum })
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
      // Insert first period
      const { error: error1 } = await supabase
        .from('timetable_entries')
        .upsert({ ...baseData, period: periodNum }, { onConflict: 'user_id,day_of_week,period' });

      if (error1) {
        toast.error('Fehler beim Speichern');
        console.error(error1);
        return;
      }

      // Insert second period if double lesson
      if (isDoubleLesson) {
        const nextPeriod = periodNum + 1;
        const { error: error2 } = await supabase
          .from('timetable_entries')
          .upsert({ ...baseData, period: nextPeriod }, { onConflict: 'user_id,day_of_week,period' });

        if (error2) {
          toast.error('Fehler beim Speichern der zweiten Stunde');
          console.error(error2);
          return;
        }
      }

      toast.success(isDoubleLesson ? 'Doppelstunde hinzugefügt' : 'Stunde hinzugefügt');
      setDialogOpen(false);
      resetForm();
      fetchData();
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

  const handleAbsenceSubmit = async () => {
    if (!user) return;

    const fromDate = new Date(absenceFromDate);
    const toDate = new Date(absenceToDate);
    const fromPeriod = parseInt(absenceFromPeriod);
    const toPeriod = parseInt(absenceToPeriod);

    if (fromDate > toDate) {
      toast.error('Das Startdatum muss vor dem Enddatum liegen');
      return;
    }

    const absenceEntries: { 
      user_id: string; 
      date: string; 
      timetable_entry_id: string; 
      reason: typeof absenceReason;
      description: string | null;
      excused: boolean;
    }[] = [];

    let currentDate = new Date(fromDate);
    while (currentDate <= toDate) {
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        const dateStr = format(currentDate, 'yyyy-MM-dd');
        const isFirstDay = isSameDay(currentDate, fromDate);
        const isLastDay = isSameDay(currentDate, toDate);
        
        let startPeriod = 1;
        let endPeriod = 9;
        
        if (isFirstDay && isLastDay) {
          startPeriod = fromPeriod;
          endPeriod = toPeriod;
        } else if (isFirstDay) {
          startPeriod = fromPeriod;
        } else if (isLastDay) {
          endPeriod = toPeriod;
        }

        const dayEntries = entries.filter(
          e => e.day_of_week === dayOfWeek && e.period >= startPeriod && e.period <= endPeriod && e.period !== 7
        );

        for (const entry of dayEntries) {
          absenceEntries.push({
            user_id: user.id,
            date: dateStr,
            timetable_entry_id: entry.id,
            reason: absenceReason,
            description: absenceDescription || null,
            excused: false,
          });
        }
      }
      currentDate = addDays(currentDate, 1);
    }

    if (absenceEntries.length === 0) {
      toast.error('Keine Stunden im gewählten Zeitraum gefunden');
      return;
    }

    const { error } = await supabase
      .from('lesson_absences')
      .upsert(absenceEntries, { 
        onConflict: 'user_id,date,timetable_entry_id',
        ignoreDuplicates: true 
      });

    if (error) {
      toast.error('Fehler beim Speichern');
      console.error(error);
    } else {
      toast.success(`${absenceEntries.length} Fehlstunde(n) eingetragen`);
      setAbsenceDialogOpen(false);
      setAbsenceFromDate(format(new Date(), 'yyyy-MM-dd'));
      setAbsenceToDate(format(new Date(), 'yyyy-MM-dd'));
      setAbsenceFromPeriod('1');
      setAbsenceToPeriod('9');
      setAbsenceReason('sick');
      setAbsenceDescription('');
      fetchData();
    }
  };

  const getEntryForSlot = (day: number, periodNum: number) => {
    return entries.find(e => e.day_of_week === day && e.period === periodNum);
  };

  const getAbsenceForSlot = (date: Date, entry: TimetableEntry | undefined) => {
    if (!entry) return null;
    const dateStr = format(date, 'yyyy-MM-dd');
    return absences.find(a => a.date === dateStr && a.timetable_entry_id === entry.id);
  };

  const getHomeworkForDay = (date: Date, subjectId: string | null) => {
    if (!subjectId) return [];
    const dateStr = format(date, 'yyyy-MM-dd');
    return homework.filter(h => h.due_date === dateStr && h.subject_id === subjectId);
  };

  const getSlotColor = (absence: LessonAbsence | null) => {
    if (!absence) return 'bg-green-500/20 border-green-500/30 text-green-700 dark:text-green-300';
    if (absence.reason === 'school_project') {
      return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-700 dark:text-yellow-300';
    }
    return 'bg-red-500/20 border-red-500/30 text-red-700 dark:text-red-300';
  };

  // Check if current entry is part of a double lesson (same subject/teacher as previous period)
  const isPartOfDouble = (day: number, periodNum: number) => {
    const current = getEntryForSlot(day, periodNum);
    const prev = getEntryForSlot(day, periodNum - 1);
    if (!current || !prev) return false;
    return current.subject_id === prev.subject_id && 
           current.teacher_short === prev.teacher_short &&
           periodNum !== 7 && periodNum - 1 !== 7;
  };

  const weekDates = DAYS.map((_, i) => addDays(currentWeekStart, i));

  const goToPreviousWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const goToCurrentWeek = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Get available periods for selection (exclude lunch)
  const availablePeriods = PERIOD_STRUCTURE.filter(p => !p.isLunch).map(p => p.period);

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
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Stundenplan</h2>
            <p className="text-sm text-muted-foreground">Kalenderansicht mit Fehltagen</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Dialog open={absenceDialogOpen} onOpenChange={setAbsenceDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Fehltag</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Fehltage eintragen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Von Datum</Label>
                    <Input
                      type="date"
                      value={absenceFromDate}
                      onChange={(e) => setAbsenceFromDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Von Stunde</Label>
                    <Select value={absenceFromPeriod} onValueChange={setAbsenceFromPeriod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePeriods.map(p => (
                          <SelectItem key={p} value={p.toString()}>{p}. Stunde</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Bis Datum</Label>
                    <Input
                      type="date"
                      value={absenceToDate}
                      onChange={(e) => setAbsenceToDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Bis Stunde</Label>
                    <Select value={absenceToPeriod} onValueChange={setAbsenceToPeriod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePeriods.map(p => (
                          <SelectItem key={p} value={p.toString()}>{p}. Stunde</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Grund</Label>
                  <Select value={absenceReason} onValueChange={(v) => setAbsenceReason(v as typeof absenceReason)}>
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
                  <Label>Beschreibung (optional)</Label>
                  <Input
                    value={absenceDescription}
                    onChange={(e) => setAbsenceDescription(e.target.value)}
                    placeholder="z.B. Grippe, Zahnarzt..."
                  />
                </div>
                <Button onClick={handleAbsenceSubmit} className="w-full">
                  Fehltage eintragen
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Stunde</span>
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
                        {availablePeriods.map(p => (
                          <SelectItem key={p} value={p.toString()}>{p}. Stunde</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {!editingEntry && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="doubleLesson"
                      checked={isDoubleLesson}
                      onCheckedChange={(checked) => setIsDoubleLesson(checked as boolean)}
                    />
                    <label
                      htmlFor="doubleLesson"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Doppelstunde (belegt auch die nächste Stunde)
                    </label>
                  </div>
                )}

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
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between gap-4">
        <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <div className="text-center">
          <p className="font-medium">
            {format(currentWeekStart, 'dd. MMM', { locale: de })} - {format(addDays(currentWeekStart, 4), 'dd. MMM yyyy', { locale: de })}
          </p>
          <Button variant="link" size="sm" onClick={goToCurrentWeek} className="text-muted-foreground">
            Zur aktuellen Woche
          </Button>
        </div>
        <Button variant="outline" size="icon" onClick={goToNextWeek}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30" />
          <span>Anwesend</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500/30" />
          <span>Schulprojekt</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30" />
          <span>Abwesend</span>
        </div>
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-500" />
          <span>Hausaufgabe</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          <div className="grid grid-cols-6 gap-1">
            {/* Header row */}
            <div className="p-2 font-medium text-center text-muted-foreground text-sm">Std.</div>
            {weekDates.map((date, i) => (
              <div key={i} className="p-2 font-medium text-center text-sm bg-muted/50 rounded-t-lg">
                <div>{DAYS[i].slice(0, 2)}</div>
                <div className="text-xs text-muted-foreground">{format(date, 'dd.MM')}</div>
              </div>
            ))}

            {/* Period rows with breaks */}
            {PERIOD_STRUCTURE.map((periodInfo, idx) => (
              <>
                {/* Lunch break row */}
                {periodInfo.isLunch ? (
                  <div key={`lunch-${idx}`} className="col-span-6 py-2">
                    <div className="flex items-center justify-center gap-2 py-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                      <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                        Mittagspause ({periodInfo.lunchDuration})
                      </span>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Period label */}
                    <div key={`period-${periodInfo.period}`} className="p-2 text-center text-muted-foreground text-sm flex items-center justify-center">
                      {periodInfo.period}.
                    </div>
                    {/* Day cells */}
                    {weekDates.map((date, dayIndex) => {
                      const entry = getEntryForSlot(dayIndex + 1, periodInfo.period);
                      const absence = getAbsenceForSlot(date, entry);
                      const dayHomework = entry ? getHomeworkForDay(date, entry.subject_id) : [];
                      const partOfDouble = isPartOfDouble(dayIndex + 1, periodInfo.period);
                      
                      if (!entry) {
                        return (
                          <Card
                            key={`${dayIndex}-${periodInfo.period}`}
                            className="p-2 min-h-[60px] flex flex-col justify-center items-center text-center bg-card/30 border-dashed cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => {
                              setDayOfWeek((dayIndex + 1).toString());
                              setPeriod(periodInfo.period.toString());
                              setDialogOpen(true);
                            }}
                          >
                            <Plus className="w-4 h-4 text-muted-foreground/30" />
                          </Card>
                        );
                      }

                      return (
                        <Card
                          key={`${dayIndex}-${periodInfo.period}`}
                          className={`p-2 min-h-[60px] flex flex-col justify-between text-center cursor-pointer transition-all hover:scale-[1.02] border ${getSlotColor(absence)} ${
                            partOfDouble ? 'rounded-t-none border-t-0 -mt-1' : ''
                          }`}
                          onClick={() => openEdit(entry)}
                        >
                          <div>
                            <span className="font-medium text-xs truncate block">
                              {entry.subjects?.name || 'Kein Fach'}
                            </span>
                            <span className="text-xs opacity-70">{entry.teacher_short}</span>
                          </div>
                          {dayHomework.length > 0 && (
                            <div className="flex items-center justify-center gap-1 mt-1">
                              <BookOpen className="w-3 h-3 text-blue-500" />
                              <span className="text-xs text-blue-500">{dayHomework.length}</span>
                            </div>
                          )}
                        </Card>
                      );
                    })}

                    {/* Break row after certain periods */}
                    {periodInfo.showBreakAfter && (
                      <div key={`break-${periodInfo.period}`} className="col-span-6 py-1">
                        <div className="flex items-center justify-center gap-2 py-1.5 bg-muted/50 rounded border border-border/30">
                          <Coffee className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Pause ({periodInfo.breakDuration})
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </>
            ))}
          </div>
        </div>
      </div>

      {/* Entry List */}
      {entries.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-semibold text-lg">Stundenplan-Einträge bearbeiten</h3>
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
