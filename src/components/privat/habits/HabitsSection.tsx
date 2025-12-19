import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Check, Flame, Trophy, Trash2, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { format, isToday, subDays, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';

interface Habit {
  id: string;
  name: string;
  description: string | null;
  icon: string;
  xp_reward: number;
  is_active: boolean;
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
  const { addXP, profile } = useProfile();
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
    const sevenDaysAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const { data, error } = await supabase
      .from('habit_completions')
      .select('*')
      .eq('user_id', user!.id)
      .gte('completed_date', sevenDaysAgo);

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
      // Remove completion
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
      // Add completion
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
        await addXP(habit.xp_reward);
        toast.success(`+${habit.xp_reward} XP für ${habit.name}!`);

        // Check if all habits are now completed
        const newCompletions = [...completions, data];
        const allDone = habits.every(h => 
          newCompletions.some(c => c.habit_id === h.id && c.completed_date === today)
        );
        
        if (allDone && habits.length > 0) {
          toast.success('🔥 Alle Habits erledigt! Streak gesichert!', { duration: 3000 });
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

  // Calculate streak for last 7 days
  const getLast7Days = () => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return format(date, 'yyyy-MM-dd');
    });
  };

  const getCompletionRate = (date: string) => {
    if (habits.length === 0) return 0;
    const completed = habits.filter(h => 
      completions.some(c => c.habit_id === h.id && c.completed_date === date)
    ).length;
    return (completed / habits.length) * 100;
  };

  const completedToday = habits.filter(h => isCompletedToday(h.id)).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-500/20">
              <Check className="w-5 h-5 text-green-500" />
            </div>
            <h2 className="text-xl font-bold">Habit Tracker</h2>
          </div>
        </div>
        {/* Desktop button */}
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="hidden sm:flex">
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

      {/* Daily Progress */}
      <Card className="p-4 glass-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold">Heute</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold">{completedToday}/{habits.length}</span>
            {allHabitsCompletedToday() && <Flame className="w-5 h-5 text-orange-500" />}
          </div>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
            style={{ width: habits.length > 0 ? `${(completedToday / habits.length) * 100}%` : '0%' }}
          />
        </div>
        {allHabitsCompletedToday() && (
          <p className="text-sm text-green-500 mt-2 text-center">🎉 Alle Habits erledigt!</p>
        )}
      </Card>

      {/* 7-Day Overview */}
      <Card className="p-4 glass-card">
        <h3 className="font-semibold mb-3">Letzte 7 Tage</h3>
        <div className="flex gap-2 justify-between">
          {getLast7Days().map((date) => {
            const rate = getCompletionRate(date);
            const isCurrentDay = date === today;
            return (
              <div key={date} className="flex flex-col items-center gap-1">
                <div 
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                    rate === 100 
                      ? 'bg-green-500 text-white' 
                      : rate > 0 
                        ? 'bg-green-500/30 text-green-500' 
                        : 'bg-muted text-muted-foreground'
                  } ${isCurrentDay ? 'ring-2 ring-primary' : ''}`}
                >
                  {format(new Date(date), 'dd')}
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(date), 'EEE', { locale: de })}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Habits List */}
      <div className="space-y-3">
        {habits.length === 0 ? (
          <Card className="p-8 glass-card text-center">
            <p className="text-muted-foreground">Noch keine Habits erstellt</p>
            <p className="text-sm text-muted-foreground mt-1">Erstelle deinen ersten Habit!</p>
          </Card>
        ) : (
          habits.map((habit) => {
            const completed = isCompletedToday(habit.id);
            return (
              <Card 
                key={habit.id} 
                className={`p-4 glass-card transition-all ${completed ? 'border-green-500/50 bg-green-500/5' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <Checkbox 
                    checked={completed}
                    onCheckedChange={() => toggleHabit(habit)}
                    className="w-6 h-6"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${completed ? 'line-through text-muted-foreground' : ''}`}>
                      {habit.name}
                    </p>
                    {habit.description && (
                      <p className="text-sm text-muted-foreground">{habit.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-primary font-medium">+{habit.xp_reward} XP</span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(habit)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteHabit(habit.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Mobile button at bottom */}
      <Button 
        className="w-full sm:hidden" 
        onClick={() => setDialogOpen(true)}
      >
        <Plus className="w-4 h-4 mr-2" />
        Neuer Habit
      </Button>
    </div>
  );
}
