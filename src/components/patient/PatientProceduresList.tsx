import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Calendar, Loader2 } from "lucide-react";

type PatientProcedureRow = {
  id: string;
  patient_id: string;
  procedure_type: string | null;
  procedure_name: string;
  procedure_date: string;
  notes: string | null;
  created_at: string;
};

type Props = {
  patientId: string;
};

export function PatientProceduresList({ patientId }: Props) {
  const { data: procedures = [], isLoading } = useQuery({
    queryKey: ["patient-procedures", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patient_procedures")
        .select("*")
        .eq("patient_id", patientId)
        .order("procedure_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as PatientProcedureRow[];
    },
    enabled: !!patientId,
  });

  if (isLoading) {
    return (
      <div className="text-muted-foreground text-center py-8">
        <Loader2 className="w-4 h-4 animate-spin inline-block mr-2" />
        Carregando procedimentos...
      </div>
    );
  }

  if (!procedures.length) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Nenhum procedimento registrado ainda</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {procedures.map((p) => (
        <Card key={p.id} className="border-border/50">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-sm font-medium">{p.procedure_name}</CardTitle>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <Calendar className="w-3 h-3" />
                  {format(new Date(p.procedure_date), "dd/MM/yyyy", { locale: ptBR })}
                </div>
              </div>
              {p.procedure_type && (
                <Badge variant="secondary" className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {p.procedure_type}
                </Badge>
              )}
            </div>
          </CardHeader>
          {p.notes && (
            <CardContent className="pt-0">
              <p className="text-sm text-foreground whitespace-pre-wrap">{p.notes}</p>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
}
