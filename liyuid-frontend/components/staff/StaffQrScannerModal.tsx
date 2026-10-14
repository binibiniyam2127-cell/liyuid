"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Camera,
  ScanLine,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  MapPin,
  Archive,
  ArrowRight,
  Barcode,
  Building2,
  Copy,
  Check,
  AlertTriangle,
  ArrowDownToLine,
  KeyRound,
  MessageSquare,
} from "lucide-react";

export interface ScanInspectionResult {
  role: "finder" | "owner" | "general";
  rawText: string;
  code: string;
  shelfPlace?: string;
  voucherNumber?: string;
  itemTitle?: string;
  subCity?: string;
  notes?: string;
}

export function parseHandoverQr(
  scannedText: string,
  casesList?: any[],
  enforcedPurpose?: "finder" | "owner"
): ScanInspectionResult {
  const text = scannedText.trim();

  // Explicit role checks
  const hasFinderMarker =
    text.startsWith("LIYUID:FINDER:") ||
    text.includes("DEP-MUN") ||
    text.toLowerCase().includes("finder") ||
    text.toLowerCase().includes("drop");

  const hasOwnerMarker =
    text.startsWith("LIYUID:OWNER:") ||
    text.startsWith("LIYUID:SHELF:") ||
    text.startsWith("OTP-") ||
    text.toLowerCase().includes("owner") ||
    /^\d{6}$/.test(text) ||
    text.toLowerCase().includes("shelf") ||
    text.toLowerCase().includes("claim");

  // Determine role based on markers and enforced purpose
  let isFinder = false;
  let isOwner = false;

  if (hasFinderMarker && !hasOwnerMarker) {
    isFinder = true;
  } else if (hasOwnerMarker && !hasFinderMarker) {
    isOwner = true;
  } else if (enforcedPurpose === "finder") {
    isFinder = true;
  } else if (enforcedPurpose === "owner") {
    isOwner = true;
  } else {
    isOwner = true; // default
  }

  if (isFinder) {
    const parts = text.split(":");
    const voucher =
      parts.find((p) => p.includes("DEP-MUN")) ||
      text.match(/#?DEP-MUN-[\w-]+/)?.[0] ||
      (text.startsWith("#") ? text : `#DEP-MUN-${Math.floor(100000 + Math.random() * 900000)}`);

    const caseId = parts[2] || "";
    const matchedCase = casesList?.find(
      (c) => c && (c.id === caseId || c.deposit_voucher === voucher)
    );

    return {
      role: "finder",
      rawText: text,
      code: voucher,
      voucherNumber: voucher,
      itemTitle: matchedCase?.item_title || parts[4] || parts[3] || "Reported Lost Property (Intake)",
      shelfPlace: matchedCase?.vault_locker || "Municipal Intake Counter #104 → Vault Locker B-14",
      subCity: matchedCase?.subCity ? `${matchedCase.subCity} Sub-City Desk #104` : "Bole Sub-City Desk #104",
      notes: "The finder has surrendered the physical item. Intake verified and registered into municipal holding custody.",
    };
  }

  if (isOwner) {
    const parts = text.split(":");
    let shelfCoordinate = "Locker B-14 (Shelf Tier B, Unit 02)";
    let cleanOtp = "749201";
    let itemDocketTitle = "Verified Lost Property (MacBook Pro 14\")";

    if (text.startsWith("LIYUID:SHELF:")) {
      shelfCoordinate = parts[2] || shelfCoordinate;
      cleanOtp = parts[4] || cleanOtp;
      itemDocketTitle = parts[5] || itemDocketTitle;
    } else {
      let otp = parts.find((p) => p.startsWith("OTP-") || /^\d{6}$/.test(p));
      if (!otp) {
        const match = text.match(/\d{6}/);
        otp = match ? match[0] : text;
      }
      cleanOtp = otp.replace(/^OTP-/, "");
      shelfCoordinate = parts[4] || shelfCoordinate;
      itemDocketTitle = parts[5] || itemDocketTitle;
    }

    const caseId = parts[2] || "";
    const matchedCase = casesList?.find(
      (c) =>
        c &&
        (c.id === caseId ||
          c.otp_code === cleanOtp ||
          c.vault_locker === shelfCoordinate ||
          (c.stage || "").includes("Ready"))
    );

    return {
      role: "owner",
      rawText: text,
      code: cleanOtp,
      shelfPlace: matchedCase?.vault_locker || shelfCoordinate,
      itemTitle: matchedCase?.item_title || itemDocketTitle,
      subCity: matchedCase?.subCity ? `${matchedCase.subCity} Property Vault #104` : "Bole Sub-City Property Vault #104",
      notes: "Owner presented Shelf Detection QR. Retrieve item from designated shelf and verify citizen Government ID.",
    };
  }

  // Fallback
  return {
    role: "general",
    rawText: text,
    code: text,
    shelfPlace: "Locker B-14 (Shelf Tier B, Unit 02)",
    itemTitle: "General Custody Docket",
    subCity: "Bole Sub-City Property Vault",
    notes: "General property tag scanned.",
  };
}

interface StaffQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (scannedText: string, inspection?: ScanInspectionResult) => void;
  title?: string;
  subtitle?: string;
  cases?: any[];
  initialPurpose?: "finder" | "owner";
}

