'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StepIndicatorProps {
  currentStep: number
  totalSteps: number
  steps: string[]
  stepLabel: string
  ofLabel: string
}

export function StepIndicator({
  currentStep,
  totalSteps,
  steps,
  stepLabel,
  ofLabel,
}: StepIndicatorProps) {
  return (
    <div className="w-full">
      {/* Mobile header view */}
      <div className="flex items-center justify-between text-sm sm:hidden">
        <span className="font-semibold text-primary">
          {stepLabel} {currentStep} {ofLabel} {totalSteps}
        </span>
        <span className="font-medium text-foreground">
          {steps[currentStep - 1]}
        </span>
      </div>

      {/* Progress bar line for mobile */}
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary sm:hidden">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>

      {/* Desktop stepper view */}
      <ol className="hidden items-center justify-between gap-2 sm:flex">
        {steps.map((label, i) => {
          const stepNumber = i + 1
          const isDone = stepNumber < currentStep
          const isCurrent = stepNumber === currentStep

          return (
            <li
              key={i}
              className={cn(
                'flex flex-1 items-center gap-2',
                i < steps.length - 1 && 'after:h-0.5 after:flex-1 after:bg-border',
                isDone && 'after:bg-primary',
              )}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'grid size-8 place-items-center rounded-full text-xs font-semibold transition-colors',
                    isDone && 'bg-primary text-primary-foreground',
                    isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                    !isDone && !isCurrent && 'border border-border bg-card text-muted-foreground',
                  )}
                >
                  {isDone ? <Check className="size-4 stroke-3" /> : stepNumber}
                </span>
                <span
                  className={cn(
                    'text-xs font-medium whitespace-nowrap',
                    isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
