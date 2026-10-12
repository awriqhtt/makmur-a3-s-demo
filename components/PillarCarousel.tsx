"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight, Boxes, ShieldCheck, Users } from "lucide-react";

const PILLARS = [
  {
    title: "Ketersediaan Stok",
    body: "SKU utama kami cek dan restock rutin sebelum menipis — bukan reaktif setelah kehabisan. Jadi pesanan berulang bisa langsung dikirim tanpa nunggu jadwal produksi baru.",
    icon: Boxes,
    stat: "Restock rutin, bukan reaktif",
  },
  {
    title: "Kualitas & Keamanan Pangan",
    body: "Setiap batch yang masuk diperiksa sesuai spesifikasi material dan standar food-safety sebelum sampai ke dock kamu, dengan dokumentasi yang bisa ditelusuri per pengiriman.",
    icon: ShieldCheck,
    stat: "QC per batch, terdokumentasi",
  },
  {
    title: "Kemudahan Kerja Sama",
    body: "Satu account handler yang hafal riwayat order dan preferensi packing kamu, rute pengiriman terjadwal di Jabodetabek, dan quotation yang direspons cepat — bukan nunggu berhari-hari.",
    icon: Users,
    stat: "1 account handler tetap",
  },
];

export default function PillarCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!trackRef.current) return;
    isDown.current = true;
    startX.current = e.clientX;
    scrollStart.current = trackRef.current.scrollLeft;
    trackRef.current.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDown.current || !trackRef.current) return;
    const delta = e.clientX - startX.current;
    trackRef.current.scrollLeft = scrollStart.current - delta;
  };

  const onPointerUp = () => {
    isDown.current = false;
  };

  const scrollBy = (dir: 1 | -1) => {
    if (!trackRef.current) return;
    const cardWidth = trackRef.current.querySelector("div")?.clientWidth ?? 300;
    trackRef.current.scrollBy({
      left: dir * (cardWidth + 20),
      behavior: "smooth",
    });
  };

  return (
    <div className="relative">
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        className="flex gap-4 md:gap-5 overflow-x-auto pb-2 -mx-5 px-5 md:mx-0 md:px-0 snap-x snap-mandatory cursor-grab active:cursor-grabbing select-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
      >
        {PILLARS.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.title}
              className="snap-start shrink-0 w-[80%] sm:w-[55%] md:w-[calc(33.333%-14px)] bg-sand rounded-2xl p-6 md:p-8 border border-line flex flex-col"
            >
              <div className="w-11 h-11 rounded-full bg-brand/10 flex items-center justify-center mb-5">
                <Icon className="w-5 h-5 text-brand" />
              </div>
              <h3 className="font-display text-lg text-ink mb-2">{p.title}</h3>
              <p className="text-sm text-ink/60 leading-relaxed mb-4">
                {p.body}
              </p>
              <div className="mt-auto pt-3 border-t border-line text-xs font-semibold text-brand">
                {p.stat}
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:flex gap-2 mt-6 justify-end">
        <button
          onClick={() => scrollBy(-1)}
          aria-label="Sebelumnya"
          className="w-10 h-10 rounded-full border border-line flex items-center justify-center hover:bg-sand transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-ink" />
        </button>
        <button
          onClick={() => scrollBy(1)}
          aria-label="Berikutnya"
          className="w-10 h-10 rounded-full border border-line flex items-center justify-center hover:bg-sand transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-ink" />
        </button>
      </div>
    </div>
  );
}
