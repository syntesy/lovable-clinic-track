import { useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import { 
  Stethoscope, 
  FlaskConical, 
  ClipboardList, 
  FileText,
  Check,
  Paperclip
} from "lucide-react";
import { 
  getStepsForAttendance, 
  canAccessStep,
  isValidStep,
  type AttendanceStepId 
} from "@/domain/attendanceFlow";
import { STEP_UI_CONFIG } from "@/types/attendance";
import { toast } from "sonner";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  'stethoscope': Stethoscope,
  'flask-conical': FlaskConical,
  'clipboard-list': ClipboardList,
  'paperclip': Paperclip,
  'file-text': FileText,
};

interface AttendanceStepperProps {
  involvesOrthobiologics: boolean;
  currentStep: string;
  onStepChange: (stepId: AttendanceStepId) => void;
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
  // Use domain contract for steps
  const attendance = useMemo(() => ({ involves_orthobiologics: involvesOrthobiologics }), [involvesOrthobiologics]);
  
  const visibleSteps = useMemo(
    () => getStepsForAttendance(attendance),
    [attendance]
  );

  const currentIndex = visibleSteps.findIndex(s => s === currentStep);

  // Guarded step change handler
  const handleStepChange = useCallback((stepId: AttendanceStepId) => {
    if (!isValidStep(stepId)) {
      console.warn(`[AttendanceStepper] Invalid step: ${stepId}`);
      return;
    }
    
    if (!canAccessStep(stepId, attendance)) {
      toast.error("Esta etapa não está disponível para este tipo de atendimento.");
      return;
    }
    
    onStepChange(stepId);
  }, [attendance, onStepChange]);

  return (
    <div className={cn("w-full", className)}>
      {/* Mobile: Vertical compact */}
      <div className="md:hidden">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 px-1">
          {visibleSteps.map((stepId, index) => {
            const config = STEP_UI_CONFIG[stepId] || { label: stepId, icon: 'file-text' };
            const Icon = iconMap[config.icon] || FileText;
            const isActive = stepId === currentStep;
            const isCompleted = completedSteps.includes(stepId);
            const isPast = index < currentIndex;

            return (
              <button
                key={stepId}
                onClick={() => handleStepChange(stepId)}
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
            {currentIndex >= 0 ? STEP_UI_CONFIG[visibleSteps[currentIndex]]?.label : ''}
          </p>
        </div>
      </div>

      {/* Desktop: Horizontal stepper */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {visibleSteps.map((stepId, index) => {
            const config = STEP_UI_CONFIG[stepId] || { label: stepId, icon: 'file-text' };
            const Icon = iconMap[config.icon] || FileText;
            const isActive = stepId === currentStep;
            const isCompleted = completedSteps.includes(stepId);
            const isPast = index < currentIndex;
            const isLast = index === visibleSteps.length - 1;

            return (
              <div key={stepId} className="flex items-center flex-1">
                <button
                  onClick={() => handleStepChange(stepId)}
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
                    {config.label}
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
