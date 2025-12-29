import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LucideIcon, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  title: string;
  icon: LucideIcon;
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  onRowClick?: (item: T) => void;
  actionButton?: {
    label: string;
    onClick: () => void;
  };
}

export function DataTable<T extends Record<string, any>>({
  title,
  icon: Icon,
  data,
  columns,
  emptyMessage = "Nenhum item encontrado",
  onRowClick,
  actionButton
}: DataTableProps<T>) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </CardTitle>
        {actionButton && (
          <Button
            variant="outline"
            size="sm"
            onClick={actionButton.onClick}
            className="gap-1"
          >
            {actionButton.label}
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {data.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
            {emptyMessage}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                {columns.map((col) => (
                  <TableHead
                    key={String(col.key)}
                    className={cn("text-muted-foreground text-xs", col.className)}
                  >
                    {col.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((item, idx) => (
                <TableRow
                  key={idx}
                  className={cn(
                    "border-border",
                    onRowClick && "cursor-pointer hover:bg-muted/50"
                  )}
                  onClick={() => onRowClick?.(item)}
                >
                  {columns.map((col) => (
                    <TableCell
                      key={String(col.key)}
                      className={cn("text-sm py-3", col.className)}
                    >
                      {col.render
                        ? col.render(item)
                        : String(item[col.key as keyof T] || "-")}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// Helper components for common cell types
export function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    open: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    in_progress: "bg-purple-500/10 text-purple-500 border-purple-500/20",
    resolved: "bg-green-500/10 text-green-500 border-green-500/20",
    closed: "bg-muted text-muted-foreground border-border",
    solicitada: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
    em_analise: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    em_producao: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  };

  const labels: Record<string, string> = {
    open: "Aberto",
    pending: "Pendente",
    in_progress: "Em andamento",
    resolved: "Resolvido",
    closed: "Fechado",
    solicitada: "Solicitada",
    em_analise: "Em análise",
    em_producao: "Em produção",
  };

  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", styles[status] || "")}
    >
      {labels[status] || status}
    </Badge>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const styles: Record<string, string> = {
    low: "bg-slate-500/10 text-slate-500 border-slate-500/20",
    normal: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    high: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    urgent: "bg-red-500/10 text-red-500 border-red-500/20",
  };

  const labels: Record<string, string> = {
    low: "Baixa",
    normal: "Normal",
    high: "Alta",
    urgent: "Urgente",
  };

  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium", styles[priority] || "")}
    >
      {labels[priority] || priority}
    </Badge>
  );
}