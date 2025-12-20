import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Calendar, Clock, Stethoscope, Thermometer, FolderKanban, HelpCircle, Trash2, CheckCircle2, XCircle, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { format, addDays, startOfWeek, getISOWeek, addWeeks, subWeeks, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';

interface TimetableEntry {
  id: string;
  day_of_week: number;
  period: number;
  teacher_short: string;
  week_type: string;
  subject_id: string | null;
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

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr'];
const DAYS_FULL = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag'];
const HOURS_PER_DAY = 8;

const REASONS = [
  { value: 'sick', label: 'Krank', icon: Thermometer, color: 'bg-red-500' },
  { value: 'doctor', label: 'Arzt', icon: Stethoscope, color: 'bg-blue-500' },
  { value: 'school_project', label: 'Schulprojekt', icon: FolderKanban, color: 'bg-yellow-500' },
  { value: 'other', label: 'Sonstiges', icon: HelpCircle, color: 'bg-gray-500' },
] as const;

type ReasonType = typeof REASONS[number]['value'];

export function AbsencesSection({ onBack }: AbsencesSectionProps) {
  const { user } = useAuth();
  const [absences, setAbsences] = useState<LessonAbsence[]>([]);
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Week navigation
  const [currentWeekStart, setCurrentWeekStart] = useState(() => 
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  
  // Selection state for adding absences
  const [selectedReason, setSelectedReason] = useState<ReasonType>('sick');
  const [selectedSlots, setSelectedSlots] = useState<Set<string>>(new Set());

  const weekDates = DAYS.map((_, i) => addDays(currentWeekStart, i));
  const currentWeekNum = getISOWeek(currentWeekStart);
  const isOddWeek = currentWeekNum % 2 === 1;

  const fetchData = async () => {
    if (!user) return;

    const weekEnd = addDays(currentWeekStart, 6);
    const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd');
    const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

    const [absencesRes, timetableRes] = await Promise.all([
      supabase
        .from('lesson_absences')
        .select('*, timetable_entries(id, day_of_week, period, teacher_short, week_type, subject_id, subjects(id, name))')
        .eq('user_id', user.id)
        .gte('date', weekStartStr)
        .lte('date', weekEndStr),
      supabase
        .from('timetable_entries')
        .select('id, day_of_week, period, teacher_short, week_type, subject_id, subjects(id, name)')
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
    setSelectedSlots(new Set());
  }, [user, currentWeekStart]);

  // Get entry for a specific slot, respecting A/B weeks
  const getEntryForSlot = (day: number, period: number) => {
    return timetableEntries.find(e => {
      if (e.day_of_week !== day || e.period !== period) return false;
      if (e.week_type === 'both') return true;
      if (e.week_type === 'odd' && isOddWeek) return true;
      if (e.week_type === 'even' && !isOddWeek) return true;
      return false;
    });
  };

  // Check if two consecutive periods form a double lesson
  const isStartOfDouble = (day: number, period: number) => {
    const current = getEntryForSlot(day, period);
    const next = getEntryForSlot(day, period + 1);
    if (!current || !next) return false;
    return current.subject_id === next.subject_id && 
           current.teacher_short === next.teacher_short &&
           current.week_type === next.week_type &&
           period !== 6 && period + 1 !== 7;
  };

  const isSecondOfDouble = (day: number, period: number) => {
    const current = getEntryForSlot(day, period);
    const prev = getEntryForSlot(day, period - 1);
    if (!current || !prev) return false;
    return current.subject_id === prev.subject_id && 
           current.teacher_short === prev.teacher_short &&
           current.week_type === prev.week_type &&
           period !== 7 && period - 1 !== 7;
  };

  // Get absence for a slot
  const getAbsenceForSlot = (date: Date, entryId: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return absences.find(a => a.date === dateStr && a.timetable_entry_id === entryId);
  };

  // Build visible periods (1-9 except 7 which is lunch)
  const visiblePeriods = [1, 2, 3, 4, 5, 6, 8, 9];

  // Group consecutive periods into display slots
  const getDisplaySlots = (dayIndex: number) => {
    const day = dayIndex + 1;
    const slots: { period: number; isDouble: boolean; entry: TimetableEntry | undefined }[] = [];
    
    for (const period of visiblePeriods) {
      const entry = getEntryForSlot(day, period);
      if (isSecondOfDouble(day, period)) continue; // Skip second part of double
      
      slots.push({
        period,
        isDouble: isStartOfDouble(day, period),
        entry,
      });
    }
    
    return slots;
  };

  // Handle slot selection
  const toggleSlotSelection = (date: Date, entry: TimetableEntry, isDouble: boolean) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const key = `${dateStr}:${entry.id}`;
    const newSelected = new Set(selectedSlots);
    
    if (newSelected.has(key)) {
      newSelected.delete(key);
      // If double lesson, also remove the second period
      if (isDouble) {
        const nextEntry = getEntryForSlot(entry.day_of_week, entry.period + 1);
        if (nextEntry) {
          newSelected.delete(`${dateStr}:${nextEntry.id}`);
        }
      }
    } else {
      newSelected.add(key);
      // If double lesson, also add the second period
      if (isDouble) {
        const nextEntry = getEntryForSlot(entry.day_of_week, entry.period + 1);
        if (nextEntry) {
          newSelected.add(`${dateStr}:${nextEntry.id}`);
        }
      }
    }
    
    setSelectedSlots(newSelected);
  };

  // Submit selected absences
  const handleSubmitAbsences = async () => {
    if (!user || selectedSlots.size === 0) return;

    const inserts = Array.from(selectedSlots).map(key => {
      const [dateStr, entryId] = key.split(':');
      return {
        user_id: user.id,
        date: dateStr,
        timetable_entry_id: entryId,
        reason: selectedReason,
        excused: false,
      };
    });

    const { error } = await supabase
      .from('lesson_absences')
      .upsert(inserts, { onConflict: 'user_id,date,timetable_entry_id' });

    if (error) {
      toast.error('Fehler beim Speichern');
      console.error(error);
    } else {
      toast.success(`${selectedSlots.size} Fehlstunde(n) eingetragen`);
      setSelectedSlots(new Set());
      fetchData();
    }
  };

  // Toggle excused status - also updates double lessons together
  const toggleExcused = async (absence: LessonAbsence, currentExcused: boolean) => {
    const idsToUpdate = [absence.id];
    
    // Check if this is part of a double lesson
    const entry = absence.timetable_entries;
    const nextEntry = getEntryForSlot(entry.day_of_week, entry.period + 1);
    const prevEntry = getEntryForSlot(entry.day_of_week, entry.period - 1);
    
    // Check if next period is part of double lesson
    if (nextEntry && nextEntry.subject_id === entry.subject_id && nextEntry.teacher_short === entry.teacher_short) {
      const nextAbsence = getAbsenceForSlot(new Date(absence.date), nextEntry.id);
      if (nextAbsence) idsToUpdate.push(nextAbsence.id);
    }
    
    // Check if prev period is part of double lesson
    if (prevEntry && prevEntry.subject_id === entry.subject_id && prevEntry.teacher_short === entry.teacher_short) {
      const prevAbsence = getAbsenceForSlot(new Date(absence.date), prevEntry.id);
      if (prevAbsence) idsToUpdate.push(prevAbsence.id);
    }

    const { error } = await supabase
      .from('lesson_absences')
      .update({ excused: !currentExcused })
      .in('id', idsToUpdate);

    if (error) {
      toast.error('Fehler beim Aktualisieren');
    } else {
      toast.success(currentExcused ? 'Als nicht entschuldigt markiert' : 'Als entschuldigt markiert');
      fetchData();
    }
  };

  // Delete absence
  const handleDeleteAbsence = async (id: string) => {
    const { error } = await supabase
      .from('lesson_absences')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Fehler beim Löschen');
    } else {
      toast.success('Gelöscht');
      fetchData();
    }
  };

  // Delete all absences for a slot (including double lessons)
  const handleDeleteSlot = async (date: Date, entry: TimetableEntry, isDouble: boolean) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const idsToDelete = [entry.id];
    
    if (isDouble) {
      const nextEntry = getEntryForSlot(entry.day_of_week, entry.period + 1);
      if (nextEntry) idsToDelete.push(nextEntry.id);
    }

    const { error } = await supabase
      .from('lesson_absences')
      .delete()
      .eq('user_id', user!.id)
      .eq('date', dateStr)
      .in('timetable_entry_id', idsToDelete);

    if (error) {
      toast.error('Fehler beim Löschen');
    } else {
      toast.success('Fehlzeit entfernt');
      fetchData();
    }
  };

  // Statistics
  const totalHours = absences.length;
  const excusedCount = absences.filter(a => a.excused).length;
  const unexcusedCount = absences.filter(a => !a.excused).length;

  const goToPreviousWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1));
  const goToNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1));
  const goToCurrentWeek = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

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
            <p className="text-sm text-muted-foreground">Tippe auf Stunden zum Auswählen</p>
          </div>
        </div>
      </div>

      {/* Reason Selector */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Grund auswählen:</p>
        <div className="flex flex-wrap gap-2">
          {REASONS.map(reason => {
            const Icon = reason.icon;
            const isActive = selectedReason === reason.value;
            return (
              <Button
                key={reason.value}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className={`gap-2 ${isActive ? '' : 'opacity-60'}`}
                onClick={() => setSelectedReason(reason.value)}
              >
                <Icon className="w-4 h-4" />
                {reason.label}
              </Button>
            );
          })}
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
          <div className="flex items-center justify-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${isOddWeek ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
              {isOddWeek ? 'A-Woche' : 'B-Woche'}
            </span>
            <span className="text-xs text-muted-foreground">(KW {currentWeekNum})</span>
          </div>
          <Button variant="link" size="sm" onClick={goToCurrentWeek} className="text-muted-foreground">
            Zur aktuellen Woche
          </Button>
        </div>
        <Button variant="outline" size="icon" onClick={goToNextWeek}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Weekly Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Day Headers */}
          <div className="grid grid-cols-5 gap-2 mb-2">
            {weekDates.map((date, i) => (
              <div key={i} className="text-center p-2 bg-muted/50 rounded-lg">
                <div className="font-medium">{DAYS[i]}</div>
                <div className="text-xs text-muted-foreground">{format(date, 'dd.MM')}</div>
              </div>
            ))}
          </div>

          {/* Slots Grid */}
          <div className="grid grid-cols-5 gap-2">
            {weekDates.map((date, dayIndex) => (
              <div key={dayIndex} className="space-y-1">
                {getDisplaySlots(dayIndex).map(slot => {
                  if (!slot.entry) {
                    return (
                      <div 
                        key={slot.period} 
                        className={`p-2 text-center text-xs text-muted-foreground/40 border border-dashed border-border/30 rounded ${slot.isDouble ? 'min-h-[70px]' : 'min-h-[40px]'}`}
                      >
                        {slot.period}.{slot.isDouble && `+${slot.period + 1}.`}
                      </div>
                    );
                  }

                  const absence = getAbsenceForSlot(date, slot.entry.id);
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const isSelected = selectedSlots.has(`${dateStr}:${slot.entry.id}`);
                  
                  // Check if double lesson has absence
                  let doubleHasAbsence = false;
                  let doubleAbsence: LessonAbsence | undefined;
                  if (slot.isDouble) {
                    const nextEntry = getEntryForSlot(slot.entry.day_of_week, slot.entry.period + 1);
                    if (nextEntry) {
                      doubleAbsence = getAbsenceForSlot(date, nextEntry.id);
                      doubleHasAbsence = !!(absence || doubleAbsence);
                    }
                  }

                  const hasAbsence = absence || doubleHasAbsence;
                  const displayAbsence = absence || doubleAbsence;

                  // Get color based on absence reason
                  const getSlotBg = () => {
                    if (isSelected) return 'bg-primary/30 border-primary ring-2 ring-primary';
                    if (hasAbsence) {
                      const reason = displayAbsence?.reason || 'sick';
                      if (reason === 'school_project') return 'bg-yellow-500/20 border-yellow-500/50';
                      return 'bg-red-500/20 border-red-500/50';
                    }
                    return 'bg-green-500/10 border-green-500/30 hover:bg-green-500/20';
                  };

                  return (
                    <div
                      key={slot.period}
                      className={`p-2 rounded border cursor-pointer transition-all ${getSlotBg()} ${slot.isDouble ? 'min-h-[70px]' : 'min-h-[40px]'}`}
                      onClick={() => {
                        if (hasAbsence) {
                          handleDeleteSlot(date, slot.entry!, slot.isDouble);
                        } else {
                          toggleSlotSelection(date, slot.entry!, slot.isDouble);
                        }
                      }}
                    >
                      <div className="flex flex-col items-center justify-center h-full gap-0.5">
                        <span className="text-[10px] text-muted-foreground">
                          {slot.period}.{slot.isDouble && `-${slot.period + 1}.`} Std
                        </span>
                        <span className="text-xs font-medium truncate max-w-full">
                          {slot.entry.subjects?.name?.slice(0, 6) || '-'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {slot.entry.teacher_short}
                        </span>
                        {hasAbsence && displayAbsence && (
                          <div className="flex items-center gap-1 mt-0.5">
                            {displayAbsence.excused ? (
                              <CheckCircle2 className="w-3 h-3 text-green-500" />
                            ) : (
                              <XCircle className="w-3 h-3 text-orange-500" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selection Action Bar */}
      {selectedSlots.size > 0 && (
        <Card className="p-4 bg-primary/10 border-primary/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" />
            <span className="font-medium">{selectedSlots.size} Stunde(n) ausgewählt</span>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => setSelectedSlots(new Set())}>
              Abbrechen
            </Button>
            <Button size="sm" onClick={handleSubmitAbsences}>
              Eintragen
            </Button>
          </div>
        </Card>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30" />
          <span>Anwesend</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-500/20 border border-red-500/50" />
          <span>Abwesend</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-500/20 border border-yellow-500/50" />
          <span>Schulprojekt</span>
        </div>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3 h-3 text-green-500" />
          <span>Entschuldigt</span>
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle className="w-3 h-3 text-orange-500" />
          <span>Nicht entschuldigt</span>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="p-3 bg-card/80 backdrop-blur-sm border-border/50 text-center">
          <div className="text-2xl font-bold">{totalHours}</div>
          <div className="text-xs text-muted-foreground">Diese Woche</div>
        </Card>
        <Card className="p-3 bg-card/80 backdrop-blur-sm border-border/50 text-center">
          <div className="text-2xl font-bold text-green-500">{excusedCount}</div>
          <div className="text-xs text-muted-foreground">Entschuldigt</div>
        </Card>
        <Card className="p-3 bg-card/80 backdrop-blur-sm border-border/50 text-center">
          <div className="text-2xl font-bold text-orange-500">{unexcusedCount}</div>
          <div className="text-xs text-muted-foreground">Offen</div>
        </Card>
      </div>

      {/* This Week's Absences List - grouped by double lessons */}
      {absences.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold">Fehlzeiten dieser Woche</h3>
          <div className="space-y-1">
            {(() => {
              // Group absences by date and teacher to detect double lessons
              const grouped: { absence: LessonAbsence; isDouble: boolean; secondPeriod?: number }[] = [];
              const processedIds = new Set<string>();
              
              for (const absence of absences) {
                if (processedIds.has(absence.id)) continue;
                
                const entry = absence.timetable_entries;
                const nextEntry = getEntryForSlot(entry.day_of_week, entry.period + 1);
                
                // Check if next period is a double lesson partner
                let isDouble = false;
                let secondPeriod: number | undefined;
                
                if (nextEntry && nextEntry.subject_id === entry.subject_id && nextEntry.teacher_short === entry.teacher_short) {
                  const nextAbsence = absences.find(
                    a => a.date === absence.date && a.timetable_entry_id === nextEntry.id
                  );
                  if (nextAbsence) {
                    isDouble = true;
                    secondPeriod = entry.period + 1;
                    processedIds.add(nextAbsence.id);
                  }
                }
                
                processedIds.add(absence.id);
                grouped.push({ absence, isDouble, secondPeriod });
              }
              
              return grouped.map(({ absence, isDouble, secondPeriod }) => {
                const reason = REASONS.find(r => r.value === absence.reason);
                const Icon = reason?.icon || HelpCircle;
                const entry = absence.timetable_entries;
                
                return (
                  <div
                    key={absence.id}
                    className={`flex items-center gap-3 p-2 rounded-lg bg-card/80 border ${
                      absence.excused ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-orange-500'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${reason?.color.replace('bg-', 'text-')}`} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium">
                        {format(new Date(absence.date), 'EEE dd.MM', { locale: de })}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {isDouble ? `${entry.period}.-${secondPeriod}. Std` : `${entry.period}. Std`} - {entry.subjects?.name || '-'}
                      </span>
                      {isDouble && (
                        <span className="text-xs text-primary ml-1">(Doppelstd.)</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={absence.excused ? 'text-green-500' : 'text-orange-500'}
                      onClick={() => toggleExcused(absence, absence.excused)}
                    >
                      {absence.excused ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive h-8 w-8"
                      onClick={() => handleDeleteAbsence(absence.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
