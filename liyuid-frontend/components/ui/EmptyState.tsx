import React from "react";
import { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  text: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, text, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center text-center p-6 rounded-2xl border border-line bg-card gap-2 w-full">
      <div className="w-12 h-12 rounded-full bg-theirs flex items-center justify-center text-mute mb-2">
        <Icon className="w-6 h-6 stroke-[1.75]" />
      </div>
      <h3 className="text-base font-bold text-ink m-0">{title}</h3>
      <p className="text-sm text-mute m-0 max-w-[260px] leading-relaxed">{text}</p>
      {action ? <div className="mt-3 w-full max-w-[200px]">{action}</div> : null}
    </div>
  );
}