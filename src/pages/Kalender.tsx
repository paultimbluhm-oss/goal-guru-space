import { useState, useEffect, useMemo } from 'react';
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
  GraduationCap,
  Coffee
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, addWeeks, subWeeks, isToday, getWeek, startOfDay, addMinutes, setHours, setMinutes } from 'date-fns';
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
const LESSON_TIMES = [
  { period: 1, start: '08:00', end: '08:45' },
  { period: 2, start: '08:45', end: '09:30' },
  // Break 09:30 - 09:50
  { period: 3, start: '09:50', end: '10:35' },
  { period: 4, start: '10:35', end: '11:20' },
  // Break 11:20 - 11:40
  { period: 5, start: '11:40', end: '12:25' },
  { period: 6, start: '12:25', end: '13:10' },
  // Lunch break 13:10 - 14:15
  { period: 7, start: '14:15', end: '15:00' },
  { period: 8, start: '15:00', end: '15:45' },
  { period: 9, start: '15:45', end: '16:30' },
  { period: 10, start: '16:30', end: '17:15' },
];

const BREAKS = [
  { start: '09:30', end: '09:50', label: 'Pause' },
  { start: '11:20', end: '11:40', label: 'Pause' },
  { start: '13:10', end: '14:15', label: 'Mittagspause' },
];

const DAY_NAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export default function Kalender() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) fetchTimetable();
  }, [user]);

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
    return Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const getEntriesForDayAndPeriod = (dayOfWeek: number, period: number) => {
    return timetableEntries.filter(entry => {
      if (entry.day_of_week !== dayOfWeek || entry.period !== period) return false;
      if (!entry.week_type || entry.week_type === 'both') return true;
      return entry.week_type.toUpperCase() === currentWeekType;
    });
  };

  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const getCurrentTimePosition = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const dayStart = timeToMinutes('08:00');
    const dayEnd = timeToMinutes('17:15');
    
    if (currentMinutes < dayStart || currentMinutes > dayEnd) return null;
    
    return ((currentMinutes - dayStart) / (dayEnd - dayStart)) * 100;
  };

  const currentTimePosition = getCurrentTimePosition();
  const todayIndex = weekDays.findIndex(day => isToday(day));

  if (loading || !user) return null;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-[1600px] mx-auto">
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
                  KW {weekNumber} ({currentWeekType}-Woche)
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
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

        {/* Week View */}
        <Card className="overflow-hidden border-border/50">
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              {/* Header */}
              <div className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-border/50 bg-muted/30">
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
                    <div className={`text-sm font-medium ${isToday(day) ? 'text-primary' : 'text-muted-foreground'}`}>
                      {DAY_NAMES[idx]}
                    </div>
                    <div className={`text-lg font-bold ${isToday(day) ? 'text-primary' : ''}`}>
                      {format(day, 'd')}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(day, 'MMM', { locale: de })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Time Grid */}
              <div className="relative">
                {/* Current time indicator */}
                {currentTimePosition !== null && todayIndex >= 0 && (
                  <div
                    className="absolute left-[80px] right-0 z-20 pointer-events-none"
                    style={{ top: `${currentTimePosition}%` }}
                  >
                    <div 
                      className="absolute h-0.5 bg-red-500"
                      style={{ 
                        left: `${(todayIndex / 5) * 100}%`,
                        width: `${100 / 5}%`
                      }}
                    >
                      <div className="absolute -left-1.5 -top-1.5 w-3 h-3 bg-red-500 rounded-full" />
                    </div>
                  </div>
                )}

                {LESSON_TIMES.map((slot, slotIdx) => {
                  const isBreakBefore = BREAKS.some(b => b.end === slot.start);
                  const breakBefore = BREAKS.find(b => b.end === slot.start);
                  
                  return (
                    <div key={slot.period}>
                      {/* Break row */}
                      {breakBefore && (
                        <div className="grid grid-cols-[80px_repeat(5,1fr)] bg-muted/20 border-b border-border/30">
                          <div className="p-1.5 text-[10px] text-muted-foreground text-center border-r border-border/30 flex flex-col items-center justify-center">
                            <Coffee className="w-3 h-3 mb-0.5" />
                            <span>{breakBefore.start}</span>
                          </div>
                          {weekDays.map((day, dayIdx) => (
                            <div
                              key={dayIdx}
                              className="p-1.5 text-center text-xs text-muted-foreground border-r last:border-r-0 border-border/30 flex items-center justify-center"
                            >
                              {breakBefore.label}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Lesson row */}
                      <div className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-border/50">
                        <div className="p-2 text-xs text-muted-foreground text-center border-r border-border/50 flex flex-col justify-center">
                          <span className="font-medium">{slot.period}.</span>
                          <span className="text-[10px]">{slot.start}</span>
                          <span className="text-[10px]">{slot.end}</span>
                        </div>
                        {weekDays.map((day, dayIdx) => {
                          const entries = getEntriesForDayAndPeriod(dayIdx + 1, slot.period);
                          const entry = entries[0];
                          
                          return (
                            <div
                              key={dayIdx}
                              className={`p-1.5 min-h-[70px] border-r last:border-r-0 border-border/50 ${
                                isToday(day) ? 'bg-primary/5' : ''
                              }`}
                            >
                              {entry && (
                                <div className="h-full bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg p-2 border border-primary/20 hover:border-primary/40 transition-colors">
                                  <div className="flex items-start justify-between gap-1">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-medium text-sm truncate">
                                        {entry.subject?.short_name || entry.subject?.name || entry.teacher_short}
                                      </p>
                                      {entry.subject?.name && entry.subject?.short_name && (
                                        <p className="text-[10px] text-muted-foreground truncate">
                                          {entry.subject.name}
                                        </p>
                                      )}
                                    </div>
                                    {entry.week_type && entry.week_type !== 'both' && (
                                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 shrink-0">
                                        {entry.week_type.toUpperCase()}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                                    {entry.room && <span>{entry.room}</span>}
                                    <span>{entry.teacher_short}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20" />
            <span>Unterricht</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-muted/30" />
            <span>Pause</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-red-500 rounded" />
            <span>Aktuelle Zeit</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">A/B</Badge>
            <span>Wochentyp</span>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
