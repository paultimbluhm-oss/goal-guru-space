import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { XPCard } from '@/components/dashboard/XPCard';
import { StreakCard } from '@/components/dashboard/StreakCard';
import { LevelCard } from '@/components/dashboard/LevelCard';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { RecentActivity } from '@/components/dashboard/RecentActivity';
import { MotivationQuote } from '@/components/dashboard/MotivationQuote';
import { Loader2 } from 'lucide-react';

export default function Index() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return null;

  // Mock data for now - will be fetched from database
  const mockData = {
    xp: 450,
    level: 5,
    streakDays: 3,
    tasksCompleted: 12,
    tasksPending: 5,
    averageGrade: 11.5,
    totalBalance: 1234.56,
    activities: [
      { id: '1', type: 'task_completed' as const, title: 'Mathe Hausaufgaben erledigt', timestamp: new Date(Date.now() - 3600000), xp: 15 },
      { id: '2', type: 'achievement' as const, title: 'Erste Woche abgeschlossen!', timestamp: new Date(Date.now() - 86400000), xp: 50 },
      { id: '3', type: 'item_added' as const, title: 'Neues Fach hinzugefügt: Englisch', timestamp: new Date(Date.now() - 172800000) },
    ],
  };

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
          <XPCard xp={mockData.xp} level={mockData.level} />
          <LevelCard level={mockData.level} />
          <StreakCard streakDays={mockData.streakDays} />
        </div>

        {/* Quick Stats */}
        <QuickStats
          tasksCompleted={mockData.tasksCompleted}
          tasksPending={mockData.tasksPending}
          averageGrade={mockData.averageGrade}
          totalBalance={mockData.totalBalance}
        />

        {/* Recent Activity */}
        <RecentActivity activities={mockData.activities} />
      </div>
    </AppLayout>
  );
}
