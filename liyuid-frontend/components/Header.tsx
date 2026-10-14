"use client";

import React from "react";
import Link from "next/link";
import { HelpCircle, Settings } from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { LanguageSwitch } from "@/components/LanguageSwitch";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export interface HeaderProps {
  variant?: "user" | "staff";
  showActions?: boolean;
  className?: string;
}

export function Header({
  variant = "user",
  showActions = true,
  className = "",
}: HeaderProps) {
  const isStaff = variant === "staff";

  return (
    <header
      role="banner"
      className={`w-full max-w-[390px] mx-auto rounded-2xl p-3 flex items-center justify-between select-none transition-colors ${
        isStaff ? "bg-staff text-white shadow-md" : "bg-head text-card"
      } ${className}`}
    >
      {/* Brand Logo & Name */}
      <Link
        href={isStaff ? "/staff/dashboard" : "/home"}
        className="flex items-center gap-2.5 rounded-lg focus-visible:outline-3 focus-visible:outline-gold focus-visible:outline-offset-2"
      >
        <Logo size={32} />

        <div className="flex flex-col leading-none">
          <span className="font-extrabold tracking-wide text-[17px] text-card">
            {isStaff ? "LIYUID Staff" : "LIYUID"}
          </span>
          {!isStaff && (
            <span className="text-[9.5px] text-mute font-medium tracking-tight mt-0.5">
              Find · Verify · Reunite
            </span>
          )}
        </div>
      </Link>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex items-center gap-1.5">
          {!isStaff && (
            <>
              {/* Help */}
              <Link
                href="/help"
                aria-label="Help and FAQ"
                className="w-9 h-9 min-h-[44px] min-w-[44px] rounded-full border border-white/20 hover:border-white/50 text-white grid place-items-center transition-colors focus-visible:outline-3 focus-visible:outline-gold focus-visible:outline-offset-2"
              >
                <HelpCircle className="w-4 h-4 stroke-[2]" />
              </Link>

              {/* Settings */}
              <Link
                href="/settings"
                aria-label="Settings and Security"
                className="w-9 h-9 min-h-[44px] min-w-[44px] rounded-full border border-white/20 hover:border-white/50 text-white grid place-items-center transition-colors focus-visible:outline-3 focus-visible:outline-gold focus-visible:outline-offset-2"
              >
                <Settings className="w-4 h-4 stroke-[2]" />
              </Link>

              {/* Dark/Light Mode */}
              <ThemeToggle className="w-9 h-9 min-h-[44px] min-w-[44px] !bg-transparent !border-white/20 hover:!border-white/50 !text-white" />
            </>
          )}

          {/* Bilingual Switcher */}
          <LanguageSwitch className="!bg-transparent !border-white/30 hover:!border-white/60 !text-white text-xs !py-1 !px-2.5 !min-h-[44px]" />
        </div>
      )}
    </header>
  );
}