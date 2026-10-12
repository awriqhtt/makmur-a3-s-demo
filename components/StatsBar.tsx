"use client";

import { useEffect, useRef, useState } from "react";
import {
  Package,
  LayoutGrid,
  Clock,
  CalendarDays,
  type LucideIcon,
} from "lucide-react";

// Icon lookup lives here (client-side) because component references (functions)
// can't be passed as props from a Server Component to a Client Component —
// only plain serializable data can cross that boundary. So `data.ts` gives us
// a plain string key, and we resolve it to the actual icon here.
const ICONS: Record<string, LucideIcon> = {
  package: Package,
  "layout-grid": LayoutGrid,
  clock: Clock,
  calendar: CalendarDays,
};

type Stat = { value: string; label: string; icon: string };

// Splits "90+" -> { target: 90, suffix: "+" }, "24 Jam" -> { target: 24, suffix: " Jam" }.
// Nilai non-angka, dan angka 4 digit ke atas (tahun, mis. "2020"), ditampilkan
// statis — tahun yang "menghitung naik dari 0" kelihatannya aneh.
function parseValue(raw: string) {
  const match = raw.match(/^(\d+)(.*)$/);
  if (!match || match[1].length >= 4) {
    return { hasNumber: false as const, target: 0, suffix: raw };
  }
  return {
    hasNumber: true as const,
    target: parseInt(match[1], 10),
    suffix: match[2],
  };
}

function AnimatedStat({
  stat,
  index,
  active,
  extraClass,
}: {
  stat: Stat;
  index: number;
  active: boolean;
  extraClass: string;
}) {
  const { hasNumber, target, suffix } = parseValue(stat.value);
  const [display, setDisplay] = useState(0);
  const Icon = ICONS[stat.icon];

  useEffect(() => {
    if (!active || !hasNumber) return;
    const duration = 900;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(eased * target));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, hasNumber, target]);

  return (
    <div
      className={`flex items-center gap-3.5 py-5 md:py-0 md:pl-8 md:first:pl-0 md:flex-1 transition-all duration-500 ease-out motion-reduce:transition-none ${extraClass}`}
      style={{
        transitionDelay: `${index * 100}ms`,
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : "translateY(10px)",
      }}
    >
      <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
        {Icon && (
          <Icon
            className="w-[18px] h-[18px] md:w-5 md:h-5 text-brand"
            strokeWidth={2}
          />
        )}
      </div>
      <div>
        <div className="font-display text-2xl sm:text-3xl text-ink leading-none tabular-nums whitespace-nowrap">
          {hasNumber ? `${display}${suffix}` : stat.value}
        </div>
        <div className="text-xs md:text-sm text-ink/50 mt-1.5">
          {stat.label}
        </div>
      </div>
    </div>
  );
}

export default function StatsBar({ stats }: { stats: Stat[] }) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Mobile: 2 kolom. Border bawah untuk semua baris kecuali baris terakhir,
  // dan kalau jumlah stat ganjil, item terakhir melebar 2 kolom (di tengah)
  // supaya gak menggantung sendirian.
  // Desktop: 1 baris, kolom sama lebar (flex-1), pemisah lewat divide-x.
  const mobileRows = Math.ceil(stats.length / 2);

  return (
    <section className="bg-sand" ref={sectionRef}>
      <div className="max-w-5xl mx-auto px-5 md:px-8 py-4 md:py-7 grid grid-cols-2 md:flex md:divide-x md:divide-line">
        {stats.map((s, i) => {
          const classes: string[] = [];
          if (Math.floor(i / 2) < mobileRows - 1) {
            classes.push("border-b border-line md:border-b-0");
          }
          if (stats.length % 2 === 1 && i === stats.length - 1) {
            classes.push(
              "col-span-2 md:col-span-1 justify-center md:justify-start",
            );
          }
          return (
            <AnimatedStat
              key={s.label}
              stat={s}
              index={i}
              active={active}
              extraClass={classes.join(" ")}
            />
          );
        })}
      </div>
    </section>
  );
}
