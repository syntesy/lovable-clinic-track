import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RegistryMetrics } from '@/types/registry-analytics';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ResponderBreakdownProps {
  metrics: RegistryMetrics | null;
  loading: boolean;
}

const COLORS = {
  robust: '#22c55e',    // green-500
  moderate: '#eab308',  // yellow-500
  non: '#ef4444',       // red-500
  inconclusive: '#9ca3af', // gray-400
};

export function ResponderBreakdown({ metrics, loading }: ResponderBreakdownProps) {
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

  if (!metrics || metrics.totalCases === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Classificação de Resposta</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center text-muted-foreground">
            Sem dados disponíveis
          </div>
        </CardContent>
      </Card>
    );
  }

  const data = [
    { name: 'Robustos', value: metrics.robustRate, color: COLORS.robust },
    { name: 'Moderados', value: metrics.moderateRate, color: COLORS.moderate },
    { name: 'Não Respondedores', value: metrics.nonResponderRate, color: COLORS.non },
    { name: 'Inconclusivos', value: metrics.inconclusiveRate, color: COLORS.inconclusive },
  ].filter(d => d.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Classificação de Resposta</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              label={({ name, value }) => `${value}%`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => `${value}%`}
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))', 
                borderColor: 'hsl(var(--border))' 
              }}
            />
            <Legend 
              verticalAlign="bottom" 
              height={36}
              formatter={(value) => <span className="text-sm">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Thresholds legend */}
        <div className="mt-4 pt-4 border-t text-xs text-muted-foreground space-y-1">
          <p><span className="font-medium text-green-500">Robusto:</span> Δ Dor ≥ 4 ou Δ Função ≥ 30% em D90</p>
          <p><span className="font-medium text-yellow-500">Moderado:</span> Δ Dor ≥ 2 ou Δ Função ≥ 20% em D90</p>
          <p><span className="font-medium text-red-500">Não Resp.:</span> Não atinge critérios ou piora</p>
        </div>
      </CardContent>
    </Card>
  );
}
