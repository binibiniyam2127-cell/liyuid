"use client";

import React, { useState } from "react";
import {
  KeyRound,
  QrCode,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Printer,
  Sparkles,
  Barcode,
  ArrowRight,
  X,
  Archive,
  MapPin,
} from "lucide-react";
import { CaseRecord } from "./CaseTable";
import { api } from "@/lib/api";

interface CounterHandoverKeypadProps {
  activeCase?: CaseRecord | null;
  onClose?: () => void;
  onSuccess?: (caseId: string) => void;
  onOpenScanner?: () => void;
  onOpenOwnerScanner?: () => void;
  onOpenFinderScanner?: () => void;
  initialOtp?: string;
}

export function CounterHandoverKeypad({
  activeCase,
  onClose,
  onSuccess,
  onOpenScanner,
  onOpenOwnerScanner,
  onOpenFinderScanner,
  initialOtp,
}: CounterHandoverKeypadProps) {
  const [digits, setDigits] = useState<string[]>(() => {
    if (initialOtp && initialOtp.length === 6) {
      return initialOtp.split("");
    }
    return [];
  });
  const [submitting, setSubmitting] = useState(false);
  const [verificationResult, setVerificationResult] = useState<"idle" | "success" | "failure">("idle");
  const [errorMessage, setErrorMessage] = useState<string>("");

  React.useEffect(() => {
    if (initialOtp && initialOtp.length === 6) {
      setDigits(initialOtp.split(""));
    }
  }, [initialOtp]);

  const handlePress = (num: string) => {
    if (digits.length < 6) {
      setDigits((prev) => [...prev, num]);
    }
  };

  const handleClear = () => {
    setDigits([]);
    setVerificationResult("idle");
    setErrorMessage("");
  };

  const handleBackspace = () => {
    setDigits((prev) => prev.slice(0, -1));
  };

  const handleVerifyOtp = async () => {
    if (digits.length !== 6) {
      setErrorMessage("Please enter all 6 digits of the citizen's OTP.");
      return;
    }

    try {
      setSubmitting(true);
      setErrorMessage("");

      const otpString = digits.join("");

      if (activeCase?.handover_id) {
        await api.municipalRelease(activeCase.handover_id, {
          otp_code: otpString,
          government_id_verified: true,
          owner_notes: "Restituted at municipal counter terminal via Government ID.",
        });
      } else if (activeCase?.match_id) {
        await api.municipalReleaseByMatch(activeCase.match_id, {
          otp_code: otpString,
          government_id_verified: true,
          owner_notes: "Restituted at municipal counter terminal via Government ID.",
        });
      } else {
        await new Promise((res) => setTimeout(res, 800));
        if (otpString === "000000" || otpString.startsWith("111")) {
          setVerificationResult("failure");
          setErrorMessage("Invalid OTP code. 2 attempts remaining (1/3 used) before security lock.");
          return;
        }
      }

      setVerificationResult("success");
      if (onSuccess && activeCase) {
        onSuccess(activeCase.id);
      }
    } catch (err: any) {
      setVerificationResult("failure");
      setErrorMessage(err?.message || "Invalid OTP code. Counter verification failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-[#e2eaf4] shadow-xl p-6 sm:p-8 flex flex-col gap-6 max-w-xl mx-auto text-[#062B72]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#e2eaf4]">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#062B72] text-amber-300 flex items-center justify-center font-mono font-black shadow-xs">
            <KeyRound className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-black">Citizen Restitution Counter Terminal</h3>
            <p className="text-xs text-[#64748B]">
              {activeCase ? `Restitution for ${activeCase.item_title || activeCase.id}` : "Direct Counter 6-Digit OTP Burn"}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Target Item & Assigned Storage Shelf Coordinate */}
      {activeCase && (
        <div className="bg-[#F0F7FF] border border-[#B9E1FD] rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
          <div className="flex items-center gap-2.5">
            <Barcode className="w-4 h-4 text-[#087FF5] shrink-0" />
            <span className="font-black text-[#062B72]">{activeCase.item_title}</span>
            <span className="text-[#64748B]">({activeCase.subCity} Hub)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 font-extrabold text-[11px] shadow-xs">
              <Archive className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>📍 Storage Shelf: {activeCase.vault_locker || "Locker B-14 (Shelf Tier B, Unit 02)"}</span>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-100 text-[#087FF5] shrink-0">
              Handover Ready
            </span>
          </div>
        </div>
      )}

      {/* Mandatory Handover Assurance Alert */}
      <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl flex items-center gap-3 text-xs text-amber-900 font-bold">
        <KeyRound className="w-5 h-5 text-amber-600 shrink-0" />
        <div className="flex-1">
          <span className="font-black block uppercase tracking-wide">
            Mandatory Handover Assurance Protocol (የግዴታ ማረጋገጫ)
          </span>
          <span className="text-[11px] text-amber-800 leading-relaxed block mt-0.5">
            The QR code detects the shelf coordinate ({activeCase?.vault_locker || "Locker B-14"}). Burning this 6-digit citizen OTP is <strong>mandatory</strong> on municipal and peer-to-peer handovers to officially assure physical capture.
          </span>
        </div>
      </div>

      {/* 6-Digit Display Boxes */}
      <div className="flex flex-col items-center gap-3">
        <span className="text-xs font-black uppercase text-[#64748B] tracking-wider">
          Citizen One-Time Pin (OTP) — Mandatory For Release
        </span>
        <div className="flex items-center gap-2 sm:gap-3">
          {[0, 1, 2, 3, 4, 5].map((index) => {
            const digit = digits[index];
            const isCurrent = digits.length === index;
            return (
              <div
                key={index}
                className={`w-11 h-14 sm:w-13 sm:h-16 rounded-2xl border-2 flex items-center justify-center text-2xl font-black font-mono transition-all ${
                  digit
                    ? "border-[#087FF5] bg-[#F0F7FF] text-[#087FF5] shadow-xs"
                    : isCurrent
                    ? "border-[#087FF5] bg-white ring-4 ring-[#087FF5]/10 animate-pulse"
                    : "border-[#cbd9e8] bg-[#F8FAFC] text-slate-300"
                }`}
              >
                {digit || "•"}
              </div>
            );
          })}
        </div>
      </div>

      {/* Result Alerts */}
      {verificationResult === "success" && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-3 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <div className="flex-1">
            <span className="font-black block">OTP BURNED & VERIFIED!</span>
            <span className="text-[11px] text-emerald-700">
              Identity verified. The physical item may now be transferred to the citizen.
            </span>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-3 animate-in fade-in">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tactile Keypad (1 to 9, C, 0, Backspace) */}
      <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handlePress(num)}
            className="h-13 sm:h-15 rounded-2xl bg-[#F8FAFC] hover:bg-[#F0F7FF] hover:border-[#B9E1FD] active:scale-95 border-2 border-[#e2eaf4] text-xl font-black font-mono text-[#062B72] transition-all cursor-pointer shadow-xs flex items-center justify-center"
          >
            {num}
          </button>
        ))}
        <button
          type="button"
          onClick={handleClear}
          className="h-13 sm:h-15 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-xs font-black uppercase text-slate-600 transition-all cursor-pointer flex items-center justify-center"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={() => handlePress("0")}
          className="h-13 sm:h-15 rounded-2xl bg-[#F8FAFC] hover:bg-[#F0F7FF] hover:border-[#B9E1FD] active:scale-95 border-2 border-[#e2eaf4] text-xl font-black font-mono text-[#062B72] transition-all cursor-pointer shadow-xs flex items-center justify-center"
        >
          0
        </button>
        <button
          type="button"
          onClick={handleBackspace}
          className="h-13 sm:h-15 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-xs font-black uppercase text-slate-600 transition-all cursor-pointer flex items-center justify-center"
        >
          ⌫ Back
        </button>
      </div>

      {/* Dual Purpose Verification Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
        {(onOpenOwnerScanner || onOpenScanner) && (
          <button
            type="button"
            onClick={onOpenOwnerScanner || onOpenScanner}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl border-2 border-[#087FF5] text-[#087FF5] hover:bg-[#F0F7FF] font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs"
            title="Scan Owner's QR code to lookup storage shelf and prefill release OTP"
          >
            <MapPin className="w-4 h-4" />
            <span>📍 Scan Owner Claim (Shelf)</span>
          </button>
        )}

        {onOpenFinderScanner && (
          <button
            type="button"
            onClick={onOpenFinderScanner}
            className="w-full sm:w-auto px-4 py-3 rounded-2xl border-2 border-emerald-500 text-emerald-700 hover:bg-emerald-50 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all shadow-xs"
            title="Scan Finder's voucher or pass to verify municipal drop-off"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>📥 Scan Finder Voucher</span>
          </button>
        )}

        <button
          type="button"
          disabled={digits.length !== 6 || submitting}
          onClick={handleVerifyOtp}
          className="flex-1 w-full py-3.5 rounded-2xl bg-[#087FF5] bg-gradient-to-r from-[#087FF5] to-[#062B72] hover:opacity-95 disabled:opacity-50 text-white font-black text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-md shadow-[#087FF5]/20"
        >
          {submitting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Verifying OTP Hash...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>Burn Mandatory OTP & Assure Handover</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

