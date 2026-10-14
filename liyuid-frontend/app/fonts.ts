import { Sora, Noto_Sans_Ethiopic } from "next/font/google";

export const sora = Sora({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
  variable: "--font-sora",
});

export const notoSansEthiopic = Noto_Sans_Ethiopic({
  subsets: ["ethiopic"],
  weight: ["400", "600"],
  display: "swap",
  variable: "--font-noto-ethiopic",
});