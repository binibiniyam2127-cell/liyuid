"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, Mail, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/locale-context";

export default function LoginPage() {
  const { t } = useT();
  const { login } = useAuth();
  const router = useRouter();

  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!emailOrPhone.trim()) {
      setError("Please enter your email or phone number");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setLoading(true);
    try {
      await login(emailOrPhone.trim(), password);
      router.push("/home");
    } catch (err: any) {
      setError(err?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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

      {/* CENTERED FROSTED GLASS AUTHENTICATION CARD */}
      <div className="relative z-10 w-full max-w-[420px] rounded-[24px] bg-white/90 backdrop-blur-xl border border-white/70 shadow-2xl shadow-[#062B72]/30 p-8 sm:p-9 text-[#062B72]">
        <div className="flex flex-col items-center text-center mb-6">
          <Link href="/" className="mb-3 transform hover:scale-105 transition-transform">
            <Logo size={48} showText={false} />
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-[#062B72]">
            Welcome back
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Sign in to your LIYUID account.
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed animate-in fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#062B72] mb-1.5">
              Email or phone number
            </label>
            <div className="relative">
              <input
                type="text"
                value={emailOrPhone}
                onChange={(e) => setEmailOrPhone(e.target.value)}
                placeholder="Enter your email address or phone number"
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent transition-all shadow-xs"
                required
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Mail className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#062B72] mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent transition-all shadow-xs pr-11"
                required
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

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded text-[#087FF5] focus:ring-[#087FF5] border-slate-300"
              />
              <span>Remember me</span>
            </label>

            <Link
              href="/forgot-password"
              className="text-xs font-bold text-[#087FF5] hover:text-[#066ad1] hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 rounded-full bg-gradient-to-r from-[#087FF5] to-[#00B9F2] hover:from-[#066ad1] hover:to-[#00a2d4] text-white font-bold text-sm shadow-lg shadow-[#087FF5]/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-70 mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Log in</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-6 pt-5 border-t border-slate-200/80">
          <p className="text-xs text-slate-600 font-medium">
            Don't have an account?{" "}
            <Link
              href="/signup"
              className="font-bold text-[#087FF5] hover:text-[#066ad1] hover:underline ml-1"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
