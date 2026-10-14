import React, { useId } from "react";

export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
}

export function Field({ label, hint, error, id, className = "", ...props }: FieldProps) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const hintId = hint ? `${inputId}-hint` : undefined;
  const errorId = error ? `${inputId}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1 w-full">
      <label htmlFor={inputId} className="font-semibold text-[13.5px] text-ink">
        {label}
      </label>
      <input
        id={inputId}
        aria-describedby={describedBy}
        aria-invalid={Boolean(error)}
        className={`w-full min-h-[46px] px-3.5 py-2.5 rounded-[10px] border bg-card text-ink text-[15px] outline-none transition-colors border-line focus-visible:outline-3 focus-visible:outline-gold focus-visible:outline-offset-2 ${
          error ? "!border-bad" : "focus:border-brand"
        } ${className}`}
        {...props}
      />
      {hint && !error ? (
        <p id={hintId} className="text-mute text-[13px] m-0">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="text-bad text-[13px] font-medium m-0" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}