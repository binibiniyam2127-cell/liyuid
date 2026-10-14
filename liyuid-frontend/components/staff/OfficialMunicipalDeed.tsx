"use client";

import React, { useRef } from "react";
import {
  FileText,
  Printer,
  ShieldCheck,
  QrCode,
  MapPin,
  Calendar,
  CheckCircle2,
  Building,
  Sparkles,
} from "lucide-react";

interface OfficialMunicipalDeedProps {
  reportRecord?: {
    id: string;
    itemTitle: string;
    category: string;
    subCity: string;
    primaryColor: string;
    status: string;
    custody: string;
    createdDate: string;
  } | null;
}

export function OfficialMunicipalDeed({ reportRecord }: OfficialMunicipalDeedProps) {
  const deedRef = useRef<HTMLDivElement | null>(null);

  const defaultRecord = {
    id: "MUNI-AA-2026-8941",
    itemTitle: "Apple MacBook Pro 16\" Space Gray",
    category: "Electronics",
    subCity: "Bole",
    primaryColor: "Space Gray",
    status: "Reunited",
    custody: "Returned to Citizen",
    createdDate: "2026-10-10",
  };

  const item = reportRecord || defaultRecord;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 text-[#062B72]">
      {/* Action Bar */}
      <div className="flex items-center justify-between bg-white border-2 border-[#e2eaf4] rounded-2xl p-4 shadow-xs print:hidden">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-emerald-600" />
          <span className="text-sm font-black">Official Municipal Property Transfer Deed & Escrow Certificate</span>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-all active:scale-95"
        >
          <Printer className="w-4 h-4" />
          <span>Print Official Deed (PDF)</span>
        </button>
      </div>

      {/* Official Government Deed Parchment (A4 style) */}
      <div
        ref={deedRef}
        className="bg-white border-4 border-double border-slate-700 rounded-3xl p-8 sm:p-12 shadow-xl flex flex-col gap-8 max-w-4xl mx-auto relative overflow-hidden text-slate-900 print:shadow-none print:border-2 print:m-0 print:p-6"
      >
        {/* Subtle Civic Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-4">
          <Building className="w-[450px] h-[450px] text-slate-900" />
        </div>

        {/* Top Header */}
        <div className="flex flex-col items-center text-center gap-1.5 border-b-2 border-slate-800 pb-6 relative z-10">
          <span className="text-[11px] font-black uppercase tracking-widest text-slate-600">
            Federal Democratic Republic of Ethiopia • City Government of Addis Ababa
          </span>
          <h2 className="text-xl sm:text-2xl font-serif font-black tracking-tight text-slate-950 uppercase">
            Official Municipal Property Restitution Certificate
          </h2>
          <span className="text-xs font-mono font-bold text-slate-600">
            Document Folio: FDRE-AA-MUNI-2026-{item.id.replace(/[^a-zA-Z0-9]/g, "").slice(0, 8).toUpperCase()}
          </span>
        </div>

        {/* Legal Certification Statement */}
        <div className="relative z-10 text-xs sm:text-sm text-slate-800 leading-relaxed text-justify font-serif">
          This certified municipal instrument testifies that pursuant to the Addis Ababa Municipal Lost Property Protocol and verified via asymmetric cryptographic challenge verification, the under-described property has been formally inventoried, custody-cleared, and released under certified supervision.
        </div>

        {/* Item Particulars Table */}
        <div className="relative z-10 border-2 border-slate-800 rounded-2xl overflow-hidden font-sans text-xs">
          <div className="bg-slate-100 font-black px-4 py-2 border-b border-slate-800 uppercase text-[11px] text-slate-700">
            Article Particulars & Chain of Custody
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-800">
            <div className="p-3">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Asset Classification</span>
              <strong className="text-xs font-black">{item.category}</strong>
            </div>
            <div className="p-3">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Item Title</span>
              <strong className="text-xs font-black line-clamp-1">{item.itemTitle}</strong>
            </div>
            <div className="p-3">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Municipal Station</span>
              <strong className="text-xs font-black">{item.subCity} Station</strong>
            </div>
            <div className="p-3">
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Custodial Disposition</span>
              <strong className="text-xs font-black text-emerald-800">{item.custody}</strong>
            </div>
          </div>
        </div>

        {/* Verification Credentials Strip */}
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-4 border-2 border-dashed border-slate-400 rounded-2xl p-4 text-xs font-sans">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-700 shrink-0" />
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Verification Status</span>
              <strong className="text-emerald-800 font-black">4-Layer Asymmetric Cleared</strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <QrCode className="w-8 h-8 text-slate-800 shrink-0" />
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Digital Seal Stamp</span>
              <span className="font-mono text-[11px] text-slate-700">SHA256:VERIFIED_PASS</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar className="w-8 h-8 text-blue-700 shrink-0" />
            <div>
              <span className="text-[10px] uppercase text-slate-500 font-bold block">Certified Date</span>
              <strong className="text-slate-800 font-mono">{item.createdDate}</strong>
            </div>
          </div>
        </div>

        {/* Official Attestation & Signatures */}
        <div className="relative z-10 grid grid-cols-2 gap-8 pt-8 border-t-2 border-slate-800 mt-4 text-xs font-serif">
          <div className="flex flex-col items-center text-center gap-8">
            <div className="h-10 border-b border-slate-500 w-48" />
            <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wider">
              Authorized Municipal Attendant Signature & Seal
            </span>
          </div>

          <div className="flex flex-col items-center text-center gap-8">
            <div className="h-10 border-b border-slate-500 w-48" />
            <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wider">
              Citizen Recipient Handover Confirmation
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

