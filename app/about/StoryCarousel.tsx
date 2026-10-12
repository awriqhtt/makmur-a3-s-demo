"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Isi mengacu ke company profile (sejarah, layanan, misi). Tanpa nama badan
// hukum dan tanpa nama klien, cukup brand "Makmur A3'S".
const STORY_SLIDES = [
  {
    number: "01",
    title: "Berdiri di 2020",
    body: "Makmur A3'S berdiri pada 2020 sebagai distributor kebutuhan HORECA (hotel, restoran, dan katering), dengan satu tujuan: pengadaan yang aman, cepat, dan terpercaya.",
    image: "/about/about-story-1.jpg",
    alt: "Awal berdirinya Makmur A3'S",
  },
  {
    number: "02",
    title: "Kepercayaan Pertama",
    body: "Perjalanan kami dimulai dari kerja sama perdana dengan salah satu mitra restoran. Kepercayaan itu jadi tonggak awal kami untuk terus berkembang.",
    image: "/about/about-story-2.jpg",
    alt: "Kerja sama perdana Makmur A3'S dengan mitra pertama",
  },
  {
    number: "03",
    title: "Jaringan dan Produk Terus Berkembang",
    body: "Dari tonggak itu, jaringan klien dan kategori produk kami terus bertambah. Kini kami melayani berbagai hotel, restoran, dan katering di Jabodetabek dan sekitarnya.",
    image: "/about/about-story-3.jpg",
    alt: "Jaringan klien dan katalog produk Makmur A3'S",
  },
  {
    number: "04",
    title: "Layanan Sesuai Kebutuhan Mitra",
    body: "Selain produk, kami menyediakan pengadaan sesuai permintaan, pengiriman cepat dan terjadwal, serta konsultasi pengadaan bahan khusus sesuai konsep usaha mitra.",
    image: "/about/about-story-4.jpg",
    alt: "Layanan pengadaan dan pengiriman Makmur A3'S",
  },
  {
    number: "05",
    title: "Komitmen Jangka Panjang",
    body: "Kami ingin terus jadi mitra HORECA yang andal, cepat, dan profesional, membangun hubungan jangka panjang yang tumbuh bersama usaha mitra kami.",
    image: "/about/about-story-5.jpg",
    alt: "Komitmen Makmur A3'S sebagai mitra jangka panjang",
  },
];

const LAST = STORY_SLIDES.length - 1;

export default function StoryCarousel() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  const getPadLeft = (el: HTMLElement) =>
    parseFloat(getComputedStyle(el).paddingLeft) || 0;

  const scrollToIndex = (i: number) => {
    const el = scrollerRef.current;
    const card = el?.children[i] as HTMLElement | undefined;
    if (!el || !card) return;
    el.scrollTo({
      left: card.offsetLeft - getPadLeft(el),
      behavior: "smooth",
    });
    setActive(i);
  };

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;

    // Di layar lebar kartu terakhir gak bisa nyampe posisi "start",
    // jadi kalau scroll udah mentok kanan, anggap aktif = terakhir.
    if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) {
      setActive(LAST);
      return;
    }

    const padLeft = getPadLeft(el);
    let nearest = 0;
    let min = Infinity;
    Array.from(el.children).forEach((child, i) => {
      const d = Math.abs(
        (child as HTMLElement).offsetLeft - padLeft - el.scrollLeft,
      );
      if (d < min) {
        min = d;
        nearest = i;
      }
    });
    setActive(nearest);
  };

  return (
    <div>
      {/* Variasi ritme: kartu selang-seling terang/gelap, foto selang-seling
          di atas/bawah, nomor besar transparan sebagai aksen, dan kartu yang
          gak aktif diredupin biar fokusnya ke satu babak. */}
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        role="region"
        aria-label="Cerita Makmur A3'S"
        className="relative flex gap-5 overflow-x-auto snap-x snap-mandatory scroll-pl-5 md:scroll-pl-0 pb-4 -mx-5 px-5 md:mx-0 md:px-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {STORY_SLIDES.map((slide, i) => {
          const dark = i % 2 === 1;
          const imageFirst = i % 2 === 0;
          return (
            <div
              key={slide.number}
              className={`snap-start shrink-0 w-[85%] sm:w-[60%] lg:w-[45%] flex rounded-2xl overflow-hidden border transition-opacity duration-300 ${
                imageFirst ? "flex-col" : "flex-col-reverse"
              } ${dark ? "bg-ink border-ink" : "bg-sand border-line"} ${
                i === active ? "opacity-100" : "opacity-60"
              }`}
            >
              <div className="relative h-[240px] bg-line shrink-0">
                <Image
                  src={slide.image}
                  alt={slide.alt}
                  fill
                  sizes="(min-width: 1024px) 45vw, (min-width: 640px) 60vw, 85vw"
                  className="object-cover"
                />
              </div>
              <div className="relative flex-1 p-6 md:p-7">
                <span
                  className={`block font-display text-6xl leading-none ${
                    dark ? "text-white/15" : "text-ink/10"
                  }`}
                >
                  {slide.number}
                </span>
                <span className="block w-8 h-0.5 bg-brand mt-4 mb-3" />
                <h3
                  className={`font-display text-lg md:text-xl mb-2 ${
                    dark ? "text-white" : "text-ink"
                  }`}
                >
                  {slide.title}
                </h3>
                <p
                  className={`text-sm leading-relaxed ${
                    dark ? "text-white/65" : "text-ink/60"
                  }`}
                >
                  {slide.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center">
          {STORY_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              aria-label={`Ke babak ${i + 1}`}
              aria-current={i === active}
              className="p-1.5 group"
            >
              <span
                className={`block h-1.5 rounded-full transition-all duration-300 ${
                  i === active ? "w-6 bg-brand" : "w-1.5 bg-line"
                }`}
              />
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => scrollToIndex(Math.max(0, active - 1))}
            disabled={active === 0}
            className="w-9 h-9 rounded-full border border-line flex items-center justify-center hover:bg-sand transition-colors disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scrollToIndex(Math.min(LAST, active + 1))}
            disabled={active === LAST}
            className="w-9 h-9 rounded-full border border-line flex items-center justify-center hover:bg-sand transition-colors disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
