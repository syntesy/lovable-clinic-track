import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RegistryMetrics } from '@/types/registry-analytics';
import { 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  HelpCircle 
} from 'lucide-react';

interface MetricsCardsProps {
  metrics: RegistryMetrics | null;
  loading: boolean;
}

export function MetricsCards({ metrics, loading }: MetricsCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-muted rounded w-20" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!metrics) {
    return null;
  }

  const cards = [
    {
      title: 'Total de Casos',
      value: metrics.totalCases,
      icon: Users,
      color: 'text-primary',
      suffix: '',
    },
    {
      title: 'D90 Completo',
      value: metrics.d90CompletionRate,
      icon: CheckCircle2,
      color: 'text-green-500',
      suffix: '%',
    },
    {
      title: 'Perdidos',
      value: metrics.missedRate,
      icon: AlertTriangle,
      color: 'text-amber-500',
      suffix: '%',
    },
    {
      title: 'Robustos',
      value: metrics.robustRate,
      icon: TrendingUp,
      color: 'text-green-600',
      suffix: '%',
    },
    {
      title: 'Moderados',
      value: metrics.moderateRate,
      icon: Minus,
      color: 'text-yellow-500',
      suffix: '%',
    },
    {
      title: 'Não Resp.',
      value: metrics.nonResponderRate,
      icon: TrendingDown,
      color: 'text-red-500',
      suffix: '%',
    },
    {
      title: 'Inconclusivo',
      value: metrics.inconclusiveRate,
      icon: HelpCircle,
      color: 'text-gray-400',
      suffix: '%',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Icon className={`h-3 w-3 ${card.color}`} />
                {card.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${card.color}`}>
                {card.value}
                <span className="text-sm font-normal">{card.suffix}</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
