"use client";

import React from "react";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface StaffMetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon?: LucideIcon;
  badge?: string;
  badgeColor?: string;
}

export function StaffMetricCard({
  label,
  value,
  subtext,
  icon: Icon,
  badge,
  badgeColor = "text-[#087FF5] bg-[#EBF5FF] border-[#B9E1FD]",
}: StaffMetricCardProps) {
  return (
    <Card className="bg-white border-[#e2eaf4] shadow-xs p-5 flex flex-col gap-2 rounded-2xl">
      <div className="flex items-center justify-between">
        <span className="text-[#64748B] text-xs font-bold uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <div className="w-8 h-8 rounded-xl bg-[#F0F7FF] flex items-center justify-center text-[#087FF5]">
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>

      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl sm:text-3xl font-extrabold text-[#062B72]">{value}</span>
        {badge && (
          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${badgeColor}`}>
            {badge}
          </span>
        )}
      </div>

      {subtext && (
        <span className="text-[11px] text-[#64748B] font-medium">{subtext}</span>
      )}
    </Card>
  );
}

