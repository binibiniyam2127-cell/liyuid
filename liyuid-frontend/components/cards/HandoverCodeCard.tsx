"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Clock, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HandoverCodeCardProps {
  initialCode?: string;
  onComplete?: () => void;
  onClose?: () => void;
}

export function HandoverCodeCard({
  initialCode = "8 4 9 2 0 1",
  onComplete,
  onClose,
}: HandoverCodeCardProps) {
  const [code, setCode] = useState(initialCode);
  const [secondsLeft, setSecondsLeft] = useState(600); // 10 minutes
  const [ownerConfirmed, setOwnerConfirmed] = useState(true);
  const [finderConfirmed, setFinderConfirmed] = useState(false);
  const [isReunited, setIsReunited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0 || isReunited) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft, isReunited]);

  const formatTimer = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const handleConfirm = () => {
    setLoading(true);
    setTimeout(() => {
      setFinderConfirmed(true);
      setOwnerConfirmed(true);
      setIsReunited(true);
      setLoading(false);
      onComplete?.();
    }, 600);
  };

  const handleRegenerate = () => {
    setSecondsLeft(600);
    const new6 = Math.floor(100000 + Math.random() * 900000).toString();
    setCode(new6.split("").join(" "));
  };

  if (isReunited) {
    return (
      <div className="bg-white dark:bg-slate-900 border-2 border-emerald-500/40 rounded-3xl p-8 sm:p-10 flex flex-col items-center text-center gap-5 shadow-lg animate-fadeIn">
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 flex items-center justify-center font-bold text-3xl shadow-inner border border-emerald-200 dark:border-emerald-800">
          🎉
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">
            Case Closed
          </span>
          <h2 className="text-2xl font-black text-slate-900 dark:text-white">
            🎉 Reunited!
          </h2>
          <p className="text-xs text-slate-500 max-w-sm leading-relaxed mt-1">
            Your item has been successfully recovered.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={onClose}
          className="!w-auto px-8 !min-h-[44px] text-xs font-bold mt-2"
        >
          Done
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border-2 border-blue-500/30 rounded-3xl p-6 sm:p-8 flex flex-col items-center text-center gap-6 shadow-md relative overflow-hidden">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shadow-inner border border-blue-200 dark:border-blue-800">
        <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Secure Handover
        </span>
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Your handover code
        </h3>
      </div>

      {/* 6-Digit Code Display */}
      <div className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-6 py-4 rounded-2xl shadow-inner">
        <span className="font-mono text-3xl sm:text-4xl font-black text-blue-600 tracking-[0.3em] select-all">
          {code}
        </span>
      </div>

      {/* Timer: 10:00 */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <Clock className="w-4 h-4 text-blue-600 animate-pulse" />
        <span>Valid for {formatTimer(secondsLeft)} ({secondsLeft > 0 ? "10:00 limit" : "Expired"})</span>
        {secondsLeft === 0 && (
          <button
            onClick={handleRegenerate}
            className="ml-2 text-blue-600 hover:underline font-bold flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" /> Regenerate
          </button>
        )}
      </div>

      {/* Dual Confirmation Checklist (Section 14) */}
      <div className="w-full bg-slate-50/70 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 flex flex-col gap-2.5 text-left">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Dual Mutual Confirmation
        </span>

        {/* Owner confirmation: "I have my item" */}
        <label className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={ownerConfirmed}
              onChange={(e) => setOwnerConfirmed(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              I have my item
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
            Owner Verified
          </span>
        </label>

        {/* Finder confirmation: "I handed it over" */}
        <label className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 cursor-pointer">
          <div className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={finderConfirmed}
              onChange={(e) => setFinderConfirmed(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 cursor-pointer"
            />
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
              I handed it over
            </span>
          </div>
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
            Finder Check
          </span>
        </label>
      </div>

      {/* Button: Confirm Handover */}
      <Button
        variant="primary"
        onClick={handleConfirm}
        loading={loading}
        className="w-full !min-h-[48px] text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20"
      >
        <CheckCircle2 className="w-4 h-4 mr-1.5" />
        Confirm Handover
      </Button>
    </div>
  );
}

