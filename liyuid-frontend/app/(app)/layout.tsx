"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  FileText,
  Search,
  MessageSquare,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  PlusCircle,
  ArrowLeftRight,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/locale-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, isAuthenticated, isLoading } = useAuth();
  const { dict, locale } = useT();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Operational Navigation Items (Profile moved to footer)
  const userNavItems = [
    { href: "/home", label: dict.nav.home, icon: Home },
    { href: "/reports", label: dict.nav.reports, icon: FileText },
    { href: "/matches", label: dict.nav.matches, icon: Search },
    { href: "/messages", label: dict.nav.messages, icon: MessageSquare },
    { href: "/notifications", label: dict.nav.notifications, icon: Bell, badge: 1 },
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isLoading && !isAuthenticated && pathname !== "/verify") {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [mounted, isLoading, isAuthenticated, pathname, router]);

  if (pathname === "/verify") {
    return <>{children}</>;
  }

  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f8fc]">
        <div className="w-8 h-8 border-3 border-[#0088ff] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      await logout();
    } catch {
      // ignore
    }
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#f4f8fc] text-[#0d2a54] flex flex-col md:flex-row font-sans">
      {/* DESKTOP DEEP NAVY SIDEBAR */}
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

        {/* Bottom: Profile & Sign out (Settings removed, Profile placed in footer) */}
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
            onClick={handleSignOut}
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-full text-xs font-semibold text-rose-300 hover:bg-rose-500/10 hover:text-rose-200 transition-all text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>{dict.nav.signOut}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden bg-[#0c2340] text-white p-4 flex items-center justify-between sticky top-0 z-40 border-b border-white/10">
        <Link href="/home" className="flex items-center gap-2">
          <Logo size={28} showText={true} textColor="light" />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 rounded-lg bg-white/10 text-white"
          aria-label="Toggle Menu"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile Drawer Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0c2340] text-white p-4 flex flex-col gap-2 z-20 border-b border-white/10 animate-fadeIn">
          {userNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold ${
                pathname === item.href ? "bg-[#1982fc] text-white" : "text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
          <div className="pt-2 border-t border-white/10 flex flex-col gap-1">
            <Link
              href="/profile"
              onClick={() => setMobileOpen(false)}
              className={`px-3 py-2 text-xs flex items-center gap-2 rounded-xl font-semibold ${
                pathname === "/profile" ? "bg-[#1982fc] text-white" : "text-slate-300"
              }`}
            >
              <User className="w-4 h-4" />
              <span>{dict.nav.profile}</span>
            </Link>
            <button
              onClick={() => {
                setMobileOpen(false);
                handleSignOut();
              }}
              className="px-3 py-2 text-xs text-rose-300 flex items-center gap-2 text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>{dict.nav.signOut}</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full min-h-screen p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 overflow-x-hidden">
        {children}
      </main>

      {/* MOBILE BOTTOM NAVIGATION BAR (Fixed Thumb Navigation for iPhone / Android) */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] px-2 py-1.5 flex items-center justify-around"
        aria-label="Mobile Bottom Navigation"
      >
        <Link
          href="/home"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
            pathname === "/home" || pathname === "/dashboard"
              ? "text-[#1982fc]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>{dict.nav.home}</span>
        </Link>

        <Link
          href="/reports/new"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
            pathname.startsWith("/reports/new") || pathname.startsWith("/report")
              ? "text-[#1982fc]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <PlusCircle className="w-5 h-5 mb-0.5" />
          <span>{locale === "am" ? "ሪፖርት" : "Report"}</span>
        </Link>

        <Link
          href="/matches"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all relative ${
            pathname === "/matches"
              ? "text-[#1982fc]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <Search className="w-5 h-5 mb-0.5" />
          <span>{dict.nav.matches}</span>
        </Link>

        <Link
          href="/messages"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
            pathname.startsWith("/messages")
              ? "text-[#1982fc]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <MessageSquare className="w-5 h-5 mb-0.5" />
          <span>{dict.nav.messages}</span>
        </Link>

        <Link
          href="/handover"
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl text-[10px] font-bold transition-all ${
            pathname.startsWith("/handover")
              ? "text-[#1982fc]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <ArrowLeftRight className="w-5 h-5 mb-0.5" />
          <span>{locale === "am" ? "ርክክብ" : "Handover"}</span>
        </Link>
      </nav>
    </div>
  );
}
