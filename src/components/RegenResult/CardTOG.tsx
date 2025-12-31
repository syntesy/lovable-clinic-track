/**
 * CARD E — TOG (Therapeutic Orientation Guidance)
 * Exibe orientações terapêuticas
 */

import { Lightbulb, ArrowUp, ArrowRight, ArrowDown, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TOGOutput, Guidance } from "@/types/regen-engine";
import { RESULT_MESSAGES, GUIDANCE_CATEGORY_LABELS, PRIORITY_LABELS } from "./types";

interface CardTOGProps {
  tog: TOGOutput | null;
  safetyBlocked?: boolean;
}

function GuidanceItem({ guidance }: { guidance: Guidance }) {
  const getPriorityIcon = () => {
    switch (guidance.priority) {
      case "high":
        return <ArrowUp className="h-4 w-4 text-red-500" />;
      case "medium":
        return <ArrowRight className="h-4 w-4 text-amber-500" />;
      default:
        return <ArrowDown className="h-4 w-4 text-blue-500" />;
    }
  };

  const getCategoryColor = () => {
    switch (guidance.category) {
      case "lifestyle":
        return "bg-purple-100 text-purple-700";
      case "medication":
        return "bg-blue-100 text-blue-700";
      case "nutrition":
        return "bg-green-100 text-green-700";
      case "preparation":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
      <div className="shrink-0 mt-0.5">{getPriorityIcon()}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap mb-1">
          <span className="font-medium text-sm">{guidance.title}</span>
          <Badge className={`text-xs ${getCategoryColor()}`}>
            {GUIDANCE_CATEGORY_LABELS[guidance.category] || guidance.category}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{guidance.description}</p>
      </div>
    </div>
  );
}

export function CardTOG({ tog, safetyBlocked = false }: CardTOGProps) {
  if (safetyBlocked) {
    return (
      <Card className="bg-muted/30 border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
            <Lightbulb className="h-5 w-5" />
            TOG — Orientações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            {RESULT_MESSAGES.NOT_CALCULATED}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!tog || tog.guidance.length === 0) {
    return (
      <Card className="bg-muted/30 border-muted">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-muted-foreground">
            <Lightbulb className="h-5 w-5" />
            TOG — Orientações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground italic">
            {RESULT_MESSAGES.NOT_AVAILABLE}
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by priority
  const highPriority = tog.guidance.filter(g => g.priority === "high");
  const mediumPriority = tog.guidance.filter(g => g.priority === "medium");
  const lowPriority = tog.guidance.filter(g => g.priority === "low");

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-primary" />
            TOG — Orientações
          </CardTitle>
          <div className="flex gap-2 text-xs">
            {highPriority.length > 0 && (
              <Badge variant="outline" className="bg-red-50 text-red-700">
                Alta: {highPriority.length}
              </Badge>
            )}
            {mediumPriority.length > 0 && (
              <Badge variant="outline" className="bg-amber-50 text-amber-700">
                Média: {mediumPriority.length}
              </Badge>
            )}
            {lowPriority.length > 0 && (
              <Badge variant="outline" className="bg-blue-50 text-blue-700">
                Baixa: {lowPriority.length}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* All guidance items sorted by priority */}
        {[...highPriority, ...mediumPriority, ...lowPriority].map((guidance, idx) => (
          <GuidanceItem key={idx} guidance={guidance} />
        ))}

        {/* Mandatory disclaimer */}
        <div className="mt-4 p-3 rounded-lg bg-muted/50 border">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-sm text-muted-foreground">
              {RESULT_MESSAGES.CLINICAL_DECISION}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
