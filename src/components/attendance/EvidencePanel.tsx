import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Loader2, BookOpen, Search, ShieldCheck, CheckCircle, MessageSquare, Info } from "lucide-react";
import { EvidenceMethodSeal } from "@/components/academy/EvidenceMethodSeal";
import { EvidenceTimelineModal } from "@/components/attendance/EvidenceTimelineModal";
import { EvidenceCoherenceBadge } from "@/components/attendance/EvidenceCoherenceBadge";
import {
  useEvidenceLinks,
  useEvidenceSnapshots,
  useFetchEvidencePanel,
  useAskEvidenceQuestion,
  useSaveEvidenceSnapshot,
  type EvidencePanelResult,
} from "@/hooks/useReghenEvidence";

interface EvidencePanelProps {
  attendanceId: string;
  topicKey: string | null;
  isClosed: boolean;
}

function CoherenceBadgeWrapper({ snapshots, panelResult }: { snapshots: any[]; panelResult: EvidencePanelResult | null }) {
  const hasInsufficient = useMemo(() => {
    // Check snapshots for insufficient evidence
    const fromSnapshots = snapshots.some((s: any) =>
      s.answer_md?.toLowerCase().includes("insuficiente")
    );
    // Check panel result
    const fromPanel = panelResult?.short_summary?.toLowerCase().includes("insuficiente") ?? false;
    return fromSnapshots || fromPanel;
  }, [snapshots, panelResult]);

  return (
    <EvidenceCoherenceBadge
      snapshotCount={snapshots.length}
      hasInsufficientEvidence={hasInsufficient}
    />
  );
}

