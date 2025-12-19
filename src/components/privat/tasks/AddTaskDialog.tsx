import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar, Clock } from 'lucide-react';
import { useAuth, getSupabase } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddTaskDialog({ open, onOpenChange, onSuccess }: AddTaskDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [hasTime, setHasTime] = useState(false);
  const [time, setTime] = useState('12:00');
  const [priority, setPriority] = useState('medium');
  const [xpReward, setXpReward] = useState('10');
  const [loading, setLoading] = useState(false);

  const quickDates = [
    { label: 'Heute', value: format(new Date(), 'yyyy-MM-dd') },
    { label: 'Morgen', value: format(addDays(new Date(), 1), 'yyyy-MM-dd') },
    { label: 'In 3 Tagen', value: format(addDays(new Date(), 3), 'yyyy-MM-dd') },
    { label: 'In 1 Woche', value: format(addDays(new Date(), 7), 'yyyy-MM-dd') },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setLoading(true);
    const supabase = getSupabase();

    let dueDate: string | null = null;
    if (selectedDate) {
      if (hasTime) {
        dueDate = `${selectedDate}T${time}:00`;
      } else {
        dueDate = `${selectedDate}T23:59:00`;
      }
    }

    const { error } = await supabase.from('tasks').insert({
      user_id: user.id,
      title: title.trim(),
      description: description.trim() || null,
      due_date: dueDate,
      priority,
      xp_reward: parseInt(xpReward) || 10,
      completed: false,
    });

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Aufgabe erstellt' });
      setTitle('');
      setDescription('');
      setSelectedDate('');
      setHasTime(false);
      setTime('12:00');
      setPriority('medium');
      setXpReward('10');
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Neue Aufgabe</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Titel</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Was muss erledigt werden?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Beschreibung (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Weitere Details..."
            />
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fällig am
            </Label>
            
            {/* Quick date buttons */}
            <div className="flex flex-wrap gap-2">
              {quickDates.map((qd) => (
                <Button
                  key={qd.label}
                  type="button"
                  variant={selectedDate === qd.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDate(qd.value)}
                >
                  {qd.label}
                </Button>
              ))}
              <Button
                type="button"
                variant={selectedDate && !quickDates.find(q => q.value === selectedDate) ? 'default' : 'outline'}
                size="sm"
                onClick={() => {}}
                className="relative"
              >
                Anderes Datum
                <Input
                  type="date"
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </Button>
            </div>
            
            {selectedDate && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDate('')}
                className="text-muted-foreground"
              >
                Datum entfernen
              </Button>
            )}
          </div>

          {selectedDate && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Uhrzeit festlegen
                </Label>
                <Switch checked={hasTime} onCheckedChange={setHasTime} />
              </div>
              
              {hasTime && (
                <Input
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
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

            <div className="space-y-2">
              <Label>XP-Belohnung</Label>
              <Select value={xpReward} onValueChange={setXpReward}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 XP</SelectItem>
                  <SelectItem value="10">10 XP</SelectItem>
                  <SelectItem value="25">25 XP</SelectItem>
                  <SelectItem value="50">50 XP</SelectItem>
                  <SelectItem value="100">100 XP</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? 'Erstellen...' : 'Erstellen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
