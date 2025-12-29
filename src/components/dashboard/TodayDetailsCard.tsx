import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle2, Star, Flame, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface TodayStats {
  tasksCompleted: number;
  tasksTotal: number;
  homeworkCompleted: number;
  homeworkTotal: number;
  habitsCompleted: number;
  habitsTotal: number;
}

export function TodayDetailsCard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TodayStats>({
    tasksCompleted: 0,
    tasksTotal: 0,
    homeworkCompleted: 0,
    homeworkTotal: 0,
    habitsCompleted: 0,
    habitsTotal: 0,
  });

  const fetchTodayStats = async () => {
    if (!user) return;

    const today = format(new Date(), 'yyyy-MM-dd');

    const [tasksRes, homeworkRes, habitsRes, habitCompletionsRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, completed, due_date')
        .eq('user_id', user.id)
        .not('due_date', 'is', null),
      supabase
        .from('homework')
        .select('id, completed, due_date')
        .eq('user_id', user.id)
        .eq('due_date', today),
      supabase
        .from('habits')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true),
      supabase
        .from('habit_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('completed_date', today),
    ]);

    const todaysTasks = (tasksRes.data || []).filter(t => {
      if (!t.due_date) return false;
      const taskDate = format(new Date(t.due_date), 'yyyy-MM-dd');
      return taskDate === today;
    });

    setStats({
      tasksCompleted: todaysTasks.filter(t => t.completed).length,
      tasksTotal: todaysTasks.length,
      homeworkCompleted: homeworkRes.data?.filter(h => h.completed).length || 0,
      homeworkTotal: homeworkRes.data?.length || 0,
      habitsCompleted: habitCompletionsRes.data?.length || 0,
      habitsTotal: habitsRes.data?.length || 0,
    });
  };

  useEffect(() => {
    if (user) {
      fetchTodayStats();
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const tasksChannel = supabase
      .channel('details-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTodayStats)
      .subscribe();

    const homeworkChannel = supabase
      .channel('details-homework')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homework' }, fetchTodayStats)
      .subscribe();

    const habitsChannel = supabase
      .channel('details-habits')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habit_completions' }, fetchTodayStats)
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(homeworkChannel);
      supabase.removeChannel(habitsChannel);
    };
  }, [user]);

  const progressItems = [
    { 
      label: 'Tasks', 
      completed: stats.tasksCompleted, 
      total: stats.tasksTotal,
      icon: CheckCircle2,
      color: 'text-primary',
      bgColor: 'bg-primary/20'
    },
    { 
      label: 'Hausaufgaben', 
      completed: stats.homeworkCompleted, 
      total: stats.homeworkTotal,
      icon: Star,
      color: 'text-accent',
      bgColor: 'bg-accent/20'
    },
    { 
      label: 'Habits', 
      completed: stats.habitsCompleted, 
      total: stats.habitsTotal,
      icon: Flame,
      color: 'text-streak',
      bgColor: 'bg-streak/20'
    },
  ];

  // Time Progress
  const now = new Date();
  const hoursElapsed = now.getHours() + now.getMinutes() / 60;
  const dayProgress = Math.round((hoursElapsed / 24) * 100);

  return (
    <div className="glass-card p-4">
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        {/* Time Progress */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-2 md:p-3 rounded-lg bg-secondary/30 text-center"
        >
          <div className="p-1.5 md:p-2 rounded-lg bg-secondary/50 w-fit mx-auto mb-1.5">
            <Clock className="w-3 h-3 md:w-4 md:h-4 text-muted-foreground" />
          </div>
          <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">Tag</p>
          <p className="text-sm md:text-base font-bold text-foreground">{dayProgress}%</p>
        </motion.div>

        {/* Progress Items */}
        {progressItems.map((item, i) => {
          const Icon = item.icon;
          const itemDone = item.total > 0 && item.completed === item.total;

          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (i + 1) * 0.1 }}
              className={`p-2 md:p-3 rounded-lg bg-secondary/30 text-center ${itemDone ? 'ring-1 ring-success/50' : ''}`}
            >
              <div className={`p-1.5 md:p-2 rounded-lg ${item.bgColor} w-fit mx-auto mb-1.5`}>
                <Icon className={`w-3 h-3 md:w-4 md:h-4 ${itemDone ? 'text-success' : item.color}`} />
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground mb-0.5">{item.label}</p>
              <p className={`text-sm md:text-base font-bold ${itemDone ? 'text-success' : 'text-foreground'}`}>
                {item.completed}/{item.total}
              </p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
