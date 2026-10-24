"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  FileText,
  Home,
  MessageSquare,
  Search,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useT } from "@/lib/locale-context";
import { DesktopSidebar, NavItem } from "./DesktopSidebar";
import { MobileNav } from "./MobileNav";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, isAuthenticated, isLoading } = useAuth();
  const { dict, locale } = useT();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Operational Navigation Items (Profile moved to footer)
  const userNavItems: NavItem[] = [
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
      <DesktopSidebar
        pathname={pathname}
        userNavItems={userNavItems}
        dict={dict}
        onSignOut={handleSignOut}
      />

      <MobileNav
        pathname={pathname}
        userNavItems={userNavItems}
        dict={dict}
        locale={locale}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
        onSignOut={handleSignOut}
      />

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full min-h-screen p-4 sm:p-6 lg:p-8 pb-24 md:pb-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
