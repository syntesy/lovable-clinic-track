import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ShieldX,
  Users,
  Loader2,
  ArrowLeft
} from "lucide-react";
import { usePendingEnrollments, useApproveEnrollment, useExpireEnrollment, useCanAccessApprovals } from "@/hooks/useApprovals";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

const ApprovalsPage = () => {
  const navigate = useNavigate();
  const { data: canAccess, isLoading: loadingAccess } = useCanAccessApprovals();
  const { data: enrollments = [], isLoading: loadingEnrollments } = usePendingEnrollments();
  const approveMutation = useApproveEnrollment();
  const expireMutation = useExpireEnrollment();

  const handleApprove = async (id: string) => {
    try {
      await approveMutation.mutateAsync(id);
      toast.success("Inscrição aprovada com sucesso!");
    } catch (error: any) {
      toast.error(error.message || "Erro ao aprovar inscrição");
    }
  };

  const handleExpire = async (id: string) => {
    try {
      await expireMutation.mutateAsync(id);
      toast.success("Inscrição expirada");
    } catch (error: any) {
      toast.error(error.message || "Erro ao expirar inscrição");
    }
  };

  if (loadingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center gap-4">
              <ShieldX className="h-12 w-12 text-destructive" />
              <h2 className="text-xl font-semibold">Acesso Negado</h2>
              <p className="text-muted-foreground">
                Esta área é restrita a mentores e administradores.
              </p>
              <Button variant="outline" onClick={() => navigate("/academy/home")}>
                Voltar para Academy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <section className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-12">
        <div className="container mx-auto px-4">
          <Button variant="ghost" onClick={() => navigate("/academy/home")} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Badge variant="secondary" className="mb-4">
            <Users className="w-3 h-3 mr-1" />
            Aprovações
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Painel de Aprovações
          </h1>
          <p className="text-lg text-muted-foreground">
            Gerencie as solicitações de inscrição pendentes.
          </p>
        </div>
      </section>

      <section className="py-8">
        <div className="container mx-auto px-4">
          {loadingEnrollments ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : enrollments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhuma aprovação pendente</h3>
                <p className="text-muted-foreground">
                  Todas as inscrições foram processadas.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <Card key={enrollment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <Badge 
                            variant="secondary" 
                            className={enrollment.status === 'pending_manual' 
                              ? "bg-blue-500/10 text-blue-600 border-blue-500/30" 
                              : "bg-amber-500/10 text-amber-600 border-amber-500/30"
                            }
                          >
                            <Clock className="w-3 h-3 mr-1" />
                            {enrollment.status === 'pending_manual' ? 'Reserva solicitada' : 'Pagamento pendente'}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-semibold text-foreground mb-1">
                          {enrollment.mentorship_title}
                        </h3>
                        <div className="text-sm text-muted-foreground space-y-1">
                          <p><strong>Aluno:</strong> {enrollment.user_name} ({enrollment.user_email})</p>
                          <p><strong>Mentor:</strong> {enrollment.mentor_name}</p>
                          <p><strong>Data:</strong> {format(new Date(enrollment.enrolled_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleApprove(enrollment.id)}
                          disabled={approveMutation.isPending}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Aprovar
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => handleExpire(enrollment.id)}
                          disabled={expireMutation.isPending}
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Expirar
                        </Button>
                      </div>
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

export default ApprovalsPage;
