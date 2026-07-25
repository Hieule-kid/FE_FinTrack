import type { Metadata, Viewport } from "next";
import { Manrope, Space_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import { AppShell } from "@/components/common/app-shell";
import { PwaProvider } from "@/components/pwa/pwa-provider";
import { SerwistProvider } from "@/components/pwa/serwist-provider";
import { env } from "@/config/env";
import "./tailwind.css";
import "./globals.scss";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const APP_NAME = env.appName;

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_NAME,
    template: `%s - ${APP_NAME}`,
  },
  description: "Financial planning and savings goals tracker",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#2158d8",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const content = (
    <PwaProvider>
      <AppShell>{children}</AppShell>
    </PwaProvider>
  );

  return (
    <html lang="en">
      <body className={`${manrope.variable} ${spaceGrotesk.variable}`} suppressHydrationWarning>
        {process.env.NODE_ENV === "production" ? (
          <SerwistProvider swUrl="/serwist/sw.js" reloadOnOnline={false} cacheOnNavigation={true}>{content}</SerwistProvider>
        ) : (
          content
        )}
      </body>
    </html>
  );
}
