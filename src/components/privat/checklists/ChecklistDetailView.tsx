import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, RotateCcw, Pencil, Check, X, GripVertical, Trash2, FolderPlus, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth, getSupabase } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface ChecklistSection {
  id: string;
  name: string;
  order_index: number;
}

interface ChecklistItem {
  id: string;
  content: string;
  completed: boolean;
  order_index: number;
  section_id: string | null;
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
  const [sections, setSections] = useState<ChecklistSection[]>([]);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newItemContent, setNewItemContent] = useState('');
  const [newItemSectionId, setNewItemSectionId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [tempItemContent, setTempItemContent] = useState('');
  const [newSectionName, setNewSectionName] = useState('');
  const [showAddSection, setShowAddSection] = useState(false);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [tempSectionName, setTempSectionName] = useState('');
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  const fetchData = async () => {
    if (!user) return;
    const supabase = getSupabase();

    const [checklistRes, sectionsRes, itemsRes] = await Promise.all([
      supabase.from('checklists').select('*').eq('id', checklistId).single(),
      supabase
        .from('checklist_sections')
        .select('*')
        .eq('checklist_id', checklistId)
        .order('order_index', { ascending: true }),
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
    setSections(sectionsRes.data || []);
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

  const addSection = async () => {
    if (!user || !newSectionName.trim()) return;
    const supabase = getSupabase();

    const maxOrder = sections.length > 0 ? Math.max(...sections.map(s => s.order_index)) : -1;

    const { error } = await supabase.from('checklist_sections').insert({
      user_id: user.id,
      checklist_id: checklistId,
      name: newSectionName.trim(),
      order_index: maxOrder + 1,
    });

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      setNewSectionName('');
      setShowAddSection(false);
      fetchData();
    }
  };

  const updateSectionName = async (sectionId: string) => {
    if (!tempSectionName.trim()) return;
    const supabase = getSupabase();

    const { error } = await supabase
      .from('checklist_sections')
      .update({ name: tempSectionName.trim() })
      .eq('id', sectionId);

    if (!error) {
      setSections(sections.map(s => s.id === sectionId ? { ...s, name: tempSectionName.trim() } : s));
      setEditingSectionId(null);
    }
  };

  const deleteSection = async (sectionId: string) => {
    const supabase = getSupabase();
    
    // Move items to unsorted before deleting section
    await supabase
      .from('checklist_items')
      .update({ section_id: null })
      .eq('section_id', sectionId);

    const { error } = await supabase.from('checklist_sections').delete().eq('id', sectionId);

    if (!error) {
      fetchData();
    }
  };

  const addItem = async (sectionId: string | null = null) => {
    if (!user || !newItemContent.trim()) return;
    const supabase = getSupabase();

    const sectionItems = items.filter(i => i.section_id === sectionId);
    const maxOrder = sectionItems.length > 0 ? Math.max(...sectionItems.map(i => i.order_index)) : -1;

    const { error } = await supabase.from('checklist_items').insert({
      user_id: user.id,
      checklist_id: checklistId,
      section_id: sectionId,
      content: newItemContent.trim(),
      order_index: maxOrder + 1,
      completed: false,
    });

    if (error) {
      toast({ title: 'Fehler', description: error.message, variant: 'destructive' });
    } else {
      setNewItemContent('');
      setNewItemSectionId(null);
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

  const toggleSectionCollapse = (sectionId: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  const completedCount = items.filter(i => i.completed).length;
  const hasCompletedItems = completedCount > 0;
  
  const unsortedItems = items.filter(i => !i.section_id);

  const renderItem = (item: ChecklistItem) => (
    <div
      key={item.id}
      className={`p-3 flex items-center gap-3 group border-b border-border/50 last:border-0 ${
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
            className={`flex-1 text-sm ${item.completed ? 'line-through text-muted-foreground' : ''}`}
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
            className="opacity-0 group-hover:opacity-100 h-8 w-8"
            onClick={() => {
              setEditingItemId(item.id);
              setTempItemContent(item.content);
            }}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="opacity-0 group-hover:opacity-100 h-8 w-8"
            onClick={() => deleteItem(item.id)}
          >
            <Trash2 className="w-3.5 h-3.5 text-destructive" />
          </Button>
        </>
      )}
    </div>
  );

  const renderAddItemInput = (sectionId: string | null) => {
    if (newItemSectionId !== sectionId) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start text-muted-foreground"
          onClick={() => setNewItemSectionId(sectionId)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Punkt hinzufügen
        </Button>
      );
    }

    return (
      <div className="flex gap-2 p-2">
        <Input
          value={newItemContent}
          onChange={(e) => setNewItemContent(e.target.value)}
          placeholder="Neuen Punkt eingeben..."
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') addItem(sectionId);
            if (e.key === 'Escape') {
              setNewItemSectionId(null);
              setNewItemContent('');
            }
          }}
        />
        <Button size="sm" onClick={() => addItem(sectionId)} disabled={!newItemContent.trim()}>
          <Plus className="w-4 h-4" />
        </Button>
        <Button size="sm" variant="ghost" onClick={() => {
          setNewItemSectionId(null);
          setNewItemContent('');
        }}>
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  };

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

        <div className="flex gap-2">
          {hasCompletedItems && (
            <Button variant="outline" size="sm" onClick={resetAll}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Zurücksetzen
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          {completedCount} / {items.length} erledigt
        </div>
        <Button variant="outline" size="sm" onClick={() => setShowAddSection(true)}>
          <FolderPlus className="w-4 h-4 mr-2" />
          Bereich hinzufügen
        </Button>
      </div>

      {showAddSection && (
        <Card className="p-3">
          <div className="flex gap-2">
            <Input
              value={newSectionName}
              onChange={(e) => setNewSectionName(e.target.value)}
              placeholder="Name des Bereichs..."
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') addSection();
                if (e.key === 'Escape') {
                  setShowAddSection(false);
                  setNewSectionName('');
                }
              }}
            />
            <Button onClick={addSection} disabled={!newSectionName.trim()}>
              Erstellen
            </Button>
            <Button variant="ghost" onClick={() => {
              setShowAddSection(false);
              setNewSectionName('');
            }}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {/* Sections */}
        {sections.map((section) => {
          const sectionItems = items.filter(i => i.section_id === section.id);
          const sectionCompleted = sectionItems.filter(i => i.completed).length;
          const isCollapsed = collapsedSections.has(section.id);

          return (
            <Card key={section.id} className="overflow-hidden">
              <Collapsible open={!isCollapsed} onOpenChange={() => toggleSectionCollapse(section.id)}>
                <div className="flex items-center justify-between p-3 bg-muted/50 border-b border-border">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-0 h-auto hover:bg-transparent">
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 mr-2" />
                      ) : (
                        <ChevronDown className="w-4 h-4 mr-2" />
                      )}
                      {editingSectionId === section.id ? (
                        <Input
                          value={tempSectionName}
                          onChange={(e) => setTempSectionName(e.target.value)}
                          className="h-7 text-sm font-medium"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter') updateSectionName(section.id);
                            if (e.key === 'Escape') setEditingSectionId(null);
                          }}
                        />
                      ) : (
                        <span className="font-medium">{section.name}</span>
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {sectionCompleted}/{sectionItems.length}
                    </span>
                    {editingSectionId === section.id ? (
                      <>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => updateSectionName(section.id)}>
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingSectionId(null)}>
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingSectionId(section.id);
                            setTempSectionName(section.name);
                          }}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => deleteSection(section.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
                <CollapsibleContent>
                  <div>
                    {sectionItems.map(renderItem)}
                    {renderAddItemInput(section.id)}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          );
        })}

        {/* Unsorted items */}
        {(unsortedItems.length > 0 || sections.length === 0) && (
          <Card className="overflow-hidden">
            <div className="p-3 bg-muted/30 border-b border-border">
              <span className="font-medium text-muted-foreground">
                {sections.length > 0 ? 'Unsortiert' : 'Punkte'}
              </span>
              <span className="text-xs text-muted-foreground ml-2">
                {unsortedItems.filter(i => i.completed).length}/{unsortedItems.length}
              </span>
            </div>
            <div>
              {unsortedItems.map(renderItem)}
              {renderAddItemInput(null)}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}