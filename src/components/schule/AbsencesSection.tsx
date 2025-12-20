import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Plus, Calendar, Clock, Stethoscope, Thermometer, FolderKanban, HelpCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

interface Absence {
  id: string;
  date: string;
  hours: number;
  reason: 'sick' | 'doctor' | 'school_project' | 'other';
  description: string | null;
  created_at: string;
}

interface AbsencesSectionProps {
  onBack: () => void;
}

const HOURS_PER_DAY = 8; // Standard school day hours

const reasonLabels: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  sick: { label: 'Krank', icon: Thermometer, color: 'from-red-500 to-rose-600' },
  doctor: { label: 'Arztbesuch', icon: Stethoscope, color: 'from-blue-500 to-indigo-600' },
  school_project: { label: 'Schulprojekt', icon: FolderKanban, color: 'from-purple-500 to-violet-600' },
  other: { label: 'Sonstiges', icon: HelpCircle, color: 'from-gray-500 to-slate-600' },
};

export function AbsencesSection({ onBack }: AbsencesSectionProps) {
  const { user } = useAuth();
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Form state
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [hours, setHours] = useState('1');
  const [reason, setReason] = useState<'sick' | 'doctor' | 'school_project' | 'other'>('sick');
  const [description, setDescription] = useState('');

  const fetchAbsences = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('absences')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });

    if (error) {
      toast.error('Fehler beim Laden der Fehltage');
      console.error(error);
    } else {
      setAbsences(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAbsences();
  }, [user]);

  const handleSubmit = async () => {
    if (!user) return;

    const hoursNum = parseInt(hours);
    if (isNaN(hoursNum) || hoursNum < 1 || hoursNum > 12) {
      toast.error('Bitte gib eine gültige Stundenanzahl ein (1-12)');
      return;
    }

    const { error } = await supabase
      .from('absences')
      .insert({
        user_id: user.id,
        date,
        hours: hoursNum,
        reason,
        description: description || null,
      });

    if (error) {
      toast.error('Fehler beim Speichern');
      console.error(error);
    } else {
      toast.success('Fehltag eingetragen');
      setDialogOpen(false);
      resetForm();
      fetchAbsences();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('absences')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Fehler beim Löschen');
    } else {
      toast.success('Fehltag gelöscht');
      fetchAbsences();
    }
  };

  const resetForm = () => {
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setHours('1');
    setReason('sick');
    setDescription('');
  };

  // Calculate statistics
  const stats = absences.reduce(
    (acc, absence) => {
      acc.totalHours += absence.hours;
      if (absence.reason === 'sick' || absence.reason === 'doctor') {
        acc.realAbsenceHours += absence.hours;
      }
      if (absence.reason === 'school_project') {
        acc.projectHours += absence.hours;
      }
      if (absence.reason === 'other') {
        acc.otherHours += absence.hours;
      }
      return acc;
    },
    { totalHours: 0, realAbsenceHours: 0, projectHours: 0, otherHours: 0 }
  );

  const hoursToDay = (h: number) => (h / HOURS_PER_DAY).toFixed(1);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl md:text-2xl font-bold">Fehltage</h2>
            <p className="text-sm text-muted-foreground">Übersicht deiner Abwesenheiten</p>
          </div>
        </div>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Eintragen</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Fehltag eintragen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Datum</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Anzahl Stunden</Label>
                <Input
                  type="number"
                  min="1"
                  max="12"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="z.B. 4"
                />
              </div>
              <div className="space-y-2">
                <Label>Grund</Label>
                <Select value={reason} onValueChange={(v) => setReason(v as typeof reason)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sick">Krank</SelectItem>
                    <SelectItem value="doctor">Arztbesuch</SelectItem>
                    <SelectItem value="school_project">Schulprojekt</SelectItem>
                    <SelectItem value="other">Sonstiges</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Beschreibung (optional)</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="z.B. Zahnarzt, Mathe-Olympiade..."
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                Speichern
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-gray-500 to-slate-600">
              <Clock className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gesamt</p>
              <p className="text-lg font-bold">{stats.totalHours}h</p>
              <p className="text-xs text-muted-foreground">= {hoursToDay(stats.totalHours)} Tage</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-rose-600">
              <Thermometer className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Krank/Arzt</p>
              <p className="text-lg font-bold">{stats.realAbsenceHours}h</p>
              <p className="text-xs text-muted-foreground">= {hoursToDay(stats.realAbsenceHours)} Tage</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600">
              <FolderKanban className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Schulprojekte</p>
              <p className="text-lg font-bold">{stats.projectHours}h</p>
              <p className="text-xs text-muted-foreground">= {hoursToDay(stats.projectHours)} Tage</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/50">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-gray-400 to-gray-500">
              <HelpCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Sonstiges</p>
              <p className="text-lg font-bold">{stats.otherHours}h</p>
              <p className="text-xs text-muted-foreground">= {hoursToDay(stats.otherHours)} Tage</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Absences List */}
      <div className="space-y-3">
        <h3 className="font-semibold text-lg">Alle Einträge</h3>
        
        {absences.length === 0 ? (
          <Card className="p-8 text-center bg-card/80 backdrop-blur-sm border-border/50">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Noch keine Fehltage eingetragen</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {absences.map((absence) => {
              const reasonInfo = reasonLabels[absence.reason];
              const Icon = reasonInfo.icon;
              
              return (
                <Card 
                  key={absence.id} 
                  className="p-4 bg-card/80 backdrop-blur-sm border-border/50 flex items-center gap-4"
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${reasonInfo.color}`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{reasonInfo.label}</span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(absence.date), 'dd. MMM yyyy', { locale: de })}
                      </span>
                    </div>
                    {absence.description && (
                      <p className="text-sm text-muted-foreground truncate">{absence.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{absence.hours}h</p>
                    <p className="text-xs text-muted-foreground">{hoursToDay(absence.hours)} Tage</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(absence.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
