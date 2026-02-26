import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Copy, FileText, ClipboardCopy, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { EvidenceMethodSeal, EVIDENCE_METHOD_SEAL_TEXT } from "./EvidenceMethodSeal";

interface CurationJson {
  tipo_estudo?: string;
  nivel_evidencia?: string;
  tamanho_amostra_total?: number;
  intervencao?: string;
  comparador?: string;
  desfechos_primarios?: string[];
  desfechos_secundarios?: string[];
  follow_up_medio?: string;
  resultados_principais?: string;
  significancia_estatistica?: string;
  eventos_adversos?: string;
  risco_vies?: string;
  justificativa_risco_vies?: string;
  score_metodologico?: number;
  aplicabilidade_clinica?: string;
  conclusao_pratica?: string;
  tags?: string[];
}

interface PaperSummaryCardProps {
  title: string;
  authors?: string | null;
  journal?: string | null;
  year?: number | null;
  isPublished?: boolean;
  evidenceScore?: number | null;
  curationJson: CurationJson | null;
}

function getScoreColor(score: number | null) {
  if (score == null) return "bg-muted text-muted-foreground";
  if (score >= 70) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
  if (score >= 40) return "bg-yellow-500/10 text-yellow-400 border-yellow-500/30";
  return "bg-red-500/10 text-red-400 border-red-500/30";
}

