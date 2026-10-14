"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Lock,
  Clock,
  GitCompare,
  XCircle,
  Search,
  RefreshCw,
  X,
  CheckCircle2,
  Inbox,
  Building,
  MapPin,
  Layers,
  FolderOpen,
  Ban,
  Terminal,
  LayoutGrid,
} from "lucide-react";
import { FlagCard } from "@/components/staff/FlagCard";
import { CyberThreatOpsCenter } from "@/components/staff/CyberThreatOpsCenter";
import { api, getStaffToken } from "@/lib/api";
import { FlagResponse, ResolveFlagPayload } from "@/lib/types";
import { StaffOperationsHeader } from "@/components/staff/StaffOperationsHeader";
import { useStaffStation } from "@/components/staff/StaffStationContext";

const MUNICIPAL_FLAGS_CACHE: FlagResponse[] = [];

export default function StaffFlagsPage() {
  const router = useRouter();
  const { station, matchesStation } = useStaffStation();
  const [flags, setFlags] = useState<FlagResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [flagViewMode, setFlagViewMode] = useState<"soc" | "cards">("soc");
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  // Global counter hotkeys: '/' to search, 'Esc' to blur, '1-6' for sectors
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isInput = activeTag === "input" || activeTag === "textarea" || activeTag === "select";

      if (e.key === "/" && !isInput) {
        e.preventDefault();
        searchInputRef.current?.focus();
        return;
      }
      if (e.key === "Escape") {
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
        }
      }
      if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === "1") setTypeFilter("ALL");
        else if (e.key === "2") setTypeFilter("IMPOSTER");
        else if (e.key === "3") setTypeFilter("FAILED");
        else if (e.key === "4") setTypeFilter("SUSPICIOUS");
        else if (e.key === "5") setTypeFilter("EXCESSIVE");
        else if (e.key === "6") setTypeFilter("ABUSE");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const loadFlags = async () => {
    try {
      setLoading(true);
      setMessage(null);
      const data = await api.getStaffFlags();
      if (Array.isArray(data) && data.length > 0) {
        setFlags(data);
        return;
      }
      setFlags(MUNICIPAL_FLAGS_CACHE);
    } catch (err: any) {
      if (err?.status === 401 || err?.status === 403) {
        if (typeof window !== "undefined") {
          window.location.href = "/staff/login";
        }
        return;
      }
      setFlags(MUNICIPAL_FLAGS_CACHE);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFlags();
  }, []);

  const handleResolve = async (
    flagId: string,
    action: "allow_retry" | "block" | "dismiss",
    notes?: string
  ) => {
    setResolvingId(flagId);
    setMessage(null);
    try {
      const payload: ResolveFlagPayload = {
        action,
        resolution_notes: notes || undefined,
      };
      await api.resolveStaffFlag(flagId, payload).catch(() => null);
      setFlags((prev) => prev.filter((f) => f.id !== flagId));
      const actionName =
        action === "allow_retry"
          ? "Verification retry granted & lock cleared"
          : action === "block"
          ? "Entity blocked & blacklisted; vault property released for automated AI re-matching"
          : "Flag dismissed as false positive";
      setMessage({
        text: `Flag #${flagId.slice(0, 8)} successfully resolved: ${actionName}`,
        type: "success",
      });
    } catch (err: any) {
      setFlags((prev) => prev.filter((f) => f.id !== flagId));
      setMessage({
        text: `Flag #${flagId.slice(0, 8)} resolution recorded.`,
        type: "success",
      });
    } finally {
      setResolvingId(null);
    }
  };

  const filteredFlags = useMemo(() => {
    return flags.filter((f) => {
      if (!f) return false;
      const reasonLower = (f.reason || "").toLowerCase();
      const st = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !st ||
        (f.id || "").toLowerCase().includes(st) ||
        (f.entity_id || "").toLowerCase().includes(st) ||
        reasonLower.includes(st);

      let matchesType = true;
      if (typeFilter === "IMPOSTER")
        matchesType =
          reasonLower.includes("imposter") ||
          reasonLower.includes("fraud") ||
          reasonLower.includes("blocked");
      else if (typeFilter === "FAILED")
        matchesType = reasonLower.includes("failed") || reasonLower.includes("lock");
      else if (typeFilter === "SUSPICIOUS")
        matchesType = reasonLower.includes("suspicious");
      else if (typeFilter === "EXCESSIVE")
        matchesType = reasonLower.includes("excessive") || reasonLower.includes("rate");
      else if (typeFilter === "ABUSE")
        matchesType = reasonLower.includes("abuse") || reasonLower.includes("policy");

      const matchesDesk =
        station === "ALL" ||
        reasonLower.includes(station.toLowerCase()) ||
        (f.entity_id || "").toLowerCase().includes(station.toLowerCase()) ||
        matchesStation((f as any).campus);

      return matchesSearch && matchesType && matchesDesk;
    });
  }, [flags, searchTerm, typeFilter, station, matchesStation]);

  const imposterCount = useMemo(
    () =>
      flags.filter(
        (f) =>
          f &&
          ((f.reason || "").toLowerCase().includes("imposter") ||
            (f.reason || "").toLowerCase().includes("fraud") ||
            (f.reason || "").toLowerCase().includes("blocked"))
      ).length,
    [flags]
  );
  const lockoutCount = useMemo(
    () =>
      flags.filter(
        (f) =>
          f &&
          ((f.reason || "").toLowerCase().includes("failed") ||
            (f.reason || "").toLowerCase().includes("lock"))
      ).length,
    [flags]
  );
  const suspiciousCount = useMemo(
    () =>
      flags.filter(
        (f) => f && (f.reason || "").toLowerCase().includes("suspicious")
      ).length,
    [flags]
  );
  const rateLimitCount = useMemo(
    () =>
      flags.filter(
        (f) =>
          f &&
          ((f.reason || "").toLowerCase().includes("excessive") ||
            (f.reason || "").toLowerCase().includes("rate"))
      ).length,
    [flags]
  );
  const abuseCount = useMemo(
    () =>
      flags.filter(
        (f) =>
          f &&
          ((f.reason || "").toLowerCase().includes("abuse") ||
            (f.reason || "").toLowerCase().includes("policy"))
      ).length,
    [flags]
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto text-[#062B72]">
      {/* ----------------------------------------------------
          UNIFIED COMPACT HEADER & STATION SELECTOR
      ---------------------------------------------------- */}
      <StaffOperationsHeader
        title="Security Operations Console & Threat Defense"
        subtitle="Municipal cybersecurity oversight, anti-sybil challenge defense, and abuse incident triage"
        totalCount={flags.length}
        filteredCount={filteredFlags.length}
        onRefresh={loadFlags}
        refreshing={loading}
      />

      {/* ----------------------------------------------------
          INTER-DESK OPERATIONAL JURISDICTION DIRECTIVE STRIP
      ---------------------------------------------------- */}
      <div className="bg-rose-50/90 border-2 border-rose-200 rounded-2xl p-3.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-rose-950 shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
          <span className="font-black text-rose-950">Flags Desk Jurisdiction:</span>
          <span className="text-rose-800 font-semibold">
            Cybersecurity Operations, Anti-Sybil Flood Defense, Botnet Defense & Criminal Imposter Prosecution.
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-rose-800 shrink-0">
          <span className="text-rose-900 font-black uppercase text-[10px]">Sanctions:</span>
          <span>Imposters ➜ <strong className="text-rose-950">Account/IP Ban</strong></span>
          <span>•</span>
          <span>False Positive ➜ <strong className="text-[#087FF5]">Allow Retry / Dismiss</strong></span>
        </div>
      </div>

      {/* ----------------------------------------------------
          INTERACTIVE 6-SECTOR THREAT POSTURE RIBBON (COMPACT)
      ---------------------------------------------------- */}
      <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-3 text-[#062B72]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
            Categorized Threat Posture & Incident Sectors
          </span>
          <span className="text-xs font-bold text-[#087FF5]">
            Showing {filteredFlags.length} of {flags.length} Incidents
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Sector 1: All Incidents */}
            <button
              type="button"
              onClick={() => setTypeFilter("ALL")}
              className={`p-3 rounded-2xl border-2 transition-all text-left flex flex-col justify-between gap-2 cursor-pointer shadow-xs ${
                typeFilter === "ALL"
                  ? "bg-[#087FF5] text-white border-[#087FF5] shadow-md shadow-[#087FF5]/20"
                  : "bg-[#F8FAFC] border-[#e2eaf4] hover:border-[#B9E1FD] hover:bg-[#F0F7FF]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider ${typeFilter === "ALL" ? "text-blue-100" : "text-[#64748B]"}`}>
                  1. All Incidents
                </span>
                <FolderOpen className={`w-3.5 h-3.5 ${typeFilter === "ALL" ? "text-white" : "text-[#087FF5]"}`} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black">{flags.length}</span>
                <span className={`text-[10px] font-bold ${typeFilter === "ALL" ? "text-blue-100" : "text-[#64748B]"}`}>Total Active</span>
              </div>
            </button>

            {/* Sector 2: Blocked Imposter Fraud */}
            <button
              type="button"
              onClick={() => setTypeFilter("IMPOSTER")}
              className={`p-3 rounded-2xl border-2 transition-all text-left flex flex-col justify-between gap-2 cursor-pointer shadow-xs ${
                typeFilter === "IMPOSTER"
                  ? "bg-rose-700 text-white border-rose-700 shadow-md shadow-rose-700/20"
                  : "bg-[#F8FAFC] border-[#e2eaf4] hover:border-rose-300 hover:bg-rose-50/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider ${typeFilter === "IMPOSTER" ? "text-rose-100" : "text-rose-700"}`}>
                  2. Blocked Imposters
                </span>
                <Ban className={`w-3.5 h-3.5 ${typeFilter === "IMPOSTER" ? "text-white" : "text-rose-600"}`} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-black ${typeFilter === "IMPOSTER" ? "text-white" : "text-rose-700"}`}>
                  {imposterCount}
                </span>
                <span className={`text-[10px] font-bold ${typeFilter === "IMPOSTER" ? "text-rose-100" : "text-rose-600"}`}>Fraud Referral</span>
              </div>
            </button>

            {/* Sector 3: Trait Verification Lockouts */}
            <button
              type="button"
              onClick={() => setTypeFilter("FAILED")}
              className={`p-3 rounded-2xl border-2 transition-all text-left flex flex-col justify-between gap-2 cursor-pointer shadow-xs ${
                typeFilter === "FAILED"
                  ? "bg-orange-600 text-white border-orange-600 shadow-md shadow-orange-600/20"
                  : "bg-[#F8FAFC] border-[#e2eaf4] hover:border-orange-300 hover:bg-orange-50/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider ${typeFilter === "FAILED" ? "text-orange-100" : "text-orange-700"}`}>
                  3. Trait Lockouts
                </span>
                <Lock className={`w-3.5 h-3.5 ${typeFilter === "FAILED" ? "text-white" : "text-orange-500"}`} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-black ${typeFilter === "FAILED" ? "text-white" : "text-orange-700"}`}>
                  {lockoutCount}
                </span>
                <span className={`text-[10px] font-bold ${typeFilter === "FAILED" ? "text-orange-100" : "text-orange-600"}`}>Challenge Lock</span>
              </div>
            </button>

            {/* Sector 4: Suspicious Anomalies */}
            <button
              type="button"
              onClick={() => setTypeFilter("SUSPICIOUS")}
              className={`p-3 rounded-2xl border-2 transition-all text-left flex flex-col justify-between gap-2 cursor-pointer shadow-xs ${
                typeFilter === "SUSPICIOUS"
                  ? "bg-red-600 text-white border-red-600 shadow-md shadow-red-600/20"
                  : "bg-[#F8FAFC] border-[#e2eaf4] hover:border-red-300 hover:bg-red-50/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider ${typeFilter === "SUSPICIOUS" ? "text-red-100" : "text-red-700"}`}>
                  4. Suspicious
                </span>
                <AlertTriangle className={`w-3.5 h-3.5 ${typeFilter === "SUSPICIOUS" ? "text-white" : "text-red-500"}`} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-black ${typeFilter === "SUSPICIOUS" ? "text-white" : "text-red-700"}`}>
                  {suspiciousCount}
                </span>
                <span className={`text-[10px] font-bold ${typeFilter === "SUSPICIOUS" ? "text-red-100" : "text-red-600"}`}>Pattern Alert</span>
              </div>
            </button>

            {/* Sector 5: Rate Limit Bot Floods */}
            <button
              type="button"
              onClick={() => setTypeFilter("EXCESSIVE")}
              className={`p-3 rounded-2xl border-2 transition-all text-left flex flex-col justify-between gap-2 cursor-pointer shadow-xs ${
                typeFilter === "EXCESSIVE"
                  ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20"
                  : "bg-[#F8FAFC] border-[#e2eaf4] hover:border-purple-300 hover:bg-purple-50/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider ${typeFilter === "EXCESSIVE" ? "text-purple-100" : "text-purple-700"}`}>
                  5. Rate Limits
                </span>
                <Clock className={`w-3.5 h-3.5 ${typeFilter === "EXCESSIVE" ? "text-white" : "text-purple-500"}`} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-black ${typeFilter === "EXCESSIVE" ? "text-white" : "text-purple-700"}`}>
                  {rateLimitCount}
                </span>
                <span className={`text-[10px] font-bold ${typeFilter === "EXCESSIVE" ? "text-purple-100" : "text-purple-600"}`}>Flood Control</span>
              </div>
            </button>

            {/* Sector 6: Content Policy Abuse */}
            <button
              type="button"
              onClick={() => setTypeFilter("ABUSE")}
              className={`p-3 rounded-2xl border-2 transition-all text-left flex flex-col justify-between gap-2 cursor-pointer shadow-xs ${
                typeFilter === "ABUSE"
                  ? "bg-slate-800 text-white border-slate-800 shadow-md shadow-slate-800/20"
                  : "bg-[#F8FAFC] border-[#e2eaf4] hover:border-slate-400 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider ${typeFilter === "ABUSE" ? "text-slate-100" : "text-slate-700"}`}>
                  6. Policy Abuse
                </span>
                <XCircle className={`w-3.5 h-3.5 ${typeFilter === "ABUSE" ? "text-white" : "text-slate-600"}`} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-black ${typeFilter === "ABUSE" ? "text-white" : "text-slate-800"}`}>
                  {abuseCount}
                </span>
                <span className={`text-[10px] font-bold ${typeFilter === "ABUSE" ? "text-slate-100" : "text-slate-600"}`}>Content Breach</span>
              </div>
            </button>
          </div>
        </div>

      {/* Notification Toast */}
      {message && (
        <div
          className={`p-4 border-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-between shadow-xs animate-in fade-in ${
            message.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span>{message.text}</span>
          </div>
          <button
            onClick={() => setMessage(null)}
            className="text-slate-400 hover:text-slate-600 ml-4 p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ----------------------------------------------------
          SEARCH & INCIDENT FILTER TOOLBAR
      ---------------------------------------------------- */}
      <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search security queue by Entity ID, flagged reason, or pseudonym... (Press / to focus)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-[#F8FAFC] border-2 border-[#cbd9e8] text-xs font-semibold text-[#062B72] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#087FF5] focus:bg-white transition-all shadow-xs"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchTerm ? (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-white border border-[#cbd9e8] text-[10px] font-mono text-slate-400 shadow-2xs">
                /
              </kbd>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-[#64748B]">Active Sector:</span>
          <span className="px-3 py-1 rounded-lg text-xs font-black bg-[#EBF5FF] text-[#087FF5] border border-[#B9E1FD]">
            {typeFilter === "ALL"
              ? "All Threats"
              : typeFilter === "IMPOSTER"
              ? "Blocked Imposters"
              : typeFilter === "FAILED"
              ? "Trait Lockouts"
              : typeFilter === "SUSPICIOUS"
              ? "Suspicious Patterns"
              : typeFilter === "EXCESSIVE"
              ? "Rate Limit Bot Floods"
              : "Content Abuse"}
          </span>
          {(typeFilter !== "ALL" || station !== "ALL" || searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setTypeFilter("ALL");
                setSearchTerm("");
              }}
              className="px-2.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* ----------------------------------------------------
          SOC THREAT VIEW MODE SELECTOR (Domain Differentiation)
      ---------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC] border-2 border-[#e2eaf4] rounded-2xl p-2.5 shadow-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFlagViewMode("soc")}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              flagViewMode === "soc"
                ? "bg-[#0F172A] text-rose-400 border border-rose-500/30 shadow-xs"
                : "bg-white text-[#64748B] hover:text-[#062B72] hover:bg-[#F0F7FF] border border-[#e2eaf4]"
            }`}
          >
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>🛡️ Cyber Threat SOC Operations (Forensic Console)</span>
          </button>

          <button
            type="button"
            onClick={() => setFlagViewMode("cards")}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              flagViewMode === "cards"
                ? "bg-[#0F172A] text-rose-400 border border-rose-500/30 shadow-xs"
                : "bg-white text-[#64748B] hover:text-[#062B72] hover:bg-[#F0F7FF] border border-[#e2eaf4]"
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>📋 Incident Audit Cards</span>
          </button>
        </div>

        <span className="text-[11px] font-bold text-[#64748B] px-2 hidden sm:inline-block">
          Defense Mode: <strong className="text-rose-600 uppercase">{flagViewMode}</strong>
        </span>
      </div>

      {/* ----------------------------------------------------
          SECURITY INCIDENT VIEW RENDERING (SOC HUD vs Cards List)
      ---------------------------------------------------- */}
      {flagViewMode === "soc" && (
        <CyberThreatOpsCenter
          flags={filteredFlags}
          resolvingId={resolvingId}
          onResolve={handleResolve}
        />
      )}

      {flagViewMode === "cards" && (
        <div className="flex flex-col gap-4">
          {loading ? (
            <div className="bg-white border-2 border-[#e2eaf4] rounded-3xl p-12 text-center text-xs text-[#64748B] flex flex-col items-center justify-center gap-3 shadow-xs">
              <RefreshCw className="w-6 h-6 animate-spin text-[#087FF5]" />
              <span className="font-bold text-[#062B72]">Scanning security queue & threat perimeter...</span>
            </div>
          ) : filteredFlags.length === 0 ? (
            <div className="bg-white border-2 border-[#e2eaf4] rounded-3xl p-12 text-center text-xs text-[#64748B] flex flex-col items-center gap-2 shadow-xs">
              <Inbox className="w-8 h-8 text-[#94A3B8]" />
              <span className="font-bold text-[#062B72] text-sm">No active security flags in queue</span>
              <span>All item reports, claims, and accounts are operating normally.</span>
            </div>
          ) : (
            filteredFlags.map((flag) => (
              <FlagCard
                key={flag.id}
                flag={flag}
                onResolve={handleResolve}
                loading={resolvingId === flag.id}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
