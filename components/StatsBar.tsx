"use client";

import { useEffect, useRef, useState } from "react";
import { Package, LayoutGrid, Users, Clock, type LucideIcon } from "lucide-react";

// Icon lookup lives here (client-side) because component references (functions)
// can't be passed as props from a Server Component to a Client Component —
// only plain serializable data can cross that boundary. So `data.ts` gives us
// a plain string key, and we resolve it to the actual icon here.
const ICONS: Record<string, LucideIcon> = {
  package: Package,
  "layout-grid": LayoutGrid,
  users: Users,
  clock: Clock,
};

type Stat = {
  value: string;
  label: string;
  icon: string;
};

// Splits "120+" -> { target: 120, suffix: "+" }, "24 Jam" -> { target: 24, suffix: " Jam" }.
// Falls back to showing the raw string statically if it doesn't start with a number.
function parseValue(raw: string) {
  const match = raw.match(/^(\d+)(.*)$/);
  if (!match) return { hasNumber: false as const, target: 0, suffix: raw };
  return { hasNumber: true as const, target: parseInt(match[1], 10), suffix: match[2] };
}

function AnimatedStat({
  stat,
  index,
  active,
}: {
  stat: Stat;
  index: number;
  active: boolean;
}) {
  const { hasNumber, target, suffix } = parseValue(stat.value);
  const [display, setDisplay] = useState(hasNumber ? 0 : target);
  const Icon = ICONS[stat.icon];

  useEffect(() => {
    if (!active || !hasNumber) return;
    const duration = 1000;
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
      className="flex flex-col items-center text-center gap-2 py-6 md:py-0 px-4 transition-all duration-500 ease-out"
      style={{
        transitionDelay: `${index * 100}ms`,
        opacity: active ? 1 : 0,
        transform: active ? "translateY(0)" : "translateY(10px)",
      }}
    >
      <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center mb-1">
        {Icon && <Icon className="w-5 h-5 text-brand" strokeWidth={1.75} />}
      </div>
      <div className="font-display text-3xl md:text-4xl text-ink leading-none tabular-nums">
        {hasNumber ? `${display}${suffix}` : stat.value}
      </div>
      <div className="text-sm text-ink/45">{stat.label}</div>
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
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="border-y border-line bg-sand" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-10 grid grid-cols-2 md:grid-cols-4 divide-y divide-line md:divide-y-0 md:divide-x">
        {stats.map((s, i) => (
          <AnimatedStat key={s.label} stat={s} index={i} active={active} />
        ))}
      </div>
    </section>
  );
}
