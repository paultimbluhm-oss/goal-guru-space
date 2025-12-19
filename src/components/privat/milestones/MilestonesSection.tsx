import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Plus, Target, Trash2, Edit, ChevronDown, ChevronUp, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';
import { format, isPast, isToday } from 'date-fns';
import { de } from 'date-fns/locale';

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  status: string;
  xp_reward: number;
  completed_at: string | null;
}

interface MilestoneItem {
  id: string;
  milestone_id: string;
  title: string;
  completed: boolean;
  order_index: number;
}

interface MilestonesSectionProps {
  onBack: () => void;
}

const statusLabels: Record<string, string> = {
  open: 'Offen',
  in_progress: 'In Bearbeitung',
  completed: 'Abgeschlossen',
  cancelled: 'Abgebrochen'
};

const statusColors: Record<string, string> = {
  open: 'bg-blue-500/20 text-blue-500',
  in_progress: 'bg-yellow-500/20 text-yellow-500',
  completed: 'bg-green-500/20 text-green-500',
  cancelled: 'bg-muted text-muted-foreground'
};

export function MilestonesSection({ onBack }: MilestonesSectionProps) {
  const { user } = useAuth();
  const { addXP } = useProfile();
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [items, setItems] = useState<Record<string, MilestoneItem[]>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [xpReward, setXpReward] = useState(50);
  const [newItemTitle, setNewItemTitle] = useState('');
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (user) {
      fetchMilestones();
    }
  }, [user]);

  const fetchMilestones = async () => {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('user_id', user!.id)
      .order('deadline', { ascending: true, nullsFirst: false });

    if (!error && data) {
      setMilestones(data);
      data.forEach(m => fetchItems(m.id));
    }
  };

  const fetchItems = async (milestoneId: string) => {
    const { data, error } = await supabase
      .from('milestone_items')
      .select('*')
      .eq('milestone_id', milestoneId)
      .order('order_index', { ascending: true });

    if (!error && data) {
      setItems(prev => ({ ...prev, [milestoneId]: data }));
    }
  };

  const saveMilestone = async () => {
    if (!title.trim()) return;

    if (editingMilestone) {
      const { error } = await supabase
        .from('milestones')
        .update({ 
          title, 
          description: description || null, 
          deadline: deadline || null,
          xp_reward: xpReward 
        })
        .eq('id', editingMilestone.id);

      if (!error) {
        toast.success('Meilenstein aktualisiert');
        fetchMilestones();
      }
    } else {
      const { error } = await supabase
        .from('milestones')
        .insert({
          user_id: user!.id,
          title,
          description: description || null,
          deadline: deadline || null,
          xp_reward: xpReward
        });

      if (!error) {
        toast.success('Meilenstein erstellt');
        fetchMilestones();
      }
    }

    resetForm();
  };

  const updateStatus = async (milestone: Milestone, newStatus: string) => {
    const wasNotCompleted = milestone.status !== 'completed';
    const isNowCompleted = newStatus === 'completed';

    const { error } = await supabase
      .from('milestones')
      .update({ 
        status: newStatus,
        completed_at: isNowCompleted ? new Date().toISOString() : null
      })
      .eq('id', milestone.id);

    if (!error) {
      if (wasNotCompleted && isNowCompleted) {
        await addXP(milestone.xp_reward);
        toast.success(`🎯 Meilenstein erreicht! +${milestone.xp_reward} XP`);
      } else {
        toast.success('Status aktualisiert');
      }
      fetchMilestones();
    }
  };

  const deleteMilestone = async (id: string) => {
    const { error } = await supabase
      .from('milestones')
      .delete()
      .eq('id', id);

    if (!error) {
      toast.success('Meilenstein gelöscht');
      fetchMilestones();
    }
  };

  const addItem = async (milestoneId: string) => {
    if (!newItemTitle.trim()) return;

    const currentItems = items[milestoneId] || [];
    const { error } = await supabase
      .from('milestone_items')
      .insert({
        user_id: user!.id,
        milestone_id: milestoneId,
        title: newItemTitle,
        order_index: currentItems.length
      });

    if (!error) {
      setNewItemTitle('');
      fetchItems(milestoneId);
    }
  };

  const toggleItem = async (item: MilestoneItem) => {
    const { error } = await supabase
      .from('milestone_items')
      .update({ completed: !item.completed })
      .eq('id', item.id);

    if (!error) {
      fetchItems(item.milestone_id);
    }
  };

  const deleteItem = async (item: MilestoneItem) => {
    const { error } = await supabase
      .from('milestone_items')
      .delete()
      .eq('id', item.id);

    if (!error) {
      fetchItems(item.milestone_id);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDeadline('');
    setXpReward(50);
    setEditingMilestone(null);
    setDialogOpen(false);
  };

  const openEdit = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setTitle(milestone.title);
    setDescription(milestone.description || '');
    setDeadline(milestone.deadline || '');
    setXpReward(milestone.xp_reward);
    setDialogOpen(true);
  };

  const getProgress = (milestoneId: string) => {
    const milestoneItems = items[milestoneId] || [];
    if (milestoneItems.length === 0) return 0;
    const completed = milestoneItems.filter(i => i.completed).length;
    return (completed / milestoneItems.length) * 100;
  };

  const filteredMilestones = milestones.filter(m => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/20">
              <Target className="w-5 h-5 text-purple-500" />
            </div>
            <h2 className="text-xl font-bold">Meilensteine</h2>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Neuer Meilenstein
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingMilestone ? 'Meilenstein bearbeiten' : 'Neuer Meilenstein'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Titel</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z.B. Projektabschluss" />
              </div>
              <div>
                <Label>Beschreibung (optional)</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details zum Meilenstein..." />
              </div>
              <div>
                <Label>Deadline (optional)</Label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <div>
                <Label>XP Belohnung</Label>
                <Input type="number" value={xpReward} onChange={(e) => setXpReward(Number(e.target.value))} min={1} />
              </div>
              <Button onClick={saveMilestone} className="w-full">
                {editingMilestone ? 'Speichern' : 'Erstellen'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'open', 'in_progress', 'completed', 'cancelled'].map((s) => (
          <Button
            key={s}
            variant={filter === s ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'Alle' : statusLabels[s]}
          </Button>
        ))}
      </div>

      {/* Milestones List */}
      <div className="space-y-4">
        {filteredMilestones.length === 0 ? (
          <Card className="p-8 glass-card text-center">
            <p className="text-muted-foreground">Keine Meilensteine gefunden</p>
          </Card>
        ) : (
          filteredMilestones.map((milestone) => {
            const progress = getProgress(milestone.id);
            const milestoneItems = items[milestone.id] || [];
            const isExpanded = expandedId === milestone.id;
            const isOverdue = milestone.deadline && isPast(new Date(milestone.deadline)) && milestone.status !== 'completed';

            return (
              <Card key={milestone.id} className="glass-card overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{milestone.title}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[milestone.status]}`}>
                          {statusLabels[milestone.status]}
                        </span>
                      </div>
                      {milestone.description && (
                        <p className="text-sm text-muted-foreground mb-2">{milestone.description}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {milestone.deadline && (
                          <span className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : ''}`}>
                            <Calendar className="w-3 h-3" />
                            {format(new Date(milestone.deadline), 'dd. MMM yyyy', { locale: de })}
                            {isOverdue && ' (überfällig)'}
                          </span>
                        )}
                        <span className="text-primary font-medium">+{milestone.xp_reward} XP</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={milestone.status} onValueChange={(v) => updateStatus(milestone, v)}>
                        <SelectTrigger className="w-[140px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Offen</SelectItem>
                          <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                          <SelectItem value="completed">Abgeschlossen</SelectItem>
                          <SelectItem value="cancelled">Abgebrochen</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(milestone)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteMilestone(milestone.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  {milestoneItems.length > 0 && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Fortschritt</span>
                        <span>{milestoneItems.filter(i => i.completed).length}/{milestoneItems.length}</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Expand button */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full mt-3"
                    onClick={() => setExpandedId(isExpanded ? null : milestone.id)}
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4 mr-2" /> : <ChevronDown className="w-4 h-4 mr-2" />}
                    {milestoneItems.length} Unterpunkte
                  </Button>
                </div>

                {/* Expanded items */}
                {isExpanded && (
                  <div className="border-t border-border p-4 bg-muted/30 space-y-2">
                    {milestoneItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <Checkbox 
                          checked={item.completed}
                          onCheckedChange={() => toggleItem(item)}
                        />
                        <span className={`flex-1 text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {item.title}
                        </span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteItem(item)}>
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-3">
                      <Input 
                        value={newItemTitle}
                        onChange={(e) => setNewItemTitle(e.target.value)}
                        placeholder="Neuer Unterpunkt..."
                        onKeyDown={(e) => e.key === 'Enter' && addItem(milestone.id)}
                        className="h-8"
                      />
                      <Button size="sm" onClick={() => addItem(milestone.id)}>
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
