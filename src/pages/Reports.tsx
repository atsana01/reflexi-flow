import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { el } from '@/lib/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { startOfMonth, endOfMonth } from 'date-fns';

export default function Reports() {
  const [selectedMonth] = useState(new Date());
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  const { data: sessions } = useQuery({
    queryKey: ['sessions', 'report', monthStart],
    queryFn: async () => {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .gte('started_at', monthStart.toISOString())
        .lte('started_at', monthEnd.toISOString());
      return data || [];
    },
  });

  const { data: payments } = useQuery({
    queryKey: ['payments', 'report', monthStart],
    queryFn: async () => {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .gte('paid_at', monthStart.toISOString())
        .lte('paid_at', monthEnd.toISOString());
      return data || [];
    },
  });

  const totalSessions = sessions?.length || 0;
  const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
  const totalBilled = sessions?.reduce((sum, s) => sum + (Number(s.bill_amount) || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{el.nav.reports}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>{el.dashboard.monthSessions}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalSessions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Σύνολο χρεώσεων</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">€{totalBilled.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{el.dashboard.monthRevenue}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">€{totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
