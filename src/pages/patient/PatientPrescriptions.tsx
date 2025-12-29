import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePatientAuth } from '@/contexts/PatientAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PatientLayout } from '@/components/patient/PatientLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pill, Heart, Sparkles, Calendar, FileDown } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import logoRegenapp from '@/assets/logo-regenapp.png';
import { toast } from 'sonner';

const prescriptionTypes = {
  cuidados_gerais: { label: 'Cuidados Gerais', icon: Heart },
  medicacoes: { label: 'Medicações', icon: Pill },
  suplementacoes: { label: 'Suplementações', icon: Sparkles },
  // Legacy types
  alimentar: { label: 'Cuidados Gerais', icon: Heart },
  medicamentosa: { label: 'Medicações', icon: Pill },
  suplementar: { label: 'Suplementações', icon: Sparkles }
};

export default function PatientPrescriptions() {
  const { session } = usePatientAuth();
  const [selectedPrescription, setSelectedPrescription] = useState<any>(null);

  const { data: prescriptions, isLoading } = useQuery({
    queryKey: ['patient-prescriptions', session?.patientId],
    queryFn: async () => {
      if (!session?.patientId) return [];

      const { data, error } = await supabase
        .from('patient_prescriptions')
        .select('*')
        .eq('patient_id', session.patientId)
        .eq('is_visible_to_patient', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Registrar evento
      await supabase.from('patient_events').insert({
        patient_id: session.patientId,
        professional_id: session.professionalId,
        event_name: 'patient_view_prescriptions',
        event_data: { count: data?.length || 0 }
      });

      return data || [];
    },
    enabled: !!session?.patientId
  });

  const getPrescriptionsByType = (type: string) => {
    // Handle both new and legacy types
    if (type === 'cuidados_gerais') {
      return prescriptions?.filter(p => p.prescription_type === 'cuidados_gerais' || p.prescription_type === 'alimentar') || [];
    }
    if (type === 'medicacoes') {
      return prescriptions?.filter(p => p.prescription_type === 'medicacoes' || p.prescription_type === 'medicamentosa') || [];
    }
    if (type === 'suplementacoes') {
      return prescriptions?.filter(p => p.prescription_type === 'suplementacoes' || p.prescription_type === 'suplementar') || [];
    }
    return prescriptions?.filter(p => p.prescription_type === type) || [];
  };

  const handleExportPDF = (prescription: any) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Não foi possível abrir a janela de impressão");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prescrição - ${session?.patientName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          @page { 
            margin: 15mm; 
            size: A4;
          }
          
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          
          body { 
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
            line-height: 1.6; 
            color: #051F41;
            background: #FFFFFF;
            padding: 0;
            margin: 0;
            min-height: 100vh;
          }
          
          .document-container {
            width: 100%;
            min-height: 100vh;
            padding: 40px;
            display: flex;
            flex-direction: column;
          }
          
          .header {
            text-align: center;
            padding-bottom: 24px;
            margin-bottom: 24px;
            border-bottom: 1px solid #797E88;
          }
          
          .header img {
            height: 60px;
            margin-bottom: 8px;
          }
          
          .header-app-name {
            font-size: 14px;
            color: #797E88;
            font-weight: 500;
            letter-spacing: 2px;
            text-transform: uppercase;
          }
          
          .identification-block {
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 12px;
            padding: 20px 24px;
            margin-bottom: 24px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          
          .field-group label {
            display: block;
            font-size: 11px;
            font-weight: 600;
            color: #051F41;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
          }
          
          .field-group span {
            display: block;
            font-size: 16px;
            color: #797E88;
            font-weight: 500;
          }
          
          .section-title {
            font-size: 13px;
            font-weight: 600;
            color: #051F41;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 12px;
          }
          
          .prescription-block {
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 12px;
            padding: 24px;
            margin-bottom: 24px;
            flex: 1;
            min-height: 200px;
          }
          
          .prescription-content {
            white-space: pre-wrap;
            font-size: 14px;
            line-height: 1.8;
            color: #051F41;
          }
          
          .observations-block {
            background: #FFFFFF;
            border: 1px solid #E5E7EB;
            border-radius: 12px;
            padding: 20px 24px;
            margin-bottom: 24px;
          }
          
          .observations-content {
            font-size: 13px;
            line-height: 1.7;
            color: #797E88;
            font-style: italic;
          }
          
          .disclaimer {
            margin-top: auto;
            padding-top: 24px;
            border-top: 1px solid #E5E7EB;
            text-align: center;
          }
          
          .disclaimer p {
            font-size: 10px;
            color: #797E88;
            line-height: 1.6;
            max-width: 500px;
            margin: 0 auto;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .document-container {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="document-container">
          <div class="header">
            <img src="${logoRegenapp}" alt="REGENAPP Logo" />
            <div class="header-app-name">REGENAPP</div>
          </div>
          
          <div class="identification-block">
            <div class="field-group">
              <label>Nome</label>
              <span>${session?.patientName || 'Paciente'}</span>
            </div>
            <div class="field-group">
              <label>Data</label>
              <span>${format(new Date(prescription.created_at), "dd/MM/yyyy", { locale: ptBR })}</span>
            </div>
          </div>
          
          <div class="section-title">Prescrição</div>
          <div class="prescription-block">
            <div class="prescription-content">${prescription.content}</div>
          </div>
          
          ${prescription.notes ? `
          <div class="section-title">Observações</div>
          <div class="observations-block">
            <div class="observations-content">${prescription.notes}</div>
          </div>
          ` : ""}
          
          <div class="disclaimer">
            <p>
              Este documento foi gerado pelo REGENAPP como apoio à prática clínica.
              Siga exclusivamente as orientações do seu profissional de saúde.
              O REGENAPP não substitui a consulta ou o julgamento profissional.
            </p>
          </div>
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const renderPrescriptionDocument = (prescription: any) => {
    const typeInfo = prescriptionTypes[prescription.prescription_type as keyof typeof prescriptionTypes];

    return (
      <Card key={prescription.id} className="overflow-hidden border" style={{ borderColor: '#E5E7EB' }}>
        {/* Document Header */}
        <div className="text-center py-4 border-b" style={{ borderColor: '#797E88' }}>
          <img src={logoRegenapp} alt="REGENAPP Logo" className="h-10 mx-auto mb-1" />
          <p className="text-[10px] tracking-widest uppercase" style={{ color: '#797E88' }}>
            REGENAPP
          </p>
        </div>

        <CardContent className="p-5 space-y-4">
          {/* Identification Block */}
          <div 
            className="grid grid-cols-2 gap-3 p-4 rounded-xl border"
            style={{ borderColor: '#E5E7EB' }}
          >
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#051F41' }}>
                Nome
              </label>
              <span className="text-sm font-medium" style={{ color: '#797E88' }}>
                {session?.patientName || 'Paciente'}
              </span>
            </div>
            <div>
              <label className="block text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#051F41' }}>
                Data
              </label>
              <span className="text-sm font-medium flex items-center gap-1" style={{ color: '#797E88' }}>
                <Calendar className="h-3 w-3" />
                {format(new Date(prescription.created_at), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
          </div>

          {/* Prescription Block */}
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#051F41' }}>
              Prescrição
            </h3>
            <div 
              className="p-4 rounded-xl border min-h-[100px]"
              style={{ borderColor: '#E5E7EB' }}
            >
              <p className="whitespace-pre-wrap text-sm leading-relaxed" style={{ color: '#051F41' }}>
                {prescription.content}
              </p>
            </div>
          </div>

          {/* Observations Block */}
          {prescription.notes && (
            <div>
              <h3 className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: '#051F41' }}>
                Observações
              </h3>
              <div 
                className="p-4 rounded-xl border"
                style={{ borderColor: '#E5E7EB' }}
              >
                <p className="text-sm italic leading-relaxed" style={{ color: '#797E88' }}>
                  {prescription.notes}
                </p>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="pt-3 border-t text-center" style={{ borderColor: '#E5E7EB' }}>
            <p className="text-[9px] leading-relaxed max-w-sm mx-auto" style={{ color: '#797E88' }}>
              Este documento foi gerado pelo REGENAPP como apoio à prática clínica.
              Siga exclusivamente as orientações do seu profissional de saúde.
              O REGENAPP não substitui a consulta ou o julgamento profissional.
            </p>
          </div>

          {/* Export Button */}
          <Button 
            onClick={() => handleExportPDF(prescription)}
            variant="outline" 
            className="w-full gap-2"
            style={{ borderColor: '#051F41', color: '#051F41' }}
          >
            <FileDown className="w-4 h-4" />
            Exportar PDF
          </Button>
        </CardContent>
      </Card>
    );
  };

  const EmptyState = () => (
    <Card className="border-border/50">
      <CardContent className="py-12 text-center">
        <Pill className="h-12 w-12 mx-auto mb-4" style={{ color: '#797E88' }} />
        <h3 className="text-lg font-medium mb-1" style={{ color: '#051F41' }}>
          Nenhuma prescrição disponível
        </h3>
        <p style={{ color: '#797E88' }}>
          Quando seu profissional criar prescrições, elas aparecerão aqui.
        </p>
      </CardContent>
    </Card>
  );

  return (
    <PatientLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: '#051F41' }}>Minhas Prescrições</h1>
          <p className="mt-1" style={{ color: '#797E88' }}>
            Orientações e prescrições definidas pelo seu profissional
          </p>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div style={{ color: '#797E88' }}>Carregando prescrições...</div>
          </div>
        ) : prescriptions && prescriptions.length > 0 ? (
          <Tabs defaultValue="todas" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="todas">Todas</TabsTrigger>
              <TabsTrigger value="cuidados_gerais">Cuidados Gerais</TabsTrigger>
              <TabsTrigger value="medicacoes">Medicações</TabsTrigger>
              <TabsTrigger value="suplementacoes">Suplementações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="todas" className="space-y-4 mt-4">
              {prescriptions.map(renderPrescriptionDocument)}
            </TabsContent>
            
            <TabsContent value="cuidados_gerais" className="space-y-4 mt-4">
              {getPrescriptionsByType('cuidados_gerais').length > 0 
                ? getPrescriptionsByType('cuidados_gerais').map(renderPrescriptionDocument)
                : <EmptyState />}
            </TabsContent>
            
            <TabsContent value="medicacoes" className="space-y-4 mt-4">
              {getPrescriptionsByType('medicacoes').length > 0 
                ? getPrescriptionsByType('medicacoes').map(renderPrescriptionDocument)
                : <EmptyState />}
            </TabsContent>
            
            <TabsContent value="suplementacoes" className="space-y-4 mt-4">
              {getPrescriptionsByType('suplementacoes').length > 0 
                ? getPrescriptionsByType('suplementacoes').map(renderPrescriptionDocument)
                : <EmptyState />}
            </TabsContent>
          </Tabs>
        ) : (
          <EmptyState />
        )}
      </div>
    </PatientLayout>
  );
}
