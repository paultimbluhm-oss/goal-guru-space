import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Ingredient {
  name: string;
  amount: string;
  unit: string;
}

interface Step {
  instruction: string;
}

interface AddRecipeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const units = ['g', 'kg', 'ml', 'l', 'TL', 'EL', 'Stück', 'Prise', 'Tasse', 'Packung'];

export function AddRecipeDialog({ open, onOpenChange, onSuccess }: AddRecipeDialogProps) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [servings, setServings] = useState('4');
  const [prepTime, setPrepTime] = useState('');
  const [cookTime, setCookTime] = useState('');
  const [tasteRating, setTasteRating] = useState('');
  const [healthRating, setHealthRating] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([{ name: '', amount: '', unit: 'g' }]);
  const [steps, setSteps] = useState<Step[]>([{ instruction: '' }]);
  const [saving, setSaving] = useState(false);

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: 'g' }]);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const updateIngredient = (index: number, field: keyof Ingredient, value: string) => {
    const updated = [...ingredients];
    updated[index][field] = value;
    setIngredients(updated);
  };

  const addStep = () => {
    setSteps([...steps, { instruction: '' }]);
  };

  const removeStep = (index: number) => {
    setSteps(steps.filter((_, i) => i !== index));
  };

  const updateStep = (index: number, value: string) => {
    const updated = [...steps];
    updated[index].instruction = value;
    setSteps(updated);
  };

  const handleSubmit = async () => {
    if (!name.trim() || !user) return;
    setSaving(true);

    try {
      // Create recipe
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          user_id: user.id,
          name: name.trim(),
          description: description.trim() || null,
          servings: parseInt(servings) || 4,
          prep_time_minutes: prepTime ? parseInt(prepTime) : null,
          cook_time_minutes: cookTime ? parseInt(cookTime) : null,
          taste_rating: tasteRating ? parseInt(tasteRating) : null,
          health_rating: healthRating ? parseInt(healthRating) : null,
        })
        .select()
        .single();

      if (recipeError) throw recipeError;

      // Add ingredients
      const validIngredients = ingredients.filter(i => i.name.trim());
      if (validIngredients.length > 0) {
        const { error: ingredientsError } = await supabase
          .from('recipe_ingredients')
          .insert(
            validIngredients.map((ing, index) => ({
              recipe_id: recipe.id,
              user_id: user.id,
              name: ing.name.trim(),
              amount: ing.amount ? parseFloat(ing.amount) : null,
              unit: ing.unit || null,
              order_index: index,
            }))
          );
        if (ingredientsError) throw ingredientsError;
      }

      // Add steps
      const validSteps = steps.filter(s => s.instruction.trim());
      if (validSteps.length > 0) {
        const { error: stepsError } = await supabase
          .from('recipe_steps')
          .insert(
            validSteps.map((step, index) => ({
              recipe_id: recipe.id,
              user_id: user.id,
              step_number: index + 1,
              instruction: step.instruction.trim(),
            }))
          );
        if (stepsError) throw stepsError;
      }

      toast.success('Rezept erstellt!');
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast.error('Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setServings('4');
    setPrepTime('');
    setCookTime('');
    setTasteRating('');
    setHealthRating('');
    setIngredients([{ name: '', amount: '', unit: 'g' }]);
    setSteps([{ instruction: '' }]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Neues Rezept
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neues Rezept erstellen</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <Input
              placeholder="Rezeptname *"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Textarea
              placeholder="Beschreibung (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Time & Servings */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">Portionen</Label>
              <Input
                type="number"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                min={1}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Vorbereitung (Min)</Label>
              <Input
                type="number"
                placeholder="0"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Kochzeit (Min)</Label>
              <Input
                type="number"
                placeholder="0"
                value={cookTime}
                onChange={(e) => setCookTime(e.target.value)}
              />
            </div>
          </div>

          {/* Ratings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground">😋 Geschmack</Label>
              <Select value={tasteRating} onValueChange={setTasteRating}>
                <SelectTrigger>
                  <SelectValue placeholder="Bewertung" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n}/5</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">🥗 Gesundheit</Label>
              <Select value={healthRating} onValueChange={setHealthRating}>
                <SelectTrigger>
                  <SelectValue placeholder="Bewertung" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(n => (
                    <SelectItem key={n} value={n.toString()}>{n}/5</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Ingredients */}
          <div className="space-y-3">
            <Label className="font-medium">Zutaten</Label>
            {ingredients.map((ing, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  placeholder="Menge"
                  value={ing.amount}
                  onChange={(e) => updateIngredient(index, 'amount', e.target.value)}
                  className="w-20"
                />
                <Select
                  value={ing.unit}
                  onValueChange={(v) => updateIngredient(index, 'unit', v)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Zutat"
                  value={ing.name}
                  onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                  className="flex-1"
                />
                {ingredients.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeIngredient(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addIngredient}>
              <Plus className="w-4 h-4 mr-1" /> Zutat hinzufügen
            </Button>
          </div>

          {/* Steps */}
          <div className="space-y-3">
            <Label className="font-medium">Zubereitungsschritte</Label>
            {steps.map((step, index) => (
              <div key={index} className="flex gap-2 items-start">
                <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-medium shrink-0 mt-2">
                  {index + 1}
                </span>
                <Textarea
                  placeholder={`Schritt ${index + 1}`}
                  value={step.instruction}
                  onChange={(e) => updateStep(index, e.target.value)}
                  rows={2}
                  className="flex-1"
                />
                {steps.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStep(index)}
                    className="mt-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addStep}>
              <Plus className="w-4 h-4 mr-1" /> Schritt hinzufügen
            </Button>
          </div>

          <Button onClick={handleSubmit} className="w-full" disabled={!name.trim() || saving}>
            {saving ? 'Speichern...' : 'Rezept speichern'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
