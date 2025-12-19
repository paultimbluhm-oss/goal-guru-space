import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trophy, Star, Check, Pencil, Trash2, X, Lightbulb, Gamepad2, Music, Palette, Book, Dumbbell, Code, Camera, ChefHat, Wrench, Languages, Brain, LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth, getSupabase } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { useGamification } from '@/contexts/GamificationContext';

const iconMap: Record<string, LucideIcon> = {
  Lightbulb, Gamepad2, Music, Palette, Book, Dumbbell, Code, Camera, ChefHat, Wrench, Languages, Brain
};

interface Skill {
  id: string;
  name: string;
  description: string | null;
  completed: boolean;
  xp_reward: number;
  order_index: number;
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
  const [loading, setLoading] = useState(true);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillXP, setNewSkillXP] = useState('15');
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [tempSkillName, setTempSkillName] = useState('');

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
    setSkills(skillsRes.data || []);
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
    });

    if (!error) {
      setNewSkillName('');
      setNewSkillXP('15');
      fetchData();
    }
  };

  const toggleSkill = async (skill: Skill) => {
    const supabase = getSupabase();
    const wasCompleted = skill.completed;
    const newCompleted = !wasCompleted;

    // Update skill
    await supabase
      .from('activity_skills')
      .update({ 
        completed: newCompleted,
        completed_at: newCompleted ? new Date().toISOString() : null,
      })
      .eq('id', skill.id);

    // Update activity XP
    if (activity) {
      const xpChange = newCompleted ? skill.xp_reward : -skill.xp_reward;
      await supabase
        .from('boredom_activities')
        .update({ total_xp_earned: Math.max(0, (activity.total_xp_earned || 0) + xpChange) })
        .eq('id', activityId);
    }

    // Award XP to user profile
    if (newCompleted) {
      await addXP(skill.xp_reward, `Skill "${skill.name}" abgeschlossen`);
    }

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
    
    // If skill was completed, subtract XP from activity
    if (skill?.completed && activity) {
      await supabase
        .from('boredom_activities')
        .update({ total_xp_earned: Math.max(0, (activity.total_xp_earned || 0) - skill.xp_reward) })
        .eq('id', activityId);
    }

    await supabase.from('activity_skills').delete().eq('id', skillId);
    fetchData();
  };

  if (loading || !activity) {
    return <div className="text-center py-8 text-muted-foreground">Laden...</div>;
  }

  const IconComponent = iconMap[activity.icon] || Lightbulb;
  const completedCount = skills.filter(s => s.completed).length;
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
          {skills.map((skill, index) => (
            <div
              key={skill.id}
              className={`glass-card p-4 flex items-center gap-3 group ${
                skill.completed ? 'bg-green-500/5 border-green-500/30' : ''
              }`}
            >
              <Checkbox
                checked={skill.completed}
                onCheckedChange={() => toggleSkill(skill)}
              />

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
                    <span className={skill.completed ? 'line-through text-muted-foreground' : ''}>
                      {index + 1}. {skill.name}
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-primary/10 text-primary">
                    +{skill.xp_reward} XP
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
          ))}
        </div>

        {/* Add Skill */}
        <div className="glass-card p-4 space-y-3">
          <h4 className="text-sm font-medium">Neuen Skill hinzufügen</h4>
          <div className="flex gap-2">
            <Input
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              placeholder="z.B. Erste Ebene lösen"
              onKeyDown={(e) => {
                if (e.key === 'Enter') addSkill();
              }}
              className="flex-1"
            />
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
        </div>
      </div>
    </div>
  );
}
