"use client";

import React, { useState, useRef, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  User,
  Settings,
  Shield,
  Camera,
  RotateCcw,
  Check,
  Bell,
  Lock,
  Smartphone,
  Send,
  Laptop,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ExternalLink,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { UserAvatar, formatCapitalized } from "@/components/ui/UserAvatar";
import { useT } from "@/lib/locale-context";
import { api } from "@/lib/api";
import { UserSettingsResponse, TelegramLinkResponse } from "@/lib/types";

function enforceLiyuidAlertBotUrl(rawUrl?: string): string {
  if (!rawUrl) return "https://t.me/liyuid_alert_bot";
  const match = rawUrl.match(/[?&]start=([^&#\s]+)/);
  if (match && match[1]) {
    return `https://t.me/liyuid_alert_bot?start=${match[1]}`;
  }
  return "https://t.me/liyuid_alert_bot";
}

function ProfilePageInner() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale, setLocale, dict } = useT();

  const initialTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"profile" | "settings" | "security">(
    initialTab === "settings" || initialTab === "security" ? initialTab : "profile"
  );

  // Sync activeTab if searchParams change
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "settings" || tab === "security" || tab === "profile") {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (newTab: "profile" | "settings" | "security") => {
    setActiveTab(newTab);
    router.replace(`/profile?tab=${newTab}`, { scroll: false });
  };

  // System & Backend Integration State
  const [systemSettings, setSystemSettings] = useState<UserSettingsResponse | null>(null);
  const [telegramLink, setTelegramLink] = useState<TelegramLinkResponse | null>(null);
  const [linkingTelegram, setLinkingTelegram] = useState(false);
  const [refreshingSettings, setRefreshingSettings] = useState(false);
  const [simulatingLink, setSimulatingLink] = useState(false);

  const fetchSettings = async () => {
    try {
      setRefreshingSettings(true);
      const s = await api.getSettings();
      setSystemSettings(s);
    } catch {
      // ignore
    } finally {
      setRefreshingSettings(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Connect to Telegram Bot & Direct Redirect strictly to @liyuid_alert_bot
  const handleLinkTelegram = async () => {
    try {
      setLinkingTelegram(true);
      const res = await api.linkTelegram().catch(() => null);
      const raw = (res as any)?.deep_link || (res as any)?.link || "";
      const targetUrl = enforceLiyuidAlertBotUrl(raw);

      setTelegramLink({
        bot_username: "liyuid_alert_bot",
        deep_link: targetUrl,
        expires_in_seconds: 900,
      });

      // Direct redirect strictly to @liyuid_alert_bot
      const opened = window.open(targetUrl, "_blank");
      if (!opened) {
        window.location.href = targetUrl;
      }
    } catch {
      window.location.href = "https://t.me/liyuid_alert_bot";
    } finally {
      setLinkingTelegram(false);
    }
  };

  const handleSimulateLink = async () => {
    try {
      setSimulatingLink(true);
      await api.simulateTelegramLink().catch(() => null);
      await fetchSettings();
    } catch {
      // ignore
    } finally {
      setSimulatingLink(false);
    }
  };

  // Profile Information State
  const [fullName, setFullName] = useState(
    formatCapitalized(user?.display_name || "Biniyam Molla")
  );
  const [emailOrPhone, setEmailOrPhone] = useState(user?.email || "biniyam@example.com");
  const [location, setLocation] = useState(locale === "am" ? "አዲስ አበባ" : "Addis Ababa");
  const [profileSaved, setProfileSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Settings State
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [inAppNotifs, setInAppNotifs] = useState(true);
  const [smsNotifs, setSmsNotifs] = useState(true);
  const [telegramNotifs, setTelegramNotifs] = useState(true);
  const [blindPrivacy, setBlindPrivacy] = useState(true);
  const [autoMatchAlerts, setAutoMatchAlerts] = useState(true);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Security State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const url = event.target?.result as string;
        if (typeof window !== "undefined") {
          localStorage.setItem("liyuid_user_avatar", url);
          window.dispatchEvent(new Event("storage"));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleResetPhoto = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("liyuid_user_avatar");
      window.dispatchEvent(new Event("storage"));
    }
  };

  const handleSaveProfile = () => {
    setFullName((prev) => formatCapitalized(prev));
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleSaveSettings = () => {
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword) {
      setPasswordError(
        locale === "am" ? "እባክዎ የአሁኑን ይለፍ ቃል ያስገቡ" : "Please enter your current password."
      );
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError(
        locale === "am"
          ? "አዲሱ ይለፍ ቃል ቢያንስ 6 ቁምፊዎች ሊኖሩት ይገባል"
          : "New password must be at least 6 characters long."
      );
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError(
        locale === "am" ? "የይለፍ ቃሎቹ አይዛመዱም" : "New passwords do not match."
      );
      return;
    }

    setPasswordSuccess(true);
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordSuccess(false), 4000);
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#062B72] tracking-tight">
          {dict.profile.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          {locale === "am"
            ? "የመለያዎን ዝርዝር፣ የማሳወቂያ ምርጫዎችን እና ደህንነትን በአንድ ቦታ ያስተዳድሩ።"
            : "Manage your account identity, notification preferences, and security in one unified place."}
        </p>
      </div>

      {/* Main Grid: Left Tabs / Right Content */}
      <div className="bg-white rounded-3xl border border-[#e2eaf4] shadow-xs overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[520px]">
        {/* LEFT TAB NAVIGATION (4 cols) */}
        <div className="md:col-span-4 border-r border-[#e2eaf4] p-5 flex flex-col gap-2 bg-[#fbfdff]">
          <button
            type="button"
            onClick={() => handleTabChange("profile")}
            className={`w-full p-3.5 rounded-2xl flex items-center gap-3 transition-all text-left cursor-pointer ${
              activeTab === "profile"
                ? "bg-[#087FF5] text-white shadow-md shadow-[#087FF5]/25"
                : "text-slate-600 hover:bg-slate-100 hover:text-[#062B72]"
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold block">{dict.profile.personalInfo}</span>
              <span
                className={`text-[10px] block truncate ${
                  activeTab === "profile" ? "text-blue-100" : "text-slate-400"
                }`}
              >
                {locale === "am" ? "ስም፣ አድራሻ እና ቋንቋ" : "Name, location & language"}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("settings")}
            className={`w-full p-3.5 rounded-2xl flex items-center gap-3 transition-all text-left cursor-pointer ${
              activeTab === "settings"
                ? "bg-[#087FF5] text-white shadow-md shadow-[#087FF5]/25"
                : "text-slate-600 hover:bg-slate-100 hover:text-[#062B72]"
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold block">{dict.profile.notifPreferences}</span>
              <span
                className={`text-[10px] block truncate ${
                  activeTab === "settings" ? "text-blue-100" : "text-slate-400"
                }`}
              >
                {locale === "am" ? "ማሳወቂያዎች፣ ቴሌግራም እና ሚስጥራዊነት" : "Alerts, Telegram & privacy"}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange("security")}
            className={`w-full p-3.5 rounded-2xl flex items-center gap-3 transition-all text-left cursor-pointer ${
              activeTab === "security"
                ? "bg-[#087FF5] text-white shadow-md shadow-[#087FF5]/25"
                : "text-slate-600 hover:bg-slate-100 hover:text-[#062B72]"
            }`}
          >
            <Shield className="w-4 h-4 shrink-0" />
            <div className="flex-1 min-w-0">
              <span className="text-xs font-bold block">{dict.profile.securityTitle}</span>
              <span
                className={`text-[10px] block truncate ${
                  activeTab === "security" ? "text-blue-100" : "text-slate-400"
                }`}
              >
                {locale === "am" ? "የይለፍ ቃል እና ባለሁለት ደረጃ OTP" : "Password & Two-Factor OTP"}
              </span>
            </div>
          </button>
        </div>

        {/* RIGHT CONTENT PANE (8 cols) */}
        <div className="md:col-span-8 p-6 sm:p-8 flex flex-col justify-between">
          {/* ----------------------------------------------------
              TAB 1: PERSONAL INFORMATION
          ---------------------------------------------------- */}
          {activeTab === "profile" && (
            <div className="flex flex-col gap-6 animate-in fade-in">
              <div>
                <h2 className="text-base font-bold text-[#062B72]">
                  {dict.profile.personalInfo}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {dict.profile.phoneVerified}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {dict.profile.emailVerified}
                  </span>
                </div>
              </div>

              {/* Avatar Photo Row */}
              <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#f8fbff] border border-[#e2eaf4]">
                <UserAvatar size="xl" className="ring-4 ring-white shadow-md shrink-0" />
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs font-bold text-[#062B72]">
                    {dict.profile.verifiedMember}
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-white border border-[#dce6f2] hover:bg-slate-50 text-[11px] font-bold text-[#062B72] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#087FF5]" />
                      <span>{dict.profile.upload}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleResetPhoto}
                      className="px-3 py-1.5 rounded-xl hover:bg-slate-100 text-[11px] font-semibold text-slate-500 transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3 text-slate-400" />
                      <span>{dict.profile.useInitials}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="border border-[#dce6f2] bg-white rounded-2xl px-4 py-2.5 flex flex-col focus-within:border-[#087FF5] transition-colors">
                  <label className="text-[11px] font-semibold text-slate-500">
                    {dict.profile.fullName}
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="text-xs font-bold text-[#062B72] bg-transparent outline-none mt-0.5"
                  />
                </div>

                <div className="border border-[#dce6f2] bg-white rounded-2xl px-4 py-2.5 flex flex-col focus-within:border-[#087FF5] transition-colors">
                  <label className="text-[11px] font-semibold text-slate-500">
                    {dict.profile.emailOrPhone}
                  </label>
                  <input
                    type="text"
                    value={emailOrPhone}
                    onChange={(e) => setEmailOrPhone(e.target.value)}
                    className="text-xs font-bold text-[#062B72] bg-transparent outline-none mt-0.5"
                  />
                </div>

                <div className="border border-[#dce6f2] bg-white rounded-2xl px-4 py-2.5 flex flex-col focus-within:border-[#087FF5] transition-colors">
                  <label className="text-[11px] font-semibold text-slate-500">
                    {dict.profile.location}
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="text-xs font-bold text-[#062B72] bg-transparent outline-none mt-0.5"
                  />
                </div>
              </div>

              {/* Language Selection */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-[#062B72]">
                  {dict.profile.language}
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-sm">
                  <button
                    type="button"
                    onClick={() => setLocale("en")}
                    className={`px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      locale === "en"
                        ? "border-[#087FF5] bg-[#087FF5]/10 text-[#087FF5] shadow-xs"
                        : "border-[#dce6f2] bg-[#f8fbff] text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>English (US)</span>
                    {locale === "en" && <Check className="w-4 h-4 text-[#087FF5]" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocale("am")}
                    className={`px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      locale === "am"
                        ? "border-[#087FF5] bg-[#087FF5]/10 text-[#087FF5] shadow-xs"
                        : "border-[#dce6f2] bg-[#f8fbff] text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    <span>አማርኛ (Amharic)</span>
                    {locale === "am" && <Check className="w-4 h-4 text-[#087FF5]" />}
                  </button>
                </div>
              </div>

              {/* Save Button & Feedback */}
              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-6 py-3 rounded-2xl bg-[#087FF5] hover:bg-[#062B72] text-white text-xs font-bold shadow-md shadow-[#087FF5]/25 transition-all cursor-pointer"
                >
                  {dict.profile.saveChanges}
                </button>
                {profileSaved && (
                  <span className="text-xs font-bold text-emerald-600 animate-in fade-in flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{dict.profile.saved}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------
              TAB 2: SETTINGS & PREFERENCES
          ---------------------------------------------------- */}
          {activeTab === "settings" && (
            <div className="flex flex-col gap-6 animate-in fade-in">
              <div>
                <h2 className="text-base font-bold text-[#062B72]">
                  {dict.profile.notifPreferences}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {locale === "am"
                    ? "የማሳወቂያ እና የግል ደህንነት ምርጫዎችዎን ያዋቅሩ"
                    : "Configure notification channels, Telegram bot alerts, and blind privacy protections."}
                </p>
              </div>

              {/* TELEGRAM NOTIFICATIONS BOT CARD */}
              <div className="bg-[#f0f7ff] border border-[#d8e8fc] rounded-2xl p-5 flex flex-col gap-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-[#0088cc] text-white flex items-center justify-center shrink-0 shadow-sm shadow-[#0088cc]/30">
                      <Send className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[#062B72]">
                          Telegram Bot (@liyuid_alert_bot)
                        </h3>
                        {systemSettings?.telegram_state === "linked" ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {dict.profile.telegramConnected}
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">
                            {locale === "am" ? "አልተገናኘም" : "Not Linked"}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {dict.profile.telegramBotDesc}
                      </p>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {systemSettings?.telegram_state !== "linked" && (
                      <button
                        type="button"
                        onClick={handleLinkTelegram}
                        disabled={linkingTelegram}
                        className="px-4 py-2.5 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-[#0088cc]/20 cursor-pointer disabled:opacity-50"
                      >
                        {linkingTelegram ? (
                          <RefreshCw className="animate-spin w-3.5 h-3.5" />
                        ) : (
                          <Send className="w-3.5 h-3.5" />
                        )}
                        <span>{dict.profile.connectTelegram}</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={fetchSettings}
                      disabled={refreshingSettings}
                      title={locale === "am" ? "የግንኙነት ሁኔታን አድስ" : "Refresh status"}
                      className="w-9 h-9 rounded-xl bg-white border border-[#d8e8fc] flex items-center justify-center text-slate-500 hover:text-[#062B72] hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${refreshingSettings ? "animate-spin text-[#0088cc]" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Connection helper & Direct Links */}
                {telegramLink ? (
                  <div className="p-3.5 bg-white border border-[#d8e8fc] rounded-xl text-xs flex flex-col gap-2 animate-in fade-in">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#062B72] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-[#0088cc]" />
                        {locale === "am"
                          ? "የቴሌግራም ቦት ማገናኛ ተዘጋጅቷል"
                          : "Telegram Bot Connect Link Generated"}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {locale === "am" ? "ለ15 ደቂቃ ይሰራል" : "Valid for 15 mins"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      {locale === "am"
                        ? "ቴሌግራም በራሱ ካልተከፈተ ከታች ያለውን ሰማያዊ አዝራር ይጫኑና በቴሌግራም START የሚለውን ይጫኑ።"
                        : "If Telegram did not open automatically, tap the button below and press START in Telegram."}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <a
                        href={telegramLink.deep_link}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-xl bg-[#0088cc] hover:bg-[#0077b5] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{locale === "am" ? "በቴሌግራም ክፈት (@liyuid_alert_bot)" : "Open in Telegram (@liyuid_alert_bot)"}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <button
                        type="button"
                        onClick={handleSimulateLink}
                        disabled={simulatingLink}
                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                      >
                        {simulatingLink
                          ? (locale === "am" ? "በማገናኘት ላይ..." : "Connecting...")
                          : (locale === "am" ? "የሙከራ ማገናኛ (Simulate Test Link)" : "Simulate Test Link")}
                      </button>
                    </div>
                  </div>
                ) : (
                  systemSettings?.telegram_state !== "linked" && (
                    <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-[#d8e8fc]/60">
                      <span>
                        {locale === "am"
                          ? "የቦት ስም፡ @liyuid_alert_bot • ሲጫኑ በቀጥታ ወደ ቴሌግራም ይወስድዎታል"
                          : "Bot: @liyuid_alert_bot • Clicking connect redirects directly to Telegram"}
                      </span>
                      <button
                        type="button"
                        onClick={handleSimulateLink}
                        disabled={simulatingLink}
                        className="text-[11px] text-[#0088cc] hover:underline font-semibold cursor-pointer"
                      >
                        {locale === "am" ? "የሙከራ ግንኙነት (Quick Test)" : "Quick Test Connect"}
                      </button>
                    </div>
                  )
                )}
              </div>

              {/* Notification Toggles */}
              <div className="flex flex-col gap-3.5 bg-[#f8fbff] border border-[#e2eaf4] rounded-2xl p-5">
                {/* Instant In-App Alerts */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#087FF5] flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#062B72] block">
                        {dict.profile.inAppNotifs}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {locale === "am" ? "በድረ-ገጹ ላይ ፈጣን ማሳወቂያዎች" : "Real-time alerts while browsing LIYUID"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInAppNotifs(!inAppNotifs)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      inAppNotifs ? "bg-[#087FF5]" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        inAppNotifs ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="h-[1px] bg-slate-200/60" />

                {/* Telegram Bot Alerts Toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                      <Send className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#062B72] block">
                        {dict.profile.telegramNotifs}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {locale === "am" ? "በቴሌግራም ፈጣን የኮድ እና የተዛማጅ መልዕክቶች" : "Instant OTP and match alerts on Telegram"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTelegramNotifs(!telegramNotifs)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      telegramNotifs ? "bg-[#087FF5]" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        telegramNotifs ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="h-[1px] bg-slate-200/60" />

                {/* SMS Alerts */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Smartphone className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#062B72] block">
                        {dict.profile.smsNotifs}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {locale === "am" ? "በኢትዮ ቴሌኮም SMS የOTP ኮድ ማሳወቂያዎች" : "Ethio Telecom SMS notifications"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSmsNotifs(!smsNotifs)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      smsNotifs ? "bg-[#087FF5]" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        smsNotifs ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                </div>

                <div className="h-[1px] bg-slate-200/60" />

                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#062B72] block">
                        {dict.profile.emailNotifs}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {locale === "am" ? "ሳምንታዊ እና የቀን የሪፖርት ማጠቃለያዎች" : "Weekly digests and match summaries"}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEmailNotifs(!emailNotifs)}
                    className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                      emailNotifs ? "bg-[#087FF5]" : "bg-slate-200"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                        emailNotifs ? "right-1" : "left-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Privacy Shield Toggle */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-[#087FF5] mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-[#062B72] block">
                      {dict.profile.blindPrivacyMode}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {locale === "am"
                        ? "በፍተሻ ወቅት ስምዎ እና ስልክ ቁጥርዎ በምንም መልኩ አይታዩም።"
                        : "Prevents search engines and public inquiries from indexing your personal identity."}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setBlindPrivacy(!blindPrivacy)}
                  className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                    blindPrivacy ? "bg-[#087FF5]" : "bg-slate-200"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      blindPrivacy ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSaveSettings}
                  className="px-6 py-3 rounded-2xl bg-[#087FF5] hover:bg-[#062B72] text-white text-xs font-bold shadow-md shadow-[#087FF5]/25 transition-all cursor-pointer"
                >
                  {dict.profile.saveSettings}
                </button>
                {settingsSaved && (
                  <span className="text-xs font-bold text-emerald-600 animate-in fade-in flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{dict.profile.saved}</span>
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ----------------------------------------------------
              TAB 3: SECURITY & PASSWORD
          ---------------------------------------------------- */}
          {activeTab === "security" && (
            <div className="flex flex-col gap-6 animate-in fade-in">
              <div>
                <h2 className="text-base font-bold text-[#062B72]">
                  {dict.profile.securityTitle}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {dict.profile.securityDesc}
                </p>
              </div>

              {/* Password Change Form */}
              <form onSubmit={handleUpdatePassword} className="flex flex-col gap-3.5 bg-[#f8fbff] border border-[#e2eaf4] rounded-2xl p-5">
                <span className="text-xs font-bold text-[#062B72] block">
                  {dict.profile.changePassword}
                </span>

                <div className="border border-[#dce6f2] bg-white rounded-xl px-4 py-2 flex flex-col">
                  <label className="text-[11px] font-semibold text-slate-500">
                    {dict.profile.currentPassword}
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="text-xs font-medium text-[#062B72] bg-transparent outline-none mt-0.5"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="border border-[#dce6f2] bg-white rounded-xl px-4 py-2 flex flex-col">
                    <label className="text-[11px] font-semibold text-slate-500">
                      {dict.profile.newPassword}
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="text-xs font-medium text-[#062B72] bg-transparent outline-none mt-0.5"
                    />
                  </div>

                  <div className="border border-[#dce6f2] bg-white rounded-xl px-4 py-2 flex flex-col">
                    <label className="text-[11px] font-semibold text-slate-500">
                      {dict.profile.confirmNewPassword}
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="text-xs font-medium text-[#062B72] bg-transparent outline-none mt-0.5"
                    />
                  </div>
                </div>

                {passwordError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                {passwordSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{dict.profile.passwordUpdated}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="self-start px-5 py-2.5 rounded-xl bg-[#087FF5] hover:bg-[#062B72] text-white text-xs font-bold transition-all cursor-pointer mt-1"
                >
                  {dict.profile.updatePassword}
                </button>
              </form>

              {/* Two-Factor Authentication Status */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <KeyRound className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-[#062B72] block">
                      {dict.profile.twoFactorAuth}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {dict.profile.twoFactorDesc}
                    </span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold shrink-0">
                  {locale === "am" ? "ነቅቷል (Active)" : "Active"}
                </span>
              </div>

              {/* Active Logged-in Devices */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3">
                <Laptop className="w-5 h-5 text-slate-500 shrink-0" />
                <div>
                  <span className="text-xs font-bold text-[#062B72] block">
                    {dict.profile.activeSessions}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    {dict.profile.currentSession}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          <div className="w-48 h-8 bg-slate-200 rounded-xl animate-pulse" />
          <div className="w-full h-96 bg-white border border-[#e2eaf4] rounded-3xl animate-pulse" />
        </div>
      }
    >
      <ProfilePageInner />
    </Suspense>
  );
}
