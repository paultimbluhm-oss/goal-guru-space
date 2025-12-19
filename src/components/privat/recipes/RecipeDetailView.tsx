import { useState, useEffect } from 'react';
import { ArrowLeft, Trash2, Clock, Users, Minus, Plus, Soup, UtensilsCrossed, Cake, Wine, Candy, Cookie } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getSupabase } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const categoryConfig: Record<string, { label: string; icon: typeof Soup }> = {
  vorspeise: { label: 'Vorspeise', icon: Soup },
  hauptspeise: { label: 'Hauptspeise', icon: UtensilsCrossed },
  nachspeise: { label: 'Nachspeise', icon: Cake },
  getraenk: { label: 'Getränk', icon: Wine },
  suessigkeit: { label: 'Süßigkeit', icon: Candy },
  snack: { label: 'Snack', icon: Cookie },
};

interface Recipe {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  servings: number | null;
  prep_time_minutes: number | null;
  cook_time_minutes: number | null;
  taste_rating: number | null;
  health_rating: number | null;
}

interface Ingredient {
  id: string;
  name: string;
  amount: number | null;
  unit: string | null;
  order_index: number | null;
}

interface Step {
  id: string;
  step_number: number;
  instruction: string;
}

interface RecipeDetailViewProps {
  recipe: Recipe;
  onBack: () => void;
  onUpdate: () => void;
}

export function RecipeDetailView({ recipe, onBack, onUpdate }: RecipeDetailViewProps) {
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [servingMultiplier, setServingMultiplier] = useState(1);
  const baseServings = recipe.servings || 4;

  useEffect(() => {
    fetchDetails();
  }, [recipe.id]);

  const fetchDetails = async () => {
    const supabase = getSupabase();
    const [ingredientsRes, stepsRes] = await Promise.all([
      supabase
        .from('recipe_ingredients')
        .select('*')
        .eq('recipe_id', recipe.id)
        .order('order_index'),
      supabase
        .from('recipe_steps')
        .select('*')
        .eq('recipe_id', recipe.id)
        .order('step_number'),
    ]);

    if (ingredientsRes.data) setIngredients(ingredientsRes.data);
    if (stepsRes.data) setSteps(stepsRes.data);
  };

  const handleDelete = async () => {
    const supabase = getSupabase();
    const { error } = await supabase.from('recipes').delete().eq('id', recipe.id);
    if (error) {
      toast.error('Fehler beim Löschen');
      return;
    }
    toast.success('Rezept gelöscht');
    onUpdate();
    onBack();
  };

  const adjustServings = (delta: number) => {
    const newMultiplier = servingMultiplier + delta;
    if (newMultiplier >= 0.5 && newMultiplier <= 10) {
      setServingMultiplier(newMultiplier);
    }
  };

  const calculateAmount = (amount: number | null) => {
    if (!amount) return null;
    const adjusted = amount * servingMultiplier;
    return adjusted % 1 === 0 ? adjusted : adjusted.toFixed(1);
  };

  const currentServings = Math.round(baseServings * servingMultiplier);
  const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10 shrink-0" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <h1 className="text-lg md:text-2xl font-bold truncate">{recipe.name}</h1>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 shrink-0">
              <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-[95vw] sm:max-w-lg">
            <AlertDialogHeader>
              <AlertDialogTitle>Rezept löschen?</AlertDialogTitle>
              <AlertDialogDescription>
                Diese Aktion kann nicht rückgängig gemacht werden.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Abbrechen</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive">
                Löschen
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {recipe.category && categoryConfig[recipe.category] && (
        <Badge variant="secondary" className="flex items-center gap-1.5 w-fit">
          {(() => {
            const Icon = categoryConfig[recipe.category].icon;
            return <Icon className="w-4 h-4" />;
          })()}
          {categoryConfig[recipe.category].label}
        </Badge>
      )}

      {recipe.description && (
        <p className="text-sm md:text-base text-muted-foreground">{recipe.description}</p>
      )}

      {/* Meta Info */}
      <div className="flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm">
        {totalTime > 0 && (
          <div className="flex items-center gap-1.5 md:gap-2">
            <Clock className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground" />
            <span>{totalTime} Min</span>
            {recipe.prep_time_minutes && recipe.cook_time_minutes && (
              <span className="text-muted-foreground hidden sm:inline">
                ({recipe.prep_time_minutes} + {recipe.cook_time_minutes})
              </span>
            )}
          </div>
        )}
        <div className="flex items-center gap-2 md:gap-3">
          {recipe.taste_rating && <span>{recipe.taste_rating}/5 Geschmack</span>}
          {recipe.health_rating && <span>{recipe.health_rating}/5 Gesund</span>}
        </div>
      </div>

      {/* Portion Calculator */}
      <Card className="p-3 md:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 md:gap-2">
            <Users className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
            <span className="font-medium text-sm md:text-base">Portionen</span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 md:h-8 md:w-8"
              onClick={() => adjustServings(-0.5)}
              disabled={servingMultiplier <= 0.5}
            >
              <Minus className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </Button>
            <span className="font-bold text-base md:text-lg w-6 md:w-8 text-center">{currentServings}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 md:h-8 md:w-8"
              onClick={() => adjustServings(0.5)}
              disabled={servingMultiplier >= 10}
            >
              <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
            </Button>
          </div>
        </div>
        {servingMultiplier !== 1 && (
          <p className="text-xs text-muted-foreground mt-2">
            Original: {baseServings} Portionen • Mengen angepasst
          </p>
        )}
      </Card>

      {/* Ingredients */}
      {ingredients.length > 0 && (
        <div className="space-y-2 md:space-y-3">
          <h2 className="font-semibold text-base md:text-lg">Zutaten</h2>
          <Card className="p-3 md:p-4">
            <ul className="space-y-1.5 md:space-y-2">
              {ingredients.map((ing) => (
                <li key={ing.id} className="flex items-center gap-2 text-sm md:text-base">
                  <span className="w-16 md:w-20 text-right font-mono text-xs md:text-sm shrink-0">
                    {calculateAmount(ing.amount)} {ing.unit}
                  </span>
                  <span className="truncate">{ing.name}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {/* Steps */}
      {steps.length > 0 && (
        <div className="space-y-2 md:space-y-3">
          <h2 className="font-semibold text-base md:text-lg">Zubereitung</h2>
          <div className="space-y-3 md:space-y-4">
            {steps.map((step) => (
              <Card key={step.id} className="p-3 md:p-4">
                <div className="flex gap-3 md:gap-4">
                  <span className="w-6 h-6 md:w-8 md:h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold shrink-0 text-sm md:text-base">
                    {step.step_number}
                  </span>
                  <p className="text-sm md:text-base pt-0.5 md:pt-1">{step.instruction}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
