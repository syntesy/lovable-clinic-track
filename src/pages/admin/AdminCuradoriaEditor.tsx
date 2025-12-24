import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Save, 
  CheckCircle, 
  XCircle,
  History,
  FileText,
  Target,
  Beaker,
  BarChart3,
  AlertTriangle,
  Stethoscope,
  BookOpen,
  Quote,
  Loader2,
  ExternalLink
} from "lucide-react";
import { CurationGovernanceBadge } from "@/components/curadoria/CurationGovernanceBadge";
import { CurationStatus } from "@/types/curation";
import { CuradoriaArticle, interestColors } from "@/types/curadoria";
import { VersionHistoryModal } from "@/components/admin/VersionHistoryModal";

interface CurationData {
  id: string;
  article_id: string;
  version: number;
  status: CurationStatus;
  objective: string;
  design: string;
  design_type: string;
  population: string;
  sample_size: string;
  intervention: string;
  comparator: string;
  outcomes_primary: string;
  outcomes_secondary: string;
  results_key: string;
  adverse_events: string;
  limitations: string;
  evidence_level: string;
  bias_risk: string;
  applicability: string;
  clinical_takeaways: string[];
  practice_impact: string;
  what_changes_in_practice: string;
  authors_conclusion: string;
  citations: any[];
  created_by: string;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  reviewed_at: string | null;
  approval_declaration: boolean;
  rejection_reason: string | null;
}

const designOptions = [
  { value: "rct", label: "Ensaio Clínico Randomizado (RCT)" },
  { value: "cohort", label: "Estudo de Coorte" },
  { value: "case_control", label: "Caso-Controle" },
  { value: "case_series", label: "Série de Casos" },
  { value: "systematic_review", label: "Revisão Sistemática" },
  { value: "meta_analysis", label: "Meta-análise" },
  { value: "observational", label: "Estudo Observacional" },
  { value: "other", label: "Outro" },
];

const evidenceLevelOptions = [
  { value: "ia", label: "Ia - Revisão sistemática de ECRs" },
  { value: "ib", label: "Ib - ECR individual" },
  { value: "iia", label: "IIa - Estudo de coorte" },
  { value: "iib", label: "IIb - Estudo de caso-controle" },
  { value: "iii", label: "III - Série de casos" },
  { value: "iv", label: "IV - Opinião de especialistas" },
  { value: "v", label: "V - Raciocínio baseado em mecanismos" },
];

const biasRiskOptions = [
  { value: "baixo", label: "Baixo" },
  { value: "moderado", label: "Moderado" },
  { value: "alto", label: "Alto" },
  { value: "muito_alto", label: "Muito alto" },
  { value: "incerto", label: "Incerto" },
];

const applicabilityOptions = [
  { value: "alta", label: "Alta" },
  { value: "moderada", label: "Moderada" },
  { value: "baixa", label: "Baixa" },
  { value: "muito_baixa", label: "Muito baixa" },
  { value: "nao_aplicavel", label: "Não aplicável" },
];

