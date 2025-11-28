import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Activity, TrendingUp, Calendar } from "lucide-react";

const Dashboard = () => {
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data: patients, error } = await supabase
        .from("patients")
        .select("*");

      if (error) throw error;

      const active = patients?.filter((p) => p.status === "active").length || 0;
      const discharged =
        patients?.filter((p) => p.status === "discharged").length || 0;

      const totalSessions = patients?.reduce(
        (acc, p) => acc + (p.total_sessions || 0),
        0
      );
      const avgSessions =
        discharged > 0 ? Math.round(totalSessions / discharged) : 0;

      const avgTreatmentDays =
        discharged > 0
          ? Math.round(
              patients
                ?.filter((p) => p.status === "discharged")
                .reduce((acc, p) => acc + (p.total_treatment_days || 0), 0) /
                discharged
            )
          : 0;

      return {
        total: patients?.length || 0,
        active,
        discharged,
        avgSessions,
        avgTreatmentDays,
      };
    },
  });

  const cards = [
    {
      title: "Total de Pacientes",
      value: stats?.total || 0,
      icon: Users,
      description: "Cadastrados no sistema",
    },
    {
      title: "Pacientes Ativos",
      value: stats?.active || 0,
      icon: Activity,
      description: "Em tratamento",
    },
    {
      title: "Média de Sessões",
      value: stats?.avgSessions || 0,
      icon: TrendingUp,
      description: "Por paciente concluído",
    },
    {
      title: "Tempo Médio",
      value: `${stats?.avgTreatmentDays || 0} dias`,
      icon: Calendar,
      description: "Até alta",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-foreground mb-2">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral dos tratamentos e resultados
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <Card key={card.title} className="border-border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              <card.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {card.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border shadow-sm">
        <CardHeader>
          <CardTitle>Distribuição de Resultados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Gráficos serão implementados conforme dados forem coletados
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
