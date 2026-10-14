"use client";

import React, { useState } from "react";
import {
  Clock,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Lock,
  AlertTriangle,
  User,
  GitCompare,
  FileText,
  ShieldCheck,
  Ban,
  Check,
  Sparkles,
} from "lucide-react";
import { FlagResponse } from "@/lib/types";

interface FlagCardProps {
  flag: FlagResponse;
  onResolve?: (flagId: string, action: "allow_retry" | "block" | "dismiss", notes?: string) => void;
  loading?: boolean;
}

export function FlagCard({ flag, onResolve, loading = false }: FlagCardProps) {
  const [note, setNote] = useState("");

  let categoryLabel = "Security Flag";
  let badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
  let CategoryIcon = ShieldAlert;

  const lower = (flag?.reason || "").toLowerCase();
  if (lower.includes("imposter") || lower.includes("fraud") || lower.includes("blocked")) {
    categoryLabel = "Blocked Imposter Fraud";
    badgeStyle = "bg-rose-50 text-rose-800 border-rose-300";
    CategoryIcon = Ban;
  } else if (lower.includes("failed")) {
    categoryLabel = "Failed Verification Lock";
    badgeStyle = "bg-orange-50 text-orange-700 border-orange-200";
    CategoryIcon = Lock;
  } else if (lower.includes("suspicious")) {
    categoryLabel = "Suspicious Activity Pattern";
    badgeStyle = "bg-rose-50 text-rose-700 border-rose-200";
    CategoryIcon = AlertTriangle;
  } else if (lower.includes("excessive")) {
    categoryLabel = "Excessive Rate Limit Anomaly";
    badgeStyle = "bg-purple-50 text-purple-700 border-purple-200";
    CategoryIcon = Clock;
  } else if (lower.includes("disputed")) {
    categoryLabel = "Disputed Ownership Claim";
    badgeStyle = "bg-amber-50 text-amber-700 border-amber-200";
    CategoryIcon = GitCompare;
  } else if (lower.includes("abuse")) {
    categoryLabel = "Content Policy Abuse";
    badgeStyle = "bg-red-50 text-red-700 border-red-200";
    CategoryIcon = XCircle;
  }

  const EntityIcon =
    flag.target_entity === "user"
      ? User
      : flag.target_entity === "match"
      ? GitCompare
      : FileText;

  return (
    <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-5 sm:p-6 flex flex-col gap-4 shadow-xs hover:border-[#cbd9e8] transition-all">
      {/* Top Meta Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border flex items-center gap-1.5 ${badgeStyle}`}>
            <CategoryIcon className="w-3.5 h-3.5" />
            <span>{categoryLabel}</span>
          </span>

          <span className="text-xs font-mono font-bold text-[#062B72] bg-[#F0F7FF] border border-[#B9E1FD] px-2.5 py-1 rounded-lg flex items-center gap-1.5">
            <EntityIcon className="w-3.5 h-3.5 text-[#087FF5]" />
            <span>{flag.target_entity.toUpperCase()}: {flag.entity_id.slice(0, 14)}...</span>
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-medium">
          <Clock className="w-3.5 h-3.5 text-[#94A3B8]" />
          <span>{new Date(flag.created_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>

      {/* Flag Reason Box */}
      <div className="bg-[#F8FAFC] border border-[#e2eaf4] p-4 rounded-xl">
        <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider block mb-1">
          Automated Flag Trigger Reason:
        </span>
        <p className="text-xs text-[#062B72] font-semibold leading-relaxed">
          {flag.reason}
        </p>
      </div>

      {/* Moderator Note Field */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-extrabold text-[#062B72]">
          Independent Investigation / Audit Notes:
        </label>
        <input
          type="text"
          placeholder="e.g., Contacted user by telephone / Verified student ID at Bole desk / False positive rate anomaly"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-3.5 py-2.5 rounded-xl border-2 border-[#cbd9e8] bg-white text-[#062B72] text-xs font-medium placeholder:text-[#94A3B8] outline-none focus:border-[#087FF5] transition-colors"
        />
      </div>

      {/* Rematch Directive Banner */}
      <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 font-semibold">
        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>
          <strong>Automated AI Re-Matching:</strong> Blocking or banning this entity permanently severs fraudulent ties and automatically releases any associated found property back into the active pool to re-trigger vector matching for the genuine owner.
        </span>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#f1f5f9]">
        <button
          type="button"
          onClick={() => onResolve?.(flag.id, "allow_retry", note)}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>Allow Retry / Clear Lock</span>
        </button>

        <button
          type="button"
          onClick={() => onResolve?.(flag.id, "block", note)}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl text-xs font-black bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
          title="Ban entity and automatically release associated item for AI re-matching"
        >
          <Ban className="w-4 h-4" />
          <span>Block & Auto-Rematch</span>
        </button>

        <button
          type="button"
          onClick={() => onResolve?.(flag.id, "dismiss", note)}
          disabled={loading}
          className="px-4 py-2.5 rounded-xl text-xs font-black bg-white hover:bg-slate-50 text-[#062B72] border-2 border-[#cbd9e8] shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
        >
          <Check className="w-4 h-4 text-[#64748B]" />
          <span>Dismiss as False Positive</span>
        </button>
      </div>
    </div>
  );
}
