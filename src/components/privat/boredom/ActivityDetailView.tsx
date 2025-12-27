import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trophy, Star, Check, Pencil, Trash2, X, Lightbulb, Gamepad2, Music, Palette, Book, Dumbbell, Code, Camera, ChefHat, Wrench, Languages, Brain, LucideIcon, Timer, Hash, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth, getSupabase } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useGamification } from '@/contexts/GamificationContext';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

const iconMap: Record<string, LucideIcon> = {
  Lightbulb, Gamepad2, Music, Palette, Book, Dumbbell, Code, Camera, ChefHat, Wrench, Languages, Brain
};

const measurementTypes = {
  completion: { label: 'Einmalig', icon: Check, unit: '', description: 'Einmal abschließen' },
  time_fastest: { label: 'Schnellste Zeit', icon: Timer, unit: 'Sekunden', description: 'Je schneller, desto besser' },
  time_duration: { label: 'Gesamtdauer', icon: Clock, unit: 'Minuten', description: 'Zeit sammeln' },
  count: { label: 'Anzahl', icon: Hash, unit: 'Mal', description: 'Je öfter, desto besser' },
};

interface SkillEntry {
  id: string;
  skill_id: string;
  value: number;
  xp_earned: number;
  created_at: string;
}

interface Skill {
  id: string;
  name: string;
  description: string | null;
  completed: boolean;
  xp_reward: number;
  order_index: number;
  measurement_type: string;
  best_value: number | null;
  xp_per_improvement: number;
}

interface Activity {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  icon: string;
  total_xp_earned: number;
}

interface ActivityDetailViewProps {
  activityId: string;
  onBack: () => void;
}

