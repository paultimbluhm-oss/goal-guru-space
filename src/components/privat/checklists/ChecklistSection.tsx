import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth, getSupabase } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { ChecklistCard } from './ChecklistCard';
import { AddChecklistDialog } from './AddChecklistDialog';
import { ChecklistDetailView } from './ChecklistDetailView';

interface Checklist {
  id: string;
  name: string;
  created_at: string;
  items_count?: number;
  completed_count?: number;
}

interface ChecklistSectionProps {
  onBack: () => void;
}

export function ChecklistSection({ onBack }: ChecklistSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<string | null>(null);

  const fetchChecklists = async () => {
    if (!user) return;
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('checklists')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Fehler beim Laden', description: error.message, variant: 'destructive' });
    } else {
      const checklistsWithCounts = await Promise.all(
        (data || []).map(async (checklist) => {
          const { data: items } = await supabase
            .from('checklist_items')
            .select('completed')
            .eq('checklist_id', checklist.id);
          
          return {
            ...checklist,
            items_count: items?.length || 0,
            completed_count: items?.filter(i => i.completed).length || 0,
          };
        })
      );
      setChecklists(checklistsWithCounts);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchChecklists();
  }, [user]);

  const handleDelete = async (id: string) => {
    const supabase = getSupabase();
    await supabase.from('checklist_items').delete().eq('checklist_id', id);
    const { error } = await supabase.from('checklists').delete().eq('id', id);
    
    if (error) {
      toast({ title: 'Fehler beim Löschen', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Checkliste gelöscht' });
      fetchChecklists();
    }
  };

  if (selectedChecklist) {
    return (
      <ChecklistDetailView
        checklistId={selectedChecklist}
        onBack={() => {
          setSelectedChecklist(null);
          fetchChecklists();
        }}
      />
    );
  }

  const totalItems = checklists.reduce((sum, c) => sum + (c.items_count || 0), 0);
  const completedItems = checklists.reduce((sum, c) => sum + (c.completed_count || 0), 0);

  return (
    <div className="space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0 h-8 w-8">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shrink-0">
              <ListChecks className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold truncate">Checklisten</h2>
            <span className="text-xs text-muted-foreground">({checklists.length})</span>
          </div>
        </div>
        <Button 
          size="sm" 
          onClick={() => setShowAddDialog(true)}
          className="hidden sm:flex gap-1 h-8 text-xs"
        >
          <Plus className="w-3.5 h-3.5" />
          Neu
        </Button>
      </div>

      {/* Compact Stats */}
      {checklists.length > 0 && (
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{completedItems} / {totalItems} Punkte erledigt</span>
          {totalItems > 0 && (
            <span className="text-emerald-500 font-medium">
              {Math.round((completedItems / totalItems) * 100)}%
            </span>
          )}
        </div>
      )}

      {/* Checklists List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Laden...</div>
      ) : checklists.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <ListChecks className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">Keine Checklisten</p>
          <Button 
            variant="link" 
            className="text-xs mt-1"
            onClick={() => setShowAddDialog(true)}
          >
            Erste Checkliste erstellen
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {checklists.map((checklist) => (
            <ChecklistCard
              key={checklist.id}
              checklist={checklist}
              onClick={() => setSelectedChecklist(checklist.id)}
              onDelete={() => handleDelete(checklist.id)}
            />
          ))}
        </div>
      )}

      {/* Mobile FAB */}
      <Button 
        className="fixed bottom-20 right-4 sm:hidden h-12 w-12 rounded-full shadow-lg z-40"
        onClick={() => setShowAddDialog(true)}
      >
        <Plus className="w-5 h-5" />
      </Button>

      <AddChecklistDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        onSuccess={() => {
          setShowAddDialog(false);
          fetchChecklists();
        }}
      />
    </div>
  );
}
