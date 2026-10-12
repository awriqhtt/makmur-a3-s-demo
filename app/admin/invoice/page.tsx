import InvoiceGenerator from "@/components/InvoiceGenerator";

// Sengaja gak ada di NAV_ITEMS Header, gak ada di Footer, gak ada di
// MobileBottomBar. Akses sekarang digembok password lewat middleware.ts
// (lihat /admin/login) — bukan cuma "disembunyiin" dari nav doang lagi.
export const metadata = {
  title: "Invoice Generator — Internal",
  robots: { index: false, follow: false },
};

export default function InvoicePage() {
  return <InvoiceGenerator />;
}
