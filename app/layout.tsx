import type { Metadata } from "next";
import { Inter } from "next/font/google";
import SiteChrome from "@/components/SiteChrome";
import { CartProvider } from "@/lib/cart-context";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Makmur A3'S — Distribusi Kebutuhan HORECA",
  description:
    "Makmur A3'S menyediakan food packaging, plastic packaging, paper packaging, aluminium foil, dan kebutuhan operasional untuk hotel, restoran, dan katering di Jabodetabek dan sekitarnya.",
  icons: {
    icon: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased text-ink bg-white pb-16 md:pb-0`}
        suppressHydrationWarning
      >
        <CartProvider>
          <SiteChrome>{children}</SiteChrome>
        </CartProvider>
      </body>
    </html>
  );
}
