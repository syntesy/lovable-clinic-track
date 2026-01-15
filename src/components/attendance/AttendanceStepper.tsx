import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { 
  Stethoscope, 
  Activity, 
  FlaskConical, 
  TestTube, 
  Paperclip, 
  ClipboardList, 
  FileText,
  Check
} from "lucide-react";
import { getVisibleSteps, AttendanceStepConfig } from "@/types/attendance";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'stethoscope': Stethoscope,
  'activity': Activity,
  'flask-conical': FlaskConical,
  'test-tube': TestTube,
  'paperclip': Paperclip,
  'clipboard-list': ClipboardList,
  'file-text': FileText,
};

interface AttendanceStepperProps {
  involvesOrthobiologics: boolean;
  currentStep: string;
  onStepChange: (stepId: string) => void;
  completedSteps?: string[];
  className?: string;
}

export function AttendanceStepper({
  involvesOrthobiologics,
  currentStep,
  onStepChange,
  completedSteps = [],
  className,
}: AttendanceStepperProps) {
  const visibleSteps = useMemo(
    () => getVisibleSteps(involvesOrthobiologics),
    [involvesOrthobiologics]
  );

  const currentIndex = visibleSteps.findIndex(s => s.id === currentStep);

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile: Vertical compact */}
      <div className="md:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 px-1">
          {visibleSteps.map((step, index) => {
            const Icon = iconMap[step.icon] || FileText;
            const isActive = step.id === currentStep;
            const isCompleted = completedSteps.includes(step.id);
            const isPast = index < currentIndex;

            return (
              <button
                key={step.id}
                onClick={() => onStepChange(step.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap transition-colors flex-shrink-0",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : isCompleted || isPast
                      ? "bg-muted text-foreground"
                      : "bg-muted/50 text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Icon className="w-4 h-4" />
                )}
                <span className="text-xs font-medium">{index + 1}</span>
              </button>
            );
          })}
        </div>
        <div className="mt-2 px-1">
          <p className="text-sm font-medium text-foreground">
            {visibleSteps[currentIndex]?.label}
          </p>
        </div>
      </div>

      {/* Desktop: Horizontal stepper */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {visibleSteps.map((step, index) => {
            const Icon = iconMap[step.icon] || FileText;
            const isActive = step.id === currentStep;
            const isCompleted = completedSteps.includes(step.id);
            const isPast = index < currentIndex;
            const isLast = index === visibleSteps.length - 1;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <button
                  onClick={() => onStepChange(step.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-2 rounded-lg transition-colors group",
                    isActive && "ring-2 ring-primary ring-offset-2"
                  )}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                      isActive 
                        ? "bg-primary text-primary-foreground" 
                        : isCompleted
                          ? "bg-green-500 text-white"
                          : isPast
                            ? "bg-muted text-foreground"
                            : "bg-muted/50 text-muted-foreground group-hover:bg-muted"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs text-center max-w-[100px] leading-tight",
                      isActive 
                        ? "font-medium text-foreground" 
                        : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </button>
                
                {!isLast && (
                  <div
                    className={cn(
                      "flex-1 h-0.5 mx-2",
                      isPast || isCompleted ? "bg-primary" : "bg-muted"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
