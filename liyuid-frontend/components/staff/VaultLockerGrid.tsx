"use client";

import React from "react";
import {
  Archive,
  QrCode,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Barcode,
  ExternalLink,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { CaseRecord } from "./CaseTable";

interface VaultLockerGridProps {
  cases: CaseRecord[];
  onSelectCase: (caseId: string) => void;
  onDispatchToCounter?: (caseRecord: CaseRecord) => void;
}

export function VaultLockerGrid({
  cases,
  onSelectCase,
  onDispatchToCounter,
}: VaultLockerGridProps) {
  // Group cases into warehouse shelf tiers
  const getShelfCoordinate = (index: number) => {
    const letters = ["A", "B", "C", "D", "E"];
    const sectionIndex = Math.floor(index / 4) % letters.length;
    const shelfNum = (index % 4) + 1;
    return `Locker ${letters[sectionIndex]}-0${shelfNum}`;
  };

  const getVaultBadge = (stage: string = "") => {
    if (stage.includes("Ready") || stage.includes("Handover")) {
      return {
        label: "On Counter Handover",
        bg: "bg-blue-500 text-white border-blue-600",
        dot: "bg-white animate-ping",
      };
    }
    if (stage.includes("PASS") || stage.includes("Verified")) {
      return {
        label: "Vault Stored (Cleared)",
        bg: "bg-emerald-500 text-white border-emerald-600",
        dot: "bg-white",
      };
    }
    if (stage.includes("BORDERLINE")) {
      return {
        label: "Triage Hold (Locker Quarantined)",
        bg: "bg-amber-500 text-white border-amber-600",
        dot: "bg-white animate-pulse",
      };
    }
    if (stage.includes("Reunited")) {
      return {
        label: "Locker Cleared (Reunited)",
        bg: "bg-slate-400 text-white border-slate-500",
        dot: "bg-slate-200",
      };
    }
    return {
      label: "Intake Custody",
      bg: "bg-slate-600 text-white border-slate-700",
      dot: "bg-slate-300",
    };
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Vault Facility Status Ribbon */}
      <div className="bg-[#062B72] bg-gradient-to-r from-[#062B72] via-[#08388f] to-[#0A4BB5] rounded-3xl p-5 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300 backdrop-blur-xs">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight">Metropolitan Physical Evidence Vault</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                Locker Units Active
              </span>
            </div>
            <p className="text-xs text-blue-200 font-medium">
              Physical chain-of-custody archive • Barcoded shelf storage • 4-tier security lock
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-bold text-blue-100">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>{cases.filter(c => (c.stage || "").includes("PASS")).length} Cleared in Vault</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15">
            <span className="w-2 h-2 rounded-full bg-blue-400" />
            <span>{cases.filter(c => (c.stage || "").includes("Ready")).length} At Counter</span>
          </div>
        </div>
      </div>

      {/* Physical Locker Units Grid */}
      {cases.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-[#cbd9e8] rounded-3xl p-12 text-center flex flex-col items-center justify-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#F0F7FF] text-[#087FF5] flex items-center justify-center">
            <Archive className="w-7 h-7" />
          </div>
          <h4 className="text-base font-black text-[#062B72]">Vault Lockers Cleared (0 Active Items)</h4>
          <p className="text-xs text-[#64748B] max-w-sm">
            All physical locker units are currently vacant. New cases verified via the 4-layer audit will automatically be assigned warehouse coordinates here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cases.map((c, index) => {
          const lockerTag = getShelfCoordinate(index);
          const badge = getVaultBadge(c.stage);
          const isAtCounter = (c.stage || "").includes("Ready");

          return (
            <div
              key={c.id}
              className={`group bg-white rounded-3xl border-2 transition-all p-5 flex flex-col justify-between gap-4 relative overflow-hidden shadow-xs hover:shadow-md cursor-pointer ${
                isAtCounter
                  ? "border-[#087FF5] bg-[#F0F7FF]/30"
                  : "border-[#e2eaf4] hover:border-[#B9E1FD]"
              }`}
              onClick={() => onSelectCase(c.id)}
            >
              {/* Locker Metal Top Plaque */}
              <div className="flex items-center justify-between pb-3 border-b border-[#e2eaf4]">
                <div className="flex items-center gap-2">
                  <div className="px-2.5 py-1 rounded-lg bg-[#062B72] text-amber-300 font-mono font-black text-xs tracking-wider flex items-center gap-1.5 shadow-2xs">
                    <Barcode className="w-3.5 h-3.5" />
                    <span>{lockerTag}</span>
                  </div>
                  <span className="text-[11px] font-bold text-[#64748B]">
                    {c.subCity || "Addis Ababa"} Vault
                  </span>
                </div>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${badge.bg}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                  <span>{badge.label}</span>
                </span>
              </div>

              {/* Item Info Center */}
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-[#087FF5] tracking-wider">
                    {c.category || "General Property"}
                  </span>
                  <span className="text-[11px] font-mono text-[#94A3B8]">
                    ID #{c.id.slice(0, 8)}
                  </span>
                </div>
                <h4 className="text-sm font-black text-[#062B72] group-hover:text-[#087FF5] transition-colors line-clamp-1">
                  {c.item_title || `Intake Item #${c.id.slice(0, 8)}`}
                </h4>
                <p className="text-xs text-[#64748B] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#94A3B8]" />
                  <span>Logged {c.createdDate || "Recently"}</span>
                </p>
              </div>

              {/* Barcode Tag Strip & Locker Seal */}
              <div className="bg-[#F8FAFC] border border-[#e2eaf4] rounded-2xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-[#087FF5]" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-[#062B72] uppercase">Dual QR Seal</span>
                    <span className="text-[10px] font-mono text-[#64748B]">
                      {c.match_id ? `MCH-${c.match_id.slice(0, 6)}` : "STANDALONE"}
                    </span>
                  </div>
                </div>

                {isAtCounter ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onDispatchToCounter) onDispatchToCounter(c);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#087FF5] hover:bg-[#066ad1] text-white text-[11px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-xs"
                  >
                    <span>Open Keypad</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <span className="text-[11px] font-bold text-[#64748B] flex items-center gap-1">
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>
);
}

