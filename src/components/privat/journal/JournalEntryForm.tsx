import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Zap, Brain, Users, Sparkles, Target, Compass, Dumbbell } from 'lucide-react';

interface JournalEntry {
  // PERMA Model + additional science-backed factors
  mood_rating?: number | null;
  energy_level?: number | null;
  stress_level?: number | null;
  // Engagement/Flow
  flow_experiences?: number | null;
  // Relationships
  social_interactions?: number | null;
  quality_time_minutes?: number | null;
  connection_quality?: number | null;
  // Meaning/Purpose
  purpose_feeling?: number | null;
  helped_others?: boolean | null;
  // Accomplishment
  accomplishment_feeling?: number | null;
  progress_made?: number | null;
  // Autonomy
  autonomy_feeling?: number | null;
  // Exercise (kept as requested)
  exercise_minutes?: number | null;
  // Gratitude (science-backed for happiness)
  gratitude_1?: string | null;
  gratitude_2?: string | null;
  gratitude_3?: string | null;
  // Best moment
  best_moment?: string | null;
  // Notes
  notes?: string | null;
}

interface JournalEntryFormProps {
  initialData?: JournalEntry;
  onSave: (entry: JournalEntry) => void;
}

const ratingOptions = [
  { value: '1', label: 'Sehr niedrig' },
  { value: '2', label: 'Niedrig' },
  { value: '3', label: 'Mittel' },
  { value: '4', label: 'Hoch' },
  { value: '5', label: 'Sehr hoch' },
];

const stressOptions = [
  { value: '1', label: 'Minimal' },
  { value: '2', label: 'Wenig' },
  { value: '3', label: 'Moderat' },
  { value: '4', label: 'Hoch' },
  { value: '5', label: 'Sehr hoch' },
];

const flowOptions = [
  { value: '0', label: 'Keine' },
  { value: '1', label: '1 Moment' },
  { value: '2', label: '2 Momente' },
  { value: '3', label: '3+ Momente' },
];

const socialOptions = [
  { value: '0', label: 'Keine' },
  { value: '1', label: '1 Person' },
  { value: '2', label: '2 Personen' },
  { value: '3', label: '3 Personen' },
  { value: '5', label: '4-5 Personen' },
  { value: '10', label: '6+ Personen' },
];

const exerciseOptions = [
  { value: '0', label: 'Keine' },
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 Stunde' },
  { value: '90', label: '1.5+ Stunden' },
];

const yesNoOptions = [
  { value: 'true', label: 'Ja' },
  { value: 'false', label: 'Nein' },
];

