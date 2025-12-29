import { Alert as AlertType } from "@/hooks/useAdminDashboard";
import { AlertTriangle, AlertCircle, Info, XCircle, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertsWidgetProps {
  alerts: AlertType[];
  onAlertClick?: (action: string) => void;
}

export function AlertsWidget({ alerts, onAlertClick }: AlertsWidgetProps) {
  if (alerts.length === 0) return null;

  const getAlertIcon = (severity: AlertType["severity"]) => {
    switch (severity) {
      case "critical":
        return <XCircle className="h-4 w-4" />;
      case "error":
        return <AlertCircle className="h-4 w-4" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getAlertStyles = (severity: AlertType["severity"]) => {
    switch (severity) {
      case "critical":
        return "bg-red-500/10 border-red-500/30 text-red-400";
      case "error":
        return "bg-red-500/10 border-red-500/20 text-red-400";
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/20 text-yellow-400";
      default:
        return "bg-blue-500/10 border-blue-500/20 text-blue-400";
    }
  };

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={cn(
            "flex items-center justify-between p-3 rounded-lg border transition-all duration-200",
            getAlertStyles(alert.severity),
            alert.action && "cursor-pointer hover:opacity-80"
          )}
          onClick={() => alert.action && onAlertClick?.(alert.action)}
        >
          <div className="flex items-center gap-3">
            {getAlertIcon(alert.severity)}
            <span className="text-sm font-medium">{alert.message}</span>
          </div>
          {alert.action && (
            <ChevronRight className="h-4 w-4 opacity-60" />
          )}
        </div>
      ))}
    </div>
  );
}