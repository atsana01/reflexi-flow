import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { el } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { el as elDateFns } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

export default function Calendar() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const { data: appointments } = useQuery({
    queryKey: ['appointments', 'week'],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select(`
          *,
          clients (first_name, last_name)
        `)
        .gte('start_time', weekStart.toISOString())
        .lte('start_time', addDays(weekStart, 7).toISOString())
        .order('start_time');
      return data || [];
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{el.nav.calendar}</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          {el.appointments.create}
        </Button>
      </div>

      <div className="space-y-4">
        {weekDays.map((day) => {
          const dayAppointments = appointments?.filter((apt) =>
            isSameDay(new Date(apt.start_time), day)
          );

          return (
            <Card key={day.toISOString()}>
              <CardContent className="pt-6">
                <div className="mb-4">
                  <h3 className="font-semibold">
                    {format(day, 'EEEE, d MMMM', { locale: elDateFns })}
                  </h3>
                  {isSameDay(day, today) && (
                    <Badge className="mt-1">Σήμερα</Badge>
                  )}
                </div>

                {dayAppointments && dayAppointments.length > 0 ? (
                  <div className="space-y-3">
                    {dayAppointments.map((apt: any) => (
                      <div
                        key={apt.id}
                        className="flex items-start gap-3 rounded-lg border p-3"
                      >
                        <div className="flex-1">
                          <div className="font-medium">
                            {apt.clients?.first_name} {apt.clients?.last_name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {format(new Date(apt.start_time), 'HH:mm')}
                            {apt.end_time && ` - ${format(new Date(apt.end_time), 'HH:mm')}`}
                          </div>
                          {apt.notes && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {apt.notes}
                            </div>
                          )}
                        </div>
                        <Badge variant={getStatusColor(apt.status)}>
                          {el.appointments[apt.status as keyof typeof el.appointments]}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Δεν υπάρχουν ραντεβού
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
