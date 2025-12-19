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
      // Fetch item counts for each checklist
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
    
    // First delete all items
    await supabase.from('checklist_items').delete().eq('checklist_id', id);
    
    // Then delete the checklist
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="p-3 rounded-xl bg-primary/20">
            <ListChecks className="w-6 h-6 text-primary" />
          </div>
          <h2 className="text-2xl font-bold">Checklisten</h2>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Neue Checkliste
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Laden...</div>
      ) : checklists.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <ListChecks className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Noch keine Checklisten vorhanden</p>
          <p className="text-sm mt-2">Erstelle deine erste Checkliste für wiederkehrende Aufgaben</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
