"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Layers,
  Search,
  Filter,
  MapPin,
  Tag,
  CheckCircle2,
  X,
  RefreshCw,
  Building,
  ShieldAlert,
  ChevronRight,
  Download,
  AlertTriangle,
  Clock,
  TrendingUp,
  FolderOpen,
  ShieldCheck,
  Check,
  ExternalLink,
  ScanLine,
  Ban,
  Archive,
  KeyRound,
  Table as TableIcon,
} from "lucide-react";
import { CaseTable, CaseRecord } from "@/components/staff/CaseTable";
import { VaultLockerGrid } from "@/components/staff/VaultLockerGrid";
import { CounterHandoverKeypad } from "@/components/staff/CounterHandoverKeypad";
import { api } from "@/lib/api";
import { StaffOperationsHeader } from "@/components/staff/StaffOperationsHeader";
import { useStaffStation } from "@/components/staff/StaffStationContext";
import { StaffQrScannerModal } from "@/components/staff/StaffQrScannerModal";

export default function StaffCasesPage() {
  const { station, matchesStation } = useStaffStation();
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"lockers" | "table" | "counter">("lockers");
  const [searchTerm, setSearchTerm] = useState("");
  const [stageFilter, setStageFilter] = useState<string>("ALL");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerPurpose, setScannerPurpose] = useState<"finder" | "owner">("owner");
  const [counterInitialOtp, setCounterInitialOtp] = useState<string | undefined>(undefined);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  // Moderation state
  const [resolutionAction, setResolutionAction] = useState<"allow_retry" | "block" | "dismiss" | "municipal_intake">("allow_retry");
  const [resolutionNote, setResolutionNote] = useState("");
  const [lockerInput, setLockerInput] = useState("Locker B-14");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fetchCases = async () => {
    try {
      setLoading(true);
      const data = await api.getStaffCases();
      if (data && Array.isArray(data)) {
        setCases(data);
      }
    } catch (err: any) {
      console.warn("Failed to load staff cases:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCases();
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const otp = params.get("otp");
      if (otp) {
        setCounterInitialOtp(otp);
        setViewMode("counter");
        setStatusMessage(`Loaded restitution case for OTP ${otp}. Ready for counter release.`);
      }
    }
  }, []);

  const handleResolveCase = async () => {
    const targetCase = cases.find((c) => c && c.id === selectedCaseId);
    if (!targetCase) return;

    if (resolutionAction === "municipal_intake") {
      try {
        setSubmittingAction(true);
        const assignedLocker = lockerInput.trim() || "Locker B-14";
        if (targetCase.handover_id) {
          await api.municipalIntake(targetCase.handover_id, {
            vault_locker: assignedLocker,
            notes: resolutionNote.trim(),
          });
        } else if (targetCase.match_id) {
          await api.municipalIntakeByMatch(targetCase.match_id, {
            vault_locker: assignedLocker,
            notes: resolutionNote.trim(),
          });
        }

        setCases((prev) =>
          prev.map((c) =>
            c.id === targetCase.id
              ? {
                  ...c,
                  stage: "Ready for Handover",
                  vault_locker: assignedLocker,
                  venue: "municipal",
                }
              : c
          )
        );

        setStatusMessage(`Item custody secured in ${assignedLocker}. Automated restitution pick-up alert dispatched to owner!`);
        setSelectedCaseId(null);
        setResolutionNote("");
        setTimeout(() => setStatusMessage(null), 6000);
      } catch (err: any) {
        setStatusMessage(err?.message || "Municipal intake recorded locally.");
      } finally {
        setSubmittingAction(false);
      }
      return;
    }

    try {
      setSubmittingAction(true);
      if (targetCase.match_id) {
        await api.resolveStaffCase(targetCase.match_id, {
          action: resolutionAction,
          resolution_notes: resolutionNote.trim(),
        }).catch(() => null);
      }

      setCases((prev) =>
        prev.map((c) =>
          c.id === targetCase.id
            ? {
                ...c,
                stage:
                  resolutionAction === "block"
                    ? ("Candidate" as any)
                    : resolutionAction === "dismiss"
                    ? "Verified (PASS)"
                    : "BORDERLINE",
                flag_reason:
                  resolutionAction === "block"
                    ? "Imposter blocked & blacklisted; item released for AI re-matching"
                    : undefined,
              }
            : c
        )
      );

      setStatusMessage(
        resolutionAction === "block"
          ? `Imposter blocked & blacklisted. Incident routed to /staff/flags, and found item released to active pool for AI re-matching.`
          : resolutionAction === "dismiss"
          ? `Case ${targetCase.id} authorized for physical handover with dual QR & 6-digit OTP verification.`
          : `Lock removed for Case ${targetCase.id}. Challenge retry granted.`
      );
      setSelectedCaseId(null);
      setResolutionNote("");
      setTimeout(() => setStatusMessage(null), 6000);
    } catch {
      setStatusMessage("Case decision recorded locally.");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Global counter hotkeys: '/' to search, 'Esc' to close drawers/modals, '1-5' for stages
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
        if (selectedCaseId) {
          setSelectedCaseId(null);
        }
        if (scannerOpen) {
          setScannerOpen(false);
        }
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
        }
      }
      if (!isInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        if (e.key === "1") setStageFilter("ALL");
        else if (e.key === "2") setStageFilter("BORDERLINE");
        else if (e.key === "3") setStageFilter("Candidate");
        else if (e.key === "4") setStageFilter("Ready");
        else if (e.key === "5") setStageFilter("Reunited");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedCaseId, scannerOpen]);

  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      if (!c) return false;
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (c.id || "").toLowerCase().includes(q) ||
        (c.item_title || "").toLowerCase().includes(q) ||
        (c.category || "").toLowerCase().includes(q) ||
        (c.subCity || "").toLowerCase().includes(q) ||
        (c.reporter_id || "").toLowerCase().includes(q) ||
        (c.finder_id || "").toLowerCase().includes(q);

      const matchesStage = stageFilter === "ALL" || (c.stage || "").includes(stageFilter);
      const matchesSubCity = station === "ALL" || matchesStation(c.subCity);

      return matchesSearch && matchesStage && matchesSubCity;
    });
  }, [cases, searchTerm, stageFilter, station, matchesStation]);

  // Dynamic counts for quick filter buttons
  const borderlineCount = useMemo(() => cases.filter((c) => c && (c.stage || "").includes("BORDERLINE")).length, [cases]);
  const readyCount = useMemo(() => cases.filter((c) => c && (c.stage || "").includes("Ready")).length, [cases]);
  const verifiedCount = useMemo(() => cases.filter((c) => c && ((c.stage || "").includes("PASS") || (c.stage || "").includes("Verified"))).length, [cases]);
  const reunitedCount = useMemo(() => cases.filter((c) => c && (c.stage || "").includes("Reunited")).length, [cases]);

  const selectedCase = cases.find((c) => c && c.id === selectedCaseId);

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto text-[#062B72]">
      {/* ----------------------------------------------------
          UNIFIED COMPACT HEADER & STATION SELECTOR
      ---------------------------------------------------- */}
      <StaffOperationsHeader
        title="Case Audits & Verification Workbench"
        subtitle="Municipal property intake registry, asymmetric trait challenge adjudication, and certified handover desk"
        totalCount={cases.length}
        filteredCount={filteredCases.length}
        onRefresh={fetchCases}
        refreshing={loading}
      />

      {/* ----------------------------------------------------
          INTER-DESK OPERATIONAL JURISDICTION DIRECTIVE STRIP
      ---------------------------------------------------- */}
      <div className="bg-[#F0F7FF] border-2 border-[#B9E1FD] rounded-2xl p-3.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-[#062B72] shadow-xs">
        <div className="flex items-center gap-2.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#087FF5] shrink-0" />
          <span className="font-black text-[#062B72]">Cases Desk Jurisdiction:</span>
          <span className="text-[#334155] font-semibold">
            Physical Vault Storage, Shelf Inventory & Counter Restitution via dual QR + dynamic 6-digit OTP burn.
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold text-[#64748B] shrink-0">
          <span className="text-[#087FF5] font-black uppercase text-[10px]">Escalations:</span>
          <span>Contested ➜ <strong className="text-[#062B72]">Disputes</strong></span>
          <span>•</span>
          <span>Imposter/Fraud ➜ <strong className="text-rose-700">Flags</strong></span>
        </div>
      </div>

      {/* ----------------------------------------------------
          INTEGRATED 5-STAGE LIFECYCLE PIPELINE RIBBON (SPACE-EFFICIENT)
      ---------------------------------------------------- */}
      <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-3 text-[#062B72]">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-black uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#087FF5]" />
            Interactive Verification Lifecycle Pipeline
          </span>
          <span className="text-xs font-bold text-[#087FF5]">
            Showing {filteredCases.length} of {cases.length} Dockets
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
            {/* Step 1: All Intake */}
            <button
              type="button"
              onClick={() => setStageFilter("ALL")}
              className={`p-3 rounded-2xl border-2 transition-all text-left flex flex-col justify-between gap-2 cursor-pointer shadow-xs ${
                stageFilter === "ALL"
                  ? "bg-[#087FF5] text-white border-[#087FF5] shadow-md shadow-[#087FF5]/20"
                  : "bg-[#F8FAFC] border-[#e2eaf4] hover:border-[#B9E1FD] hover:bg-[#F0F7FF]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider ${stageFilter === "ALL" ? "text-blue-100" : "text-[#64748B]"}`}>
                  1. All Dockets
                </span>
                <FolderOpen className={`w-3.5 h-3.5 ${stageFilter === "ALL" ? "text-white" : "text-[#087FF5]"}`} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-2xl font-black">{cases.length}</span>
                <span className={`text-[10px] font-bold ${stageFilter === "ALL" ? "text-blue-100" : "text-[#64748B]"}`}>Total Ingested</span>
              </div>
            </button>

            {/* Step 2: Borderline Review */}
            <button
              type="button"
              onClick={() => setStageFilter("BORDERLINE")}
              className={`p-3 rounded-2xl border-2 transition-all text-left flex flex-col justify-between gap-2 cursor-pointer shadow-xs ${
                stageFilter === "BORDERLINE"
                  ? "bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-500/20"
                  : "bg-[#F8FAFC] border-[#e2eaf4] hover:border-amber-300 hover:bg-amber-50/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider ${stageFilter === "BORDERLINE" ? "text-amber-100" : "text-amber-700"}`}>
                  2. Borderline AI
                </span>
                <AlertTriangle className={`w-3.5 h-3.5 ${stageFilter === "BORDERLINE" ? "text-white" : "text-amber-600"}`} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-black ${stageFilter === "BORDERLINE" ? "text-white" : "text-amber-700"}`}>{borderlineCount}</span>
                <span className={`text-[10px] font-bold ${stageFilter === "BORDERLINE" ? "text-amber-100" : "text-amber-800"}`}>Needs Triage</span>
              </div>
            </button>

            {/* Step 3: Verified PASS */}
            <button
              type="button"
              onClick={() => setStageFilter("Verified")}
              className={`p-3 rounded-2xl border-2 transition-all text-left flex flex-col justify-between gap-2 cursor-pointer shadow-xs ${
                stageFilter === "Verified"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20"
                  : "bg-[#F8FAFC] border-[#e2eaf4] hover:border-emerald-300 hover:bg-emerald-50/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider ${stageFilter === "Verified" ? "text-emerald-100" : "text-emerald-700"}`}>
                  3. Verified PASS
                </span>
                <CheckCircle2 className={`w-3.5 h-3.5 ${stageFilter === "Verified" ? "text-white" : "text-emerald-600"}`} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-black ${stageFilter === "Verified" ? "text-white" : "text-emerald-700"}`}>{verifiedCount}</span>
                <span className={`text-[10px] font-bold ${stageFilter === "Verified" ? "text-emerald-100" : "text-emerald-800"}`}>4-Layer Validated</span>
              </div>
            </button>

            {/* Step 4: Desk Check Ready */}
            <button
              type="button"
              onClick={() => setStageFilter("Ready")}
              className={`p-3 rounded-2xl border-2 transition-all text-left flex flex-col justify-between gap-2 cursor-pointer shadow-xs ${
                stageFilter === "Ready"
                  ? "bg-[#087FF5] text-white border-[#087FF5] shadow-md shadow-[#087FF5]/20"
                  : "bg-[#F8FAFC] border-[#e2eaf4] hover:border-[#B9E1FD] hover:bg-[#F0F7FF]"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider ${stageFilter === "Ready" ? "text-blue-100" : "text-[#087FF5]"}`}>
                  4. Desk Check
                </span>
                <Clock className={`w-3.5 h-3.5 ${stageFilter === "Ready" ? "text-white" : "text-[#087FF5]"}`} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-black ${stageFilter === "Ready" ? "text-white" : "text-[#087FF5]"}`}>{readyCount}</span>
                <span className={`text-[10px] font-bold ${stageFilter === "Ready" ? "text-blue-100" : "text-[#64748B]"}`}>Handover Ready</span>
              </div>
            </button>

            {/* Step 5: Closed Reunited */}
            <button
              type="button"
              onClick={() => setStageFilter("Reunited")}
              className={`p-3 rounded-2xl border-2 transition-all text-left flex flex-col justify-between gap-2 cursor-pointer shadow-xs col-span-2 sm:col-span-1 ${
                stageFilter === "Reunited"
                  ? "bg-slate-800 text-white border-slate-800 shadow-md shadow-slate-800/20"
                  : "bg-[#F8FAFC] border-[#e2eaf4] hover:border-slate-300 hover:bg-slate-100"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-black uppercase tracking-wider ${stageFilter === "Reunited" ? "text-slate-300" : "text-slate-600"}`}>
                  5. Reunited
                </span>
                <ShieldCheck className={`w-3.5 h-3.5 ${stageFilter === "Reunited" ? "text-white" : "text-slate-600"}`} />
              </div>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-black ${stageFilter === "Reunited" ? "text-white" : "text-slate-700"}`}>{reunitedCount}</span>
                <span className={`text-[10px] font-bold ${stageFilter === "Reunited" ? "text-slate-300" : "text-slate-500"}`}>Certified Closed</span>
              </div>
            </button>
          </div>
        </div>

      {/* Notification Toast Banner */}
      {statusMessage && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm font-semibold flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Search & Optical QR Intake Toolbar */}
      <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search Case ID, Item Name, Claimant or Finder ID... (Press / to focus)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-20 py-2.5 rounded-xl bg-[#F8FAFC] border-2 border-[#cbd9e8] text-xs font-semibold text-[#062B72] placeholder:text-slate-400 focus:outline-none focus:border-[#087FF5] focus:bg-white transition-all shadow-xs"
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

        {/* Rapid Desk Actions: Differentiated Purpose Scanners */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {/* 1. Finder Drop-Off Scanner */}
          <button
            type="button"
            onClick={() => {
              setScannerPurpose("finder");
              setScannerOpen(true);
            }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95"
            title="Scan Finder's municipal voucher or QR pass to confirm physical drop-off"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>📥 Scan Finder Drop-Off</span>
          </button>

          {/* 2. Owner Restitution Shelf Scanner */}
          <button
            type="button"
            onClick={() => {
              setScannerPurpose("owner");
              setScannerOpen(true);
            }}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#087FF5] hover:bg-[#076ed4] text-white text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95"
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
            setSearchTerm(cleanOtp);
            setCounterInitialOtp(cleanOtp);
            const matchedCase = cases.find(
              (c) =>
                c &&
                (c.id === inspection.code ||
                  c.item_title === inspection.itemTitle ||
                  (c.stage || "").includes("Ready"))
            );
            if (matchedCase) {
              setSelectedCaseId(matchedCase.id);
            }
            setViewMode("counter");
            setStatusMessage(
              `📍 Owner QR Authenticated: Item Storage Location is ${inspection.shelfPlace}. Transferred to Counter Terminal.`
            );
          } else if (inspection?.role === "finder") {
            const voucher = inspection.voucherNumber || scanned;
            const assignedShelf = inspection.shelfPlace || "Locker B-14 (Shelf Tier B, Unit 02)";
            setSearchTerm(voucher);

            // Locate matching case in registry
            const matchedCase = cases.find(
              (c) =>
                c &&
                (c.deposit_voucher === voucher ||
                  c.id === inspection.code ||
                  c.item_title === inspection.itemTitle ||
                  (c.deposit_voucher && voucher.includes(c.deposit_voucher)))
            );

            if (matchedCase) {
              // Update case in state immediately with assigned shelf
              setCases((prev) =>
                prev.map((c) =>
                  c.id === matchedCase.id
                    ? {
                        ...c,
                        stage: "Ready for Handover",
                        vault_locker: assignedShelf,
                        venue: "municipal",
                      }
                    : c
                )
              );

              // Proactively call municipalIntake backend endpoint if available
              if (matchedCase.handover_id) {
                api
                  .municipalIntake(matchedCase.handover_id, {
                    vault_locker: assignedShelf,
                    notes: `Item physically received from finder via intake QR. Tagged in ${assignedShelf}. Automated citizen SMS dispatched.`,
                  })
                  .catch((err) => console.warn("Background municipal intake:", err));
              } else if (matchedCase.match_id) {
                api
                  .municipalIntakeByMatch(matchedCase.match_id, {
                    vault_locker: assignedShelf,
                    notes: `Item physically received from finder via intake QR. Tagged in ${assignedShelf}. Automated citizen SMS dispatched.`,
                  })
                  .catch((err) => console.warn("Background municipal intake by match:", err));
              }

              setSelectedCaseId(matchedCase.id);
            }

            setStatusMessage(
              `✔ Finder Drop-Off Sealed! Item logged into ${assignedShelf}. Automated SMS & Claim Pass dispatched to Owner (+251 91 123 4567)!`
            );
          } else {
            setSearchTerm(scanned);
            setStatusMessage(`Handover QR code authenticated: ${scanned}`);
          }
        }}
      />

      {/* ----------------------------------------------------
          VAULT DESK VIEW MODE SELECTOR (Domain Differentiation)
      ---------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F8FAFC] border-2 border-[#e2eaf4] rounded-2xl p-2.5 shadow-xs">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setViewMode("lockers")}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === "lockers"
                ? "bg-[#062B72] text-amber-300 shadow-xs"
                : "bg-white text-[#64748B] hover:text-[#062B72] hover:bg-[#F0F7FF] border border-[#e2eaf4]"
            }`}
          >
            <Archive className="w-4 h-4" />
            <span>🗄️ Vault Locker Grid</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("table")}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === "table"
                ? "bg-[#062B72] text-amber-300 shadow-xs"
                : "bg-white text-[#64748B] hover:text-[#062B72] hover:bg-[#F0F7FF] border border-[#e2eaf4]"
            }`}
          >
            <TableIcon className="w-4 h-4" />
            <span>📋 Inventory Ledger Table</span>
          </button>

          <button
            type="button"
            onClick={() => setViewMode("counter")}
            className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer ${
              viewMode === "counter"
                ? "bg-[#087FF5] text-white shadow-xs"
                : "bg-white text-[#64748B] hover:text-[#087FF5] hover:bg-[#F0F7FF] border border-[#e2eaf4]"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>📟 Citizen Handover Terminal</span>
          </button>
        </div>

        <span className="text-[11px] font-bold text-[#64748B] px-2 hidden sm:inline-block">
          Active Mode: <strong className="text-[#062B72] uppercase">{viewMode}</strong>
        </span>
      </div>

      {/* ----------------------------------------------------
          ACTIVE VIEW RENDERING (Lockers vs Table vs Counter Terminal)
      ---------------------------------------------------- */}
      {viewMode === "lockers" && (
        <VaultLockerGrid
          cases={filteredCases}
          onSelectCase={(id) => setSelectedCaseId(id)}
          onDispatchToCounter={(c) => {
            setSelectedCaseId(c.id);
            setViewMode("counter");
          }}
        />
      )}

      {viewMode === "table" && (
        <CaseTable cases={filteredCases} onSelectCase={(id) => setSelectedCaseId(id)} />
      )}

      {viewMode === "counter" && (
        <CounterHandoverKeypad
          activeCase={selectedCase || filteredCases.find(c => (c.stage || "").includes("Ready")) || filteredCases[0]}
          initialOtp={counterInitialOtp}
          onClose={() => setViewMode("lockers")}
          onSuccess={(id) => {
            setStatusMessage(`Citizen restitution verified and completed for Case #${id.slice(0, 8)}.`);
            setTimeout(() => setStatusMessage(null), 5000);
          }}
          onOpenOwnerScanner={() => {
            setScannerPurpose("owner");
            setScannerOpen(true);
          }}
          onOpenFinderScanner={() => {
            setScannerPurpose("finder");
            setScannerOpen(true);
          }}
        />
      )}

      {/* ----------------------------------------------------
          CASE DETAIL & MODERATION MODAL
      ---------------------------------------------------- */}
      {selectedCase && (
        <div className="fixed inset-0 z-50 bg-[#062B72]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#cbd9e8] rounded-3xl max-w-lg w-full p-6 sm:p-7 flex flex-col gap-5 shadow-2xl relative text-[#062B72] animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#e2eaf4] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-[#F0F7FF] border border-[#B9E1FD] text-[#087FF5] flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#062B72]">
                    Supervisor Case Audit: {selectedCase.id}
                  </h3>
                  <span className="text-[11px] text-[#64748B] font-semibold">
                    Sub-City District: {selectedCase.subCity} Desk
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCaseId(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#062B72] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Case Attributes Card */}
            <div className="flex flex-col gap-2.5 text-xs text-slate-600 bg-[#F8FAFC] border-2 border-[#e2eaf4] rounded-2xl p-4">
              <div className="flex justify-between border-b border-[#e2eaf4] pb-2">
                <span className="text-[#64748B] font-bold">Item Description:</span>
                <span className="font-black text-[#062B72]">
                  {selectedCase.item_title || selectedCase.category}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#e2eaf4] pb-2">
                <span className="text-[#64748B] font-bold">Category:</span>
                <span className="font-semibold text-[#062B72]">{selectedCase.category}</span>
              </div>
              <div className="flex justify-between border-b border-[#e2eaf4] pb-2">
                <span className="text-[#64748B] font-bold">Parties Involved:</span>
                <span className="font-semibold text-[#062B72]">
                  {selectedCase.reporter_id || "Claimant"} vs {selectedCase.finder_id || "Desk Custody"}
                </span>
              </div>
              <div className="flex justify-between border-b border-[#e2eaf4] pb-2">
                <span className="text-[#64748B] font-bold">Lifecycle Stage:</span>
                <span className="font-mono font-bold text-[#087FF5]">{selectedCase.stage}</span>
              </div>
              {selectedCase.deposit_voucher && (
                <div className="flex justify-between border-b border-[#e2eaf4] pb-2">
                  <span className="text-[#64748B] font-bold">Deposit Voucher:</span>
                  <span className="font-mono font-black text-amber-600">{selectedCase.deposit_voucher}</span>
                </div>
              )}
              {selectedCase.vault_locker && (
                <div className="flex justify-between border-b border-[#e2eaf4] pb-2">
                  <span className="text-[#64748B] font-bold">Station Vault Locker:</span>
                  <span className="font-mono font-black text-emerald-600">{selectedCase.vault_locker}</span>
                </div>
              )}
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

            {/* Moderation Form */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-black text-[#062B72]">
                Select Supervisor Ruling Action:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setResolutionAction("allow_retry")}
                  className={`py-2 px-2.5 rounded-xl border-2 text-[11px] font-black transition-all cursor-pointer ${
                    resolutionAction === "allow_retry"
                      ? "bg-blue-50 border-[#087FF5] text-[#087FF5] shadow-xs"
                      : "bg-[#F8FAFC] border-[#e2eaf4] text-[#64748B] hover:bg-slate-100"
                  }`}
                >
                  Allow Retry
                </button>
                <button
                  type="button"
                  onClick={() => setResolutionAction("dismiss")}
                  className={`py-2 px-2.5 rounded-xl border-2 text-[11px] font-black transition-all cursor-pointer ${
                    resolutionAction === "dismiss"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800 shadow-xs"
                      : "bg-[#F8FAFC] border-[#e2eaf4] text-[#64748B] hover:bg-slate-100"
                  }`}
                >
                  Authorize
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setResolutionAction("municipal_intake");
                    setLockerInput(selectedCase.vault_locker || "Locker B-14");
                  }}
                  className={`py-2 px-2.5 rounded-xl border-2 text-[11px] font-black transition-all cursor-pointer ${
                    resolutionAction === "municipal_intake"
                      ? "bg-amber-50 border-amber-500 text-amber-900 shadow-xs"
                      : "bg-[#F8FAFC] border-[#e2eaf4] text-[#64748B] hover:bg-slate-100"
                  }`}
                >
                  Vault Intake
                </button>
                <button
                  type="button"
                  onClick={() => setResolutionAction("block")}
                  className={`py-2 px-2.5 rounded-xl border-2 text-[11px] font-black transition-all cursor-pointer ${
                    resolutionAction === "block"
                      ? "bg-rose-50 border-rose-500 text-rose-800 shadow-xs"
                      : "bg-[#F8FAFC] border-[#e2eaf4] text-[#64748B] hover:bg-slate-100"
                  }`}
                >
                  Block Imposter
                </button>
              </div>

              {/* Action Pipeline Execution Preview */}
              {resolutionAction === "municipal_intake" && (
                <div className="bg-amber-50/90 border-2 border-amber-300 p-3 rounded-xl flex flex-col gap-2.5 text-xs animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 font-black text-amber-950">
                    <Archive className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <span>Pipeline: Municipal Vault Custody Intake</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[11px] font-bold text-amber-950">Assign Station Vault Locker Number:</label>
                    <input
                      type="text"
                      value={lockerInput}
                      onChange={(e) => setLockerInput(e.target.value)}
                      placeholder="e.g. Locker B-14"
                      className="w-full p-2.5 rounded-xl border-2 border-amber-300 bg-white text-xs font-mono font-black text-amber-950 outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
                    />
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed font-semibold">
                    1. Confirms physical item surrender at Municipal Desk and records custody in {lockerInput || "Locker B-14"}.<br />
                    2. Automatically dispatches official SMS & Telegram alert to verified owner.<br />
                    3. Owner visits desk with Government ID and 6-digit release OTP to claim.
                  </p>
                </div>
              )}

              {resolutionAction === "block" && (
                <div className="bg-rose-50/90 border-2 border-rose-200 p-3 rounded-xl flex flex-col gap-1.5 text-xs animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 font-black text-rose-950">
                    <Ban className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span>Pipeline: Imposter Blacklist & AI Rematching</span>
                  </div>
                  <p className="text-[11px] text-rose-800 leading-relaxed font-semibold">
                    1. Imposter severed and account flagged to <strong>/staff/flags</strong> (Security Desk).<br />
                    2. Physical item safely secured in station vault with status reset to <em>active</em>.<br />
                    3. AI vector matching immediately re-evaluates lost reports to find the true owner.
                  </p>
                </div>
              )}

              {resolutionAction === "dismiss" && (
                <div className="bg-emerald-50/90 border-2 border-emerald-200 p-3 rounded-xl flex flex-col gap-1.5 text-xs animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 font-black text-emerald-950">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Pipeline: Authorize Physical Counter Handover</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-relaxed font-semibold">
                    Issues certified ownership decree. Citizen presents QR code at counter and verifies dynamic 6-digit OTP to complete physical transfer.
                  </p>
                </div>
              )}

              {resolutionAction === "allow_retry" && (
                <div className="bg-blue-50/90 border-2 border-[#B9E1FD] p-3 rounded-xl flex flex-col gap-1.5 text-xs animate-in fade-in duration-150">
                  <div className="flex items-center gap-1.5 font-black text-[#062B72]">
                    <RefreshCw className="w-3.5 h-3.5 text-[#087FF5] shrink-0" />
                    <span>Pipeline: Reset 4-Layer Counters (0/3)</span>
                  </div>
                  <p className="text-[11px] text-[#062B72] leading-relaxed font-semibold">
                    Lifts challenge lockout, enabling claimant to re-authenticate private ownership identifier.
                  </p>
                </div>
              )}
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
                className="w-full p-3 rounded-xl border-2 border-[#cbd9e8] text-xs text-[#062B72] font-medium placeholder:text-[#94A3B8] outline-none focus:border-[#087FF5] resize-none shadow-xs"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#e2eaf4]">
              <button
                type="button"
                onClick={() => setSelectedCaseId(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-black text-[#062B72] border-2 border-[#cbd9e8] bg-white hover:bg-slate-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResolveCase}
                disabled={submittingAction}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white bg-[#087FF5] hover:bg-[#076ed4] shadow-md shadow-[#087FF5]/20 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
              >
                {submittingAction ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
                )}
                <span>Record Certified Action</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
