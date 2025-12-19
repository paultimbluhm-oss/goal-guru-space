import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, FolderKanban, Plus, Trash2, Edit, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Project {
  id: string;
  title: string;
  description: string | null;
  subject_id: string | null;
  status: string;
  deadline: string | null;
  created_at: string;
}

interface Subject {
  id: string;
  name: string;
}

interface ProjectsSectionProps {
  onBack: () => void;
}

export function ProjectsSection({ onBack }: ProjectsSectionProps) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState<string>('none');
  const [status, setStatus] = useState('open');
  const [deadline, setDeadline] = useState('');

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    const [projectsRes, subjectsRes] = await Promise.all([
      supabase
        .from('school_projects')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('subjects')
        .select('id, name')
        .eq('user_id', user!.id)
    ]);

    if (projectsRes.data) setProjects(projectsRes.data);
    if (subjectsRes.data) setSubjects(subjectsRes.data);
  };

  const saveProject = async () => {
    if (!title.trim()) return;

    const projectData = {
      title,
      description: description || null,
      subject_id: subjectId === 'none' ? null : subjectId,
      status,
      deadline: deadline || null,
    };

    if (editingProject) {
      const { error } = await supabase
        .from('school_projects')
        .update(projectData)
        .eq('id', editingProject.id);

      if (!error) {
        toast.success('Projekt aktualisiert');
        fetchData();
      }
    } else {
      const { error } = await supabase
        .from('school_projects')
        .insert({ ...projectData, user_id: user!.id });

      if (!error) {
        toast.success('Projekt erstellt');
        fetchData();
      }
    }

    resetForm();
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase
      .from('school_projects')
      .delete()
      .eq('id', id);

    if (!error) {
      toast.success('Projekt gelöscht');
      fetchData();
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSubjectId('none');
    setStatus('open');
    setDeadline('');
    setEditingProject(null);
    setDialogOpen(false);
  };

  const openEdit = (project: Project) => {
    setEditingProject(project);
    setTitle(project.title);
    setDescription(project.description || '');
    setSubjectId(project.subject_id || 'none');
    setStatus(project.status);
    setDeadline(project.deadline || '');
    setDialogOpen(true);
  };

  const getSubjectName = (subjectId: string | null) => {
    if (!subjectId) return null;
    return subjects.find(s => s.id === subjectId)?.name;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-500/20 text-blue-500';
      case 'in_progress': return 'bg-yellow-500/20 text-yellow-500';
      case 'completed': return 'bg-green-500/20 text-green-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open': return 'Offen';
      case 'in_progress': return 'In Arbeit';
      case 'completed': return 'Abgeschlossen';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="p-2.5 rounded-xl bg-purple-500/20">
            <FolderKanban className="w-5 h-5 text-purple-500" />
          </div>
          <h2 className="text-xl font-bold">Schulprojekte</h2>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) resetForm(); setDialogOpen(open); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="hidden sm:flex">
              <Plus className="w-4 h-4 mr-2" />
              Neues Projekt
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingProject ? 'Projekt bearbeiten' : 'Neues Projekt'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Titel</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Projektname" />
              </div>
              <div>
                <Label>Beschreibung</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Was ist zu tun?" />
              </div>
              <div>
                <Label>Fach (optional)</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Fach wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kein Fach</SelectItem>
                    {subjects.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Offen</SelectItem>
                    <SelectItem value="in_progress">In Arbeit</SelectItem>
                    <SelectItem value="completed">Abgeschlossen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Deadline (optional)</Label>
                <Input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
              </div>
              <Button onClick={saveProject} className="w-full">
                {editingProject ? 'Speichern' : 'Erstellen'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects List */}
      <div className="space-y-3">
        {projects.length === 0 ? (
          <Card className="glass-card p-8 text-center">
            <FolderKanban className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Noch keine Projekte</p>
            <p className="text-sm text-muted-foreground">Erstelle dein erstes Schulprojekt!</p>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="glass-card p-4">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium truncate">{project.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(project.status)}`}>
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{project.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {getSubjectName(project.subject_id) && (
                      <span>{getSubjectName(project.subject_id)}</span>
                    )}
                    {project.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {format(new Date(project.deadline), 'dd.MM.yyyy', { locale: de })}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(project)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteProject(project.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Mobile button */}
      <Button className="w-full sm:hidden" onClick={() => setDialogOpen(true)}>
        <Plus className="w-4 h-4 mr-2" />
        Neues Projekt
      </Button>
    </div>
  );
}
