import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, DollarSign, RefreshCw, AlertTriangle, Loader2, Search, RotateCcw } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  paid: "bg-green-500/10 text-green-600",
  pending: "bg-yellow-500/10 text-yellow-600",
  refunded: "bg-blue-500/10 text-blue-600",
  disputed: "bg-red-500/10 text-red-600",
  failed: "bg-red-500/10 text-red-600",
  canceled: "bg-muted text-muted-foreground",
};

const AcademyFinancialAdmin = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  // Orders
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ["admin-academy-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_orders" as any)
        .select("*, academy_products(title, type, teacher_id)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Subscriptions
  const { data: subscriptions = [], isLoading: loadingSubs } = useQuery({
    queryKey: ["admin-academy-subscriptions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_subscriptions" as any)
        .select("*, academy_products(title, type)")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Disputes
  const { data: disputes = [] } = useQuery({
    queryKey: ["admin-academy-disputes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_disputes" as any)
        .select("*, academy_orders(user_id, product_id, amount_cents)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Webhook failures
  const { data: failures = [] } = useQuery({
    queryKey: ["admin-webhook-failures"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("academy_webhook_failures" as any)
        .select("*")
        .eq("status", "failed")
        .order("failed_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as any[];
    },
  });

  // Reconcile
  const reconcile = useMutation({
    mutationFn: async (userId?: string | undefined) => {
      const { data, error } = await supabase.functions.invoke("reconcile-academy-access", {
        body: { userId: userId || null },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["admin-academy-orders"] });
      qc.invalidateQueries({ queryKey: ["admin-academy-subscriptions"] });
      toast.success(`Reconciliação concluída: ${data?.fixes_count || 0} correções`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Reprocess event
  const reprocess = useMutation({
    mutationFn: async (stripeEventId: string) => {
      const { data, error } = await supabase.functions.invoke("reprocess-stripe-event", {
        body: { stripeEventId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-webhook-failures"] });
      toast.success("Evento reprocessado com sucesso");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const filteredOrders = search
    ? orders.filter((o: any) => o.id?.includes(search) || o.user_id?.includes(search) || o.academy_products?.title?.toLowerCase().includes(search.toLowerCase()))
    : orders;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <Button variant="ghost" className="mb-4" onClick={() => navigate("/academy/home")}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <DollarSign className="w-7 h-7 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Admin Financeiro</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => reconcile.mutate()}
            disabled={reconcile.isPending}
          >
            {reconcile.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Reconciliar Todos
          </Button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-foreground">{orders.filter((o: any) => o.status === "paid").length}</p>
              <p className="text-xs text-muted-foreground">Pagos</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-foreground">{orders.filter((o: any) => o.status === "refunded").length}</p>
              <p className="text-xs text-muted-foreground">Reembolsados</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-foreground">{disputes.length}</p>
              <p className="text-xs text-muted-foreground">Disputas</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-foreground">{failures.length}</p>
              <p className="text-xs text-muted-foreground">Webhooks Falhos</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="orders" className="space-y-4">
          <TabsList>
            <TabsTrigger value="orders">Pedidos</TabsTrigger>
            <TabsTrigger value="refunds">Reembolsos</TabsTrigger>
            <TabsTrigger value="subscriptions">Assinaturas</TabsTrigger>
            <TabsTrigger value="disputes">Disputas</TabsTrigger>
            <TabsTrigger value="failures">Webhooks</TabsTrigger>
          </TabsList>

          {/* ORDERS */}
          <TabsContent value="orders" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por ID, user_id ou produto..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
            </div>
            {loadingOrders ? <p className="text-muted-foreground">Carregando...</p> : (
              <div className="space-y-2">
                {filteredOrders.map((order: any) => (
                  <Card key={order.id}>
                    <CardContent className="flex items-center gap-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground text-sm truncate">{order.academy_products?.title || order.product_id}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.id.slice(0, 8)}... · {new Date(order.created_at).toLocaleDateString("pt-BR")} · User: {order.user_id?.slice(0, 8)}...
                        </p>
                      </div>
                      <span className="text-sm font-medium">R$ {(order.amount_cents / 100).toFixed(2)}</span>
                      <Badge className={`text-xs ${statusColors[order.status] || ""}`}>{order.status}</Badge>
                    </CardContent>
                  </Card>
                ))}
                {filteredOrders.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhum pedido encontrado</p>}
              </div>
            )}
          </TabsContent>

          {/* REFUNDS */}
          <TabsContent value="refunds" className="space-y-2">
            {orders.filter((o: any) => o.status === "refunded").map((order: any) => (
              <Card key={order.id}>
                <CardContent className="flex items-center gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{order.academy_products?.title || "Produto"}</p>
                    <p className="text-xs text-muted-foreground">
                      Pedido: {order.id.slice(0, 8)}... · User: {order.user_id?.slice(0, 8)}... · {new Date(order.updated_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <span className="text-sm font-medium">R$ {(order.amount_cents / 100).toFixed(2)}</span>
                  <Badge className="bg-blue-500/10 text-blue-600 text-xs">Reembolsado</Badge>
                </CardContent>
              </Card>
            ))}
            {orders.filter((o: any) => o.status === "refunded").length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum reembolso encontrado</p>
            )}
          </TabsContent>

          {/* SUBSCRIPTIONS */}
          <TabsContent value="subscriptions" className="space-y-2">
            {loadingSubs ? <p className="text-muted-foreground">Carregando...</p> : subscriptions.map((sub: any) => (
              <Card key={sub.id}>
                <CardContent className="flex items-center gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{sub.academy_products?.title || "Produto"}</p>
                    <p className="text-xs text-muted-foreground">
                      User: {sub.user_id?.slice(0, 8)}... · Período até: {sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString("pt-BR") : "—"}
                    </p>
                  </div>
                  <Badge className={`text-xs ${sub.status === "active" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                    {sub.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* DISPUTES */}
          <TabsContent value="disputes" className="space-y-2">
            {disputes.map((d: any) => (
              <Card key={d.id} className="border-destructive/30">
                <CardContent className="flex items-center gap-4 py-3">
                  <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">Disputa: {d.stripe_dispute_id}</p>
                    <p className="text-xs text-muted-foreground">
                      Order: {d.order_id?.slice(0, 8)}... · R$ {(d.amount_cents / 100).toFixed(2)} · {new Date(d.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <Badge className={`text-xs ${d.status === "won" ? "bg-green-500/10 text-green-600" : d.status === "lost" ? "bg-red-500/10 text-red-600" : "bg-yellow-500/10 text-yellow-600"}`}>
                    {d.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
            {disputes.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma disputa</p>}
          </TabsContent>

          {/* WEBHOOK FAILURES */}
          <TabsContent value="failures" className="space-y-2">
            {failures.map((f: any) => (
              <Card key={f.id}>
                <CardContent className="flex items-center gap-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm">{f.event_type}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {f.stripe_event_id} · {f.error_message?.slice(0, 80)} · {new Date(f.failed_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={reprocess.isPending}
                    onClick={() => reprocess.mutate(f.stripe_event_id)}
                  >
                    <RotateCcw className="w-3 h-3 mr-1" /> Reprocessar
                  </Button>
                </CardContent>
              </Card>
            ))}
            {failures.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Nenhuma falha pendente</p>}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AcademyFinancialAdmin;
