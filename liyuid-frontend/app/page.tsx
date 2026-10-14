"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Shield,
  Cpu,
  Lock,
  CheckCircle2,
  ArrowRight,
  Globe,
  ChevronDown,
  ShieldCheck,
  EyeOff,
  UserCheck,
  Sparkles,
  Building2,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useT } from "@/lib/locale-context";
import { useAuth } from "@/lib/auth-context";

export default function WelcomePage() {
  const { locale, setLocale } = useT();
  const { isAuthenticated } = useAuth();
  const [langMenuOpen, setLangMenuOpen] = useState(false);

  const scrollToExplore = () => {
    document.getElementById("explore-section")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden selection:bg-[#00B9F2] selection:text-white font-sans bg-slate-50">
      {/* ========================================================
          HERO VIEWPORT (Full Screen Real Addis Ababa Background)
      ======================================================== */}
      <section className="relative min-h-screen w-full flex flex-col justify-between">
        {/* Real Addis Ababa Photography Background */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <img
            src="/images/addis-wallpaper.jpg"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                "https://wallpapercat.com/w/middle-retina/c/d/2/1571251-2048x1366-desktop-hd-addis-ababa-background-image.jpg";
            }}
            alt="Addis Ababa, Ethiopia"
            className="w-full h-full object-cover object-center select-none"
          />
          {/* Soft daylight blue sky gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-sky-400/20 via-sky-100/10 to-sky-700/15" />
          {/* Soft radial white glow behind center hero typography */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.78)_0%,rgba(255,255,255,0.35)_40%,transparent_70%)]" />
        </div>

        {/* HEADER */}
        <header className="relative z-30 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
          <div className="h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 group">
              <Logo size={38} showText={false} />
              <span className="text-2xl font-black text-[#0c2340] tracking-wider leading-none">
                LIYUID
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-7">
              <Link
                href="/"
                className="relative text-sm font-bold text-[#0c2340] hover:text-[#0088ff] transition-colors"
              >
                <span>Home</span>
                <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#0088ff] rounded-full" />
              </Link>
              <Link
                href="/how-it-works"
                className="text-sm font-semibold text-slate-600 hover:text-[#0c2340] transition-colors"
              >
                How It Works
              </Link>
              <Link
                href="/about"
                className="text-sm font-semibold text-slate-600 hover:text-[#0c2340] transition-colors"
              >
                About
              </Link>
            </nav>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/70 hover:bg-white/90 text-[#0c2340] text-xs font-bold border border-white/80 shadow-xs backdrop-blur-md transition-all cursor-pointer"
                >
                  <Globe className="w-3.5 h-3.5 text-[#0088ff]" />
                  <span>{locale === "en" ? "EN" : "አማ"}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {langMenuOpen && (
                  <div className="absolute right-0 mt-2 w-32 rounded-2xl bg-white/95 backdrop-blur-xl border border-white/80 shadow-2xl p-1.5 flex flex-col gap-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setLocale("en");
                        setLangMenuOpen(false);
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                        locale === "en"
                          ? "bg-[#0088ff]/10 text-[#0088ff]"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span>English</span>
                      {locale === "en" && <CheckCircle2 className="w-3.5 h-3.5 text-[#0088ff]" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLocale("am");
                        setLangMenuOpen(false);
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
                        locale === "am"
                          ? "bg-[#0088ff]/10 text-[#0088ff]"
                          : "text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <span>አማርኛ</span>
                      {locale === "am" && <CheckCircle2 className="w-3.5 h-3.5 text-[#0088ff]" />}
                    </button>
                  </div>
                )}
              </div>

              {isAuthenticated ? (
                <Link
                  href="/home"
                  className="px-5 py-2 rounded-full bg-[#0088ff] hover:bg-[#0077e6] text-white text-xs font-bold shadow-md shadow-[#0088ff]/25 flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
                >
                  <span>Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="px-5 py-2 rounded-full bg-[#0088ff] hover:bg-[#0077e6] text-white text-xs font-bold shadow-md shadow-[#0088ff]/25 flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
                >
                  <span>Sign in</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </header>

        {/* HERO CENTER CONTENT (Section 9 Specification) */}
        <section className="relative z-20 flex-1 flex flex-col items-center justify-center text-center px-4 py-8 lg:py-14 my-auto">
          <div className="relative max-w-xl mx-auto flex flex-col items-center z-20">
            <div className="mb-3 transform hover:scale-105 transition-transform duration-300">
              <Logo size={80} showText={false} />
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-[#0c2340] tracking-tight mb-2">
              LIYUID
            </h1>

            <div className="flex items-center gap-2 text-sm sm:text-base font-extrabold text-[#0c2340] tracking-wide mb-3">
              <span>Lost</span>
              <span className="text-[#00B9F2] font-black">•</span>
              <span>Found</span>
              <span className="text-[#00B9F2] font-black">•</span>
              <span>Reunited</span>
            </div>

            <p className="text-sm sm:text-base text-slate-700 font-medium max-w-md mx-auto leading-relaxed mb-6">
              AI-powered private lost-and-found
            </p>

            <div className="flex items-center gap-3.5">
              <Link
                href={isAuthenticated ? "/home" : "/register"}
                className="px-6 py-2.5 rounded-full bg-[#0088ff] hover:bg-[#0077e6] text-white text-xs font-bold shadow-md shadow-[#0088ff]/25 flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
              >
                <span>{isAuthenticated ? "Go to Dashboard" : "Get Started"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={scrollToExplore}
                className="px-5 py-2.5 rounded-full bg-white/75 hover:bg-white/95 text-[#0c2340] text-xs font-bold border border-white/80 shadow-xs backdrop-blur-md transition-all cursor-pointer flex items-center gap-1"
              >
                <span>Explore</span>
                <span className="text-[#0088ff]">↓</span>
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================
            HERO BOTTOM FEATURE BAR (Clean, Color-free Frosted Glass)
        ======================================================== */}
        <div className="relative z-30 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-5">
          <div className="rounded-3xl sm:rounded-full bg-white/80 backdrop-blur-xl border border-white/90 shadow-xl shadow-sky-950/10 px-5 sm:px-8 py-3.5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              {/* Feature 1: Privacy Protected */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/90 text-[#0c2340] border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                  <Shield className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#0c2340] leading-tight">
                    Privacy Protected
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-snug mt-0.5">
                    Private information stays private.
                  </p>
                </div>
              </div>

              {/* Feature 2: AI-Powered Matching */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/90 text-[#0c2340] border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                  <Cpu className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#0c2340] leading-tight">
                    AI-Powered Matching
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-snug mt-0.5">
                    Find meaningful matches faster.
                  </p>
                </div>
              </div>

              {/* Feature 3: Private Verification */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/90 text-[#0c2340] border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                  <Lock className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#0c2340] leading-tight">
                    Private Verification
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-snug mt-0.5">
                    Ownership is verified without exposing secrets.
                  </p>
                </div>
              </div>

              {/* Feature 4: Secure Handover */}
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-white/90 text-[#0c2340] border border-slate-200/80 flex items-center justify-center shrink-0 shadow-2xs">
                  <ShieldCheck className="w-4 h-4 stroke-[2.2]" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#0c2340] leading-tight">
                    Secure Handover
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium leading-snug mt-0.5">
                    Controlled confirmation for safer reunions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Scroll to explore button */}
          <div className="text-center mt-3">
            <button
              type="button"
              onClick={scrollToExplore}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-[#0088ff] transition-colors cursor-pointer bg-white/60 hover:bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/80 shadow-xs"
            >
              <span>Scroll to explore</span>
              <span className="animate-bounce">↓</span>
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================
          EXPLORATION SECTION (Detailed Platform Description Below)
      ======================================================== */}
      <section id="explore-section" className="relative z-20 w-full bg-white border-t border-slate-200/80 py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-20">
          {/* Header Introduction */}
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-xs font-bold text-[#0c2340] mb-4">
              <Building2 className="w-3.5 h-3.5 text-[#0088ff]" />
              <span>Addis Ababa Smart Recovery Infrastructure</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-[#0c2340] tracking-tight">
              Safer, Private Item Reunions in Addis Ababa
            </h2>
            <p className="text-base text-slate-600 mt-4 leading-relaxed font-normal">
              Traditional lost-and-found groups expose personal phone numbers, photos, and item details to everyone online. LIYUID replaces public exposure with an intelligent two-sided privacy architecture designed specifically for Addis Ababa.
            </p>
          </div>

          {/* 3-Step Lifecycle Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="p-8 rounded-3xl bg-[#f8fbff] border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-[#0088ff] text-base mb-6 shadow-xs">
                  01
                </div>
                <h3 className="text-lg font-black text-[#0c2340] tracking-tight">
                  Report With Privacy
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Log your item with public general details (brand, category, sub-city) and separate private verification attributes (serial numbers, hidden scratches, secret stickers).
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center gap-2 text-xs font-bold text-[#0088ff]">
                <span>Shielded from public view</span>
                <Shield className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-8 rounded-3xl bg-[#f8fbff] border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-[#0088ff] text-base mb-6 shadow-xs">
                  02
                </div>
                <h3 className="text-lg font-black text-[#0c2340] tracking-tight">
                  Blind Two-Sided Matching
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Our dual-blind matching algorithm compares hidden details without revealing them to either party. Neither the finder nor public users can guess or claim without matching secrets.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center gap-2 text-xs font-bold text-[#0088ff]">
                <span>Zero-knowledge evaluation</span>
                <Cpu className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-8 rounded-3xl bg-[#f8fbff] border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center font-black text-[#0088ff] text-base mb-6 shadow-xs">
                  03
                </div>
                <h3 className="text-lg font-black text-[#0c2340] tracking-tight">
                  Secure OTP Handover
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                  Once ownership is verified, a single-use 6-digit code is generated. Safe handover can occur at designated verification checkpoints across Bole, Kirkos, Arada, and campus hubs.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center gap-2 text-xs font-bold text-[#0088ff]">
                <span>Single-use 10-min code</span>
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
          </div>

          {/* Core Privacy & Architecture Features */}
          <div className="rounded-3xl bg-[#0c2340] text-white p-8 sm:p-12 shadow-xl">
            <div className="max-w-2xl mb-10">
              <span className="text-[11px] font-black uppercase tracking-widest text-[#00B9F2] block mb-1">
                Privacy-First Engineering
              </span>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
                Designed to Prevent Fraud, Extortion & False Claims
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-2 leading-relaxed">
                Every component of LIYUID is hardened against social engineering, dishonest claim attempts, and privacy leakage.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <EyeOff className="w-6 h-6 text-[#00B9F2] mb-3" />
                <h4 className="text-sm font-bold text-white mb-1">No Public Photos</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  User item photos stay encrypted and are never visible on public feeds.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <UserCheck className="w-6 h-6 text-[#00B9F2] mb-3" />
                <h4 className="text-sm font-bold text-white mb-1">Anonymous Chat</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Direct communication without revealing phone numbers or social profiles.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <Lock className="w-6 h-6 text-[#00B9F2] mb-3" />
                <h4 className="text-sm font-bold text-white mb-1">Anti-Scam Guard</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Verification questions must be answered correctly before item release.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
                <Sparkles className="w-6 h-6 text-[#00B9F2] mb-3" />
                <h4 className="text-sm font-bold text-white mb-1">City Network</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Connected across all 11 Addis Ababa sub-cities and campus stations.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions Footer Strip (Strictly Adheres to Section 10 Footer Rule) */}
          <div className="pt-10 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-2">
              <Logo size={24} showText={false} />
              <span className="font-bold text-[#0c2340]">LIYUID Platform</span>
              <span>•</span>
              <span>Addis Ababa, Ethiopia</span>
            </div>

            <div className="flex items-center gap-6">
              {isAuthenticated ? (
                <Link
                  href="/home"
                  className="hover:text-[#0088ff] transition-colors font-bold text-[#0088ff] flex items-center gap-1.5"
                >
                  <span>Go to Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <>
                  <Link href="/login" className="hover:text-[#0088ff] transition-colors font-medium">
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="hover:text-[#0088ff] transition-colors font-bold text-[#0088ff] flex items-center gap-1.5"
                  >
                    <span>Create Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
