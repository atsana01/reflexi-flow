import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { el } from '@/lib/translations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

interface ClientFormProps {
  client?: any;
  onSuccess: (clientId: string) => void;
  onCancel: () => void;
}

export function ClientForm({ client, onSuccess, onCancel }: ClientFormProps) {
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: client?.first_name || '',
    last_name: client?.last_name || '',
    phone: client?.phone || '',
    email: client?.email || '',
    date_of_birth: client?.date_of_birth || '',
    address_line: client?.address_line || '',
    pathisi: client?.pathisi || '',
    notes: client?.notes || '',
    gdpr_consent: client?.gdpr_consent || false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = el.clients.fieldRequired;
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = el.clients.fieldRequired;
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = el.clients.invalidEmail;
    }

    if (!client && !formData.gdpr_consent) {
      newErrors.gdpr_consent = el.clients.gdprConsentRequired;
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

      if (client) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', client.id)
          .eq('account_id', user.user.id);

        if (error) throw error;

        toast({
          title: el.clients.clientUpdated,
        });
      } else {
        // Create new client
        const { data, error } = await supabase
          .from('clients')
          .insert({
            ...formData,
            account_id: user.user.id,
            consent_date: formData.gdpr_consent ? new Date().toISOString() : null,
          })
          .select()
          .single();

        if (error) throw error;

        toast({
          title: el.clients.clientCreated,
        });

        queryClient.invalidateQueries({ queryKey: ['clients'] });
        onSuccess(data.id);
        return;
      }

      queryClient.invalidateQueries({ queryKey: ['clients'] });
      onSuccess(client.id);
    } catch (error) {
      toast({
        title: el.clients.createError,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="first_name">{el.clients.firstName}*</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) =>
              setFormData({ ...formData, first_name: e.target.value })
            }
          />
          {errors.first_name && (
            <p className="text-sm text-destructive">{errors.first_name}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">{el.clients.lastName}*</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) =>
              setFormData({ ...formData, last_name: e.target.value })
            }
          />
          {errors.last_name && (
            <p className="text-sm text-destructive">{errors.last_name}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">{el.clients.phone}</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{el.clients.email}</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="date_of_birth">{el.clients.dateOfBirth}</Label>
        <Input
          id="date_of_birth"
          type="date"
          value={formData.date_of_birth}
          onChange={(e) =>
            setFormData({ ...formData, date_of_birth: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address_line">{el.clients.address}</Label>
        <Input
          id="address_line"
          value={formData.address_line}
          onChange={(e) =>
            setFormData({ ...formData, address_line: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pathisi">{el.clients.medicalNotes}</Label>
        <Textarea
          id="pathisi"
          value={formData.pathisi}
          onChange={(e) =>
            setFormData({ ...formData, pathisi: e.target.value })
          }
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">{el.clients.notes}</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />
      </div>

      {!client && (
        <div className="space-y-2 pt-2">
          <div className="flex items-start gap-2">
            <Checkbox
              id="gdpr_consent"
              checked={formData.gdpr_consent}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, gdpr_consent: !!checked })
              }
            />
            <div className="space-y-1">
              <Label
                htmlFor="gdpr_consent"
                className="text-sm font-normal leading-tight cursor-pointer"
              >
                {el.clients.gdprConsent}*
              </Label>
              {errors.gdpr_consent && (
                <p className="text-sm text-destructive">{errors.gdpr_consent}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-3 justify-end pt-4">
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