export function EvidencePanel({ attendanceId, topicKey, isClosed }: EvidencePanelProps) {
  const [panelResult, setPanelResult] = useState<EvidencePanelResult | null>(null);
  const [question, setQuestion] = useState("");
  const [answerResult, setAnswerResult] = useState<any>(null);

  const { data: snapshots = [], isLoading: loadingSnapshots } = useEvidenceSnapshots(attendanceId);
  const fetchPanel = useFetchEvidencePanel();
  const askQuestion = useAskEvidenceQuestion();
  const saveSnapshot = useSaveEvidenceSnapshot();

  const handleLoadPanel = useCallback(async () => {
    if (!topicKey) return;
    const result = await fetchPanel.mutateAsync({ attendanceId, topicKey });
    setPanelResult(result);
  }, [attendanceId, topicKey, fetchPanel]);

  const handleAsk = useCallback(async () => {
    if (!topicKey || !question.trim()) return;
    const result = await askQuestion.mutateAsync({
      attendanceId,
      topicKey,
      question: question.trim(),
    });
    setAnswerResult(result);
    setQuestion("");
  }, [attendanceId, topicKey, question, askQuestion]);

  const handleApplyToCase = useCallback(async () => {
    if (!topicKey || !panelResult) return;
    await saveSnapshot.mutateAsync({
      attendanceId,
      topicKey,
      retrievalMode: "auto_panel",
      papers: panelResult.papers,
      evidenceProfile: panelResult.evidence_profile,
      answerMd: panelResult.short_summary,
    });
  }, [attendanceId, topicKey, panelResult, saveSnapshot]);

  if (!topicKey) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BookOpen className="w-4 h-4" />
            Evidência
          </CardTitle>
          <EvidenceMethodSeal size="sm" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Selecione patologia e intervenção para visualizar evidência científica.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Coherence Badge */}
      <CoherenceBadgeWrapper snapshots={snapshots} panelResult={panelResult} />

      {/* Evidence Panel */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <BookOpen className="w-4 h-4" />
              Evidência
            </CardTitle>
            <div className="flex items-center gap-2">
              <EvidenceMethodSeal size="sm" />
              {snapshots.length > 0 && (
                <EvidenceTimelineModal snapshots={snapshots} attendanceId={attendanceId} />
              )}
            </div>
          </div>
          <CardDescription>
            Tópico: <span className="font-medium text-foreground">{topicKey}</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Load panel button */}
          {!panelResult && (
            <Button
              variant="outline"
              onClick={handleLoadPanel}
              disabled={fetchPanel.isPending}
              className="w-full"
            >
              {fetchPanel.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Buscando evidência...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar Evidência Científica
                </>
              )}
            </Button>
          )}

          {/* Panel results */}
          {panelResult && (
            <div className="space-y-4">
              {/* Summary */}
              {panelResult.short_summary && (
                <div className="rounded-lg border bg-muted/30 p-3">
                  <p className="text-sm">{panelResult.short_summary}</p>
                </div>
              )}

              {/* Papers list */}
              {panelResult.papers.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">
                    Top {panelResult.papers.length} artigos
                  </p>
                  {panelResult.papers.map((paper: any, i: number) => (
                    <div
                      key={paper.paper_id || i}
                      className="rounded-md border p-3 text-sm space-y-1"
                    >
                      <p className="font-medium leading-tight">{paper.title}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {paper.year && (
                          <Badge variant="outline" className="text-[10px]">
                            {paper.year}
                          </Badge>
                        )}
                        {paper.journal && (
                          <Badge variant="outline" className="text-[10px]">
                            {paper.journal}
                          </Badge>
                        )}
                        {paper.study_type && (
                          <Badge variant="secondary" className="text-[10px]">
                            {paper.study_type}
                          </Badge>
                        )}
                        {paper.evidence_score != null && (
                          <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">
                            Score: {paper.evidence_score}
                          </Badge>
                        )}
                        {paper.applicability && (
                          <Badge variant="outline" className="text-[10px]">
                            {paper.applicability}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                {!isClosed && (
                  <Button
                    size="sm"
                    onClick={handleApplyToCase}
                    disabled={saveSnapshot.isPending}
                  >
                    {saveSnapshot.isPending ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-1" />
                    )}
                    Aplicar ao Caso
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setPanelResult(null)}
                >
                  Atualizar
                </Button>
              </div>
            </div>
          )}

          {/* Ask a question */}
          {!isClosed && (
            <div className="border-t pt-4 space-y-2">
              <p className="text-sm font-medium flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5" />
                Fazer uma pergunta
              </p>
              <div className="flex gap-2">
                <Input
                  placeholder="Ex: Qual o follow-up médio dos estudos?"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAsk()}
                  disabled={askQuestion.isPending}
                />
                <Button
                  size="sm"
                  onClick={handleAsk}
                  disabled={askQuestion.isPending || !question.trim()}
                >
                  {askQuestion.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Perguntar"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Answer result */}
          {answerResult?.answer_md && (
            <div className="border-t pt-4">
              <div className="rounded-lg border bg-muted/30 p-3">
                <p className="text-xs font-medium text-muted-foreground mb-2">
                  Resposta (salva automaticamente)
                </p>
                <div className="text-sm whitespace-pre-wrap">{answerResult.answer_md}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Snapshots History */}
      {snapshots.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                Evidência vinculada a este atendimento
              </CardTitle>
              <EvidenceMethodSeal size="sm" />
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {snapshots.map((snap) => (
              <div key={snap.id} className="rounded-md border p-3 text-sm space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <Badge variant="outline" className="text-[10px]">
                    {snap.topic_key}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(snap.created_at).toLocaleString("pt-BR")}
                  </span>
                </div>
                {snap.query_text && (
                  <p className="text-xs text-muted-foreground italic">
                    Pergunta: {snap.query_text}
                  </p>
                )}
                {snap.answer_md && (
                  <p className="text-xs line-clamp-3">{snap.answer_md}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {(snap.papers as any[])?.slice(0, 3).map((p: any, i: number) => (
                    <Badge key={i} variant="secondary" className="text-[9px]">
                      {p.title?.slice(0, 40)}...
                    </Badge>
                  ))}
                  {(snap.papers as any[])?.length > 3 && (
                    <Badge variant="outline" className="text-[9px]">
                      +{(snap.papers as any[]).length - 3}
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {/* Disclaimer */}
            <div className="flex items-start gap-2 rounded-lg bg-muted/30 p-3">
              <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground italic">
                Esta evidência é uma ferramenta de apoio à decisão clínica.
                Não substitui a avaliação presencial nem o julgamento profissional.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
