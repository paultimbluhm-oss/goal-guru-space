import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useStats } from '@/hooks/useStats';
import { AppLayout } from '@/components/layout/AppLayout';
import { XPCard } from '@/components/dashboard/XPCard';
import { StreakCard } from '@/components/dashboard/StreakCard';
import { LevelCard } from '@/components/dashboard/LevelCard';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { MotivationQuote } from '@/components/dashboard/MotivationQuote';
import { Loader2 } from 'lucide-react';

export default function Index() {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading, recentActivity } = useProfile();
  const { stats, loading: statsLoading } = useStats();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

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
      <div className="p-4 md:p-6 lg:p-8 space-y-4 md:space-y-6 max-w-7xl mx-auto">
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

        {/* Gamification Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <XPCard xp={profile?.xp || 0} level={profile?.level || 1} />
          <LevelCard level={profile?.level || 1} />
          <StreakCard streakDays={profile?.streak_days || 0} />
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
