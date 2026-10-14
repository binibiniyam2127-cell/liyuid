"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Clock,
  Terminal,
  Cpu,
  Ban,
  Radio,
  CheckCircle2,
  RefreshCw,
  MapPin,
  ExternalLink,
  ChevronRight,
  Eye,
  Activity,
} from "lucide-react";
import { FlagResponse, ResolveFlagPayload } from "@/lib/types";

interface CyberThreatOpsCenterProps {
  flags: FlagResponse[];
  resolvingId: string | null;
  onResolve: (flagId: string, action: "allow_retry" | "block" | "dismiss", note?: string) => Promise<void>;
}

export function CyberThreatOpsCenter({
  flags,
  resolvingId,
  onResolve,
}: CyberThreatOpsCenterProps) {
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "imposter" | "bruteforce" | "subnet">("all");

  const activeIncident = flags.find((f) => f.id === selectedIncidentId) || flags[0];

  const getThreatCategory = (reason: string = "") => {
    const r = reason.toLowerCase();
    if (r.includes("imposter") || r.includes("fraud") || r.includes("blocked")) {
      return {
        type: "IMPOSTER_FRAUD",
        color: "bg-rose-500/20 text-rose-300 border-rose-500/30",
        label: "CRITICAL: Imposter Spoofing",
        threatLevel: "SEV-1 HIGH",
      };
    }
    if (r.includes("failed") || r.includes("lock") || r.includes("attempt")) {
      return {
        type: "BRUTE_FORCE_LOCKOUT",
        color: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        label: "SECURITY: Trait Challenge Lockout",
        threatLevel: "SEV-2 ELEVATED",
      };
    }
    if (r.includes("excessive") || r.includes("rate") || r.includes("subnet")) {
      return {
        type: "RATE_ANOMALY",
        color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
        label: "TELEMETRY: Subnet Ingestion Spike",
        threatLevel: "SEV-2 ELEVATED",
      };
    }
    return {
      type: "POLICY_ABUSE",
      color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
      label: "COMPLIANCE: Content Abuse",
      threatLevel: "SEV-3 MODERATE",
    };
  };

  const filteredIncidents = flags.filter((f) => {
    if (activeTab === "all") return true;
    const cat = getThreatCategory(f.reason).type;
    if (activeTab === "imposter") return cat === "IMPOSTER_FRAUD";
    if (activeTab === "bruteforce") return cat === "BRUTE_FORCE_LOCKOUT";
    if (activeTab === "subnet") return cat === "RATE_ANOMALY";
    return true;
  });

  return (
    <div className="flex flex-col gap-6 text-[#062B72]">
      {/* Cybersecurity SOC Threat HUD Header */}
      <div className="bg-[#0F172A] bg-gradient-to-r from-[#0F172A] via-[#1E1B4B] to-[#0F172A] rounded-3xl p-6 text-white shadow-xl border-2 border-rose-500/30 relative overflow-hidden flex flex-wrap items-center justify-between gap-4">
        <div className="absolute right-0 top-0 w-96 h-96 bg-rose-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border-2 border-rose-400/40 flex items-center justify-center text-rose-400 backdrop-blur-xs shadow-inner">
            <ShieldAlert className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-rose-100">
                Cyber Threat Intelligence & Imposter Prosecution Center
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                flags.length === 0
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                  : "bg-rose-500/30 text-rose-300 border border-rose-400/40"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${flags.length === 0 ? "bg-emerald-400" : "bg-rose-400 animate-ping"}`} />
                <span>{flags.length === 0 ? "DEFCON NORMAL (0 THREATS)" : "DEFCON ELEVATED"}</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Real-time anomaly telemetry • Imposter quarantine • Automated AI vector re-matching dispatch
            </p>
          </div>
        </div>

        {/* SOC Telemetry Pills */}
        <div className="flex items-center gap-3 relative z-10 text-xs font-mono font-bold">
          <div className="px-3.5 py-2 rounded-2xl bg-rose-950/60 border border-rose-500/30 text-rose-300 flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-spin" />
            <span>{flags.length} Security Incidents</span>
          </div>
          <div className="px-3.5 py-2 rounded-2xl bg-slate-900 border border-slate-700 text-slate-300 flex items-center gap-2">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Celery Worker: ACTIVE</span>
          </div>
        </div>
      </div>

      {/* Main SOC Technical Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tactical Threat Feed (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {/* Sub-Filters */}
          <div className="flex items-center gap-1 bg-[#F8FAFC] border-2 border-[#e2eaf4] p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveTab("all")}
              className={`flex-1 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                activeTab === "all" ? "bg-[#062B72] text-white shadow-xs" : "text-[#64748B] hover:text-[#062B72]"
              }`}
            >
              All ({flags.length})
            </button>
            <button
              onClick={() => setActiveTab("imposter")}
              className={`flex-1 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                activeTab === "imposter" ? "bg-rose-600 text-white shadow-xs" : "text-rose-700 hover:text-rose-900"
              }`}
            >
              Imposters
            </button>
            <button
              onClick={() => setActiveTab("bruteforce")}
              className={`flex-1 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                activeTab === "bruteforce" ? "bg-amber-600 text-white shadow-xs" : "text-amber-700 hover:text-amber-900"
              }`}
            >
              Lockouts
            </button>
            <button
              onClick={() => setActiveTab("subnet")}
              className={`flex-1 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                activeTab === "subnet" ? "bg-purple-600 text-white shadow-xs" : "text-purple-700 hover:text-purple-900"
              }`}
            >
              Subnet
            </button>
          </div>

          {/* Incident Threat Cards List */}
          <div className="flex flex-col gap-3 max-h-[640px] overflow-y-auto pr-1">
            {filteredIncidents.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-[#cbd9e8] rounded-2xl p-8 text-center flex flex-col items-center justify-center gap-2">
                <ShieldCheck className="w-8 h-8 text-emerald-600" />
                <span className="text-xs font-black text-[#062B72]">Zero Security Incidents Active</span>
                <span className="text-[11px] text-[#64748B]">All 11 sub-city sectors operating normally with 0 threats detected.</span>
              </div>
            ) : (
              filteredIncidents.map((flag) => {
              const cat = getThreatCategory(flag.reason);
              const isSelected = activeIncident && activeIncident.id === flag.id;

              return (
                <div
                  key={flag.id}
                  onClick={() => setSelectedIncidentId(flag.id)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col gap-2.5 relative shadow-xs ${
                    isSelected
                      ? "bg-[#0F172A] border-rose-500 text-white shadow-md"
                      : "bg-white border-[#e2eaf4] hover:border-rose-300 text-[#062B72]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md border ${cat.color}`}>
                      {cat.threatLevel}
                    </span>
                    <span className="text-[10px] font-mono text-[#94A3B8]">
                      INC-{flag.id.slice(0, 8)}
                    </span>
                  </div>

                  <div>
                    <h5 className={`text-xs font-black line-clamp-2 ${isSelected ? "text-white" : "text-[#062B72]"}`}>
                      {flag.reason}
                    </h5>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/20 text-[10px] font-mono">
                      <span className={isSelected ? "text-slate-300" : "text-[#64748B]"}>
                        Target: {flag.target_entity.toUpperCase()} #{flag.entity_id.slice(0, 8)}
                      </span>
                      <span className={isSelected ? "text-rose-300" : "text-rose-600"}>
                        {flag.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>

        {/* Right Column: Forensic Terminal & Quarantine Console (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {activeIncident ? (
            <div className="bg-white rounded-3xl border-2 border-[#e2eaf4] p-6 sm:p-7 flex flex-col gap-6 shadow-xs">
              {/* Incident Header */}
              <div className="flex flex-wrap items-center justify-between pb-4 border-b border-[#e2eaf4] gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-900 border border-rose-300 font-mono font-black text-xs">
                      SECURITY INCIDENT #{activeIncident.id.slice(0, 8)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700">
                      Entity: {activeIncident.target_entity}
                    </span>
                  </div>
                  <h3 className="text-base font-black text-[#062B72] mt-2">
                    {activeIncident.reason}
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#64748B] font-bold">Severity:</span>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-800 border border-rose-200">
                    {getThreatCategory(activeIncident.reason).threatLevel}
                  </span>
                </div>
              </div>

              {/* Forensic Terminal Telemetry Window */}
              <div className="bg-[#0B1120] text-emerald-400 p-4 sm:p-5 rounded-2xl font-mono text-xs shadow-inner border border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-slate-400 text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-300 font-bold">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    SOC Forensic Stream
                  </span>
                  <span>SSL/TLS: TLS_AES_256_GCM_SHA384</span>
                </div>

                <div className="flex flex-col gap-1 text-[11px] leading-relaxed pt-1">
                  <div><span className="text-slate-500">[TARGET_UUID]</span> : {activeIncident.entity_id}</div>
                  <div><span className="text-slate-500">[ENTITY_KIND]</span> : {activeIncident.target_entity}</div>
                  <div><span className="text-slate-500">[DETECT_TIME]</span> : {activeIncident.created_at}</div>
                  <div>
                    <span className="text-slate-500">[VECTOR_REMATCH]</span> : <span className="text-amber-300">AUTO_TRIGGER_ARMED (Celery Task ID pending block)</span>
                  </div>
                  <div>
                    <span className="text-slate-500">[POLICY_GUARD]</span> : <span className="text-emerald-300">Staff Console Exception Guard ACTIVE</span>
                  </div>
                </div>
              </div>

              {/* Rapid Strike / Quarantine Actions */}
              <div className="pt-4 border-t border-[#e2eaf4] flex flex-col gap-3">
                <span className="text-xs font-black uppercase text-[#64748B] tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  Prosecution & Restitution Strikes
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    type="button"
                    disabled={resolvingId === activeIncident.id}
                    onClick={() => onResolve(activeIncident.id, "block", "Blocked imposter and triggered automatic AI re-matching")}
                    className="p-4 rounded-2xl bg-rose-600 bg-gradient-to-r from-rose-600 to-red-700 hover:from-rose-700 hover:to-red-800 text-white font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-rose-600/20 active:scale-95"
                  >
                    <Ban className="w-5 h-5" />
                    <span>Neutralize Imposter</span>
                    <span className="text-[10px] font-medium text-rose-100">Sever claim ➜ Trigger Celery rematch</span>
                  </button>

                  <button
                    type="button"
                    disabled={resolvingId === activeIncident.id}
                    onClick={() => onResolve(activeIncident.id, "allow_retry", "Granted citizen challenge retry")}
                    className="p-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-amber-500/20 active:scale-95"
                  >
                    <RefreshCw className="w-5 h-5" />
                    <span>Grant Trait Retry</span>
                    <span className="text-[10px] font-medium text-amber-100">Lift lock for benign typo</span>
                  </button>

                  <button
                    type="button"
                    disabled={resolvingId === activeIncident.id}
                    onClick={() => onResolve(activeIncident.id, "dismiss", "Dismissed flag after investigation")}
                    className="p-4 rounded-2xl bg-[#062B72] hover:bg-[#041e50] text-white font-black text-xs flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-slate-900/20 active:scale-95"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Dismiss Incident</span>
                    <span className="text-[10px] font-medium text-blue-200">Close without sanction</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white rounded-3xl border-2 border-dashed border-[#cbd9e8] text-slate-500 flex flex-col items-center justify-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h4 className="text-base font-black text-[#062B72]">SOC Watchtower Normal</h4>
              <p className="text-xs text-[#64748B] max-w-sm">
                No active threats or imposter incidents requiring moderation. The network is secure with 0 flags recorded.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

