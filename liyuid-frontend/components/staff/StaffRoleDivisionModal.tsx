"use client";

import React, { useState } from "react";
import {
  X,
  Scale,
  FolderOpen,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Ban,
  RefreshCw,
  QrCode,
  KeyRound,
  Building2,
  GraduationCap,
  Layers,
  FileCheck,
  ExternalLink,
  Users,
  FileText,
  Cpu,
} from "lucide-react";

interface StaffRoleDivisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: "cases" | "disputes" | "flags" | "reports" | "analytics" | "matrix";
}

export function StaffRoleDivisionModal({
  isOpen,
  onClose,
  initialTab = "matrix",
}: StaffRoleDivisionModalProps) {
  const [activeTab, setActiveTab] = useState<"cases" | "disputes" | "flags" | "reports" | "analytics" | "matrix">(initialTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#062B72]/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 text-[#062B72]">
      <div className="bg-white border-2 border-[#cbd9e8] rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-[#e2eaf4] flex items-center justify-between bg-[#F8FAFC]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#062B72] text-white flex items-center justify-center shadow-xs shrink-0">
              <Scale className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-[#062B72]">
                  Inter-Desk Operational Directive & Division of Roles
                </h2>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Municipal Standard
                </span>
              </div>
              <p className="text-xs text-[#64748B] font-semibold">
                Clear separation of powers, jurisdictions & escalation protocols between Cases, Disputes, Flags, Reports, and AI Analytics
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-[#062B72] flex items-center justify-center transition-all cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-5 sm:px-6 pt-3 border-b border-[#e2eaf4] bg-white overflow-x-auto text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("matrix")}
            className={`px-4 py-2.5 font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "matrix"
                ? "border-[#087FF5] text-[#087FF5]"
                : "border-transparent text-[#64748B] hover:text-[#062B72]"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>1. Inter-Desk Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("cases")}
            className={`px-4 py-2.5 font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "cases"
                ? "border-[#087FF5] text-[#087FF5]"
                : "border-transparent text-[#64748B] hover:text-[#062B72]"
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>2. Cases Desk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("disputes")}
            className={`px-4 py-2.5 font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "disputes"
                ? "border-[#087FF5] text-[#087FF5]"
                : "border-transparent text-[#64748B] hover:text-[#062B72]"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>3. Disputes Desk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("flags")}
            className={`px-4 py-2.5 font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "flags"
                ? "border-[#087FF5] text-[#087FF5]"
                : "border-transparent text-[#64748B] hover:text-[#062B72]"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>4. Flags Desk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2.5 font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "reports"
                ? "border-[#087FF5] text-[#087FF5]"
                : "border-transparent text-[#64748B] hover:text-[#062B72]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>5. Reports Desk</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2.5 font-black border-b-2 transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "analytics"
                ? "border-[#087FF5] text-[#087FF5]"
                : "border-transparent text-[#64748B] hover:text-[#062B72]"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>6. AI Analytics Observatory</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 flex flex-col gap-5 text-xs">
          {/* TAB 1: TRIPARTITE MATRIX */}
          {activeTab === "matrix" && (
            <div className="flex flex-col gap-5">
              {/* Visual 4-Column Comparison */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                {/* Column 1: Cases */}
                <div className="border-2 border-[#cbd9e8] rounded-2xl p-4 bg-[#F8FAFC] flex flex-col justify-between gap-3 hover:border-[#087FF5] transition-all">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-[#087FF5]">
                        Routine Workbench
                      </span>
                      <FolderOpen className="w-4 h-4 text-[#087FF5]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-[#062B72]">Cases Desk</h3>
                      <span className="text-[11px] text-[#64748B] font-bold">አካላዊ መጋዘን እና የርክክብ ዴስክ</span>
                    </div>
                    <p className="text-[11px] text-[#334155] leading-relaxed font-semibold">
                      Primary custody of physical inventory. Manages regular item lifecycle (Ingestion ➜ Verification ➜ Counter Handover).
                    </p>
                  </div>
                  <div className="bg-white border border-[#e2eaf4] p-2.5 rounded-xl space-y-1.5 text-[10px] font-bold">
                    <div className="text-[#087FF5]">✦ <strong>Core Task:</strong> Shelf storage & QR/OTP exchange</div>
                    <div className="text-slate-600">✦ <strong>Route OUT:</strong> Contested claims ➜ Disputes; Hacks ➜ Flags</div>
                  </div>
                </div>

                {/* Column 2: Disputes */}
                <div className="border-2 border-amber-200 rounded-2xl p-4 bg-amber-50/40 flex flex-col justify-between gap-3 hover:border-amber-400 transition-all">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
                        Arbitration Tribunal
                      </span>
                      <Scale className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-amber-950">Disputes Desk</h3>
                      <span className="text-[11px] text-amber-800 font-bold">የባለቤትነት ውዝግብ ዳኝነት እና ሽምግልና</span>
                    </div>
                    <p className="text-[11px] text-amber-900 leading-relaxed font-semibold">
                      Adjudicates conflicting claimants (Claimant A vs B), reviews verification lock appeals, and requests external invoices/receipts.
                    </p>
                  </div>
                  <div className="bg-white border border-amber-200 p-2.5 rounded-xl space-y-1.5 text-[10px] font-bold">
                    <div className="text-amber-800">✦ <strong>Core Task:</strong> Ownership decree or imposter block</div>
                    <div className="text-slate-600">✦ <strong>Route OUT:</strong> Approved ➜ Cases Desk; Imposter ➜ Flags</div>
                  </div>
                </div>

                {/* Column 3: Flags */}
                <div className="border-2 border-rose-200 rounded-2xl p-4 bg-rose-50/40 flex flex-col justify-between gap-3 hover:border-rose-400 transition-all">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800">
                        Threat & Security
                      </span>
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-rose-950">Flags Desk</h3>
                      <span className="text-[11px] text-rose-800 font-bold">የደህንነት፣ የማጭበርበር ክትትልና ህግ ማስከበር</span>
                    </div>
                    <p className="text-[11px] text-rose-900 leading-relaxed font-semibold">
                      Cybersecurity intelligence defense. Handles bot floods, Sybil floods, PIN brute-force attempts, and criminal imposter blacklists.
                    </p>
                  </div>
                  <div className="bg-white border border-rose-200 p-2.5 rounded-xl space-y-1.5 text-[10px] font-bold">
                    <div className="text-rose-800">✦ <strong>Core Task:</strong> Account bans & police referral</div>
                    <div className="text-slate-600">✦ <strong>Route OUT:</strong> False positive ➜ Dismiss; Typo ➜ Allow Retry</div>
                  </div>
                </div>

                {/* Column 4: Reports */}
                <div className="border-2 border-sky-200 rounded-2xl p-4 bg-sky-50/40 flex flex-col justify-between gap-3 hover:border-sky-400 transition-all">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-100 text-sky-800">
                        Ledger & Audits
                      </span>
                      <FileText className="w-4 h-4 text-sky-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-sky-950">Reports Desk</h3>
                      <span className="text-[11px] text-sky-800 font-bold">የማዘጋጃ ቤት መዝገብና የክትትል ኦዲት</span>
                    </div>
                    <p className="text-[11px] text-sky-900 leading-relaxed font-semibold">
                      Citywide intake ledger and transparency hub. Audits district SLAs (&lt;24h), exports tamper-evident JSON/CSV, and prints certified slips.
                    </p>
                  </div>
                  <div className="bg-white border border-sky-200 p-2.5 rounded-xl space-y-1.5 text-[10px] font-bold">
                    <div className="text-sky-800">✦ <strong>Core Task:</strong> Ledger oversight & audit exports</div>
                    <div className="text-slate-600">✦ <strong>Route OUT:</strong> Read-only audit; Physical handover ➜ Cases</div>
                  </div>
                </div>
              </div>

              {/* Inter-Desk Escalation Pipeline Diagram */}
              <div className="bg-[#F8FAFC] border-2 border-[#e2eaf4] rounded-2xl p-4 sm:p-5 flex flex-col gap-3">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#64748B] flex items-center gap-1.5">
                  <ArrowRight className="w-3.5 h-3.5 text-[#087FF5]" />
                  Lifecycle Incident Escalation & Transfer Protocol
                </span>

                <div className="space-y-2.5 text-xs text-[#1E293B]">
                  <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-[#cbd9e8]">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-100 text-[#087FF5] shrink-0 mt-0.5">
                      Cases ➜ Disputes
                    </span>
                    <span className="font-semibold text-[11px] leading-relaxed">
                      Triggered when two citizens claim the same item or a citizen requests human review after 3 failed 4-layer challenge attempts. The physical item stays in the vault, but custody is locked until Disputes issues a ruling.
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-amber-200">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-amber-100 text-amber-800 shrink-0 mt-0.5">
                      Disputes ➜ Cases
                    </span>
                    <span className="font-semibold text-[11px] leading-relaxed">
                      Triggered when the supervisor validates ownership (<code className="font-mono text-emerald-700 font-bold">dismiss</code> action). The decree authorizes physical handover, transferring the docket back to the Cases Desk for dual QR and 6-digit OTP verification.
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-rose-200">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 shrink-0 mt-0.5">
                      Disputes ➜ Flags
                    </span>
                    <span className="font-semibold text-[11px] leading-relaxed">
                      Triggered when an imposter is detected (<code className="font-mono text-rose-700 font-bold">block</code> action). The claimant match is permanently severed, their user account is routed to the Flags Desk for fraud tracking/legal referral, and the physical item is released back to active pool for AI vector re-matching!
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5 bg-white p-3 rounded-xl border border-sky-200">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-sky-100 text-sky-800 shrink-0 mt-0.5">
                      All Desks ➜ Reports
                    </span>
                    <span className="font-semibold text-[11px] leading-relaxed">
                      Continuous immutable ingestion: all citizen declarations, dispute decrees, and security resolutions automatically stream into the Reports Desk for municipal audit trail generation, cross-hub SLA compliance (&lt;24h), and printable custody documentation.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CASES DESK */}
          {activeTab === "cases" && (
            <div className="flex flex-col gap-4">
              <div className="bg-[#F0F7FF] border-2 border-[#B9E1FD] p-4 rounded-2xl flex items-start gap-3">
                <FolderOpen className="w-5 h-5 text-[#087FF5] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-black text-[#062B72]">Cases Desk: Physical Custody & Vault Counter Restitution</h3>
                  <p className="text-xs text-[#334155] font-semibold mt-1">
                    Operates at each of the 11 Metropolitan Sub-City Hubs (Bole, Arada, Kirkos, etc.) and Federated University Campuses (AAU Sidist Kilo, AAiT, etc.).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border-2 border-[#e2eaf4] rounded-xl p-3.5 bg-white space-y-2">
                  <span className="font-black text-[#062B72] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>In-Scope Responsibilities</span>
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] font-semibold text-[#475569]">
                    <li>Receiving physical found items from finders and police drop-offs</li>
                    <li>Shelving property in secure station vaults and recording shelf tags</li>
                    <li>Reviewing borderline AI candidate matches (scores 0.50 – 0.69)</li>
                    <li>Scanning citizen QR codes for instantaneous docket lookup (0.2s)</li>
                    <li>Entering and burning the dynamic 6-digit OTP to complete handover</li>
                    <li>Closing cases as officially "Reunited" in the municipal registry</li>
                  </ul>
                </div>

                <div className="border-2 border-red-100 rounded-xl p-3.5 bg-red-50/30 space-y-2">
                  <span className="font-black text-red-950 flex items-center gap-1.5">
                    <Ban className="w-4 h-4 text-red-600" />
                    <span>Strictly Out-of-Scope (Forbidden)</span>
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] font-semibold text-red-900">
                    <li>Arbitrating disputes between conflicting citizen claimants</li>
                    <li>Accepting unverifiable oral testimonies without 4-layer proof</li>
                    <li>Handing over property without burning the dynamic 6-digit OTP</li>
                    <li>Investigating automated botnets or subnet attack anomalies</li>
                    <li>Issuing account-wide bans or civic criminal blacklists</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DISPUTES DESK */}
          {activeTab === "disputes" && (
            <div className="flex flex-col gap-4">
              <div className="bg-amber-50 border-2 border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                <Scale className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-black text-amber-950">Disputes Desk: Civic Arbitration Tribunal & Proof Hearing</h3>
                  <p className="text-xs text-amber-900 font-semibold mt-1">
                    Acts as the impartial administrative tribunal for contesting claims, supervisor review requests, and failed challenge appeals.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border-2 border-[#e2eaf4] rounded-xl p-3.5 bg-white space-y-2">
                  <span className="font-black text-[#062B72] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>In-Scope Responsibilities</span>
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] font-semibold text-[#475569]">
                    <li>Conducting asynchronous and in-person claimant arbitration hearings</li>
                    <li>Dispatching independent proof requests (invoices, receipts, IMEI certificates)</li>
                    <li>Evaluating cross-claimant evidence without leaking decoy answers</li>
                    <li>Decreeing genuine ownership (<code className="text-emerald-700 font-bold">dismiss</code>) ➜ Routes to Cases Desk</li>
                    <li>Resetting challenge attempts (<code className="text-[#087FF5] font-bold">allow_retry</code>) for innocent citizen typos</li>
                    <li>Blacklisting confirmed imposters (<code className="text-red-700 font-bold">block</code>) ➜ Routes to Flags Desk</li>
                  </ul>
                </div>

                <div className="border-2 border-red-100 rounded-xl p-3.5 bg-red-50/30 space-y-2">
                  <span className="font-black text-red-950 flex items-center gap-1.5">
                    <Ban className="w-4 h-4 text-red-600" />
                    <span>Strictly Out-of-Scope (Forbidden)</span>
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] font-semibold text-red-900">
                    <li>Physically handing over property at the hearing table (must go to Cases)</li>
                    <li>Overriding the 4-layer cryptographic validation without documented proof</li>
                    <li>Holding physical vault keys or conducting inventory shelf audits</li>
                    <li>Closing cases as "Reunited" without OTP entry at the physical counter</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FLAGS DESK */}
          {activeTab === "flags" && (
            <div className="flex flex-col gap-4">
              <div className="bg-rose-50 border-2 border-rose-200 p-4 rounded-2xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-black text-rose-950">Flags Desk: Threat Defense, Anti-Sybil & Cybersecurity</h3>
                  <p className="text-xs text-rose-900 font-semibold mt-1">
                    Municipal cybersecurity command monitoring threat posture, bot activity, brute-force OTP attempts, and criminal imposter dossiers.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border-2 border-[#e2eaf4] rounded-xl p-3.5 bg-white space-y-2">
                  <span className="font-black text-[#062B72] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>In-Scope Responsibilities</span>
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] font-semibold text-[#475569]">
                    <li>Monitoring citywide anomaly telemetry across all 11 sub-cities and campuses</li>
                    <li>Triage of automated Sybil floods (e.g., 5 rapid reports from 1 IP)</li>
                    <li>Defending against brute-force OTP / PIN dictionary attacks</li>
                    <li>Investigating commercial advertising spam in public descriptions</li>
                    <li>Enforcing systemic account suspensions, device blocks & IP bans</li>
                    <li>Compiling formal criminal referral dossiers for Addis Ababa Police</li>
                  </ul>
                </div>

                <div className="border-2 border-red-100 rounded-xl p-3.5 bg-red-50/30 space-y-2">
                  <span className="font-black text-red-950 flex items-center gap-1.5">
                    <Ban className="w-4 h-4 text-red-600" />
                    <span>Strictly Out-of-Scope (Forbidden)</span>
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] font-semibold text-red-900">
                    <li>Handling physical found items or operating vault restitution counters</li>
                    <li>Arbitrating private civil ownership disputes between peaceful citizens</li>
                    <li>Issuing handover decrees for contested property</li>
                    <li>Bypassing civic verification protocols without security justification</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: REPORTS & AUDIT DESK */}
          {activeTab === "reports" && (
            <div className="flex flex-col gap-4">
              <div className="bg-sky-50 border-2 border-sky-200 p-4 rounded-2xl flex items-start gap-3">
                <FileText className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-black text-sky-950">Reports Desk: Master Property Intake Ledger & Municipal Auditing</h3>
                  <p className="text-xs text-sky-900 font-semibold mt-1">
                    Citywide administrative intake ledger, chain-of-custody compliance audits, printable restitution certificates, and cross-subcity SLA tracking.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border-2 border-[#e2eaf4] rounded-xl p-3.5 bg-white space-y-2">
                  <span className="font-black text-[#062B72] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>In-Scope Responsibilities</span>
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] font-semibold text-[#475569]">
                    <li>Aggregating immutable intake records across all 11 sub-cities and campus nodes</li>
                    <li>Auditing station-level SLA performance and average resolution windows (&lt;24h)</li>
                    <li>Exporting certified tamper-evident CSV property catalogs and JSON audit dossiers</li>
                    <li>Generating formal printable government and campus property restitution certificates</li>
                    <li>Ensuring zero-PII exposure compliance during administrative property oversight</li>
                  </ul>
                </div>

                <div className="border-2 border-red-100 rounded-xl p-3.5 bg-red-50/30 space-y-2">
                  <span className="font-black text-red-950 flex items-center gap-1.5">
                    <Ban className="w-4 h-4 text-red-600" />
                    <span>Strictly Out-of-Scope (Forbidden)</span>
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] font-semibold text-red-900">
                    <li>Executing dynamic 6-digit OTP verification at physical counters (must use Cases Desk)</li>
                    <li>Adjudicating contested claims or hearing citizen evidence (must use Disputes Desk)</li>
                    <li>Enforcing punitive account suspensions or IP bans (must use Flags Desk)</li>
                    <li>Modifying registered item attributes or altering chain-of-custody logs manually</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ANALYTICS & AI OBSERVATORY */}
          {activeTab === "analytics" && (
            <div className="flex flex-col gap-4">
              <div className="bg-indigo-50 border-2 border-indigo-200 p-4 rounded-2xl flex items-start gap-3">
                <Cpu className="w-5 h-5 text-indigo-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-black text-indigo-950">Analytics Desk: AI Matching Engine & Retrieval Observatory</h3>
                  <p className="text-xs text-indigo-900 font-semibold mt-1">
                    Systemic health monitoring for the 384-dimensional vector embedding cluster, cosine similarity decision boundaries, and Zero-PII cryptographic isolation.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="border-2 border-[#e2eaf4] rounded-xl p-3.5 bg-white space-y-2">
                  <span className="font-black text-[#062B72] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>In-Scope Responsibilities</span>
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] font-semibold text-[#475569]">
                    <li>Monitoring pgvector HNSW indexing health, recall @ top 5 (&gt;95%), and p95 latency (&lt;100ms)</li>
                    <li>Auditing cosine decision boundaries: Pruning (&lt;0.65), Triage (0.65–0.84), Auto-pass (&gt;=0.85)</li>
                    <li>Tracking adversarial defense block rates against brute-force blind trait probes</li>
                    <li>Verifying zero-PII encryption enforcement (AES-256 GCM) on citizen communication bridges</li>
                    <li>Exporting certified machine learning model dossiers for municipal AI auditing</li>
                  </ul>
                </div>

                <div className="border-2 border-red-100 rounded-xl p-3.5 bg-red-50/30 space-y-2">
                  <span className="font-black text-red-950 flex items-center gap-1.5">
                    <Ban className="w-4 h-4 text-red-600" />
                    <span>Strictly Out-of-Scope (Forbidden)</span>
                  </span>
                  <ul className="list-disc pl-4 space-y-1 text-[11px] font-semibold text-red-900">
                    <li>Executing physical property handovers or verifying 6-digit OTP codes (Cases Desk)</li>
                    <li>Adjudicating contested claims or manually altering match scores (Disputes Desk)</li>
                    <li>Applying criminal account bans or IP blocklists (Flags Desk)</li>
                    <li>Bypassing privacy pruning thresholds to inspect raw PII without authorization</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#e2eaf4] bg-[#F8FAFC] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#64748B] font-semibold">
            <ShieldCheck className="w-4 h-4 text-[#087FF5]" />
            <span>Addis Ababa Municipal Operations Standard • Directive #STF-DIR-2026</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-black bg-[#062B72] hover:bg-[#0c2340] text-white shadow-xs transition-all cursor-pointer"
          >
            Acknowledge Directive
          </button>
        </div>
      </div>
    </div>
  );
}

