import { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { LucideIcon, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  icon: LucideIcon;
  iconClass?: string;
  isLoading?: boolean;
  onDetails?: () => void;
  detailsLabel?: string;
  children: ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  icon: Icon,
  iconClass = "text-primary",
  isLoading,
  onDetails,
  detailsLabel = "Ver detalhes",
  children,
  className,
}: MetricCardProps) {
  return (
    <Card className={cn("bg-card border-border flex flex-col", className)}>
      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <div className={cn("p-1.5 rounded-md bg-muted/50", iconClass)}>
            <Icon className="h-4 w-4" />
          </div>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
        </div>
        {onDetails && !isLoading && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={onDetails}
          >
            {detailsLabel}
            <ChevronRight className="h-3 w-3 ml-0.5" />
          </Button>
        )}
      </CardHeader>

      <CardContent className="flex-1">
        {isLoading ? <MetricCardSkeleton /> : children}
      </CardContent>
    </Card>
  );
}

export function MetricCardSkeleton() {
  return (
    <div className="space-y-2">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
}

/** Large primary value display */
export function MetricValue({
  value,
  unit,
  className,
}: {
  value: string | number | null;
  unit?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end gap-1", className)}>
      <span className="text-3xl font-bold text-foreground leading-none">
        {value ?? "—"}
      </span>
      {unit && value !== null && (
        <span className="text-sm text-muted-foreground mb-0.5">{unit}</span>
      )}
    </div>
  );
}

/** Small secondary stat row */
export function StatRow({
  label,
  value,
  valueClass,
}: {
  label: string;
  value: string | number;
  valueClass?: string;
}) {
  return (
    <div className="flex items-center justify-between text-sm mt-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("font-medium tabular-nums", valueClass)}>{value}</span>
    </div>
  );
}
