"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  AlertTriangle,
  Flag,
  FileText,
  BarChart2,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { getStaffToken, setStaffToken } from "@/lib/api";

import { StaffStationProvider } from "@/components/staff/StaffStationContext";

const STAFF_NAV_ITEMS = [
  { href: "/staff/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/staff/cases", label: "Cases", icon: FolderOpen },
  { href: "/staff/disputes", label: "Disputes", icon: AlertTriangle },
  { href: "/staff/flags", label: "Flags", icon: Flag },
  { href: "/staff/reports", label: "Reports", icon: FileText },
  { href: "/staff/analytics", label: "Analytics", icon: BarChart2 },
];

export default function StaffLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState<boolean | null>(null);

  React.useEffect(() => {
    if (pathname === "/staff/login") {
      setIsStaffAuthenticated(true);
      return;
    }
    const token = getStaffToken();
    if (!token) {
      setIsStaffAuthenticated(false);
      router.push(`/staff/login?redirect=${encodeURIComponent(pathname)}`);
    } else {
      setIsStaffAuthenticated(true);
    }
  }, [pathname, router]);

  // If on staff login page, render cleanly without staff sidebar
  if (pathname === "/staff/login") {
    return <>{children}</>;
  }

  // Prevent flash of staff portal before auth check completes
  if (isStaffAuthenticated === null || isStaffAuthenticated === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f8fc]">
        <div className="w-8 h-8 border-3 border-[#0088ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogout = () => {
    setStaffToken(null);
    router.push("/staff/login");
  };

  return (
    <StaffStationProvider>
      <div data-theme="light" className="min-h-screen bg-[#f4f8fc] text-[#0d2a54] flex flex-col md:flex-row font-sans">
        {/* ----------------------------------------------------
            DESKTOP DEEP NAVY SIDEBAR (Screen 14 Reference)
        ---------------------------------------------------- */}
        <aside className="hidden md:flex md:w-60 bg-[#0c2340] text-white flex-col justify-between p-4 sticky top-0 h-screen z-30 shadow-xl shrink-0 select-none">
          <div className="flex flex-col gap-6">
            {/* Permanent LIYUID Logo */}
            <Link href="/staff/dashboard" className="flex items-center gap-2.5 px-2 py-1">
              <Logo size={36} showText={true} textColor="light" />
            </Link>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-1.5" aria-label="Staff Navigation">
              {STAFF_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href === "/staff/dashboard" && pathname === "/staff");

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-semibold transition-all ${
                      isActive
                        ? "bg-[#1982fc] text-white shadow-md shadow-[#1982fc]/30"
                        : "text-slate-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Bottom: Settings & Sign out */}
          <div className="flex flex-col gap-1 pt-4 border-t border-white/10">
            <Link
              href="/staff/settings"
              className={`flex items-center gap-3 px-3.5 py-2 rounded-full text-xs font-semibold transition-all ${
                pathname === "/staff/settings"
                  ? "bg-[#1982fc] text-white"
                  : "text-slate-300 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Settings className="w-4 h-4 shrink-0" />
              <span>Settings</span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-3 px-3.5 py-2 rounded-full text-xs font-semibold text-slate-300 hover:bg-rose-500/20 hover:text-rose-300 transition-all text-left cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign out</span>
            </button>
          </div>
        </aside>

        {/* ----------------------------------------------------
            MOBILE TOP BAR (< md)
        ---------------------------------------------------- */}
        <header className="md:hidden bg-[#0c2340] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-30 shadow-md">
          <Link href="/staff/dashboard" className="flex items-center gap-2">
            <Logo size={28} showText={true} textColor="light" />
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 rounded-lg bg-white/10 text-white"
            aria-label="Toggle Staff Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </header>

        {/* Mobile Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0c2340] text-white p-4 flex flex-col gap-2 z-20 border-b border-white/10">
            {STAFF_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${
                  pathname === item.href ? "bg-[#1982fc] text-white" : "text-slate-300"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            ))}
            <div className="pt-2 border-t border-white/10 flex flex-col gap-1">
              <Link
                href="/staff/settings"
                onClick={() => setMobileMenuOpen(false)}
                className="px-3 py-2 text-xs text-slate-300 flex items-center gap-2"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </Link>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="px-3 py-2 text-xs text-rose-300 flex items-center gap-2 text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------
            MAIN CONTENT AREA (Matches s14_staff.png)
        ---------------------------------------------------- */}
        <main className="flex-1 w-full min-h-screen p-4 sm:p-6 lg:p-7 overflow-x-hidden">
          {children}
        </main>
      </div>
    </StaffStationProvider>
  );
}
