"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Package, Handshake } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Button from "./ui/Button";
import { ALL_PRODUCTS, DIVISIONS } from "@/lib/data";

// Official WhatsApp glyph — using the real brand mark instead of a generic
// chat-bubble icon so it's instantly recognizable as WhatsApp specifically.
function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#25D366"
        d="M12.004 2c-5.523 0-10 4.477-10 10 0 1.765.464 3.44 1.28 4.905L2 22l5.234-1.257A9.96 9.96 0 0 0 12.004 22c5.523 0 10-4.477 10-10s-4.477-10-10-10Z"
      />
      <path
        fill="#fff"
        d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.67.15-.198.297-.767.966-.94 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.15-.174.198-.298.298-.497.099-.198.05-.372-.025-.521-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.372-.01-.57-.01a1.093 1.093 0 0 0-.792.372c-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.148.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.693.626.711.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347Z"
      />
    </svg>
  );
}

// Nomor WhatsApp bisnis — disamakan dengan CONTACT.whatsappHref di
// components/Footer.tsx (0878-7831-1243). Kalau nomor ini berubah,
// mirror juga ke Footer.tsx dan app/contact/page.tsx.
const WHATSAPP_NUMBER = "6287878311243";

// Jumlah SKU diambil otomatis dari katalog, dibulatkan ke bawah per puluhan:
// 91 → "90+", 104 → "100+". Gak perlu diedit manual tiap produk bertambah.
const SKU_LABEL = `${Math.floor(ALL_PRODUCTS.length / 10) * 10}+`;
// Permintaan client: level teratas disebut "Kategori" (di kode: DIVISIONS).
const TOTAL_KATEGORI = DIVISIONS.length;

const SLIDES = [
  {
    id: "main",
    image: "/hero/slide-main.png",
    panelBg: "bg-ink",
    text: "text-white",
    eyebrow: "Distribusi Kebutuhan HORECA",
    title: "Packaging yang bikin operasional tetap jalan.",
    body: `Food packaging, plastic, paper & aluminium foil — ${SKU_LABEL} SKU.`,
    cta: {
      kind: "whatsapp" as const,
      label: "Chat via WhatsApp",
      waMessage: "Halo, saya mau tanya soal katalog produk Makmur A3'S.",
    },
  },
  {
    id: "stock",
    image: "/hero/slide-stock.png",
    panelBg: "bg-brand",
    text: "text-white",
    eyebrow: "Katalog lengkap",
    title: `${SKU_LABEL} SKU di ${TOTAL_KATEGORI} kategori produk.`,
    body: "Pesanan rutin dijadwalkan dan dikirim sesuai kebutuhan outlet kamu.",
    cta: {
      kind: "link" as const,
      label: "Jelajahi produk",
      href: "/products",
      icon: Package,
    },
  },
  {
    id: "delivery",
    image: "/hero/slide-delivery.png",
    panelBg: "bg-ink",
    text: "text-white",
    eyebrow: "Jabodetabek & sekitarnya",
    title: "Pengiriman cepat dan terjadwal untuk dapur & outlet kamu.",
    body: "Tepat waktu, sesuai jadwal operasional mitra.",
    cta: {
      kind: "link" as const,
      label: "Ajukan kerja sama",
      href: "/kerjasama",
      icon: Handshake,
    },
  },
];

export default function HeroCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const next = useCallback(() => setIndex((i) => (i + 1) % SLIDES.length), []);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(next, 5000);
    return () => clearInterval(t);
  }, [paused, next]);

  const slide = SLIDES[index];

  return (
    <div
      className="relative h-[560px] sm:h-[520px] md:h-[400px] lg:h-[420px] rounded-3xl overflow-hidden border border-line"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="absolute inset-0 flex flex-col-reverse md:flex-row"
        >
          {/* Text panel — solid background, full contrast, no fighting with the photo */}
          <div
            className={`relative z-10 md:w-1/2 lg:w-[44%] shrink-0 ${slide.panelBg} ${slide.text} flex flex-col gap-6 md:gap-0 md:justify-between p-6 sm:p-7 md:px-10 md:py-10 lg:px-12 lg:py-12`}
          >
            {/* Top content block — title & body reserve a fixed 2-line height each,
                so this block is always the same height regardless of actual copy length */}
            <div>
              <span className="text-[11px] font-data uppercase tracking-widest opacity-70 mb-2 block">
                {slide.eyebrow}
              </span>
              <h1 className="font-display text-lg sm:text-2xl md:text-2xl lg:text-[1.85rem] leading-[1.2] mb-2 md:mb-3 min-h-[72px] md:min-h-[86px] lg:min-h-[106px]">
                {slide.title}
              </h1>
              <p className="text-sm md:text-base opacity-80 leading-relaxed min-h-[46px] md:min-h-[52px]">
                {slide.body}
              </p>
            </div>

            {/* CTA — pinned to the bottom of the panel via justify-between above,
                so its position never shifts between slides */}
            <div className="flex items-center">
              {slide.cta.kind === "whatsapp" ? (
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(slide.cta.waMessage)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0"
                >
                  <Button className="!bg-white !text-ink hover:!bg-white/90 !px-6 !py-3 md:!px-7 md:!py-3.5 text-sm md:text-base whitespace-nowrap">
                    <WhatsAppIcon className="w-5 h-5" /> {slide.cta.label}
                  </Button>
                </a>
              ) : (
                <Link href={slide.cta.href} className="shrink-0">
                  <Button className="!bg-white !text-ink hover:!bg-white/90 !px-6 !py-3 md:!px-7 md:!py-3.5 text-sm md:text-base whitespace-nowrap">
                    <slide.cta.icon className="w-4 h-4" /> {slide.cta.label}
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Photo panel — full-bleed, minimal overlay so the photo stays the star */}
          <div className="relative flex-1 min-h-[160px] sm:min-h-[190px] md:min-h-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Soft seam blend into the text panel, no heavy tint over the photo itself */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent md:bg-gradient-to-r md:from-black/20 md:via-transparent md:to-transparent" />
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Dot indicators */}
      <div className="absolute bottom-4 right-6 flex items-center gap-2 z-20">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setIndex(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className={`h-1.5 rounded-full transition-all ${i === index ? "w-6 bg-white" : "w-1.5 bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}
