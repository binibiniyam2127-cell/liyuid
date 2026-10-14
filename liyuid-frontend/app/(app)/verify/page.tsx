"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, RefreshCw, KeyRound, CheckCircle2, Mail, Info } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";

export default function VerifyPage() {
  const router = useRouter();
  const { user, refreshUser } = useAuth();
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [countdown, setCountdown] = useState(45);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [showSmtpInfo, setShowSmtpInfo] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleChange = (index: number, val: string) => {
    if (!/^\d*$/.test(val)) return;
    const newOtp = [...otp];
    newOtp[index] = val.slice(-1);
    setOtp(newOtp);

    if (val && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length < 6) {
      setError("Please enter the complete 6-digit verification code");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await api.verifyOtp(code);
      if (refreshUser) {
        await refreshUser();
      }
      router.push("/home");
    } catch (err: any) {
      setError(err?.message || "Invalid verification code. Please enter the code sent to your email.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setResending(true);
    setError(null);
    try {
      await api.sendOtp();
      setInfoMessage("A new verification code has been dispatched to your email.");
      setCountdown(45);
    } catch (err: any) {
      setError(err?.message || "Failed to resend code. Please try again.");
    } finally {
      setResending(false);
    }
  };

  const targetEmail = user?.email || "your registered email";

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden selection:bg-[#00B9F2] selection:text-white">
      {/* REAL ADDIS ABABA PHOTOGRAPH BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="https://wallpapercat.com/w/middle-retina/c/d/2/1571251-2048x1366-desktop-hd-addis-ababa-background-image.jpg"
          onError={(e) => {
            (e.target as HTMLImageElement).src = "/images/addis-wallpaper.jpg";
          }}
          alt="Addis Ababa, Ethiopia"
          className="w-full h-full object-cover object-center select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#062B72]/40 via-[#087FF5]/15 to-[#062B72]/70 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,43,114,0.30)_0%,rgba(6,43,114,0.60)_100%)] pointer-events-none" />
      </div>

      {/* CENTERED FROSTED GLASS VERIFY CARD */}
      <div className="relative z-10 w-full max-w-[450px] rounded-[24px] bg-white/90 backdrop-blur-xl border border-white/70 shadow-2xl shadow-[#062B72]/30 p-7 sm:p-8 text-[#062B72]">
        <div className="flex flex-col items-center text-center mb-5">
          <Link href="/" className="mb-2.5 transform hover:scale-105 transition-transform">
            <Logo size={46} showText={false} />
          </Link>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#087FF5] text-xs font-bold mb-2">
            <Mail className="w-3.5 h-3.5" />
            <span>Email Verification</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-[#062B72]">
            Verify your email
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
            Enter the 6-digit code sent to <span className="font-bold text-[#062B72]">{targetEmail}</span>
          </p>
        </div>

        {/* LIVE EMAIL DISPATCH NOTICE */}
        <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#062B72]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <Mail className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                  Real Email Dispatched
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  Check your inbox for your 6-digit code
                </span>
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-600 mt-2 font-medium leading-relaxed">
            A real verification email with your 6-digit code has been delivered. Please check your inbox (and spam folder) and enter the code below.
          </p>
        </div>

        {infoMessage && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold leading-relaxed flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{infoMessage}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed animate-in fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleVerify} className="space-y-5">
          <div className="flex justify-between gap-2">
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className="w-11 sm:w-12 h-13 sm:h-14 rounded-2xl bg-white border-2 border-slate-200 text-center text-xl font-bold text-[#062B72] focus:border-[#087FF5] focus:ring-2 focus:ring-[#087FF5]/20 focus:outline-none shadow-xs transition-all"
              />
            ))}
          </div>

          <div className="text-center">
            {countdown > 0 ? (
              <p className="text-xs text-slate-500 font-medium">
                Resend code in <span className="font-bold text-[#087FF5]">00:{countdown.toString().padStart(2, "0")}</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#087FF5] hover:text-[#066ad1] hover:underline transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                <span>Resend verification code</span>
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#087FF5] to-[#00B9F2] hover:from-[#066ad1] hover:to-[#00a2d4] text-white font-bold text-sm shadow-lg shadow-[#087FF5]/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-70"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Verify Email</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-200/80 text-center flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={() => setShowSmtpInfo(!showSmtpInfo)}
            className="text-[11px] font-semibold text-slate-500 hover:text-[#087FF5] transition-colors inline-flex items-center gap-1"
          >
            <Info className="w-3.5 h-3.5" />
            <span>How to receive real emails in Gmail?</span>
          </button>

          {showSmtpInfo && (
            <div className="w-full text-left p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1.5 mt-1">
              <p className="font-bold text-[#062B72]">Configure Real SMTP Email Dispatch:</p>
              <p>Add these environment variables to <code className="text-[#087FF5] font-mono">docker-compose.yml</code> backend service:</p>
              <ul className="list-disc list-inside font-mono text-[10px] space-y-0.5 text-slate-700 bg-white p-2 rounded-lg border border-slate-200">
                <li>SMTP_HOST=smtp.gmail.com</li>
                <li>SMTP_PORT=587</li>
                <li>SMTP_USER=your_email@gmail.com</li>
                <li>SMTP_PASSWORD=your_gmail_app_password</li>
              </ul>
              <p className="text-[10px] text-slate-400">Once added, the system automatically sends real emails to your Gmail inbox!</p>
            </div>
          )}

          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-[#087FF5] transition-colors mt-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to login</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
