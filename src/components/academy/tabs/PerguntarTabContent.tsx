import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Send, Brain, ExternalLink, AlertTriangle, RotateCcw, FileSearch } from "lucide-react";
import { useAcademyRag, type RagCitation, type EvidenceSnippet } from "@/hooks/useAcademyRag";
import { EvidenceMethodSeal } from "@/components/academy/EvidenceMethodSeal";

export default function PerguntarTabContent() {
  const [question, setQuestion] = useState("");
  const { ask, isLoading, result, error, reset } = useAcademyRag();
  const [snippetsPaperId, setSnippetsPaperId] = useState<string | null>(null);

  const handleSubmit = () => {
    if (question.trim().length < 5) return;
    ask(question.trim());
  };

  const snippetsForPaper = snippetsPaperId
    ? (result?.evidence_snippets || []).filter((s) => s.paper_id === snippetsPaperId)
    : [];

  const snippetPaperTitle = snippetsPaperId
    ? result?.citations.find((c) => c.paper_id === snippetsPaperId)?.title || ""
    : "";

  return (
    <section className="py-8">
      <div className="container mx-auto px-4 max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Brain className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Perguntar à IA</h2>
          </div>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Faça perguntas sobre evidência científica. As respostas são baseadas exclusivamente nos artigos publicados na biblioteca.
          </p>
        </div>

        {/* Input */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <Textarea
              placeholder="Ex: Qual a evidência sobre PRP no tratamento de artrose de joelho?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-[100px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Pressione Enter para enviar • Shift+Enter para nova linha
              </p>
              <div className="flex gap-2">
                {result && (
                  <Button variant="outline" size="sm" onClick={() => { reset(); setQuestion(""); }} className="gap-1">
                    <RotateCcw className="w-3 h-3" /> Nova pergunta
                  </Button>
                )}
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || question.trim().length < 5}
                  className="gap-2"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Perguntar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading */}
        {isLoading && (
          <div className="flex flex-col items-center py-12 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Buscando evidência e gerando resposta…</p>
          </div>
        )}

        {/* Error */}
        {error && !isLoading && (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="py-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">Erro ao processar pergunta</p>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Result */}
        {result && !isLoading && (
          <div className="space-y-6">
            {/* Answer */}
            <Card>
              <CardContent className="py-6">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-4 h-4 text-primary" />
                  <span className="text-sm font-semibold text-foreground">Resposta da IA</span>
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                    Baseado em {result.citations.length} artigo(s)
                  </Badge>
                </div>
                <div className="prose prose-sm max-w-none dark:prose-invert text-foreground">
                  <MarkdownRenderer content={result.answer_md} />
                </div>
              </CardContent>
            </Card>

            {/* Citations */}
            {result.citations.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" /> Artigos Citados
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {result.citations.map((c) => {
                    const hasSnippets = (result.evidence_snippets || []).some((s) => s.paper_id === c.paper_id);
                    return (
                      <CitationCard
                        key={c.paper_id}
                        citation={c}
                        hasSnippets={hasSnippets}
                        onViewSnippets={() => setSnippetsPaperId(c.paper_id)}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
              <p className="italic">
                ⚕️ Esta síntese é baseada exclusivamente nos estudos disponíveis na biblioteca e não substitui avaliação clínica individual. As respostas não constituem prescrição ou recomendação terapêutica.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Snippets modal */}
      <Dialog open={!!snippetsPaperId} onOpenChange={(o) => !o && setSnippetsPaperId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base leading-tight">Trechos Utilizados</DialogTitle>
            <p className="text-sm text-muted-foreground line-clamp-2">{snippetPaperTitle}</p>
          </DialogHeader>
          <div className="space-y-3 max-h-[50vh] overflow-y-auto">
            {snippetsForPaper.map((s, i) => (
              <div key={i} className="rounded-lg border border-border p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">Similaridade: {(s.similarity * 100).toFixed(1)}%</Badge>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.snippet}</p>
              </div>
            ))}
            {snippetsForPaper.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum trecho disponível.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function CitationCard({
  citation,
  hasSnippets,
  onViewSnippets,
}: {
  citation: RagCitation;
  hasSnippets: boolean;
  onViewSnippets: () => void;
}) {
  const link = citation.pmid
    ? `https://pubmed.ncbi.nlm.nih.gov/${citation.pmid}`
    : citation.doi
    ? `https://doi.org/${citation.doi}`
    : null;

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardContent className="py-3 px-4">
        <h4 className="text-sm font-medium text-foreground line-clamp-2 mb-1">{citation.title}</h4>
        <p className="text-xs text-muted-foreground">
          {citation.year || "N/A"} • {citation.journal || "N/A"}
        </p>
        <div className="flex gap-1.5 mt-2 flex-wrap">
          {citation.pmid && (
            <Badge variant="outline" className="text-[10px]">PMID: {citation.pmid}</Badge>
          )}
          {link && (
            <a href={link} target="_blank" rel="noopener noreferrer">
              <Badge variant="outline" className="text-[10px] cursor-pointer hover:bg-muted gap-0.5">
                <ExternalLink className="w-2.5 h-2.5" /> Abrir
              </Badge>
            </a>
          )}
          {hasSnippets && (
            <Button variant="ghost" size="sm" className="h-5 px-1.5 text-[10px] gap-0.5" onClick={onViewSnippets}>
              <FileSearch className="w-2.5 h-2.5" /> Ver trechos usados
            </Button>
          )}
        </div>
        <EvidenceMethodSeal className="mt-2" />
      </CardContent>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MarkdownRenderer({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;
        if (trimmed === "---") return <hr key={i} className="border-border my-4" />;
        if (trimmed.startsWith("## "))
          return <h2 key={i} className="text-base font-semibold text-foreground mt-4 mb-2" dangerouslySetInnerHTML={{ __html: formatInline(trimmed.slice(3)) }} />;
        if (trimmed.startsWith("# "))
          return <h1 key={i} className="text-lg font-bold text-foreground mt-4 mb-2" dangerouslySetInnerHTML={{ __html: formatInline(trimmed.slice(2)) }} />;
        if (trimmed.startsWith("- ") || trimmed.startsWith("* "))
          return <li key={i} className="ml-4 text-sm text-muted-foreground list-disc" dangerouslySetInnerHTML={{ __html: formatInline(trimmed.slice(2)) }} />;
        if (/^\d+\.\s/.test(trimmed))
          return <li key={i} className="ml-4 text-sm text-muted-foreground list-decimal" dangerouslySetInnerHTML={{ __html: formatInline(trimmed.replace(/^\d+\.\s/, "")) }} />;
        return <p key={i} className="text-sm text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: formatInline(trimmed) }} />;
      })}
    </div>
  );
}

function formatInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>");
}
