import { el } from '@/lib/translations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function Settings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{el.nav.settings}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{el.settings.profile}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground">
            Ρυθμίσεις προφίλ
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
