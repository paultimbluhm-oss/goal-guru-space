import { Progress } from '@/components/ui/progress';
import { Zap } from 'lucide-react';

interface XPCardProps {
  xp: number;
  level: number;
}

export function XPCard({ xp, level }: XPCardProps) {
  const xpForCurrentLevel = (level - 1) * 100;
  const xpForNextLevel = level * 100;
  const xpProgress = ((xp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100;

  return (
    <div className="glass-card p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-primary/20 to-transparent rounded-bl-full" />
      
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 glow-xp">
          <Zap className="w-6 h-6 text-purple-400" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Experience Points</p>
          <p className="text-3xl font-bold text-gradient-xp font-mono">{xp.toLocaleString()}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Level {level}</span>
          <span className="text-muted-foreground">Level {level + 1}</span>
        </div>
        <Progress value={xpProgress} variant="xp" className="h-3" />
        <p className="text-xs text-muted-foreground text-center">
          {xpForNextLevel - xp} XP bis zum nächsten Level
        </p>
      </div>
    </div>
  );
}
