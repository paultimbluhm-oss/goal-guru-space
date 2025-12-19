import { useState } from 'react';
import { Pencil, Trash2, Star, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { getSupabase } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Task {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: string;
  completed: boolean;
  xp_reward: number;
}

interface TaskCardProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: () => void;
}

export function TaskCard({ task, onToggle, onDelete, onUpdate }: TaskCardProps) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [dueDate, setDueDate] = useState(task.due_date || '');
  const [priority, setPriority] = useState(task.priority);
  const [saving, setSaving] = useState(false);

  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !task.completed;
  const isDueToday = task.due_date && isToday(parseISO(task.due_date));

  const priorityColors: Record<string, string> = {
    high: 'bg-destructive/20 text-destructive',
    medium: 'bg-yellow-500/20 text-yellow-600',
    low: 'bg-green-500/20 text-green-600',
  };

  const handleSave = async () => {
    setSaving(true);
    const supabase = getSupabase();

    const { error } = await supabase
      .from('tasks')
      .update({
        title,
        description: description || null,
        due_date: dueDate || null,
        priority,
      })
      .eq('id', task.id);

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Aufgabe aktualisiert' });
      setEditing(false);
      onUpdate();
    }
    setSaving(false);
  };

  return (
    <>
      <div
        className={`glass-card p-4 flex items-start gap-3 group transition-opacity ${
          task.completed ? 'opacity-60' : ''
        } ${isOverdue ? 'border-destructive/50' : ''}`}
      >
        <Checkbox
          checked={task.completed}
          onCheckedChange={onToggle}
          className="mt-1"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
              {task.title}
            </span>
            <Badge variant="outline" className={priorityColors[task.priority]}>
              {task.priority === 'high' ? 'Hoch' : task.priority === 'medium' ? 'Mittel' : 'Niedrig'}
            </Badge>
            <Badge variant="outline" className="bg-primary/10 text-primary">
              <Star className="w-3 h-3 mr-1" />
              {task.xp_reward} XP
            </Badge>
          </div>

          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
          )}

          {task.due_date && (
            <div className={`flex items-center gap-1 text-sm mt-2 ${
              isOverdue ? 'text-destructive' : isDueToday ? 'text-primary' : 'text-muted-foreground'
            }`}>
              <Clock className="w-3 h-3" />
              {format(parseISO(task.due_date), 'dd.MM.yyyy HH:mm', { locale: de })}
            </div>
          )}
        </div>

        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="ghost" onClick={() => setEditing(true)}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={onDelete}>
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      </div>

      <Dialog open={editing} onOpenChange={setEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aufgabe bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Titel</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Beschreibung</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Fällig am</Label>
              <Input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Priorität</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">Hoch</SelectItem>
                  <SelectItem value="medium">Mittel</SelectItem>
                  <SelectItem value="low">Niedrig</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditing(false)}>Abbrechen</Button>
              <Button onClick={handleSave} disabled={saving || !title.trim()}>
                {saving ? 'Speichern...' : 'Speichern'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
