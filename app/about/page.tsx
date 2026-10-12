import Image from "next/image";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/SectionHeading";
import { DeliveryBanner } from "@/components/PromoBanner";
import { ArrowUpRight } from "lucide-react";
import StoryCarousel from "./StoryCarousel";
import VisiMisi from "./VisiMisi";
import NilaiKami from "./NilaiKami";

export default function AboutPage() {
  return (
    <div>
      {/* Hero — full-bleed, foto + overlay gelap, headline putih centered,
          satu CTA. Pakai min-height (bukan tinggi fix) supaya konten
          gak overflow di layar kecil. CTA sengaja "Hubungi Kami" (bukan
          Ajukan Kerja Sama) karena halaman ini perkenalan, dan banner di
          bawah sudah mengarah ke katalog. */}
      <section className="relative bg-ink overflow-hidden min-h-[280px] sm:min-h-[220px] lg:min-h-[260px] flex">
        <Image
          src="/about/about-hero.jpg"
          alt="Tim dan gudang Makmur A3'S"
          fill
          sizes="100vw"
          className="object-cover opacity-70"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
        <div className="relative z-10 w-full max-w-4xl mx-auto px-5 md:px-8 py-10 sm:py-0 flex flex-col items-center justify-center text-center">
          <Eyebrow>
            <span className="text-white/70">Tentang Makmur A3&apos;S</span>
          </Eyebrow>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl leading-[1.1] text-white mt-3 mb-5 max-w-2xl">
            Mitra kebutuhan HORECA yang andal, cepat, dan profesional.
          </h1>
          <Link href="/contact">
            <Button className="!bg-brand !text-white hover:!bg-white hover:!text-ink">
              Hubungi Kami <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Cerita — interactive stepper carousel */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 py-16 md:py-24">
        <Eyebrow>Cerita Kami</Eyebrow>
        <h2 className="font-display text-2xl md:text-3xl leading-snug mt-3 mb-10 max-w-xl">
          Dari suplai perdana di 2020, kini melayani berbagai hotel, restoran,
          dan katering.
        </h2>
        <StoryCarousel />
      </section>

      {/* Visi & Misi */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 pb-16 md:pb-24">
        <Eyebrow>Visi &amp; Misi</Eyebrow>
        <h2 className="font-display text-2xl md:text-3xl leading-snug mt-3 mb-10 max-w-xl">
          Arah yang kami tuju, dan cara kami sampai ke sana.
        </h2>
        <VisiMisi />
        {/* Keunggulan udah punya halaman sendiri — cukup ditautkan */}
        <Link
          href="/keunggulan"
          className="mt-10 inline-flex items-center gap-1.5 text-sm font-semibold text-brand hover:underline underline-offset-4"
        >
          Lihat keunggulan kami <ArrowUpRight className="w-4 h-4" />
        </Link>
      </section>

      {/* Banner — copy, foto, dan CTA diatur di components/banners/presets.tsx */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 pb-16 md:pb-24">
        <DeliveryBanner />
      </section>

      {/* Nilai Kami — setelah banner, jadi penutup halaman */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 pb-16 md:pb-24">
        <Eyebrow>Nilai Kami</Eyebrow>
        <h2 className="font-display text-2xl md:text-3xl leading-snug mt-3 mb-10 max-w-xl">
          Prinsip yang kami pegang di setiap kerja sama.
        </h2>
        <NilaiKami />
      </section>
    </div>
  );
}
