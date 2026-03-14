import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { DashboardPeriod, DateRange } from "@/hooks/useClinicalDashboard";
import { DateRange as RdpRange } from "react-day-picker";

const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  "7d":     "7 dias",
  "30d":    "30 dias",
  "90d":    "90 dias",
  "12m":    "12 meses",
  "custom": "Personalizado",
};

interface PeriodFilterProps {
  period: DashboardPeriod;
  onPeriodChange: (period: DashboardPeriod) => void;
  onCustomRangeChange: (range: DateRange) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function PeriodFilter({
  period,
  onPeriodChange,
  onCustomRangeChange,
  onRefresh,
  isLoading,
}: PeriodFilterProps) {
  const [rdpRange, setRdpRange] = useState<RdpRange | undefined>();
  const [calendarOpen, setCalendarOpen] = useState(false);

  function handleApply() {
    if (rdpRange?.from && rdpRange?.to) {
      onCustomRangeChange({ start: rdpRange.from, end: rdpRange.to });
      setCalendarOpen(false);
    }
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Preset buttons */}
      {(["7d", "30d", "90d", "12m"] as DashboardPeriod[]).map((p) => (
        <Button
          key={p}
          size="sm"
          variant={period === p ? "default" : "outline"}
          className={cn(
            "h-8 px-3 text-xs",
            period === p && "bg-primary text-primary-foreground"
          )}
          onClick={() => onPeriodChange(p)}
        >
          {PERIOD_LABELS[p]}
        </Button>
      ))}

      {/* Custom range picker */}
      <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
        <PopoverTrigger asChild>
          <Button
            size="sm"
            variant={period === "custom" ? "default" : "outline"}
            className={cn(
              "h-8 px-3 text-xs gap-1.5",
              period === "custom" && "bg-primary text-primary-foreground"
            )}
            onClick={() => {
              onPeriodChange("custom");
              setCalendarOpen(true);
            }}
          >
            <CalendarIcon className="h-3 w-3" />
            {period === "custom" && rdpRange?.from ? (
              <>
                {format(rdpRange.from, "dd/MM/yy", { locale: ptBR })}
                {" – "}
                {rdpRange.to ? format(rdpRange.to, "dd/MM/yy", { locale: ptBR }) : "..."}
              </>
            ) : (
              PERIOD_LABELS.custom
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
          <Calendar
            mode="range"
            selected={rdpRange}
            onSelect={setRdpRange}
            numberOfMonths={2}
            locale={ptBR}
          />
          <div className="p-3 border-t border-border flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setCalendarOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleApply} disabled={!rdpRange?.from || !rdpRange?.to}>
              Aplicar
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Refresh */}
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={onRefresh}
        disabled={isLoading}
      >
        <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
      </Button>
    </div>
  );
}
