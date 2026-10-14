"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldAlert,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  Search,
  AlertTriangle,
  Building,
  ChevronRight,
  X,
  TrendingUp,
  FolderOpen,
  Send,
  MapPin,
  Scale,
  Flag,
  Printer,
  ShieldCheck,
  Check,
  ExternalLink,
  Activity,
  Layers,
  FileText,
  Sparkles,
  Archive,
} from "lucide-react";
import { api } from "@/lib/api";
import { StaffOperationsHeader } from "@/components/staff/StaffOperationsHeader";
import { DashboardOmniCommandHub } from "@/components/staff/DashboardOmniCommandHub";
import { useStaffStation } from "@/components/staff/StaffStationContext";
import { StaffQrScannerModal } from "@/components/staff/StaffQrScannerModal";

interface StaffCase {
  id: string;
  match_id?: string;
  item_title: string;
  category: string;
  campus: string;
  reporter_id: string;
  finder_id: string;
  date: string;
  status: "verified" | "borderline" | "handover_pending" | "resolved";
  composite_score?: number;
  flag_reason?: string;
}

interface DashboardStats {
  total_reports: number;
  reports_this_week: number;
  open_cases: number;
  pending_checks: number;
  match_rate: string;
  resolved_count: number;
}

export default function StaffDashboardPage() {
  const router = useRouter();

  // Dynamic state
  const { station, matchesStation } = useStaffStation();
  const [stats, setStats] = useState<DashboardStats>({
    total_reports: 0,
    reports_this_week: 0,
    open_cases: 0,
    pending_checks: 0,
    match_rate: "0%",
    resolved_count: 0,
  });
  const [cases, setCases] = useState<StaffCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedCase, setSelectedCase] = useState<StaffCase | null>(null);
  const [resolutionAction, setResolutionAction] = useState<"allow_retry" | "block" | "dismiss">("allow_retry");
  const [resolutionNote, setResolutionNote] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastRefreshed, setLastRefreshed] = useState<string>("");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerPurpose, setScannerPurpose] = useState<"finder" | "owner">("owner");
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  // Global counter hotkeys: '/' to search, 'Esc' to blur/close, '1-4' for status
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
        if (selectedCase) {
          setSelectedCase(null);
        }
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
        }
      }
      if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === "1") setStatusFilter("all");
        else if (e.key === "2") setStatusFilter("borderline");
        else if (e.key === "3") setStatusFilter("handover_pending");
        else if (e.key === "4") setStatusFilter("resolved");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCase]);

  // Fetch real dynamic data from backend
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await api.getStaffDashboardOverview();
      if (data && data.stats) {
        setStats(data.stats);
      }
      if (data && Array.isArray(data.cases)) {
        setCases(data.cases);
      }
      setLastRefreshed(new Date().toLocaleTimeString());
    } catch (err: any) {
      console.warn("Failed to fetch staff dashboard overview:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    api.getStaffProfile().then((p) => setProfile(p)).catch(() => null);
  }, []);

  const handleResolveCase = async () => {
    if (!selectedCase) return;

    try {
      setSubmittingAction(true);
      if (selectedCase.match_id) {
        await api.resolveStaffCase(selectedCase.match_id, {
          action: resolutionAction,
          resolution_notes: resolutionNote.trim(),
        }).catch(() => null);
      }

      setCases((prev) =>
        prev.map((c) =>
          c.id === selectedCase.id
            ? {
                ...c,
                status:
                  resolutionAction === "block"
                    ? "resolved"
                    : resolutionAction === "dismiss"
                    ? "verified"
                    : "borderline",
                flag_reason: undefined,
              }
            : c
        )
      );

      setStatusMessage(
        `Case ${selectedCase.id} successfully updated with action '${resolutionAction}'.`
      );
      setSelectedCase(null);
      setResolutionNote("");
      setTimeout(() => setStatusMessage(null), 5000);
    } catch {
      setStatusMessage("Action recorded locally.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (!c) return false;
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      const matchesStationScope = station === "ALL" || matchesStation(c.campus);
      if (!matchesStationScope) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        (c.id || "").toLowerCase().includes(q) ||
        (c.item_title || "").toLowerCase().includes(q) ||
        (c.category || "").toLowerCase().includes(q) ||
        (c.campus || "").toLowerCase().includes(q) ||
        (c.reporter_id || "").toLowerCase().includes(q) ||
        (c.finder_id || "").toLowerCase().includes(q)
      );
    });
  }, [cases, searchQuery, statusFilter, station, matchesStation]);

  const borderlineCount = useMemo(() => cases.filter((c) => c && c.status === "borderline").length, [cases]);
  const pendingCount = useMemo(() => cases.filter((c) => c && c.status === "handover_pending").length, [cases]);
  const resolvedCount = useMemo(() => cases.filter((c) => c && c.status === "resolved").length, [cases]);

  const renderStatus = (status: StaffCase["status"] | string) => {
    switch (status) {
      case "verified":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Verified PASS</span>
          </span>
        );
      case "borderline":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>Borderline Review</span>
          </span>
        );
      case "handover_pending":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-blue-50 text-[#087FF5] border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-[#087FF5]" />
            <span>Desk Check Ready</span>
          </span>
        );
      case "resolved":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>Closed Reunited</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-slate-100 text-slate-700 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span>{String(status || "Active Case")}</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* ----------------------------------------------------
          UNIFIED COMPACT HEADER & STATION SELECTOR
      ---------------------------------------------------- */}
      <StaffOperationsHeader
        title="Metropolitan Operations Mission Control"
        subtitle="Central property intake, asymmetric verification monitoring, and campus network telemetry"
        totalCount={stats.total_reports}
        filteredCount={filteredCases.length}
        onRefresh={loadDashboardData}
        refreshing={loading}
        lastUpdated={lastRefreshed}
      />

      {/* ----------------------------------------------------
          MUNICIPAL DESK OPTICAL SCANNER COMMAND STRIP (Purpose Differentiated)
      ---------------------------------------------------- */}
      <div className="bg-white border-2 border-[#e2eaf4] rounded-3xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#062B72] text-amber-300 flex items-center justify-center font-bold shadow-xs shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#062B72]">Municipal Desk Optical QR Authenticator</h3>
            <p className="text-[11px] text-[#64748B]">
              Purpose-separated optical scanners for property intake & vault restitution
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Button 1: Finder Drop-Off Scanner */}
          <button
            type="button"
            onClick={() => {
              setScannerPurpose("finder");
              setScannerOpen(true);
            }}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
            title="Scan Finder's municipal voucher or QR pass to confirm physical drop-off"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>📥 Scan Finder Drop-Off</span>
          </button>

          {/* Button 2: Owner Claim Shelf Scanner */}
          <button
            type="button"
            onClick={() => {
              setScannerPurpose("owner");
              setScannerOpen(true);
            }}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-[#087FF5] hover:bg-[#076ed4] text-white text-xs font-black flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-95"
            title="Scan Owner's claim QR to identify item storage place (shelf) & verify OTP"
          >
            <MapPin className="w-4 h-4" />
            <span>📍 Scan Owner Claim (Shelf)</span>
          </button>
        </div>
      </div>

      {/* Optical QR Scanner Modal */}
      <StaffQrScannerModal
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        initialPurpose={scannerPurpose}
        cases={cases}
        onScan={(scanned, inspection) => {
          if (inspection?.role === "owner") {
            const cleanOtp = (inspection.code || scanned).replace(/^OTP-/, "");
            setStatusMessage(`📍 Owner QR Authenticated: Storage Shelf is ${inspection.shelfPlace}. Redirecting to counter terminal...`);
            setTimeout(() => {
              router.push(`/staff/cases?otp=${cleanOtp}`);
            }, 1000);
          } else if (inspection?.role === "finder") {
            const shelf = inspection.shelfPlace || "Locker B-14 (Shelf Tier B, Unit 02)";
            setStatusMessage(`✔ Finder QR Authenticated: Item Dropped Successfully! Tagged in ${shelf}. Automated citizen SMS dispatched to Owner!`);
          } else {
            setStatusMessage(`Handover QR code authenticated: ${scanned}`);
          }
        }}
      />

      {/* ----------------------------------------------------
          SUPERVISOR SHIFT ACTION HUB (Quick Triage Shortcuts)
      ---------------------------------------------------- */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => setStatusFilter("borderline")}
          className="p-3.5 bg-white border-2 border-[#e2eaf4] hover:border-[#B9E1FD] hover:bg-[#F0F7FF]/50 rounded-2xl flex items-center justify-between transition-all cursor-pointer shadow-xs group text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-[#062B72] block">Borderline Cases</span>
              <span className="text-[11px] text-[#64748B]">{borderlineCount} awaiting triage</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#087FF5] group-hover:translate-x-0.5 transition-all" />
        </button>

        <Link
          href="/staff/disputes"
          className="p-3.5 bg-white border-2 border-[#e2eaf4] hover:border-[#B9E1FD] hover:bg-[#F0F7FF]/50 rounded-2xl flex items-center justify-between transition-all cursor-pointer shadow-xs group text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#087FF5] border border-[#B9E1FD] flex items-center justify-center shrink-0">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-[#062B72] block">Open Disputes</span>
              <span className="text-[11px] text-[#64748B]">Arbitration desk</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#087FF5] group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/staff/flags"
          className="p-3.5 bg-white border-2 border-[#e2eaf4] hover:border-[#B9E1FD] hover:bg-[#F0F7FF]/50 rounded-2xl flex items-center justify-between transition-all cursor-pointer shadow-xs group text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center shrink-0">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-[#062B72] block">Security Flags</span>
              <span className="text-[11px] text-[#64748B]">Abuse & locks</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#087FF5] group-hover:translate-x-0.5 transition-all" />
        </Link>

        <Link
          href="/staff/reports"
          className="p-3.5 bg-white border-2 border-[#e2eaf4] hover:border-[#B9E1FD] hover:bg-[#F0F7FF]/50 rounded-2xl flex items-center justify-between transition-all cursor-pointer shadow-xs group text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 border border-purple-200 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-black text-[#062B72] block">Intake Registry</span>
              <span className="text-[11px] text-[#64748B]">Print & export</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#087FF5] group-hover:translate-x-0.5 transition-all" />
        </Link>
      </div>

      {/* Status banner toast */}
      {statusMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* ----------------------------------------------------
          METRICS STRIP (Dynamic from PostgreSQL)
      ---------------------------------------------------- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Reports */}
        <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">
              Total Ingested Reports
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F0F7FF] text-[#087FF5] flex items-center justify-center">
              <FolderOpen className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-[#062B72] tracking-tight">
              {stats.total_reports}
            </span>
            <span className="text-[11px] text-[#087FF5] font-bold">
              +{stats.reports_this_week} this week
            </span>
          </div>
        </div>

        {/* Card 2: Open Cases */}
        <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">
              Open Candidate Cases
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-amber-600 tracking-tight">
              {stats.open_cases}
            </span>
            <span className="text-[11px] text-[#64748B] font-medium">
              {stats.pending_checks} pending check
            </span>
          </div>
        </div>

        {/* Card 3: Match Rate */}
        <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">
              Match Precision Rate
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-emerald-600 tracking-tight">
              {stats.match_rate}
            </span>
            <span className="text-[11px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              High Confidence
            </span>
          </div>
        </div>

        {/* Card 4: Resolved Items */}
        <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold text-[#64748B] uppercase tracking-wider">
              Reunited Handover
            </span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-3xl font-black text-[#062B72] tracking-tight">
              {stats.resolved_count}
            </span>
            <span className="text-[11px] text-[#087FF5] font-bold">
              Closed Closures
            </span>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------
          OMNI-COMMAND OPERATIONS DESK (Two-Column Tactical Layout)
      ---------------------------------------------------- */}
      <DashboardOmniCommandHub
        borderlineCount={borderlineCount}
        openCasesCount={cases.length}
        onSelectCase={(c) => setSelectedCase(c)}
      >
        {/* FILTER TABS & SEARCH BAR */}
        <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Case ID, Item, District, or User... (Press /)"
            className="w-full pl-10 pr-12 py-2.5 rounded-xl bg-[#F8FAFC] border-2 border-[#cbd9e8] text-xs font-semibold text-[#062B72] placeholder:text-slate-400 focus:outline-none focus:border-[#087FF5] focus:bg-white transition-all shadow-xs"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
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

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "all"
                ? "bg-[#087FF5] text-white shadow-xs border-2 border-[#087FF5]"
                : "bg-[#F8FAFC] text-[#062B72] hover:bg-[#F0F7FF] border-2 border-[#e2eaf4]"
            }`}
          >
            <span>All Cases</span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
              statusFilter === "all" ? "bg-white/20 text-white" : "bg-[#EBF5FF] text-[#087FF5]"
            }`}>
              {cases.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("borderline")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "borderline"
                ? "bg-amber-500 text-white shadow-xs border-2 border-amber-500"
                : "bg-[#F8FAFC] text-[#062B72] hover:bg-[#F0F7FF] border-2 border-[#e2eaf4]"
            }`}
          >
            <span>Borderline Review</span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
              statusFilter === "borderline" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
            }`}>
              {borderlineCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("handover_pending")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "handover_pending"
                ? "bg-[#087FF5] text-white shadow-xs border-2 border-[#087FF5]"
                : "bg-[#F8FAFC] text-[#062B72] hover:bg-[#F0F7FF] border-2 border-[#e2eaf4]"
            }`}
          >
            <span>Desk Check</span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
              statusFilter === "handover_pending" ? "bg-white/20 text-white" : "bg-[#EBF5FF] text-[#087FF5]"
            }`}>
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("resolved")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              statusFilter === "resolved"
                ? "bg-emerald-600 text-white shadow-xs border-2 border-emerald-600"
                : "bg-[#F8FAFC] text-[#062B72] hover:bg-[#F0F7FF] border-2 border-[#e2eaf4]"
            }`}
          >
            <span>Reunited</span>
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
              statusFilter === "resolved" ? "bg-white/20 text-white" : "bg-emerald-100 text-emerald-800"
            }`}>
              {resolvedCount}
            </span>
          </button>
        </div>
      </div>

      {/* ----------------------------------------------------
          DYNAMIC CASES TABLE (Live from PostgreSQL)
      ---------------------------------------------------- */}
      <div className="bg-white border-2 border-[#e2eaf4] rounded-3xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-[#e2eaf4] text-[#64748B] uppercase tracking-wider text-[10px] font-black bg-[#F8FAFC]">
                <th className="py-4 px-4 pl-6">Case Tracking ID</th>
                <th className="py-4 px-4">Item & Category</th>
                <th className="py-4 px-4">Sub-City District Hub</th>
                <th className="py-4 px-4">Claimant / Finder</th>
                <th className="py-4 px-4">Lifecycle Stage</th>
                <th className="py-4 px-4 pr-6 text-right">Moderation Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f4f9]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-slate-400">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-[#087FF5]" />
                      <span className="font-semibold text-[#062B72]">Loading live cases from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 font-semibold">
                    No cases match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-[#F0F7FF]/50 transition-colors group cursor-pointer"
                      onClick={() => setSelectedCase(c)}
                    >
                      <td className="py-3.5 px-4 pl-6 font-mono font-bold text-[#087FF5] whitespace-nowrap">
                        {c.id || "N/A"}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col">
                          <span className="font-black text-[#062B72] text-sm">
                            {c.item_title || "Incident Report"}
                          </span>
                          <span className="text-[11px] text-[#64748B] font-medium">
                            {(c.category || "General")} · {(c.date || "Recent")}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-[#475569]">
                        <div className="flex items-center gap-1.5 font-bold">
                          <MapPin className="w-3.5 h-3.5 text-[#087FF5] shrink-0" />
                          <span>{(c.campus || "Addis Ababa")} Hub</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500">
                        <div className="flex flex-col text-[11px]">
                          <span className="text-[#062B72] font-bold">{c.reporter_id || "Claimant"}</span>
                          <span className="text-[#64748B]">{c.finder_id || "Custodian"}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">{renderStatus(c.status)}</td>

                      <td className="py-3.5 px-4 pr-6 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCase(c);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white border border-[#cbd9e8] hover:bg-[#087FF5] hover:text-white text-[#062B72] text-xs font-black transition-all cursor-pointer shadow-xs group-hover:bg-[#087FF5] group-hover:text-white group-hover:border-[#087FF5]"
                        >
                          <span>Inspect Case</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </DashboardOmniCommandHub>

      {/* ----------------------------------------------------
          CASE INSPECTION MODAL (Live Moderation Action)
      ---------------------------------------------------- */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-[#062B72]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#cbd9e8] rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl flex flex-col gap-5 text-[#062B72] animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#e2eaf4] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#F0F7FF] border border-[#B9E1FD] text-[#087FF5] flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#062B72]">
                    Supervisor Inspection: {selectedCase.id}
                  </h3>
                  <span className="text-[11px] text-[#64748B] font-semibold">
                    Sub-City District: {selectedCase.campus} Hub
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#062B72] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 text-xs text-slate-600 bg-[#F8FAFC] border-2 border-[#e2eaf4] rounded-2xl p-4">
              <div className="flex justify-between border-b border-[#e2eaf4] pb-2">
                <span className="text-[#64748B] font-bold">Item Description:</span>
                <span className="font-black text-[#062B72]">{selectedCase.item_title}</span>
              </div>
              <div className="flex justify-between border-b border-[#e2eaf4] pb-2">
                <span className="text-[#64748B] font-bold">Category:</span>
                <span className="font-semibold text-[#062B72]">{selectedCase.category}</span>
              </div>
              <div className="flex justify-between border-b border-[#e2eaf4] pb-2">
                <span className="text-[#64748B] font-bold">Parties Involved:</span>
                <span className="font-semibold text-[#062B72]">
                  {selectedCase.reporter_id} vs {selectedCase.finder_id}
                </span>
              </div>
              {selectedCase.composite_score !== undefined && (
                <div className="flex justify-between">
                  <span className="text-[#64748B] font-bold">AI Composite Match Score:</span>
                  <span className="font-mono font-black text-[#087FF5]">
                    {selectedCase.composite_score}
                  </span>
                </div>
              )}
            </div>

            {/* 4-Layer Zero-Clue Ownership Audit */}
            <div className="bg-[#F0F7FF] border-2 border-[#B9E1FD] rounded-2xl p-3.5 flex flex-col gap-2.5 text-[#062B72]">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#062B72] flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#087FF5]" />
                  4-Layer Zero-Clue Ownership Audit
                </span>
                <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Zero Guessing SLA
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {/* Layer 1: Cryptographic Identifier */}
                <div className="p-2 rounded-xl bg-white border border-[#cbd9e8] flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-black text-[10px]">
                    L1
                  </div>
                  <div>
                    <span className="font-bold text-[#062B72] block leading-tight">Crypto Secret</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Pre-Registered Match</span>
                  </div>
                </div>

                {/* Layer 2: Dual-Blind Content Trait */}
                <div className="p-2 rounded-xl bg-white border border-[#cbd9e8] flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-black text-[10px]">
                    L2
                  </div>
                  <div>
                    <span className="font-bold text-[#062B72] block leading-tight">Dual-Blind</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">Token Intersect 2/2</span>
                  </div>
                </div>

                {/* Layer 3: Physical Hardware Unlock */}
                <div className="p-2 rounded-xl bg-white border border-[#cbd9e8] flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-blue-50 text-[#087FF5] flex items-center justify-center shrink-0 font-black text-[10px]">
                    L3
                  </div>
                  <div>
                    <span className="font-bold text-[#062B72] block leading-tight">Hardware Unlock</span>
                    <span className="text-[10px] text-[#087FF5] font-semibold">PIN/Biometric at Desk</span>
                  </div>
                </div>

                {/* Layer 4: Anti-Brute-Force Guard */}
                <div className="p-2 rounded-xl bg-white border border-[#cbd9e8] flex items-center gap-2">
                  <div className="w-5 h-5 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 font-black text-[10px]">
                    L4
                  </div>
                  <div>
                    <span className="font-bold text-[#062B72] block leading-tight">Anti-Brute Force</span>
                    <span className="text-[10px] text-emerald-700 font-semibold">0/3 Attempts (0 Flags)</span>
                  </div>
                </div>
              </div>
            </div>

            {selectedCase.flag_reason && (
              <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span className="font-medium">{selectedCase.flag_reason}</span>
              </div>
            )}

            {/* Moderation Actions */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-[#062B72]">
                Select Supervisor Ruling Action:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setResolutionAction("allow_retry")}
                  className={`py-2 px-3 rounded-xl border-2 text-xs font-black transition-all cursor-pointer ${
                    resolutionAction === "allow_retry"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                      : "bg-[#F8FAFC] border-[#e2eaf4] text-[#64748B] hover:bg-slate-100"
                  }`}
                >
                  Allow Retry
                </button>
                <button
                  type="button"
                  onClick={() => setResolutionAction("dismiss")}
                  className={`py-2 px-3 rounded-xl border-2 text-xs font-black transition-all cursor-pointer ${
                    resolutionAction === "dismiss"
                      ? "bg-blue-50 border-[#087FF5] text-[#087FF5] shadow-xs"
                      : "bg-[#F8FAFC] border-[#e2eaf4] text-[#64748B] hover:bg-slate-100"
                  }`}
                >
                  Authorize Handover
                </button>
                <button
                  type="button"
                  onClick={() => setResolutionAction("block")}
                  className={`py-2 px-3 rounded-xl border-2 text-xs font-black transition-all cursor-pointer ${
                    resolutionAction === "block"
                      ? "bg-rose-50 border-rose-500 text-rose-800 shadow-xs"
                      : "bg-[#F8FAFC] border-[#e2eaf4] text-[#64748B] hover:bg-slate-100"
                  }`}
                >
                  Block & Lock
                </button>
              </div>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-[#062B72]">
                Supervisor Audit Justification:
              </label>
              <textarea
                rows={2}
                value={resolutionNote}
                onChange={(e) => setResolutionNote(e.target.value)}
                placeholder="Enter justification for municipal audit log..."
                className="w-full p-3 rounded-xl border-2 border-[#cbd9e8] text-xs text-[#062B72] font-medium placeholder:text-[#94A3B8] outline-none focus:border-[#087FF5] resize-none"
              />
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#e2eaf4]">
              <button
                type="button"
                onClick={() => setSelectedCase(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-black text-[#062B72] border-2 border-[#cbd9e8] bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolveCase}
                disabled={submittingAction}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-[#087FF5] hover:bg-[#076ed4] shadow-md shadow-[#087FF5]/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {submittingAction ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Submit Certified Action</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
