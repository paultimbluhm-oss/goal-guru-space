import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, RotateCcw, Pencil, Check, X, GripVertical, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth, getSupabase } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ChecklistItem {
  id: string;
  content: string;
  completed: boolean;
  order_index: number;
}

interface Checklist {
  id: string;
  name: string;
}

interface ChecklistDetailViewProps {
  checklistId: string;
  onBack: () => void;
}

export function ChecklistDetailView({ checklistId, onBack }: ChecklistDetailViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemContent, setNewItemContent] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [tempItemContent, setTempItemContent] = useState('');

  const fetchData = async () => {
    if (!user) return;
    const supabase = getSupabase();

    const [checklistRes, itemsRes] = await Promise.all([
      supabase.from('checklists').select('*').eq('id', checklistId).single(),
      supabase
        .from('checklist_items')
        .select('*')
        .eq('checklist_id', checklistId)
        .order('order_index', { ascending: true }),
    ]);

    if (checklistRes.data) {
      setChecklist(checklistRes.data);
      setTempName(checklistRes.data.name);
    }
    setItems(itemsRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [checklistId, user]);

  const updateChecklistName = async () => {
    if (!tempName.trim() || !checklist) return;
    const supabase = getSupabase();

    const { error } = await supabase
      .from('checklists')
      .update({ name: tempName.trim() })
      .eq('id', checklist.id);

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      setChecklist({ ...checklist, name: tempName.trim() });
      setEditingName(false);
    }
  };

  const addItem = async () => {
    if (!user || !newItemContent.trim()) return;
    const supabase = getSupabase();

    const maxOrder = items.length > 0 ? Math.max(...items.map(i => i.order_index)) : -1;

    const { error } = await supabase.from('checklist_items').insert({
      user_id: user.id,
      checklist_id: checklistId,
      content: newItemContent.trim(),
      order_index: maxOrder + 1,
      completed: false,
    });

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      setNewItemContent('');
      fetchData();
    }
  };

  const toggleItem = async (item: ChecklistItem) => {
    const supabase = getSupabase();

    const { error } = await supabase
      .from('checklist_items')
      .update({ completed: !item.completed })
      .eq('id', item.id);

    if (!error) {
      setItems(items.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i));
    }
  };

  const updateItemContent = async (itemId: string) => {
    if (!tempItemContent.trim()) return;
    const supabase = getSupabase();

    const { error } = await supabase
      .from('checklist_items')
      .update({ content: tempItemContent.trim() })
      .eq('id', itemId);

    if (!error) {
      setItems(items.map(i => i.id === itemId ? { ...i, content: tempItemContent.trim() } : i));
      setEditingItemId(null);
    }
  };

  const deleteItem = async (itemId: string) => {
    const supabase = getSupabase();

    const { error } = await supabase.from('checklist_items').delete().eq('id', itemId);

    if (!error) {
      setItems(items.filter(i => i.id !== itemId));
    }
  };

  const resetAll = async () => {
    const supabase = getSupabase();

    const { error } = await supabase
      .from('checklist_items')
      .update({ completed: false })
      .eq('checklist_id', checklistId);

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      setItems(items.map(i => ({ ...i, completed: false })));
      toast({ title: 'Alle Punkte zurückgesetzt' });
    }
  };

  const completedCount = items.filter(i => i.completed).length;
  const hasCompletedItems = completedCount > 0;

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Laden...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          
          {editingName ? (
            <div className="flex items-center gap-2">
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="text-xl font-bold"
                autoFocus
              />
              <Button size="icon" variant="ghost" onClick={updateChecklistName}>
                <Check className="w-4 h-4" />
              </Button>
              <Button size="icon" variant="ghost" onClick={() => setEditingName(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold">{checklist?.name}</h2>
              <Button size="icon" variant="ghost" onClick={() => setEditingName(true)}>
                <Pencil className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>

        {hasCompletedItems && (
          <Button variant="outline" onClick={resetAll}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Alles zurücksetzen
          </Button>
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        {completedCount} / {items.length} erledigt
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`glass-card p-3 flex items-center gap-3 group ${
              item.completed ? 'opacity-60' : ''
            }`}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
            
            <Checkbox
              checked={item.completed}
              onCheckedChange={() => toggleItem(item)}
            />

            {editingItemId === item.id ? (
              <div className="flex-1 flex items-center gap-2">
                <Input
                  value={tempItemContent}
                  onChange={(e) => setTempItemContent(e.target.value)}
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') updateItemContent(item.id);
                    if (e.key === 'Escape') setEditingItemId(null);
                  }}
                />
                <Button size="icon" variant="ghost" onClick={() => updateItemContent(item.id)}>
                  <Check className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => setEditingItemId(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <>
                <span
                  className={`flex-1 ${item.completed ? 'line-through text-muted-foreground' : ''}`}
                  onDoubleClick={() => {
                    setEditingItemId(item.id);
                    setTempItemContent(item.content);
                  }}
                >
                  {item.content}
                </span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => {
                    setEditingItemId(item.id);
                    setTempItemContent(item.content);
                  }}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="opacity-0 group-hover:opacity-100"
                  onClick={() => deleteItem(item.id)}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={newItemContent}
          onChange={(e) => setNewItemContent(e.target.value)}
          placeholder="Neuen Punkt hinzufügen..."
          onKeyDown={(e) => {
            if (e.key === 'Enter') addItem();
          }}
        />
        <Button onClick={addItem} disabled={!newItemContent.trim()}>
          <Plus className="w-4 h-4 mr-2" />
          Hinzufügen
        </Button>
      </div>
    </div>
  );
}
