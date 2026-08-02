import Link from "next/link";
import {
  ArrowUpRight,
  Warehouse,
  ShieldCheck,
  Truck,
  Headset,
} from "lucide-react";
import Button from "@/components/ui/Button";
import SectionHeading, { Eyebrow } from "@/components/ui/SectionHeading";
import HeroCarousel from "@/components/HeroCarousel";
import FeaturedProductsCarousel from "@/components/FeaturedProductsCarousel";

import LocationAvailabilityBanner from "@/components/LocationAvailabilityBanner";
import ClientsAndTestimonials from "@/components/ClientsAndTestimonials";
import HowItWorks from "@/components/HowItWorks";
// Parked for now — not rendered on the homepage, but keep the component and
// STATS data around in case we bring the stats bar back later.
// import StatsBar from "@/components/StatsBar";
import { DIVISIONS, ALL_PRODUCTS, hasProductImage } from "@/lib/data";
import IndustriesShowcase from "@/components/IndustriesShowcase";

const WHY_US = [
  {
    icon: Warehouse,
    title: "Stok gudang siap pakai",
    body: "SKU utama selalu ready stock di setiap divisi, jadi pesanan rutin bisa langsung dikirim tanpa nunggu produksi.",
  },
  {
    icon: ShieldCheck,
    title: "Quality control food-grade",
    body: "Setiap batch yang masuk dicek sesuai spesifikasi material dan food-safety sebelum sampai ke dock kamu.",
  },
  {
    icon: Truck,
    title: "Distribusi yang bisa diandalkan",
    body: "Rute pengiriman terjadwal di Jabodetabek, plus partner freight nasional untuk klien luar kota.",
  },
  {
    icon: Headset,
    title: "Account handling khusus",
    body: "Satu contact person yang hafal riwayat order, preferensi packing, dan jadwal delivery kamu.",
  },
];

const SIDE_BANNER_DIVISION_IDS = ["cups", "foil"] as const;

