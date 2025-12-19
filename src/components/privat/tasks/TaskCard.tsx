import { useState } from 'react';
import { Pencil, Trash2, Star, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isPast, isToday } from 'date-fns';
import { de } from 'date-fns/locale';
import { TaskDialog } from './TaskDialog';

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
  const [editing, setEditing] = useState(false);

  const isOverdue = task.due_date && isPast(parseISO(task.due_date)) && !task.completed;
  const isDueToday = task.due_date && isToday(parseISO(task.due_date));

  const priorityColors: Record<string, string> = {
    high: 'bg-destructive/20 text-destructive',
    medium: 'bg-yellow-500/20 text-yellow-600',
    low: 'bg-green-500/20 text-green-600',
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

      <TaskDialog
        open={editing}
        onOpenChange={setEditing}
        onSuccess={onUpdate}
        task={task}
      />
    </>
  );
}
