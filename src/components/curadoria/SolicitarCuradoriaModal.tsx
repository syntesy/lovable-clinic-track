import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { CuradoriaPurpose, CuradoriaArticle } from "@/types/curadoria";
import { Bot, Loader2 } from "lucide-react";

interface SolicitarCuradoriaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  articleId: string;
  articleTitle: string;
  article?: CuradoriaArticle;
  onSuccess?: () => void;
}

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
  const navigate = useNavigate();
  const [purpose, setPurpose] = useState<CuradoriaPurpose | "">("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
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
        interest: article?.interest || 'Outro',
        purpose: purpose || null,
        comment: comment || null,
        status: "solicitada",
      });

      if (requestError) throw requestError;

      // Start the curation job (unified flow with progress)
      const { data, error } = await supabase.functions.invoke("generate-curation-job", {
        body: { articleId, userId: user.id }
      });

      if (error) {
        console.error("Error starting curation job:", error);
        // Continue anyway - the request was created
        toast.warning("Solicitação registrada, mas houve um erro ao iniciar a geração automática.");
      } else if (data?.job) {
        toast.success("Curadoria em geração! Você será redirecionado para acompanhar o progresso.");
      }

      // Update article status
      await supabase
        .from("curadoria_articles")
        .update({ status: "em_producao" })
        .eq("id", articleId);

      // Close modal and redirect to detail page
      onOpenChange(false);
      onSuccess?.();
      
      // Reset form
      setPurpose("");
      setComment("");

      // Navigate to detail page to see progress
      navigate(`/curadoria/${articleId}`);

    } catch (error: any) {
      console.error("Error requesting curadoria:", error);
      toast.error("Erro ao solicitar curadoria. Tente novamente.");
    } finally {
      setIsSubmitting(false);
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
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Iniciando geração...
              </>
            ) : (
              "Confirmar solicitação"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
