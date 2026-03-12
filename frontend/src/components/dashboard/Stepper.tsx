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

        return (
          <div key={step} className="flex items-center">
            {/* Step */}
            <div className="flex flex-col items-center gap-2">
              <div
                className={`size-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all border ${
                  isCompleted
                    ? 'text-white'
                    : isCurrent
                      ? 'bg-[#C17B4F]/10 border-[#C17B4F]/50 text-[#D4A574]'
                      : 'bg-white/[0.03] border-[#222222] text-gray-600'
                }`}
                style={
                  isCompleted
                    ? { background: '#5c9e53', borderColor: '#5c9e53', boxShadow: '0 0 18px rgba(92, 158, 83, 0.35)' }
                    : isCurrent
                      ? { boxShadow: '0 0 20px rgba(193, 123, 79, 0.35), 0 0 8px rgba(193, 123, 79, 0.2)' }
                      : undefined
                }
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
                    : 'text-gray-600'
                }`}
                style={isCompleted ? { color: '#7ab872' } : undefined}
              >
                {step}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-[2px] mx-3 mb-6 rounded-full ${
                  isCompleted
                    ? 'stepper-connector-completed'
                    : isCurrent
                      ? 'stepper-connector-active'
                      : 'stepper-connector-upcoming'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
