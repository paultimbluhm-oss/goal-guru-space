import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useStats } from '@/hooks/useStats';
import { AppLayout } from '@/components/layout/AppLayout';
import { HeroStats } from '@/components/dashboard/HeroStats';
import { HabitsOverview } from '@/components/dashboard/HabitsOverview';
import { AchievementsCard, checkAndUnlockAchievements } from '@/components/dashboard/AchievementsCard';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { MotivationQuote } from '@/components/dashboard/MotivationQuote';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, recentActivity, refetch } = useProfile();
  const { stats, loading: statsLoading } = useStats();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

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
        {/* Header */}
        <div className="fade-in">
          <h1 className="text-2xl md:text-3xl font-bold">
            Willkommen zurück<span className="text-gradient-primary">!</span>
          </h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">
            Hier ist dein persönliches Dashboard
          </p>
        </div>

        {/* Motivation Quote */}
        <MotivationQuote />

        {/* Hero Stats - Level, XP, Streak */}
        <HeroStats 
          xp={profile?.xp || 0} 
          level={profile?.level || 1} 
          streakDays={profile?.streak_days || 0} 
        />

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

        {/* Recent Activity */}
        <RecentActivity activities={recentActivity} />
      </div>
    </AppLayout>
  );
}
