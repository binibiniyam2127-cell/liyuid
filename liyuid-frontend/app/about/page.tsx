"use client";

import React from "react";
import Link from "next/link";
import {
  Shield,
  MapPin,
  Cpu,
  Lock,
  ArrowRight,
  Globe,
  Building2,
  Sparkles,
  Users,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/lib/auth-context";

export default function AboutPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-[#0c2340] flex flex-col items-center selection:bg-[#00B9F2] selection:text-white font-sans">
      {/* HEADER */}
      <header className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <Logo size={36} showText={false} />
            <span className="text-xl font-black text-[#0c2340] tracking-wider leading-none">
              LIYUID
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-7">
            <Link
              href="/"
              className="text-sm font-semibold text-slate-600 hover:text-[#0c2340] transition-colors"
            >
              Home
            </Link>
            <Link
              href="/how-it-works"
              className="text-sm font-semibold text-slate-600 hover:text-[#0c2340] transition-colors"
            >
              How It Works
            </Link>
            <Link
              href="/about"
              className="relative text-sm font-bold text-[#0c2340] hover:text-[#0088ff] transition-colors"
            >
              <span>About</span>
              <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#0088ff] rounded-full" />
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                href="/home"
                className="px-4 py-2 rounded-full bg-[#0088ff] hover:bg-[#0077e6] text-white text-xs font-bold shadow-xs transition-colors"
              >
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-[#0088ff] transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 rounded-full bg-[#0088ff] hover:bg-[#0077e6] text-white text-xs font-bold shadow-xs transition-colors"
                >
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* HERO BANNER */}
      <section className="w-full bg-gradient-to-b from-blue-50/60 to-transparent py-14 px-4 sm:px-6 lg:px-8 border-b border-slate-200/60 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-[#0088ff] mb-4 shadow-2xs">
            <Building2 className="w-3.5 h-3.5" />
            <span>Mission & Problem Statement</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#0c2340] tracking-tight">
            About the LIYUID Platform
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            AI-Assisted Lost-and-Found Recovery with Privacy-Preserving Ownership Verification tailored for Addis Ababa and Ethiopia.
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-8">
        {/* Context & Problem Statement */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs">
          <div className="flex items-center gap-2.5 text-[#0088ff] font-bold text-sm mb-3">
            <MapPin className="w-5 h-5 shrink-0" />
            <span>Addis Ababa Context & Problem Statement</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#0c2340] tracking-tight mb-3">
            The Dilemma with Public Lost-and-Found Groups
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
            Across Addis Ababa and university campuses in Ethiopia, lost items are commonly reported on public Telegram channels, Facebook groups, or physical bulletin boards. These channels force citizens to broadcast their personal phone numbers, photos of national ID cards, and exact item images.
          </p>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            This public exposure causes frequent impersonation, fraudulent ownership claims, extortion, and harassment. LIYUID eliminates public feeds entirely. Items are indexed confidentially, compared mathematically through zero-knowledge AI embeddings, and reunited without exposing private personal details.
          </p>
        </div>

        {/* Core Architectural Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0088ff] mb-4">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0c2340] mb-2">
              Bilingual Multilingual AI
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Powered by Multilingual Sentence Transformers supporting English and Amharic semantic analysis, combined with spatial bounding filters across all 11 sub-cities of Addis Ababa.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-100 flex items-center justify-center text-[#00B9F2] mb-4">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0c2340] mb-2">
              Cryptographic Sealing & Decoys
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Sensitive identifiers (serial numbers, IDs, private marks) are encrypted with AES-GCM. Blind verification challenges test genuine ownership knowledge before any match is confirmed.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
              <EyeOff className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0c2340] mb-2">
              Zero Public Floating Photos
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Uploaded photos are strictly quarantined and redacted. No public gallery exists for scammers to harvest serial numbers, model names, or personal identities.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-4">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-[#0c2340] mb-2">
              Secure Mutual Handover
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              In-person handovers are completed using single-use 6-digit OTP codes expiring in 10 minutes, with mutual closure required from both finder and owner.
            </p>
          </div>
        </div>

        {/* Project Context */}
        <div className="border border-slate-200 bg-white rounded-3xl p-6 sm:p-8 text-center shadow-xs">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Research & Platform Scope
          </p>
          <h3 className="text-lg font-bold text-[#0c2340] mb-2">
            LIYUID Platform Specification
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
            Built as a next-generation civic technology platform designed to transform urban recovery, protect citizen privacy, and eliminate lost property fraud in Addis Ababa.
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            <Link
              href="/how-it-works"
              className="px-5 py-2.5 rounded-full bg-[#0088ff] hover:bg-[#0077e6] text-white font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>Explore How It Works</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="w-full border-t border-slate-200 bg-white py-8 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <Logo size={22} showText={false} />
            <span className="font-bold text-[#0c2340]">LIYUID Platform</span>
            <span>•</span>
            <span>Addis Ababa, Ethiopia</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <Link href="/" className="hover:text-[#0088ff] transition-colors">
              Home
            </Link>
            <Link href="/how-it-works" className="hover:text-[#0088ff] transition-colors">
              How It Works
            </Link>
            <Link href="/about" className="font-bold text-[#0088ff]">
              About
            </Link>
            <span className="text-slate-300">•</span>
            {isAuthenticated ? (
              <Link href="/home" className="hover:text-[#0088ff] font-bold text-[#0088ff]">
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className="hover:text-[#0088ff]">
                  Sign In
                </Link>
                <Link href="/register" className="hover:text-[#0088ff] font-bold text-[#0088ff]">
                  Create Account
                </Link>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
