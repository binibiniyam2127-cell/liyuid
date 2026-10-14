import React from "react";
import { Check } from "lucide-react";

export interface StepTrackerProps {
  steps: string[];
  currentIndex: number; // 0-based
}

export function StepTracker({ steps, currentIndex }: StepTrackerProps) {
  return (
    <div className="w-full py-2">
      <ol className="flex items-center justify-between gap-1 w-full m-0 p-0 list-none">
        {steps.map((label, idx) => {
          const isDone = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <li key={idx} className="flex-1 flex flex-col items-center gap-1.5 min-w-0">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold select-none border transition-colors ${
                  isDone
                    ? "bg-ok border-ok text-card"
                    : isCurrent
                    ? "bg-gold border-gold text-head"
                    : "bg-card border-line text-mute"
                }`}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : idx + 1}
              </div>
              <span
                className={`text-[11px] truncate w-full text-center ${
                  isCurrent ? "font-bold text-ink" : "text-mute"
                }`}
                title={label}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}