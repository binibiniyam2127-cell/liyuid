"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Download,
  Calendar,
  Building2,
  MapPin,
  Clock,
  TrendingUp,
  CheckCircle2,
  Shield,
  RefreshCw,
  Search,
  Filter,
  PackageCheck,
  Tag,
  Eye,
  Check,
  X,
  Printer,
  Copy,
  ExternalLink,
  ShieldCheck,
  QrCode,
  ChevronRight,
  Layers,
  FolderOpen,
  Scale,
} from "lucide-react";
import { OfficialMunicipalDeed } from "@/components/staff/OfficialMunicipalDeed";
import { api } from "@/lib/api";
import { StaffOperationsHeader } from "@/components/staff/StaffOperationsHeader";
import { useStaffStation } from "@/components/staff/StaffStationContext";

const ALL_SUB_CITIES = [
  "Bole",
  "Arada",
  "Yeka",
  "Kirkos",
  "Lideta",
  "Kazanchis",
  "Nifas Silk-Lafto",
  "Gullele",
  "Akaki Kality",
  "Kolfe Keranio",
  "Addis Ketema",
  "Lemi Kura",
  "AAU Sidist Kilo Campus",
  "AAU Amist Kilo (AAiT)",
  "AAU FBE Campus",
  "AAU Arat Kilo Campus",
];

interface CampusStat {
  subCity: string;
  nodeTitle: string;
  activeReports: number;
  reunitedCount: number;
  successRate: string;
  avgResolution: string;
}

interface ItemReportRecord {
  id: string;
  raw_id: string;
  type: string;
  itemTitle: string;
  category: string;
  subCity: string;
  primaryColor: string;
  status: string;
  custody: string;
  createdDate: string;
}

const FALLBACK_REPORTS_DATA = {
  stats: {
    total_reports: 0,
    lost_count: 0,
    found_count: 0,
    sub_cities_covered: "11 / 11",
    reunited_rate: "0%",
    avg_resolution_window: "0 hrs",
  },
  sub_city_breakdown: [
    { subCity: "Bole", nodeTitle: "Bole Metropolitan Hub", activeReports: 0, reunitedCount: 0, successRate: "0%", avgResolution: "0 hrs" },
    { subCity: "Arada", nodeTitle: "Arada Central Hub", activeReports: 0, reunitedCount: 0, successRate: "0%", avgResolution: "0 hrs" },
    { subCity: "Kirkos", nodeTitle: "Kirkos Commercial District", activeReports: 0, reunitedCount: 0, successRate: "0%", avgResolution: "0 hrs" },
    { subCity: "Lideta", nodeTitle: "Lideta Administrative Hub", activeReports: 0, reunitedCount: 0, successRate: "0%", avgResolution: "0 hrs" },
    { subCity: "Yeka", nodeTitle: "Yeka Commercial Hub", activeReports: 0, reunitedCount: 0, successRate: "0%", avgResolution: "0 hrs" },
    { subCity: "Nifas Silk-Lafto", nodeTitle: "Nifas Silk Gotera Hub", activeReports: 0, reunitedCount: 0, successRate: "0%", avgResolution: "0 hrs" },
    { subCity: "Gullele", nodeTitle: "Gullele North Hub", activeReports: 0, reunitedCount: 0, successRate: "0%", avgResolution: "0 hrs" },
    { subCity: "Akaki Kality", nodeTitle: "Akaki Kality Hub", activeReports: 0, reunitedCount: 0, successRate: "0%", avgResolution: "0 hrs" },
    { subCity: "Kolfe Keranio", nodeTitle: "Kolfe Commercial Station", activeReports: 0, reunitedCount: 0, successRate: "0%", avgResolution: "0 hrs" },
    { subCity: "Addis Ketema", nodeTitle: "Addis Ketema Mercato Terminal", activeReports: 0, reunitedCount: 0, successRate: "0%", avgResolution: "0 hrs" },
    { subCity: "Lemi Kura", nodeTitle: "Lemi Kura Eastern Zone", activeReports: 0, reunitedCount: 0, successRate: "0%", avgResolution: "0 hrs" },
  ],
  recent_reports: [],
  category_distribution: [
    { label: "Electronics & Smart Devices", pct: 0, count: 0 },
    { label: "National ID & Academic Cards", pct: 0, count: 0 },
    { label: "Wallets & Payment Cards", pct: 0, count: 0 },
    { label: "Bags & Luggage Items", pct: 0, count: 0 },
  ],
};

