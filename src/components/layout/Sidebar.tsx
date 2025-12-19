import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Warehouse,
  LayoutDashboard,
  GraduationCap,
  User,
  Briefcase,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/schule', icon: GraduationCap, label: 'Schule' },
  { to: '/privat', icon: User, label: 'Privat' },
  { to: '/business', icon: Briefcase, label: 'Business' },
];

export function Sidebar() {
  const [expanded, setExpanded] = useState(false);
  const { signOut, user } = useAuth();
  const location = useLocation();

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'h-screen sticky top-0 flex flex-col bg-sidebar border-r border-sidebar-border transition-all duration-300',
          expanded ? 'w-56' : 'w-14'
        )}
      >
        {/* Logo & Toggle */}
        <div className="p-2 border-b border-sidebar-border flex items-center justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="p-2"
          >
            {expanded ? (
              <X className="w-5 h-5" />
            ) : (
              <Menu className="w-5 h-5" />
            )}
          </Button>
          {expanded && (
            <div className="flex items-center gap-2 ml-2">
              <Warehouse className="w-5 h-5 text-primary" />
              <span className="text-lg font-bold text-gradient-primary">LifeOS</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const linkContent = (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
                  expanded ? '' : 'justify-center',
                  isActive
                    ? 'bg-primary/20 text-primary'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                )}
              >
                <item.icon
                  className={cn(
                    'w-5 h-5 shrink-0 transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                {expanded && (
                  <span className="font-medium truncate">{item.label}</span>
                )}
              </NavLink>
            );

            if (!expanded) {
              return (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>
                    {linkContent}
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            }

            return linkContent;
          })}
        </nav>

        {/* User & Logout */}
        <div className="p-2 border-t border-sidebar-border space-y-1">
          {expanded && user && (
            <div className="px-3 py-2 text-xs text-muted-foreground truncate">
              {user.email}
            </div>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className={cn(
                  'w-full text-muted-foreground hover:text-destructive',
                  expanded ? 'justify-start gap-3' : 'justify-center px-0'
                )}
              >
                <LogOut className="w-4 h-4" />
                {expanded && 'Abmelden'}
              </Button>
            </TooltipTrigger>
            {!expanded && (
              <TooltipContent side="right">
                Abmelden
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
