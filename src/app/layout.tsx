import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { auth } from "@/auth";
import { AuthSessionProvider } from "@/components/auth/session-provider";
import { PWARegister } from "@/components/pwa/pwa-register";

const inter = Inter({ subsets: ["latin", "cyrillic"], display: "swap", variable: "--font-sans" });
const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], display: "swap", variable: "--font-display" });

export const metadata: Metadata = {
  title: "Spotlight Learning — AI для учителей и учеников Spotlight 2–8",
  description:
    "Современная AI-платформа для изучения английского по учебнику Spotlight: генератор заданий, тесты, планы уроков, аналитика, Lumos AI.",
  keywords: ["Spotlight", "английский", "учитель", "ученик", "AI", "Lumos", "ФГОС"],
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Spotlight",
    statusBarStyle: "black-translucent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f8fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1122" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="ru" suppressHydrationWarning className={`${inter.variable} ${jakarta.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var raw = localStorage.getItem("spotlight-learning-store");
                var t = raw && JSON.parse(raw)?.state?.theme;
                if (t === "dark") document.documentElement.classList.add("dark");
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <AuthSessionProvider session={session}>{children}</AuthSessionProvider>
        <PWARegister />
      </body>
    </html>
  );
}
