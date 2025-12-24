import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Mail } from "lucide-react";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const VisualizarRelatorio = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");

  const { data: patientReport, isLoading } = useQuery({
    queryKey: ["patient-report-full", id],
    enabled: !!id,
    queryFn: async () => {
      const { data: patient, error: patientError } = await supabase
        .from("patients")
        .select("*")
        .eq("id", id)
        .single();

      if (patientError) throw patientError;

      const { data: clinicalRecord } = await supabase
        .from("clinical_records")
        .select("*")
        .eq("patient_id", id)
        .maybeSingle();

      const { data: protocols } = await supabase
        .from("mac_protocols")
        .select("*")
        .eq("patient_id", id);

      const { data: sessions } = await supabase
        .from("treatment_sessions")
        .select("*")
        .eq("patient_id", id)
        .order("session_number", { ascending: true });

      const { data: ultrasoundImages } = await supabase
        .from("ultrasound_images")
        .select("*")
        .eq("patient_id", id);

      const { data: thermographyImages } = await supabase
        .from("thermography_images")
        .select("*")
        .eq("patient_id", id);

      const { data: bloodTests } = await supabase
        .from("blood_tests")
        .select("*")
        .eq("patient_id", id);

      return {
        patient,
        clinicalRecord,
        protocols: protocols || [],
        sessions: sessions || [],
        ultrasoundImages: ultrasoundImages || [],
        thermographyImages: thermographyImages || [],
        bloodTests: bloodTests || [],
      };
    },
  });

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    if (!recipientEmail) {
      toast.error("Digite um email válido");
      return;
    }

    toast.info("Funcionalidade de envio de email será implementada em breve");
    setIsEmailDialogOpen(false);
    setRecipientEmail("");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando relatório...</p>
      </div>
    );
  }

  if (!patientReport) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Relatório não encontrado</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-background">
        {/* Action Bar - Hidden when printing */}
        <div className="print:hidden sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/pacientes/${id}`)}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao Paciente
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEmailDialogOpen(true)}
              className="gap-2"
            >
              <Mail className="h-4 w-4" />
              Enviar por Email
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="gap-2 bg-primary hover:bg-primary/90"
            >
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </div>
        </div>

        {/* Report Content */}
        <div className="max-w-4xl mx-auto p-8 print:p-0">
          {/* Header */}
          <div className="text-center mb-8 print:mb-6">
            <h1 className="text-3xl font-bold text-foreground mb-2 print:text-2xl">
              Relatório de Tratamento MAC
            </h1>
            <p className="text-muted-foreground print:text-sm">
              Método de Aceleração Cicatricial
            </p>
          </div>

          <Separator className="mb-6" />

          {/* Dados do Paciente */}
          <section className="mb-8 print:mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 print:text-lg">
              Dados do Paciente
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 print:gap-3 print:text-sm">
              <div>
                <span className="text-muted-foreground font-medium">Nome:</span>
                <p className="mt-1">{patientReport.patient.full_name}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Idade:</span>
                <p className="mt-1">{patientReport.patient.age} anos</p>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Gênero:</span>
                <p className="mt-1">{patientReport.patient.gender || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Telefone:</span>
                <p className="mt-1">{patientReport.patient.phone || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Email:</span>
                <p className="mt-1">{patientReport.patient.email || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Fototipo:</span>
                <p className="mt-1">{patientReport.patient.skin_phototype || "—"}</p>
              </div>
            </div>
          </section>

          <Separator className="mb-6" />

          {/* Avaliação Clínica Inicial */}
          <section className="mb-8 print:mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 print:text-lg">
              Avaliação Clínica Inicial
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:gap-3 print:text-sm mb-4">
              <div>
                <span className="text-muted-foreground font-medium">Região Tratada:</span>
                <p className="mt-1">{patientReport.patient.treated_region || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">EVA Inicial:</span>
                <p className="mt-1">{patientReport.patient.initial_vas || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Função Inicial:</span>
                <p className="mt-1">{patientReport.patient.initial_function || "—"}</p>
              </div>
              <div>
                <span className="text-muted-foreground font-medium">Mobilidade Inicial:</span>
                <p className="mt-1">{patientReport.patient.initial_mobility || "—"}</p>
              </div>
            </div>
            {patientReport.patient.clinical_diagnosis && (
              <div className="mb-3 print:text-sm">
                <span className="text-muted-foreground font-medium">Diagnóstico Clínico:</span>
                <p className="mt-1">{patientReport.patient.clinical_diagnosis}</p>
              </div>
            )}
            {patientReport.clinicalRecord?.anamnesis && (
              <div className="print:text-sm">
                <span className="text-muted-foreground font-medium">Anamnese:</span>
                <p className="mt-1">{patientReport.clinicalRecord.anamnesis}</p>
              </div>
            )}
          </section>

          {/* Protocolos MAC */}
          {patientReport.protocols.length > 0 && (
            <>
              <Separator className="mb-6" />
              <section className="mb-8 print:mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-4 print:text-lg">
                  Protocolos MAC Utilizados ({patientReport.protocols.length})
                </h2>
                <div className="space-y-4 print:space-y-3">
                  {patientReport.protocols.map((protocol, idx) => (
                    <div key={protocol.id} className="border border-border rounded-lg p-4 print:p-3">
                      <h3 className="font-semibold mb-3 print:text-sm">Protocolo {idx + 1}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:gap-2 print:text-xs">
                        <div>
                          <span className="text-muted-foreground">Tipo de Luz:</span>
                          <p>{protocol.light_type}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Comprimento de Onda:</span>
                          <p>{protocol.wavelength} nm</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Potência:</span>
                          <p>{protocol.power} W</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tempo:</span>
                          <p>{protocol.application_time} min</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Energia Total:</span>
                          <p>{protocol.total_energy} J</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Fluência:</span>
                          <p>{protocol.fluence} J/cm²</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Técnica:</span>
                          <p>{protocol.technique}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tecido Alvo:</span>
                          <p>{protocol.target_tissue}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Evolução por Sessão */}
          {patientReport.sessions.length > 0 && (
            <>
              <Separator className="mb-6 print:break-before-page" />
              <section className="mb-8 print:mb-6">
                <h2 className="text-xl font-semibold text-foreground mb-4 print:text-lg">
                  Evolução por Sessão ({patientReport.sessions.length} sessões)
                </h2>
                <div className="space-y-4 print:space-y-3">
                  {patientReport.sessions.map((session) => (
                    <div key={session.id} className="border border-border rounded-lg p-4 print:p-3">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold print:text-sm">Sessão #{session.session_number}</h3>
                        <span className="text-sm text-muted-foreground print:text-xs">
                          {new Date(session.session_date).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:gap-2 print:text-xs">
                        {session.vas_on_day !== null && (
                          <div>
                            <span className="text-muted-foreground">EVA no Dia:</span>
                            <p>{session.vas_on_day}</p>
                          </div>
                        )}
                        {session.function_score !== null && (
                          <div>
                            <span className="text-muted-foreground">Função:</span>
                            <p>{session.function_score}</p>
                          </div>
                        )}
                        {session.mobility_score !== null && (
                          <div>
                            <span className="text-muted-foreground">Mobilidade:</span>
                            <p>{session.mobility_score}</p>
                          </div>
                        )}
                        {session.light_type && (
                          <div>
                            <span className="text-muted-foreground">Luz Utilizada:</span>
                            <p>{session.light_type}</p>
                          </div>
                        )}
                        {session.treatment_time !== null && (
                          <div>
                            <span className="text-muted-foreground">Tempo de Tratamento:</span>
                            <p>{session.treatment_time}s</p>
                          </div>
                        )}
                      </div>
                      {session.clinical_observations && (
                        <div className="mt-3 print:text-xs">
                          <span className="text-muted-foreground font-medium">Observações:</span>
                          <p className="mt-1">{session.clinical_observations}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* Resultados Finais */}
          <Separator className="mb-6" />
          <section className="mb-8 print:mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 print:text-lg">
              Resultados Finais
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:gap-3 print:text-sm mb-4">
              {patientReport.patient.final_vas !== null && (
                <div>
                  <span className="text-muted-foreground font-medium">EVA Final:</span>
                  <p className="mt-1 text-lg font-semibold print:text-base">
                    {patientReport.patient.final_vas}
                  </p>
                </div>
              )}
              {patientReport.patient.final_function !== null && (
                <div>
                  <span className="text-muted-foreground font-medium">Função Final:</span>
                  <p className="mt-1 text-lg font-semibold print:text-base">
                    {patientReport.patient.final_function}
                  </p>
                </div>
              )}
              {patientReport.patient.final_mobility !== null && (
                <div>
                  <span className="text-muted-foreground font-medium">Mobilidade Final:</span>
                  <p className="mt-1 text-lg font-semibold print:text-base">
                    {patientReport.patient.final_mobility}
                  </p>
                </div>
              )}
              {patientReport.patient.total_sessions !== null && (
                <div>
                  <span className="text-muted-foreground font-medium">Total de Sessões:</span>
                  <p className="mt-1 text-lg font-semibold print:text-base">
                    {patientReport.patient.total_sessions}
                  </p>
                </div>
              )}
            </div>
            {patientReport.patient.final_outcome && (
              <div className="print:text-sm">
                <span className="text-muted-foreground font-medium">Desfecho Final:</span>
                <p className="mt-1">{patientReport.patient.final_outcome}</p>
              </div>
            )}
          </section>

          {/* Exames e Documentação */}
          <Separator className="mb-6" />
          <section className="mb-8 print:mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 print:text-lg">
              Exames e Documentação
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print:gap-3 print:text-sm">
              <div className="border border-border rounded-lg p-4 print:p-3">
                <span className="text-muted-foreground font-medium">Ultrassom:</span>
                <p className="mt-1 text-lg font-semibold print:text-base">
                  {patientReport.ultrasoundImages.length} imagens
                </p>
              </div>
              <div className="border border-border rounded-lg p-4 print:p-3">
                <span className="text-muted-foreground font-medium">Termografia:</span>
                <p className="mt-1 text-lg font-semibold print:text-base">
                  {patientReport.thermographyImages.length} imagens
                </p>
              </div>
              <div className="border border-border rounded-lg p-4 print:p-3">
                <span className="text-muted-foreground font-medium">Exames de Sangue:</span>
                <p className="mt-1 text-lg font-semibold print:text-base">
                  {patientReport.bloodTests.length} exames
                </p>
              </div>
            </div>
          </section>

          {/* Footer for Print */}
          <div className="hidden print:block mt-12 pt-6 border-t border-border text-center text-xs text-muted-foreground">
            <p>Relatório gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}</p>
            <p className="mt-1">Sistema Fisioterapia Regenerativa</p>
          </div>
        </div>
      </div>

      {/* Email Dialog */}
      <Dialog open={isEmailDialogOpen} onOpenChange={setIsEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Relatório por Email</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email do Destinatário</Label>
              <Input
                id="email"
                type="email"
                placeholder="exemplo@email.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEmailDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSendEmail}>
              Enviar Email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default VisualizarRelatorio;
