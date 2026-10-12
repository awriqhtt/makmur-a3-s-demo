import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import Button from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/SectionHeading";

/**
 * Semua banner ada di file ini, satu gaya (mengikuti banner About):
 * foto full-bleed + satu gradient dari bawah + teks kiri-bawah + CTA.
 * Mau ubah copy, foto, atau CTA? Edit preset di bawah.
 *
 * Pemakaian:
 *   import PromoBanner, { DeliveryBanner } from "@/components/PromoBanner";
 *   <PromoBanner />      // home, sudah bawa wrapper section
 *   <DeliveryBanner />   // about, taruh di dalam section sendiri
 */

/* ------------------------------------------------------------------ */
/* Ikon WhatsApp (lucide-react tidak punya logo brand)                 */
/* ------------------------------------------------------------------ */

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Komponen Banner (dipakai semua preset)                              */
/* ------------------------------------------------------------------ */

type BannerProps = {
  image: { src: string; alt: string };
  eyebrow?: string;
  title: string;
  description?: string;
  cta: {
    label: string;
    href: string;
    external?: boolean;
    /** Ikon di kiri label. Kalau diisi, panah di kanan disembunyikan. */
    icon?: ReactNode;
  };
  /** Tailwind untuk foto: focal point (object-[...]) atau flip (-scale-x-100) */
  imageClassName?: string;
};

function Banner({
  image,
  eyebrow,
  title,
  description,
  cta,
  imageClassName = "",
}: BannerProps) {
  const button = (
    <Button className="!bg-white !text-ink hover:!bg-ink hover:!text-white">
      {cta.icon}
      {cta.label}
      {!cta.icon && <ArrowUpRight className="w-4 h-4" />}
    </Button>
  );

  return (
    <div className="relative rounded-2xl overflow-hidden flex">
      <Image
        src={image.src}
        alt={image.alt}
        fill
        sizes="(min-width: 1280px) 1216px, 100vw"
        className={`object-cover ${imageClassName}`}
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent"
        aria-hidden="true"
      />
      <div className="relative z-10 w-full min-h-[260px] md:min-h-[300px] flex flex-col justify-end p-5 md:p-8">
        {eyebrow && (
          <Eyebrow>
            <span className="text-white/70">{eyebrow}</span>
          </Eyebrow>
        )}
        <h3 className="font-display text-lg sm:text-xl md:text-2xl text-white mt-1 mb-1 max-w-md">
          {title}
        </h3>
        {description && (
          <p className="text-xs md:text-sm text-white/75 max-w-md mb-4">
            {description}
          </p>
        )}
        {cta.external ? (
          <a
            href={cta.href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit"
          >
            {button}
          </a>
        ) : (
          <Link href={cta.href} className="w-fit">
            {button}
          </Link>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Preset banner — tambah baru tinggal copy salah satu                 */
/* ------------------------------------------------------------------ */

/** Home: ajakan chat WhatsApp untuk order volume besar. */
export function BulkOrderBanner() {
  return (
    <Banner
      image={{
        src: "/banners/promo-bulk-order.png",
        alt: "Tim A3'S berdiskusi pesanan dengan pemilik restoran",
      }}
      // Atur angka ini (55%-62%) sampai kepala dan sampel produk sama-sama terlihat.
      imageClassName="object-[center_58%]"
      eyebrow="Order khusus & volume besar"
      title="Butuh stok banyak? Kami yang atur."
      description="Tim kami bantu susun jumlah, harga, dan jadwal kirim sesuai skala bisnis kamu."
      cta={{
        label: "Chat via WhatsApp",
        href: "https://wa.me/6287878311243",
        external: true,
        icon: <WhatsAppIcon className="w-5 h-5 text-[#25D366]" />,
      }}
    />
  );
}

/** About: pengiriman terjadwal, CTA ke katalog. */
export function DeliveryBanner() {
  return (
    <Banner
      image={{
        src: "/about/about-banner.jpg",
        alt: "Distribusi dan pengiriman Makmur A3'S",
      }}
      eyebrow="Pengiriman Terjadwal"
      title="Pengiriman cepat dan terjadwal untuk mitra."
      description="Jadwal kirim disesuaikan dengan kebutuhan usaha kamu di Jabodetabek dan sekitarnya."
      cta={{ label: "Lihat Katalog", href: "/products" }}
    />
  );
}

/* Default export = banner di home, lengkap dengan wrapper section */
export default function PromoBanner() {
  return (
    <section className="max-w-7xl mx-auto px-5 md:px-8 pb-16 md:pb-24">
      <BulkOrderBanner />
    </section>
  );
}
