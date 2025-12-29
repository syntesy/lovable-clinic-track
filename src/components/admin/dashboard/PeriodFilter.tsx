import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { PeriodType } from "@/hooks/useAdminDashboard";
import { DateRange } from "react-day-picker";

interface PeriodFilterProps {
  period: PeriodType;
  onPeriodChange: (period: PeriodType) => void;
  onCustomRangeChange: (range: { start: Date; end: Date } | null) => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

const periodLabels: Record<PeriodType, string> = {
  today: "Hoje",
  "7days": "Últimos 7 dias",
  "30days": "Últimos 30 dias",
  this_month: "Este mês",
  "3months": "Últimos 3 meses",
  this_year: "Este ano",
  custom: "Personalizado"
};

export function PeriodFilter({
  period,
  onPeriodChange,
  onCustomRangeChange,
  onRefresh,
  isLoading
}: PeriodFilterProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handlePeriodChange = (value: string) => {
    onPeriodChange(value as PeriodType);
    if (value !== "custom") {
      onCustomRangeChange(null);
    }
  };

  const handleApplyCustomRange = () => {
    if (dateRange?.from && dateRange?.to) {
      onCustomRangeChange({
        start: dateRange.from,
        end: dateRange.to
      });
      setIsCalendarOpen(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Select value={period} onValueChange={handlePeriodChange}>
        <SelectTrigger className="w-[180px] bg-background border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-card border-border">
          {Object.entries(periodLabels).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {period === "custom" && (
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="gap-2 bg-background border-border"
            >
              <CalendarIcon className="h-4 w-4" />
              {dateRange?.from ? (
                <>
                  {format(dateRange.from, "dd/MM/yy", { locale: ptBR })}
                  {" - "}
                  {dateRange.to ? format(dateRange.to, "dd/MM/yy", { locale: ptBR }) : "..."}
                </>
              ) : (
                "Selecionar datas"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-card border-border" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
              locale={ptBR}
            />
            <div className="p-3 border-t border-border flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCalendarOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleApplyCustomRange}
                disabled={!dateRange?.from || !dateRange?.to}
              >
                Aplicar
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={onRefresh}
        disabled={isLoading}
        className="bg-background border-border"
      >
        <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
      </Button>
    </div>
  );
}