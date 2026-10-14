import React from "react";

export interface SignalBarProps {
  label: string;
  value: number; // 0-100
}

export function SignalBar({ label, value }: SignalBarProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      className="grid grid-cols-[100px_1fr_42px] gap-2 items-center text-[13px] py-1"
      role="meter"
      aria-label={label}
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span className="text-ink truncate font-medium">{label}</span>
      <div className="h-2 rounded-full bg-line overflow-hidden w-full">
        <div
          className="h-full bg-brand transition-all duration-300"
          style={{ width: `${clamped}%` }}
        />
      </div>
      <span className="text-right font-semibold text-ink select-none">{clamped}%</span>
    </div>
  );
}