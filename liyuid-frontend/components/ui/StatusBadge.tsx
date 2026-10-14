import React from "react";
import { CheckCircle2, Clock, Lock, ShieldAlert } from "lucide-react";

export interface StatusBadgeProps {
  variant: "ok" | "pending" | "locked" | "private";
  children: React.ReactNode;
}

export function StatusBadge({ variant, children }: StatusBadgeProps) {
  const configs = {
    ok: {
      className: "bg-okbg text-ok",
      icon: <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />,
    },
    pending: {
      className: "bg-warnbg text-warn",
      icon: <Clock className="w-3.5 h-3.5 stroke-[2.5]" />,
    },
    locked: {
      className: "bg-badbg text-bad",
      icon: <Lock className="w-3.5 h-3.5 stroke-[2.5]" />,
    },
    private: {
      className: "bg-bar text-card",
      icon: <ShieldAlert className="w-3.5 h-3.5 stroke-[2.5]" />,
    },
  };

  const current = configs[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-semibold tracking-normal ${current.className}`}
    >
      {current.icon}
      {children}
    </span>
  );
}