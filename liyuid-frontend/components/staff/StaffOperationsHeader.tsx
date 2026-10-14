"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Building,
  MapPin,
  ChevronDown,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  Check,
  Download,
  Layers,
  GraduationCap,
  Building2,
  Search,
  Keyboard,
  Scale,
} from "lucide-react";
import { api } from "@/lib/api";
import { useStaffStation } from "@/components/staff/StaffStationContext";
import { StaffRoleDivisionModal } from "./StaffRoleDivisionModal";

export interface OperationalStation {
  id: string;
  name: string;
  code: string;
  type: "hq" | "campus" | "subcity";
  institution: string;
}

export const MUNICIPAL_SUB_CITIES: OperationalStation[] = [
  // 1. Central Macro Command Consoles
  {
    id: "ALL",
    name: "Central Omni-Command Console (Citywide HQ & Academic)",
    code: "OMNI",
    type: "hq",
    institution: "Federal & Citywide Cross-Network Jurisdiction",
  },
  {
    id: "ALL_SUBCITIES",
    name: "All Metropolitan Sub-Cities (11 Civic Districts)",
    code: "CIVIC",
    type: "hq",
    institution: "City Administration of Addis Ababa (Municipal)",
  },
  {
    id: "ALL_CAMPUSES",
    name: "All University Campuses (Federated Academic Vaults)",
    code: "UNIV",
    type: "hq",
    institution: "Higher Education Federated Security Desks",
  },

  // 2. University Campus Command Hubs
  {
    id: "AAU Sidist Kilo Campus",
    name: "AAU Sidist Kilo Main Campus & Kennedy Vault Hub",
    code: "6K",
    type: "campus",
    institution: "Addis Ababa University (Sidist Kilo)",
  },
  {
    id: "AAU Amist Kilo (AAiT)",
    name: "AAiT Amist Kilo Engineering & Tech Hub Desk",
    code: "5K",
    type: "campus",
    institution: "AAiT Technology Campus",
  },
  {
    id: "AAU FBE Campus",
    name: "AAU College of Business & Economics (FBE Hub)",
    code: "FBE",
    type: "campus",
    institution: "AAU Business Campus",
  },
  {
    id: "AAU Arat Kilo Campus",
    name: "AAU College of Natural Sciences (Arat Kilo Hub)",
    code: "4K",
    type: "campus",
    institution: "AAU Science Campus",
  },

  // 3. Metropolitan Sub-City Command Hubs
  {
    id: "Bole",
    name: "Bole Metropolitan Hub & Airport Corridor Desk",
    code: "BOL",
    type: "subcity",
    institution: "Bole Sub-City Administration",
  },
  {
    id: "Kirkos",
    name: "Kirkos Commercial & Stadium District Desk",
    code: "KIR",
    type: "subcity",
    institution: "Kirkos Sub-City Administration",
  },
  {
    id: "Arada",
    name: "Arada Central Civic & Historical Desk",
    code: "ARA",
    type: "subcity",
    institution: "Arada Sub-City Administration",
  },
  {
    id: "Kazanchis",
    name: "Kazanchis Diplomatic Quarter & UNECA Desk",
    code: "KAZ",
    type: "subcity",
    institution: "Kazanchis Municipal Authority",
  },
  {
    id: "Yeka",
    name: "Yeka Sub-City Municipal Desk",
    code: "YEK",
    type: "subcity",
    institution: "Yeka Sub-City Administration",
  },
  {
    id: "Lideta",
    name: "Lideta Civic & Judicial District Desk",
    code: "LID",
    type: "subcity",
    institution: "Lideta Sub-City Administration",
  },
  {
    id: "Nifas Silk-Lafto",
    name: "Nifas Silk-Lafto Corridor Desk",
    code: "NSL",
    type: "subcity",
    institution: "Nifas Silk-Lafto Sub-City",
  },
  {
    id: "Gullele",
    name: "Gullele Sub-City Municipal Desk",
    code: "GUL",
    type: "subcity",
    institution: "Gullele Sub-City Administration",
  },
  {
    id: "Akaki Kality",
    name: "Akaki Kality Industrial Corridor Desk",
    code: "AKK",
    type: "subcity",
    institution: "Akaki Kality Sub-City",
  },
  {
    id: "Kolfe Keranio",
    name: "Kolfe Keranio Sub-City Desk",
    code: "KLF",
    type: "subcity",
    institution: "Kolfe Keranio Sub-City",
  },
  {
    id: "Addis Ketema",
    name: "Addis Ketema Merkato Regional Hub Desk",
    code: "ADK",
    type: "subcity",
    institution: "Addis Ketema Sub-City",
  },
  {
    id: "Lemi Kura",
    name: "Lemi Kura Sub-City Municipal Desk",
    code: "LMK",
    type: "subcity",
    institution: "Lemi Kura Sub-City Administration",
  },
];

