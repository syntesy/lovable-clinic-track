import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Copy, FileText, ClipboardCopy, Download } from "lucide-react";
import { toast } from "sonner";
import type { AcademyArticle } from "@/hooks/useAcademyArticles";
import { EvidenceMethodSeal, EVIDENCE_METHOD_SEAL_TEXT } from "./EvidenceMethodSeal";

interface PaperSummaryCardProps {
  article: AcademyArticle;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getScoreColor(score: number | null) {
  if (score == null) return "bg-muted text-muted-foreground";
  if (score >= 70) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  if (score >= 40) return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
  return "bg-red-500/10 text-red-400 border-red-500/30";
}

export function PaperSummaryCard({ article }: PaperSummaryCardProps) {
  const copyText = () => {
    const lines = [
      `📄 ${article.title}`,
      `📅 ${article.year} • ${article.journal || ""}`,
      `🔬 ${article.study_type}`,
      article.evidence_score != null ? `📊 Evidence Score: ${article.evidence_score}/100` : "",
      "",
      `📝 ${article.summary_short}`,
      "",
      article.effect_summary ? `💡 Efeito: ${article.effect_summary}` : "",
      article.limitations?.length ? `⚠️ Limitações: ${article.limitations.join("; ")}` : "",
      article.follow_up ? `🕐 Follow-up: ${article.follow_up}` : "",
      "",
      "⚕️ Score heurístico — não substitui avaliação clínica formal.",
      article.is_published ? `🛡️ ${EVIDENCE_METHOD_SEAL_TEXT}` : "",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(lines);
    toast.success("Ficha copiada!");
  };

  const copyShort = () => {
    const text = `${article.title} (${article.year}, ${article.study_type}): ${article.summary_short}`;
    navigator.clipboard.writeText(text);
    toast.success("Versão resumida copiada!");
  };

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Ficha Resumo para Aula
          </CardTitle>
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" onClick={copyText} className="gap-1 text-xs">
              <Copy className="w-3 h-3" /> Copiar para slide
            </Button>
            <Button variant="ghost" size="sm" onClick={copyShort} className="gap-1 text-xs">
              <ClipboardCopy className="w-3 h-3" /> Versão resumida
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-semibold text-foreground text-sm">{article.title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {article.authors && `${article.authors} • `}{article.year} • {article.journal}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{article.study_type}</Badge>
          {article.evidence_score != null && (
            <Badge variant="outline" className={getScoreColor(article.evidence_score)}>
              Score: {article.evidence_score}/100
            </Badge>
          )}
          {article.interventions?.slice(0, 3).map(i => (
            <Badge key={i} variant="outline" className="text-xs">{i}</Badge>
          ))}
          {article.pathologies?.slice(0, 3).map(p => (
            <Badge key={p} variant="outline" className="text-xs">{p}</Badge>
          ))}
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Resumo</h4>
            <p className="text-foreground">{article.summary_short}</p>
          </div>
          {article.effect_summary && (
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Principais Achados</h4>
              <p className="text-foreground">{article.effect_summary}</p>
            </div>
          )}
        </div>

        {article.limitations?.length ? (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Limitações</h4>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-0.5">
              {article.limitations.map((l, i) => <li key={i}>{l}</li>)}
            </ul>
          </div>
        ) : null}

        {article.follow_up && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Follow-up</h4>
            <p className="text-sm text-foreground">{article.follow_up}</p>
          </div>
        )}

        <Separator />

        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground italic">
            ⚕️ Score heurístico baseado em tipo de estudo e metadados. Não é uma avaliação formal de risco de viés (RoB). Não substitui avaliação clínica individual.
          </p>
          {article.is_published && <EvidenceMethodSeal />}
        </div>
      </CardContent>
    </Card>
  );
}
