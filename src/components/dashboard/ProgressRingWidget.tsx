import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, CheckCircle2, Star, Flame } from 'lucide-react';
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

export function ProgressRingWidget() {
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
      .channel('progress-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTodayStats)
      .subscribe();

    const homeworkChannel = supabase
      .channel('progress-homework')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homework' }, fetchTodayStats)
      .subscribe();

    const habitsChannel = supabase
      .channel('progress-habits')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'habit_completions' }, fetchTodayStats)
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(homeworkChannel);
      supabase.removeChannel(habitsChannel);
    };
  }, [user]);

  const totalCompleted = stats.tasksCompleted + stats.homeworkCompleted + stats.habitsCompleted;
  const totalItems = stats.tasksTotal + stats.homeworkTotal + stats.habitsTotal;
  const overallProgress = totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
  const allDone = totalItems > 0 && totalCompleted === totalItems;

  return (
    <div className={`glass-card p-4 flex flex-col items-center justify-center relative overflow-hidden ${allDone ? 'ring-2 ring-success/50' : ''}`}>
      {/* Glow when all done */}
      {allDone && (
        <div className="absolute inset-0 bg-gradient-to-br from-success/20 to-transparent pointer-events-none" />
      )}

      <div className="relative z-10 flex flex-col items-center">
        {/* Progress Ring */}
        <div className="relative">
          <svg className="w-20 h-20 md:w-24 md:h-24 transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="hsl(var(--secondary))"
              strokeWidth="6"
              className="opacity-40"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={allDone ? "url(#progressGradientSuccess)" : "url(#progressGradient)"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 42}
              initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - overallProgress / 100) }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className={allDone ? 'drop-shadow-[0_0_10px_hsl(var(--success)/0.6)]' : 'drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)]'}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="hsl(var(--accent))" />
              </linearGradient>
              <linearGradient id="progressGradientSuccess" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="hsl(var(--success))" />
                <stop offset="50%" stopColor="hsl(160 60% 50%)" />
                <stop offset="100%" stopColor="hsl(var(--success))" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              key={overallProgress}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-xl md:text-2xl font-bold font-mono ${allDone ? 'text-success' : 'text-foreground'}`}
            >
              {overallProgress}%
            </motion.span>
          </div>
        </div>
        
        <p className="text-xs text-muted-foreground mt-2">Heute</p>
        
        {/* Completion count */}
        <p className={`text-xs mt-1 ${allDone ? 'text-success font-medium' : 'text-muted-foreground'}`}>
          {totalCompleted}/{totalItems}
        </p>
      </div>
    </div>
  );
}
