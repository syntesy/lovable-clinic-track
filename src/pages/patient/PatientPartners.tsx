import { useQuery } from '@tanstack/react-query';
import { usePatientAuth } from '@/contexts/PatientAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PatientLayout } from '@/components/patient/PatientLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Percent, Info, ShoppingBag } from 'lucide-react';

export default function PatientPartners() {
  const { session } = usePatientAuth();

  const { data: partners, isLoading } = useQuery({
    queryKey: ['partners'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('partners')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    }
  });

  const handlePartnerClick = async (partner: any) => {
    // Registrar evento de clique
    if (session) {
      await supabase.from('patient_events').insert({
        patient_id: session.patientId,
        professional_id: session.professionalId,
        event_name: 'patient_partner_click',
        event_data: { 
          partner_id: partner.id, 
          partner_name: partner.name,
          coupon: partner.coupon_code
        }
      });
    }

    // Abrir link em nova aba
    window.open(partner.website_url, '_blank', 'noopener,noreferrer');
  };

  return (
    <PatientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Parceiros e Suplementos</h1>
          <p className="text-muted-foreground mt-1">
            Descontos exclusivos para pacientes REGENAPP
          </p>
        </div>

        {/* Coupon Banner */}
        <Card className="border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="py-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Percent className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">Desconto exclusivo</p>
                  <p className="text-sm text-muted-foreground">Use o cupom em suas compras</p>
                </div>
              </div>
              <Badge className="text-lg px-4 py-2 bg-primary text-primary-foreground">
                REGENAPP
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Alert className="border-blue-500/50 bg-blue-500/10">
          <Info className="h-4 w-4 text-blue-500" />
          <AlertDescription className="text-blue-700 dark:text-blue-400">
            Alguns links podem gerar comissão ao REGENAPP, sem custo adicional ao paciente.
          </AlertDescription>
        </Alert>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="text-muted-foreground">Carregando parceiros...</div>
          </div>
        ) : partners && partners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {partners.map((partner) => (
              <Card key={partner.id} className="border-border/50 hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {partner.logo_url ? (
                        <img 
                          src={partner.logo_url} 
                          alt={partner.name}
                          className="w-12 h-12 rounded-lg object-contain bg-white"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-primary" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-base">{partner.name}</CardTitle>
                        <Badge variant="outline" className="mt-1">
                          {partner.product_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {partner.description && (
                    <CardDescription className="mb-4">
                      {partner.description}
                    </CardDescription>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-primary font-medium">
                      Desconto exclusivo para pacientes
                    </p>
                    <Button 
                      size="sm"
                      onClick={() => handlePartnerClick(partner)}
                    >
                      Acessar site
                      <ExternalLink className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-border/50">
            <CardContent className="py-12 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-1">
                Nenhum parceiro disponível
              </h3>
              <p className="text-muted-foreground">
                Em breve teremos parceiros com descontos exclusivos.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </PatientLayout>
  );
}
