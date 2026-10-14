import React from "react";

export interface RedactionBarProps {
  width?: number | "full";
  label?: string;
  className?: string;
}

export function RedactionBar({
  width = 100,
  label = "hidden detail",
  className = "",
}: RedactionBarProps) {
  const style = width === "full" ? { width: "100%" } : { width: `${width}px` };

  return (
    <span
      role="img"
      aria-label={label}
      style={style}
      className={`inline-block h-[1.1em] bg-bar rounded-[3px] align-middle select-none transition-opacity ${className}`}
    />
  );
}