export function JournalEntryForm({ initialData, onSave }: JournalEntryFormProps) {
  const [formData, setFormData] = useState<JournalEntry>(initialData || {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateField = (field: keyof JournalEntry, value: string | number | boolean | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Positive Emotions - PERMA P */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Heart className="h-4 w-4" /> Emotionen
        </h3>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Stimmung</Label>
            <Select 
              value={formData.mood_rating?.toString() || ''} 
              onValueChange={v => updateField('mood_rating', parseInt(v))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="..." />
              </SelectTrigger>
              <SelectContent>
                {ratingOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Zap className="h-3 w-3" /> Energie
            </Label>
            <Select 
              value={formData.energy_level?.toString() || ''} 
              onValueChange={v => updateField('energy_level', parseInt(v))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="..." />
              </SelectTrigger>
              <SelectContent>
                {ratingOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Brain className="h-3 w-3" /> Stress
            </Label>
            <Select 
              value={formData.stress_level?.toString() || ''} 
              onValueChange={v => updateField('stress_level', parseInt(v))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="..." />
              </SelectTrigger>
              <SelectContent>
                {stressOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Engagement - PERMA E */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Target className="h-4 w-4" /> Engagement & Flow
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Flow-Momente (volle Versunkenheit)</Label>
            <Select 
              value={formData.flow_experiences?.toString() || ''} 
              onValueChange={v => updateField('flow_experiences', parseInt(v))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Wählen..." />
              </SelectTrigger>
              <SelectContent>
                {flowOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Dumbbell className="h-3 w-3" /> Bewegung
            </Label>
            <Select 
              value={formData.exercise_minutes?.toString() || ''} 
              onValueChange={v => updateField('exercise_minutes', parseInt(v))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Wählen..." />
              </SelectTrigger>
              <SelectContent>
                {exerciseOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Relationships - PERMA R */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" /> Beziehungen
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Soziale Interaktionen</Label>
            <Select 
              value={formData.social_interactions?.toString() || ''} 
              onValueChange={v => updateField('social_interactions', parseInt(v))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Wählen..." />
              </SelectTrigger>
              <SelectContent>
                {socialOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Verbindungsqualität</Label>
            <Select 
              value={formData.connection_quality?.toString() || ''} 
              onValueChange={v => updateField('connection_quality', parseInt(v))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Wählen..." />
              </SelectTrigger>
              <SelectContent>
                {ratingOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Meaning - PERMA M */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Compass className="h-4 w-4" /> Sinn & Bedeutung
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Sinn-Gefühl heute</Label>
            <Select 
              value={formData.purpose_feeling?.toString() || ''} 
              onValueChange={v => updateField('purpose_feeling', parseInt(v))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Wählen..." />
              </SelectTrigger>
              <SelectContent>
                {ratingOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Anderen geholfen?</Label>
            <Select 
              value={formData.helped_others?.toString() || ''} 
              onValueChange={v => updateField('helped_others', v === 'true')}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Wählen..." />
              </SelectTrigger>
              <SelectContent>
                {yesNoOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Accomplishment - PERMA A */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Target className="h-4 w-4" /> Erfolg & Autonomie
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Fortschritt bei Zielen</Label>
            <Select 
              value={formData.progress_made?.toString() || ''} 
              onValueChange={v => updateField('progress_made', parseInt(v))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Wählen..." />
              </SelectTrigger>
              <SelectContent>
                {ratingOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Selbstbestimmtheit</Label>
            <Select 
              value={formData.autonomy_feeling?.toString() || ''} 
              onValueChange={v => updateField('autonomy_feeling', parseInt(v))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Wählen..." />
              </SelectTrigger>
              <SelectContent>
                {ratingOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Gratitude - Science-backed */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4" /> Dankbarkeit
        </h3>
        
        <div className="space-y-2">
          <Input
            placeholder="1. Wofür bin ich heute dankbar?"
            value={formData.gratitude_1 || ''}
            onChange={e => updateField('gratitude_1', e.target.value)}
            className="h-9 text-sm"
          />
          <Input
            placeholder="2. Was war heute ein positiver Moment?"
            value={formData.gratitude_2 || ''}
            onChange={e => updateField('gratitude_2', e.target.value)}
            className="h-9 text-sm"
          />
          <Input
            placeholder="3. Worauf freue ich mich?"
            value={formData.gratitude_3 || ''}
            onChange={e => updateField('gratitude_3', e.target.value)}
            className="h-9 text-sm"
          />
        </div>
      </div>

      {/* Best Moment */}
      <div className="space-y-1.5">
        <Label className="text-xs">Bester Moment des Tages</Label>
        <Input
          placeholder="Was war der Höhepunkt?"
          value={formData.best_moment || ''}
          onChange={e => updateField('best_moment', e.target.value)}
          className="h-9 text-sm"
        />
      </div>

      {/* Notes */}
      <div className="space-y-1.5">
        <Label className="text-xs">Notizen (optional)</Label>
        <Textarea
          placeholder="Weitere Gedanken..."
          value={formData.notes || ''}
          onChange={e => updateField('notes', e.target.value)}
          className="min-h-[60px] text-sm"
        />
      </div>

      <Button type="submit" className="w-full">
        Speichern
      </Button>
    </form>
  );
}
