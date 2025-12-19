import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AddHomeworkDialogProps {
  subjectId: string;
  subjectName: string;
  onHomeworkAdded: () => void;
}

export function AddHomeworkDialog({ subjectId, subjectName, onHomeworkAdded }: AddHomeworkDialogProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim() || !dueDate) return;

    setLoading(true);
    const { error } = await supabase.from('homework').insert({
      user_id: user.id,
      subject_id: subjectId,
      title: title.trim(),
      description: description.trim() || null,
      due_date: dueDate,
    });

    if (error) {
      toast.error('Fehler beim Hinzufügen der Hausaufgabe');
    } else {
      toast.success('Hausaufgabe hinzugefügt');
      setTitle('');
      setDescription('');
      setDueDate('');
      setOpen(false);
      onHomeworkAdded();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1">
          <BookOpen className="h-3 w-3" />
          Hausaufgabe
        </Button>
      </DialogTrigger>
      <DialogContent className="glass-card border-border/50">
        <DialogHeader>
          <DialogTitle>Hausaufgabe für {subjectName}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="z.B. Aufgaben S. 42"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Details zur Hausaufgabe..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Fällig am</Label>
            <Input
              id="dueDate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Wird hinzugefügt...' : 'Hausaufgabe hinzufügen'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
