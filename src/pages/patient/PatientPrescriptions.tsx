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
import logoReghen from '@/assets/logo-reghen.png';
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

    const formattedDate = format(new Date(prescription.created_at), "dd/MM/yyyy", { locale: ptBR });
    const displayPatientName = session?.patientName || "—";
    const displayDate = formattedDate || "—";
    const displayProfessionalName = "Nome do Profissional";
    const displayProfessionalSpecialty = "Especialidade";

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Prescrição - ${displayPatientName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap');
          
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
            line-height: 1.5; 
            color: #051F41;
            background: #FFFFFF;
            padding: 0;
            margin: 0;
          }
          
          .paper {
            width: 100%;
            min-height: 100vh;
            padding: 48px;
            display: flex;
            flex-direction: column;
            background: #FFFFFF;
          }
          
          /* LOGO */
          .logo-section {
            text-align: center;
            padding-bottom: 18px;
            margin-bottom: 28px;
            border-bottom: 1px solid #D6D9DE;
          }
          
          .logo-section img {
            height: 56px;
          }
          
          /* CAIXA IDENTIFICAÇÃO */
          .identification-box {
            background: #F2F3F5;
            border: 1px solid #D6D9DE;
            border-radius: 24px;
            padding: 22px;
            display: flex;
            justify-content: space-between;
            margin-bottom: 24px;
          }
          
          .id-column {
            display: flex;
            flex-direction: column;
            gap: 4px;
          }
          
          .id-label {
            font-size: 13px;
            font-weight: 600;
            color: #051F41;
          }
          
          .id-value {
            font-size: 13px;
            font-weight: 400;
            color: #797E88;
          }
          
          /* SEÇÕES */
          .section-title {
            font-size: 13px;
            font-weight: 600;
            color: #051F41;
            margin-bottom: 12px;
          }
          
          .content-box {
            background: #F2F3F5;
            border: 1px solid #D6D9DE;
            border-radius: 24px;
            padding: 22px;
            margin-bottom: 24px;
          }
          
          .prescription-box {
            min-height: 260px;
          }
          
          .observations-box {
            min-height: 120px;
          }
          
          .content-text {
            font-size: 13px;
            font-weight: 400;
            color: #797E88;
            white-space: pre-wrap;
            line-height: 1.6;
          }
          
          /* PROFISSIONAL */
          .professional-section {
            margin-top: 26px;
          }
          
          .professional-name {
            font-size: 13px;
            font-weight: 400;
            color: #051F41;
          }
          
          .professional-specialty {
            font-size: 13px;
            font-weight: 400;
            color: #797E88;
            margin-top: 2px;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .paper {
              padding: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="paper">
          <!-- LOGO -->
          <div class="logo-section">
            <img src="${logoReghen}" alt="reghen" />
          </div>
          
          <!-- IDENTIFICAÇÃO -->
          <div class="identification-box">
            <div class="id-column">
              <span class="id-label">NOME:</span>
              <span class="id-value">${displayPatientName}</span>
            </div>
            <div class="id-column" style="text-align: right;">
              <span class="id-label">DATA:</span>
              <span class="id-value">${displayDate}</span>
            </div>
          </div>
          
          <!-- PRESCRIÇÃO -->
          <div class="section-title">PRESCRIÇÃO</div>
          <div class="content-box prescription-box">
            <div class="content-text">${prescription.content || ""}</div>
          </div>
          
          <!-- OBSERVAÇÕES -->
          <div class="section-title">OBSERVAÇÕES</div>
          <div class="content-box observations-box">
            <div class="content-text">${prescription.notes || ""}</div>
          </div>
          
          <!-- PROFISSIONAL -->
          <div class="professional-section">
            <div class="professional-name">${displayProfessionalName}</div>
            <div class="professional-specialty">${displayProfessionalSpecialty}</div>
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
    const formattedDate = format(new Date(prescription.created_at), "dd/MM/yyyy", { locale: ptBR });
    const displayPatientName = session?.patientName || "—";
    const displayDate = formattedDate || "—";
    const displayProfessionalName = "Nome do Profissional";
    const displayProfessionalSpecialty = "Especialidade";

    return (
      <div key={prescription.id} className="mb-8">
        {/* Paper Document */}
        <div 
          className="bg-white mx-auto"
          style={{ 
            maxWidth: '680px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            borderRadius: '20px',
            padding: '48px',
            paddingLeft: '28px',
            paddingRight: '28px',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* LOGO */}
          <div 
            className="text-center pb-[18px] mb-[28px]"
            style={{ borderBottom: '1px solid #D6D9DE' }}
          >
            <img src={logoReghen} alt="reghen" className="h-14 mx-auto" />
          </div>

          {/* CAIXA IDENTIFICAÇÃO */}
          <div 
            className="flex justify-between mb-6"
            style={{ 
              background: '#F2F3F5',
              border: '1px solid #D6D9DE',
              borderRadius: '24px',
              padding: '22px',
            }}
          >
            <div className="flex flex-col gap-1">
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#051F41' }}>
                NOME:
              </span>
              <span style={{ fontSize: '13px', fontWeight: 400, color: '#797E88' }}>
                {displayPatientName}
              </span>
            </div>
            <div className="flex flex-col gap-1 text-right">
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#051F41' }}>
                DATA:
              </span>
              <span style={{ fontSize: '13px', fontWeight: 400, color: '#797E88' }}>
                {displayDate}
              </span>
            </div>
          </div>

          {/* PRESCRIÇÃO */}
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#051F41', marginBottom: '12px' }}>
            PRESCRIÇÃO
          </div>
          <div 
            style={{ 
              background: '#F2F3F5',
              border: '1px solid #D6D9DE',
              borderRadius: '24px',
              padding: '22px',
              minHeight: '220px',
              marginBottom: '24px',
            }}
          >
            <p style={{ fontSize: '13px', fontWeight: 400, color: '#797E88', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {prescription.content || ""}
            </p>
          </div>

          {/* OBSERVAÇÕES */}
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#051F41', marginBottom: '12px' }}>
            OBSERVAÇÕES
          </div>
          <div 
            style={{ 
              background: '#F2F3F5',
              border: '1px solid #D6D9DE',
              borderRadius: '24px',
              padding: '22px',
              minHeight: '110px',
              marginBottom: '26px',
            }}
          >
            <p style={{ fontSize: '13px', fontWeight: 400, color: '#797E88', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {prescription.notes || ""}
            </p>
          </div>

          {/* PROFISSIONAL - SEM CAIXA, SEM CONTORNO */}
          <div>
            <p style={{ fontSize: '13px', fontWeight: 400, color: '#051F41' }}>
              {displayProfessionalName}
            </p>
            <p style={{ fontSize: '13px', fontWeight: 400, color: '#797E88', marginTop: '2px' }}>
              {displayProfessionalSpecialty}
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
