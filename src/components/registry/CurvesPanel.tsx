import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PainCurvePoint, RegistryCaseSummary } from '@/types/registry-analytics';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface CurvesPanelProps {
  cohortCurve: PainCurvePoint[];
  selectedCase?: RegistryCaseSummary;
  caseCurve?: PainCurvePoint[];
  loading: boolean;
}

export function CurvesPanel({ cohortCurve, selectedCase, caseCurve, loading }: CurvesPanelProps) {
  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="h-6 bg-muted rounded w-40" />
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const hasData = cohortCurve.some(p => p.pain !== null);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Curvas de Dor e Função</CardTitle>
        <CardDescription>
          {selectedCase 
            ? 'Caso individual vs. média da coorte' 
            : 'Média da coorte filtrada ao longo do tempo'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4 bg-muted/50 border-muted">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Registry data for descriptive analysis only. Not a comparative clinical trial.
          </AlertDescription>
        </Alert>

        {!hasData ? (
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Sem dados suficientes para exibir curvas
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="timepoint" 
                type="category"
                allowDuplicatedCategory={false}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                domain={[0, 10]} 
                label={{ value: 'Dor (NRS)', angle: -90, position: 'insideLeft', fontSize: 12 }}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  borderColor: 'hsl(var(--border))' 
                }}
                formatter={(value: number | null) => value !== null ? value.toFixed(1) : '—'}
              />
              <Legend />
              
              {/* Cohort average curve */}
              <Line
                data={cohortCurve}
                type="monotone"
                dataKey="pain"
                name="Média Coorte (Dor)"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))' }}
                connectNulls
              />

              {/* Individual case curve (if selected) */}
              {selectedCase && caseCurve && (
                <Line
                  data={caseCurve}
                  type="monotone"
                  dataKey="pain"
                  name="Caso Selecionado"
                  stroke="hsl(var(--destructive))"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: 'hsl(var(--destructive))' }}
                  connectNulls
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
