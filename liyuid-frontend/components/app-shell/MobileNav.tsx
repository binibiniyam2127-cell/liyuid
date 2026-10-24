"use client";

import React from "react";
import Link from "next/link";
import {
  ArrowLeftRight,
  Home,
  LogOut,
  Menu,
  MessageSquare,
  PlusCircle,
  Search,
  User,
  X,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";
import { NavItem } from "./DesktopSidebar";

interface MobileNavProps {
  pathname: string;
  userNavItems: NavItem[];
  dict: any;
  locale: string;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  onSignOut: () => void;
}

export function MobileNav({
  pathname,
  userNavItems,
  dict,
  locale,
  mobileOpen,
  setMobileOpen,
  onSignOut,
}: MobileNavProps) {
  return (
    <>
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
                onSignOut();
              }}
              className="px-3 py-2 text-xs text-rose-300 flex items-center gap-2 text-left"
            >
              <LogOut className="w-4 h-4" />
              <span>{dict.nav.signOut}</span>
            </button>
          </div>
        </div>
      )}

      {/* MOBILE BOTTOM NAVIGATION BAR */}
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
    </>
  );
}
