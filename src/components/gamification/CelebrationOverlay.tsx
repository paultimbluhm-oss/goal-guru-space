import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Flame, Trophy, Star } from 'lucide-react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
}

interface CelebrationOverlayProps {
  type: 'xp' | 'levelUp' | 'streak' | 'achievement';
  amount?: number;
  message?: string;
  onComplete?: () => void;
}

const colors = {
  xp: ['#a855f7', '#d946ef', '#ec4899', '#f472b6'],
  levelUp: ['#fbbf24', '#f59e0b', '#eab308', '#facc15'],
  streak: ['#f97316', '#ef4444', '#fb923c', '#fbbf24'],
  achievement: ['#22c55e', '#10b981', '#34d399', '#6ee7b7'],
};

export function CelebrationOverlay({ type, amount, message, onComplete }: CelebrationOverlayProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Generate particles
    const newParticles: Particle[] = [];
    const particleCount = type === 'levelUp' ? 50 : 30;
    
    for (let i = 0; i < particleCount; i++) {
      newParticles.push({
        id: i,
        x: 50 + (Math.random() - 0.5) * 40,
        y: 50 + (Math.random() - 0.5) * 30,
        color: colors[type][Math.floor(Math.random() * colors[type].length)],
        size: Math.random() * 8 + 4,
        rotation: Math.random() * 360,
      });
    }
    setParticles(newParticles);

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onComplete?.(), 300);
    }, type === 'levelUp' ? 3000 : 2000);

    return () => clearTimeout(timer);
  }, [type, onComplete]);

  const Icon = {
    xp: Zap,
    levelUp: Star,
    streak: Flame,
    achievement: Trophy,
  }[type];

  const title = {
    xp: `+${amount} XP`,
    levelUp: `Level ${amount}!`,
    streak: `${amount} Tage Streak!`,
    achievement: 'Achievement!',
  }[type];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center"
        >
          {/* Particles */}
          {particles.map((particle) => (
            <motion.div
              key={particle.id}
              initial={{
                left: `${particle.x}%`,
                top: `${particle.y}%`,
                scale: 0,
                rotate: 0,
              }}
              animate={{
                left: `${particle.x + (Math.random() - 0.5) * 60}%`,
                top: `${particle.y + (Math.random() - 0.5) * 60}%`,
                scale: [0, 1.5, 0],
                rotate: particle.rotation + 360,
              }}
              transition={{
                duration: type === 'levelUp' ? 2 : 1.5,
                ease: 'easeOut',
              }}
              className="absolute"
              style={{
                width: particle.size,
                height: particle.size,
                backgroundColor: particle.color,
                borderRadius: Math.random() > 0.5 ? '50%' : '2px',
              }}
            />
          ))}

          {/* Central celebration */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ 
              scale: [0, 1.3, 1],
              rotate: [- 180, 10, 0],
            }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ 
              duration: 0.6,
              type: 'spring',
              stiffness: 200,
            }}
            className="relative"
          >
            {/* Glow effect */}
            <motion.div
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 0.8, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
              }}
              className={`absolute inset-0 rounded-full blur-xl ${
                type === 'xp' ? 'bg-purple-500' :
                type === 'levelUp' ? 'bg-yellow-500' :
                type === 'streak' ? 'bg-orange-500' :
                'bg-green-500'
              }`}
              style={{ transform: 'scale(2)' }}
            />

            {/* Main content */}
            <div className={`relative z-10 p-8 rounded-2xl backdrop-blur-sm border-2 ${
              type === 'xp' ? 'bg-purple-500/20 border-purple-400' :
              type === 'levelUp' ? 'bg-yellow-500/20 border-yellow-400' :
              type === 'streak' ? 'bg-orange-500/20 border-orange-400' :
              'bg-green-500/20 border-green-400'
            }`}>
              <motion.div
                animate={{ 
                  rotate: type === 'levelUp' ? [0, 360] : 0,
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  rotate: { duration: 2, repeat: Infinity, ease: 'linear' },
                  scale: { duration: 0.5, repeat: Infinity },
                }}
                className="flex justify-center mb-3"
              >
                <Icon className={`w-16 h-16 ${
                  type === 'xp' ? 'text-purple-400' :
                  type === 'levelUp' ? 'text-yellow-400' :
                  type === 'streak' ? 'text-orange-400' :
                  'text-green-400'
                }`} />
              </motion.div>

              <motion.h2
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className={`text-3xl md:text-4xl font-bold text-center ${
                  type === 'xp' ? 'text-purple-300' :
                  type === 'levelUp' ? 'text-yellow-300' :
                  type === 'streak' ? 'text-orange-300' :
                  'text-green-300'
                }`}
              >
                {title}
              </motion.h2>

              {message && (
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-center text-muted-foreground mt-2 text-lg"
                >
                  {message}
                </motion.p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
