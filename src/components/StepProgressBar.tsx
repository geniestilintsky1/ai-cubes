import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WORKFLOW_STEPS, getStepIndex } from '@/lib/workflow';
import { useSession } from '@/context/SessionContext';

interface StepProgressBarProps {
  className?: string;
}

export function StepProgressBar({ className }: StepProgressBarProps) {
  const { state } = useSession();
  const currentIndex = getStepIndex(state.currentStep);

  return (
    <div className={cn("w-full py-4", className)}>
      <div className="flex items-center justify-between max-w-4xl mx-auto px-4">
        {WORKFLOW_STEPS.map((step, index) => {
          const isCompleted = state.completedSteps.includes(step.id);
          const isCurrent = state.currentStep === step.id;
          const isPast = index < currentIndex;

          return (
            <div key={step.id} className="flex items-center flex-1 last:flex-none">
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300",
                    isCompleted && "bg-accent text-accent-foreground",
                    isCurrent && !isCompleted && "bg-primary text-primary-foreground shadow-glow animate-pulse-slow",
                    !isCompleted && !isCurrent && "bg-secondary text-muted-foreground"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs mt-2 text-center max-w-[80px] hidden sm:block transition-colors",
                    isCurrent && "text-primary font-medium",
                    isCompleted && "text-accent",
                    !isCompleted && !isCurrent && "text-muted-foreground"
                  )}
                >
                  {step.title}
                </span>
              </div>

              {/* Connector line */}
              {index < WORKFLOW_STEPS.length - 1 && (
                <div className="flex-1 h-1 mx-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={cn(
                      "h-full transition-all duration-500 rounded-full",
                      (isCompleted || isPast) && "bg-accent w-full",
                      isCurrent && "bg-primary w-1/2",
                      !isCompleted && !isCurrent && !isPast && "w-0"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
