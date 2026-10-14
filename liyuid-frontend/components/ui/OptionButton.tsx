import React from "react";

export interface OptionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
}

export function OptionButton({
  selected = false,
  disabled,
  children,
  className = "",
  ...props
}: OptionButtonProps) {
  return (
    <button
      {...props}
      type="button"
      disabled={disabled}
      aria-pressed={selected}
      className={`min-h-[56px] w-full p-2.5 rounded-xl border text-[13.5px] font-medium transition-all text-left flex items-center justify-between cursor-pointer focus-visible:outline-3 focus-visible:outline-gold focus-visible:outline-offset-2 ${
        selected
          ? "bg-ink text-bg border-ink"
          : "bg-card text-ink border-line hover:border-brand"
      } ${disabled ? "opacity-45 cursor-not-allowed" : ""} ${className}`}
    >
      <span className="leading-snug">{children}</span>
    </button>
  );
}