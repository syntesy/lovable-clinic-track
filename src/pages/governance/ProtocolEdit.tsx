import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useProtocol, useUpdateProtocol } from "@/hooks/useProtocols";
import { toast } from "sonner";

export default function ProtocolEdit() {
  const { protocolId } = useParams<{ protocolId: string }>();
  const navigate = useNavigate();
  const { data: protocol, isLoading } = useProtocol(protocolId);
  const updateMutation = useUpdateProtocol();

  const [title, setTitle] = useState("");
  const [area, setArea] = useState("");
  const [indicationSummary, setIndicationSummary] = useState("");
  const [evidenceLevel, setEvidenceLevel] = useState("");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [evidenceRefs, setEvidenceRefs] = useState("");
  const [inclusionCriteria, setInclusionCriteria] = useState("");
  const [exclusionCriteria, setExclusionCriteria] = useState("");
  const [requiredExams, setRequiredExams] = useState("");
  const [techniqueSummary, setTechniqueSummary] = useState("");
  const [checklistTemplate, setChecklistTemplate] = useState("");
  const [changeSummary, setChangeSummary] = useState("");

  useEffect(() => {
    if (protocol) {
      if (protocol.protocol_type === "REGEN_BASE") {
        toast.error("Protocolos base REGHEN não podem ser editados.");
        navigate(`/governanca/protocolos/${protocolId}`);
        return;
      }
      setTitle(protocol.title || "");
      setArea(protocol.area || "");
      setIndicationSummary(protocol.indication_summary || "");
      setEvidenceLevel(protocol.evidence_level || "");
      setEvidenceNotes(protocol.evidence_notes || "");
      setEvidenceRefs(protocol.evidence_refs ? JSON.stringify(protocol.evidence_refs, null, 2) : "");
      setInclusionCriteria(protocol.inclusion_criteria ? JSON.stringify(protocol.inclusion_criteria, null, 2) : "");
      setExclusionCriteria(protocol.exclusion_criteria ? JSON.stringify(protocol.exclusion_criteria, null, 2) : "");
      setRequiredExams(protocol.required_exams ? JSON.stringify(protocol.required_exams, null, 2) : "");
      setTechniqueSummary(protocol.technique_summary || "");
      setChecklistTemplate(protocol.checklist_template ? JSON.stringify(protocol.checklist_template, null, 2) : "");
    }
  }, [protocol]);

  const parseJsonSafe = (str: string): any => {
    if (!str.trim()) return null;
    try {
      return JSON.parse(str);
    } catch {
      return str;
    }
  };

  const handleSave = async () => {
    if (!changeSummary.trim()) {
      toast.error("O resumo da mudança é obrigatório.");
      return;
    }
    if (!protocolId) return;

    await updateMutation.mutateAsync({
      protocolId,
      updates: {
        title,
        area: area || null,
        indication_summary: indicationSummary || null,
        evidence_level: evidenceLevel || null,
        evidence_notes: evidenceNotes || null,
        evidence_refs: parseJsonSafe(evidenceRefs),
        inclusion_criteria: parseJsonSafe(inclusionCriteria),
        exclusion_criteria: parseJsonSafe(exclusionCriteria),
        required_exams: parseJsonSafe(requiredExams),
        technique_summary: techniqueSummary || null,
        checklist_template: parseJsonSafe(checklistTemplate),
      } as any,
      changeSummary,
    });

    navigate(`/governanca/protocolos/${protocolId}`);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Editar Protocolo</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados Gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Título *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Área</Label>
            <Input value={area} onChange={(e) => setArea(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Indicação</Label>
            <Textarea value={indicationSummary} onChange={(e) => setIndicationSummary(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nível de Evidência</Label>
              <Input value={evidenceLevel} onChange={(e) => setEvidenceLevel(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Notas de Evidência</Label>
              <Input value={evidenceNotes} onChange={(e) => setEvidenceNotes(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Técnica</Label>
            <Textarea value={techniqueSummary} onChange={(e) => setTechniqueSummary(e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Critérios & Exames (JSON)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Referências de Evidência</Label>
            <Textarea value={evidenceRefs} onChange={(e) => setEvidenceRefs(e.target.value)} rows={3} className="font-mono text-xs" />
          </div>
          <div className="space-y-2">
            <Label>Critérios de Inclusão</Label>
            <Textarea value={inclusionCriteria} onChange={(e) => setInclusionCriteria(e.target.value)} rows={3} className="font-mono text-xs" />
          </div>
          <div className="space-y-2">
            <Label>Critérios de Exclusão</Label>
            <Textarea value={exclusionCriteria} onChange={(e) => setExclusionCriteria(e.target.value)} rows={3} className="font-mono text-xs" />
          </div>
          <div className="space-y-2">
            <Label>Exames Obrigatórios</Label>
            <Textarea value={requiredExams} onChange={(e) => setRequiredExams(e.target.value)} rows={3} className="font-mono text-xs" />
          </div>
          <div className="space-y-2">
            <Label>Checklist Template</Label>
            <Textarea value={checklistTemplate} onChange={(e) => setChecklistTemplate(e.target.value)} rows={5} className="font-mono text-xs" />
          </div>
        </CardContent>
      </Card>

      {/* Change Summary - Required */}
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="text-base text-primary">Resumo da Mudança *</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={changeSummary}
            onChange={(e) => setChangeSummary(e.target.value)}
            placeholder="Descreva brevemente o que foi alterado nesta versão..."
            rows={2}
            required
          />
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate(-1)}>Cancelar</Button>
        <Button
          onClick={handleSave}
          disabled={!title.trim() || !changeSummary.trim() || updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Salvar e Criar Versão
        </Button>
      </div>
    </div>
  );
}
