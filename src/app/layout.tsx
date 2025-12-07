import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Mono } from "next/font/google"; // Restore original fonts
import "./globals.css";

import { ClerkProvider } from "@clerk/nextjs";
import { ConvexProviderWrapper } from "@/components/ConvexProviderWrapper";
import { PosthogInit } from "./posthog-init";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "PLEASE PLEASE PLEASE! — Virtual Ticket Machine",
  description: "Virtual Ticket Machine",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <meta
            name="apple-mobile-web-app-title"
            content="PLEASE PLEASE PLEASE!"
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} ${spaceMono.variable} antialiased`}
        >
          <PosthogInit>
            <ConvexProviderWrapper>{children}</ConvexProviderWrapper>
          </PosthogInit>
        </body>
      </html>
    </ClerkProvider>
  );
}
