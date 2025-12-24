import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CuradoriaInterest, CuradoriaPurpose, CuradoriaArticle } from "@/types/curadoria";
import { Bot, Loader2 } from "lucide-react";

interface SolicitarCuradoriaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string;
  articleTitle: string;
  article?: CuradoriaArticle;
  onSuccess?: () => void;
}

const interestOptions: { value: CuradoriaInterest; label: string }[] = [
  { value: "PRP", label: "PRP - Plasma Rico em Plaquetas" },
  { value: "PRF", label: "PRF - Fibrina Rica em Plaquetas" },
  { value: "PPP", label: "PPP - Plasma Pobre em Plaquetas" },
  { value: "BMP", label: "BMP - Proteínas Morfogenéticas Ósseas" },
  { value: "Outro", label: "Outro" },
];

const purposeOptions: { value: CuradoriaPurpose; label: string }[] = [
  { value: "pratica_clinica", label: "Prática clínica" },
  { value: "ensino", label: "Ensino" },
  { value: "pesquisa", label: "Pesquisa" },
];

export function SolicitarCuradoriaModal({
  open,
  onOpenChange,
  articleId,
  articleTitle,
  article,
  onSuccess,
}: SolicitarCuradoriaModalProps) {
  const [interest, setInterest] = useState<CuradoriaInterest | "">("");
  const [purpose, setPurpose] = useState<CuradoriaPurpose | "">("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);

  const handleSubmit = async () => {
    if (!interest) {
      toast.error("Selecione o interesse principal");
      return;
    }

    setIsSubmitting(true);
    setIsGeneratingDraft(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado para solicitar curadoria");
        return;
      }

      // Create curadoria request
      const { error: requestError } = await supabase.from("curadoria_requests").insert({
        article_id: articleId,
        user_id: user.id,
        interest: interest,
        purpose: purpose || null,
        comment: comment || null,
        status: "solicitada",
      });

      if (requestError) throw requestError;

      // Generate AI draft if we have article data
      if (article) {
        toast.info("Gerando rascunho com IA...", { duration: 5000 });
        
        try {
          const { data: draftData, error: draftError } = await supabase.functions.invoke(
            'generate-curation-draft',
            {
              body: { article }
            }
          );

          if (draftError) {
            console.error("Error generating draft:", draftError);
            toast.warning("Curadoria solicitada, mas o rascunho automático não pôde ser gerado.");
          } else if (draftData?.curation) {
            // Save the AI-generated draft to curations table
            const { error: curationError } = await supabase.from("curations").insert({
              article_id: articleId,
              status: 'em_revisao',
              created_by: user.id,
              ...draftData.curation,
              clinical_takeaways: draftData.curation.clinical_takeaways || [],
              citations: []
            });

            if (curationError) {
              console.error("Error saving curation:", curationError);
              toast.warning("Rascunho gerado, mas houve um erro ao salvar.");
            } else {
              toast.success("Rascunho de curadoria gerado com sucesso!");
            }
          }
        } catch (aiError) {
          console.error("AI generation error:", aiError);
          // Continue without AI draft - request is still valid
        }
      }

      // Update article status to 'solicitada' if it was 'sem_curadoria'
      await supabase
        .from("curadoria_articles")
        .update({ status: "solicitada" })
        .eq("id", articleId)
        .eq("status", "sem_curadoria");

      toast.success("Curadoria solicitada com sucesso!");
      onOpenChange(false);
      onSuccess?.();
      
      // Reset form
      setInterest("");
      setPurpose("");
      setComment("");
    } catch (error: any) {
      console.error("Error requesting curadoria:", error);
      toast.error("Erro ao solicitar curadoria. Tente novamente.");
    } finally {
      setIsSubmitting(false);
      setIsGeneratingDraft(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-xl">Solicitar curadoria clínica</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Nossa equipe científica irá analisar este artigo e transformá-lo em uma 
            curadoria prática, focada em tomada de decisão clínica.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* AI Draft Info */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 flex items-start gap-3">
            <Bot className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-medium text-blue-400">Curadoria assistida por IA</p>
              <p className="text-muted-foreground text-xs mt-1">
                Um rascunho será gerado automaticamente e enviado para revisão por especialistas.
              </p>
            </div>
          </div>

          <div className="bg-secondary/30 rounded-lg p-3 border border-border">
            <p className="text-xs font-medium text-muted-foreground mb-1">Artigo</p>
            <p className="text-sm text-foreground">{articleTitle}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="interest">Interesse principal *</Label>
            <Select value={interest} onValueChange={(value) => setInterest(value as CuradoriaInterest)}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Selecione o interesse" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {interestOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="purpose">Finalidade do uso (opcional)</Label>
            <Select value={purpose} onValueChange={(value) => setPurpose(value as CuradoriaPurpose)}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Selecione a finalidade" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border">
                {purposeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comentário (opcional)</Label>
            <Textarea
              id="comment"
              placeholder="Deseja que a curadoria foque em algum aspecto específico?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="bg-card border-border min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isGeneratingDraft ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando rascunho...
              </>
            ) : isSubmitting ? (
              "Enviando..."
            ) : (
              "Confirmar solicitação"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
