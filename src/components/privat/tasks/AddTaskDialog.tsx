import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { useAuth, getSupabase } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { format, addDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';

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
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [hasTime, setHasTime] = useState(false);
  const [hours, setHours] = useState('12');
  const [minutes, setMinutes] = useState('00');
  const [priority, setPriority] = useState('medium');
  const [xpReward, setXpReward] = useState('10');
  const [loading, setLoading] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const quickDates = [
    { label: 'Heute', date: new Date() },
    { label: 'Morgen', date: addDays(new Date(), 1) },
    { label: 'In 3 Tagen', date: addDays(new Date(), 3) },
    { label: 'In 1 Woche', date: addDays(new Date(), 7) },
  ];

  const hourOptions = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minuteOptions = ['00', '15', '30', '45'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !title.trim()) return;

    setLoading(true);
    const supabase = getSupabase();

    let dueDate: string | null = null;
    if (selectedDate) {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      if (hasTime) {
        dueDate = `${dateStr}T${hours}:${minutes}:00`;
      } else {
        dueDate = `${dateStr}T23:59:00`;
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
      setSelectedDate(undefined);
      setHasTime(false);
      setHours('12');
      setMinutes('00');
      setPriority('medium');
      setXpReward('10');
      onSuccess();
    }
    setLoading(false);
  };

  const isQuickDateSelected = (date: Date) => {
    if (!selectedDate) return false;
    return format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
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
              <CalendarIcon className="w-4 h-4" />
              Fällig am
            </Label>
            
            {/* Quick date buttons */}
            <div className="flex flex-wrap gap-2">
              {quickDates.map((qd) => (
                <Button
                  key={qd.label}
                  type="button"
                  variant={isQuickDateSelected(qd.date) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedDate(qd.date)}
                >
                  {qd.label}
                </Button>
              ))}
              
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant={selectedDate && !quickDates.some(q => isQuickDateSelected(q.date)) ? 'default' : 'outline'}
                    size="sm"
                  >
                    <CalendarIcon className="w-4 h-4 mr-2" />
                    Anderes Datum
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={(date) => {
                      setSelectedDate(date);
                      setCalendarOpen(false);
                    }}
                    initialFocus
                    locale={de}
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {selectedDate && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Gewählt: {format(selectedDate, 'EEEE, d. MMMM yyyy', { locale: de })}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDate(undefined)}
                  className="text-muted-foreground h-auto py-1 px-2"
                >
                  Entfernen
                </Button>
              </div>
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
                <div className="flex items-center gap-2">
                  <Select value={hours} onValueChange={setHours}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {hourOptions.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-xl">:</span>
                  <Select value={minutes} onValueChange={setMinutes}>
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {minuteOptions.map((m) => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-sm text-muted-foreground">Uhr</span>
                </div>
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
