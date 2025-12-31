import { FisioRegenFormData, TissueIntegrityGrade, TissueSubstrateViabilityGrade, TissueBiologicStageGrade, PriorOrthobiologicAttempts, TissueType } from "@/types/fisioregen-score";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Layers, AlertCircle, Stethoscope } from "lucide-react";

interface WizardStep5Props {
  formData: FisioRegenFormData;
  updateFormData: <K extends keyof FisioRegenFormData>(field: K, value: FisioRegenFormData[K]) => void;
}

export function WizardStep5({ formData, updateFormData }: WizardStep5Props) {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
        <Layers className="h-5 w-5 text-muted-foreground mt-0.5" />
        <div>
          <p className="font-medium">Prontidão Tecidual</p>
          <p className="text-sm text-muted-foreground">
            Avaliação do estado do tecido-alvo e tentativas prévias de tratamento.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Tipo de Tecido Predominante - NOVO (somente profissional) */}
        <div className="p-4 border border-primary/30 rounded-lg space-y-3 bg-primary/5">
          <Label className="font-medium flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-primary" />
            Tipo de Tecido Predominante
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">Somente profissional</span>
          </Label>
          <RadioGroup
            value={formData.regen_tissue_type}
            onValueChange={(val) => updateFormData("regen_tissue_type", val as TissueType)}
            className="grid grid-cols-2 gap-2"
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg bg-background">
              <RadioGroupItem value="tendon" id="tt_tendon" />
              <Label htmlFor="tt_tendon" className="cursor-pointer text-sm">Tendão</Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg bg-background">
              <RadioGroupItem value="cartilage" id="tt_cartilage" />
              <Label htmlFor="tt_cartilage" className="cursor-pointer text-sm">Cartilagem</Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg bg-background">
              <RadioGroupItem value="ligament" id="tt_ligament" />
              <Label htmlFor="tt_ligament" className="cursor-pointer text-sm">Ligamento</Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg bg-background">
              <RadioGroupItem value="muscle" id="tt_muscle" />
              <Label htmlFor="tt_muscle" className="cursor-pointer text-sm">Músculo</Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg bg-background">
              <RadioGroupItem value="enthesis" id="tt_enthesis" />
              <Label htmlFor="tt_enthesis" className="cursor-pointer text-sm">Entese</Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg bg-background">
              <RadioGroupItem value="other" id="tt_other" />
              <Label htmlFor="tt_other" className="cursor-pointer text-sm">Outro</Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg bg-background col-span-2">
              <RadioGroupItem value="unknown" id="tt_unknown" />
              <Label htmlFor="tt_unknown" className="cursor-pointer text-sm">Não definido / A determinar</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Integridade Tecidual */}
        <div className="p-4 border rounded-lg space-y-3">
          <Label className="font-medium">Grau de Integridade Tecidual (0-15 pts)</Label>
          <RadioGroup
            value={formData.tissue_integrity_grade}
            onValueChange={(val) => updateFormData("tissue_integrity_grade", val as TissueIntegrityGrade)}
            className="grid grid-cols-2 gap-2"
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="preserved" id="ti_preserved" />
              <Label htmlFor="ti_preserved" className="cursor-pointer text-sm">
                Preservada (+15)
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="moderate" id="ti_moderate" />
              <Label htmlFor="ti_moderate" className="cursor-pointer text-sm">
                Moderada (+10)
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="severe" id="ti_severe" />
              <Label htmlFor="ti_severe" className="cursor-pointer text-sm">
                Grave (+4)
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="complete_rupture" id="ti_rupture" />
              <Label htmlFor="ti_rupture" className="cursor-pointer text-sm">
                Ruptura completa (0)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Viabilidade do Substrato */}
        <div className="p-4 border rounded-lg space-y-3">
          <Label className="font-medium">Viabilidade do Substrato (0-15 pts)</Label>
          <RadioGroup
            value={formData.tissue_substrate_viability_grade}
            onValueChange={(val) => updateFormData("tissue_substrate_viability_grade", val as TissueSubstrateViabilityGrade)}
            className="grid grid-cols-2 gap-2"
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="viable" id="sv_viable" />
              <Label htmlFor="sv_viable" className="cursor-pointer text-sm">
                Viável (+15)
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="moderate_changes" id="sv_moderate" />
              <Label htmlFor="sv_moderate" className="cursor-pointer text-sm">
                Alterações moderadas (+8)
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="severe" id="sv_severe" />
              <Label htmlFor="sv_severe" className="cursor-pointer text-sm">
                Grave (+2)
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="collapse" id="sv_collapse" />
              <Label htmlFor="sv_collapse" className="cursor-pointer text-sm">
                Colapso (0)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Estágio Biológico */}
        <div className="p-4 border rounded-lg space-y-3">
          <Label className="font-medium">Estágio Biológico (0-10 pts)</Label>
          <RadioGroup
            value={formData.tissue_biologic_stage_grade}
            onValueChange={(val) => updateFormData("tissue_biologic_stage_grade", val as TissueBiologicStageGrade)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="responsive" id="bs_responsive" />
              <Label htmlFor="bs_responsive" className="cursor-pointer text-sm">
                Responsivo (+10)
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="advanced_low_matrix" id="bs_advanced" />
              <Label htmlFor="bs_advanced" className="cursor-pointer text-sm">
                Avançado / baixa matriz (+5)
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="very_advanced" id="bs_very_advanced" />
              <Label htmlFor="bs_very_advanced" className="cursor-pointer text-sm">
                Muito avançado (0)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Tentativas Prévias */}
        <div className="p-4 border rounded-lg space-y-3">
          <Label className="font-medium">Tentativas Prévias de Ortobiológicos (0-5 pts)</Label>
          <RadioGroup
            value={formData.prior_orthobiologic_attempts}
            onValueChange={(val) => updateFormData("prior_orthobiologic_attempts", val as PriorOrthobiologicAttempts)}
            className="space-y-2"
          >
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="first" id="po_first" />
              <Label htmlFor="po_first" className="cursor-pointer text-sm">
                Primeira tentativa (+5)
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="failed_once" id="po_failed_once" />
              <Label htmlFor="po_failed_once" className="cursor-pointer text-sm">
                Falhou 1x anteriormente (+2)
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <RadioGroupItem value="failed_2plus" id="po_failed_2plus" />
              <Label htmlFor="po_failed_2plus" className="cursor-pointer text-sm">
                Falhou 2+ vezes (0)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Bloqueios Estruturais */}
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg space-y-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <span className="font-medium">Bloqueios Estruturais</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="block_rupture" className="font-medium">
                Ruptura completa ou avulsão
              </Label>
              <p className="text-sm text-muted-foreground">
                Lesão estrutural que impede o tratamento ortobiológico
              </p>
            </div>
            <Switch
              id="block_rupture"
              checked={formData.structural_block_complete_rupture_or_avulsion}
              onCheckedChange={(checked) => updateFormData("structural_block_complete_rupture_or_avulsion", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="block_collapse" className="font-medium">
                Colapso ósseo ou osteonecrose
              </Label>
              <p className="text-sm text-muted-foreground">
                Comprometimento ósseo grave no local
              </p>
            </div>
            <Switch
              id="block_collapse"
              checked={formData.structural_block_bone_collapse_or_osteonecrosis}
              onCheckedChange={(checked) => updateFormData("structural_block_bone_collapse_or_osteonecrosis", checked)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
