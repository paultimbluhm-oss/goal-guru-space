import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb, Moon, Utensils, Droplets, Dumbbell, Heart, Users, Brain, Sparkles } from 'lucide-react';

interface JournalEntry {
  sleep_hours?: number | null;
  sleep_quality?: number | null;
  nutrition_quality?: number | null;
  hydration_liters?: number | null;
  exercise_minutes?: number | null;
  mood_rating?: number | null;
  energy_level?: number | null;
  stress_level?: number | null;
  social_interactions?: number | null;
  gratitude_1?: string | null;
}

interface JournalSuggestionsProps {
  entries: JournalEntry[];
  todayEntry: JournalEntry | null;
}

interface Suggestion {
  icon: React.ReactNode;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

function generateSuggestions(entries: JournalEntry[], today: JournalEntry | null): Suggestion[] {
  const suggestions: Suggestion[] = [];
  
  // Calculate averages from recent entries
  const validEntries = entries.filter(e => e.sleep_hours || e.mood_rating || e.energy_level);
  if (validEntries.length === 0 && !today) {
    return [{
      icon: <Sparkles className="h-4 w-4 text-purple-500" />,
      title: 'Beginne dein Journal',
      description: 'Fülle deinen ersten Eintrag aus, um personalisierte Vorschläge zu erhalten.',
      priority: 'high'
    }];
  }

  const avgSleep = validEntries.reduce((acc, e) => acc + (e.sleep_hours || 0), 0) / Math.max(validEntries.length, 1);
  const avgSleepQuality = validEntries.reduce((acc, e) => acc + (e.sleep_quality || 0), 0) / Math.max(validEntries.filter(e => e.sleep_quality).length, 1);
  const avgNutrition = validEntries.reduce((acc, e) => acc + (e.nutrition_quality || 0), 0) / Math.max(validEntries.filter(e => e.nutrition_quality).length, 1);
  const avgHydration = validEntries.reduce((acc, e) => acc + (e.hydration_liters || 0), 0) / Math.max(validEntries.filter(e => e.hydration_liters).length, 1);
  const avgExercise = validEntries.reduce((acc, e) => acc + (e.exercise_minutes || 0), 0) / Math.max(validEntries.length, 1);
  const avgMood = validEntries.reduce((acc, e) => acc + (e.mood_rating || 0), 0) / Math.max(validEntries.filter(e => e.mood_rating).length, 1);
  const avgEnergy = validEntries.reduce((acc, e) => acc + (e.energy_level || 0), 0) / Math.max(validEntries.filter(e => e.energy_level).length, 1);
  const avgStress = validEntries.reduce((acc, e) => acc + (e.stress_level || 0), 0) / Math.max(validEntries.filter(e => e.stress_level).length, 1);
  const avgSocial = validEntries.reduce((acc, e) => acc + (e.social_interactions || 0), 0) / Math.max(validEntries.filter(e => e.social_interactions !== null).length, 1);

  // Sleep suggestions (7-9 hours optimal per science)
  if (avgSleep < 7) {
    suggestions.push({
      icon: <Moon className="h-4 w-4 text-indigo-500" />,
      title: 'Mehr Schlaf priorisieren',
      description: `Du schläfst durchschnittlich ${avgSleep.toFixed(1)}h. Studien zeigen, dass 7-9 Stunden optimal für Wohlbefinden sind.`,
      priority: avgSleep < 6 ? 'high' : 'medium'
    });
  }
  
  if (avgSleepQuality > 0 && avgSleepQuality < 3) {
    suggestions.push({
      icon: <Moon className="h-4 w-4 text-indigo-500" />,
      title: 'Schlafqualität verbessern',
      description: 'Versuche 1h vor dem Schlafen kein Bildschirmlicht, kühles Zimmer (18°C) und eine feste Schlafenszeit.',
      priority: 'medium'
    });
  }

  // Hydration (2L minimum recommended)
  if (avgHydration > 0 && avgHydration < 2) {
    suggestions.push({
      icon: <Droplets className="h-4 w-4 text-blue-500" />,
      title: 'Mehr Wasser trinken',
      description: `Du trinkst ~${avgHydration.toFixed(1)}L/Tag. Dehydration beeinflusst Konzentration und Stimmung. Ziel: 2-3L.`,
      priority: avgHydration < 1.5 ? 'high' : 'medium'
    });
  }

  // Exercise (150min/week = ~21min/day recommended)
  if (avgExercise < 20) {
    suggestions.push({
      icon: <Dumbbell className="h-4 w-4 text-green-500" />,
      title: 'Mehr Bewegung einbauen',
      description: 'WHO empfiehlt 150min moderate Bewegung/Woche. Schon 20min Spaziergang täglich verbessert die Stimmung.',
      priority: avgExercise < 10 ? 'high' : 'medium'
    });
  }

  // Nutrition
  if (avgNutrition > 0 && avgNutrition < 3) {
    suggestions.push({
      icon: <Utensils className="h-4 w-4 text-orange-500" />,
      title: 'Ernährung optimieren',
      description: 'Eine ausgewogene Ernährung mit viel Gemüse, Protein und Vollkorn stabilisiert Energie und Stimmung.',
      priority: 'medium'
    });
  }

  // Stress management
  if (avgStress > 3) {
    suggestions.push({
      icon: <Brain className="h-4 w-4 text-rose-500" />,
      title: 'Stress reduzieren',
      description: 'Dein Stresslevel ist erhöht. Versuche 5-10min Meditation, Atemübungen oder Naturzeit täglich.',
      priority: avgStress > 4 ? 'high' : 'medium'
    });
  }

  // Social connections
  if (avgSocial < 2) {
    suggestions.push({
      icon: <Users className="h-4 w-4 text-purple-500" />,
      title: 'Soziale Kontakte pflegen',
      description: 'Soziale Verbindungen sind essentiell für Glück. Plane bewusst Zeit mit Freunden/Familie ein.',
      priority: avgSocial < 1 ? 'high' : 'medium'
    });
  }

  // Gratitude practice
  const entriesWithGratitude = entries.filter(e => e.gratitude_1);
  if (entriesWithGratitude.length < entries.length / 2) {
    suggestions.push({
      icon: <Sparkles className="h-4 w-4 text-amber-500" />,
      title: 'Dankbarkeit üben',
      description: 'Studien zeigen: Täglich 3 Dinge aufschreiben, wofür man dankbar ist, steigert langfristig das Wohlbefinden.',
      priority: 'low'
    });
  }

  // Positive reinforcement based on good patterns
  if (avgMood >= 4 && avgEnergy >= 4) {
    suggestions.unshift({
      icon: <Heart className="h-4 w-4 text-green-500" />,
      title: 'Weiter so! 🎉',
      description: 'Deine Stimmung und Energie sind gut. Behalte deine aktuellen Gewohnheiten bei!',
      priority: 'low'
    });
  }

  // If mood is low but sleep/exercise are good, suggest other factors
  if (avgMood < 3 && avgSleep >= 7 && avgExercise >= 20) {
    suggestions.push({
      icon: <Heart className="h-4 w-4 text-rose-500" />,
      title: 'Emotionale Reflexion',
      description: 'Deine Basics sind gut, aber die Stimmung niedrig. Vielleicht hilft ein Gespräch mit Freunden oder Journaling.',
      priority: 'high'
    });
  }

  return suggestions.slice(0, 4); // Max 4 suggestions
}

export function JournalSuggestions({ entries, todayEntry }: JournalSuggestionsProps) {
  const suggestions = generateSuggestions(entries, todayEntry);

  if (suggestions.length === 0) return null;

  return (
    <Card className="border-border/50 bg-gradient-to-br from-purple-500/5 to-indigo-500/5">
      <CardHeader className="py-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          Vorschläge für morgen
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {suggestions.map((suggestion, i) => (
          <div 
            key={i} 
            className={`p-3 rounded-lg border flex gap-3 ${
              suggestion.priority === 'high' 
                ? 'bg-rose-500/10 border-rose-500/20' 
                : suggestion.priority === 'medium'
                ? 'bg-amber-500/10 border-amber-500/20'
                : 'bg-muted/50 border-border/50'
            }`}
          >
            <div className="mt-0.5">{suggestion.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium">{suggestion.title}</div>
              <div className="text-xs text-muted-foreground">{suggestion.description}</div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
