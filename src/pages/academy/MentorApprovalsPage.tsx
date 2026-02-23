import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  Users, 
  CheckCircle2, 
  XCircle,
  Clock,
  Mail,
  Stethoscope,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  Pause,
  ChevronDown,
  FileSearch,
  ArrowLeft
} from "lucide-react";
import { 
  usePendingMentorApplications,
  useApproveMentor,
  useRejectMentor,
  useSuspendMentor,
} from "@/hooks/useMentorOnboarding";
import { useCanAccessApprovals } from "@/hooks/useApprovals";
import { CurationChecklistAdmin } from "@/components/academy/CurationChecklistAdmin";
import { MentorVerifiedBadge } from "@/components/academy/MentorVerifiedBadge";
import { useMentorCurationChecklist } from "@/hooks/useClinicalTaxonomies";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const MentorApprovalsPage = () => {
  const navigate = useNavigate();
  const { data: canAccess, isLoading: checkingAccess } = useCanAccessApprovals();
  const { data: applications = [], isLoading } = usePendingMentorApplications();
  const approveMutation = useApproveMentor();
  const rejectMutation = useRejectMentor();
  const suspendMutation = useSuspendMentor();

  if (checkingAccess) {
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

  if (!canAccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <ShieldCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Acesso restrito</h2>
            <p className="text-muted-foreground mb-4">
              Esta página é acessível apenas para administradores e mentores.
            </p>
            <Button onClick={() => navigate("/academy")}>
              Voltar ao Academy
            </Button>
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
              Aprovação de Mentores
            </Badge>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Candidaturas Pendentes
            </h1>
            <p className="text-lg text-muted-foreground">
              Revise e aprove os candidatos a mentor do REGEN Academy.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="py-6">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-muted rounded-full" />
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
                <h3 className="text-xl font-semibold mb-2">Nenhuma candidatura pendente</h3>
                <p className="text-muted-foreground">
                  Todas as candidaturas foram processadas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {applications.length} candidatura{applications.length !== 1 ? 's' : ''} pendente{applications.length !== 1 ? 's' : ''}
              </p>
              
              {applications.map((app) => (
                <Card key={app.id} className="border-blue-500/30">
                  <CardContent className="py-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      {/* Avatar & Basic Info */}
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar className="w-16 h-16 ring-2 ring-primary/20">
                          <AvatarImage src={app.photo_url || undefined} />
                          <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                            {app.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-foreground">
                            {app.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                            {app.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {app.email}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Stethoscope className="w-3 h-3" />
                              {app.specialty}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(app.created_at), "dd 'de' MMM, yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                          <Clock className="w-3 h-3 mr-1" />
                          Em análise
                        </Badge>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    {/* Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {app.formation && (
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-1">Formação</h4>
                          <p className="text-sm text-muted-foreground">{app.formation}</p>
                        </div>
                      )}
                      {app.clinical_areas && app.clinical_areas.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-1">Áreas de atuação</h4>
                          <div className="flex flex-wrap gap-1">
                            {app.clinical_areas.map((area, i) => (
                              <Badge key={i} variant="outline" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {app.bio && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-foreground mb-1">Bio clínica</h4>
                        <p className="text-sm text-muted-foreground">{app.bio}</p>
                      </div>
                    )}

                    {app.linkedin_url && (
                      <div className="mb-4">
                        <a 
                          href={app.linkedin_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline"
                        >
                          Ver LinkedIn / Currículo →
                        </a>
                      </div>
                    )}

                    {/* Curadoria Científica (Admin) */}
                    <Collapsible className="mb-4">
                      <CollapsibleTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-2 w-full justify-between">
                          <span className="flex items-center gap-2">
                            <FileSearch className="w-4 h-4" />
                            Curadoria Científica
                          </span>
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-4">
                        <CurationChecklistAdmin 
                          mentorId={app.id} 
                          mentorName={app.name}
                        />
                      </CollapsibleContent>
                    </Collapsible>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        onClick={() => approveMutation.mutate(app.id)}
                        disabled={approveMutation.isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Aprovar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => rejectMutation.mutate(app.id)}
                        disabled={rejectMutation.isPending}
                        className="border-red-500/30 text-red-600 hover:bg-red-500/10"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Rejeitar
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => suspendMutation.mutate(app.id)}
                        disabled={suspendMutation.isPending}
                      >
                        <Pause className="w-4 h-4 mr-2" />
                        Suspender
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default MentorApprovalsPage;