export default function AdminCuradoriaEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [curation, setCuration] = useState<CurationData | null>(null);
  const [article, setArticle] = useState<CuradoriaArticle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Form state
  const [formData, setFormData] = useState<Partial<CurationData>>({});
  const [clinicalTakeaways, setClinicalTakeaways] = useState<string[]>(["", "", ""]);
  
  // Modals
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [approvalChecked, setApprovalChecked] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    checkAdminAccess();
  }, []);

  useEffect(() => {
    if (isAdmin && id) {
      fetchCuration();
    }
  }, [isAdmin, id]);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você precisa estar logado");
      navigate("/auth");
      return;
    }

    setCurrentUserId(user.id);

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      toast.error("Acesso restrito a administradores");
      navigate("/");
      return;
    }

    setIsAdmin(true);
  };

  const fetchCuration = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const { data: curationData, error: curationError } = await supabase
        .from("curations")
        .select("*")
        .eq("id", id)
        .single();

      if (curationError) throw curationError;

      const typedCuration: CurationData = {
        ...curationData,
        status: curationData.status as CurationStatus,
        clinical_takeaways: curationData.clinical_takeaways || [],
        citations: (curationData.citations as any[]) || [],
      };
      
      setCuration(typedCuration);
      setFormData(typedCuration);
      setClinicalTakeaways([
        typedCuration.clinical_takeaways[0] || "",
        typedCuration.clinical_takeaways[1] || "",
        typedCuration.clinical_takeaways[2] || "",
      ]);

      // Fetch article
      const { data: articleData } = await supabase
        .from("curadoria_articles")
        .select("*")
        .eq("id", curationData.article_id)
        .single();

      if (articleData) {
        setArticle(articleData as any);
      }
    } catch (error) {
      console.error("Error fetching curation:", error);
      toast.error("Erro ao carregar curadoria");
    } finally {
      setIsLoading(false);
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const saveVersion = async (newStatus?: CurationStatus) => {
    if (!curation || !currentUserId) return;

    // Create version snapshot
    const versionData = {
      curation_id: curation.id,
      version_number: curation.version,
      status: curation.status,
      data: formData,
      created_by: currentUserId,
    };

    await supabase.from("curation_versions").insert(versionData);
  };

  const handleSaveDraft = async () => {
    if (!curation) return;

    setIsSaving(true);
    try {
      // Save current version first
      await saveVersion();

      const { error } = await supabase
        .from("curations")
        .update({
          objective: formData.objective,
          design: formData.design,
          population: formData.population,
          sample_size: formData.sample_size,
          intervention: formData.intervention,
          comparator: formData.comparator,
          outcomes_primary: formData.outcomes_primary,
          outcomes_secondary: formData.outcomes_secondary,
          results_key: formData.results_key,
          adverse_events: formData.adverse_events,
          limitations: formData.limitations,
          evidence_level: formData.evidence_level as any,
          bias_risk: formData.bias_risk as any,
          applicability: formData.applicability as any,
          clinical_takeaways: clinicalTakeaways.filter((t) => t.trim() !== ""),
          what_changes_in_practice: formData.practice_impact || formData.what_changes_in_practice,
          authors_conclusion: formData.authors_conclusion,
          version: curation.version + 1,
          status: "em_revisao" as CurationStatus,
          reviewed_by: currentUserId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", curation.id);

      if (error) throw error;

      toast.success("Rascunho salvo com sucesso!");
      fetchCuration();
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Erro ao salvar rascunho");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!curation || !approvalChecked) return;

    setIsSaving(true);
    try {
      await saveVersion();

      const { error } = await supabase
        .from("curations")
        .update({
          objective: formData.objective,
          design: formData.design,
          population: formData.population,
          sample_size: formData.sample_size,
          intervention: formData.intervention,
          comparator: formData.comparator,
          outcomes_primary: formData.outcomes_primary,
          outcomes_secondary: formData.outcomes_secondary,
          results_key: formData.results_key,
          adverse_events: formData.adverse_events,
          limitations: formData.limitations,
          evidence_level: formData.evidence_level as any,
          bias_risk: formData.bias_risk as any,
          applicability: formData.applicability as any,
          clinical_takeaways: clinicalTakeaways.filter((t) => t.trim() !== ""),
          what_changes_in_practice: formData.practice_impact || formData.what_changes_in_practice,
          authors_conclusion: formData.authors_conclusion,
          version: curation.version + 1,
          status: "disponivel" as CurationStatus,
          reviewed_by: currentUserId,
          reviewed_at: new Date().toISOString(),
          approval_declaration: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", curation.id);

      if (error) throw error;

      // Update article status
      await supabase
        .from("curadoria_articles")
        .update({ status: "disponivel" })
        .eq("id", curation.article_id);

      toast.success("Curadoria publicada com sucesso!");
      setShowPublishDialog(false);
      navigate("/admin/curadoria");
    } catch (error) {
      console.error("Error publishing:", error);
      toast.error("Erro ao publicar curadoria");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReject = async () => {
    if (!curation || !rejectionReason.trim()) {
      toast.error("Justificativa obrigatória");
      return;
    }

    setIsSaving(true);
    try {
      await saveVersion();

      const { error } = await supabase
        .from("curations")
        .update({
          status: "rejeitada",
          rejection_reason: rejectionReason,
          reviewed_by: currentUserId,
          reviewed_at: new Date().toISOString(),
          version: curation.version + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", curation.id);

      if (error) throw error;

      // Update article status
      await supabase
        .from("curadoria_articles")
        .update({ status: "indeferida" })
        .eq("id", curation.article_id);

      toast.success("Curadoria indeferida");
      setShowRejectDialog(false);
      navigate("/admin/curadoria");
    } catch (error) {
      console.error("Error rejecting:", error);
      toast.error("Erro ao indeferir curadoria");
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAdmin || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!curation) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/admin/curadoria")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <Card className="bg-card border-border">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Curadoria não encontrada.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/admin/curadoria")} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowVersionHistory(true)} className="gap-2">
            <History className="h-4 w-4" />
            Histórico
          </Button>
          {article && (
            <Button 
              variant="outline" 
              onClick={() => window.open(`/curadoria/${article.id}/original`, '_blank')}
              className="gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Artigo original
            </Button>
          )}
        </div>
      </div>

      {/* Article Info */}
      {article && (
        <Card className="bg-card border-border">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge className={`${interestColors[article.interest]} border`}>
                    {article.interest}
                  </Badge>
                  <CurationGovernanceBadge status={curation.status} />
                  <Badge variant="secondary">v{curation.version}</Badge>
                </div>
                <h1 className="text-xl font-bold text-foreground">{article.title}</h1>
                <p className="text-sm text-muted-foreground">
                  {article.authors} · {article.year} · {article.journal}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor */}
      <div className="grid grid-cols-1 gap-6">
        {/* Bloco A - Identificação do Estudo */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Bloco A — Identificação do Estudo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Objetivo do estudo</Label>
              <Textarea
                value={formData.objective || ""}
                onChange={(e) => updateField("objective", e.target.value)}
                placeholder="Descreva o objetivo principal do estudo..."
                className="bg-background border-border min-h-[100px]"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de desenho</Label>
                <Select 
                  value={formData.design_type || ""} 
                  onValueChange={(v) => updateField("design_type", v)}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {designOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Tamanho da amostra (N)</Label>
                <Input
                  value={formData.sample_size || ""}
                  onChange={(e) => updateField("sample_size", e.target.value)}
                  placeholder="Ex: 120 participantes"
                  className="bg-background border-border"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>População estudada</Label>
              <Textarea
                value={formData.population || ""}
                onChange={(e) => updateField("population", e.target.value)}
                placeholder="Descreva a população do estudo..."
                className="bg-background border-border"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bloco B - Intervenção e Comparador */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5 text-primary" />
              Bloco B — Intervenção e Comparador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Intervenção principal</Label>
              <Textarea
                value={formData.intervention || ""}
                onChange={(e) => updateField("intervention", e.target.value)}
                placeholder="Descreva a intervenção estudada..."
                className="bg-background border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Comparador (se houver)</Label>
              <Textarea
                value={formData.comparator || ""}
                onChange={(e) => updateField("comparator", e.target.value)}
                placeholder="Descreva o grupo controle ou comparador..."
                className="bg-background border-border"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bloco C - Desfechos e Resultados */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Bloco C — Desfechos e Resultados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Desfechos primários</Label>
              <Textarea
                value={formData.outcomes_primary || ""}
                onChange={(e) => updateField("outcomes_primary", e.target.value)}
                placeholder="Liste os desfechos primários..."
                className="bg-background border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Desfechos secundários</Label>
              <Textarea
                value={formData.outcomes_secondary || ""}
                onChange={(e) => updateField("outcomes_secondary", e.target.value)}
                placeholder="Liste os desfechos secundários..."
                className="bg-background border-border"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Principais resultados</Label>
              <Textarea
                value={formData.results_key || ""}
                onChange={(e) => updateField("results_key", e.target.value)}
                placeholder="Resuma os principais achados..."
                className="bg-background border-border min-h-[100px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Eventos adversos relatados</Label>
              <Textarea
                value={formData.adverse_events || ""}
                onChange={(e) => updateField("adverse_events", e.target.value)}
                placeholder="Descreva eventos adversos..."
                className="bg-background border-border"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bloco D - Qualidade Metodológica */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Bloco D — Qualidade Metodológica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Nível de evidência</Label>
                <Select 
                  value={formData.evidence_level || ""} 
                  onValueChange={(v) => updateField("evidence_level", v)}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {evidenceLevelOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Risco de viés</Label>
                <Select 
                  value={formData.bias_risk || ""} 
                  onValueChange={(v) => updateField("bias_risk", v)}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {biasRiskOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Aplicabilidade clínica</Label>
                <Select 
                  value={formData.applicability || ""} 
                  onValueChange={(v) => updateField("applicability", v)}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {applicabilityOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Limitações do estudo *</Label>
              <Textarea
                value={formData.limitations || ""}
                onChange={(e) => updateField("limitations", e.target.value)}
                placeholder="Descreva as limitações do estudo (obrigatório)..."
                className="bg-background border-border min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bloco E - Aplicabilidade Clínica */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Stethoscope className="h-5 w-5 text-primary" />
              Bloco E — Aplicabilidade Clínica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Principais aprendizados clínicos (3 bullets) *</Label>
              {clinicalTakeaways.map((takeaway, index) => (
                <Input
                  key={index}
                  value={takeaway}
                  onChange={(e) => {
                    const newTakeaways = [...clinicalTakeaways];
                    newTakeaways[index] = e.target.value;
                    setClinicalTakeaways(newTakeaways);
                  }}
                  placeholder={`Aprendizado ${index + 1}...`}
                  className="bg-background border-border"
                />
              ))}
            </div>
            
            <div className="space-y-2">
              <Label>O que muda (ou não) na prática clínica *</Label>
              <Textarea
                value={formData.practice_impact || formData.what_changes_in_practice || ""}
                onChange={(e) => updateField("practice_impact", e.target.value)}
                placeholder="Descreva o impacto na prática clínica..."
                className="bg-background border-border min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Bloco F - Conclusão dos Autores */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Bloco F — Conclusão dos Autores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Conclusão original dos autores *</Label>
              <Textarea
                value={formData.authors_conclusion || ""}
                onChange={(e) => updateField("authors_conclusion", e.target.value)}
                placeholder="Transcreva ou resuma a conclusão dos autores..."
                className="bg-background border-border min-h-[100px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <Card className="bg-card border-border sticky bottom-4">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3 justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Versão atual: v{curation.version} · 
                Última modificação: {new Date(curation.updated_at).toLocaleString('pt-BR')}
              </div>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleSaveDraft}
                  disabled={isSaving}
                  className="gap-2"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar rascunho
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setShowRejectDialog(true)}
                  disabled={isSaving}
                  className="gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  Indeferir
                </Button>
                <Button 
                  onClick={() => setShowPublishDialog(true)}
                  disabled={isSaving}
                  className="gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  Publicar curadoria
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Publish Dialog */}
      <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Publicar Curadoria</DialogTitle>
            <DialogDescription>
              Ao publicar, esta curadoria ficará disponível para todos os usuários da plataforma.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800/50">
              <Checkbox
                id="approval"
                checked={approvalChecked}
                onCheckedChange={(checked) => setApprovalChecked(checked as boolean)}
              />
              <label htmlFor="approval" className="text-sm text-amber-800 dark:text-amber-200 cursor-pointer">
                Declaro que revisei esta curadoria e que ela reflete fielmente o conteúdo do artigo original.
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPublishDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handlePublish} disabled={!approvalChecked || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar publicação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>Indeferir Curadoria</DialogTitle>
            <DialogDescription>
              Informe o motivo do indeferimento. Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Justificativa do indeferimento..."
              className="bg-background border-border min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!rejectionReason.trim() || isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirmar indeferimento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version History Modal */}
      <VersionHistoryModal
        open={showVersionHistory}
        onOpenChange={setShowVersionHistory}
        curationId={curation.id}
      />
    </div>
  );
}