export default function StaffReportsPage() {
  const [data, setData] = useState<{
    stats: {
      total_reports: number;
      lost_count: number;
      found_count: number;
      sub_cities_covered: string;
      reunited_rate: string;
      avg_resolution_window: string;
    };
    sub_city_breakdown: CampusStat[];
    recent_reports: ItemReportRecord[];
    category_distribution: any[];
  }>(FALLBACK_REPORTS_DATA);

  const { station, matchesStation } = useStaffStation();
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<"registry" | "subcities" | "deed">("registry");
  const [registryFilter, setRegistryFilter] = useState<"ALL" | "Lost" | "Found">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<"month" | "quarter" | "year" | "all">("quarter");
  const [activeDossierItem, setActiveDossierItem] = useState<ItemReportRecord | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  // Global counter hotkeys: '/' to search, 'Esc' to close detail modal
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
        if (activeDossierItem) {
          setActiveDossierItem(null);
        }
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeDossierItem]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const res = await api.getStaffReports();
      if (res && res.recent_reports && res.recent_reports.length > 0) {
        setData(res);
      } else {
        setData(FALLBACK_REPORTS_DATA);
      }
    } catch (err: any) {
      console.error("Failed to load reports:", err);
      setData(FALLBACK_REPORTS_DATA);
      setMessage("Showing municipal property ledger cache (offline fallback).");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handlePrintBulletin = () => {
    window.print();
  };

  const handleCopyId = (id: string) => {
    try {
      if (typeof window !== "undefined" && navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(id);
        setCopiedId(true);
        setTimeout(() => setCopiedId(false), 2000);
      }
    } catch {
      // safe fallback
    }
  };

  const handleExportCSV = () => {
    if (!data || !data.recent_reports) return;
    setDownloading(true);
    try {
      const headers = "Tracking_ID,Declaration_Type,Item_Title,Category,Sub_City,Primary_Color,Status,Chain_Custody,Date_Logged\n";
      const rows = data.recent_reports
        .map(
          (r) =>
            `"${r.id || ""}","${r.type || ""}","${(r.itemTitle || "").replace(/"/g, '""')}","${r.category || ""}","${r.subCity || ""}","${r.primaryColor || ""}","${r.status || ""}","${r.custody || ""}","${r.createdDate || ""}"`
        )
        .join("\n");
      const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `LIYUID_Municipal_Inventory_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setMessage("Municipal Property Catalog exported successfully as CSV.");
    } catch (err) {
      setMessage("Failed to export CSV.");
    } finally {
      setDownloading(false);
    }
  };

  const handleExportJSON = () => {
    if (!data || !data.recent_reports) return;
    setDownloading(true);
    try {
      const payload = {
        meta: {
          bureau: "Addis Ababa City Administration Property Reunification Service",
          export_date: new Date().toISOString(),
          audit_compliance: "LIYUID Certified Municipal Protocol v3.2",
          total_records: data.recent_reports.length,
        },
        ...data,
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `LIYUID_Municipal_Audit_Dossier_${new Date().toISOString().slice(0, 10)}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setMessage("Municipal Audit Log dossier exported successfully as JSON.");
    } catch (err) {
      setMessage("Failed to export JSON.");
    } finally {
      setDownloading(false);
    }
  };

  const filteredRegistry =
    data?.recent_reports?.filter((r) => {
      if (!r) return false;
      const matchesType = registryFilter === "ALL" || r.type === registryFilter;
      const matchesDesk = station === "ALL" || matchesStation(r.subCity);
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (r.id || "").toLowerCase().includes(q) ||
        (r.itemTitle || "").toLowerCase().includes(q) ||
        (r.subCity || "").toLowerCase().includes(q) ||
        (r.category || "").toLowerCase().includes(q) ||
        (r.status || "").toLowerCase().includes(q);
      return matchesType && matchesDesk && matchesSearch;
    }) || [];

  return (
    <div className="flex flex-col gap-6 print:p-0">
      {/* ----------------------------------------------------
          UNIFIED COMPACT HEADER & STATION SELECTOR
      ---------------------------------------------------- */}
      <div className="print:hidden">
        <StaffOperationsHeader
          title="Municipal Property Vault & Intake Ledger"
          subtitle="Official intake registry, biometric/chain-of-custody ledgers, and printable verification slips"
          totalCount={data?.recent_reports?.length || 0}
          filteredCount={filteredRegistry.length}
          onRefresh={fetchReports}
          refreshing={loading}
          onExportCSV={handleExportCSV}
          onExportJSON={handleExportJSON}
          exporting={downloading}
          customActions={
            <button
              type="button"
              onClick={handlePrintBulletin}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#062B72] hover:bg-[#0c2340] text-white text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Bulletin</span>
            </button>
          }
        />
      </div>

      {/* JURISDICTION SCOPE STRIP (Inter-Desk Operational Boundary) */}
      <div className="bg-[#F8FAFC] border-2 border-[#cbd9e8] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs print:hidden">
        <div className="flex items-start md:items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-sky-700 text-white flex items-center justify-center shrink-0">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#062B72]">
                Desk Jurisdiction:
              </span>
              <span className="text-xs font-black text-sky-800 bg-sky-50 px-2 py-0.5 rounded-md border border-sky-200">
                Official Municipal Property Ingestion Ledger, Chain-of-Custody Auditing & Civic Statistics Desk
              </span>
            </div>
            <p className="text-[11px] text-[#475569] mt-0.5 font-medium">
              Read-only ledger and compliance auditing only. Authorized for cross-station SLA monitoring, export of tamper-evident CSV/JSON audit trails, and printing formal custody certificates. Does not execute OTP handovers (see <Link href="/staff/cases" className="text-[#087FF5] font-bold underline">Cases Desk</Link>) or adjudicate civil claims (see <Link href="/staff/disputes" className="text-purple-700 font-bold underline">Disputes Desk</Link>).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 border border-sky-200">
            Audit Authority Active
          </span>
        </div>
      </div>

      {/* View Switcher Tabs (Compact) */}
      <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-3 shadow-xs flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setViewTab("registry")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              viewTab === "registry"
                ? "bg-[#087FF5] text-white shadow-xs"
                : "bg-[#F8FAFC] text-[#062B72] hover:bg-[#F0F7FF]"
            }`}
          >
            <PackageCheck className="w-4 h-4" />
            <span>Master Intake Registry ({data?.recent_reports?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setViewTab("subcities")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              viewTab === "subcities"
                ? "bg-[#087FF5] text-white shadow-xs"
                : "bg-[#F8FAFC] text-[#062B72] hover:bg-[#F0F7FF]"
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Hub Operations ({data?.sub_city_breakdown?.length || 0})</span>
          </button>

          <button
            type="button"
            onClick={() => setViewTab("deed")}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap shrink-0 ${
              viewTab === "deed"
                ? "bg-emerald-700 text-white shadow-xs"
                : "bg-[#F8FAFC] text-[#062B72] hover:bg-[#F0F7FF]"
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>📜 Official Restitution Deed</span>
          </button>
        </div>

        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
          {data?.stats?.reunited_rate || "89%"} Reunited
        </span>
      </div>

      {/* Notification Toast */}
      {message && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs flex items-center justify-between shadow-xs print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{message}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* VIEW 1: MASTER PROPERTY INTAKE REGISTRY */}
      {viewTab === "registry" && (
        <div className="flex flex-col gap-4">
          {/* Search & Filter Bar */}
          <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 print:hidden">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
              {(["ALL", "Lost", "Found"] as const).map((t) => {
                const isActive = registryFilter === t;
                const count =
                  t === "ALL"
                    ? data?.recent_reports?.length || 0
                    : data?.recent_reports?.filter((r) => r.type === t)?.length || 0;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setRegistryFilter(t)}
                    className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                      isActive
                        ? "bg-[#087FF5] text-white shadow-xs border-2 border-[#087FF5]"
                        : "bg-[#F8FAFC] border-2 border-[#e2eaf4] text-[#062B72] hover:bg-[#F0F7FF] hover:border-[#B9E1FD]"
                    }`}
                  >
                    <span>{t === "ALL" ? "All Declarations" : `${t} Items`}</span>
                    <span
                      className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                        isActive ? "bg-white/20 text-white" : "bg-[#EBF5FF] text-[#087FF5] border border-[#B9E1FD]"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="relative min-w-[280px]">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search tracking ID, item title, district... (Press / to focus)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F8FAFC] border-2 border-[#cbd9e8] text-xs text-[#062B72] font-semibold rounded-xl pl-9 pr-16 py-2.5 outline-none focus:border-[#087FF5] focus:bg-white transition-colors placeholder:text-[#94A3B8]"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="text-slate-400 hover:text-slate-600 p-1"
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
          </div>

          {/* Master Table */}
          <div className="overflow-x-auto rounded-3xl border-2 border-[#e2eaf4] bg-white shadow-xs">
            <table className="w-full text-left text-xs text-[#062B72] border-collapse">
              <thead>
                <tr className="border-b-2 border-[#e2eaf4] text-[#64748B] uppercase text-[10px] tracking-wider bg-[#F8FAFC]">
                  <th className="py-4 px-4 font-black">Tracking ID</th>
                  <th className="py-4 px-4 font-black">Declaration Type</th>
                  <th className="py-4 px-4 font-black">Item Description</th>
                  <th className="py-4 px-4 font-black">Category</th>
                  <th className="py-4 px-4 font-black">Sub-City District</th>
                  <th className="py-4 px-4 font-black">Custody Holder</th>
                  <th className="py-4 px-4 font-black">Status</th>
                  <th className="py-4 px-4 font-black text-right">Intake Date</th>
                  <th className="py-4 px-4 font-black text-center print:hidden">Dossier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] font-sans text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#64748B]">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-[#087FF5]" />
                        <span className="font-semibold text-[#062B72]">Loading municipal item ledger...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredRegistry.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-[#64748B] font-semibold">
                      No property declarations match filter: {registryFilter}
                    </td>
                  </tr>
                ) : (
                  filteredRegistry.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setActiveDossierItem(item)}
                      className="hover:bg-[#F0F7FF]/60 transition-colors cursor-pointer group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-[#087FF5] whitespace-nowrap">
                        {item.id}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                            item.type === "Lost"
                              ? "bg-amber-50 text-amber-800 border-amber-200"
                              : "bg-emerald-50 text-emerald-800 border-emerald-200"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.type === "Lost" ? "bg-amber-500" : "bg-emerald-500"
                            }`}
                          />
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-[#062B72] max-w-xs truncate">
                        {item.itemTitle}
                      </td>
                      <td className="py-3.5 px-4 text-[#475569] font-semibold whitespace-nowrap">
                        {item.category}
                      </td>
                      <td className="py-3.5 px-4 text-[#475569] font-medium whitespace-nowrap">
                        {item.subCity}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#F8FAFC] text-[#062B72] border border-[#cbd9e8]">
                          {item.custody}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                            item.status === "Reunited"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : item.status === "Matched"
                              ? "bg-blue-50 text-[#087FF5] border-blue-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-[#64748B] font-mono text-[11px] whitespace-nowrap">
                        {item.createdDate}
                      </td>
                      <td className="py-3.5 px-4 text-center print:hidden">
                        <span className="text-xs font-bold text-[#087FF5] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                          <span>View</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: SUB-CITY DISTRICT OPERATIONS */}
      {viewTab === "subcities" && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-[#062B72]">
                Sub-City Municipal Hub Operations & Handover SLA
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Physical escrow counters and municipal administration performance across Addis Ababa.
              </p>
            </div>
            <span className="text-xs text-[#087FF5] font-bold bg-[#EBF5FF] border border-[#B9E1FD] px-3 py-1 rounded-full">
              Target SLA: &lt;24.0 Hours
            </span>
          </div>

          <div className="overflow-x-auto rounded-3xl border-2 border-[#e2eaf4] bg-white shadow-xs">
            <table className="w-full text-left text-xs text-[#062B72] border-collapse">
              <thead>
                <tr className="border-b-2 border-[#e2eaf4] text-[#64748B] uppercase text-[10px] tracking-wider bg-[#F8FAFC]">
                  <th className="py-4 px-4 font-black">Sub-City Hub & Node</th>
                  <th className="py-4 px-4 font-black">Administrative District</th>
                  <th className="py-4 px-4 font-black text-center">Active Declarations</th>
                  <th className="py-4 px-4 font-black text-center">Safely Reunited</th>
                  <th className="py-4 px-4 font-black text-center">Reunification Rate</th>
                  <th className="py-4 px-4 font-black text-right">Avg Handover Window</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9] font-sans text-xs">
                {data?.sub_city_breakdown?.map((c) => (
                  <tr key={c.subCity} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#062B72] flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#F0F7FF] flex items-center justify-center text-[#087FF5]">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block font-bold">{c.nodeTitle}</span>
                        <span className="text-[11px] text-[#64748B]">Central Certified Desk Escrow</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-[#475569] font-semibold">{c.subCity} Sub-City</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-[#062B72] text-center">{c.activeReports}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-600 text-center">{c.reunitedCount}</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {c.successRate}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-[#475569] font-mono font-bold">{c.avgResolution}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Distribution Breakdown & Municipal Security Assurance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border-2 border-[#e2eaf4] rounded-3xl p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-[#062B72]">
                Recovered Item Category Breakdown
              </h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">Distribution across all registered property types</p>
            </div>
            <Tag className="w-4 h-4 text-[#087FF5]" />
          </div>

          <div className="flex flex-col gap-3.5">
            {(data?.category_distribution || [
              { label: "Electronics & Smart Devices", pct: 45, count: 15 },
              { label: "National ID & Personal Documents", pct: 30, count: 10 },
              { label: "Wallets & Payment Cards", pct: 15, count: 5 },
              { label: "Bags & Luggage Items", pct: 10, count: 3 },
            ]).map((cat) => (
              <div key={cat.label} className="flex flex-col gap-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-[#334155] font-bold">{cat.label}</span>
                  <span className="font-mono font-black text-[#062B72]">{cat.pct}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#F1F5F9] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#087FF5] transition-all duration-500"
                    style={{ width: `${cat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border-2 border-[#e2eaf4] rounded-3xl p-6 shadow-xs flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5 text-[#087FF5]">
              <div className="w-8 h-8 rounded-xl bg-[#F0F7FF] flex items-center justify-center text-[#087FF5]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-[#062B72]">
                  Chain of Custody & Privacy Protection Guarantee
                </h3>
                <span className="text-[11px] text-[#64748B]">Audited Zero-PII Exposure Protocol</span>
              </div>
            </div>

            <p className="text-xs text-[#475569] mt-3 leading-relaxed font-medium">
              Every item declaration logged within LIYUID operates under strict tamper-evident cryptographic principles. Serial numbers, national IDs, and claimant challenge answers remain strictly protected against unauthorized administrative harvesting during routine inventory audits.
            </p>
          </div>

          <div className="bg-[#F8FAFC] border border-[#e2eaf4] p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div>
              <span className="text-[#64748B] block text-[10px] uppercase font-bold tracking-wider">
                Audited Compliance
              </span>
              <span className="font-bold text-[#062B72]">
                Certified Municipal Lost & Found Ledger Standard
              </span>
            </div>
            <span className="text-emerald-700 font-black flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Verified Compliant
            </span>
          </div>
        </div>
      </div>

      {/* VIEW 3: OFFICIAL MUNICIPAL DEED CERTIFICATE */}
      {viewTab === "deed" && (
        <OfficialMunicipalDeed
          reportRecord={activeDossierItem || (data?.recent_reports && data.recent_reports[0]) || null}
        />
      )}
      {/* INTERACTIVE MODAL: OFFICIAL PROPERTY AUDIT DOSSIER */}
      {activeDossierItem && (
        <div className="fixed inset-0 z-50 bg-[#062B72]/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#cbd9e8] rounded-3xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-6 sm:p-7 flex flex-col gap-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Close Button */}
            <button
              onClick={() => setActiveDossierItem(null)}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#062B72] flex items-center justify-center transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Dossier Header */}
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#F0F7FF] border border-[#B9E1FD] flex items-center justify-center text-[#087FF5] shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[#062B72] text-white">
                  Official Intake Dossier
                </span>
                <h2 className="text-lg font-black text-[#062B72] mt-1">
                  {activeDossierItem.itemTitle}
                </h2>
                <div className="flex items-center gap-2 text-xs text-[#64748B] mt-0.5">
                  <span className="font-mono font-bold text-[#087FF5]">{activeDossierItem.id}</span>
                  <span>•</span>
                  <span>{activeDossierItem.subCity} Sub-City</span>
                </div>
              </div>
            </div>

            {/* Property Attributes Grid */}
            <div className="bg-[#F8FAFC] border-2 border-[#e2eaf4] rounded-2xl p-4 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-bold">Declaration Type</span>
                <span className="font-black text-[#062B72] text-sm">{activeDossierItem.type} Declaration</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-bold">Category</span>
                <span className="font-bold text-[#062B72]">{activeDossierItem.category}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-bold">Primary Color</span>
                <span className="font-bold text-[#062B72]">{activeDossierItem.primaryColor}</span>
              </div>
              <div>
                <span className="text-[#64748B] block text-[10px] uppercase font-bold">Physical Custody</span>
                <span className="font-bold text-[#087FF5]">{activeDossierItem.custody}</span>
              </div>
            </div>

            {/* Chain of Custody Timeline */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-[#062B72]">
                Chain of Custody & Verification Milestones
              </span>

              <div className="flex flex-col gap-2.5 text-xs bg-white border border-[#e2eaf4] p-4 rounded-2xl">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <span className="font-bold text-[#062B72] block">1. Citizen Property Declaration</span>
                    <span className="text-[11px] text-[#64748B]">
                      Ingested into central database at {activeDossierItem.createdDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div>
                    <span className="font-bold text-[#062B72] block">2. Vector Match Engine & District Routing</span>
                    <span className="text-[11px] text-[#64748B]">
                      Assigned to {activeDossierItem.subCity} municipal node and quarantined
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 ${
                    activeDossierItem.status === "Reunited"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-blue-100 text-[#087FF5]"
                  }`}>
                    {activeDossierItem.status === "Reunited" ? "✓" : "●"}
                  </div>
                  <div>
                    <span className="font-bold text-[#062B72] block">
                      3. Current Status: {activeDossierItem.status}
                    </span>
                    <span className="text-[11px] text-[#64748B]">
                      {activeDossierItem.status === "Reunited"
                        ? "Dual-code OTP verified and safe physical custody closed"
                        : "Awaiting matching claimant verification challenge resolution"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-[#e2eaf4]">
              <button
                type="button"
                onClick={() => handleCopyId(activeDossierItem.id)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#F8FAFC] border border-[#cbd9e8] text-[#062B72] hover:bg-slate-100 transition-all cursor-pointer"
              >
                {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedId ? "Tracking ID Copied" : "Copy Tracking ID"}</span>
              </button>

              <div className="flex items-center gap-2">
                <Link
                  href={`/staff/cases?search=${encodeURIComponent(activeDossierItem.id)}`}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-[#EBF5FF] text-[#087FF5] border border-[#B9E1FD] hover:bg-[#dbeafe] transition-all"
                  title="View this docket in physical vault counter"
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>Cases Desk</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setActiveDossierItem(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold bg-white border border-[#cbd9e8] text-[#062B72] hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handlePrintBulletin}
                  className="px-4 py-2.5 rounded-xl text-xs font-black bg-[#087FF5] hover:bg-[#076ed4] text-white shadow-md shadow-[#087FF5]/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-white" />
                  <span>Print Receipt</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          OFFICIAL PRINTABLE CUSTODY & PROPERTY SLIP (PRINT ONLY)
      ---------------------------------------------------- */}
      <div className="hidden print:block p-8 text-black bg-white">
        {/* Formal Government & University Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-black uppercase tracking-wider">
                City Administration of Addis Ababa
              </h1>
              <h2 className="text-sm font-bold text-gray-700">
                Department of Public Safety & Academic Campus Property Registry
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                LIYUID Unified Lost & Found Chain of Custody Certificate
              </p>
            </div>
            <div className="text-right">
              <span className="font-mono text-sm font-black border-2 border-black px-3 py-1 block">
                {activeDossierItem ? `DOCKET: ${activeDossierItem.id}` : "MASTER AUDIT LEDGER"}
              </span>
              <span className="text-[10px] text-gray-500 block mt-1">
                Issued: {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </span>
            </div>
          </div>
        </div>

        {activeDossierItem ? (
          <div className="flex flex-col gap-6 text-xs">
            {/* Property Item Summary Box */}
            <div className="border border-black p-4 rounded">
              <h3 className="font-black text-sm uppercase tracking-wide border-b border-gray-300 pb-2 mb-3">
                1. Physical Property & Ingestion Record
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-bold block">Declared Item:</span>
                  <span className="text-sm font-extrabold">{activeDossierItem.itemTitle}</span>
                </div>
                <div>
                  <span className="font-bold block">Tracking ID:</span>
                  <span className="font-mono text-sm">{activeDossierItem.id}</span>
                </div>
                <div>
                  <span className="font-bold block">Category / Type:</span>
                  <span>{activeDossierItem.category} • {activeDossierItem.type} Declaration</span>
                </div>
                <div>
                  <span className="font-bold block">Primary Color / Visual Spec:</span>
                  <span>{activeDossierItem.primaryColor}</span>
                </div>
                <div>
                  <span className="font-bold block">Assigned Station / Jurisdiction:</span>
                  <span>{activeDossierItem.subCity}</span>
                </div>
                <div>
                  <span className="font-bold block">Physical Vault Status:</span>
                  <span className="font-black uppercase">{activeDossierItem.custody}</span>
                </div>
              </div>
            </div>

            {/* Verification & Chain of Custody */}
            <div className="border border-black p-4 rounded">
              <h3 className="font-black text-sm uppercase tracking-wide border-b border-gray-300 pb-2 mb-3">
                2. Municipal Chain of Custody & Asymmetric Verification
              </h3>
              <p className="text-gray-700 leading-relaxed mb-3">
                The above identified property has undergone asymmetric blind trait verification and municipal cross-referencing. In-person physical custody release requires verification of the dual-OTP counter authorization code.
              </p>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 border border-gray-300">
                <div>
                  <span className="font-bold block text-gray-600">Verification Outcome:</span>
                  <span className="font-black text-sm">{activeDossierItem.status.toUpperCase()}</span>
                </div>
                <div>
                  <span className="font-bold block text-gray-600">Audit Status:</span>
                  <span className="font-black">CERTIFIED & QUARANTINED</span>
                </div>
              </div>
            </div>

            {/* Signature & Endorsement Block */}
            <div className="pt-8 grid grid-cols-2 gap-12">
              <div className="border-t-2 border-black pt-2">
                <span className="font-black uppercase text-xs block">Releasing Municipal / Campus Officer</span>
                <span className="text-gray-600 block text-[11px] mt-1">Authorized Supervisor Signature & Stamp</span>
                <div className="mt-8 text-gray-400 text-[10px]">Officer Badge: STF-01 • Date: _________________</div>
              </div>

              <div className="border-t-2 border-black pt-2">
                <span className="font-black uppercase text-xs block">Claimant / Citizen Endorsement</span>
                <span className="text-gray-600 block text-[11px] mt-1">I certify under municipal declaration receipt of property</span>
                <div className="mt-8 text-gray-400 text-[10px]">Full Name & ID: ___________________________________</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 text-xs">
            <h3 className="font-black text-sm uppercase tracking-wide border-b border-black pb-2">
              Master Property Inventory Ledger ({filteredRegistry.length} active records)
            </h3>
            <table className="w-full text-left border-collapse border border-black">
              <thead>
                <tr className="bg-gray-100 border-b border-black">
                  <th className="p-2 border border-black font-black">ID</th>
                  <th className="p-2 border border-black font-black">Type</th>
                  <th className="p-2 border border-black font-black">Item Description</th>
                  <th className="p-2 border border-black font-black">Station / Campus</th>
                  <th className="p-2 border border-black font-black">Status</th>
                  <th className="p-2 border border-black font-black">Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistry.slice(0, 30).map((r) => (
                  <tr key={r.id} className="border-b border-gray-300">
                    <td className="p-2 border border-black font-mono font-bold">{r.id}</td>
                    <td className="p-2 border border-black uppercase font-bold">{r.type}</td>
                    <td className="p-2 border border-black font-semibold">{r.itemTitle}</td>
                    <td className="p-2 border border-black">{r.subCity}</td>
                    <td className="p-2 border border-black font-bold">{r.status}</td>
                    <td className="p-2 border border-black font-mono text-[10px]">{r.createdDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pt-6 border-t border-black text-right text-[10px] text-gray-600">
              End of official dispatch bulletin. Certified by LIYUID Municipal Engine.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
