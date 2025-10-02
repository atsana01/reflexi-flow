import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { el } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Plus, Search, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ClientForm } from '@/components/ClientForm';

export default function Clients() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);

  const { data: clients, isLoading } = useQuery({
    queryKey: ['clients', search],
    queryFn: async () => {
      let query = supabase
        .from('clients')
        .select('*')
        .eq('active', true)
        .order('last_name');

      if (search) {
        query = query.or(
          `last_name.ilike.%${search}%,first_name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      const { data } = await query;
      return data || [];
    },
  });

  const { data: balances } = useQuery({
    queryKey: ['client-balances'],
    queryFn: async () => {
      const { data } = await supabase.rpc('client_balances');
      return data || [];
    },
  });

  const getBalance = (clientId: string) => {
    const balance = balances?.find((b) => b.client_id === clientId);
    return balance?.balance_due || 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{el.nav.clients}</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {el.clients.addClient}
        </Button>
      </div>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{el.clients.addClient}</DialogTitle>
          </DialogHeader>
          <ClientForm
            onSuccess={(clientId) => {
              setShowForm(false);
              navigate(`/clients/${clientId}`);
            }}
            onCancel={() => setShowForm(false)}
          />
        </DialogContent>
      </Dialog>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={el.clients.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8">{el.common.loading}</div>
      ) : clients && clients.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {clients.map((client) => {
            const balance = getBalance(client.id);
            return (
              <Link key={client.id} to={`/clients/${client.id}`}>
                <Card className="hover:border-primary transition-colors cursor-pointer">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold">
                          {client.first_name} {client.last_name}
                        </h3>
                        {balance !== 0 && (
                          <Badge variant={balance > 0 ? "destructive" : "default"} className="mt-1">
                            {el.clients.balance}: €{Math.abs(balance).toFixed(2)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-muted-foreground">
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </div>
                    )}
                    {client.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {el.clients.noResults}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
