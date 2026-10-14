"use client";

import React, { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const active = document.documentElement.getAttribute("data-theme");
    if (active === "dark" || (!active && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  }, []);

  const toggle = () => {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
      className={`min-h-[44px] min-w-[44px] p-2.5 rounded-full border border-line bg-card text-ink flex items-center justify-center cursor-pointer transition-colors hover:border-brand focus-visible:outline-3 focus-visible:outline-gold focus-visible:outline-offset-2 ${className}`}
    >
      {theme === "light" ? <Moon className="w-5 h-5 stroke-[2]" /> : <Sun className="w-5 h-5 stroke-[2]" />}
    </button>
  );
}