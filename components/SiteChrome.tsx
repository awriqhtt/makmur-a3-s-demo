"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LocationAvailabilityBanner from "@/components/LocationAvailabilityBanner";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";
import MobileBottomBar from "@/components/MobileBottomBar";

// Halaman-halaman yang sengaja gak pakai chrome situs (navbar, footer, dst).
// /invoice (legacy) dan /admin (login + semua tool internal) bukan bagian
// dari public site.
const CHROMELESS_PREFIXES = ["/invoice", "/admin"];

export default function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChromeless = CHROMELESS_PREFIXES.some((p) => pathname.startsWith(p));

  // /bantuan tetap pakai chrome situs (Header + Footer), tapi
  // LocationAvailabilityBanner dan WhatsAppFloatingButton sengaja gak
  // dimunculin — gak relevan di halaman chat FAQ dan bikin dobel sama
  // tombol WA yang udah ada di dalam widget chat-nya sendiri.
  const isBantuan = pathname === "/bantuan";

  if (isChromeless) return <>{children}</>;

  return (
    <>
      <Suspense fallback={null}>
        <Header />
      </Suspense>
      {children}
      {!isBantuan && <LocationAvailabilityBanner />}
      <Footer />
      {!isBantuan && <WhatsAppFloatingButton />}
      <Suspense fallback={null}>
        <MobileBottomBar />
      </Suspense>
    </>
  );
}
