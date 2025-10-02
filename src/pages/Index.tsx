import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { el } from '@/lib/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, TrendingUp, Users, Euro } from 'lucide-react';
import { startOfToday, startOfWeek, startOfMonth, endOfToday, format } from 'date-fns';

export default function Index() {
  const today = startOfToday();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const monthStart = startOfMonth(today);

  const { data: todaySessions } = useQuery({
    queryKey: ['sessions', 'today'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .gte('started_at', today.toISOString())
        .lte('started_at', endOfToday().toISOString());
      return data || [];
    },
  });

  const { data: weekSessions } = useQuery({
    queryKey: ['sessions', 'week'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .gte('started_at', weekStart.toISOString());
      return data || [];
    },
  });

  const { data: monthSessions } = useQuery({
    queryKey: ['sessions', 'month'],
    queryFn: async () => {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .gte('started_at', monthStart.toISOString());
      return data || [];
    },
  });

  const { data: todayPayments } = useQuery({
    queryKey: ['payments', 'today'],
    queryFn: async () => {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .gte('paid_at', today.toISOString())
        .lte('paid_at', endOfToday().toISOString());
      return data || [];
    },
  });

  const todayRevenue = todayPayments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const monthRevenue = monthSessions?.reduce((sum, s) => sum + (Number(s.bill_amount) || 0), 0) || 0;

  const stats = [
    {
      title: el.dashboard.todaySessions,
      value: todaySessions?.length || 0,
      icon: Calendar,
      color: 'text-blue-500'
    },
    {
      title: el.dashboard.weekSessions,
      value: weekSessions?.length || 0,
      icon: TrendingUp,
      color: 'text-green-500'
    },
    {
      title: el.dashboard.todayRevenue,
      value: `€${todayRevenue.toFixed(2)}`,
      icon: Euro,
      color: 'text-purple-500'
    },
    {
      title: el.dashboard.monthRevenue,
      value: `€${monthRevenue.toFixed(2)}`,
      icon: Euro,
      color: 'text-orange-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{el.nav.dashboard}</h1>
        <p className="text-muted-foreground">{format(today, 'EEEE, d MMMM yyyy')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
