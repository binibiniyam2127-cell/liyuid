"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  KeyRound,
  Lock,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { api } from "@/lib/api";

export default function StaffLoginPage() {
  const router = useRouter();
  const [staffCode, setStaffCode] = useState("");
  const [password, setPassword] = useState("");
  const [totpCode, setTotpCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!staffCode.trim() || !password || !totpCode.trim()) {
      setError("All fields including the 2FA TOTP code are required.");
      return;
    }

    if (totpCode.trim().length !== 6) {
      setError("TOTP authenticator code must be exactly 6 digits.");
      return;
    }

    setLoading(true);
    try {
      await api.staffLogin({
        staff_code: staffCode.trim(),
        password,
        totp_code: totpCode.trim(),
      });
      router.push("/staff/dashboard");
    } catch (err: any) {
      setError(err?.message || "Invalid staff credentials or TOTP code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#f4f8fc] flex flex-col items-center justify-center p-4 sm:p-6 text-[#062B72]">
      {/* Back to public site */}
      <div className="w-full max-w-[460px] mb-4">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#087FF5] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Public Portal</span>
        </Link>
      </div>

      {/* Main White Card */}
      <div className="w-full max-w-[460px] bg-white border border-[#e2eaf4] rounded-3xl shadow-xl shadow-[#062B72]/5 p-7 sm:p-9 flex flex-col gap-6">
        {/* Header with Logo */}
        <div className="flex flex-col items-center text-center">
          <Link href="/" className="mb-3 transform hover:scale-105 transition-transform">
            <Logo size={48} showText={true} />
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0f7ff] border border-[#d0e6fc] text-[11px] font-extrabold text-[#087FF5] uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Staff & Moderation Portal</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-[#062B72] tracking-tight">
            Supervisor Sign In
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Two-Factor Authentication (2FA) is enforced for all staff operations.
          </p>
        </div>



        {/* Error Notice */}
        {error && (
          <div
            className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed animate-in fade-in"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Staff ID Code */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#062B72]">
              Staff Identification Code
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="e.g. STF-01"
                value={staffCode}
                onChange={(e) => setStaffCode(e.target.value)}
                autoComplete="username"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#dce6f2] text-xs font-bold text-[#062B72] placeholder:text-slate-400 focus:outline-none focus:border-[#087FF5] focus:ring-2 focus:ring-[#087FF5]/15 transition-all shadow-xs"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <KeyRound className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-[#062B72]">
              Staff Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#dce6f2] text-xs font-bold text-[#062B72] placeholder:text-slate-400 focus:outline-none focus:border-[#087FF5] focus:ring-2 focus:ring-[#087FF5]/15 transition-all shadow-xs pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* TOTP 2FA */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#062B72]">
                2FA TOTP Code
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                Google Authenticator
              </span>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="000000"
                value={totpCode}
                maxLength={6}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ""))}
                required
                className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#dce6f2] text-xs font-bold text-[#062B72] tracking-widest placeholder:text-slate-400 placeholder:tracking-normal focus:outline-none focus:border-[#087FF5] focus:ring-2 focus:ring-[#087FF5]/15 transition-all shadow-xs"
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Lock className="w-4 h-4" />
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">
              Enter the 6-digit verification code from your authenticator app.
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-6 rounded-2xl bg-[#087FF5] hover:bg-[#062B72] text-white font-bold text-xs shadow-md shadow-[#087FF5]/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-70 cursor-pointer"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Authenticate Staff Session</span>
              </>
            )}
          </button>
        </form>

        {/* Compliance Footer */}
        <div className="pt-3 border-t border-[#e2eaf4] flex items-center justify-center gap-1.5 text-[11px] text-slate-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Encrypted with SHA-256 & Argon2</span>
        </div>
      </div>
    </div>
  );
}
