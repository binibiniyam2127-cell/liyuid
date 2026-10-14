"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { dictionaries, Locale, Dictionary } from "@/lib/dictionaries";

interface LocaleContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  dict: Dictionary;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === "object" && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  return typeof current === "string" ? current : path;
}

export function LocaleProvider({
  children,
  initialLocale = "en",
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = newLocale;
  };

  useEffect(() => {
    const match = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]*)/);
    if (match && (match[1] === "en" || match[1] === "am")) {
      const active = match[1] as Locale;
      setLocaleState(active);
      document.documentElement.lang = active;
    }
  }, []);

  const dict = dictionaries[locale] || dictionaries.en;

  const t = (key: string): string => {
    const val = getNestedValue(dict as unknown as Record<string, unknown>, key);
    return val !== key ? val : getNestedValue(dictionaries.en as unknown as Record<string, unknown>, key);
  };

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, dict }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useT() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useT must be used within a LocaleProvider");
  }
  return ctx;
}