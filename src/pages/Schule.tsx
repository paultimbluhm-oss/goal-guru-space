import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { AppLayout } from '@/components/layout/AppLayout';
import { GraduationCap, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Schule() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  if (loading || !user) return null;

  return (
    <AppLayout>
      <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-primary/20">
              <GraduationCap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Schule</h1>
              <p className="text-muted-foreground">Fächer & Noten verwalten</p>
            </div>
          </div>
          <Button><Plus className="w-4 h-4 mr-2" />Fach hinzufügen</Button>
        </div>

        <div className="glass-card p-12 text-center">
          <GraduationCap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Noch keine Fächer</h3>
          <p className="text-muted-foreground mb-4">Füge dein erstes Schulfach hinzu</p>
          <Button><Plus className="w-4 h-4 mr-2" />Erstes Fach erstellen</Button>
        </div>
      </div>
    </AppLayout>
  );
}
