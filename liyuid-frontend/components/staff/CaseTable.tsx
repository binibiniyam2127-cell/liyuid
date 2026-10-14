"use client";

import React from "react";
import { MapPin, ChevronRight, AlertTriangle, ShieldCheck } from "lucide-react";

export interface CaseRecord {
  id: string;
  match_id?: string;
  handover_id?: string;
  vault_locker?: string;
  deposit_voucher?: string;
  venue?: string;
  item_title?: string;
  category: string;
  subCity: string;
  stage: "Ingested" | "Searching" | "Candidate" | "Verified (PASS)" | "Ready for Handover" | "BORDERLINE" | "Reunited";
  createdDate: string;
  reporter_id?: string;
  finder_id?: string;
  composite_score?: number;
  flag_reason?: string;
}

interface CaseTableProps {
  cases: CaseRecord[];
  onSelectCase?: (caseId: string) => void;
}

export function CaseTable({ cases, onSelectCase }: CaseTableProps) {
  const getStageBadge = (stage?: string) => {
    const s = stage || "";
    if (s.includes("PASS") || s.includes("Verified")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Verified PASS</span>
        </span>
      );
    }
    if (s.includes("BORDERLINE")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
          <span>Borderline Review</span>
        </span>
      );
    }
    if (s.includes("Ready") || s.includes("Handover")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-50 text-[#087FF5] border border-blue-200 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-[#087FF5]" />
          <span>Desk Check Ready</span>
        </span>
      );
    }
    if (s.includes("Reunited")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          <span>Closed Reunited</span>
        </span>
      );
    }
    if (s.includes("Candidate")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-sky-50 text-sky-800 border border-sky-200 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
          <span>Candidate Match</span>
        </span>
      );
    }
    if (s.includes("Blocked") || s.includes("Blacklisted")) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-rose-50 text-rose-800 border border-rose-200 whitespace-nowrap">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          <span>Blocked Imposter</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-50 text-slate-600 border border-slate-200 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
        <span>{s || "Searching"}</span>
      </span>
    );
  };

  return (
    <div className="overflow-x-auto rounded-3xl border-2 border-[#e2eaf4] bg-white shadow-xs">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b-2 border-[#e2eaf4] text-[#64748B] uppercase text-[10px] font-black tracking-wider bg-[#F8FAFC]">
            <th className="py-4 px-5 pl-6">Case Tracking ID</th>
            <th className="py-4 px-4">Item & Category</th>
            <th className="py-4 px-4">Sub-City District Desk</th>
            <th className="py-4 px-4">Lifecycle Stage</th>
            <th className="py-4 px-4">Parties Involved</th>
            <th className="py-4 px-4">Logged Date</th>
            <th className="py-4 px-4 pr-6 text-right">Moderation Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f0f4f9]">
          {cases.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                No cases match the selected search or filter criteria.
              </td>
            </tr>
          ) : (
            cases.map((c) => (
              <tr
                key={c.id}
                onClick={() => onSelectCase?.(c.id)}
                className="hover:bg-[#F0F7FF]/50 cursor-pointer transition-colors group"
              >
                <td className="py-3.5 px-5 pl-6 font-mono font-bold text-[#087FF5] whitespace-nowrap">
                  {c.id}
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex flex-col">
                    <span className="font-black text-[#062B72] text-sm">
                      {c.item_title || c.category}
                    </span>
                    <span className="text-[11px] text-[#64748B] font-medium">{c.category}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-[#475569]">
                  <div className="flex items-center gap-1.5 font-bold">
                    <MapPin className="w-3.5 h-3.5 text-[#087FF5] shrink-0" />
                    <span>{c.subCity || "Addis Ababa"} Hub</span>
                  </div>
                </td>
                <td className="py-3.5 px-4">
                  {getStageBadge(c.stage)}
                </td>
                <td className="py-3.5 px-4 text-slate-500">
                  <div className="flex flex-col text-[11px]">
                    <span className="text-[#062B72] font-bold">{c.reporter_id || "Claimant"}</span>
                    <span className="text-[#64748B]">{c.finder_id || "Custodian"}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-[#64748B] text-[11px] font-medium whitespace-nowrap">
                  {c.createdDate}
                </td>
                <td className="py-3.5 px-4 pr-6 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectCase?.(c.id);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#cbd9e8] hover:bg-[#087FF5] hover:text-white text-[#062B72] text-xs font-black transition-all cursor-pointer shadow-xs group-hover:bg-[#087FF5] group-hover:text-white group-hover:border-[#087FF5]"
                  >
                    <span>Inspect Case</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
