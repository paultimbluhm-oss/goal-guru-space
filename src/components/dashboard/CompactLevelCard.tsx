import { calculateXPProgress } from '@/hooks/useProfile';
import { Zap, Flame, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

interface CompactLevelCardProps {
  xp: number;
  level: number;
  streakDays: number;
}

const getLevelTitle = (level: number): string => {
  if (level < 5) return 'Anfänger';
  if (level < 10) return 'Lehrling';
  if (level < 20) return 'Geselle';
  if (level < 35) return 'Experte';
  if (level < 50) return 'Meister';
  return 'Legende';
};

export function CompactLevelCard({ xp, level, streakDays }: CompactLevelCardProps) {
  const { current, needed, percentage } = calculateXPProgress(xp);
  const title = getLevelTitle(level);

  return (
    <div className="glass-card p-4 md:p-5 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-xp/10 rounded-full blur-3xl" />

      <div className="relative z-10">
        <div className="flex items-center gap-4">
          {/* Level Circle */}
          <div className="relative flex-shrink-0">
            <svg className="w-20 h-20 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="hsl(var(--secondary))"
                strokeWidth="8"
                className="opacity-50"
              />
              <motion.circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="url(#compactXpGradient)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 40}
                initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - percentage / 100) }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="drop-shadow-[0_0_10px_hsl(var(--xp)/0.5)]"
              />
              <defs>
                <linearGradient id="compactXpGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(280 80% 60%)" />
                  <stop offset="100%" stopColor="hsl(320 70% 50%)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-level font-mono">{level}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="w-4 h-4 text-level" />
              <span className="text-sm font-medium text-foreground">{title}</span>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-[hsl(var(--xp))]" />
              <span className="text-sm text-gradient-xp font-bold font-mono">{xp.toLocaleString()} XP</span>
            </div>

            <div className="h-2 bg-secondary rounded-full overflow-hidden mb-1">
              <motion.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg, hsl(280 80% 60%), hsl(320 70% 50%))' }}
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {needed - current} XP bis Level {level + 1}
            </p>
          </div>

          {/* Streak */}
          <div className="flex-shrink-0 text-center p-3 rounded-lg bg-streak/10 border border-streak/20">
            <Flame className={`w-5 h-5 mx-auto mb-1 ${streakDays > 0 ? 'text-streak animate-pulse' : 'text-muted-foreground'}`} />
            <span className="text-lg font-bold text-streak font-mono">{streakDays}</span>
            <p className="text-xs text-muted-foreground">Tage</p>
          </div>
        </div>
      </div>
    </div>
  );
}
