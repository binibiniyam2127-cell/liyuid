"use client";

import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  EyeOff,
  UserCheck,
  MessageSquare,
  Sparkles,
  Cpu,
  Shield,
  Layers,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/lib/auth-context";

export default function HowItWorksPage() {
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
              className="relative text-sm font-bold text-[#0c2340] hover:text-[#0088ff] transition-colors"
            >
              <span>How It Works</span>
              <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 bg-[#0088ff] rounded-full" />
            </Link>
            <Link
              href="/about"
              className="text-sm font-semibold text-slate-600 hover:text-[#0c2340] transition-colors"
            >
              About
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
            <Layers className="w-3.5 h-3.5" />
            <span>Architecture & Privacy Specification</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-[#0c2340] tracking-tight">
            How Blind Verification Works
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            A 4-stage privacy-first protocol that unites genuine item owners and finders across Addis Ababa without exposing personal identities.
          </p>
        </div>
      </section>

      {/* 4-STAGE LIFECYCLE */}
      <main className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-12 flex flex-col gap-8">
        <div className="flex flex-col gap-6">
          {/* Stage 1 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 text-[#0088ff] flex items-center justify-center font-black text-xl shrink-0">
              01
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-[#0088ff]" />
                <h2 className="text-lg font-bold text-[#0c2340]">Ingestion & Sealing Private Details</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                When you report an item, you describe general visible attributes (color, brand, category, sub-city). Crucially, you provide <b>private verification evidence</b> (such as an exact IMEI, student ID last 4 digits, or a hidden mark). This private evidence is immediately AES-GCM encrypted and never published to any feed.
              </p>
            </div>
          </div>

          {/* Stage 2 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 border border-sky-100 text-[#00B9F2] flex items-center justify-center font-black text-xl shrink-0">
              02
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Cpu className="w-4 h-4 text-[#00B9F2]" />
                <h2 className="text-lg font-bold text-[#0c2340]">Two-Stage Hybrid AI Retrieval</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                <b>Stage 1:</b> Blocks candidates by category, spatial bounding radius across all 11 sub-cities of Addis Ababa (Bole, Arada, Kirkos, etc.), and a temporal window. <br />
                <b>Stage 2:</b> Executes Multilingual Sentence Transformer embeddings to score semantic similarity in English and Amharic without exposing underlying descriptions.
              </p>
            </div>
          </div>

          {/* Stage 3 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center font-black text-xl shrink-0">
              03
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Lock className="w-4 h-4 text-amber-600" />
                <h2 className="text-lg font-bold text-[#0c2340]">4-Layer Zero-Clue Ownership Verification</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                To eliminate fraud and social engineering, LIYUID enforces an infallible zero-clue protocol: zero quizzes or hints. Verification is authenticated across 4 layers: pre-registered cryptographic serial/IMEI hashes, dual-blind unmentioned trait tokens, physical hardware unlocking at the desk, and strict 2-strike anti-brute-force lockout.
              </p>
            </div>
          </div>

          {/* Stage 4 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row gap-6 shadow-xs hover:shadow-md transition-shadow">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center font-black text-xl shrink-0">
              04
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h2 className="text-lg font-bold text-[#0c2340]">Controlled Handover & Dual Confirmation</h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
                Only after verification passes and the finder accepts the request does an anonymous chat open. When meeting in person, the owner presents a dynamic 6-digit OTP code (valid for 10 minutes). When both parties confirm, the case closes and sensitive records are permanently archived.
              </p>
            </div>
          </div>
        </div>

        {/* CTA CARD */}
        <div className="mt-6 rounded-3xl bg-[#0c2340] text-white p-8 sm:p-10 text-center flex flex-col items-center gap-4 shadow-xl">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-[#00B9F2]">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">Ready to report an item?</h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-md">
            Whether you lost a wallet in Bole or found keys in Arada, LIYUID safeguards your identity from start to finish.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Link
              href="/register"
              className="px-6 py-3 rounded-full bg-[#0088ff] hover:bg-[#0077e6] text-white font-bold text-xs shadow-md transition-colors flex items-center gap-1.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/about"
              className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-colors"
            >
              Learn About LIYUID
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
            <Link href="/how-it-works" className="font-bold text-[#0088ff]">
              How It Works
            </Link>
            <Link href="/about" className="hover:text-[#0088ff] transition-colors">
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
