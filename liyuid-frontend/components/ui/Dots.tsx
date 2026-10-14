import React from "react";

export interface DotsProps {
  total: number;
  used: number;
  labelTemplate?: (left: number) => string;
}

export function Dots({
  total,
  used,
  labelTemplate = (left) => `${left} attempts left`,
}: DotsProps) {
  const left = Math.max(0, total - used);

  return (
    <div
      className="flex items-center gap-1.5"
      role="status"
      aria-label={labelTemplate(left)}
    >
      {Array.from({ length: total }).map((_, i) => {
        const isRemaining = i >= used;
        return (
          <i
            key={i}
            className={`w-3 h-3 rounded-full transition-colors not-italic inline-block ${
              isRemaining ? "bg-ok" : "bg-line"
            }`}
          />
        );
      })}
    </div>
  );
}