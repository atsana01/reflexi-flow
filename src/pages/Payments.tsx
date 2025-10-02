import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { el } from '@/lib/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function Payments() {
  const { data: payments } = useQuery({
    queryKey: ['payments', 'recent'],
    queryFn: async () => {
      const { data } = await supabase
        .from('payments')
        .select(`
          *,
          clients (first_name, last_name)
        `)
        .order('paid_at', { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

  const getMethodLabel = (method: string) => {
    return el.payments[method as keyof typeof el.payments] || method;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{el.nav.payments}</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{el.payments.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">€{totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{el.payments.recentPayments}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payments && payments.length > 0 ? (
              payments.map((payment: any) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between border-b pb-3 last:border-0"
                >
                  <div>
                    <div className="font-medium">
                      {payment.clients?.first_name} {payment.clients?.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(payment.paid_at), 'dd/MM/yyyy HH:mm')}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{getMethodLabel(payment.method)}</Badge>
                    <div className="text-lg font-semibold">
                      €{Number(payment.amount).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                Δεν υπάρχουν πληρωμές
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
