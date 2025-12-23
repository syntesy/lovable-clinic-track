import { FisioRegenFormData } from "@/types/fisioregen-score";
import { Button } from "@/components/ui/button";
import { ClipboardList, Play, Check, X, AlertTriangle } from "lucide-react";

interface WizardStep7Props {
  formData: FisioRegenFormData;
  onGenerate: () => void;
}

export function WizardStep7({ formData, onGenerate }: WizardStep7Props) {
  const ReviewItem = ({ label, value, warning }: { label: string; value: string; warning?: boolean }) => (
    <div className="flex justify-between items-center py-2 border-b last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={`text-sm font-medium ${warning ? "text-amber-600" : ""}`}>
        {value}
      </span>
    </div>
  );

  const BooleanIcon = ({ value }: { value: boolean }) => (
    value ? <X className="h-4 w-4 text-red-500" /> : <Check className="h-4 w-4 text-green-500" />
  );

  const hasBlocks = formData.has_active_infection ||
    formData.has_skin_compromise_at_site ||
    formData.has_active_cancer_on_treatment ||
    formData.structural_block_complete_rupture_or_avulsion ||
    formData.structural_block_bone_collapse_or_osteonecrosis;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
        <ClipboardList className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="font-medium">Revisão dos Dados</p>
          <p className="text-sm text-muted-foreground">
            Confira as informações antes de gerar o score.
          </p>
        </div>
      </div>

      {hasBlocks && (
        <div className="flex items-start gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
          <div>
            <p className="font-medium text-destructive">Bloqueios Detectados</p>
            <p className="text-sm text-muted-foreground">
              Um ou mais bloqueios foram identificados. O status final será "NÃO APTO NO MOMENTO".
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Bloqueios */}
        <div className="p-4 border rounded-lg space-y-2">
          <h4 className="font-medium text-sm">Bloqueios Clínicos</h4>
          <div className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <span>Infecção ativa</span>
              <BooleanIcon value={formData.has_active_infection} />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Compromet. cutâneo</span>
              <BooleanIcon value={formData.has_skin_compromise_at_site} />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span>Câncer ativo</span>
              <BooleanIcon value={formData.has_active_cancer_on_treatment} />
            </div>
          </div>
        </div>

        {/* Medicações */}
        <div className="p-4 border rounded-lg space-y-2">
          <h4 className="font-medium text-sm">Medicações</h4>
          <div className="space-y-1 text-sm">
            <ReviewItem label="Aspirina" value={formData.use_aspirin ? `Sim (${formData.last_aspirin_date || "sem data"})` : "Não"} />
            <ReviewItem label="AINE" value={formData.use_nsaid_nonselective ? `Sim (${formData.last_nsaid_nonselective_date || "sem data"})` : "Não"} />
            <ReviewItem label="P2Y12" value={formData.use_p2y12 ? `Sim (${formData.last_p2y12_date || "sem data"})` : "Não"} />
            <ReviewItem label="Corticoide sist." value={formData.use_systemic_corticosteroid ? "Sim" : "Não"} />
            <ReviewItem label="Corticoide local" value={formData.use_local_corticosteroid_target ? "Sim" : "Não"} />
          </div>
        </div>

        {/* Exames */}
        <div className="p-4 border rounded-lg space-y-2">
          <h4 className="font-medium text-sm">Exames</h4>
          <div className="space-y-1 text-sm">
            <ReviewItem label="Diabetes conhecido" value={formData.diabetes_known ? "Sim" : "Não"} />
            <ReviewItem label="Plaquetas" value={formData.platelets_value ? `${formData.platelets_value}/µL` : "Não informado"} />
            <ReviewItem label="HbA1c" value={formData.hba1c_value ? `${formData.hba1c_value}%` : "Não informado"} />
            <ReviewItem label="PCR" value={
              formData.crp_status === "not_available" ? "Não disponível" :
              formData.crp_status === "normal" ? "Normal" :
              formData.crp_status === "mild" ? "Leve" : "Alto"
            } />
          </div>
        </div>

        {/* Tabagismo */}
        <div className="p-4 border rounded-lg space-y-2">
          <h4 className="font-medium text-sm">Tabagismo</h4>
          <ReviewItem label="Status" value={
            formData.smoking_status === "non_smoker" ? "Não fumante" :
            formData.smoking_status === "light_moderate" ? "Leve/Moderado" : "Pesado"
          } warning={formData.smoking_status !== "non_smoker"} />
        </div>

        {/* Tecidual */}
        <div className="p-4 border rounded-lg space-y-2">
          <h4 className="font-medium text-sm">Prontidão Tecidual</h4>
          <div className="space-y-1 text-sm">
            <ReviewItem label="Integridade" value={formData.tissue_integrity_grade} />
            <ReviewItem label="Substrato" value={formData.tissue_substrate_viability_grade} />
            <ReviewItem label="Estágio" value={formData.tissue_biologic_stage_grade} />
            <ReviewItem label="Tentativas" value={formData.prior_orthobiologic_attempts} />
          </div>
        </div>

        {/* Execução */}
        <div className="p-4 border rounded-lg space-y-2">
          <h4 className="font-medium text-sm">Execução/Adesão</h4>
          <div className="space-y-1 text-sm">
            <ReviewItem label="Logística" value={formData.logistics_capacity} />
            <ReviewItem label="Adesão" value={formData.adherence_estimate} />
            <ReviewItem label="Expectativas" value={formData.expectation_realism} />
          </div>
        </div>
      </div>

      <div className="text-center pt-4">
        <Button onClick={onGenerate} size="lg" className="gap-2 bg-green-600 hover:bg-green-700">
          <Play className="h-5 w-5" />
          Gerar Score e Relatório
        </Button>
      </div>
    </div>
  );
}
