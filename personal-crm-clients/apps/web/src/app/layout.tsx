import type { Metadata } from "next";
import { DM_Sans, Fraunces } from "next/font/google";

import { Providers } from "@/components/providers";

import "./globals.css";

const sans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans"
});

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display"
});

export const metadata: Metadata = {
  description: "A modern personal CRM for relationship intelligence.",
  title: "Personal CRM"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${sans.variable} ${display.variable} crm-surface font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

