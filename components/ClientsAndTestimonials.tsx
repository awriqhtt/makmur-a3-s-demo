"use client";

import { Quote } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { TESTIMONIALS } from "@/lib/data";

const CLIENTS_ROW_1 = [
  "Sumber Boga",
  "Kedai Kopi Kita",
  "Warung Nusantara",
  "Boga Catering",
  "Nasi Kotak Sejahtera",
  "Dapur Ibu",
  "Resto Sedap",
  "Mie Ayam Jaya",
];

const CLIENTS_ROW_2 = [
  "Katering Prima",
  "Bakery Manis",
  "Ayam Geprek Mantap",
  "Bento Box Co",
  "Pujasera Group",
  "Snack Corner",
  "Frozen Food Sentosa",
  "Kue Kita",
];

function MarqueeRow({
  items,
  direction,
}: {
  items: string[];
  direction: "left" | "right";
}) {
  const duplicated = [...items, ...items];
  return (
    // group di sini scoped per baris — hover di mana aja dalam baris ini
    // bakal pause animasi baris ini doang, baris lain tetep jalan.
    <div className="group overflow-hidden w-full">
      <div
        className={`flex gap-8 md:gap-12 w-max group-hover:[animation-play-state:paused] ${
          direction === "left"
            ? "animate-marquee-left"
            : "animate-marquee-right"
        }`}
      >
        {duplicated.map((name, i) => (
          <span
            key={`${name}-${i}`}
            className="shrink-0 text-base md:text-lg font-display text-ink/25 whitespace-nowrap select-none transition-colors duration-200 hover:text-brand cursor-default"
          >
            {name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function ClientsAndTestimonials() {
  return (
    <section className="bg-sand pt-20 md:pt-28 pb-12 md:pb-16">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <SectionHeading
          eyebrow="Dipercaya klien"
          title="Kata tim procurement soal kami"
          align="center"
        />

        {/* Testimoni cards — konten utama, tampil duluan */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.name}
              className="bg-white rounded-2xl p-7 flex flex-col border border-line"
            >
              <Quote className="w-6 h-6 text-brand mb-5" />
              <p className="text-ink leading-relaxed mb-6 flex-1">{t.quote}</p>
              <div>
                <div className="text-sm font-semibold">{t.name}</div>
                <div className="text-xs text-ink/45">{t.org}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Logo marquee — closing statement, ambient/dekoratif */}
        <div className="mt-16 pt-10 border-t border-ink/10">
          <p className="text-xs md:text-sm font-semibold uppercase tracking-widest text-ink text-center mb-6">
            Dipercaya oleh 200+ bisnis F&amp;B di Indonesia
          </p>
          <div className="space-y-4 md:space-y-5">
            <MarqueeRow items={CLIENTS_ROW_1} direction="left" />
            <MarqueeRow items={CLIENTS_ROW_2} direction="right" />
          </div>
        </div>
      </div>
    </section>
  );
}
