import React from "react";

export interface ScoreRingProps {
  value: number; // 0-100
  label: string;
}

export function ScoreRing({ value, label }: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div className="flex flex-col items-center gap-1.5" role="group" aria-label={`${label}: ${clamped}%`}>
      <div
        className="w-[84px] h-[84px] rounded-full grid place-items-center"
        style={{
          background: `conic-gradient(var(--ok) ${clamped}%, var(--line) 0)`,
        }}
      >
        <div className="w-[64px] h-[64px] rounded-full bg-card grid place-items-center text-ink font-bold text-xl select-none">
          {clamped}%
        </div>
      </div>
      <span className="text-[13px] font-medium text-mute text-center">{label}</span>
    </div>
  );
}