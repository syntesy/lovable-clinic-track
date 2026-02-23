import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  Stethoscope,
  Calendar,
  ShieldCheck,
  FileText,
  Briefcase,
  BookOpen,
  Target,
  Link as LinkIcon,
  AlertTriangle,
} from "lucide-react";
import {
  useTeacherApplications,
  useApproveTeacherApplication,
  useRejectTeacherApplication,
  useRequestChangesTeacherApplication,
  useIsAcademyAdmin,
} from "@/hooks/useAcademyRoles";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Pendente", variant: "secondary" },
  approved: { label: "Aprovado", variant: "default" },
  rejected: { label: "Rejeitado", variant: "destructive" },
  needs_changes: { label: "Ajustes", variant: "outline" },
};

const TeacherApprovalsPage = () => {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAcademyAdmin();
  const [statusFilter, setStatusFilter] = useState("pending");
  const { data: applications = [], isLoading } = useTeacherApplications(statusFilter);
  const approveMutation = useApproveTeacherApplication();
  const rejectMutation = useRejectTeacherApplication();
  const requestChangesMutation = useRequestChangesTeacherApplication();

  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; id: string; userId: string }>({ open: false, id: "", userId: "" });
  const [changesDialog, setChangesDialog] = useState<{ open: boolean; id: string }>({ open: false, id: "" });
  const [notes, setNotes] = useState("");

  if (checkingAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-muted rounded w-1/4" />
            <div className="h-64 bg-muted rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso restrito</h2>
            <p className="text-muted-foreground mb-4">
              Esta página é acessível apenas para administradores do Academy.
            </p>
            <Button onClick={() => navigate("/academy")}>Voltar ao Academy</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl">
            <Button variant="ghost" size="sm" onClick={() => navigate('/academy/home')} className="mb-4 -ml-2 gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Button>
            <Badge variant="secondary" className="mb-4">
              <Users className="w-3 h-3 mr-1" />
              Painel Admin Academy
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Candidaturas de Professores
            </h1>
            <p className="text-lg text-muted-foreground">
              Revise e aprove os candidatos a professor do REGEN Academy.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-6">
            <TabsList>
              <TabsTrigger value="pending">Pendentes</TabsTrigger>
              <TabsTrigger value="approved">Aprovados</TabsTrigger>
              <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
              <TabsTrigger value="needs_changes">Ajustes</TabsTrigger>
              <TabsTrigger value="all">Todas</TabsTrigger>
            </TabsList>
          </Tabs>

          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="py-6">
                    <div className="flex gap-4">
                      <div className="flex-1 space-y-2">
                        <div className="h-6 bg-muted rounded w-1/3" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : applications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhuma candidatura encontrada</h3>
                <p className="text-muted-foreground">
                  Não há candidaturas com o filtro selecionado.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {applications.length} candidatura{applications.length !== 1 ? 's' : ''}
              </p>

              {applications.map((app) => {
                const status = statusLabels[app.status] || statusLabels.pending;
                return (
                  <Card key={app.id}>
                    <CardContent className="py-6">
                      <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-foreground">{app.full_name}</h3>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />{app.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Stethoscope className="w-3 h-3" />{app.professional_registration}
                            </span>
                            <span className="flex items-center gap-1">
                              <Target className="w-3 h-3" />{app.clinical_area}
                            </span>
                            <span className="flex items-center gap-1">
                              <Briefcase className="w-3 h-3" />{app.experience_years} anos
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(app.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <Separator className="my-4" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-1 flex items-center gap-1">
                            <BookOpen className="w-3 h-3" /> Formação
                          </h4>
                          <p className="text-sm text-muted-foreground">{app.formation}</p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-1 flex items-center gap-1">
                            <FileText className="w-3 h-3" /> Proposta de Curso
                          </h4>
                          <p className="text-sm font-medium text-foreground">{app.course_proposal_title}</p>
                          <p className="text-sm text-muted-foreground mt-1">{app.course_proposal_summary}</p>
                          <p className="text-xs text-muted-foreground mt-1">Público: {app.course_proposal_audience}</p>
                        </div>
                      </div>

                      {app.links && Object.keys(app.links).length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                          {Object.entries(app.links).map(([key, url]) => (
                            <a
                              key={key}
                              href={url as string}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline flex items-center gap-1"
                            >
                              <LinkIcon className="w-3 h-3" /> {key}
                            </a>
                          ))}
                        </div>
                      )}

                      {app.observations && (
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-foreground mb-1">Observações</h4>
                          <p className="text-sm text-muted-foreground">{app.observations}</p>
                        </div>
                      )}

                      {app.review_notes && (
                        <div className="mb-4 p-3 bg-muted rounded-lg">
                          <h4 className="text-sm font-medium text-foreground mb-1">Notas da revisão</h4>
                          <p className="text-sm text-muted-foreground">{app.review_notes}</p>
                        </div>
                      )}

                      {/* Actions */}
                      {app.status === 'pending' || app.status === 'needs_changes' ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            onClick={() => approveMutation.mutate({ applicationId: app.id, userId: app.user_id })}
                            disabled={approveMutation.isPending}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Aprovar
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setNotes("");
                              setChangesDialog({ open: true, id: app.id });
                            }}
                          >
                            <AlertTriangle className="w-4 h-4 mr-2" />
                            Solicitar Ajustes
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setNotes("");
                              setRejectDialog({ open: true, id: app.id, userId: app.user_id });
                            }}
                            className="border-red-500/30 text-red-600 hover:bg-red-500/10"
                          >
                            <XCircle className="w-4 h-4 mr-2" />
                            Rejeitar
                          </Button>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Reject Dialog */}
      <Dialog open={rejectDialog.open} onOpenChange={(open) => setRejectDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeitar candidatura</DialogTitle>
            <DialogDescription>Informe o motivo da rejeição (opcional).</DialogDescription>
          </DialogHeader>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Motivo..."
            rows={3}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialog({ open: false, id: "", userId: "" })}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={rejectMutation.isPending}
              onClick={() => {
                rejectMutation.mutate({ applicationId: rejectDialog.id, userId: rejectDialog.userId, notes });
                setRejectDialog({ open: false, id: "", userId: "" });
              }}
            >
              Confirmar rejeição
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Changes Dialog */}
      <Dialog open={changesDialog.open} onOpenChange={(open) => setChangesDialog(prev => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Solicitar ajustes</DialogTitle>
            <DialogDescription>Descreva os ajustes necessários.</DialogDescription>
          </DialogHeader>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Descreva os ajustes necessários..."
            rows={4}
            required
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangesDialog({ open: false, id: "" })}>Cancelar</Button>
            <Button
              disabled={requestChangesMutation.isPending || !notes.trim()}
              onClick={() => {
                requestChangesMutation.mutate({ applicationId: changesDialog.id, notes });
                setChangesDialog({ open: false, id: "" });
              }}
            >
              Enviar solicitação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherApprovalsPage;
