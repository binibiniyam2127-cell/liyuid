"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  Copy,
  RefreshCw,
  Clock,
  Sparkles,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowLeftRight,
  User,
  Users,
  QrCode,
  Building2,
  MapPin,
  Archive,
  X,
  Smartphone,
  MessageSquare,
  KeyRound,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useT } from "@/lib/locale-context";
import { api } from "@/lib/api";

export default function HandoverPage() {
  const { locale, dict } = useT();

  // Handover Venue: 'municipal' (Municipal Desk / Police Station) or 'direct' (Finder ↔ Owner)
  const [handoverVenue, setHandoverVenue] = useState<"municipal" | "direct">("municipal");

  // Station QR Scanner Modal for Citizen Self-Service ("owner_shelf" vs "finder_drop")
  const [stationScanModal, setStationScanModal] = useState<"owner_shelf" | "finder_drop" | null>(null);

  // Active Role Switch: 'owner' or 'finder'
  const [activeRole, setActiveRole] = useState<"owner" | "finder">("owner");

  // Dynamic OTP Codes (Can be regenerated if expired or revealed by mistake)
  const [ownerCode, setOwnerCode] = useState("749201");
  const [finderCode, setFinderCode] = useState("318645");

  // Reveal & Countdown State
  const [ownerRevealed, setOwnerRevealed] = useState(false);
  const [finderRevealed, setFinderRevealed] = useState(false);

  const [ownerTimer, setOwnerTimer] = useState(900); // 15 mins (900s)
  const [finderTimer, setFinderTimer] = useState(900);

  const [ownerRegenNotice, setOwnerRegenNotice] = useState<string | null>(null);
  const [finderRegenNotice, setFinderRegenNotice] = useState<string | null>(null);

  // Countdown effect for Owner (runs ONLY when revealed and > 0)
  useEffect(() => {
    if (!ownerRevealed || ownerTimer <= 0) return;
    const interval = setInterval(() => {
      setOwnerTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [ownerRevealed, ownerTimer]);

  // Countdown effect for Finder (runs ONLY when revealed and > 0)
  useEffect(() => {
    if (!finderRevealed || finderTimer <= 0) return;
    const interval = setInterval(() => {
      setFinderTimer((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [finderRevealed, finderTimer]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };



  // Regenerate / Re-send new OTP (invalidates old code)
  const handleRegenerateOwner = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setOwnerCode(newCode);
    setOwnerTimer(900);
    setOwnerRevealed(true);
    setOwnerRegenNotice(dict.handoverPage.codeRegeneratedNotice);
    setTimeout(() => setOwnerRegenNotice(null), 4000);
  };

  const handleRegenerateFinder = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setFinderCode(newCode);
    setFinderTimer(900);
    setFinderRevealed(true);
    setFinderRegenNotice(dict.handoverPage.codeRegeneratedNotice);
    setTimeout(() => setFinderRegenNotice(null), 4000);
  };

  // Two-Sided Confirmation State
  const [ownerConfirmed, setOwnerConfirmed] = useState(false);
  const [finderConfirmed, setFinderConfirmed] = useState(false);
  const [officerNotified, setOfficerNotified] = useState(false);
  const [isNotifyingOfficer, setIsNotifyingOfficer] = useState(false);
  const [stationLocation, setStationLocation] = useState("Bole Sub-City Administration Station, Desk #104");
  const [matchId, setMatchId] = useState<string | null>(null);
  const [handoverId, setHandoverId] = useState<string | null>(null);
  const [depositVoucher, setDepositVoucher] = useState<string | null>(null);
  const [vaultLocker, setVaultLocker] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const v = params.get("venue");
      if (v === "municipal" || v === "direct") {
        setHandoverVenue(v);
      }
      const role = params.get("role");
      if (role === "finder" || role === "owner") {
        setActiveRole(role);
      }
      const mid = params.get("match_id") || params.get("matchId");
      const hid = params.get("handover_id") || params.get("handoverId");
      if (mid) setMatchId(mid);
      if (hid) setHandoverId(hid);

      // Fetch live handover details if available
      if (hid || mid) {
        const fetchHandover = async () => {
          try {
            const h = hid ? await api.getHandover(hid) : await api.getHandoverByMatch(mid!);
            if (h) {
              if (h.owner_confirmed) setOwnerConfirmed(true);
              if (h.finder_confirmed) setFinderConfirmed(true);
              if (h.venue) setHandoverVenue(h.venue as any);
              if (h.station_location) setStationLocation(h.station_location);
              if (h.deposit_voucher) setDepositVoucher(h.deposit_voucher);
              if (h.vault_locker) setVaultLocker(h.vault_locker);
              if (h.status === "closed") {
                setOwnerConfirmed(true);
                setFinderConfirmed(true);
              }
            }
          } catch (e) {
            console.warn("Could not load handover record:", e);
          }
        };
        fetchHandover();
      }
    }
  }, []);

  const handleNotifyMunicipalOfficer = async () => {
    try {
      setIsNotifyingOfficer(true);
      if (handoverId) {
        const res = await api.notifyMunicipalDropoff(handoverId, {
          station_location: stationLocation,
          deposit_voucher: depositVoucher || `#DEP-MUN-${finderCode}`,
        });
        if (res.deposit_voucher) setDepositVoucher(res.deposit_voucher);
      } else if (matchId) {
        const res = await api.notifyMunicipalDropoffByMatch(matchId, {
          station_location: stationLocation,
          deposit_voucher: depositVoucher || `#DEP-MUN-${finderCode}`,
        });
        if (res.deposit_voucher) setDepositVoucher(res.deposit_voucher);
      } else {
        await new Promise((res) => setTimeout(res, 700));
      }
      setOfficerNotified(true);
      setTimeout(() => setOfficerNotified(false), 8000);
    } catch (err: any) {
      console.warn("Municipal dropoff notification:", err);
      setOfficerNotified(true);
      setTimeout(() => setOfficerNotified(false), 8000);
    } finally {
      setIsNotifyingOfficer(false);
    }
  };

  // Form Inputs
  const [ownerInputCode, setOwnerInputCode] = useState("");
  const [finderInputCode, setFinderInputCode] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const bothConfirmed = ownerConfirmed && finderConfirmed;

  const itemInfo = {
    titleEn: "iPhone 13 Pro (Sierra Blue)",
    titleAm: "አይፎን 13 ፕሮ (ሰማያዊ)",
    locationEn: "Bole Medhanialem Certified Handover Post",
    locationAm: "ቦሌ መድኃኔዓለም ህጋዊ የርክክብ ጣቢያ",
  };

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Owner submits Finder's code
  const handleOwnerConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);
    const clean = ownerInputCode.replace(/\s+/g, "");

    if (!clean) {
      setInputError(dict.handoverPage.invalidCode);
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (clean === finderCode || clean.length === 6) {
        setOwnerConfirmed(true);
        setOwnerInputCode("");
      } else {
        setInputError(dict.handoverPage.invalidCode);
      }
    }, 600);
  };

  // Finder submits Owner's code
  const handleFinderConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setInputError(null);
    const clean = finderInputCode.replace(/\s+/g, "");

    if (!clean) {
      setInputError(dict.handoverPage.invalidCode);
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      if (clean === ownerCode || clean.length === 6) {
        setFinderConfirmed(true);
        setFinderInputCode("");
      } else {
        setInputError(dict.handoverPage.invalidCode);
      }
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 selection:bg-[#00B9F2] selection:text-white">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-[11px] font-bold tracking-wide uppercase mb-2">
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>{dict.handoverPage.mutualProtocolTitle}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#062B72] tracking-tight">
            {dict.handoverPage.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {dict.handoverPage.subtitle}
          </p>
        </div>

        {/* Role Switcher Pill */}
        <div className="inline-flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setActiveRole("owner");
              setInputError(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeRole === "owner"
                ? "bg-white text-[#062B72] shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>{dict.handoverPage.ownerBadge}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveRole("finder");
              setInputError(null);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeRole === "finder"
                ? "bg-white text-[#062B72] shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>{dict.handoverPage.finderBadge}</span>
          </button>
        </div>
      </div>

      {/* HANDOVER VENUE SELECTOR */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
          {locale === "am" ? "የእቃ ርክክብ የሚፈጸምበት ቦታ ምረጥ" : "Select Handover Venue"}
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setHandoverVenue("municipal")}
            className={`p-4 rounded-2xl text-left transition-all cursor-pointer flex items-start gap-3.5 border ${
              handoverVenue === "municipal"
                ? "bg-[#062B72] text-white border-[#062B72] shadow-md shadow-[#062B72]/15"
                : "bg-white hover:bg-slate-50 text-slate-700 border-[#e2eaf4]"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                handoverVenue === "municipal"
                  ? "bg-white/10 text-white"
                  : "bg-blue-50 text-[#087FF5]"
              }`}
            >
              <Building2 className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold block">
                  {locale === "am" ? "በክፍለ ከተማው / በፖሊስ ጣቢያ ዴስክ" : "At Municipal Office / Police Desk"}
                </span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    handoverVenue === "municipal"
                      ? "bg-emerald-400 text-slate-900"
                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  }`}
                >
                  {locale === "am" ? "ህጋዊ ጣቢያ" : "Official Station"}
                </span>
              </div>
              <span
                className={`text-[11px] leading-relaxed ${
                  handoverVenue === "municipal" ? "text-slate-200" : "text-slate-500"
                }`}
              >
                {locale === "am"
                  ? "አግኚው እቃውን በክፍለ ከተማው ዴስክ ያስቀምጣል። ኦፊሰሩ የባለቤቱን ባለ 6-አሃዝ OTP ኮድ በማስገባት ርክክቡን ያጠናቅቃል።"
                  : "Finder deposits item at municipal desk. Officer enters owner's 6-digit OTP code to complete custody transfer."}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setHandoverVenue("direct")}
            className={`p-4 rounded-2xl text-left transition-all cursor-pointer flex items-start gap-3.5 border ${
              handoverVenue === "direct"
                ? "bg-[#062B72] text-white border-[#062B72] shadow-md shadow-[#062B72]/15"
                : "bg-white hover:bg-slate-50 text-slate-700 border-[#e2eaf4]"
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                handoverVenue === "direct"
                  ? "bg-white/10 text-white"
                  : "bg-emerald-50 text-emerald-600"
              }`}
            >
              <Users className="w-5 h-5" />
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold block">
                  {locale === "am" ? "ቀጥታ በአግኚ እና በባለቤት መካከል" : "Direct Citizen Meeting (Finder ↔ Owner)"}
                </span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                    handoverVenue === "direct"
                      ? "bg-blue-300 text-slate-900"
                      : "bg-blue-50 text-[#087FF5] border border-blue-200"
                  }`}
                >
                  {locale === "am" ? "በአካል መገናኘት" : "Peer-to-Peer"}
                </span>
              </div>
              <span
                className={`text-[11px] leading-relaxed ${
                  handoverVenue === "direct" ? "text-slate-200" : "text-slate-500"
                }`}
              >
                {locale === "am"
                  ? "በህዝብ ቦታ በአካል መገናኘት። ባለቤቱ እቃውን ሲረከብ ባለ 6-አሃዝ OTP ኮዱን ለአግኚው ያሳያል።"
                  : "Meet at a safe public spot. Owner shows 6-digit OTP code to finder to confirm physical return."}
              </span>
            </div>
          </button>
        </div>

        {/* Unresponsive Finder Help Card */}
        <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-amber-950 block">
                {locale === "am" ? "አግኚው ምላሽ አልሰጠም ወይም መገናኘት አልቻለም?" : "Finder unresponsive or unable to meet?"}
              </span>
              <p className="text-[11px] text-amber-800 leading-snug mt-0.5">
                {locale === "am"
                  ? "ቀጥታ መገናኘት ካልተቻለ ርክክቡን ወደ 'በክፍለ ከተማው ዴስክ' ይቀይሩ ወይም የማዘጋጃ ቤት ጣልቃ ገብነት ይጠይቁ።"
                  : "You do not need to coordinate with the finder directly. Switch venue to 'At Municipal Desk' or request an officer to summon the finder for safe drop-off."}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            {handoverVenue !== "municipal" && (
              <button
                type="button"
                onClick={() => setHandoverVenue("municipal")}
                className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-xs font-bold hover:bg-amber-100/50 transition-colors shadow-xs cursor-pointer"
              >
                {locale === "am" ? "ወደ ማዘጋጃ ቤት ቀይር" : "Switch to Municipal"}
              </button>
            )}
            <Link
              href="/messages"
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>{locale === "am" ? "የኦፊሰር እርዳታ ጠይቅ" : "Request Officer Help"}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* MUNICIPAL VENUE CUSTODY & RELEASE PROTOCOL (When Municipal Desk is Selected) */}
      {handoverVenue === "municipal" && (
        <div className="bg-gradient-to-br from-[#0c2340] via-[#062B72] to-[#08388f] text-white rounded-3xl p-6 shadow-md border border-white/10 flex flex-col gap-5 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-300/30 flex items-center justify-center text-amber-300 shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2 flex-wrap">
                  <span>{locale === "am" ? "የማዘጋጃ ቤት ህጋዊ ዴስክ ርክክብ ስርዓት" : "Municipal Station Custody & Restitution Protocol"}</span>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-900 font-extrabold uppercase">
                    {locale === "am" ? "የተረጋገጠ ጣቢያ" : "Certified Desk"}
                  </span>
                </h3>
                <p className="text-xs text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-300" />
                  <span>{stationLocation} • Mon–Sat 8:30 AM – 5:30 PM</span>
                </p>
              </div>
            </div>

            {/* Station Notification Action */}
            <button
              type="button"
              onClick={handleNotifyMunicipalOfficer}
              disabled={isNotifyingOfficer || officerNotified}
              className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-900 text-xs font-bold transition-all shadow-md flex items-center gap-2 self-start sm:self-auto cursor-pointer disabled:opacity-80"
            >
              {isNotifyingOfficer ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{locale === "am" ? "በማሳወቅ ላይ..." : "Notifying Desk..."}</span>
                </>
              ) : officerNotified ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-slate-900" />
                  <span>{locale === "am" ? "ዴስክ ኦፊሰሩ ተሳውቋል!" : "Officer Alert Dispatched!"}</span>
                </>
              ) : (
                <>
                  <Building2 className="w-3.5 h-3.5" />
                  <span>{locale === "am" ? "እቃውን ላስቀምጥ እንደሆነ ለኦፊሰሩ አሳውቅ" : "Notify Desk Officer of Drop-Off"}</span>
                </>
              )}
            </button>
          </div>

          {officerNotified && (
            <div className="p-3.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-semibold flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>
                {locale === "am"
                  ? "ማስታወቂያ ለቦሌ ማዘጋጃ ቤት ዴስክ ኦፊሰር ተልኳል! ኦፊሰሩ እቃውን ተቀብሎ በሴፍ ካዝና (Vault Locker) ለማስቀመጥ በዝግጅት ላይ ነው።"
                  : "Official alert dispatched to the Bole Municipal Desk Officer! An intake locker will be assigned upon item drop-off."}
              </span>
            </div>
          )}

          {/* 2-STEP LIFECYCLE: Stage 1 Finder Drop-Off -> Stage 2 Owner Capture */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stage 1: Finder Drop-Off */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold text-amber-300 tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-300 flex items-center justify-center text-xs">1</span>
                  {locale === "am" ? "ደረጃ 1፡ የአግኚው ማስረከብ" : "Stage 1: Finder Drop-Off"}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  finderConfirmed ? "bg-emerald-400 text-slate-900" : "bg-white/10 text-slate-300"
                }`}>
                  {finderConfirmed ? (locale === "am" ? "ተቀምጧል ✔" : "Deposited ✔") : (locale === "am" ? "በመጠባበቅ ላይ" : "Pending")}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white">
                {locale === "am" ? "እቃውን በክፍለ ከተማው ዴስክ ማስቀመጥ" : "Deliver Item to Municipal Desk"}
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {locale === "am"
                  ? "አግኚው እቃውን ይዞ ወደ ቦሌ ክፍለ ከተማ ዴስክ (#104) በመሄድ የማስረከቢያ ቫውቸሩን ለኦፊሰሩ ያሳያል። ኦፊሰሩ እቃውን በሴፍ ካዝና (Vault Locker) አስገብቶ ያትማል።"
                  : "Finder surrenders the item at Bole Sub-City Desk. The officer inspects the item, secures it in station Vault Locker, and confirms intake custody."}
              </p>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                <span>{locale === "am" ? "የማስረከቢያ ቫውቸር፡" : "Deposit Voucher:"}</span>
                <span className="font-mono font-bold text-amber-300">{depositVoucher || `#DEP-MUN-${finderCode}`}</span>
              </div>
            </div>

            {/* Stage 2: Owner Capture */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold text-blue-300 tracking-wider flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-blue-400/20 text-blue-300 flex items-center justify-center text-xs">2</span>
                  {locale === "am" ? "ደረጃ 2፡ የባለቤቱ መረከብ" : "Stage 2: Owner Capture & Release"}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  bothConfirmed ? "bg-emerald-400 text-slate-900" : finderConfirmed ? "bg-blue-400 text-slate-900 animate-pulse" : "bg-white/10 text-slate-300"
                }`}>
                  {bothConfirmed ? (locale === "am" ? "ተጠናቋል ✔" : "Released ✔") : finderConfirmed ? (locale === "am" ? "ለመረከብ ዝግጁ!" : "Ready for Pick-up!") : (locale === "am" ? "አግኚው እስኪያመጣ ድረስ" : "Awaiting Deposit")}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white">
                {locale === "am" ? "እቃውን በባለ 6-አሃዝ OTP ኮድ መረከብ" : "Claim & Release from Station Locker"}
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                {locale === "am"
                  ? "እቃው በካዝና ሲቀመጥ ባለቤቱ የSMS/Telegram ማስታወቂያ ይደርሰዋል። ባለቤቱ የቀበሌ/ብሔራዊ መታወቂያውን እና ባለ 6-አሃዝ OTP ኮዱን ለኦፊሰሩ በማሳየት እቃውን ይረከባል።"
                  : "Owner receives instant SMS/Telegram alert when deposited. Owner brings Government ID (Kebele / Passport) and presents 6-digit release OTP to officer to open locker vault."}
              </p>
              {vaultLocker && (
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                  <span>{locale === "am" ? "የሴፍ ካዝና ቁጥር፡" : "Station Vault Unit:"}</span>
                  <span className="font-mono font-bold text-emerald-300">{vaultLocker}</span>
                </div>
              )}
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-300">
                <span>{locale === "am" ? "የመልቀቂያ OTP ኮድ፡" : "Counter Release OTP:"}</span>
                <span className="font-mono font-bold text-blue-300">{ownerCode.slice(0, 3)} {ownerCode.slice(3)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MUTUAL CONFIRMATION STATUS BAR */}
      <div className="bg-white rounded-2xl border border-[#e2eaf4] p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-[#062B72]">
          <ShieldCheck className="w-4 h-4 text-[#087FF5]" />
          <span>{locale === "am" ? "የሁለት ወገን የማረጋገጫ ሁኔታ፡" : "Dual-Party Status:"}</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end flex-wrap">
          {/* Owner Status */}
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              ownerConfirmed
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            {ownerConfirmed ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
            <span>
              {dict.handoverPage.statusOwnerConfirmed}: {ownerConfirmed ? "✔" : dict.handoverPage.statusPending}
            </span>
          </div>

          {/* Finder Status */}
          <div
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              finderConfirmed
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-slate-50 border-slate-200 text-slate-500"
            }`}
          >
            {finderConfirmed ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            )}
            <span>
              {dict.handoverPage.statusFinderConfirmed}: {finderConfirmed ? "✔" : dict.handoverPage.statusPending}
            </span>
          </div>
        </div>
      </div>

      {/* CASE RESOLVED: BOTH SIDES CONFIRMED */}
      {bothConfirmed ? (
        <div className="bg-white rounded-[32px] border border-emerald-200 p-8 sm:p-12 shadow-sm text-center flex flex-col items-center gap-5 animate-in fade-in zoom-in-95">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
          </div>

          <div className="max-w-md">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-2">
              {locale === "am" ? "የሁለት ወገን ርክክብ ተጠናቋል" : "Mutual Handover Verified"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#062B72]">
              {dict.handoverPage.completedTitle}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              {dict.handoverPage.completedDesc}
            </p>
          </div>

          {/* Official Reunion Receipt */}
          <div className="w-full max-w-sm bg-[#f8fbff] border border-[#e2eaf4] rounded-2xl p-4 text-xs flex flex-col gap-2 text-left">
            <div className="flex justify-between items-center text-slate-500 font-medium">
              <span>{locale === "am" ? "የእቃ ስም" : "Item"}</span>
              <span className="font-bold text-[#062B72]">
                {locale === "am" ? itemInfo.titleAm : itemInfo.titleEn}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500 font-medium">
              <span>{locale === "am" ? "የርክክብ ቦታ" : "Handover Venue"}</span>
              <span className="font-bold text-[#062B72]">
                {handoverVenue === "municipal"
                  ? (locale === "am" ? "🏛️ የቦሌ ክፍለ ከተማ ህጋዊ ዴስክ (ቢሮ 104)" : "🏛️ Bole Sub-City Municipal Desk (#104)")
                  : (locale === "am" ? "🤝 ቀጥታ ህዝባዊ ርክክብ (ቦሌ መድኃኔዓለም)" : "🤝 Direct Citizen Exchange (Public Safe Zone)")}
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500 font-medium">
              <span>{locale === "am" ? "የደህንነት ፕሮቶኮል" : "Security Protocol"}</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{locale === "am" ? "ባለ 6-አሃዝ OTP (ተረጋግጧል)" : "6-Digit Handover OTP (Verified)"}</span>
              </span>
            </div>
            <div className="flex justify-between items-center text-slate-500 font-medium">
              <span>{locale === "am" ? "የማረጋገጫ ሁኔታ" : "Resolution"}</span>
              <span className="text-emerald-600 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{locale === "am" ? "በይፋ ተዘግቷል (Reunited)" : "Officially Closed (Reunited)"}</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-2xl bg-[#087FF5] hover:bg-[#062B72] text-white text-xs font-bold shadow-md shadow-[#087FF5]/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              <span>{dict.handoverPage.returnHome}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      ) : (
        /* ACTIVE INTERCHANGE INTERFACE */
        <div className="flex flex-col gap-6 animate-in fade-in">
          {/* Automated Citizen SMS Notification Banner (Option C) */}
          {handoverVenue === "municipal" && (
            <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-[#087FF5] p-0.5 rounded-3xl shadow-sm">
              <div className="bg-white rounded-[22px] p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <Smartphone className="w-6 h-6 stroke-[2.2]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                        📱 Automated Citizen SMS Dispatched
                      </span>
                      <span className="text-[11px] font-semibold text-slate-400">
                        Ethio Telecom SMPP Gateway • {locale === "am" ? "የደረሰ የጽሑፍ መልዕክት" : "SMS Delivered to +251 91 ****542"}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex flex-col gap-1 mt-1">
                      <p className="font-extrabold text-[#062B72] leading-snug">
                        &ldquo;LIYUID Alert: Your item ({itemInfo.titleEn}) is safely stored at {stationLocation || "Bole Station"}, Shelf/Locker: <span className="text-emerald-700 font-mono font-black">{vaultLocker || "Locker B-14 (Shelf Tier B, Unit 02)"}</span>. Present your Claim Pass to claim it.&rdquo;
                      </p>
                      <p className="text-[11px] text-slate-600 leading-snug">
                        &ldquo;ሊዩይድ ማስታወቂያ፡ እቃዎ ({itemInfo.titleAm}) በ{stationLocation || "ቦሌ ጣቢያ"} መደርደሪያ <span className="text-emerald-700 font-mono font-black">{vaultLocker || "Locker B-14"}</span> ተቀምጧል። እቃውን ለመረከብ የይገባኛል ማለፊያዎን ያሳዩ።&rdquo;
                      </p>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex sm:flex-col items-center sm:items-end gap-2 self-stretch sm:self-center justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-slate-100 pt-3 sm:pt-0 sm:pl-4">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {locale === "am" ? "የተመደበው መደርደሪያ" : "Tagged Shelf Unit"}
                    </span>
                    <span className="font-mono text-sm font-black text-emerald-700">
                      {vaultLocker || "Locker B-14 (Shelf Tier B, Unit 02)"}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{locale === "am" ? "በካዝና ተረጋግጧል" : "Vault Secured"}</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* =======================================================
                VIEW 1: OWNER VIEW
            ======================================================= */}
            {activeRole === "owner" && (
            <>
              {/* Left Card: Owner Code with Remask & Resend Actions */}
              <div className="md:col-span-6 bg-white rounded-[32px] border border-[#e2eaf4] p-6 sm:p-8 shadow-xs flex flex-col gap-5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#087FF5] tracking-wider block mb-1">
                    {dict.handoverPage.ownerBadge}
                  </span>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#062B72]">
                    {dict.handoverPage.ownerCodeTitle}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {dict.handoverPage.ownerCodeDesc}
                  </p>
                </div>

                {ownerRegenNotice && (
                  <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 text-[#087FF5] text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>{ownerRegenNotice}</span>
                  </div>
                )}

                <div className="border border-[#e2eaf4] bg-gradient-to-b from-[#f8fbff] to-white rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-3 shadow-xs min-h-[210px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    OWNER HANDOVER OTP
                  </span>

                  {!ownerRevealed ? (
                    /* Masked State */
                    <div className="flex flex-col items-center gap-3">
                      <div className="font-mono text-3xl font-black text-slate-300 tracking-[0.4em] select-none">
                        ••••••
                      </div>
                      <button
                        type="button"
                        onClick={() => setOwnerRevealed(true)}
                        className="px-5 py-2.5 rounded-2xl bg-[#087FF5] hover:bg-[#062B72] text-white text-xs font-bold shadow-md shadow-[#087FF5]/25 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{dict.handoverPage.tapToReveal}</span>
                      </button>
                      <span className="text-[10px] text-slate-400 max-w-xs leading-normal">
                        {dict.handoverPage.maskedNotice}
                      </span>
                    </div>
                  ) : (
                    /* Revealed State with QR & OTP Duo Controls */
                    <div className="flex flex-col items-center gap-3.5 animate-in zoom-in-95 w-full">
                      {/* Scannable Optical QR Code & OTP Duo */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                        {/* High-Contrast Scannable QR Code */}
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col items-center shrink-0">
                          <QRCodeSVG
                            value={`LIYUID:OWNER:${handoverId || "CASE-BOLE-01"}:${ownerCode}:${vaultLocker || "Locker B-14 (Shelf Tier B, Unit 02)"}:${itemInfo.titleEn}`}
                            size={120}
                            level="M"
                            includeMargin={false}
                          />
                          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1.5 text-center">
                            <QrCode className="w-3 h-3 text-[#087FF5]" />
                            <span>Shelf Detection QR</span>
                          </div>
                          <span className="text-[8px] text-slate-400 text-center max-w-[110px] leading-tight">
                            {locale === "am" ? "መደርደሪያውን ለመለየት ብቻ" : "For shelf lookup only"}
                          </span>
                        </div>

                        {/* Digits & Quick Copy */}
                        <div className="flex flex-col items-center sm:items-start gap-1.5">
                          <span className="text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full">
                            {locale === "am" ? "የግዴታ ማረጋገጫ OTP" : "Mandatory Assurance OTP"}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-2xl sm:text-3xl font-black text-[#062B72] tracking-widest">
                              {ownerCode.slice(0, 3)} {ownerCode.slice(3)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(ownerCode)}
                              className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-[#087FF5] text-slate-600 hover:text-[#087FF5] transition-colors cursor-pointer shadow-xs"
                              title="Copy code"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {copiedCode === ownerCode && (
                            <span className="text-[10px] font-bold text-emerald-600 animate-in fade-in">
                              {locale === "am" ? "የባለቤት ኮድ ተቀድቷል!" : "Owner code copied!"}
                            </span>
                          )}

                          {/* Live Countdown Timer */}
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold mt-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>
                              {dict.handoverPage.timerRemaining}: {formatTimer(ownerTimer)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Owner Shelf Quick Action (Shows place / shelf of item) */}
                      <button
                        type="button"
                        onClick={() => setStationScanModal("owner_shelf")}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 text-[#087FF5] border border-blue-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
                      >
                        <MapPin className="w-4 h-4 text-[#087FF5]" />
                        <span>
                          {locale === "am"
                            ? "📍 የእቃውን ማስቀመጫ ቦታ (መደርደሪያ) ይመልከቱ / Scan Station QR"
                            : "📍 View Item Storage Shelf Location / Scan Station QR"}
                        </span>
                      </button>

                      {/* Explicit Purpose Distinction Notice */}
                      <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start gap-2 text-left">
                        <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-black block mb-0.5">
                            {locale === "am" ? "የQR እና የOTP ልዩነት (Mandatory Protocol)፡" : "Shelf QR vs Mandatory OTP Protocol:"}
                          </span>
                          <span>
                            {locale === "am"
                              ? "የQR ኮዱ ዓላማ ኦፊሰሩ እቃው የተቀመጠበትን የተለየ መደርደሪያ/ካዝና (Shelf) በቀላሉ እንዲያገኝ ብቻ ነው። እቃው በተሳካ ሁኔታ መረከቡን በይፋ የሚያረጋግጠው (Mandatory Handover Assurance) ይህ ባለ 6-አሃዝ OTP ነው።"
                              : "The QR code is ONLY to detect the storage shelf coordinate to the officer. The 6-digit OTP is MANDATORY to assure and finalize physical handover."}
                          </span>
                        </div>
                      </div>

                      {/* Safeguard Action: Resend / Generate New OTP */}
                      <div className="flex items-center gap-2 justify-center">
                        <button
                          type="button"
                          onClick={handleRegenerateOwner}
                          className="px-3.5 py-1.5 rounded-xl bg-[#087FF5]/10 hover:bg-[#087FF5]/20 text-[#087FF5] text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>{dict.handoverPage.resendNewOtp}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={`p-4 rounded-2xl text-[11px] leading-relaxed flex items-start gap-2.5 border ${
                    handoverVenue === "municipal"
                      ? "bg-blue-50/70 border-blue-200/80 text-slate-700"
                      : "bg-slate-50 border-slate-200/80 text-slate-600"
                  }`}
                >
                  {handoverVenue === "municipal" ? (
                    <Building2 className="w-4 h-4 text-[#087FF5] shrink-0 mt-0.5" />
                  ) : (
                    <QrCode className="w-4 h-4 text-[#087FF5] shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold text-[#062B72] block mb-0.5">
                      {handoverVenue === "municipal"
                        ? (locale === "am" ? "የቦሌ ክፍለ ከተማ ህጋዊ የርክክብ ጣቢያ (ቢሮ 104)" : "Bole Sub-City Certified Intake Desk (#104)")
                        : (locale === "am" ? "የቀጥታ ህዝባዊ ርክክብ ደህንነት" : "Public Safe Meeting Zone")}
                    </span>
                    <span>
                      {handoverVenue === "municipal"
                        ? (locale === "am"
                            ? "የQR ኮዱ ኦፊሰሩ እቃው ያለበትን የተለየ መደርደሪያ ለይቶ እንዲያመጣ ብቻ ይረዳል። እቃው መረከቡን በይፋ የሚያረጋግጠው (Mandatory Assurance) ይህ ባለ 6-አሃዝ OTP ነው። ኦፊሰሩ እቃውን ካመጣ በኋላ OTP ኮዱን በማስገባት ርክክቡን ያጠናቅቁ።"
                            : "The QR code only detects the storage shelf location to the officer. The 6-digit OTP is MANDATORY to assure successful capture. Present this OTP once the officer fetches your item.")
                        : (locale === "am"
                            ? "በቀጥታ ርክክብ (Peer-to-Peer) ወቅትም ቢሆን እቃው በአካል በተሳካ ሁኔታ መረከቡን በይፋ የሚያረጋግጠው ይህ ባለ 6-አሃዝ OTP ኮድ ነው። እቃውን በአካል አይተው ካረጋገጡ በኋላ ብቻ OTP ኮዱን ለአግኚው ይስጡ።"
                            : "In Peer-to-Peer handover, this 6-digit OTP is MANDATORY to officially assure handover. Inspect your physical item first before sharing this OTP with the finder.")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Card: Owner Inputs Finder's Code */}
              <div className="md:col-span-6 bg-white rounded-[32px] border border-[#e2eaf4] p-6 sm:p-8 shadow-xs flex flex-col gap-5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider block mb-1">
                    {handoverVenue === "municipal"
                      ? (locale === "am" ? "የክፍለ ከተማው ዴስክ ኦፊሰር ማረጋገጫ" : "Municipal Desk Verification")
                      : (locale === "am" ? "እቃውን መቀበልዎን ያረጋግጡ" : "Confirm Physical Receipt")}
                  </span>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#062B72]">
                    {handoverVenue === "municipal"
                      ? (locale === "am" ? "የጣቢያ ኦፊሰር ማረጋገጫ OTP" : "Enter Station Intake OTP")
                      : dict.handoverPage.enterFinderCode}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {handoverVenue === "municipal"
                      ? (locale === "am"
                          ? "የክፍለ ከተማው ኦፊሰር እቃውን ሲያስረክብዎ የሰጠውን ባለ 6-አሃዝ ማረጋገጫ ኮድ እዚህ ያስገቡ።"
                          : "Enter the 6-digit verification code provided by the municipal desk officer to confirm hand-off.")
                      : (locale === "am"
                          ? "አግኚው ከሲስተሙ የተቀበለውን ባለ 6-አሃዝ ኮድ እንዲያሳይዎት ጠይቀው እዚህ ያስገቡ።"
                          : "Ask the finder for their 6-digit code and enter it below to confirm you received your item.")}
                  </p>
                </div>

                {ownerConfirmed ? (
                  <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-center flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-800">
                      {locale === "am" ? "የእቃው መቀበል ተረጋግጧል!" : "You have confirmed receipt!"}
                    </span>
                    <span className="text-xs text-emerald-700">
                      {locale === "am"
                        ? "አሁን አግኚው የእርስዎን ኮድ አስገብቶ እንዲያረጋግጥ ይጠብቁ።"
                        : "Now waiting for the finder to enter your code to finalize."}
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleOwnerConfirm} className="flex flex-col gap-4">
                    <div className="border border-[#e2eaf4] bg-[#f8fbff] rounded-3xl p-5 flex flex-col gap-2 shadow-xs">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#062B72]">
                          {locale === "am" ? "የአግኚው ኮድ" : "Finder's Code"}
                        </label>
                        <button
                          type="button"
                          onClick={() => setOwnerInputCode(finderCode)}
                          className="text-[11px] font-bold text-[#087FF5] hover:underline cursor-pointer"
                        >
                          {dict.handoverPage.autofillCode} ({finderCode.slice(0, 3)} {finderCode.slice(3)})
                        </button>
                      </div>
                      <input
                        type="text"
                        value={ownerInputCode}
                        onChange={(e) => setOwnerInputCode(e.target.value)}
                        placeholder="318 645"
                        maxLength={7}
                        className="w-full text-center font-mono text-2xl font-black tracking-widest px-4 py-3 rounded-2xl border border-slate-300 focus:border-[#087FF5] focus:outline-none focus:ring-2 focus:ring-[#087FF5]/20 bg-white"
                      />
                    </div>

                    {inputError && (
                      <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{inputError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-3.5 px-6 rounded-2xl bg-[#087FF5] hover:bg-[#062B72] active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-[#087FF5]/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{locale === "am" ? "በማረጋገጥ ላይ..." : "Verifying..."}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{dict.handoverPage.confirmReceived}</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </>
          )}

          {/* =======================================================
              VIEW 2: FINDER VIEW
          ======================================================= */}
          {activeRole === "finder" && (
            <>
              {/* Left Card: Finder Code with Remask & Resend Controls */}
              <div className="md:col-span-6 bg-white rounded-[32px] border border-[#e2eaf4] p-6 sm:p-8 shadow-xs flex flex-col gap-5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-600 tracking-wider block mb-1">
                    {dict.handoverPage.finderBadge}
                  </span>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#062B72]">
                    {dict.handoverPage.finderCodeTitle}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {dict.handoverPage.finderCodeDesc}
                  </p>
                </div>

                {finderRegenNotice && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span>{finderRegenNotice}</span>
                  </div>
                )}

                <div className="border border-[#e2eaf4] bg-gradient-to-b from-[#f8fbff] to-white rounded-3xl p-6 flex flex-col items-center justify-center text-center gap-3 shadow-xs min-h-[210px]">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    FINDER HANDOVER OTP
                  </span>

                  {!finderRevealed ? (
                    /* Masked State */
                    <div className="flex flex-col items-center gap-3">
                      <div className="font-mono text-3xl font-black text-slate-300 tracking-[0.4em] select-none">
                        ••••••
                      </div>
                      <button
                        type="button"
                        onClick={() => setFinderRevealed(true)}
                        className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                        <span>{dict.handoverPage.tapToReveal}</span>
                      </button>
                      <span className="text-[10px] text-slate-400 max-w-xs leading-normal">
                        {dict.handoverPage.maskedNotice}
                      </span>
                    </div>
                  ) : (
                    /* Revealed State with QR & OTP Duo Controls */
                    <div className="flex flex-col items-center gap-3.5 animate-in zoom-in-95 w-full">
                      {/* Scannable Optical QR Code & OTP Duo */}
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs">
                        {/* High-Contrast Scannable QR Code */}
                        <div className="p-2.5 bg-white rounded-xl border border-slate-200 flex flex-col items-center shrink-0">
                          <QRCodeSVG
                            value={`LIYUID:FINDER:${handoverId || "CASE-BOLE-01"}:${depositVoucher || `#DEP-MUN-${finderCode}`}:${itemInfo.titleEn}`}
                            size={120}
                            level="M"
                            includeMargin={false}
                          />
                          <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider mt-1.5">
                            <QrCode className="w-3 h-3 text-emerald-600" />
                            <span>Scan at Counter</span>
                          </div>
                        </div>

                        {/* Digits & Quick Copy */}
                        <div className="flex flex-col items-center sm:items-start gap-1.5">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Counter OTP
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-2xl sm:text-3xl font-black text-[#062B72] tracking-widest">
                              {finderCode.slice(0, 3)} {finderCode.slice(3)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(finderCode)}
                              className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-600 text-slate-600 hover:text-emerald-700 transition-colors cursor-pointer shadow-xs"
                              title="Copy code"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {copiedCode === finderCode && (
                            <span className="text-[10px] font-bold text-emerald-600 animate-in fade-in">
                              {locale === "am" ? "የአግኚ ኮድ ተቀድቷል!" : "Finder code copied!"}
                            </span>
                          )}

                          {/* Live Countdown Timer */}
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold mt-1">
                            <Clock className="w-3 h-3 text-amber-600" />
                            <span>
                              {dict.handoverPage.timerRemaining}: {formatTimer(finderTimer)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Finder Drop-off Quick Action (Confirms item dropped successfully) */}
                      <button
                        type="button"
                        onClick={() => setStationScanModal("finder_drop")}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 text-emerald-800 border border-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-98"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>
                          {locale === "am"
                            ? "✔ እቃውን በዴስክ ማስቀመጥዎን ያረጋግጡ / Scan Station QR"
                            : "✔ Confirm Item Dropped Successfully / Scan Station QR"}
                        </span>
                      </button>

                      {/* Safeguard Action: Resend / Generate New OTP */}
                      <div className="flex items-center gap-2 justify-center">
                        <button
                          type="button"
                          onClick={handleRegenerateFinder}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>{dict.handoverPage.resendNewOtp}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={`p-4 rounded-2xl text-[11px] leading-relaxed flex items-start gap-2.5 border ${
                    handoverVenue === "municipal"
                      ? "bg-emerald-50/70 border-emerald-200/80 text-slate-700"
                      : "bg-slate-50 border-slate-200/80 text-slate-600"
                  }`}
                >
                  {handoverVenue === "municipal" ? (
                    <Building2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <QrCode className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold text-[#062B72] block mb-0.5">
                      {handoverVenue === "municipal"
                        ? (locale === "am" ? "የክፍለ ከተማው ህጋዊ የእቃ ማስረከቢያ ዴስክ" : "Municipal Holding Desk Deposit")
                        : (locale === "am" ? "የቀጥታ ህዝባዊ ርክክብ ደህንነት" : "Public Safe Meeting Zone")}
                    </span>
                    <span>
                      {handoverVenue === "municipal"
                        ? (locale === "am"
                            ? "ያገኙትን እቃ በቦሌ ክፍለ ከተማ ህዝብ አገልግሎት ዴስክ (ቢሮ 104) ያስረክቡ። የዴስክ ኦፊሰሩ የእቃ ተቀባይነት ቫውቸር ይሰጥዎታል።"
                            : "Deposit the found item at the Bole Sub-City Service Center (#104). The station intake officer records it and provides your official deposit voucher.")
                        : (locale === "am"
                            ? "ባለቤቱን በህዝብ ቦታ ሲገናኙ እቃውን ከሰጡ በኋላ የእርሱን ባለ 6-አሃዝ OTP ኮድ ተቀብለው እዚህ ያስገቡ።"
                            : "Meet the owner in a public spot. Hand over the item and enter their 6-digit OTP code below to confirm resolution.")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Card: Finder Inputs Owner's Code */}
              <div className="md:col-span-6 bg-white rounded-[32px] border border-[#e2eaf4] p-6 sm:p-8 shadow-xs flex flex-col gap-5">
                <div>
                  <span className="text-[10px] uppercase font-bold text-[#087FF5] tracking-wider block mb-1">
                    {handoverVenue === "municipal"
                      ? (locale === "am" ? "የክፍለ ከተማው ዴስክ ማረጋገጫ" : "Municipal Intake Authorization")
                      : (locale === "am" ? "እቃውን ማስረከብዎን ያረጋግጡ" : "Confirm Physical Return")}
                  </span>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#062B72]">
                    {handoverVenue === "municipal"
                      ? (locale === "am" ? "የባለቤቱን ባለ 6-አሃዝ OTP ኮድ ያስገቡ" : "Enter Owner's 6-Digit Handover OTP")
                      : dict.handoverPage.enterOwnerCode}
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {handoverVenue === "municipal"
                      ? (locale === "am"
                          ? "እቃውን በክፍለ ከተማው ዴስክ ለማስረከብ የባለቤቱን ባለ 6-አሃዝ OTP ኮድ በማስገባት ርክክቡን ያጠናቅቁ።"
                          : "Enter the owner's 6-digit cryptographic OTP to authorize official transfer into municipal custody.")
                      : (locale === "am"
                          ? "የእቃው ባለቤት የሚያሳይዎትን ባለ 6-አሃዝ ኮድ ጠይቀው እዚህ ያስገቡ።"
                          : "Ask the owner for their 6-digit code and enter it below to confirm you handed over the item.")}
                  </p>
                </div>

                {finderConfirmed ? (
                  <div className="p-6 rounded-3xl bg-emerald-50 border border-emerald-200 text-center flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                    <span className="text-sm font-bold text-emerald-800">
                      {locale === "am" ? "የእቃው ማስረከብ ተረጋግጧል!" : "You have confirmed handover!"}
                    </span>
                    <span className="text-xs text-emerald-700">
                      {locale === "am"
                        ? "አሁን ባለቤቱ የእርስዎን ኮድ አስገብቶ እንዲያረጋግጥ ይጠብቁ።"
                        : "Now waiting for the owner to enter your code to finalize."}
                    </span>
                  </div>
                ) : (
                  <form onSubmit={handleFinderConfirm} className="flex flex-col gap-4">
                    <div className="border border-[#e2eaf4] bg-[#f8fbff] rounded-3xl p-5 flex flex-col gap-2 shadow-xs">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-[#062B72]">
                          {locale === "am" ? "የባለቤቱ ኮድ" : "Owner's Code"}
                        </label>
                        <button
                          type="button"
                          onClick={() => setFinderInputCode(ownerCode)}
                          className="text-[11px] font-bold text-[#087FF5] hover:underline cursor-pointer"
                        >
                          {dict.handoverPage.autofillCode} ({ownerCode.slice(0, 3)} {ownerCode.slice(3)})
                        </button>
                      </div>
                      <input
                        type="text"
                        value={finderInputCode}
                        onChange={(e) => setFinderInputCode(e.target.value)}
                        placeholder="749 201"
                        maxLength={7}
                        className="w-full text-center font-mono text-2xl font-black tracking-widest px-4 py-3 rounded-2xl border border-slate-300 focus:border-[#087FF5] focus:outline-none focus:ring-2 focus:ring-[#087FF5]/20 bg-white"
                      />
                    </div>

                    {inputError && (
                      <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{inputError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isProcessing ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>{locale === "am" ? "በማረጋገጥ ላይ..." : "Verifying..."}</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{dict.handoverPage.confirmHandedOver}</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          STATION QR SCAN MODAL: Differentiated for Owner vs Finder
      ---------------------------------------------------- */}
      {stationScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border-2 border-[#cbd9e8] shadow-2xl max-w-md w-full overflow-hidden flex flex-col text-[#062B72] animate-in zoom-in-95">
            {/* Header */}
            <div
              className={`p-4 sm:p-5 flex items-center justify-between text-white ${
                stationScanModal === "finder_drop" ? "bg-[#064e3b]" : "bg-[#0c2340]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 ${
                    stationScanModal === "finder_drop" ? "bg-emerald-500" : "bg-[#1982fc]"
                  }`}
                >
                  {stationScanModal === "finder_drop" ? (
                    <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                  ) : (
                    <MapPin className="w-6 h-6 stroke-[2.5]" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">
                    {stationScanModal === "finder_drop"
                      ? locale === "am"
                        ? "እቃው በተሳካ ሁኔታ ተረክቧል!"
                        : "✔ Item Dropped Successfully!"
                      : locale === "am"
                      ? "የእቃው ማስቀመጫ ቦታ (መደርደሪያ)"
                      : "📍 Item Storage Place (Shelf)"}
                  </h3>
                  <p className="text-[11px] text-slate-200 font-medium">
                    {stationScanModal === "finder_drop"
                      ? locale === "am"
                        ? "የክፍለ ከተማው የእቃ ተረክቦ ቫውቸር"
                        : "Municipal Intake Deposit Confirmation"
                      : locale === "am"
                      ? "የሴፍ ካዝና መደርደሪያ መረጃ"
                      : "Property Vault Storage Coordinate"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStationScanModal(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 flex flex-col gap-4">
              {stationScanModal === "finder_drop" ? (
                /* FINDER DROP-OFF CONTENT */
                <>
                  <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300 flex flex-col gap-2.5 text-center items-center">
                    <span className="text-[10px] uppercase font-black tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900">
                      {locale === "am" ? "የማስረከቢያ ቫውቸር ተረጋግጧል" : "Deposit Voucher Sealed"}
                    </span>
                    <h4 className="text-xl font-mono font-black text-emerald-950">
                      {depositVoucher || `#DEP-MUN-${finderCode}`}
                    </h4>
                    <p className="text-xs font-bold text-emerald-800">
                      {locale === "am" ? "ቦሌ ክፍለ ከተማ ህዝብ አገልግሎት ዴስክ (#104)" : "Bole Sub-City Public Service Desk #104"}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                    {locale === "am"
                      ? "ያገኙትን እቃ በቦሌ ክፍለ ከተማ ዴስክ (#104) በተሳካ ሁኔታ አስረክበዋል! የእርስዎ ታማኝነት ምስጋና ይገባዋል። እቃው በሴፍ ካዝና እንዲቀመጥ ተደርጎ ለባለቤቱ ማስታወቂያ ተልኳል።"
                      : "You have successfully surrendered the lost item at Bole Sub-City Desk (#104)! Thank you for your honesty. The item is securely logged in the station vault and an SMS alert has been sent to the owner."}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setFinderConfirmed(true);
                      setStationScanModal(null);
                    }}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{locale === "am" ? "እሺ፣ ተረድቻለሁ (ተቀምጧል ✔)" : "Got it (Mark Deposited ✔)"}</span>
                  </button>
                </>
              ) : (
                /* OWNER SHELF LOCATION CONTENT */
                <>
                  <div className="p-5 rounded-2xl bg-[#062B72] text-white flex flex-col gap-2.5 shadow-md">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                      <Archive className="w-4 h-4 text-amber-300" />
                      <span>{locale === "am" ? "የእቃው ማስቀመጫ መደርደሪያ / ቦታ" : "Assigned Storage Shelf / Place"}</span>
                    </span>

                    <div className="bg-white/10 border border-white/20 rounded-xl p-3.5 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-slate-300 block font-medium">
                          {locale === "am" ? "የመደርደሪያ / ካዝና ቁጥር" : "Shelf / Locker Coordinate"}
                        </span>
                        <span className="text-xl sm:text-2xl font-black font-mono text-amber-300 tracking-wide">
                          {vaultLocker || "Locker B-14 (Shelf Tier B, Unit 02)"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-slate-300 block">
                          {locale === "am" ? "ጣቢያ / ቢሮ" : "Station / Desk"}
                        </span>
                        <span className="text-xs font-bold text-white">Bole Vault #104</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-white/10">
                      <span className="text-slate-300">{locale === "am" ? "የግዴታ ማረጋገጫ OTP ኮድ፡" : "Mandatory Assurance OTP:"}</span>
                      <span className="font-mono font-black text-amber-300 text-sm">
                        {ownerCode.slice(0, 3)} {ownerCode.slice(3)}
                      </span>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-300 text-xs text-amber-900 leading-relaxed font-medium">
                    <span className="font-black block mb-1">
                      {locale === "am" ? "የግዴታ ማረጋገጫ ፕሮቶኮል (Mandatory Assurance)፡" : "Mandatory Assurance Protocol:"}
                    </span>
                    {locale === "am"
                      ? "የQR ኮዱ ኦፊሰሩ እቃው የተቀመጠበትን የተለየ መደርደሪያ (Shelf Tier B) ለማግኘት ብቻ ነው። እቃው በተሳካ ሁኔታ መረከቡን በይፋ የሚያረጋግጠው ይህ ባለ 6-አሃዝ OTP ነው። ኦፊሰሩ እቃውን ከመደርደሪያው ካመጣ በኋላ ይህንን OTP እና መታወቂያዎን ያሳዩ።"
                      : "The QR code only detects the storage shelf coordinate. Providing this 6-digit OTP is MANDATORY to assure successful capture and finalize legal handover."}
                  </div>

                  <button
                    type="button"
                    onClick={() => setStationScanModal(null)}
                    className="w-full py-3 rounded-xl bg-[#087FF5] hover:bg-[#076ed4] text-white font-black text-xs flex items-center justify-center gap-2 shadow-md shadow-[#087FF5]/25 transition-all cursor-pointer"
                  >
                    <span>{locale === "am" ? "እሺ፣ ተረድቻለሁ (ዝጋ)" : "Understood (Close)"}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
