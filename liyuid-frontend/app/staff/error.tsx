"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, LayoutDashboard } from "lucide-react";

export default function StaffErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Staff portal runtime error:", error);
  }, [error]);

  return (
    <div className="min-h-[450px] flex items-center justify-center p-6 text-[#062B72]">
      <div className="bg-white border-2 border-rose-200 rounded-3xl p-8 max-w-lg w-full shadow-xl flex flex-col gap-4 text-center items-center">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-black text-[#062B72]">
            Staff Console Exception Guard
          </h2>
          <p className="text-xs text-[#64748B] mt-1 font-medium leading-relaxed">
            {error?.message || "A runtime exception occurred while rendering this module."}
          </p>
        </div>

        {error?.digest && (
          <div className="text-[10px] font-mono text-slate-400 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            Error Reference: {error.digest}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2.5 rounded-xl bg-[#087FF5] hover:bg-[#062B72] text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-[#087FF5]/20 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Action</span>
          </button>
          <Link
            href="/staff/dashboard"
            className="px-4 py-2.5 rounded-xl bg-[#F8FAFC] border-2 border-[#e2eaf4] hover:bg-slate-100 text-[#062B72] text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <LayoutDashboard className="w-3.5 h-3.5 text-[#087FF5]" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

