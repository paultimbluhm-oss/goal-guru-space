import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Calendar, Filter, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, getSupabase } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { TaskCard } from './TaskCard';
import { HomeworkCard } from './HomeworkCard';
import { AddTaskDialog } from './AddTaskDialog';
import { format, isToday, isTomorrow, isPast, isThisWeek, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  completed: boolean;
  xp_reward: number;
  created_at: string;
  type: 'task';
}

interface Homework {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  completed: boolean;
  subject_id: string;
  subject_name?: string;
  priority?: string;
  xp_reward?: number;
  type: 'homework';
}

interface Subject {
  id: string;
  name: string;
}

type TaskItem = Task | Homework;

interface TaskSectionProps {
  onBack: () => void;
}

export function TaskSection({ onBack }: TaskSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [homework, setHomework] = useState<Homework[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [showCompleted, setShowCompleted] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    const supabase = getSupabase();

    const [tasksRes, homeworkRes, subjectsRes] = await Promise.all([
      supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true, nullsFirst: false }),
      supabase
        .from('homework')
        .select('*')
        .eq('user_id', user.id)
        .order('due_date', { ascending: true }),
      supabase
        .from('subjects')
        .select('id, name')
        .eq('user_id', user.id),
    ]);

    if (tasksRes.error) {
      toast({ title: 'Fehler', description: tasksRes.error.message, variant: 'destructive' });
    } else {
      setTasks((tasksRes.data || []).map(t => ({ ...t, type: 'task' as const })));
    }

    if (subjectsRes.data) {
      setSubjects(subjectsRes.data);
    }

    if (homeworkRes.data && subjectsRes.data) {
      const homeworkWithSubjects = homeworkRes.data.map(hw => ({
        ...hw,
        type: 'homework' as const,
        subject_name: subjectsRes.data.find(s => s.id === hw.subject_id)?.name || 'Unbekannt',
      }));
      setHomework(homeworkWithSubjects);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const toggleTaskComplete = async (task: Task) => {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id);

    if (!error) {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
      if (!task.completed) {
        toast({ title: `+${task.xp_reward} XP verdient!` });
      }
    }
  };

  const toggleHomeworkComplete = async (hw: Homework) => {
    const supabase = getSupabase();
    const { error } = await supabase
      .from('homework')
      .update({ completed: !hw.completed })
      .eq('id', hw.id);

    if (!error) {
      setHomework(homework.map(h => h.id === hw.id ? { ...h, completed: !h.completed } : h));
      if (!hw.completed && hw.xp_reward) {
        toast({ title: `+${hw.xp_reward} XP verdient!` });
      }
    }
  };

  const deleteTask = async (id: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (!error) {
      setTasks(tasks.filter(t => t.id !== id));
      toast({ title: 'Aufgabe gelöscht' });
    }
  };

  const deleteHomework = async (id: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('homework').delete().eq('id', id);
    if (!error) {
      setHomework(homework.filter(h => h.id !== id));
      toast({ title: 'Hausaufgabe gelöscht' });
    }
  };

  // Combine and filter items
  const allItems: TaskItem[] = [...tasks, ...homework];
  
  const filterItems = (items: TaskItem[]) => {
    let filtered = items;
    
    if (!showCompleted) {
      filtered = filtered.filter(item => !item.completed);
    }

    switch (activeTab) {
      case 'today':
        filtered = filtered.filter(item => 
          item.due_date && isToday(parseISO(item.due_date))
        );
        break;
      case 'week':
        filtered = filtered.filter(item => 
          item.due_date && isThisWeek(parseISO(item.due_date), { locale: de })
        );
        break;
      case 'overdue':
        filtered = filtered.filter(item => 
          item.due_date && isPast(parseISO(item.due_date)) && !item.completed
        );
        break;
      case 'homework':
        filtered = filtered.filter(item => item.type === 'homework');
        break;
      case 'tasks':
        filtered = filtered.filter(item => item.type === 'task');
        break;
    }

    return filtered.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  };

  const filteredItems = filterItems(allItems);
  
  const overdueCount = allItems.filter(item => 
    item.due_date && isPast(parseISO(item.due_date)) && !item.completed
  ).length;

  const todayCount = allItems.filter(item => 
    item.due_date && isToday(parseISO(item.due_date)) && !item.completed
  ).length;

  const groupByDate = (items: TaskItem[]) => {
    const groups: { [key: string]: TaskItem[] } = {};
    
    items.forEach(item => {
      let key = 'Ohne Datum';
      if (item.due_date) {
        const date = parseISO(item.due_date);
        if (isToday(date)) {
          key = 'Heute';
        } else if (isTomorrow(date)) {
          key = 'Morgen';
        } else if (isPast(date)) {
          key = 'Überfällig';
        } else {
          key = format(date, 'EEEE, d. MMMM', { locale: de });
        }
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    // Sort groups
    const order = ['Überfällig', 'Heute', 'Morgen'];
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const aIndex = order.indexOf(a);
      const bIndex = order.indexOf(b);
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      if (a === 'Ohne Datum') return 1;
      if (b === 'Ohne Datum') return -1;
      return 0;
    });

    return sortedKeys.map(key => ({ key, items: groups[key] }));
  };

  const groupedItems = groupByDate(filteredItems);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="p-3 rounded-xl bg-primary/20">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Aufgaben</h2>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Neue Aufgabe
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="glass-card p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-primary" />
          <div>
            <p className="text-2xl font-bold">{todayCount}</p>
            <p className="text-sm text-muted-foreground">Heute fällig</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <AlertTriangle className={`w-5 h-5 ${overdueCount > 0 ? 'text-destructive' : 'text-muted-foreground'}`} />
          <div>
            <p className="text-2xl font-bold">{overdueCount}</p>
            <p className="text-sm text-muted-foreground">Überfällig</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500" />
          <div>
            <p className="text-2xl font-bold">{allItems.filter(i => i.completed).length}</p>
            <p className="text-sm text-muted-foreground">Erledigt</p>
          </div>
        </div>
        <div className="glass-card p-4 flex items-center gap-3">
          <Calendar className="w-5 h-5 text-blue-500" />
          <div>
            <p className="text-2xl font-bold">{homework.filter(h => !h.completed).length}</p>
            <p className="text-sm text-muted-foreground">Hausaufgaben</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="flex-wrap h-auto">
            <TabsTrigger value="all">Alle</TabsTrigger>
            <TabsTrigger value="today">Heute</TabsTrigger>
            <TabsTrigger value="week">Diese Woche</TabsTrigger>
            <TabsTrigger value="overdue" className={overdueCount > 0 ? 'text-destructive' : ''}>
              Überfällig {overdueCount > 0 && `(${overdueCount})`}
            </TabsTrigger>
            <TabsTrigger value="homework">Hausaufgaben</TabsTrigger>
            <TabsTrigger value="tasks">Nur Aufgaben</TabsTrigger>
          </TabsList>
        </Tabs>
        <Button
          variant={showCompleted ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowCompleted(!showCompleted)}
        >
          <Filter className="w-4 h-4 mr-2" />
          {showCompleted ? 'Erledigte verstecken' : 'Erledigte zeigen'}
        </Button>
      </div>

      {/* Task List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Laden...</div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <CheckCircle2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Keine Aufgaben in dieser Ansicht</p>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedItems.map(group => (
            <div key={group.key}>
              <h3 className={`text-sm font-semibold mb-3 ${
                group.key === 'Überfällig' ? 'text-destructive' : 
                group.key === 'Heute' ? 'text-primary' : 
                'text-muted-foreground'
              }`}>
                {group.key}
              </h3>
              <div className="space-y-2">
                {group.items.map(item => (
                  item.type === 'task' ? (
                    <TaskCard
                      key={item.id}
                      task={item}
                      onToggle={() => toggleTaskComplete(item)}
                      onDelete={() => deleteTask(item.id)}
                      onUpdate={fetchData}
                    />
                  ) : (
                    <HomeworkCard
                      key={item.id}
                      homework={item}
                      onToggle={() => toggleHomeworkComplete(item)}
                      onDelete={() => deleteHomework(item.id)}
                      onUpdate={fetchData}
                    />
                  )
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <AddTaskDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          setShowAddDialog(false);
          fetchData();
        }}
      />
    </div>
  );
}
