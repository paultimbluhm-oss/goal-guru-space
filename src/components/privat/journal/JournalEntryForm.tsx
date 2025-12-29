import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Moon, Utensils, Droplets, Dumbbell, Heart, Zap, Brain, Users, Sparkles } from 'lucide-react';

interface JournalEntry {
  sleep_hours?: number | null;
  sleep_quality?: number | null;
  nutrition_quality?: number | null;
  hydration_liters?: number | null;
  exercise_minutes?: number | null;
  exercise_type?: string | null;
  mood_rating?: number | null;
  energy_level?: number | null;
  stress_level?: number | null;
  social_interactions?: number | null;
  quality_time_minutes?: number | null;
  gratitude_1?: string | null;
  gratitude_2?: string | null;
  gratitude_3?: string | null;
  notes?: string | null;
}

interface JournalEntryFormProps {
  initialData?: JournalEntry;
  onSave: (entry: JournalEntry) => void;
}

const qualityOptions = [
  { value: '1', label: '😞 Schlecht' },
  { value: '2', label: '😕 Mäßig' },
  { value: '3', label: '😐 Okay' },
  { value: '4', label: '🙂 Gut' },
  { value: '5', label: '😄 Sehr gut' },
];

const stressOptions = [
  { value: '1', label: '😌 Minimal' },
  { value: '2', label: '🙂 Wenig' },
  { value: '3', label: '😐 Moderat' },
  { value: '4', label: '😰 Hoch' },
  { value: '5', label: '🤯 Sehr hoch' },
];

const sleepOptions = Array.from({ length: 13 }, (_, i) => ({
  value: String(i + 4),
  label: `${i + 4} Stunden`
}));

const exerciseOptions = [
  { value: '0', label: 'Keine' },
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 Stunde' },
  { value: '90', label: '1.5 Stunden' },
  { value: '120', label: '2+ Stunden' },
];

const exerciseTypeOptions = [
  { value: 'none', label: 'Keine' },
  { value: 'walking', label: 'Spazieren' },
  { value: 'running', label: 'Laufen' },
  { value: 'gym', label: 'Fitnessstudio' },
  { value: 'yoga', label: 'Yoga' },
  { value: 'cycling', label: 'Radfahren' },
  { value: 'swimming', label: 'Schwimmen' },
  { value: 'sports', label: 'Sport' },
  { value: 'other', label: 'Sonstiges' },
];

const hydrationOptions = [
  { value: '0.5', label: '0.5 L' },
  { value: '1', label: '1 L' },
  { value: '1.5', label: '1.5 L' },
  { value: '2', label: '2 L' },
  { value: '2.5', label: '2.5 L' },
  { value: '3', label: '3+ L' },
];

const socialOptions = [
  { value: '0', label: 'Keine' },
  { value: '1', label: '1 Person' },
  { value: '2', label: '2 Personen' },
  { value: '3', label: '3 Personen' },
  { value: '5', label: '4-5 Personen' },
  { value: '10', label: '6+ Personen' },
];

export function JournalEntryForm({ initialData, onSave }: JournalEntryFormProps) {
  const [formData, setFormData] = useState<JournalEntry>(initialData || {});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const updateField = (field: keyof JournalEntry, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Physical Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Moon className="h-4 w-4" /> Körperlich
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Schlafstunden</Label>
            <Select 
              value={formData.sleep_hours?.toString() || ''} 
              onValueChange={v => updateField('sleep_hours', parseInt(v))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Wählen..." />
              </SelectTrigger>
              <SelectContent>
                {sleepOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Schlafqualität</Label>
            <Select 
              value={formData.sleep_quality?.toString() || ''} 
              onValueChange={v => updateField('sleep_quality', parseInt(v))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Wählen..." />
              </SelectTrigger>
              <SelectContent>
                {qualityOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Utensils className="h-3 w-3" /> Ernährung
            </Label>
            <Select 
              value={formData.nutrition_quality?.toString() || ''} 
              onValueChange={v => updateField('nutrition_quality', parseInt(v))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Wählen..." />
              </SelectTrigger>
              <SelectContent>
                {qualityOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Droplets className="h-3 w-3" /> Wasser
            </Label>
            <Select 
              value={formData.hydration_liters?.toString() || ''} 
              onValueChange={v => updateField('hydration_liters', parseFloat(v))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Wählen..." />
              </SelectTrigger>
              <SelectContent>
                {hydrationOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
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

          <div className="space-y-1.5">
            <Label className="text-xs">Sportart</Label>
            <Select 
              value={formData.exercise_type || ''} 
              onValueChange={v => updateField('exercise_type', v)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Wählen..." />
              </SelectTrigger>
              <SelectContent>
                {exerciseTypeOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Mental Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Heart className="h-4 w-4" /> Mental & Emotional
        </h3>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs flex items-center gap-1">
              <Heart className="h-3 w-3" /> Stimmung
            </Label>
            <Select 
              value={formData.mood_rating?.toString() || ''} 
              onValueChange={v => updateField('mood_rating', parseInt(v))}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="..." />
              </SelectTrigger>
              <SelectContent>
                {qualityOptions.map(opt => (
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
                {qualityOptions.map(opt => (
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

      {/* Social Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
          <Users className="h-4 w-4" /> Sozial
        </h3>
        
        <div className="space-y-1.5">
          <Label className="text-xs">Soziale Interaktionen heute</Label>
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
      </div>

      {/* Gratitude Section */}
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
            placeholder="2. Was hat mich heute glücklich gemacht?"
            value={formData.gratitude_2 || ''}
            onChange={e => updateField('gratitude_2', e.target.value)}
            className="h-9 text-sm"
          />
          <Input
            placeholder="3. Was war heute positiv?"
            value={formData.gratitude_3 || ''}
            onChange={e => updateField('gratitude_3', e.target.value)}
            className="h-9 text-sm"
          />
        </div>
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
