"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Bell,
  RefreshCw,
  ChevronRight,
  Sparkles,
  ArrowLeftRight,
  ShieldCheck,
  CheckCircle2,
  Cpu,
  Layers,
} from "lucide-react";
import { useT } from "@/lib/locale-context";

interface NotificationItem {
  id: string;
  category: "system" | "matches" | "handover";
  titleEn: string;
  titleAm: string;
  descEn: string;
  descAm: string;
  timeEn: string;
  timeAm: string;
  iconType: "matches" | "handover" | "system";
  link: string;
  read: boolean;
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "1",
    category: "matches",
    titleEn: "AI Match Detected (94% Score)",
    titleAm: "የAI ራስ-ሰር ተዛማጅ ተገኝቷል (94%)",
    descEn: "LIYUID's AI engine found a high-confidence match for your lost iPhone 13 Pro in Bole Medhanialem.",
    descAm: "የሊዩይድ AI ፈላጊ በቦሌ መድኃኔዓለም ለጠፋው አይፎን 13 ፕሮ ከፍተኛ ተዛማጅ አግኝቷል።",
    timeEn: "2 hours ago",
    timeAm: "ከ2 ሰዓት በፊት",
    iconType: "matches",
    link: "/matches",
    read: false,
  },
  {
    id: "2",
    category: "matches",
    titleEn: "Shielded Chat Connected",
    titleAm: "ሚስጥራዊ ውይይት ተጀምሯል",
    descEn: "Finder confirmed the item. You can now coordinate handover location safely without sharing phone numbers.",
    descAm: "አግኚው እቃውን አረጋግጧል። አሁን ስልክ ቁጥር ሳይለዋወጡ የርክክብ ቦታን መወያየት ይችላሉ።",
    timeEn: "6 hours ago",
    timeAm: "ከ6 ሰዓት በፊት",
    iconType: "matches",
    link: "/messages",
    read: false,
  },
  {
    id: "3",
    category: "handover",
    titleEn: "Two-Sided Handover Code Active",
    titleAm: "የሁለትዮሽ የርክክብ ኮድ ተዘጋጅቷል",
    descEn: "Your 6-digit OTP code is ready for exchange at the Bole Medhanialem certified handover post.",
    descAm: "ባለ 6-አሃዝ የOTP ኮድዎ በቦሌ መድኃኔዓለም ህጋዊ የርክክብ ጣቢያ ለልውውጥ ተዘጋጅቷል።",
    timeEn: "1 day ago",
    timeAm: "ከ1 ቀን በፊት",
    iconType: "handover",
    link: "/handover",
    read: true,
  },
  {
    id: "4",
    category: "system",
    titleEn: "Lost Item Report Submitted",
    titleAm: "የጠፋ እቃ ሪፖርት በተሳካ ሁኔታ ገብቷል",
    descEn: "Your report for Leather Laptop Backpack was indexed into Addis Ababa's 24/7 AI vector search.",
    descAm: "የቆዳ የላፕቶፕ ቦርሳ ሪፖርትዎ በአዲስ አበባ የ24/7 AI ቬክተር ፍተሻ ውስጥ ተመዝግቧል።",
    timeEn: "2 days ago",
    timeAm: "ከ2 ቀናት በፊት",
    iconType: "system",
    link: "/reports",
    read: true,
  },
];

export default function NotificationsPage() {
  const { locale, dict } = useT();
  const [activeTab, setActiveTab] = useState<"all" | "system" | "matches" | "handover">("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);

  const filtered = notifications.filter((n) =>
    activeTab === "all" ? true : n.category === activeTab
  );

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const tabs = [
    { key: "all", label: dict.notificationsPage.tabAll },
    { key: "system", label: dict.notificationsPage.tabSystem },
    { key: "matches", label: dict.notificationsPage.tabMatches },
    { key: "handover", label: dict.notificationsPage.tabHandover },
  ] as const;

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6 selection:bg-[#00B9F2] selection:text-white">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-[#087FF5] text-[11px] font-bold tracking-wide uppercase mb-2">
            <Bell className="w-3.5 h-3.5" />
            <span>{locale === "am" ? "የእንቅስቃሴ ማሳወቂያዎች" : "Activity Alerts"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#062B72] tracking-tight">
            {dict.notificationsPage.title}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {dict.notificationsPage.subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={handleMarkAllRead}
          className="text-xs font-semibold text-[#087FF5] hover:text-[#062B72] transition-colors self-start sm:self-auto cursor-pointer"
        >
          {dict.notificationsPage.markAllRead}
        </button>
      </div>

      <div className="bg-white rounded-[32px] border border-[#e2eaf4] p-6 sm:p-8 shadow-xs flex flex-col gap-6">
        {/* CATEGORY FILTER TABS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-[#e2eaf4]">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.key;
            const count =
              tab.key === "all"
                ? notifications.length
                : notifications.filter((n) => n.category === tab.key).length;

            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap mb-2 ${
                  isSelected
                    ? "bg-[#087FF5] text-white shadow-sm"
                    : "bg-[#f8fbff] text-slate-600 hover:bg-slate-100 border border-[#e2eaf4]"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                    isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* NOTIFICATIONS LIST */}
        <div className="flex flex-col gap-3">
          {filtered.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center gap-2">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-1">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-[#062B72]">
                {dict.notificationsPage.emptyTitle}
              </h3>
              <p className="text-xs text-slate-500">
                {dict.notificationsPage.emptyDesc}
              </p>
            </div>
          ) : (
            filtered.map((item) => (
              <Link
                key={item.id}
                href={item.link}
                className={`border rounded-2xl p-4 sm:p-5 flex items-start justify-between gap-4 transition-all hover:bg-slate-50/70 group ${
                  item.read
                    ? "bg-white border-[#e2eaf4]"
                    : "bg-[#f8fbff] border-blue-200/80 shadow-xs"
                }`}
              >
                <div className="flex items-start gap-3.5">
                  {/* Category-Specific Circular Icon */}
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${
                      item.iconType === "matches"
                        ? "bg-blue-50 text-[#087FF5] border border-blue-200/60"
                        : item.iconType === "handover"
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200/60"
                        : "bg-slate-100 text-slate-600 border border-slate-200"
                    }`}
                  >
                    {item.iconType === "matches" && <Sparkles className="w-4 h-4" />}
                    {item.iconType === "handover" && <ArrowLeftRight className="w-4 h-4" />}
                    {item.iconType === "system" && <Cpu className="w-4 h-4" />}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {item.category === "matches"
                          ? dict.notificationsPage.tabMatches
                          : item.category === "handover"
                          ? dict.notificationsPage.tabHandover
                          : dict.notificationsPage.tabSystem}
                      </span>
                      {!item.read && (
                        <span className="w-2 h-2 rounded-full bg-[#087FF5]" />
                      )}
                      <span className="text-[11px] text-slate-400">
                        {locale === "am" ? item.timeAm : item.timeEn}
                      </span>
                    </div>

                    <h2 className="text-xs sm:text-sm font-bold text-[#062B72] group-hover:text-[#087FF5] transition-colors">
                      {locale === "am" ? item.titleAm : item.titleEn}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {locale === "am" ? item.descAm : item.descEn}
                    </p>
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#087FF5] group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
