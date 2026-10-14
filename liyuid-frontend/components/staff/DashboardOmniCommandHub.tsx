"use client";

import React from "react";
import Link from "next/link";
import {
  Activity,
  Layers,
  Scale,
  Flag,
  FileText,
  Building,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
  MapPin,
  ChevronRight,
  AlertTriangle,
  FolderOpen,
} from "lucide-react";

interface DashboardOmniCommandHubProps {
  borderlineCount: number;
  openCasesCount: number;
  onSelectCase: (caseItem: any) => void;
  children: React.ReactNode;
}

export function DashboardOmniCommandHub({
  borderlineCount,
  openCasesCount,
  onSelectCase,
  children,
}: DashboardOmniCommandHubProps) {
  const subCityNodes = [
    { name: "Bole Central Hub", load: "0%", count: 0, status: "Idle", color: "bg-slate-400" },
    { name: "AAU Sidist Kilo Campus", load: "0%", count: 0, status: "Idle", color: "bg-slate-400" },
    { name: "Arada Municipal Station", load: "0%", count: 0, status: "Idle", color: "bg-slate-400" },
    { name: "Kirkos District Desk", load: "0%", count: 0, status: "Idle", color: "bg-slate-400" },
    { name: "Lideta Judicial Escrow", load: "0%", count: 0, status: "Idle", color: "bg-slate-400" },
    { name: "Yeka Sub-City Hub", load: "0%", count: 0, status: "Idle", color: "bg-slate-400" },
  ];

  return (
    <div className="flex flex-col gap-6 text-[#062B72]">
      {/* Omni-Command Telemetry Bar */}
      <div className="bg-[#062B72] bg-gradient-to-r from-[#062B72] via-[#09398f] to-[#0A4BB5] rounded-3xl p-5 text-white shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-cyan-300 backdrop-blur-xs">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-tight">Metropolitan Omni-Command Mission Control</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-wider">
                11 HUBS SYNCHRONIZED
              </span>
            </div>
            <p className="text-xs text-blue-200 font-medium">
              Live intake triage • Asymmetric challenge radar • Network-wide dispatch routing
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-blue-100 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>AI Embeddings: 38ms</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-emerald-200 flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>AES-256 PII Sealed</span>
          </div>
        </div>
      </div>

      {/* Two-Column Tactical Operations Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (8 Cols): Operations Triage Table & Incident Queue */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black uppercase text-[#64748B] tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#087FF5]" />
              Live Operations Triage Stream
            </span>
            <span className="text-[11px] font-bold text-[#087FF5]">
              Real-time Ingestion Stream
            </span>
          </div>

          {/* Children renders the filtered cases table or list */}
          {children}
        </div>

        {/* Right (4 Cols): Inter-Desk Dispatcher & Municipal Radar */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Mission Dispatch Console */}
          <div className="bg-white border-2 border-[#e2eaf4] rounded-3xl p-5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2eaf4]">
              <span className="text-xs font-black uppercase text-[#64748B] tracking-wider flex items-center gap-1.5">
                <ArrowRight className="w-3.5 h-3.5 text-[#087FF5]" />
                Rapid Desk Dispatcher
              </span>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-blue-50 text-[#087FF5]">
                Direct Routing
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href="/staff/cases"
                className="p-3 rounded-2xl bg-[#F8FAFC] hover:bg-[#F0F7FF] border border-[#e2eaf4] hover:border-[#B9E1FD] transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#087FF5] flex items-center justify-center font-bold text-xs">
                    📦
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#062B72] block">Cases & Vault Desk</span>
                    <span className="text-[10px] text-[#64748B]">Physical Shelves & OTP Counter</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#087FF5] group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/staff/disputes"
                className="p-3 rounded-2xl bg-[#F8FAFC] hover:bg-amber-50/50 border border-[#e2eaf4] hover:border-amber-300 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-xs">
                    ⚖️
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#062B72] block">Disputes Tribunal</span>
                    <span className="text-[10px] text-[#64748B]">Comparative Evidence Hearing Bench</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/staff/flags"
                className="p-3 rounded-2xl bg-[#F8FAFC] hover:bg-rose-50/50 border border-[#e2eaf4] hover:border-rose-300 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
                    🛡️
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#062B72] block">Threat Ops (SOC)</span>
                    <span className="text-[10px] text-[#64748B]">Imposter Quarantine & AI Rematch</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-600 group-hover:translate-x-0.5 transition-all" />
              </Link>

              <Link
                href="/staff/reports"
                className="p-3 rounded-2xl bg-[#F8FAFC] hover:bg-emerald-50/50 border border-[#e2eaf4] hover:border-emerald-300 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
                    📜
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#062B72] block">Municipal Ledger</span>
                    <span className="text-[10px] text-[#64748B]">Archival Slips & Restitution Deeds</span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
              </Link>
            </div>
          </div>

          {/* Sub-City District Capacity Radar */}
          <div className="bg-white border-2 border-[#e2eaf4] rounded-3xl p-5 shadow-xs flex flex-col gap-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-[#e2eaf4]">
              <span className="text-xs font-black uppercase text-[#64748B] tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#087FF5]" />
                District Station Radar
              </span>
              <span className="text-[10px] font-mono text-[#087FF5] font-bold">11 Nodes</span>
            </div>

            <div className="flex flex-col gap-2.5">
              {subCityNodes.map((node) => (
                <div key={node.name} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#062B72]">{node.name}</span>
                    <span className="text-[11px] font-mono text-[#64748B]">{node.count} active</span>
                  </div>
                  <div className="w-full bg-[#e2eaf4] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${node.color}`}
                      style={{ width: node.load }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

