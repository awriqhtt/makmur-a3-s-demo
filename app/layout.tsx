import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LocationAvailabilityBanner from "@/components/LocationAvailabilityBanner";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";
import MobileBottomBar from "@/components/MobileBottomBar";
import SiteChrome from "@/components/SiteChrome";
import { CartProvider } from "@/lib/cart-context";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Makmur A3'S — Partner Packaging & Supply",
  description:
    "Makmur A3'S menyediakan food packaging, plastic packaging, paper packaging, aluminium foil, dan kebutuhan operasional untuk restoran, hotel, retail, dan dapur industri di seluruh Indonesia.",
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
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased text-ink bg-white pb-16 md:pb-0`}
        suppressHydrationWarning
      >
        <CartProvider>
          <Suspense fallback={null}>
            <Header />
          </Suspense>
          {children}
          <LocationAvailabilityBanner />
          <Footer />
          <WhatsAppFloatingButton />
          <Suspense fallback={null}>
            <MobileBottomBar />
          </Suspense>
        </CartProvider>
      </body>
    </html>
  );
}
