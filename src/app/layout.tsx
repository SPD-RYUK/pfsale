import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/site/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PatentSale — Turn unused patents into commercial opportunities",
  description:
    "PatentSale connects unused granted patents with buyers, licensees, and assignees who can commercialize them. A real storefront for your IP — discoverable, evaluable, actionable.",
  keywords: ["patents", "patent marketplace", "license patent", "sell patent", "IP commercialization", "PatentSale"],
  authors: [{ name: "PatentSale" }],
  openGraph: {
    title: "PatentSale — Turn unused patents into commercial opportunities",
    description: "A marketplace for unused granted patents. Discover, evaluate, and commercialize IP.",
    siteName: "PatentSale",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
          <SonnerToaster richColors position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
