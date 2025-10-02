import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Calendar, CreditCard, BarChart3, Settings, LogOut } from 'lucide-react';
import { el } from '@/lib/translations';
import { supabase } from '@/integrations/supabase/client';
import { Button } from './ui/button';
import { toast } from '@/hooks/use-toast';

export const Navigation = () => {
  const location = useLocation();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        variant: "destructive",
        title: "Σφάλμα",
        description: error.message
      });
    }
  };

  const navItems = [
    { to: '/', icon: Home, label: el.nav.dashboard },
    { to: '/clients', icon: Users, label: el.nav.clients },
    { to: '/calendar', icon: Calendar, label: el.nav.calendar },
    { to: '/payments', icon: CreditCard, label: el.nav.payments },
    { to: '/reports', icon: BarChart3, label: el.nav.reports },
    { to: '/settings', icon: Settings, label: el.nav.settings },
  ];

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden md:flex md:fixed md:left-0 md:top-0 md:h-screen md:w-64 md:flex-col md:border-r md:bg-card md:p-4">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-foreground">{el.app.title}</h1>
        </div>
        
        <div className="flex-1 space-y-2">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                location.pathname === to
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </div>

        <Button
          variant="ghost"
          className="mt-4 w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-5 w-5" />
          {el.app.logout}
        </Button>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t bg-card">
        <div className="flex items-center justify-around px-2 py-3">
          {navItems.slice(0, 5).map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 px-3 py-1 ${
                location.pathname === to
                  ? 'text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};
