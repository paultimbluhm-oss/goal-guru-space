import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Users, GraduationCap, Plus, Trash2, Edit } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SchoolTask {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  person_name: string | null;
  completed: boolean;
  created_at: string;
}

interface SchoolTasksSectionProps {
  onBack: () => void;
  taskType: 'classmate' | 'teacher';
}

export function SchoolTasksSection({ onBack, taskType }: SchoolTasksSectionProps) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<SchoolTask[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<SchoolTask | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [personName, setPersonName] = useState('');

  const isClassmate = taskType === 'classmate';
  const icon = isClassmate ? Users : GraduationCap;
  const IconComponent = icon;
  const color = isClassmate ? 'orange' : 'red';
  const label = isClassmate ? 'Aufgaben für Mitschüler' : 'Aufgaben für Lehrer';
  const personLabel = isClassmate ? 'Mitschüler' : 'Lehrer';

  useEffect(() => {
    if (user) {
      fetchTasks();
    }
  }, [user, taskType]);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from('school_tasks')
      .select('*')
      .eq('user_id', user!.id)
      .eq('task_type', taskType)
      .order('completed', { ascending: true })
      .order('created_at', { ascending: false });

    if (!error && data) setTasks(data);
  };

  const saveTask = async () => {
    if (!title.trim()) return;

    const taskData = {
      title,
      description: description || null,
      person_name: personName || null,
      task_type: taskType,
    };

    if (editingTask) {
      const { error } = await supabase
        .from('school_tasks')
        .update(taskData)
        .eq('id', editingTask.id);

      if (!error) {
        toast.success('Aufgabe aktualisiert');
        fetchTasks();
      }
    } else {
      const { error } = await supabase
        .from('school_tasks')
        .insert({ ...taskData, user_id: user!.id });

      if (!error) {
        toast.success('Aufgabe erstellt');
        fetchTasks();
      }
    }

    resetForm();
  };

  const toggleComplete = async (task: SchoolTask) => {
    const { error } = await supabase
      .from('school_tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id);

    if (!error) {
      setTasks(tasks.map(t => t.id === task.id ? { ...t, completed: !t.completed } : t));
      toast.success(task.completed ? 'Aufgabe wiederhergestellt' : 'Aufgabe erledigt');
    }
  };

  const deleteTask = async (id: string) => {
    const { error } = await supabase
      .from('school_tasks')
      .delete()
      .eq('id', id);

    if (!error) {
      toast.success('Aufgabe gelöscht');
      fetchTasks();
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setPersonName('');
    setEditingTask(null);
    setDialogOpen(false);
  };

  const openEdit = (task: SchoolTask) => {
    setEditingTask(task);
    setTitle(task.title);
    setDescription(task.description || '');
    setPersonName(task.person_name || '');
    setDialogOpen(true);
  };

  const openTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className={`p-2.5 rounded-xl bg-${color}-500/20`}>
            <IconComponent className={`w-5 h-5 text-${color}-500`} />
          </div>
          <h2 className="text-xl font-bold">{label}</h2>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="hidden sm:flex">
              <Plus className="w-4 h-4 mr-2" />
              Neue Aufgabe
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTask ? 'Aufgabe bearbeiten' : 'Neue Aufgabe'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Titel</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Was ist zu tun?" />
              </div>
              <div>
                <Label>Beschreibung (optional)</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details..." />
              </div>
              <div>
                <Label>{personLabel} (optional)</Label>
                <Input value={personName} onChange={(e) => setPersonName(e.target.value)} placeholder={`Name des ${personLabel}s`} />
              </div>
              <Button onClick={saveTask} className="w-full">
                {editingTask ? 'Speichern' : 'Erstellen'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Offen</p>
          <p className="text-2xl font-bold">{openTasks.length}</p>
        </Card>
        <Card className="glass-card p-4">
          <p className="text-sm text-muted-foreground">Erledigt</p>
          <p className="text-2xl font-bold text-success">{completedTasks.length}</p>
        </Card>
      </div>

      {/* Tasks List */}
      <div className="space-y-3">
        {tasks.length === 0 ? (
          <Card className="glass-card p-8 text-center">
            <IconComponent className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Noch keine Aufgaben</p>
            <p className="text-sm text-muted-foreground">Erstelle deine erste Aufgabe!</p>
          </Card>
        ) : (
          <>
            {openTasks.map((task) => (
              <Card key={task.id} className="glass-card p-4">
                <div className="flex items-start gap-4">
                  <Checkbox 
                    checked={task.completed}
                    onCheckedChange={() => toggleComplete(task)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{task.title}</h3>
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">{task.description}</p>
                    )}
                    {task.person_name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {personLabel}: {task.person_name}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(task)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteTask(task.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}

            {completedTasks.length > 0 && (
              <>
                <h3 className="text-sm font-semibold text-muted-foreground pt-4">Erledigt</h3>
                {completedTasks.map((task) => (
                  <Card key={task.id} className="glass-card p-4 opacity-60">
                    <div className="flex items-start gap-4">
                      <Checkbox 
                        checked={task.completed}
                        onCheckedChange={() => toggleComplete(task)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium line-through">{task.title}</h3>
                        {task.person_name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {personLabel}: {task.person_name}
                          </p>
                        )}
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteTask(task.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* Mobile button */}
      <Button className="w-full sm:hidden" onClick={() => setDialogOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Neue Aufgabe
      </Button>
    </div>
  );
}
