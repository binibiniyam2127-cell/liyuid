import { Sora } from "next/font/google";

export const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-sora",
});

// Decoupled from next-font-loader to prevent webpack css-loader compilation errors
// caused by Google Fonts variable font-stretch metadata in CI/CD build environments.
// Loaded via high-performance preconnected Google CDN link in app/layout.tsx.
export const notoSansEthiopic = {
  variable: "font-noto-ethiopic",
  className: "font-noto-ethiopic",
};