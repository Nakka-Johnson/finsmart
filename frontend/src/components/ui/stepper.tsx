import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface StepperProps {
  currentStep: number;
  children: React.ReactNode;
  className?: string;
}

interface StepProps {
  stepNumber: number;
  title: string;
  description?: string;
  isActive?: boolean;
  isCompleted?: boolean;
  isLast?: boolean;
}

const StepperContext = React.createContext<{ currentStep: number }>({ currentStep: 0 });

export function Stepper({ currentStep, children, className }: StepperProps) {
  const steps = React.Children.toArray(children);
  
  return (
    <StepperContext.Provider value={{ currentStep }}>
      <nav aria-label="Progress" className={cn('w-full', className)}>
        <ol role="list" className="flex items-center">
          {steps.map((step, index) => {
            if (!React.isValidElement<StepProps>(step)) return null;
            
            return React.cloneElement(step, {
              stepNumber: index + 1,
              isActive: currentStep === index + 1,
              isCompleted: currentStep > index + 1,
              isLast: index === steps.length - 1,
            });
          })}
        </ol>
      </nav>
    </StepperContext.Provider>
  );
}

export function Step({
  stepNumber,
  title,
  description,
  isActive = false,
  isCompleted = false,
  isLast = false,
}: StepProps) {
  return (
    <li className={cn('relative', !isLast && 'flex-1')}>
      <div className="flex items-center">
        {/* Step circle */}
        <div
          className={cn(
            'relative flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200',
            isCompleted && 'border-primary bg-primary text-primary-foreground',
            isActive && 'border-primary bg-background text-primary',
            !isActive && !isCompleted && 'border-muted-foreground/30 bg-background text-muted-foreground'
          )}
        >
          {isCompleted ? (
            <Check className="h-5 w-5" aria-hidden="true" />
          ) : (
            <span className="text-sm font-semibold">{stepNumber}</span>
          )}
        </div>

        {/* Step content */}
        <div className="ml-3 min-w-0">
          <p
            className={cn(
              'text-sm font-medium',
              isActive && 'text-primary',
              isCompleted && 'text-foreground',
              !isActive && !isCompleted && 'text-muted-foreground'
            )}
          >
            {title}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>

        {/* Connector line */}
        {!isLast && (
          <div className="ml-4 flex-1">
            <div
              className={cn(
                'h-0.5 w-full transition-colors duration-200',
                isCompleted ? 'bg-primary' : 'bg-muted-foreground/30'
              )}
            />
          </div>
        )}
      </div>
    </li>
  );
}

export { type StepperProps, type StepProps };
