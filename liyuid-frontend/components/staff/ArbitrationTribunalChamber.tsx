"use client";

import React, { useState } from "react";
import {
  Scale,
  Gavel,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  Ban,
  Clock,
  MapPin,
  Barcode,
  Layers,
  Sparkles,
  ArrowRight,
  User,
  ShieldAlert,
  FileText,
} from "lucide-react";
import { DisputeRecord } from "./DisputeCard";

interface ArbitrationTribunalChamberProps {
  disputes: DisputeRecord[];
  selectedDispute: DisputeRecord | null;
  onSelectDispute: (dispute: DisputeRecord) => void;
  onIssueDecree?: (disputeId: string, action: "award_claimant_a" | "block_imposter" | "police_escrow") => void;
}

export function ArbitrationTribunalChamber({
  disputes,
  selectedDispute,
  onSelectDispute,
  onIssueDecree,
}: ArbitrationTribunalChamberProps) {
  const active = selectedDispute || disputes[0];
  const [decreeNote, setDecreeNote] = useState("");
  const [issuing, setIssuing] = useState(false);
  const [decreeIssued, setDecreeIssued] = useState<string | null>(null);

  const handleDecree = async (action: "award_claimant_a" | "block_imposter" | "police_escrow") => {
    if (!active) return;
    try {
      setIssuing(true);
      await new Promise((r) => setTimeout(r, 600));
      if (onIssueDecree) {
        onIssueDecree(active.id, action);
      }
      setDecreeIssued(
        action === "award_claimant_a"
          ? `Arbitration Decree #DECR-${active.id.slice(-4)}: Custody awarded to Claimant A. Escrow order dispatched to Cases Counter.`
          : action === "block_imposter"
          ? `Arbitration Decree #DECR-${active.id.slice(-4)}: Imposter blocked and referred to Flags Desk. Found item freed for AI re-matching.`
          : `Arbitration Decree #DECR-${active.id.slice(-4)}: Item referred to Ethiopian Federal Police custody.`
      );
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 text-[#062B72]">
      {/* Judicial Tribunal Crest & Header Banner */}
      <div className="bg-[#0F172A] bg-gradient-to-r from-[#1E293B] via-[#0F172A] to-[#1E293B] rounded-3xl p-6 text-white shadow-lg border-2 border-amber-500/30 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border-2 border-amber-400/40 flex items-center justify-center text-amber-400 backdrop-blur-xs shadow-inner">
            <Scale className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-amber-100">
                Civic Arbitration Hearing Tribunal
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-400/30 uppercase tracking-widest">
                Chamber In Session
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Contested claimant hearing bench • Comparative evidence auditing • Formal supervisor ownership decrees
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-2 text-xs font-bold text-amber-200">
            <Gavel className="w-4 h-4 text-amber-400" />
            <span>{disputes.length} Contested Dockets</span>
          </div>
        </div>
      </div>

      {/* Split-Screen Judicial Chamber Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Hearing Docket Roll (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase text-[#64748B] tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#087FF5]" />
              Hearing Dockets ({disputes.length})
            </span>
            <span className="text-[11px] font-bold text-[#087FF5]">Live Docket Queue</span>
          </div>

          <div className="flex flex-col gap-2.5 max-h-[640px] overflow-y-auto pr-1">
            {disputes.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-[#cbd9e8] rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                <span className="text-xs font-black text-[#062B72]">Zero Active Disputes</span>
                <span className="text-[11px] text-[#64748B]">No conflicting ownership claims or mediation appeals pending across municipal hubs.</span>
              </div>
            ) : (
              disputes.map((d) => {
              const isSelected = active && active.id === d.id;
              const isResolved = d.status === "Resolved";
              return (
                <div
                  key={d.id}
                  onClick={() => onSelectDispute(d)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-2.5 relative shadow-xs ${
                    isSelected
                      ? "bg-[#062B72] border-amber-400 text-white shadow-md"
                      : "bg-white border-[#e2eaf4] hover:border-[#B9E1FD] text-[#062B72]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md ${
                      isSelected ? "bg-amber-400/20 text-amber-300 border border-amber-400/30" : "bg-[#F0F7FF] text-[#087FF5]"
                    }`}>
                      #{d.id}
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                      isResolved
                        ? "bg-slate-200 text-slate-700"
                        : d.status === "Mediation"
                        ? "bg-blue-500/20 text-blue-200"
                        : "bg-amber-500/20 text-amber-300 animate-pulse"
                    }`}>
                      {d.status}
                    </span>
                  </div>

                  <div>
                    <h5 className={`text-xs font-black line-clamp-1 ${isSelected ? "text-white" : "text-[#062B72]"}`}>
                      {d.itemTitle}
                    </h5>
                    <span className={`text-[11px] font-medium flex items-center gap-1 mt-0.5 ${isSelected ? "text-blue-200" : "text-[#64748B]"}`}>
                      <MapPin className="w-3 h-3" />
                      {d.subCity} Hub
                    </span>
                  </div>

                  <div className={`pt-2 border-t text-[10px] flex items-center justify-between ${
                    isSelected ? "border-white/10 text-slate-300" : "border-[#e2eaf4] text-[#94A3B8]"
                  }`}>
                    <span>{d.claimantAPseudonym} vs {d.claimantBPseudonym}</span>
                    <span className="font-bold">{d.createdDate}</span>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>

        {/* Right Column: Comparative Trial Matrix & Decree Panel (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          {active ? (
            <div className="bg-white rounded-3xl border-2 border-[#e2eaf4] p-6 sm:p-7 flex flex-col gap-6 shadow-xs">
              {/* Docket Header */}
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#e2eaf4] gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 font-mono font-black text-xs">
                      TRIBUNAL DOCKET #{active.id}
                    </span>
                    <span className="text-xs font-bold text-[#64748B] flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-[#087FF5]" />
                      {active.subCity} Escrow Station
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-[#062B72] mt-1.5">
                    Contested Asset: {active.itemTitle}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#64748B] font-bold">Hearing Status:</span>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-50 text-amber-800 border border-amber-200">
                    {active.status}
                  </span>
                </div>
              </div>

              {/* Summary Description */}
              <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#e2eaf4] text-xs text-[#334155]">
                <strong className="text-[#062B72] block mb-1">Hearing Incident Report:</strong>
                {active.summary}
              </div>

              {/* Side-by-Side Claimant Comparative Matrix */}
              <div>
                <h4 className="text-xs font-black uppercase text-[#64748B] tracking-wider mb-3 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-amber-600" />
                  Comparative Evidence Hearing Matrix
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Claimant A Card (Asserted Owner) */}
                  <div className="p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-emerald-200">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                          A
                        </div>
                        <div>
                          <span className="text-xs font-black text-emerald-950 block">Claimant A (Registered Owner)</span>
                          <span className="text-[10px] text-emerald-700 font-mono">{active.claimantAPseudonym}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Primary Claim
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 text-xs text-emerald-950">
                      <div className="flex justify-between py-1 border-b border-emerald-100">
                        <span className="text-emerald-800 font-semibold">Report Timestamp:</span>
                        <strong className="font-mono">{active.createdDate}</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-emerald-100">
                        <span className="text-emerald-800 font-semibold">Private Trait Proof:</span>
                        <span className="font-black text-emerald-800">4 of 4 Verified PASS</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-emerald-100">
                        <span className="text-emerald-800 font-semibold">Serial / Receipt:</span>
                        <span className="font-black text-emerald-800">Uploaded & Matched</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-emerald-800 font-semibold">Credibility Score:</span>
                        <span className="font-black text-emerald-700">94.8% (High)</span>
                      </div>
                    </div>
                  </div>

                  {/* Claimant B Card (Counter Claimant / Finder) */}
                  <div className="p-5 rounded-2xl border-2 border-amber-200 bg-amber-50/40 flex flex-col gap-3">
                    <div className="flex items-center justify-between pb-2 border-b border-amber-200">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
                          B
                        </div>
                        <div>
                          <span className="text-xs font-black text-amber-950 block">Claimant B (Conflicting Party)</span>
                          <span className="text-[10px] text-amber-700 font-mono">{active.claimantBPseudonym}</span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-300">
                        Contested Claim
                      </span>
                    </div>

                    <div className="flex flex-col gap-2 text-xs text-amber-950">
                      <div className="flex justify-between py-1 border-b border-amber-100">
                        <span className="text-amber-800 font-semibold">Claim Timestamp:</span>
                        <strong className="font-mono">Subsequent Submission</strong>
                      </div>
                      <div className="flex justify-between py-1 border-b border-amber-100">
                        <span className="text-amber-800 font-semibold">Private Trait Proof:</span>
                        <span className="font-black text-amber-800">Inconclusive / Contrast Flag</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-amber-100">
                        <span className="text-amber-800 font-semibold">Serial / Receipt:</span>
                        <span className="font-black text-amber-800">Manual Review Demanded</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-amber-800 font-semibold">Credibility Score:</span>
                        <span className="font-black text-amber-700">58.2% (Borderline)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Decree Status Banner */}
              {decreeIssued && (
                <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-3 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{decreeIssued}</span>
                </div>
              )}

              {/* Formal Magistrate Decree Bench (Action Controls) */}
              <div className="pt-4 border-t border-[#e2eaf4] flex flex-col gap-3">
                <span className="text-xs font-black uppercase text-[#64748B] tracking-wider flex items-center gap-1.5">
                  <Gavel className="w-4 h-4 text-amber-600" />
                  Supervisor Judicial Decrees
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    disabled={issuing}
                    onClick={() => handleDecree("award_claimant_a")}
                    className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-emerald-600/20"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Award Item to Claimant A</span>
                    <span className="text-[10px] font-medium text-emerald-100">Dispatch to Cases Desk</span>
                  </button>

                  <button
                    type="button"
                    disabled={issuing}
                    onClick={() => handleDecree("block_imposter")}
                    className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-rose-600/20"
                  >
                    <Ban className="w-4 h-4" />
                    <span>Block Imposter & Auto-Rematch</span>
                    <span className="text-[10px] font-medium text-rose-100">Sever claim, re-trigger AI</span>
                  </button>

                  <button
                    type="button"
                    disabled={issuing}
                    onClick={() => handleDecree("police_escrow")}
                    className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    <span>Compel Police Escrow</span>
                    <span className="text-[10px] font-medium text-slate-300">Criminal investigation hold</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-[#cbd9e8] text-slate-500 flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Scale className="w-7 h-7" />
              </div>
              <h4 className="text-base font-black text-[#062B72]">Tribunal Chamber in Recess (0 Disputes)</h4>
              <p className="text-xs text-[#64748B] max-w-sm">
                No active hearings or disputed ownership contests currently docketed. Conflicted claims will appear here for supervisor mediation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

