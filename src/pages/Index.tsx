import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useStats } from '@/hooks/useStats';
import { AppLayout } from '@/components/layout/AppLayout';
import { CompactLevelCard } from '@/components/dashboard/CompactLevelCard';
import { TodayProgressCard } from '@/components/dashboard/TodayProgressCard';
import { NextActionsCard } from '@/components/dashboard/NextActionsCard';
import { HabitsOverview } from '@/components/dashboard/HabitsOverview';
import { AchievementsCard, checkAndUnlockAchievements } from '@/components/dashboard/AchievementsCard';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { TimeProgressCard } from '@/components/dashboard/TimeProgressCard';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
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
      <div className="p-4 md:p-6 lg:p-8 space-y-4 max-w-7xl mx-auto">
        {/* Top Row: Level + Time Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <CompactLevelCard
              xp={profile?.xp || 0}
              level={profile?.level || 1}
              streakDays={profile?.streak_days || 0}
            />
          </div>
          <TimeProgressCard />
        </div>

        {/* Today's Progress */}
        <TodayProgressCard />

        {/* Main Content: Actions + Habits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <NextActionsCard />
          <HabitsOverview />
        </div>

        {/* Bottom: Achievements + Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AchievementsCard />
          <QuickStats
            tasksCompleted={stats.tasksCompleted}
            tasksPending={stats.tasksPending}
            averageGrade={stats.averageGrade}
            totalBalance={stats.totalBalance}
            loadingPrices={stats.loadingPrices}
          />
        </div>
      </div>
    </AppLayout>
  );
}
