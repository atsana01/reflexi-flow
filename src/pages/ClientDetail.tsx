import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { el } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Calendar, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { el as elDateFns } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppointmentForm } from '@/components/AppointmentForm';
import { ClientForm } from '@/components/ClientForm';
import { toast } from '@/hooks/use-toast';

export default function ClientDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);

  const { data: client, isLoading } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();
      return data;
    },
  });

  const { data: sessions } = useQuery({
    queryKey: ['client-sessions', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('client_id', id)
        .order('started_at', { ascending: false });
      return data || [];
    },
  });

  const { data: appointments } = useQuery({
    queryKey: ['client-appointments', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('appointments')
        .select('*')
        .eq('client_id', id)
        .order('start_time', { ascending: false });
      return data || [];
    },
  });

  const { data: payments } = useQuery({
    queryKey: ['client-payments', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('payments')
        .select('*')
        .eq('client_id', id)
        .order('paid_at', { ascending: false });
      return data || [];
    },
  });

  const { data: activePackage } = useQuery({
    queryKey: ['client-active-package', id],
    queryFn: async () => {
      const { data } = await supabase
        .from('packages')
        .select('*')
        .eq('client_id', id)
        .eq('status', 'active')
        .order('start_date', { ascending: false })
        .limit(1)
        .single();
      return data;
    },
  });

  const { data: balance } = useQuery({
    queryKey: ['client-balance', id],
    queryFn: async () => {
      const { data } = await supabase.rpc('client_balances');
      return data?.find((b: any) => b.client_id === id);
    },
  });

  const handleArchive = async () => {
    if (!confirm(el.clients.confirmDelete)) return;

    try {
      await supabase
        .from('clients')
        .update({ active: false })
        .eq('id', id);

      toast({
        title: el.clients.clientArchived,
      });

      navigate('/clients');
    } catch (error) {
      console.error('Error archiving client:', error);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">{el.common.loading}</div>;
  }

  if (!client) {
    return <div className="text-center py-8">Δεν βρέθηκε πελάτης</div>;
  }

  const age = client.date_of_birth
    ? new Date().getFullYear() - new Date(client.date_of_birth).getFullYear()
    : null;

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clients')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">
            {client.last_name} {client.first_name}
          </h1>
          {age && <p className="text-muted-foreground">{age} ετών</p>}
        </div>
      </div>

      <div className="flex gap-4">
        {client.phone && (
          <a href={`tel:${client.phone}`}>
            <Button variant="outline" size="sm">
              <Phone className="h-4 w-4 mr-2" />
              {client.phone}
            </Button>
          </a>
        )}
        {client.email && (
          <a href={`mailto:${client.email}`}>
            <Button variant="outline" size="sm">
              <Mail className="h-4 w-4 mr-2" />
              {client.email}
            </Button>
          </a>
        )}
      </div>

      {balance && balance.balance_due !== 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{el.clients.balance}</span>
              <Badge variant={balance.balance_due > 0 ? 'destructive' : 'default'}>
                €{Math.abs(balance.balance_due).toFixed(2)}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {activePackage && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{el.clients.activePackage}</span>
                <Badge>{el.packages.active}</Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>{el.clients.sessionsProgress}</span>
                <span className="font-medium">
                  {activePackage.sessions_used}/{activePackage.sessions_total}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{el.clients.overview}</TabsTrigger>
          <TabsTrigger value="sessions">{el.sessions.title}</TabsTrigger>
          <TabsTrigger value="appointments">{el.appointments.title}</TabsTrigger>
          <TabsTrigger value="payments">{el.payments.title}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {client.pathisi && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{el.clients.condition}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{client.pathisi}</p>
              </CardContent>
            </Card>
          )}

          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{el.clients.notes}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}

          {sessions && sessions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{el.clients.lastSession}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  {format(new Date(sessions[0].started_at), 'dd MMMM yyyy', {
                    locale: elDateFns,
                  })}
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          {sessions && sessions.length > 0 ? (
            sessions.map((session) => (
              <Card key={session.id}>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">
                        {el.sessions.sessionNo}
                        {session.session_number_in_package || '—'}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(session.started_at), 'dd/MM/yyyy HH:mm')}
                      </span>
                    </div>
                    {session.duration_minutes && (
                      <p className="text-sm">
                        {el.sessions.duration}: {session.duration_minutes}
                      </p>
                    )}
                    {session.bill_amount && (
                      <p className="text-sm">
                        {el.sessions.bill}: €{session.bill_amount}
                      </p>
                    )}
                    {session.notes && (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {session.notes}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Δεν υπάρχουν συνεδρίες
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="appointments" className="space-y-4">
          {appointments && appointments.length > 0 ? (
            appointments.map((apt) => (
              <Card key={apt.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="font-medium">
                        {format(new Date(apt.start_time), 'dd/MM/yyyy HH:mm')}
                      </p>
                      {apt.notes && (
                        <p className="text-sm text-muted-foreground">{apt.notes}</p>
                      )}
                    </div>
                    <Badge>
                      {el.appointments[apt.status as keyof typeof el.appointments]}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Δεν υπάρχουν ραντεβού
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          {payments && payments.length > 0 ? (
            payments.map((payment) => (
              <Card key={payment.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">€{payment.amount}</p>
                      <p className="text-sm text-muted-foreground">
                        {el.payments[payment.method as keyof typeof el.payments]}
                      </p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(payment.paid_at), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Δεν υπάρχουν πληρωμές
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 flex gap-2 justify-around">
        <Button variant="outline" size="sm" onClick={() => setShowEditForm(true)}>
          {el.clientActions.editDetails}
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowAppointmentForm(true)}>
          {el.clientActions.newAppointment}
        </Button>
        <Button variant="outline" size="sm" onClick={handleArchive}>
          {el.clientActions.archive}
        </Button>
      </div>

      <Dialog open={showAppointmentForm} onOpenChange={setShowAppointmentForm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{el.appointments.create}</DialogTitle>
          </DialogHeader>
          <AppointmentForm
            clientId={id}
            onSuccess={() => {
              setShowAppointmentForm(false);
              queryClient.invalidateQueries({ queryKey: ['client-appointments', id] });
            }}
            onCancel={() => setShowAppointmentForm(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={showEditForm} onOpenChange={setShowEditForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{el.clients.editClient}</DialogTitle>
          </DialogHeader>
          <ClientForm
            client={client}
            onSuccess={() => {
              setShowEditForm(false);
              queryClient.invalidateQueries({ queryKey: ['client', id] });
            }}
            onCancel={() => setShowEditForm(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
