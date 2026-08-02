"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LocationAvailabilityBanner from "@/components/LocationAvailabilityBanner";
import WhatsAppFloatingButton from "@/components/WhatsAppFloatingButton";
import MobileBottomBar from "@/components/MobileBottomBar";

// Halaman-halaman yang sengaja gak pakai chrome situs (navbar, footer, dst).
// /invoice itu internal tool, bukan bagian dari public site.
const CHROMELESS_PREFIXES = ["/invoice"];

export default function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isChromeless = CHROMELESS_PREFIXES.some((p) => pathname.startsWith(p));

  if (isChromeless) return <>{children}</>;

  return (
    <>
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
    </>
  );
}
