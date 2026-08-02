import InvoiceGenerator from "@/components/InvoiceGenerator";

// Sengaja gak ada di NAV_ITEMS Header, gak ada di Footer, gak ada di
// MobileBottomBar. Akses cuma lewat URL langsung /invoice.
export const metadata = {
  title: "Invoice Generator — Internal",
  robots: { index: false, follow: false },
};

export default function InvoicePage() {
  return <InvoiceGenerator />;
}
