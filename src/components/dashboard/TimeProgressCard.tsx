import { Clock, Calendar } from 'lucide-react';

export function TimeProgressCard() {
  const now = new Date();
  
  // Day progress (0:00 - 23:59)
  const hoursElapsed = now.getHours() + now.getMinutes() / 60;
  const dayProgress = Math.round((hoursElapsed / 24) * 100);
  
  // Month progress
  const currentDay = now.getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthProgress = Math.round((currentDay / daysInMonth) * 100);

  return (
    <div className="glass-card p-4 md:p-6">
      <div className="flex items-center gap-2 md:gap-3 mb-4">
        <Clock className="w-4 h-4 md:w-5 md:h-5 text-primary" />
        <h3 className="font-semibold text-sm md:text-base">Zeitfortschritt</h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Day Progress */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">Heute</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-foreground">
            {dayProgress}%
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500"
              style={{ width: `${dayProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            {now.getHours()}:{now.getMinutes().toString().padStart(2, '0')} Uhr
          </p>
        </div>

        {/* Month Progress */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-xs">Monat</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-foreground">
            {monthProgress}%
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-accent to-accent/70 rounded-full transition-all duration-500"
              style={{ width: `${monthProgress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Tag {currentDay} von {daysInMonth}
          </p>
        </div>
      </div>
    </div>
  );
}
