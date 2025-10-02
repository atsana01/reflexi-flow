import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { el } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AppointmentFormProps {
  clientId?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function AppointmentForm({ clientId, onSuccess, onCancel }: AppointmentFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState(clientId || '');
  const [startDateTime, setStartDateTime] = useState(
    format(new Date(), "yyyy-MM-dd'T'HH:mm")
  );
  const [endTime, setEndTime] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: clients } = useQuery({
    queryKey: ['clients-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('clients')
        .select('id, first_name, last_name')
        .eq('active', true)
        .order('last_name');
      return data || [];
    },
    enabled: !clientId,
  });

  useEffect(() => {
    if (clientId) {
      setSelectedClientId(clientId);
    }
  }, [clientId]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!selectedClientId) {
      newErrors.client = el.clients.fieldRequired;
    }

    if (!startDateTime) {
      newErrors.startDateTime = el.clients.fieldRequired;
    }

    if (endTime) {
      const start = new Date(startDateTime);
      const end = new Date(`${startDateTime.split('T')[0]}T${endTime}`);
      if (end <= start) {
        newErrors.endTime = el.appointments.endMustBeAfterStart;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const startTime = new Date(startDateTime);
      const endTimeValue = endTime
        ? new Date(`${startDateTime.split('T')[0]}T${endTime}`)
        : null;

      const { error } = await supabase.from('appointments').insert({
        account_id: user.user.id,
        client_id: selectedClientId,
        start_time: startTime.toISOString(),
        end_time: endTimeValue?.toISOString() || null,
        status: 'scheduled',
        notes: notes || null,
      });

      if (error) throw error;

      toast({
        title: el.appointments.created,
      });

      onSuccess();
    } catch (error) {
      toast({
        title: el.appointments.createError,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!clientId && (
        <div className="space-y-2">
          <Label htmlFor="client">
            {el.appointments.client}*
          </Label>
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger>
              <SelectValue placeholder={el.appointments.selectClient} />
            </SelectTrigger>
            <SelectContent>
              {clients?.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.last_name} {client.first_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.client && (
            <p className="text-sm text-destructive">{errors.client}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="startDateTime">
          {el.appointments.startDateTime}*
        </Label>
        <Input
          id="startDateTime"
          type="datetime-local"
          value={startDateTime}
          onChange={(e) => setStartDateTime(e.target.value)}
        />
        {errors.startDateTime && (
          <p className="text-sm text-destructive">{errors.startDateTime}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="endTime">{el.appointments.endTime}</Label>
        <Input
          id="endTime"
          type="time"
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
        />
        {errors.endTime && (
          <p className="text-sm text-destructive">{errors.endTime}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{el.appointments.notes}</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={onCancel}>
          {el.common.cancel}
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? el.common.loading : el.common.save}
        </Button>
      </div>
    </form>
  );
}