export interface StaffProfile {
  id: string;
  staff_code: string;
  full_name: string;
  staff_role: string;
  email: string;
  clearance_level: string;
  jurisdiction: string;
  active_desk: string;
}

interface StaffOperationsHeaderProps {
  title: string;
  subtitle?: string;
  selectedDesk?: string;
  onDeskChange?: (deskId: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  onExportCSV?: () => void;
  onExportJSON?: () => void;
  exporting?: boolean;
  totalCount?: number;
  filteredCount?: number;
  lastUpdated?: string;
  customActions?: React.ReactNode;
}

export function StaffOperationsHeader({
  title,
  subtitle,
  selectedDesk,
  onDeskChange,
  onRefresh,
  refreshing = false,
  onExportCSV,
  onExportJSON,
  exporting = false,
  totalCount,
  filteredCount,
  lastUpdated,
  customActions,
}: StaffOperationsHeaderProps) {
  const stationContext = useStaffStation();
  const effectiveDesk = selectedDesk !== undefined ? selectedDesk : stationContext.station;
  const effectiveChangeDesk = onDeskChange || stationContext.setStation;

  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch live staff profile from backend
  useEffect(() => {
    let isMounted = true;
    api
      .getStaffProfile()
      .then((data) => {
        if (isMounted && data) {
          setProfile(data);
        }
      })
      .catch(() => {
        // Fallback default
        if (isMounted) {
          setProfile({
            id: "STF-01",
            staff_code: "STF-01",
            full_name: "Operations Supervisor",
            staff_role: "Senior Operations Supervisor",
            email: "staff@liyuid.com",
            clearance_level: "Tier-3 Municipal Supervisor",
            jurisdiction: "City Administration of Addis Ababa",
            active_desk: "Central Operations Headquarters",
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [stationSearch, setStationSearch] = useState("");

  const activeSubCityObj =
    MUNICIPAL_SUB_CITIES.find((s) => s.id === effectiveDesk) || MUNICIPAL_SUB_CITIES[0];

  const filteredStations = MUNICIPAL_SUB_CITIES.filter((s) => {
    if (!stationSearch.trim()) return true;
    const query = stationSearch.toLowerCase();
    return (
      s.name.toLowerCase().includes(query) ||
      s.id.toLowerCase().includes(query) ||
      s.code.toLowerCase().includes(query) ||
      s.institution.toLowerCase().includes(query)
    );
  });

  const campusStations = filteredStations.filter((s) => s.type === "campus");
  const subCityStations = filteredStations.filter((s) => s.type === "subcity");

  return (
    <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col gap-3.5 text-[#062B72]">
      {/* Top Row: Dual Government Dynamic Seals & Desk Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#e2eaf4] pb-3.5">
        <div>
          {/* Dynamic Badges Strip */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {/* Primary Seal: Municipal Jurisdiction & Live Officer */}
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide bg-[#062B72] text-white flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0">
              <Building className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>{profile?.jurisdiction || "City Administration of Addis Ababa"}</span>
              <span className="text-white/30">•</span>
              <span className="text-sky-300 font-bold">Officer {profile?.staff_code || "STF-01"}</span>
            </span>

            {/* DYNAMIC DESK SWITCHER PILL (Interactive Dropdown) */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`px-3 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 transition-all shadow-xs cursor-pointer select-none whitespace-nowrap shrink-0 ${
                  effectiveDesk === "ALL"
                    ? "bg-[#EBF5FF] text-[#087FF5] border-[#B9E1FD] hover:bg-[#DCEEFE]"
                    : effectiveDesk === "ALL_SUBCITIES"
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                    : effectiveDesk === "ALL_CAMPUSES" || activeSubCityObj.type === "campus"
                    ? "bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100"
                    : "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100"
                }`}
                title="Click to switch active municipal or campus operating station"
              >
                {effectiveDesk === "ALL_CAMPUSES" || activeSubCityObj.type === "campus" ? (
                  <GraduationCap className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                ) : effectiveDesk === "ALL_SUBCITIES" || activeSubCityObj.type === "subcity" ? (
                  <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                ) : (
                  <Layers className="w-3.5 h-3.5 text-[#087FF5] shrink-0" />
                )}

                <span>
                  {effectiveDesk === "ALL"
                    ? "Central Omni Console"
                    : effectiveDesk === "ALL_SUBCITIES"
                    ? "All Sub-Cities (11 Districts)"
                    : effectiveDesk === "ALL_CAMPUSES"
                    ? "All University Campuses"
                    : activeSubCityObj.type === "campus"
                    ? `${effectiveDesk}`
                    : `${effectiveDesk} Sub-City Desk`}
                </span>

                <span
                  className={`text-[10px] uppercase font-black px-1.5 py-0.2 rounded ${
                    effectiveDesk === "ALL_CAMPUSES" || activeSubCityObj.type === "campus"
                      ? "bg-purple-200/70 text-purple-950"
                      : "bg-white/60 text-[#062B72]"
                  }`}
                >
                  {activeSubCityObj.code}
                </span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Desk Selection Menu */}
              {dropdownOpen && (
                <div className="absolute left-0 top-full mt-2 w-88 sm:w-96 bg-white border-2 border-[#cbd9e8] rounded-2xl shadow-2xl p-2.5 z-50 text-[#062B72] animate-in fade-in zoom-in-95">
                  <div className="px-3 py-2 border-b border-[#e2eaf4]">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#64748B] block">
                      Switch Operating Station
                    </span>
                    <span className="text-xs font-semibold text-[#062B72]">
                      Metropolitan Sub-Cities & University Campuses
                    </span>
                  </div>

                  {/* Search inside station selector */}
                  <div className="p-2 border-b border-[#e2eaf4]">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search campus or sub-city..."
                        value={stationSearch}
                        onChange={(e) => setStationSearch(e.target.value)}
                        className="w-full bg-[#F8FAFC] border border-[#cbd9e8] focus:bg-white rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#062B72] font-semibold outline-none focus:border-[#087FF5] transition-all"
                      />
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto flex flex-col gap-2 py-1.5">
                    {/* 1. Macro Command Consoles */}
                    <div className="flex flex-col gap-1 pb-1">
                      <span className="px-2.5 text-[10px] font-black uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-[#087FF5]" />
                        <span>Macro Command Consoles</span>
                      </span>

                      {/* Central Omni-Console */}
                      {(!stationSearch || "central citywide all hq omni academic".includes(stationSearch.toLowerCase())) && (
                        <button
                          type="button"
                          onClick={() => {
                            effectiveChangeDesk("ALL");
                            setDropdownOpen(false);
                            setStationSearch("");
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between text-left transition-colors cursor-pointer ${
                            effectiveDesk === "ALL"
                              ? "bg-[#EBF5FF] text-[#087FF5] font-black border border-[#B9E1FD]"
                              : "hover:bg-[#F8FAFC] text-[#062B72]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-[#087FF5] shrink-0" />
                            <div>
                              <span className="block font-black">Central Omni-Command Console</span>
                              <span className="text-[10px] text-[#64748B] font-medium">
                                Citywide cross-network (All 11 Sub-Cities & Campuses)
                              </span>
                            </div>
                          </div>
                          {effectiveDesk === "ALL" && <Check className="w-3.5 h-3.5 text-[#087FF5] shrink-0" />}
                        </button>
                      )}

                      {/* All Municipal Sub-Cities */}
                      {(!stationSearch || "municipal sub cities subcities civic all".includes(stationSearch.toLowerCase())) && (
                        <button
                          type="button"
                          onClick={() => {
                            effectiveChangeDesk("ALL_SUBCITIES");
                            setDropdownOpen(false);
                            setStationSearch("");
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between text-left transition-colors cursor-pointer ${
                            effectiveDesk === "ALL_SUBCITIES"
                              ? "bg-emerald-50 text-emerald-800 font-black border border-emerald-300"
                              : "hover:bg-[#F8FAFC] text-[#062B72]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <div>
                              <span className="block font-black">All Metropolitan Sub-Cities</span>
                              <span className="text-[10px] text-emerald-700 font-medium">
                                11 Civic Administrative Districts (Excluding Campuses)
                              </span>
                            </div>
                          </div>
                          {effectiveDesk === "ALL_SUBCITIES" && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                        </button>
                      )}

                      {/* All University Campuses */}
                      {(!stationSearch || "all university campuses academic federated aau".includes(stationSearch.toLowerCase())) && (
                        <button
                          type="button"
                          onClick={() => {
                            effectiveChangeDesk("ALL_CAMPUSES");
                            setDropdownOpen(false);
                            setStationSearch("");
                          }}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between text-left transition-colors cursor-pointer ${
                            effectiveDesk === "ALL_CAMPUSES"
                              ? "bg-purple-50 text-purple-900 font-black border border-purple-200"
                              : "hover:bg-[#F8FAFC] text-[#062B72]"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <GraduationCap className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <div>
                              <span className="block font-black">All University Campuses</span>
                              <span className="text-[10px] text-purple-800 font-medium">
                                Higher Education Security & Vault Desks (AAU & Tech Hubs)
                              </span>
                            </div>
                          </div>
                          {effectiveDesk === "ALL_CAMPUSES" && <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                        </button>
                      )}
                    </div>

                    {/* 2. University Campus Hubs */}
                    {campusStations.length > 0 && (
                      <div className="flex flex-col gap-1 pt-1 border-t border-[#f0f4f8]">
                        <span className="px-2.5 text-[10px] font-black uppercase tracking-wider text-purple-700 flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                          <span>University Campus Hubs</span>
                        </span>
                        {campusStations.map((station) => {
                          const isSelected = effectiveDesk === station.id;
                          return (
                            <button
                              key={station.id}
                              type="button"
                              onClick={() => {
                                effectiveChangeDesk(station.id);
                                setDropdownOpen(false);
                                setStationSearch("");
                              }}
                              className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between text-left transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-purple-50 text-purple-900 font-black border border-purple-200"
                                  : "hover:bg-[#F8FAFC] text-[#062B72]"
                              }`}
                            >
                              <div className="flex items-center gap-2.5">
                                <GraduationCap className={`w-3.5 h-3.5 ${isSelected ? "text-purple-600" : "text-purple-400"}`} />
                                <div>
                                  <span className="truncate max-w-[240px] block font-extrabold">{station.name}</span>
                                  <span className="text-[10px] text-[#64748B] font-medium">{station.institution}</span>
                                </div>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* 3. Metropolitan Sub-City Hubs */}
                    {subCityStations.length > 0 && (
                      <div className="flex flex-col gap-1 pt-1 border-t border-[#f0f4f8]">
                        <span className="px-2.5 text-[10px] font-black uppercase tracking-wider text-[#062B72] flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-[#087FF5]" />
                          <span>Metropolitan Sub-Cities</span>
                        </span>
                        {subCityStations.map((station) => {
                          const isSelected = effectiveDesk === station.id;
                          return (
                            <button
                              key={station.id}
                              type="button"
                              onClick={() => {
                                effectiveChangeDesk(station.id);
                                setDropdownOpen(false);
                                setStationSearch("");
                              }}
                              className={`w-full px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between text-left transition-colors cursor-pointer ${
                                isSelected
                                  ? "bg-[#EBF5FF] text-[#087FF5] font-black border border-[#B9E1FD]"
                                  : "hover:bg-[#F8FAFC] text-[#062B72]"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <MapPin className={`w-3.5 h-3.5 ${isSelected ? "text-[#087FF5]" : "text-slate-400"}`} />
                                <span className="truncate max-w-[240px]">{station.name}</span>
                              </div>
                              {isSelected && <Check className="w-3.5 h-3.5 text-[#087FF5] shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Clearance Pill */}
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span>{profile?.clearance_level || "Tier-3 Municipal Supervisor"}</span>
            </span>
          </div>

          {/* Heading */}
          <h1 className="text-xl sm:text-2xl font-black text-[#062B72] tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs sm:text-sm text-[#64748B] mt-1 font-medium max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          {onExportCSV && (
            <button
              type="button"
              onClick={onExportCSV}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#cbd9e8] hover:bg-[#F0F7FF] text-[#062B72] text-xs font-black transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-[#087FF5]" />
              <span>Export CSV</span>
            </button>
          )}

          {onExportJSON && (
            <button
              type="button"
              onClick={onExportJSON}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border-2 border-[#cbd9e8] hover:bg-[#F0F7FF] text-[#062B72] text-xs font-black transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-purple-600" />
              <span>JSON Dossier</span>
            </button>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-white border-2 border-[#cbd9e8] hover:bg-[#F0F7FF] text-[#062B72] text-xs font-black transition-all shadow-xs cursor-pointer disabled:opacity-50 active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#087FF5] ${refreshing ? "animate-spin" : ""}`} />
              <span>Refresh Feed</span>
            </button>
          )}

          {/* Division of Roles Inter-Desk Directive Button */}
          <button
            type="button"
            onClick={() => setRoleModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#062B72] to-[#0c2340] hover:from-[#08358c] hover:to-[#062B72] text-white text-xs font-black transition-all shadow-md shadow-[#062B72]/20 cursor-pointer active:scale-95 whitespace-nowrap"
            title="Inspect municipal division of roles between Cases, Disputes, and Flags"
          >
            <Scale className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Division of Roles</span>
          </button>

          {customActions}
        </div>
      </div>

      {/* Bottom Row: Live Network & Station Status Indicator Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2.5 text-[#64748B]">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
          </span>
          <span className="font-bold text-[#062B72]">Central Engine: Operational</span>
          <span>•</span>
          <span className="font-semibold text-[#64748B]">
            {effectiveDesk === "ALL"
              ? "All Jurisdictions & Campus Hubs Online"
              : `Direct Routing: ${effectiveDesk} Desk Active`}
          </span>

          <span className="hidden lg:inline text-slate-300">•</span>

          {/* Quick Keyboard Hotkeys Pill */}
          <div className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-[#64748B] bg-[#F8FAFC] border border-[#e2eaf4] px-2.5 py-0.5 rounded-full">
            <Keyboard className="w-3.5 h-3.5 text-[#087FF5] shrink-0" />
            <span>Hotkeys:</span>
            <kbd className="px-1.5 py-0.2 rounded bg-white border border-[#cbd9e8] text-[10px] font-mono text-[#062B72] shadow-2xs">/</kbd>
            <span className="text-[10px]">Search</span>
            <span className="text-slate-300">•</span>
            <kbd className="px-1.5 py-0.2 rounded bg-white border border-[#cbd9e8] text-[10px] font-mono text-[#062B72] shadow-2xs">Esc</kbd>
            <span className="text-[10px]">Close</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[#64748B]">
          {filteredCount !== undefined && totalCount !== undefined && (
            <span className="text-xs font-bold text-[#087FF5] bg-[#EBF5FF] border border-[#B9E1FD] px-3 py-1 rounded-xl">
              Showing <strong>{filteredCount}</strong> of <strong>{totalCount}</strong> Records
            </span>
          )}
          {lastUpdated && (
            <span className="font-medium text-[11px]">
              Last feed sync: <strong className="text-[#062B72]">{lastUpdated}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Inter-Desk Division of Roles Directive Modal */}
      <StaffRoleDivisionModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
      />
    </div>
  );
}

