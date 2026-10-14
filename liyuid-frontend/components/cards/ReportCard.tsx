"use client";

import React from "react";
import Link from "next/link";
import { MapPin, Calendar, ArrowRight, Smartphone, Briefcase, Sparkles, ShieldCheck } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ItemResponse } from "@/lib/types";

interface ReportCardProps {
  item: ItemResponse;
  onScan?: (id: string) => void;
  scanning?: boolean;
}

export function ReportCard({ item, onScan, scanning = false }: ReportCardProps) {
  const isLost = item.type === "lost";
  const shortId = item.id.slice(0, 8);
  const title = [item.primary_color, item.brand, item.model, item.category].filter(Boolean).join(" ");

  const renderBadge = (status: string) => {
    switch (status) {
      case "matched":
        return (
          <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 text-xs font-bold flex items-center gap-1 border border-blue-200 dark:border-blue-800">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
            Matching
          </span>
        );
      case "verified":
      case "handover_pending":
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800">
            <ShieldCheck className="w-3.5 h-3.5" />
            Ready for Handover
          </span>
        );
      case "returned":
      case "resolved":
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs font-bold border border-emerald-200">
            Reunited 🎉
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 text-xs font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Searching
          </span>
        );
    }
  };

  return (
    <Card hoverable className="flex flex-col gap-3.5">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              isLost
                ? "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300"
                : "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300"
            }`}
          >
            {item.type}
          </span>
          <span className="text-xs text-slate-400 font-mono">#{shortId}</span>
        </div>
        {renderBadge(item.status)}
      </div>

      <div>
        <h3 className="text-sm font-extrabold text-slate-900 dark:text-white capitalize">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
          {item.public_description}
        </p>
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1">
          <MapPin className="w-3.5 h-3.5" />
          <span>{item.sub_city || "Addis Ababa"}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(item.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        {isLost && onScan && (
          <Button
            variant="secondary"
            onClick={() => onScan(item.id)}
            loading={scanning}
            className="flex-1 !min-h-[38px] text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1 text-blue-600" />
            Scan AI
          </Button>
        )}
        <Link href={`/matches?itemId=${item.id}`} className="flex-1">
          <Button variant="primary" className="w-full !min-h-[38px] text-xs font-bold">
            Matches
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}

