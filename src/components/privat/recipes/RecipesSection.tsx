import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, ChefHat } from 'lucide-react';
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

  const renderStars = (rating: number | null, type: 'taste' | 'health') => {
    if (!rating) return null;
    const emoji = type === 'taste' ? '😋' : '🥗';
    return (
      <span className="text-sm">
        {emoji} {rating}/5
      </span>
    );
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
              <h3 className="font-semibold text-sm md:text-base mb-1">{recipe.name}</h3>
              {recipe.description && (
                <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 mb-2">
                  {recipe.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
                {recipe.servings && <span>👥 {recipe.servings}</span>}
                {(recipe.prep_time_minutes || recipe.cook_time_minutes) && (
                  <span>⏱️ {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} Min</span>
                )}
              </div>
              <div className="flex items-center gap-3 md:gap-4 mt-2 text-xs md:text-sm">
                {renderStars(recipe.taste_rating, 'taste')}
                {renderStars(recipe.health_rating, 'health')}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
