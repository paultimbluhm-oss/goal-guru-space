import { useState, useEffect } from 'react';
import { Pencil, Trash2, BookOpen, Clock } from 'lucide-react';
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
import { useAuth, getSupabase } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Homework {
  id: string;
  title: string;
  description: string | null;
  due_date: string;
  completed: boolean;
  subject_id: string;
  subject_name?: string;
}

interface Subject {
  id: string;
  name: string;
}

interface HomeworkCardProps {
  homework: Homework;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate: () => void;
}

export function HomeworkCard({ homework, onToggle, onDelete, onUpdate }: HomeworkCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [title, setTitle] = useState(homework.title);
  const [description, setDescription] = useState(homework.description || '');
  const [dueDate, setDueDate] = useState(homework.due_date);
  const [subjectId, setSubjectId] = useState(homework.subject_id);
  const [saving, setSaving] = useState(false);

  const isOverdue = isPast(parseISO(homework.due_date)) && !homework.completed;
  const isDueToday = isToday(parseISO(homework.due_date));

  useEffect(() => {
    if (editing && user) {
      const fetchSubjects = async () => {
        const supabase = getSupabase();
        const { data } = await supabase
          .from('subjects')
          .select('id, name')
          .eq('user_id', user.id);
        setSubjects(data || []);
      };
      fetchSubjects();
    }
  }, [editing, user]);

  const handleSave = async () => {
    setSaving(true);
    const supabase = getSupabase();

    const { error } = await supabase
      .from('homework')
      .update({
        title,
        description: description || null,
        due_date: dueDate,
        subject_id: subjectId,
      })
      .eq('id', homework.id);

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Hausaufgabe aktualisiert' });
      setEditing(false);
      onUpdate();
    }
    setSaving(false);
  };

  return (
    <>
      <div
        className={`glass-card p-4 flex items-start gap-3 group transition-opacity ${
          homework.completed ? 'opacity-60' : ''
        } ${isOverdue ? 'border-destructive/50' : ''}`}
      >
        <Checkbox
          checked={homework.completed}
          onCheckedChange={onToggle}
          className="mt-1"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`font-medium ${homework.completed ? 'line-through text-muted-foreground' : ''}`}>
              {homework.title}
            </span>
            <Badge variant="outline" className="bg-blue-500/20 text-blue-600">
              <BookOpen className="w-3 h-3 mr-1" />
              {homework.subject_name}
            </Badge>
          </div>

          {homework.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{homework.description}</p>
          )}

          <div className={`flex items-center gap-1 text-sm mt-2 ${
            isOverdue ? 'text-destructive' : isDueToday ? 'text-primary' : 'text-muted-foreground'
          }`}>
            <Clock className="w-3 h-3" />
            {format(parseISO(homework.due_date), 'dd.MM.yyyy', { locale: de })}
          </div>
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
            <DialogTitle>Hausaufgabe bearbeiten</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Fach</Label>
              <Select value={subjectId} onValueChange={setSubjectId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
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
