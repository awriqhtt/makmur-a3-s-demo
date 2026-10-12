import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import PromoBanner from "@/components/PromoBanner";
import SectionHeading, { Eyebrow } from "@/components/ui/SectionHeading";
import HeroCarousel from "@/components/HeroCarousel";
import FeaturedProductsCarousel from "@/components/FeaturedProductsCarousel";

import LocationAvailabilityBanner from "@/components/LocationAvailabilityBanner";
import ClientsAndTestimonials from "@/components/ClientsAndTestimonials";
import HowItWorks from "@/components/HowItWorks";
// Parked for now — not rendered on the homepage, but keep the component and
// STATS data around in case we bring the stats bar back later.
// import StatsBar from "@/components/StatsBar";
import { DIVISIONS, WHY_US, getFeaturedProducts } from "@/lib/data";
import IndustriesShowcase from "@/components/IndustriesShowcase";

const SIDE_BANNER_DIVISION_IDS = ["cups", "foil"] as const;

export default function HomePage() {
  // Daftar produk unggulan diatur manual di FEATURED_CODES (lib/data.ts).
  const featuredProducts = getFeaturedProducts();
  const sideBannerDivisions = SIDE_BANNER_DIVISION_IDS.map(
    (id) => DIVISIONS.find((d) => d.id === id)!,
  );
  const sideBannerImages: Record<string, string> = {
    cups: "/banners/cups.jpg",
    foil: "/banners/foil.jpg",
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

      {/* Pilih Kategori */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 pt-4 md:pt-6 pb-20 md:pb-28">
        <h2 className="font-display text-2xl md:text-3xl mb-10">
          Pilih Kategori
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

      {/* Produk Unggulan — judul lama "Paling sering direstock klien kami"
          dihapus karena urutannya bukan dari data penjualan. */}
      <section className="bg-sand py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <SectionHeading
              eyebrow="Produk unggulan"
              title="Mulai dari produk-produk andalan kami"
            />
            {/* Desktop: link di kanan atas, sejajar judul */}
            <Link
              href="/products"
              className="group hidden md:inline-flex items-center gap-1.5 shrink-0 text-sm font-semibold text-ink hover:text-brand transition-colors"
            >
              Lihat produk selengkapnya
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          <div className="mt-12">
            <FeaturedProductsCarousel products={featuredProducts} />
          </div>

          {/* Mobile: tombol di bawah carousel */}
          <div className="mt-8 flex justify-center md:hidden">
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-brand hover:text-white hover:border-brand transition-colors"
            >
              Lihat produk selengkapnya
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Industries — mobile: full-bleed IG Story replica, desktop: clean grid */}
      <section className="py-0 md:py-20">
        <div className="hidden md:block max-w-7xl mx-auto px-5 md:px-8 mb-10">
          <SectionHeading
            eyebrow="Siapa yang kami layani"
            title="Melayani hotel, restoran, dan katering"
            align="center"
          />
        </div>
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <IndustriesShowcase />
        </div>
      </section>

      {/* Keunggulan — 5 poin sesuai Company Profile (sumber: WHY_US di lib/data.ts) */}
      <section
        id="keunggulan"
        className="relative bg-ink text-white py-12 md:py-14 scroll-mt-28 overflow-hidden"
      >
        {/* signature glow accents — dua sumber cahaya di pojok berlawanan, clean & on-brand */}
        <div className="absolute -top-32 -right-24 w-[26rem] h-[26rem] bg-brand/[0.18] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-24 w-[24rem] h-[24rem] bg-white/[0.06] rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-5 md:px-8 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8 md:mb-10">
            <div className="max-w-2xl">
              <Eyebrow>Kenapa Makmur A3&apos;S</Eyebrow>
              <h2 className="font-display text-2xl md:text-3xl leading-[1.1]">
                Mitra kebutuhan HORECA yang bisa diandalkan.
              </h2>
            </div>
            <Link
              href="/keunggulan"
              className="group inline-flex items-center gap-1.5 shrink-0 text-sm font-semibold text-white hover:text-brand transition-colors"
            >
              Lihat keunggulan kami
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
            {WHY_US.map((w) => (
              <div
                key={w.title}
                className="group flex gap-4 sm:block border border-white/10 rounded-2xl p-5 bg-white/[0.02] backdrop-blur-sm hover-lift"
              >
                <div className="w-10 h-10 shrink-0 rounded-full bg-white/10 flex items-center justify-center sm:mb-4 group-hover:bg-brand transition-colors duration-300">
                  <w.icon
                    className="w-5 h-5 text-white/70 group-hover:text-white transition-colors duration-300"
                    strokeWidth={1.75}
                  />
                </div>
                <div>
                  <h3 className="font-semibold mb-1.5">{w.title}</h3>
                  <p className="text-[13px] text-white/50 leading-relaxed">
                    {w.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cara Kerja — flow 1-2-3 minimal */}
      <HowItWorks />

      {/* Promo banner — WhatsApp bulk/custom order CTA, sebelum Klien.
          Isi banner (copy, foto, nomor WA) diatur di components/PromoBanner.tsx */}
      <PromoBanner />

      {/* Klien — logo marquee. Testimoni lama (kutipan karangan) sudah dihapus. */}
      <ClientsAndTestimonials />
    </>
  );
}
