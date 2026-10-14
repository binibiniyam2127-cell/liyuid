import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { sora, notoSansEthiopic } from "./fonts";
import { LocaleProvider } from "@/lib/locale-context";
import { AuthProvider } from "@/lib/auth-context";
import { Locale } from "@/lib/dictionaries";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "LIYUID - Lost & Found Recovery",
  description: "AI-assisted lost-and-found web application for Ethiopia.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EEF2F8" },
    { media: "(prefers-color-scheme: dark)", color: "#060E1C" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value as Locale | undefined;
  const initialLocale: Locale = localeCookie === "am" ? "am" : "en";

  return (
    <html
      lang={initialLocale}
      className={`${sora.variable} ${notoSansEthiopic.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased bg-bg text-ink min-h-screen">
        <LocaleProvider initialLocale={initialLocale}>
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors closeButton duration={3500} />
          </AuthProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}