"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LucideIcon } from "lucide-react";

export interface TabItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface TabBarProps {
  items: TabItem[];
}

export function TabBar({ items }: TabBarProps) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-line flex items-center justify-around px-2 pb-[env(safe-area-inset-bottom,0px)]"
    >
      {items.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`flex-1 min-h-[56px] min-w-0 flex flex-col items-center justify-center gap-1 text-[11.5px] transition-colors ${
              isActive
                ? "text-brand font-semibold border-t-2 border-gold -mt-[1px]"
                : "text-mute hover:text-ink font-normal"
            }`}
          >
            <Icon className="w-5 h-5 stroke-[1.8]" />
            <span className="truncate w-full text-center px-1">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}