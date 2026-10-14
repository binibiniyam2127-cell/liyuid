"use client";

import React from "react";
import { useT } from "@/lib/locale-context";

export function LanguageSwitch({ className = "" }: { className?: string }) {
  const { locale, setLocale } = useT();

  const toggle = () => {
    setLocale(locale === "en" ? "am" : "en");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={locale === "en" ? "Switch to Amharic" : "ወደ እንግሊዝኛ ቀይር"}
      className={`min-h-[44px] px-3.5 py-1.5 rounded-full border border-line bg-card text-ink font-semibold text-xs tracking-normal transition-colors hover:border-brand focus-visible:outline-2 ${className}`}
    >
      {locale === "en" ? "አማርኛ" : "English"}
    </button>
  );
}