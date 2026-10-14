import React from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
}

export function Button({
  variant = "primary",
  loading = false,
  disabled,
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "w-full min-h-[48px] px-4 py-3 rounded-xl font-semibold text-[15px] transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed focus-visible:outline-3 focus-visible:outline-gold focus-visible:outline-offset-2";

  const variants = {
    primary: "bg-brand text-card hover:opacity-95 active:opacity-90",
    secondary: "bg-transparent border border-line text-ink hover:bg-theirs/40 active:bg-theirs/60",
    danger: "bg-bad text-card hover:opacity-95 active:opacity-90 border border-bad",
  };

  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <span className="inline-block w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : null}
      {children}
    </button>
  );
}