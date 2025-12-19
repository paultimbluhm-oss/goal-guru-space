import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, ChefHat, Soup, UtensilsCrossed, Cake, Wine, Candy, Cookie, Clock, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth, getSupabase } from '@/hooks/useAuth';
import { AddRecipeDialog } from './AddRecipeDialog';
import { RecipeDetailView } from './RecipeDetailView';

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
  created_at: string | null;
}

interface RecipesSectionProps {
  onBack: () => void;
}

type SortOption = 'newest' | 'taste' | 'health';

const categoryConfig: Record<string, { label: string; icon: typeof Soup }> = {
  vorspeise: { label: 'Vorspeise', icon: Soup },
  hauptspeise: { label: 'Hauptspeise', icon: UtensilsCrossed },
  nachspeise: { label: 'Nachspeise', icon: Cake },
  getraenk: { label: 'Getränk', icon: Wine },
  suessigkeit: { label: 'Süßigkeit', icon: Candy },
  snack: { label: 'Snack', icon: Cookie },
};

export function RecipesSection({ onBack }: RecipesSectionProps) {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');

  useEffect(() => {
    if (user) fetchRecipes();
  }, [user]);

  const fetchRecipes = async () => {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) setRecipes(data);
    setLoading(false);
  };

  const sortedRecipes = [...recipes].sort((a, b) => {
    if (sortBy === 'taste') {
      return (b.taste_rating || 0) - (a.taste_rating || 0);
    }
    if (sortBy === 'health') {
      return (b.health_rating || 0) - (a.health_rating || 0);
    }
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
  });

  const getCategoryIcon = (category: string | null) => {
    if (!category || !categoryConfig[category]) return null;
    const Icon = categoryConfig[category].icon;
    return <Icon className="w-3.5 h-3.5 md:w-4 md:h-4" />;
  };

  const getCategoryLabel = (category: string | null) => {
    if (!category || !categoryConfig[category]) return null;
    return categoryConfig[category].label;
  };

  if (loading) return null;

  if (selectedRecipe) {
    return (
      <RecipeDetailView
        recipe={selectedRecipe}
        onBack={() => setSelectedRecipe(null)}
        onUpdate={fetchRecipes}
      />
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2 md:gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
          </Button>
          <div className="p-2 md:p-3 rounded-xl bg-orange-500/20">
            <ChefHat className="w-5 h-5 md:w-6 md:h-6 text-orange-500" />
          </div>
          <h1 className="text-xl md:text-2xl font-bold">Rezepte</h1>
        </div>
        <AddRecipeDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={fetchRecipes} />
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge
          variant={sortBy === 'newest' ? 'default' : 'outline'}
          className="cursor-pointer text-xs md:text-sm"
          onClick={() => setSortBy('newest')}
        >
          Neueste
        </Badge>
        <Badge
          variant={sortBy === 'taste' ? 'default' : 'outline'}
          className="cursor-pointer text-xs md:text-sm"
          onClick={() => setSortBy('taste')}
        >
          😋 Leckerste
        </Badge>
        <Badge
          variant={sortBy === 'health' ? 'default' : 'outline'}
          className="cursor-pointer text-xs md:text-sm"
          onClick={() => setSortBy('health')}
        >
          🥗 Gesündeste
        </Badge>
      </div>

      {sortedRecipes.length === 0 ? (
        <Card className="p-6 md:p-8 text-center">
          <ChefHat className="w-10 h-10 md:w-12 md:h-12 mx-auto text-muted-foreground mb-3 md:mb-4" />
          <p className="text-muted-foreground text-sm md:text-base">Noch keine Rezepte erstellt</p>
          <Button className="mt-4" size="sm" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Erstes Rezept erstellen
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 md:gap-4 sm:grid-cols-2">
          {sortedRecipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="p-3 md:p-4 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedRecipe(recipe)}
            >
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-sm md:text-base">{recipe.name}</h3>
                {recipe.category && (
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs shrink-0">
                    {getCategoryIcon(recipe.category)}
                    <span className="hidden sm:inline">{getCategoryLabel(recipe.category)}</span>
                  </Badge>
                )}
              </div>
              {recipe.description && (
                <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-2">
                  {recipe.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                {recipe.servings && (
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" /> {recipe.servings}
                  </span>
                )}
                {(recipe.prep_time_minutes || recipe.cook_time_minutes) && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} Min
                  </span>
                )}
                {recipe.taste_rating && <span>{recipe.taste_rating}/5 Geschmack</span>}
                {recipe.health_rating && <span>{recipe.health_rating}/5 Gesund</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
