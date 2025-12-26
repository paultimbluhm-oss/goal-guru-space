import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Check, Flame, Trophy, Trash2, Edit, TrendingUp, Target, Zap, Calendar, Star, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useGamification } from '@/contexts/GamificationContext';
import { toast } from 'sonner';
import { format, subDays, startOfWeek, differenceInDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip, BarChart, Bar, Cell } from 'recharts';
import { ChartContainer, ChartTooltipContent, ChartTooltip } from '@/components/ui/chart';

interface Habit {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  xp_reward: number;
  is_active: boolean;
  created_at: string;
}

interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_date: string;
}

interface HabitsSectionProps {
  onBack: () => void;
}

export function HabitsSection({ onBack }: HabitsSectionProps) {
  const { user } = useAuth();
  const { addXP, celebrateStreak, celebrateTaskComplete, profile } = useGamification();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [xpReward, setXpReward] = useState(5);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (user) {
      fetchHabits();
      fetchCompletions();
    }
  }, [user]);

  const fetchHabits = async () => {
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', user!.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (!error && data) setHabits(data);
  };

  const fetchCompletions = async () => {
    const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd');
    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', user!.id)
      .gte('completed_date', thirtyDaysAgo);

    if (!error && data) setCompletions(data);
  };

  const isCompletedToday = (habitId: string) => {
    return completions.some(c => c.habit_id === habitId && c.completed_date === today);
  };

  const allHabitsCompletedToday = () => {
    if (habits.length === 0) return false;
    return habits.every(h => isCompletedToday(h.id));
  };

  const toggleHabit = async (habit: Habit) => {
    const alreadyCompleted = isCompletedToday(habit.id);

    if (alreadyCompleted) {
      const { error } = await supabase
        .from('habit_completions')
        .delete()
        .eq('habit_id', habit.id)
        .eq('completed_date', today);

      if (!error) {
        setCompletions(prev => prev.filter(c => !(c.habit_id === habit.id && c.completed_date === today)));
        toast.info('Habit rückgängig gemacht');
      }
    } else {
      const { data, error } = await supabase
        .from('habit_completions')
        .insert({
          user_id: user!.id,
          habit_id: habit.id,
          completed_date: today
        })
        .select()
        .single();

      if (!error && data) {
        setCompletions(prev => [...prev, data]);
        celebrateTaskComplete();
        await addXP(habit.xp_reward, habit.name);

        const newCompletions = [...completions, data];
        const allDone = habits.every(h => 
          newCompletions.some(c => c.habit_id === h.id && c.completed_date === today)
        );
        
        if (allDone && habits.length > 0) {
          setTimeout(() => {
            celebrateStreak(profile?.streak_days || 1);
          }, 2500);
        }
      }
    }
  };

  const saveHabit = async () => {
    if (!name.trim()) return;

    if (editingHabit) {
      const { error } = await supabase
        .from('habits')
        .update({ name, description: description || null, xp_reward: xpReward })
        .eq('id', editingHabit.id);

      if (!error) {
        toast.success('Habit aktualisiert');
        fetchHabits();
      }
    } else {
      const { error } = await supabase
        .from('habits')
        .insert({
          user_id: user!.id,
          name,
          description: description || null,
          xp_reward: xpReward
        });

      if (!error) {
        toast.success('Habit erstellt');
        fetchHabits();
      }
    }

    resetForm();
  };

  const deleteHabit = async (id: string) => {
    const { error } = await supabase
      .from('habits')
      .update({ is_active: false })
      .eq('id', id);

    if (!error) {
      toast.success('Habit gelöscht');
      fetchHabits();
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setXpReward(5);
    setEditingHabit(null);
    setDialogOpen(false);
  };

  const openEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setName(habit.name);
    setDescription(habit.description || '');
    setXpReward(habit.xp_reward);
    setDialogOpen(true);
  };

  // Calculate stats
  const getLast7Days = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return format(date, 'yyyy-MM-dd');
    });
  };

  const getLast14Days = () => {
    return Array.from({ length: 14 }, (_, i) => {
      const date = subDays(new Date(), 13 - i);
      return format(date, 'yyyy-MM-dd');
    });
  };

  const getCompletionRate = (date: string) => {
    // Only consider habits that existed on this date (created_at <= date)
    const habitsOnDate = habits.filter(h => {
      const createdDate = format(new Date(h.created_at), 'yyyy-MM-dd');
      return createdDate <= date;
    });
    if (habitsOnDate.length === 0) return 0;
    const completed = habitsOnDate.filter(h => 
      completions.some(c => c.habit_id === h.id && c.completed_date === date)
    ).length;
    return (completed / habitsOnDate.length) * 100;
  };

  const completedToday = habits.filter(h => isCompletedToday(h.id)).length;
  const progressPercent = habits.length > 0 ? (completedToday / habits.length) * 100 : 0;

  // Chart data for 14 days
  const chartData = useMemo(() => {
    return getLast14Days().map(date => ({
      date,
      label: format(new Date(date), 'dd.MM'),
      rate: getCompletionRate(date),
      completed: habits.filter(h => 
        completions.some(c => c.habit_id === h.id && c.completed_date === date)
      ).length
    }));
  }, [habits, completions]);

  // Per-habit statistics
  const habitStats = useMemo(() => {
    const last7 = getLast7Days();
    return habits.map(habit => {
      const completedDays = last7.filter(date => 
        completions.some(c => c.habit_id === habit.id && c.completed_date === date)
      ).length;
      return {
        ...habit,
        completedDays,
        rate: (completedDays / 7) * 100
      };
    });
  }, [habits, completions]);

  // Calculate streaks and stats
  const currentStreak = useMemo(() => {
    if (habits.length === 0) return 0;
    let streak = 0;
    const sortedDates = Array.from({ length: 30 }, (_, i) => format(subDays(new Date(), i), 'yyyy-MM-dd'));
    
    for (const date of sortedDates) {
      const allCompleted = habits.every(h => 
        completions.some(c => c.habit_id === h.id && c.completed_date === date)
      );
      if (allCompleted) streak++;
      else if (date !== today) break;
    }
    return streak;
  }, [habits, completions, today]);

  const totalXPEarned = useMemo(() => {
    return completions.reduce((sum, c) => {
      const habit = habits.find(h => h.id === c.habit_id);
      return sum + (habit?.xp_reward || 0);
    }, 0);
  }, [habits, completions]);

  const bestHabit = useMemo(() => {
    if (habitStats.length === 0) return null;
    return habitStats.reduce((best, current) => 
      current.completedDays > best.completedDays ? current : best
    );
  }, [habitStats]);

  const weeklyAverage = useMemo(() => {
    if (chartData.length === 0) return 0;
    const last7 = chartData.slice(-7);
    return Math.round(last7.reduce((sum, d) => sum + d.rate, 0) / 7);
  }, [chartData]);

  const chartConfig = {
    rate: {
      label: 'Erfolgsrate',
      color: 'hsl(var(--primary))'
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Habit Tracker</h2>
              <p className="text-sm text-muted-foreground">Baue starke Gewohnheiten auf</p>
            </div>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="hidden sm:flex bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Neuer Habit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingHabit ? 'Habit bearbeiten' : 'Neuer Habit'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z.B. Wasser trinken" />
              </div>
              <div>
                <Label>Beschreibung (optional)</Label>
                <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="z.B. 2L pro Tag" />
              </div>
              <div>
                <Label>XP Belohnung</Label>
                <Input type="number" value={xpReward} onChange={(e) => setXpReward(Number(e.target.value))} min={1} />
              </div>
              <Button onClick={saveHabit} className="w-full">
                {editingHabit ? 'Speichern' : 'Erstellen'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Hero Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/80">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Target className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Heute</p>
                <p className="text-xl font-bold">{completedToday}/{habits.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/80">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <Flame className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Streak</p>
                <p className="text-xl font-bold">{currentStreak} Tage</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/80">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/20">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Ø Woche</p>
                <p className="text-xl font-bold">{weeklyAverage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/80">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Zap className="w-4 h-4 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">XP verdient</p>
                <p className="text-xl font-bold">{totalXPEarned}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Progress - Hero Card */}
      <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card via-card to-emerald-500/5">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              <span>Heutiger Fortschritt</span>
            </div>
            {allHabitsCompletedToday() && (
              <div className="flex items-center gap-1 text-emerald-500 text-sm font-normal">
                <Star className="w-4 h-4 fill-current" />
                Perfekt!
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-4xl font-bold bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">
                  {Math.round(progressPercent)}%
                </span>
                <p className="text-sm text-muted-foreground mt-1">
                  {completedToday} von {habits.length} Habits erledigt
                </p>
              </div>
              {allHabitsCompletedToday() && (
                <div className="text-4xl animate-bounce">🎉</div>
              )}
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-700 ease-out rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 14-Day Trend Chart */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              14-Tage Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[180px] w-full">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="label" 
                  tick={{ fontSize: 10 }} 
                  tickLine={false}
                  axisLine={false}
                  interval={1}
                />
                <YAxis 
                  tick={{ fontSize: 10 }} 
                  tickLine={false}
                  axisLine={false}
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area 
                  type="monotone" 
                  dataKey="rate" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#colorRate)" 
                  name="Erfolgsrate"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Weekly Heatmap */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              Wochenübersicht
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {getLast7Days().map((date) => {
                const rate = getCompletionRate(date);
                const isCurrentDay = date === today;
                const dayLabel = format(new Date(date), 'EEEEEE', { locale: de });
                return (
                  <div key={date} className="flex flex-col items-center gap-2">
                    <span className="text-xs text-muted-foreground uppercase">{dayLabel}</span>
                    <div 
                      className={`relative w-full aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${
                        rate === 100 
                          ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25' 
                          : rate > 0 
                            ? 'bg-emerald-500/20 text-emerald-500' 
                            : 'bg-muted text-muted-foreground'
                      } ${isCurrentDay ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                    >
                      <span className="text-lg font-bold">{format(new Date(date), 'd')}</span>
                      {rate === 100 && <Check className="w-3 h-3 absolute bottom-1" />}
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">{Math.round(rate)}%</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Habit Performance */}
      {habitStats.length > 0 && (
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="w-4 h-4 text-yellow-500" />
              Habit Performance (7 Tage)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {habitStats.map((habit, index) => (
                <div key={habit.id} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 && habit.completedDays > 0 
                      ? 'bg-yellow-500 text-white' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium truncate">{habit.name}</span>
                      <span className="text-xs text-muted-foreground">{habit.completedDays}/7 Tage</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          habit.rate >= 80 ? 'bg-gradient-to-r from-emerald-500 to-green-500' :
                          habit.rate >= 50 ? 'bg-gradient-to-r from-yellow-500 to-amber-500' :
                          'bg-gradient-to-r from-red-500 to-orange-500'
                        }`}
                        style={{ width: `${habit.rate}%` }}
                      />
                    </div>
                  </div>
                  <span className={`text-sm font-bold ${
                    habit.rate >= 80 ? 'text-emerald-500' :
                    habit.rate >= 50 ? 'text-yellow-500' :
                    'text-red-500'
                  }`}>
                    {Math.round(habit.rate)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Habits List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-muted-foreground flex items-center gap-2">
          <Check className="w-4 h-4" />
          Deine Habits
        </h3>
        {habits.length === 0 ? (
          <Card className="p-8 border-border/50 text-center bg-gradient-to-br from-card to-muted/20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
              <Plus className="w-8 h-8 text-emerald-500" />
            </div>
            <p className="text-muted-foreground">Noch keine Habits erstellt</p>
            <p className="text-sm text-muted-foreground mt-1">Erstelle deinen ersten Habit!</p>
            <Button 
              className="mt-4 bg-gradient-to-r from-emerald-500 to-green-600" 
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Ersten Habit erstellen
            </Button>
          </Card>
        ) : (
          habits.map((habit) => {
            const completed = isCompletedToday(habit.id);
            const stats = habitStats.find(s => s.id === habit.id);
            return (
              <Card 
                key={habit.id} 
                className={`overflow-hidden transition-all duration-300 border-border/50 ${
                  completed 
                    ? 'bg-gradient-to-r from-emerald-500/10 to-green-500/5 border-emerald-500/30' 
                    : 'hover:border-primary/30'
                }`}
              >
                <div className="p-4 flex items-center gap-4">
                  <div 
                    className={`relative w-12 h-12 rounded-xl flex items-center justify-center cursor-pointer transition-all duration-300 ${
                      completed 
                        ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/25' 
                        : 'bg-muted hover:bg-muted/80'
                    }`}
                    onClick={() => toggleHabit(habit)}
                  >
                    <Check className={`w-6 h-6 transition-all ${completed ? 'text-white scale-110' : 'text-muted-foreground'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium transition-all ${completed ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                      {habit.name}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      {habit.description && (
                        <p className="text-xs text-muted-foreground">{habit.description}</p>
                      )}
                      {stats && (
                        <span className="text-xs text-muted-foreground">
                          {stats.completedDays}/7 diese Woche
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded-lg text-xs font-medium ${
                      completed 
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' 
                        : 'bg-primary/10 text-primary'
                    }`}>
                      +{habit.xp_reward} XP
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(habit)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => deleteHabit(habit.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Mobile FAB */}
      <Button 
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl sm:hidden bg-gradient-to-br from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700" 
        onClick={() => setDialogOpen(true)}
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}
