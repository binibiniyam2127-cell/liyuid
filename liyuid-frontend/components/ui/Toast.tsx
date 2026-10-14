import React from "react";
import { AlertCircle, CheckCircle2, Info } from "lucide-react";

export interface ToastProps {
  type?: "info" | "success" | "error";
  message: string;
}

export function Toast({ type = "info", message }: ToastProps) {
  const icons = {
    info: <Info className="w-5 h-5 text-brand shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-ok shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-bad shrink-0" />,
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-line bg-card shadow-sm text-ink text-[14px]"
    >
      {icons[type]}
      <span className="flex-1 font-medium">{message}</span>
    </div>
  );
}