"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Lock, Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/locale-context";

export default function RegisterPage() {
  const { t } = useT();
  const { register } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordCriteria = [
    { id: "length", label: "At least 8 characters", met: password.length >= 8 },
    { id: "upper", label: "At least 1 uppercase letter (A-Z)", met: /[A-Z]/.test(password) },
    { id: "lower", label: "At least 1 lowercase letter (a-z)", met: /[a-z]/.test(password) },
    { id: "number", label: "At least 1 number (0-9)", met: /[0-9]/.test(password) },
    { id: "symbol", label: "At least 1 symbol (!@#$%...)", met: /[^A-Za-z0-9]/.test(password) },
  ];

  const metCount = passwordCriteria.filter((c) => c.met).length;
  const remainingCount = passwordCriteria.length - metCount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const nameParts = fullName.trim().split(/\s+/);
    if (!fullName.trim() || nameParts.length < 2) {
      setError("Please enter your 3-part name (Given name, Father's name, Grandfather's name)");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address");
      return;
    }
    if (!phone.trim()) {
      setError("Please enter your phone number");
      return;
    }

    // Format phone number to standard +251XXXXXXXXX
    let formattedPhone = phone.trim().replace(/[\s-]/g, "");
    if (formattedPhone.startsWith("09")) {
      formattedPhone = "+2519" + formattedPhone.slice(2);
    } else if (formattedPhone.startsWith("07")) {
      formattedPhone = "+2517" + formattedPhone.slice(2);
    } else if ((formattedPhone.startsWith("9") || formattedPhone.startsWith("7")) && formattedPhone.length === 9) {
      formattedPhone = "+251" + formattedPhone;
    } else if (!formattedPhone.startsWith("+")) {
      formattedPhone = "+251" + formattedPhone;
    }

    const phoneRegex = /^\+251[0-9]{9}$/;
    if (!phoneRegex.test(formattedPhone)) {
      setError("Please enter a valid phone number (e.g. +251 9... or 09...)");
      return;
    }

    if (remainingCount > 0) {
      setError(`Password must be strong (${remainingCount} requirement${remainingCount > 1 ? "s" : ""} remaining). Please satisfy all password criteria.`);
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await register({
        email: email.trim().toLowerCase(),
        display_name: fullName.trim(),
        phone_number: formattedPhone,
        password,
      });
      router.push("/verify");
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 overflow-hidden selection:bg-[#00B9F2] selection:text-white">
      {/* REAL ADDIS ABABA PHOTOGRAPH BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <img
          src="/images/addis-wallpaper.jpg"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              "https://wallpapercat.com/w/middle-retina/c/d/2/1571251-2048x1366-desktop-hd-addis-ababa-background-image.jpg";
          }}
          alt="Addis Ababa, Ethiopia"
          className="w-full h-full object-cover object-center select-none"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#062B72]/40 via-[#087FF5]/15 to-[#062B72]/70 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,43,114,0.30)_0%,rgba(6,43,114,0.60)_100%)] pointer-events-none" />
      </div>

      {/* CENTERED FROSTED GLASS REGISTER CARD */}
      <div className="relative z-10 w-full max-w-[440px] rounded-[24px] bg-white/90 backdrop-blur-xl border border-white/70 shadow-2xl shadow-[#062B72]/30 p-7 sm:p-8 text-[#062B72]">
        <div className="flex flex-col items-center text-center mb-5">
          <Link href="/" className="mb-2.5 transform hover:scale-105 transition-transform">
            <Logo size={46} showText={false} />
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-[#062B72]">
            Create your LIYUID account
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-1">
            Join the smart lost-and-found network in Addis Ababa.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed animate-in fade-in">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Full Name */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#062B72]">
                Full name
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Child, Father &amp; Grandfather</span>
            </div>
            <div className="relative">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent transition-all shadow-xs"
                required
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <User className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold text-[#062B72] mb-1">
              Email address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                autoComplete="off"
                className="w-full px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent transition-all shadow-xs"
                required
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Mail className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#062B72]">
                Phone number
              </label>
              <span className="text-[10px] text-slate-400 font-medium">+251 9... or 09...</span>
            </div>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+251 911 234 567"
                autoComplete="off"
                className="w-full px-4 py-2 rounded-xl bg-white border border-slate-200 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087FF5] focus:border-transparent transition-all shadow-xs"
                required
              />
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                <Phone className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#062B72]">
                Password
              </label>
              {password.length > 0 && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all ${
                    remainingCount === 0
                      ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                      : remainingCount <= 2
                      ? "bg-amber-100 text-amber-700 border border-amber-300"
                      : "bg-rose-100 text-rose-700 border border-rose-300"
                  }`}
                >
                  {remainingCount === 0 ? "Strong password (0 remaining)" : `${remainingCount} requirement${remainingCount > 1 ? "s" : ""} remaining`}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setPasswordFocused(true)}
                placeholder="Enter your password"
                autoComplete="new-password"
                className={`w-full px-4 py-2 rounded-xl bg-white border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-xs pr-11 ${
                  password.length > 0 && remainingCount === 0
                    ? "border-emerald-300 focus:ring-emerald-500"
                    : "border-slate-200 focus:ring-[#087FF5]"
                }`}
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

            {/* Live Strength Meter & Remaining Checklist */}
            {(password.length > 0 || passwordFocused) && (
              <div className="mt-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/90 transition-all">
                {/* 5-segment progress bar */}
                <div className="flex items-center gap-1.5 mb-2">
                  {[0, 1, 2, 3, 4].map((index) => {
                    const isFilled = index < metCount;
                    let barColor = "bg-slate-200";
                    if (isFilled) {
                      if (metCount <= 2) barColor = "bg-rose-500";
                      else if (metCount <= 4) barColor = "bg-amber-500";
                      else barColor = "bg-emerald-500";
                    }
                    return (
                      <div
                        key={index}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${barColor}`}
                      />
                    );
                  })}
                </div>

                {/* 5 Requirements Checklist */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {passwordCriteria.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-1.5 text-[11px] transition-colors"
                    >
                      {c.met ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 stroke-[3]" />
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-slate-300 flex items-center justify-center shrink-0">
                          <span className="w-1 h-1 rounded-full bg-slate-300" />
                        </div>
                      )}
                      <span
                        className={
                          c.met
                            ? "text-emerald-700 font-semibold"
                            : "text-slate-500 font-normal"
                        }
                      >
                        {c.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-[#062B72]">
                Confirm password
              </label>
              {confirmPassword.length > 0 && (
                <span
                  className={`text-[10px] font-bold ${
                    password === confirmPassword
                      ? "text-emerald-600"
                      : "text-rose-500"
                  }`}
                >
                  {password === confirmPassword ? "Passwords match" : "Does not match"}
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                autoComplete="new-password"
                className={`w-full px-4 py-2 rounded-xl bg-white border text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:border-transparent transition-all shadow-xs ${
                  confirmPassword.length > 0 && password === confirmPassword
                    ? "border-emerald-300 focus:ring-emerald-500"
                    : "border-slate-200 focus:ring-[#087FF5]"
                }`}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-full bg-gradient-to-r from-[#087FF5] to-[#00B9F2] hover:from-[#066ad1] hover:to-[#00a2d4] text-white font-bold text-sm shadow-lg shadow-[#087FF5]/25 flex items-center justify-center gap-2 transition-all transform active:scale-95 disabled:opacity-70 mt-2"
          >
            {loading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Create account</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-4 pt-3 border-t border-slate-200/80">
          <p className="text-xs text-slate-600 font-medium">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-[#087FF5] hover:text-[#066ad1] hover:underline ml-1"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
