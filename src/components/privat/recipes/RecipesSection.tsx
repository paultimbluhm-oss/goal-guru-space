import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, ChefHat } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="p-3 rounded-xl bg-orange-500/20">
            <ChefHat className="w-6 h-6 text-orange-500" />
          </div>
          <h1 className="text-2xl font-bold">Rezepte</h1>
        </div>
        <AddRecipeDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={fetchRecipes} />
      </div>

      <div className="flex gap-2">
        <Badge
          variant={sortBy === 'newest' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSortBy('newest')}
        >
          Neueste
        </Badge>
        <Badge
          variant={sortBy === 'taste' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSortBy('taste')}
        >
          😋 Leckerste
        </Badge>
        <Badge
          variant={sortBy === 'health' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSortBy('health')}
        >
          🥗 Gesündeste
        </Badge>
      </div>

      {sortedRecipes.length === 0 ? (
        <Card className="p-8 text-center">
          <ChefHat className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Noch keine Rezepte erstellt</p>
          <Button className="mt-4" onClick={() => setDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Erstes Rezept erstellen
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {sortedRecipes.map((recipe) => (
            <Card
              key={recipe.id}
              className="p-4 cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => setSelectedRecipe(recipe)}
            >
              <h3 className="font-semibold mb-1">{recipe.name}</h3>
              {recipe.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {recipe.description}
                </p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {recipe.servings && <span>👥 {recipe.servings} Portionen</span>}
                {(recipe.prep_time_minutes || recipe.cook_time_minutes) && (
                  <span>⏱️ {(recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0)} Min</span>
                )}
              </div>
              <div className="flex items-center gap-4 mt-2">
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
