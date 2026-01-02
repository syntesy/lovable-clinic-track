import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Check, X, AlertCircle, Crown, Star, Zap, Calendar } from "lucide-react";
import { format, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

type PlanType = "essencial" | "profissional" | "empresarial";
type SubscriptionStatus = "active" | "canceled" | "past_due" | "trial";

interface Plan {
  id: PlanType;
  name: string;
  price: number;
  priceNote?: string;
  billing: string;
  badge?: string;
  icon: React.ReactNode;
  features: string[];
  description: string;
  idealFor?: string;
  order: number;
}

interface Subscription {
  id: string;
  user_id: string;
  current_plan: PlanType;
  status: SubscriptionStatus;
  next_renewal_date: string | null;
  scheduled_plan_change: PlanType | null;
  scheduled_effective_date: string | null;
  created_at: string;
  updated_at: string;
}

interface BillingRecord {
  id: string;
  plan: string;
  amount: number;
  billing_date: string;
  status: string;
}

const PLANS: Plan[] = [
  {
    id: "essencial",
    name: "Essencial",
    price: 499.00,
    billing: "mensal",
    icon: <Zap className="h-6 w-6" />,
    order: 1,
    description: "Para profissionais que querem organizar a prática clínica com segurança.",
    idealFor: "Ideal para profissionais e clínicas de pequeno porte.",
    features: [
      "Triagem clínica estruturada",
      "Questionário clínico padronizado",
      "Organização do histórico do paciente",
      "Score de prontidão clínica",
      "Justificativas claras para cada resultado",
      "Inserção de exames laboratoriais",
      "Avaliação de prontidão biológica",
      "Follow-up D30, D90 e D180",
      "Histórico clínico rastreável",
      "Estrutura auditável"
    ]
  },
  {
    id: "profissional",
    name: "Profissional",
    price: 599.00,
    billing: "mensal",
    badge: "Mais indicado",
    icon: <Star className="h-6 w-6" />,
    order: 2,
    description: "Para clínicas que precisam acompanhar resultados com consistência.",
    idealFor: "Indicado para clínicas com foco em acompanhamento de resultados.",
    features: [
      "Tudo do Essencial, mais:",
      "Follow-up completo até D365",
      "Registry observacional (read-only)",
      "Análise longitudinal",
      "Comparabilidade entre casos",
      "Trajetória clínica visual",
      "Estrutura para clínicas",
      "Governança clínica avançada",
      "Histórico de regras e critérios"
    ]
  },
  {
    id: "empresarial",
    name: "Empresarial",
    price: 519.00,
    priceNote: "por usuário (3-9 usuários) ou R$ 459/usuário (10+)",
    billing: "mensal",
    badge: "Para equipes",
    icon: <Crown className="h-6 w-6" />,
    order: 3,
    description: "Um único plano para clínicas e redes, com valor ajustado conforme o tamanho da equipe.",
    features: [
      "Tudo do Profissional, mais:",
      "Gestão de múltiplos usuários",
      "Painel administrativo",
      "Relatórios consolidados",
      "Suporte prioritário",
      "Onboarding dedicado"
    ]
  }
];

const COMPARISON_FEATURES = [
  { name: "Triagem clínica estruturada", essencial: true, profissional: true, empresarial: true },
  { name: "Score de prontidão clínica", essencial: true, profissional: true, empresarial: true },
  { name: "Avaliação de prontidão biológica", essencial: true, profissional: true, empresarial: true },
  { name: "Follow-up D30, D90, D180", essencial: true, profissional: true, empresarial: true },
  { name: "Follow-up completo até D365", essencial: false, profissional: true, empresarial: true },
  { name: "Registry observacional", essencial: false, profissional: true, empresarial: true },
  { name: "Análise longitudinal", essencial: false, profissional: true, empresarial: true },
  { name: "Governança clínica avançada", essencial: false, profissional: true, empresarial: true },
  { name: "Gestão de múltiplos usuários", essencial: false, profissional: false, empresarial: true },
  { name: "Suporte prioritário", essencial: false, profissional: false, empresarial: true }
];

export default function Subscription() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingRecord[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [actionType, setActionType] = useState<"upgrade" | "downgrade" | "subscribe">("upgrade");
  const [processing, setProcessing] = useState(false);
  const [expandedPlans, setExpandedPlans] = useState<Set<PlanType>>(new Set());

  useEffect(() => {
    checkAuthAndLoadData();
  }, []);

  const checkAuthAndLoadData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    await loadSubscriptionData(user.id);
  };

  const loadSubscriptionData = async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      // Track view event
      await trackEvent("subscription_view", { current_plan: subscription?.current_plan });

      // Load subscription
      const { data: subData, error: subError } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (subError) throw subError;

      if (subData) {
        setSubscription(subData as Subscription);
      } else {
        // Create default subscription if none exists
        const defaultRenewal = addDays(new Date(), 30).toISOString();
        const { data: newSub, error: createError } = await supabase
          .from("subscriptions")
          .insert({
            user_id: userId,
            current_plan: "basic",
            status: "active",
            next_renewal_date: defaultRenewal
          })
          .select()
          .single();
        
        if (createError) throw createError;
        setSubscription(newSub as Subscription);
      }

      // Load billing history
      const { data: billingData } = await supabase
        .from("billing_history")
        .select("*")
        .eq("user_id", userId)
        .order("billing_date", { ascending: false })
        .limit(10);

      if (billingData) {
        setBillingHistory(billingData as BillingRecord[]);
      }
    } catch (err) {
      console.error("Error loading subscription:", err);
      setError("Não foi possível carregar sua assinatura.");
    } finally {
      setLoading(false);
    }
  };

  const trackEvent = async (eventName: string, eventData: Record<string, unknown>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("app_events").insert({
        user_id: user.id,
        event_name: eventName,
        event_data: { ...eventData, timestamp: new Date().toISOString() }
      });
    } catch (err) {
      console.error("Error tracking event:", err);
    }
  };

  const getPlanOrder = (planId: PlanType): number => {
    return PLANS.find(p => p.id === planId)?.order || 0;
  };

  const getButtonConfig = (planId: PlanType) => {
    if (!subscription) {
      return { text: "Assinar este plano", action: "subscribe" as const, disabled: false };
    }

    if (planId === subscription.current_plan) {
      return { text: "Plano atual", action: "subscribe" as const, disabled: true };
    }

    const currentOrder = getPlanOrder(subscription.current_plan);
    const targetOrder = getPlanOrder(planId);

    if (targetOrder > currentOrder) {
      return { text: "Fazer upgrade", action: "upgrade" as const, disabled: false };
    }
    
    return { text: "Fazer downgrade", action: "downgrade" as const, disabled: false };
  };

  const handlePlanClick = (plan: Plan) => {
    const config = getButtonConfig(plan.id);
    if (config.disabled) return;

    setSelectedPlan(plan);
    setActionType(config.action);
    setConfirmDialogOpen(true);

    trackEvent("subscription_click_change_plan", {
      current_plan: subscription?.current_plan,
      target_plan: plan.id,
      action: config.action
    });
  };

  const handleConfirmChange = async () => {
    if (!selectedPlan || !subscription) return;

    setProcessing(true);
    try {
      const effectiveDate = subscription.next_renewal_date 
        ? subscription.next_renewal_date 
        : addDays(new Date(), 30).toISOString();

      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          scheduled_plan_change: selectedPlan.id,
          scheduled_effective_date: effectiveDate,
          updated_at: new Date().toISOString()
        })
        .eq("id", subscription.id);

      if (updateError) throw updateError;

      await trackEvent("subscription_confirm_change_plan", {
        current_plan: subscription.current_plan,
        target_plan: selectedPlan.id,
        effective_date: effectiveDate
      });

      setSubscription({
        ...subscription,
        scheduled_plan_change: selectedPlan.id,
        scheduled_effective_date: effectiveDate
      });

      toast.success("Alteração agendada com sucesso. Ela será aplicada no próximo ciclo.");
      setConfirmDialogOpen(false);
    } catch (err) {
      console.error("Error updating subscription:", err);
      toast.error("Erro ao agendar alteração. Tente novamente.");
    } finally {
      setProcessing(false);
    }
  };

  const handleCancelScheduledChange = async () => {
    if (!subscription) return;

    try {
      const { error: updateError } = await supabase
        .from("subscriptions")
        .update({
          scheduled_plan_change: null,
          scheduled_effective_date: null,
          updated_at: new Date().toISOString()
        })
        .eq("id", subscription.id);

      if (updateError) throw updateError;

      await trackEvent("subscription_cancel_scheduled_change", {
        current_plan: subscription.current_plan
      });

      setSubscription({
        ...subscription,
        scheduled_plan_change: null,
        scheduled_effective_date: null
      });

      toast.success("Mudança agendada cancelada.");
    } catch (err) {
      console.error("Error canceling scheduled change:", err);
      toast.error("Erro ao cancelar mudança. Tente novamente.");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL"
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "dd/MM/yyyy", { locale: ptBR });
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    const configs = {
      active: { label: "Ativo", variant: "default" as const, className: "bg-green-100 text-green-800 border-green-200" },
      canceled: { label: "Cancelado", variant: "destructive" as const, className: "" },
      past_due: { label: "Pendente", variant: "secondary" as const, className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      trial: { label: "Trial", variant: "outline" as const, className: "" }
    };
    const config = configs[status];
    return <Badge variant={config.variant} className={config.className}>{config.label}</Badge>;
  };

  const togglePlanExpand = (planId: PlanType) => {
    const newExpanded = new Set(expandedPlans);
    if (newExpanded.has(planId)) {
      newExpanded.delete(planId);
    } else {
      newExpanded.add(planId);
    }
    setExpandedPlans(newExpanded);
  };

  const getCurrentPlanInfo = () => {
    if (!subscription) return null;
    return PLANS.find(p => p.id === subscription.current_plan);
  };

  const getScheduledPlanName = () => {
    if (!subscription?.scheduled_plan_change) return null;
    return PLANS.find(p => p.id === subscription.scheduled_plan_change)?.name;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-80 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <p className="text-lg text-muted-foreground">{error}</p>
          <Button onClick={() => checkAuthAndLoadData()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  const currentPlan = getCurrentPlanInfo();

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Plano & Assinatura
        </h1>
        <p className="text-muted-foreground">Gerencie sua assinatura do REGENAPP</p>
      </div>

      {/* Current Plan Card */}
      {subscription && currentPlan && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardDescription className="text-sm uppercase tracking-wide">Plano atual</CardDescription>
              {getStatusBadge(subscription.status)}
            </div>
            <CardTitle className="text-2xl flex items-center gap-2">
              {currentPlan.icon}
              {currentPlan.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xl font-semibold">
              {formatPrice(currentPlan.price)} <span className="text-sm font-normal text-muted-foreground">/ mês</span>
            </p>
            
            {subscription.next_renewal_date && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Próxima renovação: {formatDate(subscription.next_renewal_date)}
              </p>
            )}

            {subscription.scheduled_plan_change && (
              <Alert className="bg-amber-50 border-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-amber-800">
                  <span className="font-medium">Mudança agendada:</span> {currentPlan.name} → {getScheduledPlanName()}{" "}
                  {subscription.scheduled_effective_date && (
                    <>em {formatDate(subscription.scheduled_effective_date)}</>
                  )}
                  <Button 
                    variant="link" 
                    className="h-auto p-0 ml-2 text-amber-700"
                    onClick={handleCancelScheduledChange}
                  >
                    Cancelar mudança
                  </Button>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comparativo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Recurso</th>
                  <th className="text-center py-2 font-medium">Essencial</th>
                  <th className="text-center py-2 font-medium">Profissional</th>
                  <th className="text-center py-2 font-medium">Empresarial</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON_FEATURES.map((feature, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-2 text-muted-foreground">{feature.name}</td>
                    <td className="py-2 text-center">
                      {feature.essencial ? (
                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                    <td className="py-2 text-center">
                      {feature.profissional ? (
                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                    <td className="py-2 text-center">
                      {feature.empresarial ? (
                        <Check className="h-4 w-4 text-green-600 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Plan Selection */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Escolha seu plano</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => {
            const buttonConfig = getButtonConfig(plan.id);
            const isCurrentPlan = subscription?.current_plan === plan.id;
            const isExpanded = expandedPlans.has(plan.id);
            const visibleFeatures = isExpanded ? plan.features : plan.features.slice(0, 4);

            return (
              <Card 
                key={plan.id} 
                className={`relative ${isCurrentPlan ? "border-primary ring-1 ring-primary/20" : ""} ${plan.badge ? "border-primary/50" : ""}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground shadow-sm">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <CardHeader className="pt-6">
                  <div className="flex items-center gap-2">
                    {plan.icon}
                    <CardTitle>{plan.name}</CardTitle>
                  </div>
                  <CardDescription className="text-2xl font-bold text-foreground">
                    {formatPrice(plan.price)}
                    <span className="text-sm font-normal text-muted-foreground"> / mês</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ul className="space-y-2">
                    {visibleFeatures.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  {plan.features.length > 4 && (
                    <Button 
                      variant="link" 
                      className="h-auto p-0 text-sm"
                      onClick={() => togglePlanExpand(plan.id)}
                    >
                      {isExpanded ? "Ver menos" : "Ver mais"}
                    </Button>
                  )}

                  <Button 
                    className="w-full"
                    variant={buttonConfig.disabled ? "outline" : plan.id === "profissional" ? "default" : "secondary"}
                    disabled={buttonConfig.disabled}
                    onClick={() => handlePlanClick(plan)}
                  >
                    {buttonConfig.text}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Histórico de Cobranças</CardTitle>
        </CardHeader>
        <CardContent>
          {billingHistory.length > 0 ? (
            <div className="space-y-2">
              {billingHistory.map((record) => (
                <div key={record.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{format(new Date(record.billing_date), "MMMM yyyy", { locale: ptBR })}</p>
                    <p className="text-sm text-muted-foreground capitalize">{record.plan}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{formatPrice(record.amount)}</p>
                    <Badge variant={record.status === "paid" ? "default" : "secondary"} className="text-xs">
                      {record.status === "paid" ? "Pago" : "Pendente"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum registro de cobrança disponível.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Legal Footer */}
      <p className="text-xs text-muted-foreground text-center pb-4">
        O REGENAPP é uma ferramenta de apoio à decisão clínica, desenvolvida para profissionais habilitados, 
        com foco em prática segura e baseada em evidência. Não substitui julgamento profissional.
      </p>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar alteração de plano</DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p>
                Você está prestes a alterar seu plano para: <span className="font-semibold">{selectedPlan?.name}</span>
              </p>
              <p className="text-lg font-semibold">
                Valor: {selectedPlan && formatPrice(selectedPlan.price)} / mês
              </p>
              <p>A alteração será aplicada no próximo ciclo de cobrança.</p>
              {subscription?.next_renewal_date && (
                <p className="text-sm">
                  Data estimada de efetivação: {formatDate(subscription.next_renewal_date)}
                </p>
              )}
              <p className="text-xs text-muted-foreground pt-2">
                O REGENAPP é uma ferramenta de apoio à decisão clínica e não substitui o julgamento profissional.
              </p>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)} disabled={processing}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmChange} disabled={processing}>
              {processing ? "Processando..." : "Confirmar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
