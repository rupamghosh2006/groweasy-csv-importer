'use client';

import type { Step } from '@/lib/types';
import { FiCheck } from 'react-icons/fi';

const steps: { key: Step; label: string }[] = [
  { key: 'upload', label: 'Upload' },
  { key: 'preview', label: 'Preview' },
  { key: 'confirm', label: 'Confirm' },
  { key: 'result', label: 'Result' },
];

export default function StepIndicator({ current }: { current: Step }) {
  const currentIndex = steps.findIndex((s) => s.key === current);

  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-xl mx-auto mb-8">
      {steps.map((step, idx) => {
        const state =
          idx < currentIndex ? 'completed' : idx === currentIndex ? 'active' : 'pending';
        return (
          <div key={step.key} className="flex items-center flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                  state === 'completed'
                    ? 'bg-[#294744] text-white'
                    : state === 'active'
                    ? 'bg-[#294744] text-white ring-4 ring-[#294744]/20'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }`}
              >
                {state === 'completed' ? <FiCheck className="w-4 h-4" /> : idx + 1}
              </div>
              <span
                className={`text-sm font-medium hidden sm:inline ${
                  state === 'active'
                    ? 'text-[#294744] dark:text-[#4a9e9a]'
                    : state === 'completed'
                    ? 'text-[#294744] dark:text-[#4a9e9a]'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-3 ${
                  idx < currentIndex
                    ? 'bg-[#294744]'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
