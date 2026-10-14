"use client";

import React, { useMemo } from "react";
import { Button } from "./Button";

export interface CodeDisplayProps {
  code: string;
  secondsLeft: number;
  expired?: boolean;
  onRegenerate?: () => void;
  labels: {
    expiresIn: string;
    expiredLabel: string;
    regenerate: string;
  };
}

export function CodeDisplay({
  code,
  secondsLeft,
  expired = false,
  onRegenerate,
  labels,
}: CodeDisplayProps) {
  const isExpired = expired || secondsLeft <= 0;

  const formattedTime = useMemo(() => {
    if (isExpired) return labels.expiredLabel;
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  }, [secondsLeft, isExpired, labels.expiredLabel]);

  // Polite announcement only at critical thresholds (60s and 10s)
  const shouldAnnounce = secondsLeft === 60 || secondsLeft === 10;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div
        className={`w-full py-3.5 px-4 rounded-2xl bg-ink text-gold font-mono text-[36px] font-bold tracking-[0.14em] text-center select-all transition-opacity ${
          isExpired ? "opacity-35" : "opacity-100"
        }`}
      >
        {code}
      </div>

      <div className="text-center">
        <p className="text-sm text-mute m-0">
          {labels.expiresIn} <b className="text-ink font-semibold">{formattedTime}</b>
        </p>

        {shouldAnnounce ? (
          <span className="sr-only" aria-live="polite">
            {labels.expiresIn} {formattedTime}
          </span>
        ) : null}
      </div>

      {isExpired && onRegenerate ? (
        <Button variant="secondary" onClick={onRegenerate} className="mt-1">
          {labels.regenerate}
        </Button>
      ) : null}
    </div>
  );
}