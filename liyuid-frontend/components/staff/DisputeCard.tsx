"use client";

import React from "react";
import { Scale, Clock, CheckCircle2, ShieldAlert, FileCheck, MapPin } from "lucide-react";

export interface DisputeRecord {
  id: string;
  flag_id?: string;
  match_id?: string;
  entity_id?: string;
  target_entity?: string;
  subCity: string;
  itemTitle: string;
  claimantAPseudonym: string;
  claimantBPseudonym: string;
  summary: string;
  status: "Open" | "Mediation" | "Resolved";
  createdDate: string;
  resolutionNotes?: string | null;
  finderPhone?: string | null;
  finderName?: string | null;
  finderEmail?: string | null;
  ownerPhone?: string | null;
  ownerName?: string | null;
  ownerEmail?: string | null;
}

interface DisputeCardProps {
  dispute: DisputeRecord;
  onOpenMediation?: (dispute: DisputeRecord) => void;
  onRequestIndependentProof?: (dispute: DisputeRecord) => void;
}

export function DisputeCard({
  dispute,
  onOpenMediation,
  onRequestIndependentProof,
}: DisputeCardProps) {
  const isResolved = dispute.status === "Resolved";
  const isMediation = dispute.status === "Mediation";

  return (
    <div className="bg-white border-2 border-[#e2eaf4] rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-xs hover:border-[#B9E1FD] transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#F0F7FF] border border-[#B9E1FD] flex items-center justify-center text-[#087FF5] shrink-0">
            <Scale className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-black text-[#062B72]">Dispute #{dispute.id}</span>
              <span className="text-xs text-[#64748B] font-bold flex items-center gap-1">
                <MapPin className="w-3 h-3 text-[#087FF5]" />
                {dispute.subCity || "Addis Ababa"} Hub
              </span>
            </div>
            <span className="text-[11px] text-[#94A3B8] font-medium">Logged {dispute.createdDate || "Recently"}</span>
          </div>
        </div>

        <span
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black border whitespace-nowrap ${
            isResolved
              ? "bg-slate-100 text-slate-700 border-slate-200"
              : isMediation
              ? "bg-blue-50 text-[#087FF5] border-blue-200"
              : "bg-amber-50 text-amber-800 border-amber-200"
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isResolved ? "bg-slate-400" : isMediation ? "bg-[#087FF5]" : "bg-amber-500 animate-pulse"
            }`}
          />
          <span>
            {dispute.status === "Open"
              ? "Open Review"
              : dispute.status === "Mediation"
              ? "Active Mediation"
              : "Resolved Closed"}
          </span>
        </span>
      </div>

      <div className="bg-[#F8FAFC] border-2 border-[#e2eaf4] p-4 rounded-2xl flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between text-xs text-[#64748B] gap-2 pb-2.5 border-b border-[#e2eaf4]">
          <span className="font-bold">
            Target Item: <strong className="text-[#062B72]">{dispute.itemTitle || "Reported Item"}</strong>
          </span>
          <span className="bg-white px-3 py-1 rounded-xl border-2 border-[#e2eaf4] font-bold text-[#062B72] text-[11px]">
            {dispute.claimantAPseudonym || "Claimant A"} <span className="text-[#94A3B8] font-normal">vs</span> {dispute.claimantBPseudonym || "Claimant B"}
          </span>
        </div>
        <p className="text-xs text-[#334155] leading-relaxed pt-0.5 font-semibold">
          {dispute.summary || "Arbitration request filed for disputed property custody."}
        </p>

        {dispute.resolutionNotes && (
          <div
            className={`mt-1 pt-2.5 border-t border-[#e2eaf4] flex items-start gap-2 text-xs p-3 rounded-xl ${
              dispute.resolutionNotes.toLowerCase().includes("block") ||
              dispute.resolutionNotes.toLowerCase().includes("imposter")
                ? "text-rose-900 bg-rose-50/90 border border-rose-200"
                : "text-emerald-800 bg-emerald-50/80 border border-emerald-200"
            }`}
          >
            {dispute.resolutionNotes.toLowerCase().includes("block") ||
            dispute.resolutionNotes.toLowerCase().includes("imposter") ? (
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            )}
            <div>
              <span
                className={`font-black ${
                  dispute.resolutionNotes.toLowerCase().includes("block") ||
                  dispute.resolutionNotes.toLowerCase().includes("imposter")
                    ? "text-rose-950"
                    : "text-emerald-900"
                }`}
              >
                Supervisor Certified Ruling:
              </span>{" "}
              {dispute.resolutionNotes}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-1 border-t border-[#f0f4f9]">
        <button
          type="button"
          onClick={() => onRequestIndependentProof?.(dispute)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-black bg-white hover:bg-[#F0F7FF] text-[#062B72] border-2 border-[#cbd9e8] shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
        >
          <FileCheck className="w-3.5 h-3.5 text-[#087FF5]" />
          <span>Request External Proof</span>
        </button>
        <button
          type="button"
          onClick={() => onOpenMediation?.(dispute)}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-black bg-[#087FF5] hover:bg-[#076ed4] text-white border-2 border-[#087FF5] shadow-md shadow-[#087FF5]/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
        >
          <Scale className="w-3.5 h-3.5 text-white" />
          <span>{isResolved ? "View Certified Ruling" : "Open Supervisor Mediation"}</span>
        </button>
      </div>
    </div>
  );
}
