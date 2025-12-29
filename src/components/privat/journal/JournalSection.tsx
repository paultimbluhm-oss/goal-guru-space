import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, BookHeart, Plus, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { de } from 'date-fns/locale';
import { JournalEntryForm } from './JournalEntryForm';
import { JournalSuggestions } from './JournalSuggestions';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface JournalEntry {
  id: string;
  entry_date: string;
  sleep_hours: number | null;
  sleep_quality: number | null;
  nutrition_quality: number | null;
  hydration_liters: number | null;
  exercise_minutes: number | null;
  exercise_type: string | null;
  mood_rating: number | null;
  energy_level: number | null;
  stress_level: number | null;
  social_interactions: number | null;
  quality_time_minutes: number | null;
  gratitude_1: string | null;
  gratitude_2: string | null;
  gratitude_3: string | null;
  notes: string | null;
}

interface JournalSectionProps {
  onBack: () => void;
}

export function JournalSection({ onBack }: JournalSectionProps) {
  const { user } = useAuth();
  const [todayEntry, setTodayEntry] = useState<JournalEntry | null>(null);
  const [recentEntries, setRecentEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(true);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const today = format(new Date(), 'yyyy-MM-dd');

  useEffect(() => {
    if (user) {
      fetchEntries();
    }
  }, [user]);

  const fetchEntries = async () => {
    if (!user) return;
    
    setLoading(false);
    
    // Fetch today's entry
    const { data: todayData } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .eq('entry_date', today)
      .single();
    
    if (todayData) {
      setTodayEntry(todayData);
      setIsFormOpen(false);
    }
    
    // Fetch last 7 days for suggestions
    const weekAgo = format(subDays(new Date(), 7), 'yyyy-MM-dd');
    const { data: recentData } = await supabase
      .from('journal_entries')
      .select('*')
      .eq('user_id', user.id)
      .gte('entry_date', weekAgo)
      .order('entry_date', { ascending: false });
    
    if (recentData) {
      setRecentEntries(recentData);
    }
  };

  const handleSave = async (entry: Partial<JournalEntry>) => {
    if (!user) return;
    
    const entryData = {
      ...entry,
      user_id: user.id,
      entry_date: today
    };
    
    if (todayEntry) {
      const { error } = await supabase
        .from('journal_entries')
        .update(entryData)
        .eq('id', todayEntry.id);
      
      if (error) {
        toast.error('Fehler beim Speichern');
        return;
      }
    } else {
      const { error } = await supabase
        .from('journal_entries')
        .insert(entryData);
      
      if (error) {
        toast.error('Fehler beim Speichern');
        return;
      }
    }
    
    toast.success('Journal gespeichert');
    fetchEntries();
    setIsFormOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600">
              <BookHeart className="h-5 w-5 text-white" />
            </div>
            <h1 className="text-xl font-bold">Journal</h1>
          </div>
        </div>
        {todayEntry && !isFormOpen && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsFormOpen(true)}
          >
            Bearbeiten
          </Button>
        )}
      </div>

      {/* Suggestions Card */}
      <JournalSuggestions entries={recentEntries} todayEntry={todayEntry} />

      {/* Today's Entry Form */}
      <Collapsible open={isFormOpen} onOpenChange={setIsFormOpen}>
        <Card className="border-border/50">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  Heutiger Eintrag
                  <span className="text-xs text-muted-foreground font-normal">
                    {format(new Date(), 'EEEE, d. MMMM', { locale: de })}
                  </span>
                </CardTitle>
                {isFormOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="pt-0">
              <JournalEntryForm 
                initialData={todayEntry || undefined} 
                onSave={handleSave}
              />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* History */}
      {recentEntries.length > 1 && (
        <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
          <Card className="border-border/50">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors py-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Letzte Einträge</CardTitle>
                  {isHistoryOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-2">
                {recentEntries.filter(e => e.entry_date !== today).map(entry => (
                  <div key={entry.id} className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <div className="text-sm font-medium">
                      {format(new Date(entry.entry_date), 'EEEE, d. MMMM', { locale: de })}
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                      {entry.mood_rating && <span>Stimmung: {entry.mood_rating}/5</span>}
                      {entry.energy_level && <span>Energie: {entry.energy_level}/5</span>}
                      {entry.sleep_hours && <span>Schlaf: {entry.sleep_hours}h</span>}
                    </div>
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}
    </div>
  );
}
