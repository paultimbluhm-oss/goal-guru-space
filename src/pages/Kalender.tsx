import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getSupabase } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CalendarDays, 
  ChevronLeft, 
  ChevronRight, 
  Clock,
} from 'lucide-react';
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday, getWeek } from 'date-fns';
import { de } from 'date-fns/locale';

interface TimetableEntry {
  id: string;
  day_of_week: number;
  period: number;
  room: string | null;
  teacher_short: string;
  subject_id: string | null;
  week_type: string | null;
  subject?: {
    name: string;
    short_name: string | null;
  } | null;
}

// Lesson times based on user specifications
const LESSON_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '08:00', end: '08:45' },
  2: { start: '08:45', end: '09:30' },
  3: { start: '09:50', end: '10:35' },
  4: { start: '10:35', end: '11:20' },
  5: { start: '11:40', end: '12:25' },
  6: { start: '12:25', end: '13:10' },
  7: { start: '14:15', end: '15:00' },
  8: { start: '15:00', end: '15:45' },
  9: { start: '15:45', end: '16:30' },
  10: { start: '16:30', end: '17:15' },
};

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const DAY_NAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const DAY_NAMES_FULL = ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'];

export default function Kalender() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchTimetable();
  }, [user]);

  // Scroll to 7:00 on mount
  useEffect(() => {
    if (scrollRef.current) {
      const hourHeight = 60;
      scrollRef.current.scrollTop = 7 * hourHeight;
    }
  }, [loadingData]);

  const fetchTimetable = async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('timetable_entries')
      .select(`
        *,
        subject:subjects(name, short_name)
      `)
      .order('period');

    if (!error && data) {
      setTimetableEntries(data);
    }
    setLoadingData(false);
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekNumber = getWeek(currentWeek, { weekStartsOn: 1 });
  const isEvenWeek = weekNumber % 2 === 0;
  const currentWeekType = isEvenWeek ? 'B' : 'A';

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  interface MergedEntry {
    id: string;
    startPeriod: number;
    endPeriod: number;
    room: string | null;
    teacher_short: string;
    subject_id: string | null;
    week_type: string | null;
    subject?: {
      name: string;
      short_name: string | null;
    } | null;
    isDouble: boolean;
  }

  const getMergedEntriesForDay = (dayOfWeek: number): MergedEntry[] => {
    const dayEntries = timetableEntries.filter(entry => {
      if (entry.day_of_week !== dayOfWeek) return false;
      if (!entry.week_type || entry.week_type === 'both') return true;
      return entry.week_type.toUpperCase() === currentWeekType;
    }).sort((a, b) => a.period - b.period);

    const merged: MergedEntry[] = [];
    let i = 0;

    while (i < dayEntries.length) {
      const current = dayEntries[i];
      const next = dayEntries[i + 1];

      // Check if this is a double lesson (same subject, consecutive periods)
      const isConsecutive = next && 
        current.subject_id && 
        current.subject_id === next.subject_id &&
        next.period === current.period + 1 &&
        // Check they're in the same block (not split by a break)
        !([2, 4, 6].includes(current.period));

      if (isConsecutive) {
        merged.push({
          id: current.id,
          startPeriod: current.period,
          endPeriod: next.period,
          room: current.room,
          teacher_short: current.teacher_short,
          subject_id: current.subject_id,
          week_type: current.week_type,
          subject: current.subject,
          isDouble: true,
        });
        i += 2; // Skip next entry as it's merged
      } else {
        merged.push({
          id: current.id,
          startPeriod: current.period,
          endPeriod: current.period,
          room: current.room,
          teacher_short: current.teacher_short,
          subject_id: current.subject_id,
          week_type: current.week_type,
          subject: current.subject,
          isDouble: false,
        });
        i += 1;
      }
    }

    return merged;
  };

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const getEventStyle = (startPeriod: number, endPeriod: number) => {
    const startTime = LESSON_TIMES[startPeriod]?.start;
    const endTime = LESSON_TIMES[endPeriod]?.end;
    if (!startTime || !endTime) return { top: '0px', height: '0px' };
    
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const top = (startMinutes / 60) * 60;
    const height = ((endMinutes - startMinutes) / 60) * 60;
    return { top: `${top}px`, height: `${height}px` };
  };

  const getCurrentTimePosition = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return (currentMinutes / 60) * 60; // 60px per hour
  };

  const currentTimePosition = getCurrentTimePosition();
  const todayIndex = weekDays.findIndex(day => isToday(day));

  if (loading || !user) return null;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1800px] mx-auto">
        {/* Hero Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-card via-card to-secondary/30 border border-border/50 p-6 md:p-8">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute inset-0 industrial-grid opacity-20" />
          
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 md:p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/5 border border-blue-500/20">
                <CalendarDays className="w-6 h-6 md:w-8 md:h-8 text-blue-500" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">Kalender</h1>
                <p className="text-muted-foreground text-sm md:text-base">
                  KW {weekNumber} - {format(weekStart, 'd. MMM', { locale: de })} bis {format(addDays(weekStart, 6), 'd. MMM yyyy', { locale: de })}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="px-3 py-1">
                {currentWeekType}-Woche
              </Badge>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentWeek(new Date())}
                className="px-4"
              >
                Heute
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card className="overflow-hidden border-border/50">
          {/* Day Headers */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-border/50 bg-muted/30 sticky top-0 z-20">
            <div className="p-3 flex items-center justify-center border-r border-border/50">
              <Clock className="w-4 h-4 text-muted-foreground" />
            </div>
            {weekDays.map((day, idx) => (
              <div
                key={idx}
                className={`p-3 text-center border-r last:border-r-0 border-border/50 ${
                  isToday(day) ? 'bg-primary/10' : ''
                }`}
              >
                <div className={`text-xs font-medium ${isToday(day) ? 'text-primary' : 'text-muted-foreground'}`}>
                  {DAY_NAMES[idx]}
                </div>
                <div className={`text-lg font-bold ${isToday(day) ? 'text-primary' : ''}`}>
                  {format(day, 'd')}
                </div>
              </div>
            ))}
          </div>

          {/* Scrollable Time Grid */}
          <div 
            ref={scrollRef}
            className="overflow-y-auto max-h-[calc(100vh-320px)] relative"
          >
            <div className="grid grid-cols-[60px_repeat(7,1fr)] relative" style={{ height: `${24 * 60}px` }}>
              {/* Time Labels Column */}
              <div className="border-r border-border/50 relative">
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute w-full border-t border-border/30 flex items-start justify-end pr-2 pt-1"
                    style={{ top: `${hour * 60}px`, height: '60px' }}
                  >
                    <span className="text-[10px] text-muted-foreground">
                      {hour.toString().padStart(2, '0')}:00
                    </span>
                  </div>
                ))}
              </div>

              {/* Day Columns */}
              {weekDays.map((day, dayIdx) => {
                const mergedEntries = getMergedEntriesForDay(dayIdx + 1);
                
                return (
                  <div
                    key={dayIdx}
                    className={`relative border-r last:border-r-0 border-border/50 ${
                      isToday(day) ? 'bg-primary/5' : ''
                    }`}
                  >
                    {/* Hour Grid Lines */}
                    {HOURS.map((hour) => (
                      <div
                        key={hour}
                        className="absolute w-full border-t border-border/30"
                        style={{ top: `${hour * 60}px`, height: '60px' }}
                      />
                    ))}

                    {/* Half-hour Grid Lines */}
                    {HOURS.map((hour) => (
                      <div
                        key={`half-${hour}`}
                        className="absolute w-full border-t border-border/10"
                        style={{ top: `${hour * 60 + 30}px` }}
                      />
                    ))}

                    {/* Timetable Entries */}
                    {mergedEntries.map((entry) => {
                      const style = getEventStyle(entry.startPeriod, entry.endPeriod);
                      const startTime = LESSON_TIMES[entry.startPeriod]?.start;
                      const endTime = LESSON_TIMES[entry.endPeriod]?.end;
                      
                      return (
                        <div
                          key={entry.id}
                          className="absolute left-1 right-1 bg-gradient-to-br from-primary/25 to-primary/10 rounded-lg border border-primary/30 overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
                          style={style}
                        >
                          <div className="p-1.5 h-full flex flex-col overflow-hidden">
                            <p className="font-medium text-xs truncate">
                              {entry.subject?.short_name || entry.subject?.name || entry.teacher_short}
                            </p>
                            {entry.isDouble && (
                              <p className="text-[9px] text-muted-foreground">
                                {startTime} - {endTime}
                              </p>
                            )}
                            <div className="text-[9px] text-muted-foreground mt-auto truncate">
                              {entry.room || entry.teacher_short}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Current Time Indicator */}
                    {isToday(day) && (
                      <div
                        className="absolute left-0 right-0 z-10 pointer-events-none"
                        style={{ top: `${currentTimePosition}px` }}
                      >
                        <div className="relative">
                          <div className="absolute -left-1 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                          <div className="h-0.5 bg-red-500 w-full" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-primary/25 to-primary/10 border border-primary/30" />
            <span>Unterricht</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-0.5 bg-red-500 rounded" />
            <span>Aktuelle Zeit</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">A/B</Badge>
            <span>Wochentyp (A = ungerade KW, B = gerade KW)</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
