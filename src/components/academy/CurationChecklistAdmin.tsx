/**
 * Checklist de Curadoria Científica (Admin Only)
 * Permite admin avaliar mentores segundo critérios institucionais
 */

import { useState, useEffect } from "react";
import { Check, X, Save, FileText, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  useMentorCurationChecklist,
  useUpdateMentorCuration,
  MentorCurationChecklist,
} from "@/hooks/useClinicalTaxonomies";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface CurationChecklistAdminProps {
  mentorId: string;
  mentorName?: string;
  onComplete?: () => void;
}

interface ChecklistItem {
  key: keyof Pick<
    MentorCurationChecklist,
    | "formation_compatible"
    | "clinical_experience_verified"
    | "evidence_based_alignment"
    | "ethical_compliance"
    | "language_adequate"
  >;
  label: string;
  description: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    key: "formation_compatible",
    label: "Formação Compatível",
    description: "Formação acadêmica compatível com a área de atuação declarada",
  },
  {
    key: "clinical_experience_verified",
    label: "Experiência Clínica Comprovada",
    description: "Experiência clínica relevante e verificável na área",
  },
  {
    key: "evidence_based_alignment",
    label: "Alinhamento com Evidências",
    description: "Práticas alinhadas com medicina baseada em evidências",
  },
  {
    key: "ethical_compliance",
    label: "Conformidade Ética",
    description: "Sem promessas irreais ou práticas antiéticas",
  },
  {
    key: "language_adequate",
    label: "Linguagem Adequada",
    description: "Comunicação alinhada ao padrão institucional REGEN",
  },
];

export function CurationChecklistAdmin({
  mentorId,
  mentorName,
  onComplete,
}: CurationChecklistAdminProps) {
  const { data: existingChecklist, isLoading } = useMentorCurationChecklist(mentorId);
  const updateCuration = useUpdateMentorCuration();

  const [checklist, setChecklist] = useState<Partial<MentorCurationChecklist>>({
    formation_compatible: false,
    clinical_experience_verified: false,
    evidence_based_alignment: false,
    ethical_compliance: false,
    language_adequate: false,
    curator_notes: "",
  });

  const [hasChanges, setHasChanges] = useState(false);

  // Carregar dados existentes
  useEffect(() => {
    if (existingChecklist) {
      setChecklist({
        formation_compatible: existingChecklist.formation_compatible,
        clinical_experience_verified: existingChecklist.clinical_experience_verified,
        evidence_based_alignment: existingChecklist.evidence_based_alignment,
        ethical_compliance: existingChecklist.ethical_compliance,
        language_adequate: existingChecklist.language_adequate,
        curator_notes: existingChecklist.curator_notes || "",
      });
    }
  }, [existingChecklist]);

  const handleToggle = (key: ChecklistItem["key"]) => {
    setChecklist((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
    setHasChanges(true);
  };

  const handleNotesChange = (notes: string) => {
    setChecklist((prev) => ({
      ...prev,
      curator_notes: notes,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    await updateCuration.mutateAsync({
      mentorId,
      checklist,
    });
    setHasChanges(false);
    onComplete?.();
  };

  const completedCount = CHECKLIST_ITEMS.filter(
    (item) => checklist[item.key]
  ).length;
  const totalCount = CHECKLIST_ITEMS.length;
  const isComplete = completedCount === totalCount;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Curadoria Científica
            </CardTitle>
            <CardDescription>
              {mentorName ? `Avaliação de ${mentorName}` : "Avaliação do mentor"}
            </CardDescription>
          </div>
          <Badge
            variant={isComplete ? "default" : "secondary"}
            className={cn(
              isComplete && "bg-emerald-600 hover:bg-emerald-700"
            )}
          >
            {completedCount}/{totalCount} critérios
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Checklist Items */}
        <div className="space-y-3">
          {CHECKLIST_ITEMS.map((item) => (
            <div
              key={item.key}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                checklist[item.key]
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
                  : "border-border hover:border-primary/50"
              )}
              onClick={() => handleToggle(item.key)}
            >
              <Checkbox
                checked={checklist[item.key]}
                className="mt-0.5 pointer-events-none"
              />
              <div className="flex-1">
                <Label className="font-medium cursor-pointer">
                  {item.label}
                </Label>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {item.description}
                </p>
              </div>
              {checklist[item.key] ? (
                <Check className="h-5 w-5 text-emerald-600" />
              ) : (
                <X className="h-5 w-5 text-muted-foreground/50" />
              )}
            </div>
          ))}
        </div>

        <Separator />

        {/* Notas do Curador */}
        <div className="space-y-2">
          <Label htmlFor="curator-notes">Notas do Curador (opcional)</Label>
          <Textarea
            id="curator-notes"
            placeholder="Observações adicionais sobre a avaliação..."
            value={checklist.curator_notes || ""}
            onChange={(e) => handleNotesChange(e.target.value)}
            rows={3}
          />
        </div>

        {/* Aviso sobre selo */}
        <div className={cn(
          "flex items-start gap-2 p-3 rounded-lg text-sm",
          isComplete
            ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400"
            : "bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400"
        )}>
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            {isComplete
              ? "Todos os critérios atendidos. O mentor receberá o selo 'Mentor Verificado REGEN' ao salvar."
              : "O mentor não receberá o selo de verificação enquanto todos os critérios não forem atendidos."}
          </p>
        </div>

        {/* Botão Salvar */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateCuration.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            {updateCuration.isPending ? "Salvando..." : "Salvar Curadoria"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default CurationChecklistAdmin;
