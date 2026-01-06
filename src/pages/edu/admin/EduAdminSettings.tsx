import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Building2, Shield, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useCurrentInstitution } from '@/hooks/useEduMembership';

export default function EduAdminSettings() {
  const { institution } = useCurrentInstitution();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Configure as preferências da instituição.
        </p>
      </div>

      {/* Institution Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Informações da Instituição
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Instituição</Label>
            <Input id="name" value={institution?.name || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Identificador</Label>
            <Input id="slug" value={institution?.slug || ''} disabled />
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notificações
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Notificações por E-mail</p>
              <p className="text-sm text-muted-foreground">Receba alertas sobre novas matrículas</p>
            </div>
            <Switch disabled />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Relatórios Semanais</p>
              <p className="text-sm text-muted-foreground">Receba resumos de atividade</p>
            </div>
            <Switch disabled />
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Segurança
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">
              Configurações de segurança avançadas em breve.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
