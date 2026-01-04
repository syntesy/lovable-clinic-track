import { Card, CardContent } from '@/components/ui/card';
import { ClipboardList, Syringe, CalendarCheck } from 'lucide-react';
import { DashboardCounters as CountersType } from '@/types/daily-dashboard';
import { cn } from '@/lib/utils';

interface DashboardCountersProps {
  counters: CountersType;
  activeFilter?: string;
  onFilterClick: (filter: 'avaliacao' | 'procedimento' | 'followup' | null) => void;
}

export function DashboardCounters({ counters, activeFilter, onFilterClick }: DashboardCountersProps) {
  const items = [
    {
      key: 'avaliacao' as const,
      label: 'Avaliações',
      count: counters.avaliacoes,
      icon: ClipboardList,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
    },
    {
      key: 'procedimento' as const,
      label: 'Procedimentos',
      count: counters.procedimentos,
      icon: Syringe,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
    },
    {
      key: 'followup' as const,
      label: 'Follow-ups',
      count: counters.followups,
      icon: CalendarCheck,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      borderColor: 'border-amber-200 dark:border-amber-800',
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeFilter === item.key;
        
        return (
          <Card
            key={item.key}
            className={cn(
              "cursor-pointer transition-all duration-200 hover:shadow-md",
              isActive && "ring-2 ring-primary ring-offset-2",
              item.bgColor
            )}
            onClick={() => onFilterClick(isActive ? null : item.key)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {item.label}
                  </p>
                  <p className={cn("text-3xl font-bold mt-1", item.color)}>
                    {item.count}
                  </p>
                </div>
                <div className={cn("p-3 rounded-full", item.bgColor)}>
                  <Icon className={cn("h-6 w-6", item.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