export function ActivityDetailView({ activityId, onBack }: ActivityDetailViewProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { addXP } = useGamification();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [skillEntries, setSkillEntries] = useState<Record<string, SkillEntry[]>>({});
  const [loading, setLoading] = useState(true);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillXP, setNewSkillXP] = useState('15');
  const [newMeasurementType, setNewMeasurementType] = useState('completion');
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [tempSkillName, setTempSkillName] = useState('');
  const [entryInputs, setEntryInputs] = useState<Record<string, string>>({});
  const [expandedSkillId, setExpandedSkillId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;
    const supabase = getSupabase();

    const [activityRes, skillsRes] = await Promise.all([
      supabase.from('boredom_activities').select('*').eq('id', activityId).single(),
      supabase
        .from('activity_skills')
        .select('*')
        .eq('activity_id', activityId)
        .order('order_index', { ascending: true }),
    ]);

    if (activityRes.data) setActivity(activityRes.data);
    const skillsData = skillsRes.data || [];
    setSkills(skillsData);

    // Fetch entries for all skills
    if (skillsData.length > 0) {
      const skillIds = skillsData.map(s => s.id);
      const { data: entriesData } = await supabase
        .from('skill_entries')
        .select('*')
        .in('skill_id', skillIds)
        .order('created_at', { ascending: false });

      const entriesBySkill: Record<string, SkillEntry[]> = {};
      (entriesData || []).forEach(entry => {
        if (!entriesBySkill[entry.skill_id]) {
          entriesBySkill[entry.skill_id] = [];
        }
        entriesBySkill[entry.skill_id].push(entry);
      });
      setSkillEntries(entriesBySkill);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [activityId, user]);

  const addSkill = async () => {
    if (!user || !newSkillName.trim()) return;
    const supabase = getSupabase();

    const maxOrder = skills.length > 0 ? Math.max(...skills.map(s => s.order_index)) : -1;

    const { error } = await supabase.from('activity_skills').insert({
      user_id: user.id,
      activity_id: activityId,
      name: newSkillName.trim(),
      xp_reward: parseInt(newSkillXP) || 15,
      order_index: maxOrder + 1,
      measurement_type: newMeasurementType,
      xp_per_improvement: parseInt(newSkillXP) || 15,
    });

    if (!error) {
      setNewSkillName('');
      setNewSkillXP('15');
      setNewMeasurementType('completion');
      fetchData();
    }
  };

  const toggleSkill = async (skill: Skill) => {
    if (skill.measurement_type !== 'completion') return;
    
    const supabase = getSupabase();
    const wasCompleted = skill.completed;
    const newCompleted = !wasCompleted;

    await supabase
      .from('activity_skills')
      .update({ 
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      })
      .eq('id', skill.id);

    if (activity) {
      const xpChange = newCompleted ? skill.xp_reward : -skill.xp_reward;
      await supabase
        .from('boredom_activities')
        .update({ total_xp_earned: Math.max(0, (activity.total_xp_earned || 0) + xpChange) })
        .eq('id', activityId);
    }

    if (newCompleted) {
      await addXP(skill.xp_reward, `Skill "${skill.name}" abgeschlossen`);
    }

    fetchData();
  };

  const addEntry = async (skill: Skill) => {
    if (!user) return;
    const supabase = getSupabase();
    
    const inputValue = entryInputs[skill.id];
    if (!inputValue) return;

    const value = parseFloat(inputValue);
    if (isNaN(value) || value <= 0) {
      toast({ title: 'Ungültiger Wert', variant: 'destructive' });
      return;
    }

    let xpEarned = 0;
    let newBestValue = skill.best_value;
    const entries = skillEntries[skill.id] || [];

    if (skill.measurement_type === 'time_fastest') {
      // For fastest time, lower is better
      if (skill.best_value === null || value < skill.best_value) {
        if (skill.best_value !== null) {
          // Calculate improvement in seconds
          const improvement = skill.best_value - value;
          // XP per 15 seconds improvement (or fraction)
          xpEarned = Math.floor((improvement / 15) * skill.xp_per_improvement);
          if (xpEarned < skill.xp_per_improvement) xpEarned = skill.xp_per_improvement; // Min XP for new record
        } else {
          xpEarned = skill.xp_per_improvement; // First entry gets base XP
        }
        newBestValue = value;
      }
    } else if (skill.measurement_type === 'time_duration') {
      // For duration, accumulate time
      const currentTotal = entries.reduce((sum, e) => sum + e.value, 0);
      const newTotal = currentTotal + value;
      // XP for every 30 minutes accumulated
      const oldMilestones = Math.floor(currentTotal / 30);
      const newMilestones = Math.floor(newTotal / 30);
      xpEarned = (newMilestones - oldMilestones) * skill.xp_per_improvement;
      newBestValue = newTotal;
    } else if (skill.measurement_type === 'count') {
      // For count, higher is better
      if (skill.best_value === null || value > skill.best_value) {
        if (skill.best_value !== null) {
          const improvement = value - skill.best_value;
          xpEarned = Math.floor(improvement * (skill.xp_per_improvement / 5));
          if (xpEarned < skill.xp_per_improvement) xpEarned = skill.xp_per_improvement;
        } else {
          xpEarned = skill.xp_per_improvement;
        }
        newBestValue = value;
      }
    }

    // Insert entry
    await supabase.from('skill_entries').insert({
      skill_id: skill.id,
      user_id: user.id,
      value,
      xp_earned: xpEarned,
    });

    // Update skill best value
    if (newBestValue !== skill.best_value) {
      await supabase
        .from('activity_skills')
        .update({ best_value: newBestValue })
        .eq('id', skill.id);
    }

    // Update activity XP and award user XP
    if (xpEarned > 0) {
      if (activity) {
        await supabase
          .from('boredom_activities')
          .update({ total_xp_earned: (activity.total_xp_earned || 0) + xpEarned })
          .eq('id', activityId);
      }
      await addXP(xpEarned, `Verbesserung bei "${skill.name}"`);
      toast({ 
        title: `+${xpEarned} XP!`, 
        description: skill.measurement_type === 'time_fastest' ? 'Neuer Rekord!' : 'Fortschritt!',
      });
    } else {
      toast({ title: 'Eintrag gespeichert' });
    }

    setEntryInputs(prev => ({ ...prev, [skill.id]: '' }));
    fetchData();
  };

  const updateSkillName = async (skillId: string) => {
    if (!tempSkillName.trim()) return;
    const supabase = getSupabase();

    await supabase
      .from('activity_skills')
      .update({ name: tempSkillName.trim() })
      .eq('id', skillId);

    setEditingSkillId(null);
    fetchData();
  };

  const deleteSkill = async (skillId: string) => {
    const supabase = getSupabase();
    const skill = skills.find(s => s.id === skillId);
    
    // Calculate total XP to subtract
    const entries = skillEntries[skillId] || [];
    const totalEntriesXP = entries.reduce((sum, e) => sum + (e.xp_earned || 0), 0);
    const skillXP = skill?.completed ? skill.xp_reward : 0;
    const totalToSubtract = totalEntriesXP + skillXP;

    if (totalToSubtract > 0 && activity) {
      await supabase
        .from('boredom_activities')
        .update({ total_xp_earned: Math.max(0, (activity.total_xp_earned || 0) - totalToSubtract) })
        .eq('id', activityId);
    }

    await supabase.from('activity_skills').delete().eq('id', skillId);
    fetchData();
  };

  const formatValue = (skill: Skill, value: number) => {
    if (skill.measurement_type === 'time_fastest') {
      const minutes = Math.floor(value / 60);
      const seconds = Math.floor(value % 60);
      const ms = Math.round((value % 1) * 100);
      if (minutes > 0) {
        return `${minutes}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
      }
      return `${seconds}.${ms.toString().padStart(2, '0')}s`;
    }
    if (skill.measurement_type === 'time_duration') {
      return `${value} Min`;
    }
    return `${value}x`;
  };

  if (loading || !activity) {
    return <div className="text-center py-8 text-muted-foreground">Laden...</div>;
  }

  const IconComponent = iconMap[activity.icon] || Lightbulb;
  const completedCount = skills.filter(s => s.completed || (s.measurement_type !== 'completion' && s.best_value !== null)).length;
  const progress = skills.length > 0 ? (completedCount / skills.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20">
          <IconComponent className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">{activity.name}</h2>
          {activity.category && (
            <Badge variant="outline" className="mt-1">{activity.category}</Badge>
          )}
        </div>
      </div>

      {activity.description && (
        <p className="text-muted-foreground">{activity.description}</p>
      )}

      {/* Progress Card */}
      <div className="glass-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <span className="font-semibold">{activity.total_xp_earned || 0} XP verdient</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {completedCount} / {skills.length} Skills
          </div>
        </div>
        <Progress value={progress} className="h-3" />
        {progress === 100 && skills.length > 0 && (
          <p className="text-center text-green-500 font-medium">🎉 Alle Skills abgeschlossen!</p>
        )}
      </div>

      {/* Skills List */}
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <Star className="w-4 h-4" />
          Skills & Meilensteine
        </h3>

        <div className="space-y-2">
          {skills.map((skill, index) => {
            const MeasurementIcon = measurementTypes[skill.measurement_type as keyof typeof measurementTypes]?.icon || Check;
            const entries = skillEntries[skill.id] || [];
            const isExpanded = expandedSkillId === skill.id;
            const hasProgress = skill.measurement_type !== 'completion' && skill.best_value !== null;
            
            return (
              <div key={skill.id} className="space-y-2">
                <div
                  className={`glass-card p-4 space-y-3 group ${
                    skill.completed || hasProgress ? 'bg-green-500/5 border-green-500/30' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {skill.measurement_type === 'completion' ? (
                      <Checkbox
                        checked={skill.completed}
                        onCheckedChange={() => toggleSkill(skill)}
                      />
                    ) : (
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <MeasurementIcon className="w-4 h-4 text-primary" />
                      </div>
                    )}

                    {editingSkillId === skill.id ? (
                      <div className="flex-1 flex items-center gap-2">
                        <Input
                          value={tempSkillName}
                          onChange={(e) => setTempSkillName(e.target.value)}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') updateSkillName(skill.id);
                            if (e.key === 'Escape') setEditingSkillId(null);
                          }}
                        />
                        <Button size="icon" variant="ghost" onClick={() => updateSkillName(skill.id)}>
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => setEditingSkillId(null)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <div className={skill.completed ? 'line-through text-muted-foreground' : ''}>
                            {index + 1}. {skill.name}
                          </div>
                          {skill.measurement_type !== 'completion' && (
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {measurementTypes[skill.measurement_type as keyof typeof measurementTypes]?.label}
                              {skill.best_value !== null && (
                                <span className="ml-2 text-primary font-medium">
                                  Bester Wert: {formatValue(skill, skill.best_value)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                          +{skill.xp_per_improvement} XP
                        </Badge>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingSkillId(skill.id);
                              setTempSkillName(skill.name);
                            }}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => deleteSkill(skill.id)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Measurement Input for trackable skills */}
                  {skill.measurement_type !== 'completion' && (
                    <div className="flex gap-2 items-center">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={entryInputs[skill.id] || ''}
                        onChange={(e) => setEntryInputs(prev => ({ ...prev, [skill.id]: e.target.value }))}
                        placeholder={skill.measurement_type === 'time_fastest' ? 'Zeit in Sekunden' : 
                                   skill.measurement_type === 'time_duration' ? 'Minuten' : 'Anzahl'}
                        className="flex-1"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') addEntry(skill);
                        }}
                      />
                      <Button onClick={() => addEntry(skill)} disabled={!entryInputs[skill.id]}>
                        <Plus className="w-4 h-4 mr-1" />
                        Eintrag
                      </Button>
                      {entries.length > 0 && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setExpandedSkillId(isExpanded ? null : skill.id)}
                        >
                          <TrendingUp className="w-4 h-4 mr-1" />
                          {entries.length}
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Entry History */}
                {isExpanded && entries.length > 0 && (
                  <div className="ml-8 glass-card p-3 space-y-2">
                    <div className="text-sm font-medium">Verlauf</div>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {entries.slice(0, 10).map((entry, i) => (
                        <div key={entry.id} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                          <span className="text-muted-foreground">
                            {format(new Date(entry.created_at), 'dd.MM.yy HH:mm', { locale: de })}
                          </span>
                          <span className="font-medium">{formatValue(skill, entry.value)}</span>
                          {entry.xp_earned > 0 && (
                            <Badge variant="outline" className="text-xs bg-green-500/10 text-green-500">
                              +{entry.xp_earned} XP
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add Skill */}
        <div className="glass-card p-4 space-y-3">
          <h4 className="text-sm font-medium">Neuen Skill hinzufügen</h4>
          <div className="flex flex-wrap gap-2">
            <Input
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="z.B. Zauberwürfel lösen"
              onKeyDown={(e) => {
                if (e.key === 'Enter') addSkill();
              }}
              className="flex-1 min-w-[200px]"
            />
            <Select value={newMeasurementType} onValueChange={setNewMeasurementType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(measurementTypes).map(([key, { label, icon: Icon }]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={newSkillXP} onValueChange={setNewSkillXP}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 XP</SelectItem>
                <SelectItem value="15">15 XP</SelectItem>
                <SelectItem value="25">25 XP</SelectItem>
                <SelectItem value="50">50 XP</SelectItem>
                <SelectItem value="100">100 XP</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={addSkill} disabled={!newSkillName.trim()}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {measurementTypes[newMeasurementType as keyof typeof measurementTypes]?.description}
          </p>
        </div>
      </div>
    </div>
  );
}