export function PaperSummaryCard({
  title,
  authors,
  journal,
  year,
  isPublished,
  evidenceScore,
  curationJson,
}: PaperSummaryCardProps) {
  const c = curationJson;

  // Build the main message
  const mainMessage = c?.conclusao_pratica || c?.resultados_principais || "";

  // Build PICO lines
  const picoLines = [
    c?.intervencao ? `Intervenção: ${c.intervencao}` : null,
    c?.comparador ? `Comparador: ${c.comparador}` : null,
    c?.tamanho_amostra_total ? `Amostra: n=${c.tamanho_amostra_total}` : null,
    c?.follow_up_medio ? `Follow-up: ${c.follow_up_medio}` : null,
  ].filter(Boolean);

  // Key results (max 3)
  const keyResults: string[] = [];
  if (c?.resultados_principais) keyResults.push(c.resultados_principais);
  if (c?.significancia_estatistica) keyResults.push(`Significância: ${c.significancia_estatistica}`);
  if (c?.eventos_adversos && c.eventos_adversos !== "" && c.eventos_adversos !== "Não relatados") {
    keyResults.push(`Eventos adversos: ${c.eventos_adversos}`);
  }

  // Clinical applications (max 3)
  const applications: string[] = [];
  if (c?.aplicabilidade_clinica) applications.push(c.aplicabilidade_clinica);
  if (c?.conclusao_pratica && c.conclusao_pratica !== c?.aplicabilidade_clinica) applications.push(c.conclusao_pratica);

  // Limitations from risco_vies
  const limitations: string[] = [];
  if (c?.risco_vies && c.risco_vies !== "baixo" && c.justificativa_risco_vies) {
    limitations.push(c.justificativa_risco_vies);
  }
  if (c?.tamanho_amostra_total != null && c.tamanho_amostra_total < 50) {
    limitations.push(`Amostra pequena (n=${c.tamanho_amostra_total}).`);
  }

  const hasContent = c != null;
  const needsReview = !c;

  const copyText = () => {
    const lines = [
      `📄 ${title}`,
      `📅 ${year || ""} • ${journal || ""}`,
      c?.tipo_estudo ? `🔬 ${c.tipo_estudo}` : "",
      c?.nivel_evidencia ? `📊 Nível de Evidência: ${c.nivel_evidencia}` : "",
      evidenceScore != null ? `📊 Evidence Score: ${evidenceScore}/100` : "",
      "",
      mainMessage ? `💡 ${mainMessage}` : "",
      "",
      ...picoLines.map(l => `  ${l}`),
      "",
      ...keyResults.slice(0, 3).map(r => `• ${r}`),
      "",
      ...applications.map(a => `🏥 ${a}`),
      "",
      ...limitations.map(l => `⚠️ ${l}`),
      "",
      "⚕️ Não substitui avaliação clínica formal.",
      isPublished ? `🛡️ ${EVIDENCE_METHOD_SEAL_TEXT}` : "",
    ].filter(Boolean).join("\n");
    navigator.clipboard.writeText(lines);
    toast.success("Ficha copiada para o clipboard!");
  };

  const copyShort = () => {
    const bullets = [
      mainMessage,
      ...keyResults.slice(0, 2),
      ...applications.slice(0, 1),
      ...limitations.slice(0, 1),
    ].filter(Boolean).slice(0, 6);

    const text = `${title} (${year || "?"}, ${c?.tipo_estudo || "?"})\n${bullets.map(b => `• ${b}`).join("\n")}`;
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
            <Button variant="ghost" size="sm" onClick={copyText} className="gap-1 text-xs" disabled={!hasContent}>
              <Copy className="w-3 h-3" /> Copiar para slide
            </Button>
            <Button variant="ghost" size="sm" onClick={copyShort} className="gap-1 text-xs" disabled={!hasContent}>
              <ClipboardCopy className="w-3 h-3" /> Versão resumida
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {needsReview && (
          <div className="flex items-center gap-2 p-2 rounded border border-orange-500/30 bg-orange-500/10">
            <AlertTriangle className="w-4 h-4 text-orange-400 shrink-0" />
            <p className="text-xs text-orange-400">
              Curadoria não disponível. Ficha gerada com dados mínimos.
            </p>
            <Badge variant="outline" className="text-[10px] bg-orange-500/10 text-orange-400 border-orange-500/30 shrink-0">
              Requer revisão humana
            </Badge>
          </div>
        )}

        {/* Title & meta */}
        <div>
          <h3 className="font-semibold text-foreground text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">
            {authors && `${authors} • `}{year} • {journal}
          </p>
        </div>

        {/* Tags & scores */}
        <div className="flex flex-wrap gap-2">
          {c?.tipo_estudo && <Badge variant="secondary">{c.tipo_estudo}</Badge>}
          {c?.nivel_evidencia && (
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
              Nível {c.nivel_evidencia}
            </Badge>
          )}
          {evidenceScore != null && (
            <Badge variant="outline" className={getScoreColor(evidenceScore)}>
              Score: {evidenceScore}/100
            </Badge>
          )}
          {c?.tags?.slice(0, 4).map(t => (
            <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
          ))}
        </div>

        <Separator />

        {/* Main message */}
        {mainMessage && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Mensagem Principal</h4>
            <p className="text-sm text-foreground font-medium">{mainMessage}</p>
          </div>
        )}

        {/* PICO */}
        {picoLines.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">PICO</h4>
            <div className="space-y-0.5">
              {picoLines.map((l, i) => (
                <p key={i} className="text-sm text-foreground">{l}</p>
              ))}
            </div>
          </div>
        )}

        {/* Key results */}
        {keyResults.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Resultados-chave</h4>
            <ul className="space-y-0.5">
              {keyResults.slice(0, 3).map((r, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">✓</span> {r}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Clinical applications */}
        {applications.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Aplicações Clínicas</h4>
            <ul className="space-y-0.5">
              {applications.slice(0, 3).map((a, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">→</span> {a}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Limitations */}
        {limitations.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-1">Limitações</h4>
            <ul className="space-y-0.5">
              {limitations.slice(0, 2).map((l, i) => (
                <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                  <span className="text-orange-500 mt-1">⚠</span> {l}
                </li>
              ))}
            </ul>
          </div>
        )}

        <Separator />

        <div className="flex items-center justify-between">
          <p className="text-[10px] text-muted-foreground italic">
            ⚕️ Não substitui avaliação clínica formal.
          </p>
          {isPublished && <EvidenceMethodSeal />}
        </div>
      </CardContent>
    </Card>
  );
}
