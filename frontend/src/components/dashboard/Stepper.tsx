'use client';

import { Check } from 'lucide-react';

interface StepperProps {
  steps: string[];
  currentStep: number;
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="flex items-center justify-center w-full">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep;
        const isCurrent = index === currentStep;
        const isUpcoming = index > currentStep;

        return (
          <div key={step} className="flex items-center">
            {/* Step */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={`size-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all border ${
                  isCompleted
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : isCurrent
                      ? 'bg-blue-500/10 border-blue-500/50 text-blue-400'
                      : 'bg-white/[0.03] border-[#222222] text-gray-600'
                }`}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  isCurrent
                    ? 'text-white'
                    : isCompleted
                      ? 'text-blue-400'
                      : 'text-gray-600'
                }`}
              >
                {step}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-[2px] mx-3 mb-6 rounded-full transition-colors ${
                  isCompleted ? 'bg-blue-500/50' : 'bg-[#222222]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
