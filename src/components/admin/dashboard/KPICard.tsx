import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: string | number;
  variation?: number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  onClick?: () => void;
  badge?: {
    text: string;
    variant: "success" | "warning" | "error" | "info";
  };
}

export function KPICard({
  title,
  value,
  variation,
  subtitle,
  icon: Icon,
  iconColor = "text-primary",
  onClick,
  badge
}: KPICardProps) {
  const getVariationIcon = () => {
    if (variation === undefined) return null;
    if (variation > 0) return <TrendingUp className="h-3 w-3" />;
    if (variation < 0) return <TrendingDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getVariationColor = () => {
    if (variation === undefined) return "";
    if (variation > 0) return "text-green-500";
    if (variation < 0) return "text-red-500";
    return "text-muted-foreground";
  };

  const getBadgeStyles = () => {
    switch (badge?.variant) {
      case "success":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "warning":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "error":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      case "info":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      default:
        return "";
    }
  };

  return (
    <Card 
      className={cn(
        "bg-card border-border transition-all duration-200",
        onClick && "cursor-pointer hover:border-primary/50 hover:shadow-md"
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground font-medium mb-1">{title}</p>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            
            <div className="flex items-center gap-2 mt-2">
              {variation !== undefined && (
                <span className={cn("flex items-center gap-1 text-xs font-medium", getVariationColor())}>
                  {getVariationIcon()}
                  {Math.abs(variation)}%
                </span>
              )}
              {subtitle && (
                <span className="text-xs text-muted-foreground">{subtitle}</span>
              )}
            </div>

            {badge && (
              <span className={cn(
                "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border mt-2",
                getBadgeStyles()
              )}>
                {badge.text}
              </span>
            )}
          </div>
          
          <div className={cn("p-2.5 rounded-lg bg-muted/50", iconColor)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}