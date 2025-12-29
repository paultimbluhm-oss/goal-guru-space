import { ListChecks, Trash2, CheckCircle2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChecklistCardProps {
  checklist: {
    id: string;
    name: string;
    items_count?: number;
    completed_count?: number;
  };
  onClick: () => void;
  onDelete: () => void;
}

export function ChecklistCard({ checklist, onClick, onDelete }: ChecklistCardProps) {
  const progress = checklist.items_count 
    ? (checklist.completed_count || 0) / checklist.items_count * 100 
    : 0;
  const isComplete = checklist.items_count && checklist.items_count > 0 && progress === 100;

  return (
    <div
      className="relative flex items-center gap-3 p-3 rounded-lg bg-card/80 border border-border/50 hover:border-primary/50 transition-all cursor-pointer group"
      onClick={onClick}
    >
      {/* Progress indicator bar */}
      <div 
        className={cn(
          "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-all",
          isComplete ? "bg-emerald-500" : progress > 0 ? "bg-teal-500" : "bg-muted"
        )}
      />

      {/* Icon */}
      <div className={cn(
        "p-2 rounded-lg shrink-0 ml-2",
        isComplete ? "bg-emerald-500/20" : "bg-teal-500/20"
      )}>
        {isComplete ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        ) : (
          <ListChecks className="w-4 h-4 text-teal-500" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{checklist.name}</h3>
        <p className="text-xs text-muted-foreground">
          {checklist.completed_count || 0} / {checklist.items_count || 0}
          {checklist.items_count && checklist.items_count > 0 && (
            <span className="ml-1.5 text-teal-500">
              ({Math.round(progress)}%)
            </span>
          )}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="w-3.5 h-3.5 text-destructive" />
        </Button>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>
    </div>
  );
}
