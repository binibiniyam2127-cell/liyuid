import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        card: "var(--card)",
        ink: "var(--ink)",
        mute: "var(--mute)",
        line: "var(--line)",
        brand: {
          DEFAULT: "var(--brand)",
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
        },
        gold: "var(--gold)",
        ok: "var(--ok)",
        okbg: "var(--okbg)",
        bad: "var(--bad)",
        badbg: "var(--badbg)",
        warn: "var(--warn)",
        warnbg: "var(--warnbg)",
        bar: "var(--bar)",
        head: "var(--head)",
        theirs: "var(--theirs)",
        staff: "var(--staff)",
      },
      fontFamily: {
        sans: ["var(--font-sora)", "var(--font-noto-ethiopic)", "system-ui", "sans-serif"],
        amharic: ["var(--font-noto-ethiopic)", "var(--font-sora)", "sans-serif"],
      },
      minHeight: {
        touch: "44px",
      },
      minWidth: {
        touch: "44px",
      },
    },
  },
  plugins: [],
};

export default config;