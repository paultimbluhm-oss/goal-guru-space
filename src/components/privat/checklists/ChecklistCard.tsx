import { ListChecks, Trash2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

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
      className="glass-card p-4 hover:border-primary/50 transition-colors cursor-pointer group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${isComplete ? 'bg-green-500/20' : 'bg-primary/20'}`}>
            {isComplete ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : (
              <ListChecks className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <h3 className="font-semibold">{checklist.name}</h3>
            <p className="text-sm text-muted-foreground">
              {checklist.completed_count || 0} / {checklist.items_count || 0} erledigt
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
      
      {checklist.items_count && checklist.items_count > 0 && (
        <Progress value={progress} className="h-2" />
      )}
    </div>
  );
}