export function StaffQrScannerModal({
  isOpen,
  onClose,
  onScan,
  title,
  subtitle,
  cases = [],
  initialPurpose = "owner",
}: StaffQrScannerModalProps) {
  const [purpose, setPurpose] = useState<"finder" | "owner">(initialPurpose);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState("");
  const [inspection, setInspection] = useState<ScanInspectionResult | null>(null);
  const [assignedShelf, setAssignedShelf] = useState("Locker B-14 (Shelf Tier B, Unit 02)");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize purpose when initialPurpose prop changes
  useEffect(() => {
    if (initialPurpose) {
      setPurpose(initialPurpose);
    }
  }, [initialPurpose, isOpen]);

  // Dynamic titles and copy based on purpose
  const effectiveTitle =
    title ||
    (purpose === "finder"
      ? "📥 Finder Drop-Off Intake Scanner"
      : "📍 Owner Restitution Shelf Scanner");

  const effectiveSubtitle =
    subtitle ||
    (purpose === "finder"
      ? "Scan Finder's municipal voucher or QR pass to confirm physical drop-off"
      : "Scan Owner's claim QR to identify item storage place (shelf) & verify OTP");

  // Play a pleasant double-tone confirmation chime using Web Audio API
  const playSuccessChime = () => {
    try {
      if (typeof window !== "undefined" && (window.AudioContext || (window as any).webkitAudioContext)) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioCtx();
        const now = ctx.currentTime;

        // Tone 1: 523Hz (C5)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.frequency.setValueAtTime(523.25, now);
        gain1.gain.setValueAtTime(0.15, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.start(now);
        osc1.stop(now + 0.12);

        // Tone 2: 784Hz (G5)
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.frequency.setValueAtTime(783.99, now + 0.12);
        gain2.gain.setValueAtTime(0.18, now + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.28);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.28);
      }
    } catch {
      // Audio playback safely optional
    }
  };

  const handleProcessCode = (rawText: string) => {
    playSuccessChime();
    stopCamera();
    const result = parseHandoverQr(rawText, cases, purpose);
    setInspection(result);
    if (result.shelfPlace) {
      setAssignedShelf(result.shelfPlace);
    } else {
      setAssignedShelf("Locker B-14 (Shelf Tier B, Unit 02)");
    }
  };

  const handleConfirmInspection = () => {
    if (!inspection) return;
    onScan(inspection.code, { ...inspection, shelfPlace: assignedShelf });
    onClose();
    setInspection(null);
  };

  const handleResetInspection = () => {
    setInspection(null);
    startCamera();
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Webcam access not supported in this browser environment.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);
      }

      // Check for native BarcodeDetector API
      if ("BarcodeDetector" in window) {
        const barcodeDetector = new (window as any).BarcodeDetector({ formats: ["qr_code", "code_128", "code_39"] });
        scanIntervalRef.current = setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState >= 2) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                const rawValue = barcodes[0].rawValue;
                if (rawValue) {
                  clearInterval(scanIntervalRef.current!);
                  handleProcessCode(rawValue);
                }
              }
            } catch {
              // frame detection pass
            }
          }
        }, 400);
      }
    } catch (err: any) {
      console.warn("Camera start notice:", err);
      setCameraError(err.message || "Unable to access camera. Please allow camera permissions or enter code manually.");
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      setInspection(null);
      startCamera();
    } else {
      stopCamera();
      setInspection(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  // Handle manual code submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    handleProcessCode(manualInput.trim());
    setManualInput("");
  };

  // Purpose-specific presets
  const FINDER_PRESETS = [
    {
      label: "📥 Scan Finder Drop-Off (MacBook Pro)",
      code: "LIYUID:FINDER:CASE-BOLE-01:#DEP-MUN-689217:MacBook Pro 14\"",
      badge: "Voucher #689217",
    },
    {
      label: "📄 Deposit Voucher #DEP-MUN-882194",
      code: "#DEP-MUN-882194",
      badge: "Voucher #882194",
    },
    {
      label: "📥 Finder Drop-Off (iPhone 13)",
      code: "LIYUID:FINDER:CASE-BOLE-02:#DEP-MUN-582442:iPhone 13 Pro",
      badge: "Voucher #582442",
    },
    {
      label: "📄 Deposit Slip #DEP-MUN-301928",
      code: "#DEP-MUN-301928",
      badge: "Voucher #301928",
    },
  ];

  const OWNER_PRESETS = [
    {
      label: "📍 Shelf Detection QR (Locker B-14)",
      code: "LIYUID:SHELF:Locker B-14 (Shelf Tier B, Unit 02):CASE-BOLE-01:749201:MacBook Pro 14\"",
      badge: "Shelf B-14",
    },
    {
      label: "🔑 Restitution OTP #892147 (Shelf C-05)",
      code: "LIYUID:OWNER:CASE-BOLE-02:892147:Locker C-05 (Shelf Tier C, Unit 01):Leather Wallet",
      badge: "Shelf C-05",
    },
    {
      label: "📍 Owner Claim Pass (Shelf A-02)",
      code: "LIYUID:OWNER:CASE-BOLE-03:456141:Locker A-02 (Shelf Tier A, Unit 01):iPhone 13 Pro",
      badge: "Shelf A-02",
    },
    {
      label: "🔑 6-Digit Counter OTP 749201",
      code: "OTP-749201",
      badge: "OTP Pin",
    },
  ];

  const currentPresets = purpose === "finder" ? FINDER_PRESETS : OWNER_PRESETS;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border-2 border-[#cbd9e8] shadow-2xl max-w-lg w-full overflow-hidden flex flex-col text-[#062B72]">
        {/* Top Header */}
        <div
          className={`p-4 sm:p-5 flex flex-col gap-3 text-white transition-colors duration-200 ${
            purpose === "finder" ? "bg-[#064e3b]" : "bg-[#0c2340]"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 ${
                  purpose === "finder" ? "bg-emerald-500" : "bg-[#1982fc]"
                }`}
              >
                {purpose === "finder" ? (
                  <CheckCircle2 className="w-5 h-5 animate-pulse" />
                ) : (
                  <MapPin className="w-5 h-5 animate-pulse" />
                )}
              </div>
              <div>
                <h2 className="text-base font-black tracking-tight">{effectiveTitle}</h2>
                <p className="text-[11px] text-slate-200 font-medium">{effectiveSubtitle}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              aria-label="Close Scanner"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Purpose Selector Tabs */}
          <div className="flex bg-black/25 p-1 rounded-xl border border-white/10 gap-1 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setPurpose("finder");
                setInspection(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                purpose === "finder"
                  ? "bg-emerald-600 text-white shadow-xs font-black"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>📥 Finder Drop-Off (Intake)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPurpose("owner");
                setInspection(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                purpose === "owner"
                  ? "bg-[#087FF5] text-white shadow-xs font-black"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>📍 Owner Claim (Shelf)</span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* CONDITIONAL RENDER: INSPECTION SCREEN vs SCANNER CAMERA VIEW       */}
        {/* ------------------------------------------------------------------ */}

        {inspection ? (
          /* ================================================================
             INSPECTION RESULT SCREEN (Differentiated for Finder vs Owner)
             ================================================================ */
          <div className="p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95">
            {inspection.role === "finder" ? (
              /* ------------------------------------------------------------
                 FINDER SCAN SCREEN: "Item Dropped Successfully!"
                 ------------------------------------------------------------ */
              <div className="flex flex-col gap-4">
                {/* Green Celebration Banner */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/70 border-2 border-emerald-400 flex items-start gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <CheckCircle2 className="w-7 h-7 stroke-[2.5] animate-bounce" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-200 text-emerald-900">
                        Finder Drop-Off Pass • የአግኚ ማስረከቢያ
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-emerald-950 mt-1">
                      ✔ Item Dropped Successfully!
                    </h3>
                    <p className="text-xs font-bold text-emerald-800">
                      እቃው በተሳካ ሁኔታ ተረክቧል!
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">
                      {inspection.notes}
                    </p>
                  </div>
                </div>

                {/* Voucher & Intake Verification Box */}
                <div className="bg-[#F8FAFC] border-2 border-[#e2eaf4] rounded-2xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between border-b border-[#e2eaf4] pb-2.5">
                    <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
                      Official Deposit Voucher
                    </span>
                    <span className="font-mono text-base font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-300">
                      {inspection.voucherNumber}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Item Title</span>
                      <span className="font-bold text-[#062B72]">{inspection.itemTitle}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Intake Desk</span>
                      <span className="font-bold text-[#062B72]">{inspection.subCity}</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-xs text-emerald-900 font-bold">
                    <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Intake Custody Status: Officially Received & Logged in Municipal Custody</span>
                  </div>
                </div>

                {/* Auto-Assigned Storage Shelf / Locker Unit (Option C) */}
                <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/90 border-2 border-[#087FF5]/40 rounded-2xl p-4 flex flex-col gap-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Archive className="w-4 h-4 text-[#087FF5]" />
                      <span className="text-xs font-black text-[#062B72] uppercase tracking-wider">
                        📍 Auto-Assigned Storage Shelf
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-[#062B72] border border-blue-200">
                      Option C Active
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Designated warehouse coordinate for physical vault placement:
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={assignedShelf}
                      onChange={(e) => setAssignedShelf(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-white border border-blue-200 text-xs font-mono font-bold text-[#062B72] focus:outline-hidden focus:border-[#087FF5]"
                      placeholder="e.g. Locker B-14 (Shelf Tier B, Unit 02)"
                    />
                    <select
                      onChange={(e) => e.target.value && setAssignedShelf(e.target.value)}
                      className="px-2.5 py-2 rounded-xl bg-white border border-blue-200 text-xs font-semibold text-slate-700 focus:outline-hidden cursor-pointer"
                      defaultValue=""
                    >
                      <option value="" disabled>Shelf Presets</option>
                      <option value="Locker B-14 (Shelf Tier B, Unit 02)">Locker B-14 (Tier B)</option>
                      <option value="Locker A-02 (Shelf Tier A, Unit 01)">Locker A-02 (Tier A)</option>
                      <option value="Locker C-05 (Shelf Tier C, Unit 03)">Locker C-05 (Tier C)</option>
                      <option value="Locker D-01 (High-Security Vault)">Locker D-01 (Vault)</option>
                    </select>
                  </div>
                </div>

                {/* Automated Citizen SMS Dispatch Preview Card */}
                <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-2xl p-4 flex flex-col gap-2.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-black text-emerald-950 uppercase tracking-wider">
                        📱 Automated Citizen SMS Preview
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                      Auto-Dispatched on Intake
                    </span>
                  </div>
                  <div className="bg-white/95 border border-emerald-200 rounded-xl p-3 text-xs flex flex-col gap-1.5 text-slate-800 shadow-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold border-b border-slate-100 pb-1">
                      <span>To: <strong className="text-[#062B72]">Citizen Owner (+251 91 123 4567)</strong></span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 font-mono text-slate-600">Ethio Telecom SMPP</span>
                    </div>
                    <p className="font-bold text-[#062B72] leading-snug">
                      &ldquo;LIYUID Alert: Your item ({inspection.itemTitle || "Verified Property"}) is stored at {inspection.subCity || "Bole Station"}, Shelf {assignedShelf}. Present your Claim Pass to claim it.&rdquo;
                    </p>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      &ldquo;ሊዩይድ ማስታወቂያ፡ እቃዎ በ{inspection.subCity || "ቦሌ ጣቢያ"} መደርደሪያ {assignedShelf} ተቀምጧል። እቃውን ለመረከብ የይገባኛል ማለፊያዎን ያሳዩ።&rdquo;
                    </p>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResetInspection}
                    className="px-4 py-3.5 rounded-2xl border-2 border-[#cbd9e8] text-slate-600 hover:bg-slate-100 font-black text-xs transition-all cursor-pointer"
                  >
                    Scan Another
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmInspection}
                    className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer active:scale-98"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm Drop-Off, Tag Shelf & Send Citizen SMS 📱</span>
                  </button>
                </div>
              </div>
            ) : (
              /* ------------------------------------------------------------
                 OWNER SCAN SCREEN: "Item Storage Location (Shelf / Place)"
                 ------------------------------------------------------------ */
              <div className="flex flex-col gap-4">
                {/* Storage Coordinate Primary Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-[#F0F7FF] border-2 border-[#087FF5] flex items-start gap-4 shadow-sm">
                  <div className="w-12 h-12 rounded-2xl bg-[#062B72] text-amber-300 flex items-center justify-center shrink-0 shadow-md">
                    <MapPin className="w-7 h-7 stroke-[2.5] animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-200 text-blue-950">
                        Shelf Detection & Retrieval • የመደርደሪያ መለያ
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-[#062B72] mt-1">
                      📍 Item Storage Shelf & Code Detected
                    </h3>
                    <p className="text-xs font-bold text-[#087FF5]">
                      የእቃው ማስቀመጫ መደርደሪያ እና ገለልተኛ ኮድ ተገኝቷል
                    </p>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                      QR code detected the assigned storage coordinate. Locate the item from the designated shelf below.
                    </p>
                  </div>
                </div>

                {/* Prominent Shelf / Locker Coordinate Box */}
                <div className="bg-[#062B72] text-white rounded-2xl p-4 flex flex-col gap-3 shadow-md">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Archive className="w-4 h-4 text-amber-300" />
                    <span>Independent Storage Shelf / Locker Coordinate:</span>
                  </span>

                  <div className="bg-white/10 border border-white/20 rounded-xl p-3.5 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-300 block font-medium">Physical Shelf Location</span>
                      <span className="text-xl sm:text-2xl font-black font-mono text-amber-300 tracking-wide">
                        {inspection.shelfPlace}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-300 block">Facility Vault</span>
                      <span className="text-xs font-bold text-white">{inspection.subCity}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
                    <span className="text-slate-300">Target Item / Docket:</span>
                    <span className="font-bold text-white truncate max-w-[220px]">
                      {inspection.itemTitle}
                    </span>
                  </div>
                </div>

                {/* Mandatory Handover Assurance Alert */}
                <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
                  <KeyRound className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-black block uppercase tracking-wide">
                      Mandatory Handover Assurance Protocol (የግዴታ ማረጋገጫ)
                    </span>
                    <span className="text-[11px] leading-relaxed block text-amber-800 mt-0.5">
                      The QR code <strong>only detects the shelf location</strong> so you can locate and retrieve the item. To officially assure that the item was successfully handed over, you <strong>MUST enter and burn the citizen&apos;s 6-digit One-Time PIN (OTP)</strong> at the counter terminal!
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleResetInspection}
                    className="px-4 py-3 rounded-2xl border-2 border-[#cbd9e8] text-slate-600 hover:bg-slate-100 font-black text-xs transition-all cursor-pointer"
                  >
                    Scan Another
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmInspection}
                    className="flex-1 py-3.5 rounded-2xl bg-[#087FF5] hover:bg-[#076ed4] text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#087FF5]/25 transition-all cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-amber-300" />
                    <span>Fetch from Shelf & Enter Mandatory OTP →</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ================================================================
             STANDARD SCANNER CAMERA VIEWPORT + MANUAL & PRESETS
             ================================================================ */
          <>
            {/* Video Scanner Viewport */}
            <div className="relative bg-slate-900 aspect-4/3 flex items-center justify-center overflow-hidden">
              {cameraActive ? (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Holographic Aiming Box styled for purpose */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div
                      className={`w-52 h-52 border-2 border-dashed rounded-2xl relative ${
                        purpose === "finder"
                          ? "border-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.4)]"
                          : "border-[#0088ff] shadow-[0_0_20px_rgba(0,136,255,0.4)]"
                      }`}
                    >
                      {/* Corner brackets */}
                      <div
                        className={`absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 rounded-tl-lg ${
                          purpose === "finder" ? "border-emerald-400" : "border-amber-400"
                        }`}
                      />
                      <div
                        className={`absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 rounded-tr-lg ${
                          purpose === "finder" ? "border-emerald-400" : "border-amber-400"
                        }`}
                      />
                      <div
                        className={`absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 rounded-bl-lg ${
                          purpose === "finder" ? "border-emerald-400" : "border-amber-400"
                        }`}
                      />
                      <div
                        className={`absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 rounded-br-lg ${
                          purpose === "finder" ? "border-emerald-400" : "border-amber-400"
                        }`}
                      />

                      {/* Animated laser line */}
                      <div
                        className={`w-full h-0.5 absolute top-1/2 -translate-y-1/2 animate-bounce ${
                          purpose === "finder"
                            ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                            : "bg-[#087FF5] shadow-[0_0_8px_#38bdf8]"
                        }`}
                      />
                    </div>
                  </div>

                  <div className="absolute bottom-3 px-3 py-1 rounded-full bg-black/60 text-white text-[10px] font-mono font-bold backdrop-blur-xs flex items-center gap-1.5 pointer-events-none">
                    <span
                      className={`w-2 h-2 rounded-full animate-ping ${
                        purpose === "finder" ? "bg-emerald-400" : "bg-[#087FF5]"
                      }`}
                    />
                    <span>
                      {purpose === "finder"
                        ? "INTAKE ACTIVE • SCANNING FINDER PASS"
                        : "SHELF RETRIEVAL ACTIVE • SCANNING OWNER CLAIM"}
                    </span>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center flex flex-col items-center gap-3 text-slate-300">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-slate-300">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-xs font-semibold max-w-xs text-slate-300">
                    {cameraError ||
                      (purpose === "finder"
                        ? "Intake camera ready. Align Finder deposit voucher QR."
                        : "Restitution camera ready. Align Owner claim QR.")}
                  </p>
                  <button
                    type="button"
                    onClick={startCamera}
                    className={`mt-1 px-4 py-2 rounded-xl text-white text-xs font-black shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5 ${
                      purpose === "finder"
                        ? "bg-emerald-600 hover:bg-emerald-700"
                        : "bg-[#087FF5] hover:bg-[#076ed4]"
                    }`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Camera Feed</span>
                  </button>
                </div>
              )}
            </div>

            {/* Manual Code Input & Presets */}
            <div className="p-4 sm:p-5 flex flex-col gap-3.5 bg-white">
              <form onSubmit={handleManualSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder={
                    purpose === "finder"
                      ? "Enter Finder deposit voucher (e.g. #DEP-MUN-689217)..."
                      : "Enter Owner 6-digit OTP (e.g. OTP-749201)..."
                  }
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  className={`flex-1 bg-[#F8FAFC] border-2 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-[#062B72] outline-none transition-all placeholder:font-sans placeholder:text-slate-400 ${
                    purpose === "finder"
                      ? "border-emerald-200 focus:border-emerald-600"
                      : "border-[#cbd9e8] focus:border-[#087FF5]"
                  }`}
                />
                <button
                  type="submit"
                  disabled={!manualInput.trim()}
                  className={`px-4 py-2 rounded-xl text-white text-xs font-black transition-all cursor-pointer disabled:opacity-40 shrink-0 ${
                    purpose === "finder"
                      ? "bg-emerald-700 hover:bg-emerald-800"
                      : "bg-[#062B72] hover:bg-[#0c2340]"
                  }`}
                >
                  Verify
                </button>
              </form>

              {/* Purpose-Specific Rapid Simulation Presets */}
              <div className="border-t border-[#e2eaf4] pt-3 flex flex-col gap-1.5">
                <span className="text-[10px] uppercase font-black tracking-wider text-[#64748B] flex items-center gap-1">
                  <Sparkles
                    className={`w-3 h-3 ${purpose === "finder" ? "text-emerald-600" : "text-[#087FF5]"}`}
                  />
                  {purpose === "finder"
                    ? "Finder Drop-Off Rapid Presets:"
                    : "Owner Restitution Rapid Presets:"}
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {currentPresets.map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => handleProcessCode(p.code)}
                      className={`px-2.5 py-2 rounded-xl border text-[11px] font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-between text-left ${
                        purpose === "finder"
                          ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                          : "bg-[#F0F7FF] hover:bg-[#E0EFFF] text-[#087FF5] border-[#B9E1FD]"
                      }`}
                    >
                      <span className="truncate pr-1">{p.label}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-white border font-mono shrink-0">
                        {p.badge}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
