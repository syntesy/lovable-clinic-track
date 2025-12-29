import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usePatientAuth } from '@/contexts/PatientAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { PatientLayout } from '@/components/patient/PatientLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Pill, Heart, Sparkles, FileDown } from 'lucide-react';
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

    const formattedDate = format(new Date(prescription.created_at), "dd / MM / yyyy", { locale: ptBR });

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prescrição - ${session?.patientName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
          
          @page { 
            margin: 20mm; 
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
          }
          
          .document {
            width: 100%;
            min-height: 100vh;
            padding: 50px 60px;
            display: flex;
            flex-direction: column;
          }
          
          .header {
            text-align: center;
            padding-bottom: 30px;
            margin-bottom: 40px;
            border-bottom: 1px solid #797E88;
          }
          
          .header img {
            height: 80px;
            margin-bottom: 12px;
          }
          
          .header-app-name {
            font-size: 16px;
            color: #051F41;
            font-weight: 600;
            letter-spacing: 4px;
            text-transform: uppercase;
          }
          
          .identification {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-bottom: 50px;
            gap: 40px;
          }
          
          .field {
            display: flex;
            align-items: baseline;
            gap: 8px;
          }
          
          .field-label {
            font-size: 14px;
            font-weight: 600;
            color: #051F41;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
          }
          
          .field-value {
            font-size: 16px;
            color: #797E88;
            padding-bottom: 2px;
            border-bottom: 1px solid #797E88;
            min-width: 200px;
          }
          
          .field-value.name {
            flex: 1;
            min-width: 300px;
          }
          
          .section {
            margin-bottom: 40px;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: 700;
            color: #051F41;
            text-transform: uppercase;
            letter-spacing: 2px;
            margin-bottom: 20px;
          }
          
          .section-content {
            font-size: 15px;
            line-height: 2;
            color: #051F41;
            white-space: pre-wrap;
          }
          
          .observations-content {
            font-size: 14px;
            line-height: 1.8;
            color: #797E88;
          }
          
          .footer {
            margin-top: auto;
            padding-top: 40px;
            border-top: 1px solid #797E88;
            text-align: center;
          }
          
          .footer p {
            font-size: 10px;
            color: #797E88;
            line-height: 1.6;
            max-width: 450px;
            margin: 0 auto;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .document {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="document">
          <div class="header">
            <img src="${logoRegenapp}" alt="REGENAPP" />
            <div class="header-app-name">REGENAPP</div>
          </div>
          
          <div class="identification">
            <div class="field" style="flex: 1;">
              <span class="field-label">NOME:</span>
              <span class="field-value name">${session?.patientName || 'Paciente'}</span>
            </div>
            <div class="field">
              <span class="field-label">DATA:</span>
              <span class="field-value">${formattedDate}</span>
            </div>
          </div>
          
          <div class="section">
            <h2 class="section-title">Prescrição</h2>
            <div class="section-content">${prescription.content}</div>
          </div>
          
          ${prescription.notes ? `
          <div class="section">
            <h2 class="section-title">Observações</h2>
            <div class="observations-content">${prescription.notes}</div>
          </div>
          ` : ""}
          
          <div class="footer">
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
    const formattedDate = format(new Date(prescription.created_at), "dd / MM / yyyy", { locale: ptBR });

    return (
      <div key={prescription.id} className="mb-8">
        {/* Paper Document */}
        <div 
          className="bg-white mx-auto"
          style={{ 
            maxWidth: '680px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            padding: '40px 48px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: '500px',
          }}
        >
          {/* Header */}
          <div className="text-center pb-5 mb-6" style={{ borderBottom: '1px solid #797E88' }}>
            <img src={logoRegenapp} alt="REGENAPP" className="h-14 mx-auto mb-2" />
            <p 
              className="text-xs font-semibold tracking-[4px] uppercase"
              style={{ color: '#051F41' }}
            >
              REGENAPP
            </p>
          </div>

          {/* Identification - Paper Style */}
          <div className="flex flex-wrap justify-between items-end mb-8 gap-4">
            <div className="flex items-baseline gap-2 flex-1 min-w-[200px]">
              <span 
                className="text-xs font-semibold uppercase whitespace-nowrap"
                style={{ color: '#051F41' }}
              >
                NOME:
              </span>
              <span 
                className="text-sm pb-0.5 flex-1"
                style={{ 
                  color: '#797E88',
                  borderBottom: '1px solid #797E88',
                }}
              >
                {session?.patientName || 'Paciente'}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span 
                className="text-xs font-semibold uppercase whitespace-nowrap"
                style={{ color: '#051F41' }}
              >
                DATA:
              </span>
              <span 
                className="text-sm pb-0.5"
                style={{ 
                  color: '#797E88',
                  borderBottom: '1px solid #797E88',
                  minWidth: '100px'
                }}
              >
                {formattedDate}
              </span>
            </div>
          </div>

          {/* Prescription Section */}
          <div className="mb-6 flex-1">
            <h2 
              className="text-xs font-bold uppercase tracking-[2px] mb-3"
              style={{ color: '#051F41' }}
            >
              Prescrição
            </h2>
            <p 
              className="text-sm leading-7 whitespace-pre-wrap"
              style={{ color: '#051F41' }}
            >
              {prescription.content}
            </p>
          </div>

          {/* Observations Section */}
          {prescription.notes && (
            <div className="mb-6">
              <h2 
                className="text-xs font-bold uppercase tracking-[2px] mb-3"
                style={{ color: '#051F41' }}
              >
                Observações
              </h2>
              <p 
                className="text-sm leading-6"
                style={{ color: '#797E88' }}
              >
                {prescription.notes}
              </p>
            </div>
          )}

          {/* Footer Disclaimer */}
          <div 
            className="mt-auto pt-5 text-center"
            style={{ borderTop: '1px solid #797E88' }}
          >
            <p 
              className="text-[9px] leading-4 max-w-sm mx-auto"
              style={{ color: '#797E88' }}
            >
              Este documento foi gerado pelo REGENAPP como apoio à prática clínica.
              Siga exclusivamente as orientações do seu profissional de saúde.
              O REGENAPP não substitui a consulta ou o julgamento profissional.
            </p>
          </div>
        </div>

        {/* Export Button - Outside the document */}
        <div className="flex justify-center mt-4">
          <Button 
            onClick={() => handleExportPDF(prescription)}
            variant="outline" 
            className="gap-2"
            style={{ borderColor: '#051F41', color: '#051F41' }}
          >
            <FileDown className="w-4 h-4" />
            Exportar PDF
          </Button>
        </div>
      </div>
    );
  };

  const EmptyState = () => (
    <div className="bg-white rounded-lg border border-border/50 py-12 text-center">
      <Pill className="h-12 w-12 mx-auto mb-4" style={{ color: '#797E88' }} />
      <h3 className="text-lg font-medium mb-1" style={{ color: '#051F41' }}>
        Nenhuma prescrição disponível
      </h3>
      <p style={{ color: '#797E88' }}>
        Quando seu profissional criar prescrições, elas aparecerão aqui.
      </p>
    </div>
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
            
            <TabsContent value="todas" className="space-y-4 mt-6">
              {prescriptions.map(renderPrescriptionDocument)}
            </TabsContent>
            
            <TabsContent value="cuidados_gerais" className="space-y-4 mt-6">
              {getPrescriptionsByType('cuidados_gerais').length > 0 
                ? getPrescriptionsByType('cuidados_gerais').map(renderPrescriptionDocument)
                : <EmptyState />}
            </TabsContent>
            
            <TabsContent value="medicacoes" className="space-y-4 mt-6">
              {getPrescriptionsByType('medicacoes').length > 0 
                ? getPrescriptionsByType('medicacoes').map(renderPrescriptionDocument)
                : <EmptyState />}
            </TabsContent>
            
            <TabsContent value="suplementacoes" className="space-y-4 mt-6">
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