export default function HomePage() {
  // SESUDAH
  const FEATURED_COUNT = 12;

  // Produk yang sudah ada foto asli diprioritaskan tampil duluan; sisa slot
  // diisi produk lain (placeholder) mengikuti urutan di lib/data.ts, sampai
  // jumlah target terpenuhi. Otomatis ke-update begitu foto baru ditambah.
  const featuredProducts = [...ALL_PRODUCTS]
    .sort(
      (a, b) =>
        Number(hasProductImage(b.code)) - Number(hasProductImage(a.code)),
    )
    .slice(0, FEATURED_COUNT);
  const sideBannerDivisions = SIDE_BANNER_DIVISION_IDS.map(
    (id) => DIVISIONS.find((d) => d.id === id)!,
  );
  const sideBannerImages: Record<string, string> = {
    cups: "/banners/cups.png",
    foil: "/banners/foil.png",
  };

  return (
    <>
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 pt-10 md:pt-12 pb-8">
        <div className="grid lg:grid-cols-[3fr_2fr] gap-4">
          <HeroCarousel />
          <div className="hidden lg:grid grid-rows-2 gap-4">
            {sideBannerDivisions.map((division) => (
              <Link
                key={division.id}
                href={`/products?divisi=${division.id}`}
                className="group relative rounded-3xl overflow-hidden hover-lift flex flex-col justify-end p-6 md:p-7"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={sideBannerImages[division.id]}
                  alt=""
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />
                <div className="relative z-10">
                  <span className="text-white font-display text-lg md:text-xl leading-snug block mb-1.5">
                    {division.name}
                  </span>
                  <span className="text-white/70 text-xs md:text-[13px] leading-relaxed line-clamp-2 mb-3 block">
                    {division.blurb}
                  </span>
                  <span className="inline-flex items-center gap-1 text-white text-sm font-medium">
                    Lihat produk
                    <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* <StatsBar stats={STATS} /> */}

      {/* Pilih Divisi */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 pt-4 md:pt-6 pb-20 md:pb-28">
        <h2 className="font-display text-2xl md:text-3xl mb-10">
          Pilih Divisi
        </h2>
        <div className="flex md:grid md:grid-cols-8 gap-6 md:gap-3 overflow-x-auto md:overflow-visible -mx-5 px-5 md:mx-0 md:px-0 pb-2 md:pb-0 snap-x snap-mandatory no-scrollbar">
          {DIVISIONS.map((d) => (
            <Link
              key={d.id}
              href={`/products?divisi=${d.id}`}
              className="group flex flex-col items-center text-center gap-3 shrink-0 w-24 md:w-auto snap-start"
            >
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-sand flex items-center justify-center group-hover:bg-brand transition-colors duration-300 group-hover:-translate-y-1">
                <d.icon
                  className="w-8 h-8 md:w-9 md:h-9 text-ink group-hover:text-white transition-colors duration-300"
                  strokeWidth={1.5}
                />
              </div>
              <h3 className="text-xs md:text-sm font-semibold leading-snug group-hover:text-brand transition-colors">
                {d.name}
              </h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      <section className="bg-sand py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <SectionHeading
            eyebrow="Best sellers"
            title="Paling sering direstock klien kami"
          />
          <div className="mt-12">
            <FeaturedProductsCarousel products={featuredProducts} />
          </div>
        </div>
      </section>

      {/* Industries — mobile: full-bleed IG Story replica, desktop: clean grid */}
      <section className="py-0 md:py-20">
        <div className="hidden md:block max-w-7xl mx-auto px-5 md:px-8 mb-10">
          <SectionHeading
            eyebrow="Siapa yang kami layani"
            title="Dibuat untuk setiap dapur yang gak bisa kehabisan stok"
            align="center"
          />
        </div>
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <IndustriesShowcase />
        </div>
      </section>

      {/* Keunggulan */}
      <section
        id="keunggulan"
        className="relative bg-ink text-white py-16 md:py-20 scroll-mt-28 overflow-hidden"
      >
        {/* signature glow accents — dua sumber cahaya di pojok berlawanan, clean & on-brand */}
        <div className="absolute -top-32 -right-24 w-[26rem] h-[26rem] bg-brand/[0.18] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-24 w-[24rem] h-[24rem] bg-white/[0.06] rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-5 md:px-8 relative z-10">
          <div className="max-w-2xl mb-10 md:mb-12">
            <Eyebrow>Kenapa Makmur A3&apos;S</Eyebrow>
            <h2 className="font-display text-3xl md:text-4xl leading-[1.05]">
              Supplier yang bikin tim procurement berhenti khawatir.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {WHY_US.map((w) => (
              <div
                key={w.title}
                className="group border border-white/10 rounded-2xl p-6 bg-white/[0.02] backdrop-blur-sm hover-lift"
              >
                <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center mb-5 group-hover:bg-brand transition-colors duration-300">
                  <w.icon
                    className="w-5 h-5 text-white/70 group-hover:text-white transition-colors duration-300"
                    strokeWidth={1.75}
                  />
                </div>
                <h3 className="font-semibold mb-2">{w.title}</h3>
                <p className="text-sm text-white/50 leading-relaxed">
                  {w.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cara Kerja — flow 1-2-3 minimal */}
      <HowItWorks />

      {/* Promo banner — WhatsApp bulk/custom order CTA, sekarang sebelum Clients & Testimoni */}
      <section className="max-w-7xl mx-auto px-5 md:px-8">
        <div className="group relative overflow-hidden rounded-3xl min-h-[220px] md:min-h-[260px] flex items-end">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/banners/promo-bulk-order.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/5" />

          <div className="relative z-10 w-full px-6 md:px-10 py-6 md:py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 md:gap-8">
            <div className="max-w-lg">
              <span className="inline-flex items-center gap-1.5 text-white/70 text-[11px] md:text-xs font-medium tracking-wide uppercase mb-2.5">
                <svg
                  viewBox="0 0 24 24"
                  className="w-3.5 h-3.5 fill-white/70"
                  aria-hidden="true"
                >
                  <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.87 9.87 0 0 0 12.04 2zm0 1.67c2.19 0 4.25.85 5.79 2.4a8.18 8.18 0 0 1 2.4 5.83c0 4.54-3.7 8.24-8.24 8.24a8.24 8.24 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.37c0-4.54 3.7-8.24 8.3-8.24zm-4.5 4.55c-.17 0-.44.06-.67.32-.23.25-.87.86-.87 2.08 0 1.22.9 2.4 1.02 2.57.12.17 1.75 2.79 4.31 3.8 2.13.84 2.56.68 3.03.64.46-.04 1.5-.61 1.71-1.2.2-.59.2-1.1.14-1.2-.06-.11-.23-.17-.47-.29-.25-.12-1.5-.74-1.73-.82-.23-.09-.4-.13-.57.13-.17.25-.65.82-.8.99-.15.17-.29.19-.54.06-.25-.12-1.06-.39-2.03-1.25-.75-.67-1.25-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.12-.15.16-.25.24-.42.08-.17.04-.31-.02-.44-.06-.12-.57-1.38-.79-1.89-.2-.5-.4-.43-.57-.44a10 10 0 0 0-.44-.01z" />
                </svg>
                Order khusus & volume besar
              </span>
              <h3 className="font-display text-xl md:text-2xl text-white leading-snug mb-1.5">
                Butuh stok banyak? Kami yang atur.
              </h3>
              <p className="text-xs md:text-sm text-white/70 leading-relaxed max-w-md">
                Tim kami bantu susun jumlah, harga, dan jadwal kirim sesuai
                skala bisnis kamu.
              </p>
            </div>

            <a
              href="https://wa.me/6281234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 w-full md:w-auto"
            >
              <Button className="!bg-white !text-ink hover:!bg-ink hover:!text-white w-full md:w-auto justify-center">
                Chat via WhatsApp <ArrowUpRight className="w-4 h-4" />
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Klien & Testimoni — sekarang jadi closing statement konten sebelum LocationBanner */}
      <ClientsAndTestimonials />
    </>
  );
}
