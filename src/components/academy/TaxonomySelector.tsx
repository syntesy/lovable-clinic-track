/**
 * Seletor de Taxonomias Clínicas
 * Permite mentores selecionarem suas áreas de atuação
 */

import { useState, useEffect } from "react";
import { Check, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useClinicalTaxonomies,
  useMentorTaxonomies,
  useUpdateMentorTaxonomies,
  ClinicalTaxonomy,
} from "@/hooks/useClinicalTaxonomies";
import { Skeleton } from "@/components/ui/skeleton";

interface TaxonomySelectorProps {
  mentorId: string;
  onSave?: () => void;
  showSaveButton?: boolean;
  minSelection?: number;
  maxSelection?: number;
}

export function TaxonomySelector({
  mentorId,
  onSave,
  showSaveButton = true,
  minSelection = 1,
  maxSelection = 5,
}: TaxonomySelectorProps) {
  const { data: taxonomies, isLoading: taxonomiesLoading } = useClinicalTaxonomies();
  const { data: mentorTaxonomies, isLoading: mentorTaxonomiesLoading } = useMentorTaxonomies(mentorId);
  const updateTaxonomies = useUpdateMentorTaxonomies();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Inicializar seleção com taxonomias existentes do mentor
  useEffect(() => {
    if (mentorTaxonomies) {
      const ids = mentorTaxonomies.map((mt) => mt.taxonomy_id);
      setSelectedIds(ids);
    }
  }, [mentorTaxonomies]);

  const handleToggle = (taxonomyId: string) => {
    setSelectedIds((prev) => {
      const isSelected = prev.includes(taxonomyId);
      
      if (isSelected) {
        // Remover
        const newIds = prev.filter((id) => id !== taxonomyId);
        setHasChanges(true);
        return newIds;
      } else {
        // Adicionar (verificar limite)
        if (prev.length >= maxSelection) {
          return prev;
        }
        setHasChanges(true);
        return [...prev, taxonomyId];
      }
    });
  };

  const handleSave = async () => {
    await updateTaxonomies.mutateAsync({
      mentorId,
      taxonomyIds: selectedIds,
    });
    setHasChanges(false);
    onSave?.();
  };

  const isLoading = taxonomiesLoading || mentorTaxonomiesLoading;
  const isValid = selectedIds.length >= minSelection && selectedIds.length <= maxSelection;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Selecione suas áreas de atuação ({minSelection}-{maxSelection})
        </span>
        <span className={cn(
          selectedIds.length < minSelection && "text-destructive",
          selectedIds.length > maxSelection && "text-destructive"
        )}>
          {selectedIds.length} selecionada(s)
        </span>
      </div>

      <div className="grid gap-2">
        {taxonomies?.map((taxonomy) => (
          <TaxonomyItem
            key={taxonomy.id}
            taxonomy={taxonomy}
            isSelected={selectedIds.includes(taxonomy.id)}
            onToggle={() => handleToggle(taxonomy.id)}
            disabled={!selectedIds.includes(taxonomy.id) && selectedIds.length >= maxSelection}
          />
        ))}
      </div>

      {showSaveButton && (
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={!isValid || !hasChanges || updateTaxonomies.isPending}
          >
            {updateTaxonomies.isPending ? "Salvando..." : "Salvar Áreas"}
          </Button>
        </div>
      )}
    </div>
  );
}

interface TaxonomyItemProps {
  taxonomy: ClinicalTaxonomy;
  isSelected: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

function TaxonomyItem({ taxonomy, isSelected, onToggle, disabled }: TaxonomyItemProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={() => !disabled && onToggle()}
    >
      <Checkbox
        checked={isSelected}
        disabled={disabled}
        className="pointer-events-none"
      />
      <div className="flex-1">
        <Label className="font-medium cursor-pointer">{taxonomy.name}</Label>
      </div>
      {taxonomy.description && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground" />
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-xs">
              <p className="text-sm">{taxonomy.description}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

// Versão read-only para exibição
export function TaxonomyBadges({
  taxonomyIds,
  className,
}: {
  taxonomyIds?: string[];
  className?: string;
}) {
  const { data: allTaxonomies } = useClinicalTaxonomies();

  if (!taxonomyIds?.length || !allTaxonomies) {
    return null;
  }

  const selectedTaxonomies = allTaxonomies.filter((t) =>
    taxonomyIds.includes(t.id)
  );

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {selectedTaxonomies.map((taxonomy) => (
        <span
          key={taxonomy.id}
          className="inline-flex items-center px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs"
        >
          {taxonomy.name}
        </span>
      ))}
    </div>
  );
}

export default TaxonomySelector;
