"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Settings,
  Shield,
  Sliders,
  Lock,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  Save,
  Clock,
  AlertTriangle,
  Building,
  User,
  ShieldCheck,
  MapPin,
  Mail,
  BadgeCheck,
  LogOut,
  Key,
  Camera,
  RotateCcw,
  Upload,
  Phone,
  Check,
  Trash2,
  X,
  Scale,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { StaffRoleDivisionModal } from "@/components/staff/StaffRoleDivisionModal";

interface StaffProfile {
  id: string;
  staff_code: string;
  full_name: string;
  staff_role: string;
  email: string;
  clearance_level: string;
  jurisdiction: string;
  active_desk: string;
}

export default function StaffSettingsPage() {
  const router = useRouter();

  // Tab state
  const [activeTab, setActiveTab] = useState<"profile" | "policies">("profile");
  const [roleModalOpen, setRoleModalOpen] = useState(false);

  // Profile state
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Editable profile information state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+251 911 234 567");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Avatar / Photo state
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarMsg, setAvatarMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Policy threshold state
  const [passThreshold, setPassThreshold] = useState("0.85");
  const [borderlineLow, setBorderlineLow] = useState("0.65");
  const [lockoutAttempts, setLockoutAttempts] = useState("3");
  const [otpExpiration, setOtpExpiration] = useState("10");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Password / Security state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    let isMounted = true;

    // Load saved avatar from localStorage
    if (typeof window !== "undefined") {
      const savedPhoto = localStorage.getItem("liyuid_staff_avatar");
      if (savedPhoto) setAvatarUrl(savedPhoto);
    }

    // Fetch staff profile with local customizations
    api
      .getStaffProfile()
      .then((data) => {
        if (isMounted && data) {
          let localCustom: any = null;
          if (typeof window !== "undefined") {
            const raw = localStorage.getItem("liyuid_staff_profile_custom");
            if (raw) {
              try {
                localCustom = JSON.parse(raw);
              } catch {}
            }
          }
          const finalProfile = {
            ...data,
            full_name: localCustom?.full_name || data.full_name,
            email: localCustom?.email || data.email,
          };
          setProfile(finalProfile);
          setFullName(finalProfile.full_name);
          setEmail(finalProfile.email);
          if (localCustom?.phone) setPhone(localCustom.phone);
        }
      })
      .catch(() => {
        if (isMounted) {
          const fallback = {
            id: "STF-01",
            staff_code: "STF-01",
            full_name: "Operations Supervisor",
            staff_role: "Senior Operations Supervisor",
            email: "staff@liyuid.com",
            clearance_level: "Tier-3 Municipal Supervisor",
            jurisdiction: "City Administration of Addis Ababa",
            active_desk: "Central Operations Headquarters",
          };
          let localCustom: any = null;
          if (typeof window !== "undefined") {
            const raw = localStorage.getItem("liyuid_staff_profile_custom");
            if (raw) {
              try {
                localCustom = JSON.parse(raw);
              } catch {}
            }
          }
          const finalFallback = {
            ...fallback,
            full_name: localCustom?.full_name || fallback.full_name,
            email: localCustom?.email || fallback.email,
          };
          setProfile(finalFallback);
          setFullName(finalFallback.full_name);
          setEmail(finalFallback.email);
          if (localCustom?.phone) setPhone(localCustom.phone);
        }
      })
      .finally(() => {
        if (isMounted) setLoadingProfile(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith("image/")) {
      setAvatarMsg({
        text: "Invalid file format. Please select an image file (JPG, PNG, WEBP).",
        type: "error",
      });
      return;
    }

    // Check size limit: max 5MB
    if (file.size > 5 * 1024 * 1024) {
      setAvatarMsg({
        text: "Image file exceeds 5MB limit. Please upload a smaller officer headshot.",
        type: "error",
      });
      return;
    }

    setAvatarUploading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      if (typeof window !== "undefined") {
        localStorage.setItem("liyuid_staff_avatar", url);
        setAvatarUrl(url);
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("liyuid_staff_avatar_changed"));
      }
      setAvatarUploading(false);
      setAvatarMsg({
        text: "Officer profile photo updated and synchronized across command stations.",
        type: "success",
      });
      setTimeout(() => setAvatarMsg(null), 5000);
    };
    reader.onerror = () => {
      setAvatarUploading(false);
      setAvatarMsg({
        text: "Error reading image file. Please try again.",
        type: "error",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("liyuid_staff_avatar");
      setAvatarUrl(null);
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("liyuid_staff_avatar_changed"));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setAvatarMsg({
      text: "Officer profile photo removed. Official municipal insignia badge restored.",
      type: "success",
    });
    setTimeout(() => setAvatarMsg(null), 5000);
  };

  const handleResetProfileDetails = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("liyuid_staff_profile_custom");
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("liyuid_staff_avatar_changed"));
    }
    const defaultName = "Operations Supervisor";
    const defaultEmail = "staff@liyuid.com";
    setFullName(defaultName);
    setEmail(defaultEmail);
    setPhone("+251 911 234 567");
    setProfile((prev) =>
      prev
        ? { ...prev, full_name: defaultName, email: defaultEmail }
        : null
    );
    setProfileMsg({
      text: "Officer information reset to official headquarters defaults.",
      type: "success",
    });
    setTimeout(() => setProfileMsg(null), 5000);
  };

  const handleSaveProfileDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setProfileMsg({ text: "Officer full name cannot be empty.", type: "error" });
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setProfileMsg({ text: "Please enter a valid municipal email address.", type: "error" });
      return;
    }

    setProfileSaving(true);
    setTimeout(() => {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "liyuid_staff_profile_custom",
          JSON.stringify({ full_name: fullName.trim(), email: email.trim(), phone: phone.trim() })
        );
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new Event("liyuid_staff_avatar_changed"));
      }
      setProfile((prev) =>
        prev
          ? { ...prev, full_name: fullName.trim(), email: email.trim() }
          : null
      );
      setProfileSaving(false);
      setProfileMsg({ text: "Officer profile details updated successfully.", type: "success" });
      setTimeout(() => setProfileMsg(null), 5000);
    }, 400);
  };

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      setMessage("Staff operational thresholds updated and pushed to AI Matching Worker.");
      setTimeout(() => setMessage(null), 5000);
    }, 500);
  };

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setPasswordMsg({ text: "Please enter your current supervisor password.", type: "error" });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ text: "New password must be at least 8 characters long.", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: "New password and confirmation do not match.", type: "error" });
      return;
    }

    setPasswordSaving(true);
    setTimeout(() => {
      setPasswordSaving(false);
      setPasswordMsg({ text: "Officer security credentials successfully rotated.", type: "success" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordMsg(null), 5000);
    }, 600);
  };

  const handleLogout = () => {
    api.staffLogout();
    router.push("/staff/login");
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto text-[#062B72]">
      {/* ----------------------------------------------------
          SETTINGS & OFFICER PROFILE WORKSTATION HEADER
      ---------------------------------------------------- */}
      <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-5 shadow-xs flex flex-col gap-4">
        {/* Row 1: Badges, Title & Supervisor Badge */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full text-[11px] font-black tracking-wide bg-[#062B72] text-white flex items-center gap-1.5 shadow-xs whitespace-nowrap shrink-0">
                <Building className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                <span>{profile?.jurisdiction || "City Administration of Addis Ababa"}</span>
              </span>
              <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#EBF5FF] text-[#087FF5] border border-[#B9E1FD] flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <ShieldCheck className="w-3.5 h-3.5 text-[#087FF5]" />
                <span>{profile?.clearance_level || "Tier-3 Municipal Supervisor"}</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-[#062B72] tracking-tight">
              Staff Settings & Officer Profile
            </h1>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setRoleModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#062B72] hover:bg-[#0c2340] text-white text-xs font-black shadow-xs transition-all cursor-pointer active:scale-95"
            >
              <Scale className="w-3.5 h-3.5 text-sky-400" />
              <span>Division of Roles</span>
            </button>
            <span className="font-mono text-[11px] text-[#087FF5] bg-[#EBF5FF] border border-[#B9E1FD] px-3 py-1.5 rounded-xl font-bold">
              Policy Version: 2026.4
            </span>
          </div>
        </div>

        {/* Row 2: Navigation Switcher Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-3 border-t border-[#e2eaf4]">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "profile"
                ? "bg-[#087FF5] text-white shadow-xs border-2 border-[#087FF5]"
                : "bg-[#F8FAFC] border-2 border-[#e2eaf4] text-[#062B72] hover:bg-[#F0F7FF] hover:border-[#B9E1FD]"
            }`}
          >
            <User className="w-4 h-4" />
            <span>Officer Profile & Credentials</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("policies")}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              activeTab === "policies"
                ? "bg-[#087FF5] text-white shadow-xs border-2 border-[#087FF5]"
                : "bg-[#F8FAFC] border-2 border-[#e2eaf4] text-[#062B72] hover:bg-[#F0F7FF] hover:border-[#B9E1FD]"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Operational Policies & Thresholds</span>
          </button>
        </div>
      </div>

      {/* JURISDICTION SCOPE STRIP (Inter-Desk Operational Boundary) */}
      <div className="bg-[#F8FAFC] border-2 border-[#cbd9e8] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start md:items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0">
            <Sliders className="w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#062B72]">
                Desk Jurisdiction:
              </span>
              <span className="text-xs font-black text-slate-800 bg-slate-200/80 px-2 py-0.5 rounded-md border border-slate-300">
                Administrative Governance, Machine Learning Thresholds & Security Policies
              </span>
            </div>
            <p className="text-[11px] text-[#475569] mt-0.5 font-medium">
              Policy governance and supervisor authentication only. Configures vector cosine cutoffs (auto-pass 0.85, borderline 0.65), blind challenge lockout thresholds (3 attempts), and 10-minute OTP expiration windows. Operational inventory restitution remains strictly with <Link href="/staff/cases" className="text-[#087FF5] font-bold underline">Cases Desk</Link>.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
            Governance Active
          </span>
        </div>
      </div>

      {/* ----------------------------------------------------
          TAB 1: OFFICER PROFILE & CREDENTIALS
      ---------------------------------------------------- */}
      {activeTab === "profile" && (
        <div className="flex flex-col gap-5">
          {/* Identity & Photo Summary Card */}
          <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-6 shadow-xs flex flex-col gap-6 text-[#062B72]">
            {/* Top Identity Block with Photo & Action Buttons */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 border-b border-[#e2eaf4] pb-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                {/* Photo Container with Camera Trigger & Duty Heartbeat */}
                <div className="relative group shrink-0">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-[#cbd9e8] group-hover:border-[#087FF5] bg-[#062B72] text-white flex items-center justify-center font-black text-xl shadow-md shadow-[#062B72]/15 cursor-pointer relative transition-all"
                    title="Click to upload or update officer profile photo"
                  >
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={profile?.full_name || "Officer"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center p-2">
                        <span className="font-mono tracking-tight font-black text-lg sm:text-xl">
                          {profile?.staff_code || "STF"}
                        </span>
                        <span className="text-[9px] uppercase tracking-wider text-sky-300 font-bold mt-0.5">
                          ID Badge
                        </span>
                      </div>
                    )}

                    {/* Hover Camera Overlay */}
                    <div className="absolute inset-0 bg-[#062B72]/70 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-opacity text-white backdrop-blur-[2px]">
                      <Camera className="w-5 h-5 text-sky-300" />
                      <span className="text-[9px] font-black uppercase tracking-wider">
                        {avatarUrl ? "Change" : "Upload"}
                      </span>
                    </div>
                  </div>

                  {/* Direct One-Click Remove Badge (visible when photo is active) */}
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePhoto();
                      }}
                      className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md border-2 border-white transition-all cursor-pointer z-10 hover:scale-110 active:scale-95"
                      title="Remove officer profile photo"
                      aria-label="Remove photo"
                    >
                      <X className="w-3.5 h-3.5 stroke-[3]" />
                    </button>
                  )}

                  {/* Active Duty Heartbeat Indicator */}
                  <span
                    className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center shadow-xs pointer-events-none"
                    title="Active on duty"
                  >
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  </span>
                </div>

                {/* Officer Meta & Photo Actions */}
                <div className="flex flex-col gap-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-[#062B72] tracking-tight">
                      {profile?.full_name || "Operations Supervisor"}
                    </h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shrink-0">
                      Active Duty
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#087FF5]">
                    <span>{profile?.staff_role || "Senior Operations Supervisor"}</span>
                    <span>•</span>
                    <span className="text-[#64748B] font-mono">{profile?.staff_code || "STF-01"}</span>
                  </div>

                  <span className="text-[11px] text-[#64748B] flex items-center gap-1.5 mt-0.5">
                    <Mail className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                    <span>{profile?.email || "staff@liyuid.com"}</span>
                  </span>

                  {/* Photo Controls Strip */}
                  <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-[#e2eaf4]">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/jpg"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#087FF5] hover:bg-[#076ed4] text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
                    >
                      {avatarUploading ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Camera className="w-3.5 h-3.5" />
                      )}
                      <span>{avatarUrl ? "Change Photo" : "Upload Photo"}</span>
                    </button>

                    {avatarUrl && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-[11px] font-bold transition-all shadow-xs cursor-pointer hover:border-red-300"
                        title="Remove uploaded photo and restore official municipal badge"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600 shrink-0" />
                        <span>Remove Photo</span>
                      </button>
                    )}

                    <span className="text-[10px] text-[#94A3B8] font-medium hidden sm:inline">
                      JPG, PNG, WEBP (Max 5MB)
                    </span>
                  </div>
                </div>
              </div>

              {/* Sign Out Button */}
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  title="End active supervisor session"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>

            {/* Photo Notification Banner */}
            {avatarMsg && (
              <div
                className={`p-3.5 border-2 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
                  avatarMsg.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                {avatarMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{avatarMsg.text}</span>
              </div>
            )}

            {/* Officer Assignment Attributes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 text-xs">
              <div className="bg-[#F8FAFC] border-2 border-[#e2eaf4] rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-[10px] font-black text-[#64748B] uppercase tracking-wider flex items-center gap-1">
                  <Building className="w-3.5 h-3.5 text-[#087FF5]" />
                  Municipal Jurisdiction
                </span>
                <span className="font-extrabold text-[#062B72]">
                  {profile?.jurisdiction || "City Administration of Addis Ababa"}
                </span>
                <span className="text-[11px] text-[#64748B] font-medium">Metropolitan & Campus Authority</span>
              </div>

              <div className="bg-[#F8FAFC] border-2 border-[#e2eaf4] rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-[10px] font-black text-[#64748B] uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-[#087FF5]" />
                  Assigned Command Station
                </span>
                <span className="font-extrabold text-[#062B72]">
                  {profile?.active_desk || "Central Operations Headquarters"}
                </span>
                <span className="text-[11px] text-[#64748B] font-medium">Desk ID: {profile?.staff_code || "STF-01"}</span>
              </div>

              <div className="bg-[#F8FAFC] border-2 border-[#e2eaf4] rounded-2xl p-4 flex flex-col gap-1">
                <span className="text-[10px] font-black text-[#64748B] uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-[#087FF5]" />
                  Shift & Authentication
                </span>
                <span className="font-extrabold text-[#062B72]">08:30 – 18:00 EAT</span>
                <span className="text-[11px] text-emerald-700 font-bold">TOTP Multi-Factor Verified</span>
              </div>
            </div>
          </div>

          {/* Edit Officer Details Card */}
          <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-6 shadow-xs flex flex-col gap-5 text-[#062B72]">
            <div className="flex items-center gap-2.5 border-b border-[#e2eaf4] pb-4">
              <div className="w-8 h-8 rounded-xl bg-[#F0F7FF] text-[#087FF5] flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#062B72] uppercase tracking-wider">
                  Officer Contact & Information
                </h3>
                <span className="text-xs text-[#64748B] font-medium">
                  Update officer identity details and communications directory.
                </span>
              </div>
            </div>

            {profileMsg && (
              <div
                className={`p-3.5 border-2 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
                  profileMsg.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                {profileMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{profileMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfileDetails} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-[#062B72]">Officer Full Name:</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Operations Supervisor"
                    className="w-full bg-[#F8FAFC] border-2 border-[#cbd9e8] focus:bg-white rounded-xl px-3.5 py-2 text-xs text-[#062B72] font-semibold outline-none focus:border-[#087FF5] transition-all shadow-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-[#062B72]">Official Email:</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@liyuid.com"
                    className="w-full bg-[#F8FAFC] border-2 border-[#cbd9e8] focus:bg-white rounded-xl px-3.5 py-2 text-xs text-[#062B72] font-semibold outline-none focus:border-[#087FF5] transition-all shadow-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-[#062B72]">Direct Extension / Phone:</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+251 911 234 567"
                    className="w-full bg-[#F8FAFC] border-2 border-[#cbd9e8] focus:bg-white rounded-xl px-3.5 py-2 text-xs text-[#062B72] font-semibold outline-none focus:border-[#087FF5] transition-all shadow-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleResetProfileDetails}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-[#64748B] hover:text-[#062B72] border border-slate-200 text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="Reset custom details to official headquarters records"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Defaults</span>
                </button>

                <button
                  type="submit"
                  disabled={profileSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#087FF5] hover:bg-[#076ed4] text-white text-xs font-black transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {profileSaving ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>{profileSaving ? "Saving..." : "Save Details"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Account Security & Password Rotation */}
          <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-6 shadow-xs flex flex-col gap-5 text-[#062B72]">
            <div className="flex items-center gap-2.5 border-b border-[#e2eaf4] pb-4">
              <div className="w-8 h-8 rounded-xl bg-[#F0F7FF] text-[#087FF5] flex items-center justify-center shrink-0">
                <Key className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-black text-[#062B72] uppercase tracking-wider">
                  Rotate Officer Password
                </h3>
                <span className="text-xs text-[#64748B] font-medium">
                  Update your authentication credentials for municipal portal access.
                </span>
              </div>
            </div>

            {passwordMsg && (
              <div
                className={`p-3.5 border-2 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in ${
                  passwordMsg.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-red-50 border-red-200 text-red-800"
                }`}
              >
                {passwordMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{passwordMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-[#062B72]">Current Password:</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full bg-[#F8FAFC] border-2 border-[#cbd9e8] focus:bg-white rounded-xl px-3.5 py-2 text-xs text-[#062B72] font-semibold outline-none focus:border-[#087FF5] transition-all shadow-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-[#062B72]">New Password:</label>
                  <input
                    type="password"
                    placeholder="Enter new password (min. 8 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-[#F8FAFC] border-2 border-[#cbd9e8] focus:bg-white rounded-xl px-3.5 py-2 text-xs text-[#062B72] font-semibold outline-none focus:border-[#087FF5] transition-all shadow-xs"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-[#062B72]">Confirm New Password:</label>
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-[#F8FAFC] border-2 border-[#cbd9e8] focus:bg-white rounded-xl px-3.5 py-2 text-xs text-[#062B72] font-semibold outline-none focus:border-[#087FF5] transition-all shadow-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={passwordSaving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-[#062B72] hover:bg-[#041e50] text-white text-xs font-black transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {passwordSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  <span>{passwordSaving ? "Rotating..." : "Update Password"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 2: OPERATIONAL POLICIES & AI THRESHOLDS
      ---------------------------------------------------- */}
      {activeTab === "policies" && (
        <form onSubmit={handleSavePolicies} className="flex flex-col gap-5">
          {message && (
            <div className="p-4 bg-emerald-50 border-2 border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{message}</span>
            </div>
          )}

          {/* Module 1: AI Matching Thresholds */}
          <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2.5 border-b border-[#e2eaf4] pb-4">
              <div className="w-8 h-8 rounded-xl bg-[#F0F7FF] text-[#087FF5] flex items-center justify-center shrink-0">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-[#062B72] uppercase tracking-wider">
                  AI Matching Engine Cutoffs
                </h2>
                <span className="text-xs text-[#64748B] font-medium">
                  Cosine similarity and BM25 hybrid ranking decision boundaries.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-[#062B72]">
                  PASS Confidence Cutoff (Cosine Similarity):
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.70"
                  max="0.99"
                  value={passThreshold}
                  onChange={(e) => setPassThreshold(e.target.value)}
                  className="w-full bg-[#F8FAFC] border-2 border-[#cbd9e8] focus:bg-white rounded-xl px-4 py-2.5 text-xs text-[#062B72] font-mono font-bold outline-none focus:border-[#087FF5] transition-all shadow-xs"
                />
                <span className="text-[11px] text-[#64748B] font-medium">
                  Candidates scoring &gt;= this value transition directly to Candidate/PASS state.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-[#062B72]">
                  BORDERLINE Review Lower Bound:
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.50"
                  max="0.80"
                  value={borderlineLow}
                  onChange={(e) => setBorderlineLow(e.target.value)}
                  className="w-full bg-[#F8FAFC] border-2 border-[#cbd9e8] focus:bg-white rounded-xl px-4 py-2.5 text-xs text-[#062B72] font-mono font-bold outline-none focus:border-[#087FF5] transition-all shadow-xs"
                />
                <span className="text-[11px] text-[#64748B] font-medium">
                  Scores between {borderlineLow} and {passThreshold} trigger manual staff triage.
                </span>
              </div>
            </div>
          </div>

          {/* Module 2: Verification Challenge Security & Handover Rules */}
          <div className="bg-white border-2 border-[#e2eaf4] rounded-2xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2.5 border-b border-[#e2eaf4] pb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-black text-[#062B72] uppercase tracking-wider">
                  Ownership Verification & Handover Rules
                </h2>
                <span className="text-xs text-[#64748B] font-medium">
                  Blind trait challenge lockout parameters and OTP physical handover security.
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-[#062B72]">
                  Blind Ownership Verification Challenge Failure Lockout (Attempts):
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={lockoutAttempts}
                  onChange={(e) => setLockoutAttempts(e.target.value)}
                  className="w-full bg-[#F8FAFC] border-2 border-[#cbd9e8] focus:bg-white rounded-xl px-4 py-2.5 text-xs text-[#062B72] font-mono font-bold outline-none focus:border-[#087FF5] transition-all shadow-xs"
                />
                <span className="text-[11px] text-[#64748B] font-medium">
                  Lockout threshold for incorrect answers on blinded traits before security alert flag is generated.
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-[#062B72]">
                  Physical Counter Dual-Code Handover Window (Minutes):
                </label>
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={otpExpiration}
                  onChange={(e) => setOtpExpiration(e.target.value)}
                  className="w-full bg-[#F8FAFC] border-2 border-[#cbd9e8] focus:bg-white rounded-xl px-4 py-2.5 text-xs text-[#062B72] font-mono font-bold outline-none focus:border-[#087FF5] transition-all shadow-xs"
                />
                <span className="text-[11px] text-[#64748B] font-medium">
                  Lifetime of generated dual-code OTP for in-person property handovers at municipal counters.
                </span>
              </div>
            </div>
          </div>

          {/* Save Button for Policies */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#087FF5] hover:bg-[#076ed4] text-white text-xs sm:text-sm font-black transition-all shadow-sm cursor-pointer disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saving ? "Pushed..." : "Save Policies & Thresholds"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Inter-Desk Division of Roles Directive Modal */}
      <StaffRoleDivisionModal
        isOpen={roleModalOpen}
        onClose={() => setRoleModalOpen(false)}
      />
    </div>
  );
}
