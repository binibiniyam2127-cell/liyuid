"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import {
  Search,
  CheckCircle2,
  ShieldCheck,
  MapPin,
  ArrowRight,
  RefreshCw,
  Sparkles,
  MessageSquare,
  Lock,
  Cpu,
  Bell,
  X,
  AlertCircle,
  KeyRound,
} from "lucide-react";
import { useT } from "@/lib/locale-context";

interface MatchItem {
  id: string;
  itemTitleEn: string;
  itemTitleAm: string;
  role: "lost" | "found";
  categoryEn: string;
  categoryAm: string;
  brand: string;
  model: string;
  colorEn: string;
  colorAm: string;
  locationEn: string;
  locationAm: string;
  dateEn: string;
  dateAm: string;
  score: number;
  isVerified: boolean;
  systemCode: string;
}

const INITIAL_MATCHES: MatchItem[] = [];

export default function MatchesPage() {
  const router = useRouter();
  const { locale, dict } = useT();
  const [matches, setMatches] = useState<MatchItem[]>(INITIAL_MATCHES);

  useEffect(() => {
    let isMounted = true;
    const loadRealMatches = async () => {
      try {
        const myReports = await api.getMyReports();
        const allMatches: MatchItem[] = [];
        for (const rep of myReports) {
          if (rep.type === "lost") {
            try {
              const repMatches = await api.getMatches(rep.id);
              for (const m of repMatches) {
                allMatches.push({
                  id: m.match_id,
                  itemTitleEn: `${m.brand || ""} ${m.model || ""} ${m.category || "Item"}`.trim(),
                  itemTitleAm: `${m.brand || ""} ${m.model || ""} ${m.category || "እቃ"}`.trim(),
                  role: "lost",
                  categoryEn: (m.category || "General").replace("_", " "),
                  categoryAm: m.category || "ጠቅላላ",
                  brand: m.brand || "Standard",
                  model: m.model || "Item",
                  colorEn: m.primary_color || "Standard",
                  colorAm: m.primary_color || "መደበኛ",
                  locationEn: `${m.sub_city || "Addis Ababa Desk"}, Addis Ababa`,
                  locationAm: `${m.sub_city || "አዲስ አበባ"}፣ አዲስ አበባ`,
                  dateEn: new Date(m.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
                  dateAm: new Date(m.created_at).toLocaleDateString("am-ET", { month: "short", day: "numeric" }),
                  score: Math.round((m.composite_score || 0.88) * 100),
                  isVerified: m.is_verified || false,
                  systemCode: (m.match_id.replace(/\D/g, "") + "842190").slice(0, 6),
                });
              }
            } catch {
              // ignore
            }
          }
        }
        if (isMounted) setMatches(allMatches);
      } catch {
        if (isMounted) setMatches([]);
      }
    };
    loadRealMatches();
    return () => {
      isMounted = false;
    };
  }, []);
  const [activeTab, setActiveTab] = useState<"matches" | "radar">("matches");
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Verification Code Modal State
  const [verifyingItem, setVerifyingItem] = useState<MatchItem | null>(null);
  const [enteredCode, setEnteredCode] = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);
  const [simulatedAlert, setSimulatedAlert] = useState<{ title: string; code: string } | null>(null);

  // Trigger Confirmation Flow
  const handleStartConfirmation = (item: MatchItem) => {
    setVerifyingItem(item);
    setEnteredCode("");
    setCodeError(null);
    setResendSuccess(null);
  };

  const handleCloseModal = () => {
    setVerifyingItem(null);
    setEnteredCode("");
    setCodeError(null);
    setResendSuccess(null);
    setSimulatedAlert(null);
  };

  const handleResendCode = async () => {
    if (!verifyingItem) return;
    setIsResending(true);
    setCodeError(null);
    try {
      const res = await api.resendMatchCode(verifyingItem.id);
      setResendSuccess(
        res.message ||
          (locale === "am"
            ? "አዲስ ባለ 6-አሃዝ ኮድ ወደ ኢሜይልዎ/ቴሌግራምዎ ተልኳል!"
            : "A new 6-digit confirmation code has been dispatched to your email / Telegram!")
      );
      setTimeout(() => setResendSuccess(null), 6000);
    } catch (err: any) {
      setCodeError(
        err.message ||
          (locale === "am"
            ? "ኮድ እንደገና መላክ አልተቻለም። እባክዎ ትንሽ ቆይተው እንደገና ይሞክሩ።"
            : "Failed to resend code. Please try again shortly.")
      );
    } finally {
      setIsResending(false);
    }
  };

  // Submit code to backend
  const handleVerifyCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyingItem) return;

    const cleanInput = enteredCode.replace(/\s+/g, "");
    if (!cleanInput || cleanInput.length < 6) {
      setCodeError(dict.matchesPage.invalidCode);
      return;
    }

    setIsSubmittingCode(true);
    setCodeError(null);
    try {
      const res = await api.confirmMatchWithCode(verifyingItem.id, cleanInput);
      if (res.status === "verified" || res.is_verified) {
        setMatches((prev) =>
          prev.map((m) => (m.id === verifyingItem.id ? { ...m, isVerified: true } : m))
        );
        const matchId = verifyingItem.id;
        handleCloseModal();
        setSuccessBanner(
          locale === "am"
            ? "እቃው በተሳካ ሁኔታ ተረጋግጧል! ከአግኚው ጋር ሚስጥራዊ ውይይት በራስ-ሰር እየተከፈተ ነው..."
            : "Ownership confirmed! Automatically opening private chat with finder..."
        );
        setTimeout(() => {
          router.push(`/messages?match=${matchId}&verified=true`);
        }, 1100);
      } else {
        setCodeError(dict.matchesPage.invalidCode);
      }
    } catch (err: any) {
      setCodeError(err.message || dict.matchesPage.invalidCode);
    } finally {
      setIsSubmittingCode(false);
    }
  };

  const handleDismissMatch = (id: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 selection:bg-[#00B9F2] selection:text-white relative">
      {/* SIMULATED SYSTEM INCOMING ALERT BANNER */}
      {simulatedAlert && (
        <div className="p-4 rounded-2xl bg-[#062B72] text-white border border-[#00B9F2]/40 shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#087FF5] text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold block text-[#00B9F2]">
                {dict.matchesPage.codeModalAlert}
              </span>
              <span className="font-mono text-base font-black tracking-widest text-white">
                {simulatedAlert.code.slice(0, 3)} {simulatedAlert.code.slice(3)}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setEnteredCode(simulatedAlert.code)}
            className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all cursor-pointer"
          >
            {dict.matchesPage.autofillCode}
          </button>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-[#087FF5] text-[11px] font-bold tracking-wide uppercase mb-2">
            <Cpu className="w-3.5 h-3.5" />
            <span>{locale === "am" ? "የAI ራስ-ሰር ፈላጊ" : "AI Auto-Detection Engine"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#062B72] tracking-tight">
            {dict.matchesPage.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {dict.matchesPage.subtitle}
          </p>
        </div>

        {/* Ambient 24/7 Auto-Detection Status Indicator */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold shadow-xs self-start sm:self-auto">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span>{locale === "am" ? "ራስ-ሰር ፍተሻ ነቅቷል (24/7)" : "Auto-Detection Active (24/7)"}</span>
        </div>
      </div>

      {/* SUCCESS BANNER */}
      {successBanner && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-3 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-[#e2eaf4] pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("matches")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "matches"
              ? "bg-[#087FF5] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{dict.matchesPage.tabMatches}</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
              activeTab === "matches" ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
            }`}
          >
            {matches.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("radar")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === "radar"
              ? "bg-[#087FF5] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>{dict.matchesPage.tabRadar}</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      </div>

      {/* TAB 1: ACTIVE AUTO-MATCHES */}
      {activeTab === "matches" && (
        <div className="flex flex-col gap-4 animate-in fade-in">
          {matches.length === 0 ? (
            <div className="bg-white border border-[#e2eaf4] rounded-3xl p-10 text-center flex flex-col items-center justify-center gap-3 shadow-xs">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#087FF5] flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#062B72]">
                {locale === "am" ? "ምንም ንቁ ተዛማጅ የለም" : "No active matches yet"}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                {locale === "am"
                  ? "የሊዩይድ AI ራስ-ሰር ፈላጊ በመላው አዲስ አበባ አዳዲስ ሪፖርቶችን መፈተሹን ይቀጥላል።"
                  : "LIYUID's AI auto-detector is continuously monitoring submissions across Addis Ababa."}
              </p>
            </div>
          ) : (
            matches.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-[#e2eaf4] rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col gap-5 relative overflow-hidden"
              >
                {/* Top Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#062B72]/5 text-[#062B72] text-[11px] font-bold">
                        {locale === "am" ? item.categoryAm : item.categoryEn}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-[#087FF5]" />
                        <span>{locale === "am" ? item.locationAm : item.locationEn}</span>
                      </span>
                    </div>

                    <h2 className="text-lg sm:text-xl font-extrabold text-[#062B72]">
                      {locale === "am" ? item.itemTitleAm : item.itemTitleEn}
                    </h2>
                  </div>

                  {/* Confidence Pill & Status */}
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {dict.matchesPage.highConfidence}
                      </span>
                      <span className="text-sm font-black text-emerald-600 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                        <span>{item.score}% Match</span>
                      </span>
                    </div>

                    <div className="h-8 w-[1px] bg-slate-200 hidden sm:block" />

                    <div className="shrink-0">
                      {item.isVerified ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span>{dict.matchesPage.verificationPassed}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-[#087FF5] border border-blue-200 text-xs font-bold">
                          <Cpu className="w-3.5 h-3.5 text-[#087FF5]" />
                          <span>{dict.matchesPage.readyVerification}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Attributes Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#f8fbff] border border-[#e2eaf4] rounded-2xl p-4 text-xs">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      {locale === "am" ? "የእቃው ሞዴል" : "Model / Brand"}
                    </span>
                    <span className="font-bold text-[#062B72]">{item.model}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      {locale === "am" ? "ቀለም" : "Primary Color"}
                    </span>
                    <span className="font-bold text-[#062B72]">
                      {locale === "am" ? item.colorAm : item.colorEn}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      {locale === "am" ? "የተገኘበት አካባቢ" : "Found Area"}
                    </span>
                    <span className="font-bold text-[#062B72]">
                      {locale === "am" ? item.locationAm.split("፣")[0] : item.locationEn.split(",")[0]}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block">
                      {locale === "am" ? "ቀን" : "Timeline"}
                    </span>
                    <span className="font-bold text-[#062B72]">
                      {locale === "am" ? item.dateAm : item.dateEn}
                    </span>
                  </div>
                </div>

                {/* Shield Notice */}
                <div className="p-3.5 bg-slate-50 border border-slate-200/70 rounded-2xl flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#087FF5] mt-0.5 shrink-0" />
                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    {item.isVerified
                      ? (locale === "am"
                          ? "ግጥጥሞሹ ተረጋግጧል! የአግኚው ማንነት በደህንነት የተጠበቀ ነው። አሁን ሚስጥራዊ ውይይት መጀመር ወይም ደህንነቱ የተጠበቀ ርክክብ ማከናወን ይችላሉ።"
                          : "Match confirmed! Finder contact details remain shielded. You can now chat anonymously or proceed to secure handover.")
                      : (locale === "am"
                          ? "የሊዩይድ AI ራስ-ሰር ፈላጊ ይህንን እቃ በምድብ፣ በሞዴል እና በአካባቢ ከፍተኛ ተዛማጅነት አግኝቶታል። እቃው የእርስዎ ከሆነ ያረጋግጡ።"
                          : "LIYUID's AI auto-detector paired this report with high confidence based on category, model, and location. Confirm if this is your item.")}
                  </p>
                </div>

                {/* Card Actions */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => handleDismissMatch(item.id)}
                    className="text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    {dict.matchesPage.dismiss}
                  </button>

                  <div className="flex items-center gap-2.5">
                    {item.isVerified ? (
                      <>
                        <Link
                          href="/messages"
                          className="px-4 py-2.5 rounded-2xl bg-white border border-[#e2eaf4] hover:border-[#087FF5] text-xs font-bold text-[#062B72] hover:text-[#087FF5] transition-all flex items-center gap-2 shadow-xs"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#087FF5]" />
                          <span>{dict.matchesPage.startChat}</span>
                        </Link>
                        <Link
                          href="/handover"
                          className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center gap-2 transition-all cursor-pointer"
                        >
                          <span>{dict.matchesPage.proceedHandover}</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleStartConfirmation(item)}
                        className="px-5 py-2.5 rounded-2xl bg-[#087FF5] hover:bg-[#062B72] text-white text-xs font-bold shadow-md shadow-[#087FF5]/25 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{dict.matchesPage.confirmMatch}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: LIVE AI RADAR */}
      {activeTab === "radar" && (
        <div className="bg-white rounded-[32px] border border-[#e2eaf4] p-8 sm:p-10 shadow-xs flex flex-col items-center animate-in fade-in">
          <div className="relative w-36 h-36 flex items-center justify-center mb-6">
            <div className="absolute inset-0 rounded-full bg-[#00b4d8]/10 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-[#00b4d8]/20 to-[#0077b6]/10 border border-[#00b4d8]/30" />
            <div className="absolute inset-6 rounded-full bg-white shadow-sm flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-[#087FF5] text-white flex items-center justify-center shadow-lg shadow-[#087FF5]/30">
                <img
                  src="/images/logo-pin.png"
                  alt="LIYUID"
                  className="w-7 h-9 object-contain drop-shadow-sm brightness-110"
                />
              </div>
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-[#062B72] text-center">
            {dict.matchesPage.radarScanning}
          </h2>
          <p className="text-xs text-slate-500 mt-1 text-center max-w-md">
            {dict.matchesPage.radarSub}
          </p>
        </div>
      )}

      {/* CODE CONFIRMATION MODAL (System Sends Code -> User Returns Code) */}
      {verifyingItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-[32px] border border-[#e2eaf4] p-6 sm:p-8 max-w-md w-full shadow-2xl flex flex-col gap-5 animate-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-[#087FF5] flex items-center justify-center shrink-0">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#062B72]">
                    {dict.matchesPage.codeModalTitle}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {locale === "am" ? verifyingItem.itemTitleAm : verifyingItem.itemTitleEn}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-[#f8fbff] p-3.5 rounded-2xl border border-[#e2eaf4]">
              {dict.matchesPage.codeModalDesc}
            </p>

            <form onSubmit={handleVerifyCodeSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-[#062B72] block mb-1.5">
                  {dict.matchesPage.codeSentTo}
                </label>
                <input
                  type="text"
                  value={enteredCode}
                  onChange={(e) => setEnteredCode(e.target.value)}
                  placeholder="842 190"
                  maxLength={7}
                  autoFocus
                  className="w-full text-center font-mono text-2xl font-black tracking-widest px-4 py-3 rounded-2xl border border-slate-300 focus:border-[#087FF5] focus:outline-none focus:ring-2 focus:ring-[#087FF5]/20 bg-white"
                />
              </div>

              <div className="flex items-center justify-between text-xs px-1 -mt-1">
                <span className="text-slate-500">
                  {locale === "am" ? "ኮድ አልደረሰዎትም ወይም ጊዜው አልፏል?" : "Didn't receive code or expired?"}
                </span>
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={isResending}
                  className="font-bold text-[#087FF5] hover:text-[#062B72] hover:underline disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  {isResending ? (
                    <>
                      <RefreshCw className="w-3 h-3 animate-spin" />
                      <span>{locale === "am" ? "በመላክ ላይ..." : "Resending..."}</span>
                    </>
                  ) : (
                    <span>{locale === "am" ? "ኮድ በድጋሚ ላክ" : "Resend Code"}</span>
                  )}
                </button>
              </div>

              {resendSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{resendSuccess}</span>
                </div>
              )}

              {codeError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{codeError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  {dict.matchesPage.cancel}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCode}
                  className="px-5 py-2.5 rounded-2xl bg-[#087FF5] hover:bg-[#062B72] text-white text-xs font-bold shadow-md shadow-[#087FF5]/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingCode ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{locale === "am" ? "በማረጋገጥ ላይ..." : "Verifying..."}</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>{dict.matchesPage.verifyAndUnlock}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
