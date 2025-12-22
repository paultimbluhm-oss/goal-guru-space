import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ArrowRight, BookOpen, CheckCircle2, Clock, Target, Check } from 'lucide-react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamification } from '@/contexts/GamificationContext';
import { Checkbox } from '@/components/ui/checkbox';

interface Task {
  id: string;
  title: string;
  due_date: string | null;
  priority: string | null;
  type: 'task' | 'homework';
  subject_name?: string;
  xp_reward?: number;
}

export function NextActionsCard() {
  const { user } = useAuth();
  const { addXP, celebrateTaskComplete } = useGamification();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNextActions = async () => {
    if (!user) return;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [tasksRes, homeworkRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('id, title, due_date, priority, xp_reward')
        .eq('user_id', user.id)
        .eq('completed', false)
        .gte('due_date', today.toISOString())
        .order('due_date', { ascending: true })
        .limit(5),
      supabase
        .from('homework')
        .select('id, title, due_date, priority, xp_reward, subjects(name)')
        .eq('user_id', user.id)
        .eq('completed', false)
        .gte('due_date', today.toISOString())
        .order('due_date', { ascending: true })
        .limit(5),
    ]);

    const allTasks: Task[] = [
      ...(tasksRes.data || []).map(t => ({ ...t, type: 'task' as const })),
      ...(homeworkRes.data || []).map(h => ({
        id: h.id,
        title: h.title,
        due_date: h.due_date,
        priority: h.priority,
        type: 'homework' as const,
        subject_name: (h.subjects as any)?.name,
        xp_reward: h.xp_reward,
      })),
    ];

    allTasks.sort((a, b) => {
      if (a.due_date && b.due_date) {
        const dateCompare = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        if (dateCompare !== 0) return dateCompare;
      }
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return (priorityOrder[a.priority as keyof typeof priorityOrder] || 2) - 
             (priorityOrder[b.priority as keyof typeof priorityOrder] || 2);
    });

    setTasks(allTasks.slice(0, 4));
    setLoading(false);
  };

  useEffect(() => {
    if (user) {
      fetchNextActions();
    }
  }, [user]);

  // Realtime subscriptions for auto-refresh
  useEffect(() => {
    if (!user) return;

    const tasksChannel = supabase
      .channel('next-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchNextActions)
      .subscribe();

    const homeworkChannel = supabase
      .channel('next-homework')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homework' }, fetchNextActions)
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(homeworkChannel);
    };
  }, [user]);

  const formatDueDate = (dateStr: string | null) => {
    if (!dateStr) return 'Kein Datum';
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Heute';
    if (isTomorrow(date)) return 'Morgen';
    return format(date, 'EEE, dd. MMM', { locale: de });
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'text-destructive';
      case 'medium': return 'text-warning';
      default: return 'text-muted-foreground';
    }
  };

  const completeTask = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const table = task.type === 'task' ? 'tasks' : 'homework';
    
    await supabase
      .from(table)
      .update({ completed: true })
      .eq('id', task.id);
    
    // Remove from list with animation
    setTasks(prev => prev.filter(t => t.id !== task.id));
    
    // Award XP and celebrate
    const xp = task.xp_reward || 10;
    await addXP(xp, task.title);
    celebrateTaskComplete(task.title);
  };

  return (
    <div className="glass-card p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-base">Nächste Aufgaben</h3>
        </div>
        <Link to="/privat" className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
          Alle anzeigen <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-14 bg-secondary/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-8">
          <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3 opacity-60" />
          <p className="text-muted-foreground text-sm">Keine anstehenden Aufgaben!</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Du bist auf dem Laufenden</p>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-2">
            {tasks.map((task, i) => (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20, height: 0 }}
                transition={{ delay: i * 0.1 }}
                layout
                className="group flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-all border border-transparent hover:border-primary/30"
              >
                {/* Checkbox */}
                <div 
                  onClick={(e) => completeTask(task, e)}
                  className="cursor-pointer"
                >
                  <Checkbox className="data-[state=checked]:bg-success data-[state=checked]:border-success" />
                </div>
                
                <div className={`p-2 rounded-lg ${task.type === 'homework' ? 'bg-accent/20' : 'bg-primary/20'}`}>
                  {task.type === 'homework' ? (
                    <BookOpen className="w-4 h-4 text-accent" />
                  ) : (
                    <Target className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 text-xs">
                    {task.subject_name && (
                      <span className="text-accent">{task.subject_name}</span>
                    )}
                    <span className={getPriorityColor(task.priority)}>
                      <Clock className="w-3 h-3 inline mr-1" />
                      {formatDueDate(task.due_date)}
                    </span>
                    {task.xp_reward && (
                      <span className="text-primary">+{task.xp_reward} XP</span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.div>
            ))}
          </div>
        </AnimatePresence>
      )}
    </div>
  );
}
