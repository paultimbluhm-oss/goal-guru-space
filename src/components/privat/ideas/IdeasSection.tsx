import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Lightbulb, Tag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAuth, getSupabase } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface Idea {
  id: string;
  title: string;
  content: string | null;
  topic: string | null;
  created_at: string | null;
}

interface IdeasSectionProps {
  onBack: () => void;
}

export function IdeasSection({ onBack }: IdeasSectionProps) {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [topic, setTopic] = useState('');
  const [filterTopic, setFilterTopic] = useState<string | null>(null);

  const topics = [...new Set(ideas.map(i => i.topic).filter(Boolean))];

  useEffect(() => {
    if (user) fetchIdeas();
  }, [user]);

  const fetchIdeas = async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) setIdeas(data);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !user) return;
    const supabase = getSupabase();
    const { error } = await supabase.from('ideas').insert({
      user_id: user.id,
      title: title.trim(),
      content: content.trim() || null,
      topic: topic.trim() || null,
    });

    if (error) {
      toast.error('Fehler beim Speichern');
      return;
    }

    toast.success('Idee gespeichert!');
    setTitle('');
    setContent('');
    setTopic('');
    setDialogOpen(false);
    fetchIdeas();
  };

  const handleDelete = async (id: string) => {
    const supabase = getSupabase();
    const { error } = await supabase.from('ideas').delete().eq('id', id);
    if (!error) {
      setIdeas(ideas.filter(i => i.id !== id));
      toast.success('Idee gelöscht');
    }
  };

  const filteredIdeas = filterTopic 
    ? ideas.filter(i => i.topic === filterTopic)
    : ideas;

  if (loading) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="p-3 rounded-xl bg-yellow-500/20">
            <Lightbulb className="w-6 h-6 text-yellow-500" />
          </div>
          <h1 className="text-2xl font-bold">Ideen</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Neue Idee
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neue Idee festhalten</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <Input
                placeholder="Titel der Idee *"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
              <Textarea
                placeholder="Beschreibung (optional)"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={3}
              />
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Thema/Kategorie (optional)"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              <Button onClick={handleSubmit} className="w-full" disabled={!title.trim()}>
                Idee speichern
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {topics.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Badge
            variant={filterTopic === null ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilterTopic(null)}
          >
            Alle
          </Badge>
          {topics.map(t => (
            <Badge
              key={t}
              variant={filterTopic === t ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setFilterTopic(t as string)}
            >
              {t}
            </Badge>
          ))}
        </div>
      )}

      {filteredIdeas.length === 0 ? (
        <Card className="p-8 text-center">
          <Lightbulb className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">
            {filterTopic ? 'Keine Ideen zu diesem Thema' : 'Noch keine Ideen festgehalten'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredIdeas.map((idea) => (
            <Card key={idea.id} className="p-4 hover:border-primary/30 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{idea.title}</h3>
                    {idea.topic && (
                      <Badge variant="secondary" className="text-xs">
                        {idea.topic}
                      </Badge>
                    )}
                  </div>
                  {idea.content && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {idea.content}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-2">
                    {idea.created_at && new Date(idea.created_at).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  onClick={() => handleDelete(idea.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
