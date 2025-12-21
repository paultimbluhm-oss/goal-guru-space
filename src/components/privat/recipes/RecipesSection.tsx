import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, ChefHat, Soup, UtensilsCrossed, Cake, Wine, Coffee, Clock, Users, TrendingUp, BookOpen, Star, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

const categoryConfig: Record<string, { label: string; icon: typeof Soup; color: string }> = {
  vorspeise: { label: 'Vorspeisen', icon: Soup, color: 'from-cyan-500 to-teal-600' },
  hauptspeise: { label: 'Hauptgerichte', icon: UtensilsCrossed, color: 'from-orange-500 to-red-600' },
  nachspeise: { label: 'Nachspeisen', icon: Cake, color: 'from-pink-500 to-rose-600' },
  getraenk: { label: 'Getranke', icon: Coffee, color: 'from-amber-500 to-yellow-600' },
  sonstiges: { label: 'Sonstiges', icon: ChefHat, color: 'from-slate-500 to-zinc-600' },
};

const categoryOrder = ['hauptspeise', 'vorspeise', 'nachspeise', 'getraenk', 'sonstiges'];

export function RecipesSection({ onBack }: RecipesSectionProps) {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [activeCategory, setActiveCategory] = useState<string>('all');

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

  const sortedRecipes = useMemo(() => {
    let filtered = [...recipes];
    
    if (activeCategory !== 'all') {
      filtered = filtered.filter(r => r.category === activeCategory);
    }
    
    return filtered.sort((a, b) => {
      if (sortBy === 'taste') {
        return (b.taste_rating || 0) - (a.taste_rating || 0);
      }
      if (sortBy === 'health') {
        return (b.health_rating || 0) - (a.health_rating || 0);
      }
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [recipes, sortBy, activeCategory]);

  const recipesByCategory = useMemo(() => {
    const grouped: Record<string, Recipe[]> = {};
    categoryOrder.forEach(cat => {
      grouped[cat] = recipes.filter(r => r.category === cat);
    });
    return grouped;
  }, [recipes]);

  const stats = useMemo(() => {
    const totalTime = recipes.reduce((sum, r) => sum + (r.prep_time_minutes || 0) + (r.cook_time_minutes || 0), 0);
    const avgTaste = recipes.filter(r => r.taste_rating).reduce((sum, r) => sum + (r.taste_rating || 0), 0) / (recipes.filter(r => r.taste_rating).length || 1);
    const avgHealth = recipes.filter(r => r.health_rating).reduce((sum, r) => sum + (r.health_rating || 0), 0) / (recipes.filter(r => r.health_rating).length || 1);
    return { totalTime, avgTaste, avgHealth };
  }, [recipes]);

  const getCategoryIcon = (category: string | null) => {
    if (!category || !categoryConfig[category]) return ChefHat;
    return categoryConfig[category].icon;
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg shadow-orange-500/25">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Rezepte</h2>
              <p className="text-sm text-muted-foreground">Dein digitales Kochbuch</p>
            </div>
          </div>
        </div>
        <AddRecipeDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={fetchRecipes} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/80">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/20">
                <BookOpen className="w-4 h-4 text-orange-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rezepte</p>
                <p className="text-xl font-bold">{recipes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/80">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Star className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Geschmack</p>
                <p className="text-xl font-bold">{stats.avgTaste.toFixed(1)}/5</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/80">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-green-500/10 rounded-full blur-2xl" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gesundheit</p>
                <p className="text-xl font-bold">{stats.avgHealth.toFixed(1)}/5</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/80">
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl" />
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Clock className="w-4 h-4 text-blue-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gesamtzeit</p>
                <p className="text-xl font-bold">{Math.round(stats.totalTime / 60)}h</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {categoryOrder.map(catKey => {
          const config = categoryConfig[catKey];
          const Icon = config.icon;
          const count = recipesByCategory[catKey]?.length || 0;
          const isActive = activeCategory === catKey;
          
          return (
            <Card 
              key={catKey}
              onClick={() => setActiveCategory(isActive ? 'all' : catKey)}
              className={`cursor-pointer transition-all duration-300 border-border/50 ${
                isActive 
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
                  : 'hover:border-primary/30'
              }`}
            >
              <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <div className={`p-3 rounded-xl bg-gradient-to-br ${config.color} shadow-lg`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm">{config.label}</p>
                  <p className="text-xs text-muted-foreground">{count} Rezepte</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filter & Sort */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 mr-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Sortieren:</span>
        </div>
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
          Leckerste
        </Badge>
        <Badge
          variant={sortBy === 'health' ? 'default' : 'outline'}
          className="cursor-pointer"
          onClick={() => setSortBy('health')}
        >
          Gesundeste
        </Badge>
        {activeCategory !== 'all' && (
          <Badge
            variant="secondary"
            className="cursor-pointer ml-auto"
            onClick={() => setActiveCategory('all')}
          >
            Filter zurucksetzen
          </Badge>
        )}
      </div>

      {/* Recipes List */}
      {sortedRecipes.length === 0 ? (
        <Card className="p-8 border-border/50 text-center bg-gradient-to-br from-card to-muted/20">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
            <ChefHat className="w-8 h-8 text-orange-500" />
          </div>
          <p className="text-muted-foreground">
            {activeCategory !== 'all' 
              ? `Keine ${categoryConfig[activeCategory]?.label || 'Rezepte'} vorhanden`
              : 'Noch keine Rezepte erstellt'
            }
          </p>
          <p className="text-sm text-muted-foreground mt-1">Erstelle dein erstes Rezept!</p>
          <Button 
            className="mt-4 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700" 
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Erstes Rezept erstellen
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sortedRecipes.map((recipe) => {
            const Icon = getCategoryIcon(recipe.category);
            const config = recipe.category ? categoryConfig[recipe.category] : null;
            const totalTime = (recipe.prep_time_minutes || 0) + (recipe.cook_time_minutes || 0);
            
            return (
              <Card
                key={recipe.id}
                className="overflow-hidden cursor-pointer hover:border-primary/50 transition-all duration-300 border-border/50 group"
                onClick={() => setSelectedRecipe(recipe)}
              >
                <div className={`h-2 bg-gradient-to-r ${config?.color || 'from-slate-500 to-zinc-600'}`} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold group-hover:text-primary transition-colors">{recipe.name}</h3>
                    <div className={`p-1.5 rounded-lg bg-gradient-to-br ${config?.color || 'from-slate-500 to-zinc-600'}`}>
                      <Icon className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  {recipe.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {recipe.description}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    {recipe.servings && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" /> {recipe.servings} Portionen
                      </span>
                    )}
                    {totalTime > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {totalTime} Min
                      </span>
                    )}
                  </div>
                  {(recipe.taste_rating || recipe.health_rating) && (
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
                      {recipe.taste_rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-500" />
                          <span className="text-xs font-medium">{recipe.taste_rating}/5</span>
                        </div>
                      )}
                      {recipe.health_rating && (
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <span className="text-xs font-medium">{recipe.health_rating}/5</span>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Mobile FAB */}
      <Button 
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-2xl sm:hidden bg-gradient-to-br from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700" 
        onClick={() => setDialogOpen(true)}
      >
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );
}
