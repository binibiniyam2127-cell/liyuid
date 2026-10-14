"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import {
  Shield,
  Sparkles,
  ShieldCheck,
  Search,
  ArrowRight,
  Bell,
  Clock,
  Compass,
  MapPin,
  Activity,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/locale-context";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { UserAvatar, formatCapitalized } from "@/components/ui/UserAvatar";

interface ReportItem {
  id: string;
  subcity: string;
  titleEn: string;
  titleAm: string;
  locationEn: string;
  locationAm: string;
  badgeEn: string;
  badgeAm: string;
  badgeColor: string;
  initials: string;
  initialsBg: string;
  link: string;
}

const SAMPLE_REPORTS: ReportItem[] = [];

export default function HomePage() {
  const { user } = useAuth();
  const { dict, locale } = useT();
  const formattedDisplayName = formatCapitalized(user?.display_name || "Citizen");

  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    let isMounted = true;
    api.getMyReports()
      .then((data) => {
        if (isMounted) setReports(data || []);
      })
      .catch(() => {
        if (isMounted) setReports([]);
      })
      .finally(() => {
        if (isMounted) setLoadingReports(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 max-w-6xl mx-auto selection:bg-[#00B9F2] selection:text-white">
      {/* SLEEK, CLEAN ADDIS ABABA CITY BANNER */}
      <div className="relative w-full h-32 sm:h-36 rounded-3xl overflow-hidden shadow-md border border-[#e2eaf4]">
        <img
          src="/images/addis-city-bg.png"
          alt="Addis Ababa"
          className="w-full h-full object-cover object-[center_35%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#062B72]/85 via-[#062B72]/45 to-transparent" />

        <div className="absolute inset-0 px-6 sm:px-8 py-5 flex items-center justify-between text-white">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[11px] font-bold tracking-wider uppercase mb-2">
              <span className="w-2 h-2 rounded-full bg-[#00B9F2] animate-pulse" />
              <span>{dict.dashboard.cityLiveNetwork}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight drop-shadow-sm">
              {dict.dashboard.cityTitle}
            </h2>
          </div>
        </div>
      </div>

      {/* DASHBOARD HEADER WITH TOP-RIGHT CONTROLS */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#062B72] tracking-tight">
            {dict.dashboard.welcomeBack}, {formattedDisplayName}
          </h1>
        </div>

        {/* TOP RIGHT CONTROLS: [ 🌐 EN ⌵ ] [ 🔔 ] [ BM ] */}
        <div className="flex items-center gap-3">
          <LanguageSwitch />

          <Link
            href="/notifications"
            className="w-10 h-10 rounded-full bg-white border border-[#e2eaf4] shadow-xs flex items-center justify-center text-slate-600 hover:text-[#087FF5] transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white" />
          </Link>

          <Link href="/profile" className="flex items-center gap-2 group" aria-label="Profile">
            <UserAvatar name={formattedDisplayName} size="md" />
          </Link>
        </div>
      </div>

      {/* TWO PRIMARY ACTION CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/report?type=lost"
          className="bg-white border border-[#e2eaf4] hover:border-[#087FF5]/40 rounded-3xl p-6 shadow-xs hover:shadow-lg transition-all flex items-center gap-5 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#087FF5]/10 border border-[#087FF5]/20 flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
            <img
              src="/images/logo-pin.png"
              alt="LIYUID"
              className="w-7 h-9 object-contain drop-shadow-sm"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-[#062B72] group-hover:text-[#087FF5] transition-colors">
                {dict.dashboard.reportLost}
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#087FF5]/10 text-[#087FF5] uppercase">
                {dict.dashboard.ownerBadge}
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-[#087FF5] group-hover:text-white text-slate-400 flex items-center justify-center transition-all shrink-0">
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>

        <Link
          href="/report?type=found"
          className="bg-white border border-[#e2eaf4] hover:border-[#18B981]/40 rounded-3xl p-6 shadow-xs hover:shadow-lg transition-all flex items-center gap-5 group"
        >
          <div className="w-14 h-14 rounded-2xl bg-[#18B981]/10 border border-[#18B981]/20 flex items-center justify-center shadow-sm shrink-0 group-hover:scale-105 transition-transform">
            <img
              src="/images/logo-pin.png"
              alt="LIYUID"
              className="w-7 h-9 object-contain drop-shadow-sm"
            />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-[#062B72] group-hover:text-[#18B981] transition-colors">
                {dict.dashboard.reportFound}
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#18B981]/10 text-[#18B981] uppercase">
                {dict.dashboard.finderBadge}
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-slate-50 group-hover:bg-[#18B981] group-hover:text-white text-slate-400 flex items-center justify-center transition-all shrink-0">
            <ArrowRight className="w-4 h-4" />
          </div>
        </Link>
      </div>

      {/* GRID: Reports & Matching Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#e2eaf4] rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#062B72]">
                {dict.dashboard.myReports}
              </h3>
              <Link
                href="/reports"
                className="text-xs font-bold text-[#087FF5] hover:text-[#066ad1] hover:underline"
              >
                {dict.dashboard.viewAll} ({reports.length})
              </Link>
            </div>

            {loadingReports ? (
              <div className="p-8 text-center text-xs text-slate-400 font-semibold animate-pulse">
                {locale === "am" ? "ሪፖርቶች በመጫን ላይ..." : "Loading declarations..."}
              </div>
            ) : reports.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-50 border border-slate-200/80 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#087FF5] flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[#062B72]">
                    {locale === "am" ? "ምንም ንቁ ሪፖርት አልተመዘገበም" : "No active declarations yet"}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    {locale === "am"
                      ? "እቃ ጠፍቶብዎታል ወይም አግኝተዋል? ከላይ ያሉትን ቁልፎች በመጠቀም ሪፖርት ያቅርቡ።"
                      : "Lost something or found an item? Use the buttons above to submit a new declaration."}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href="/report?type=lost"
                    className="px-4 py-2 rounded-xl bg-[#087FF5] text-white font-bold text-xs shadow-xs hover:bg-[#062B72] transition-colors"
                  >
                    {locale === "am" ? "የጠፋ እቃ ሪፖርት" : "Report Lost Item"}
                  </Link>
                  <Link
                    href="/report?type=found"
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-xs hover:bg-emerald-700 transition-colors"
                  >
                    {locale === "am" ? "የተገኘ እቃ ሪፖርት" : "Report Found Item"}
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.slice(0, 5).map((item: any) => {
                  const isLost = item.type === "lost";
                  const title = [item.brand, item.model, item.category].filter(Boolean).join(" ") || (isLost ? "Lost Item" : "Found Item");
                  const initials = (item.brand || item.category || "IT").slice(0, 2).toUpperCase();
                  const statusBadge =
                    item.status === "resolved"
                      ? { label: locale === "am" ? "ተረክቧል" : "Reunited", color: "bg-emerald-100 text-emerald-700" }
                      : item.status === "matched"
                      ? { label: locale === "am" ? "ግጥጥሞሽ ተገኝቷል" : "Match Found", color: "bg-blue-100 text-[#087FF5]" }
                      : { label: locale === "am" ? "በፍተሻ ላይ" : "Searching", color: "bg-slate-100 text-slate-600" };

                  return (
                    <div
                      key={item.id}
                      className="p-4 rounded-2xl bg-slate-50 hover:bg-[#087FF5]/5 border border-slate-100 transition-all flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#087FF5] flex items-center justify-center font-bold text-xs shrink-0">
                          {initials}
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-[#062B72]">
                            {title}
                          </h4>
                          <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#00B9F2]" />
                            <span>{item.sub_city || "Addis Ababa Desk"}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${statusBadge.color} uppercase`}>
                          {statusBadge.label}
                        </span>
                        <Link
                          href={isLost ? `/matches?itemId=${item.id}` : `/reports/${item.id}`}
                          className="p-1.5 rounded-lg hover:bg-white text-slate-400 hover:text-[#087FF5] transition-colors"
                          aria-label="Open item details"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white border border-[#e2eaf4] rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#062B72]">{dict.dashboard.recentActivity}</h3>
                <p className="text-xs text-slate-500">{dict.dashboard.recentActivityDesc}</p>
              </div>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>

            {reports.length === 0 ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 mt-1 shrink-0 animate-pulse" />
                  <div>
                    <p className="text-xs font-bold text-[#062B72]">
                      {locale === "am" ? "የ 384-D ቬክተር ሞተር እና AI ሴንቲነል ዝግጁ ነው" : "384-D AI Vector Sentinel Online"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {locale === "am"
                        ? "በመላው አዲስ አበባ አዲስ ሪፖርቶች ሲገቡ በቅጽበት ይነጻጸራሉ፤ ውጤቱም እዚህ ይዘረዘራል።"
                        : "Ready to cross-evaluate submissions citywide in real-time. Activity and alerts will populate dynamically."}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#087FF5] mt-1 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-[#062B72]">
                      {locale === "am" ? "የግል መረጃ ምስጢራዊነት ጥበቃ (Zero-PII Isolation)" : "Zero-PII Privacy Enforced"}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {locale === "am"
                        ? "የእቃዎ ሚስጥራዊ መለያዎች በጀርባ ብቻ ይነጻጸራሉ፤ ለህዝብም ሆነ ለአግኚ ፈጽሞ አይታዩም።"
                        : "Your sealed verification traits remain encrypted and are never exposed publicly or to finders."}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.slice(0, 3).map((rep: any, idx: number) => (
                  <div key={rep.id} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full ${idx === 0 ? "bg-[#087FF5]" : "bg-[#18B981]"} mt-1.5 shrink-0`} />
                    <div>
                      <p className="text-xs font-bold text-[#062B72]">
                        {locale === "am"
                          ? `${rep.brand || rep.category} በ AI ቬክተር ፍተሻ ውስጥ ተመዝግቧል`
                          : `${rep.brand || rep.category} registered for 384-D AI matching`}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {locale === "am"
                          ? `${rep.sub_city || "ቦሌ"} • የደህንነት ማረጋገጫ ተዘጋጅቷል`
                          : `${rep.sub_city || "Bole Desk"} • Cryptographic seal active`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-gradient-to-br from-[#062B72] to-[#087FF5] rounded-3xl p-6 text-white shadow-lg shadow-[#062B72]/20">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#00B9F2]">
                AI Engine
              </span>
              <Activity className="w-4 h-4 text-[#00B9F2] animate-pulse" />
            </div>

            <h3 className="text-lg font-black tracking-tight mb-4">
              {dict.dashboard.matchingStatus}
            </h3>

            <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-white">{dict.dashboard.activeScanning}</span>
                <span className="text-xs font-black text-[#00B9F2]">98.4%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/20 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#00B9F2] to-emerald-400 rounded-full w-[98%]" />
              </div>
            </div>

            <Link
              href="/matches"
              className="w-full py-2.5 rounded-full bg-white text-[#062B72] hover:bg-[#00B9F2] hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
            >
              <span>{dict.dashboard.inspectMatches}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="bg-white border border-[#e2eaf4] rounded-3xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#062B72]">{dict.dashboard.notifications}</h3>
              <span className="w-2 h-2 rounded-full bg-[#087FF5]" />
            </div>

            <div className="space-y-3">
              <div className="p-3 rounded-2xl bg-[#087FF5]/5 border border-[#087FF5]/15 flex items-start gap-3">
                <Sparkles className="w-4 h-4 text-[#087FF5] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#062B72]">
                    {locale === "am" ? "ተዛማጅ ተገኝቷል" : "Match Found"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {locale === "am"
                      ? "የአይፎን 13 ሪፖርትዎ በቦሌ የተረጋገጠ ተዛማጅ አለው።"
                      : "Your iPhone 13 report has a verified match in Bole."}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-[#18B981] mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[#062B72]">
                    {locale === "am" ? "ማረጋገጫው ተሳክቷል" : "Verification Passed"}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {locale === "am"
                      ? "የባለቤቱ ምስጢራዊ ጥያቄ በተሳካ ሁኔታ ተመልሷል።"
                      : "Owner serial question matched successfully."}
                  </p>
                </div>
              </div>
            </div>

            <Link
              href="/notifications"
              className="mt-4 block text-center text-xs font-bold text-[#087FF5] hover:text-[#066ad1] hover:underline"
            >
              {dict.dashboard.viewAllNotifications}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
