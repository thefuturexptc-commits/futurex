import React from 'react';

type CheckoutStep = 'address' | 'verify' | 'payment';

interface CheckoutStepperProps {
  current: CheckoutStep;
}

const steps: Array<{ key: CheckoutStep; label: string }> = [
  { key: 'address', label: 'Address' },
  { key: 'verify', label: 'Verify Phone' },
  { key: 'payment', label: 'Payment' },
];

export const CheckoutStepper: React.FC<CheckoutStepperProps> = ({ current }) => {
  const currentIndex = steps.findIndex((step) => step.key === current);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-2 sm:gap-4">
        {steps.map((step, idx) => {
          const active = idx <= currentIndex;
          const isCurrent = step.key === current;
          return (
            <React.Fragment key={step.key}>
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    active ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-400'
                  }`}
                >
                  {idx + 1}
                </div>
                <span
                  className={`text-xs sm:text-sm font-semibold ${
                    isCurrent ? 'text-primary-600 dark:text-primary-400' : 'text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-0.5 flex-1 ${idx < currentIndex ? 'bg-primary-600' : 'bg-gray-200 dark:bg-white/10'}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
