import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useStats } from '@/hooks/useStats';
import { AppLayout } from '@/components/layout/AppLayout';
import { HeroStats } from '@/components/dashboard/HeroStats';
import { HabitsOverview } from '@/components/dashboard/HabitsOverview';
import { AchievementsCard, checkAndUnlockAchievements } from '@/components/dashboard/AchievementsCard';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { TimeProgressCard } from '@/components/dashboard/TimeProgressCard';
import { MotivationQuote } from '@/components/dashboard/MotivationQuote';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, recentActivity, refetch } = useProfile();
  const { stats, loading: statsLoading } = useStats();
  const navigate = useNavigate();
  const [todayTasksCompleted, setTodayTasksCompleted] = useState(0);
  const [todayTasksTotal, setTodayTasksTotal] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Fetch today's tasks progress
  useEffect(() => {
    if (user) {
      fetchTodayTasks();
    }
  }, [user]);

  const fetchTodayTasks = async () => {
    if (!user) return;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    const todayStart = `${today}T00:00:00.000Z`;
    const todayEnd = `${today}T23:59:59.999Z`;
    
    // Get only tasks due today
    const { data: tasks } = await supabase
      .from('tasks')
      .select('id, completed, due_date')
      .eq('user_id', user.id)
      .gte('due_date', todayStart)
      .lte('due_date', todayEnd);
    
    if (tasks) {
      setTodayTasksTotal(tasks.length);
      setTodayTasksCompleted(tasks.filter(t => t.completed).length);
    }
  };

  // Check achievements when profile/stats load
  useEffect(() => {
    if (user && profile && !profileLoading && !statsLoading) {
      checkAchievements();
    }
  }, [user, profile, profileLoading, statsLoading]);

  const checkAchievements = async () => {
    if (!user || !profile) return;

    // Get additional stats for achievements
    const [habitsRes, gradesRes, termsRes] = await Promise.all([
      supabase.from('habits').select('id').eq('user_id', user.id).eq('is_active', true),
      supabase.from('grades').select('id').eq('user_id', user.id),
      supabase.from('technical_terms').select('id').eq('user_id', user.id),
    ]);

    await checkAndUnlockAchievements(user.id, {
      level: profile.level,
      xp: profile.xp,
      streakDays: profile.streak_days,
      tasksCompleted: stats.tasksCompleted,
      habitsCreated: habitsRes.data?.length || 0,
      gradesCount: gradesRes.data?.length || 0,
      termsCount: termsRes.data?.length || 0,
    });
  };

  const isLoading = authLoading || profileLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <AppLayout>
      <div className="p-4 md:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        {/* Motivation Quote */}
        <MotivationQuote />

        {/* Hero Stats - Level, XP, Streak */}
        <HeroStats 
          xp={profile?.xp || 0} 
          level={profile?.level || 1} 
          streakDays={profile?.streak_days || 0}
          tasksCompleted={todayTasksCompleted}
          tasksTotal={todayTasksTotal}
        />

        {/* Time Progress */}
        <TimeProgressCard />

        {/* Habits & Achievements Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          <HabitsOverview />
          <AchievementsCard />
        </div>

        {/* Quick Stats */}
        <QuickStats
          tasksCompleted={stats.tasksCompleted}
          tasksPending={stats.tasksPending}
          averageGrade={stats.averageGrade}
          totalBalance={stats.totalBalance}
          loadingPrices={stats.loadingPrices}
        />
      </div>
    </AppLayout>
  );
}
