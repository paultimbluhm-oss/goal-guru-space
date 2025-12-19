import React, { createContext, useContext, ReactNode, useCallback } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

interface GamificationContextType {
  addXP: (amount: number, reason?: string) => Promise<void>;
  profile: ReturnType<typeof useProfile>['profile'];
  xpProgress: ReturnType<typeof useProfile>['xpProgress'];
  recentActivity: ReturnType<typeof useProfile>['recentActivity'];
  loading: ReturnType<typeof useProfile>['loading'];
  refetch: ReturnType<typeof useProfile>['refetch'];
}

const GamificationContext = createContext<GamificationContextType | null>(null);

export function GamificationProvider({ children }: { children: ReactNode }) {
  const { profile, addXP: addXPBase, xpProgress, refetch, recentActivity, loading } = useProfile();

  const addXP = useCallback(async (amount: number, reason?: string) => {
    const result = await addXPBase(amount, reason);
    
    if (result) {
      // Show XP toast
      toast.success(`+${amount} XP${reason ? ` für ${reason}` : ''}`, {
        duration: 2000,
        position: 'top-center',
      });
      
      // Check for level up
      if (result.leveledUp) {
        setTimeout(() => {
          toast.success(`🎉 Level Up! Du bist jetzt Level ${result.newLevel}!`, {
            duration: 4000,
            position: 'top-center',
          });
        }, 500);
      }
      
      // Refetch to update recent activity
      await refetch();
    }
  }, [addXPBase, refetch]);

  return (
    <GamificationContext.Provider value={{ addXP, profile, xpProgress, recentActivity, loading, refetch }}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}
