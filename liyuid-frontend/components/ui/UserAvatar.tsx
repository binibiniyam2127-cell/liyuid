"use client";

import React, { useState, useEffect } from "react";

interface UserAvatarProps {
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showPhotoIfAvailable?: boolean;
}

export function getInitials(name?: string): string {
  if (!name) return "U";
  const trimmed = name.trim();
  const baseName = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;
  const parts = baseName.split(/\s+/);
  if (parts.length >= 2 && parts[0] && parts[1]) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return baseName.charAt(0).toUpperCase();
}

export function formatCapitalized(name?: string): string {
  if (!name) return "User";
  const trimmed = name.trim();
  const baseName = trimmed.includes("@") ? trimmed.split("@")[0] : trimmed;
  return baseName
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

const sizeClasses = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-12 h-12 text-base",
  xl: "w-14 h-14 text-lg",
};

export function UserAvatar({
  name = "User",
  size = "md",
  className = "",
  showPhotoIfAvailable = true,
}: UserAvatarProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const initials = getInitials(name);

  useEffect(() => {
    if (showPhotoIfAvailable && typeof window !== "undefined") {
      const stored = localStorage.getItem("liyuid_user_avatar");
      if (stored) {
        setPhotoUrl(stored);
      }
    }
  }, [showPhotoIfAvailable]);

  if (photoUrl) {
    return (
      <img
        src={photoUrl}
        alt={formatCapitalized(name)}
        className={`${sizeClasses[size]} rounded-full object-cover border border-slate-200 shadow-xs ring-2 ring-white shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-tr from-[#087FF5] to-[#00B9F2] text-white flex items-center justify-center font-black uppercase shadow-xs ring-2 ring-white shrink-0 select-none ${className}`}
    >
      {initials}
    </div>
  );
}
