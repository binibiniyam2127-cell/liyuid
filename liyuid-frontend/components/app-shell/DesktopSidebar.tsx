"use client";

import React from "react";
import Link from "next/link";
import { LogOut, User } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface DesktopSidebarProps {
  pathname: string;
  userNavItems: NavItem[];
  dict: any;
  onSignOut: () => void;
}

export function DesktopSidebar({
  pathname,
  userNavItems,
  dict,
  onSignOut,
}: DesktopSidebarProps) {
  return (
    <aside className="hidden md:flex md:w-60 bg-[#0c2340] text-white flex-col justify-between p-4 sticky top-0 h-screen z-30 shadow-xl shrink-0 select-none">
      <div className="flex flex-col gap-6">
        <Link href="/home" className="flex items-center gap-2.5 px-2 py-1">
          <Logo size={36} showText={true} textColor="light" />
        </Link>

        {/* Navigation Links */}
        <nav className="flex flex-col gap-1.5" aria-label="Main Navigation">
          {userNavItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href === "/home" && pathname === "/dashboard") ||
              (item.href === "/reports" && pathname.startsWith("/report"));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-[#1982fc] text-white shadow-md shadow-[#1982fc]/30"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom: Profile & Sign out */}
      <div className="flex flex-col gap-1.5 pt-4 border-t border-white/10">
        <Link
          href="/profile"
          className={`flex items-center justify-between px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all ${
            pathname === "/profile"
              ? "bg-[#1982fc] text-white shadow-md shadow-[#1982fc]/30"
              : "text-slate-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 shrink-0" />
            <span>{dict.nav.profile}</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
        </Link>

        <button
          onClick={onSignOut}
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-semibold text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition-all text-left cursor-pointer"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>{dict.nav.signOut}</span>
        </button>
      </div>
    </aside>
  );
}
