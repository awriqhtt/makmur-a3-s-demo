"use client";

import { useEffect, useRef, useState } from "react";
import { INDUSTRIES, getIndustryIcon, getIndustryImage } from "@/lib/data";

// TODO: ganti dengan copy yang lebih spesifik per industri kalau ada.
// Key harus persis sama dengan value di INDUSTRIES.
const INDUSTRY_DESCRIPTIONS: Record<string, string> = {
  // "F&B": "Packaging food-grade siap pakai untuk resto, cafe, sampai cloud kitchen.",
  // "Retail": "Kemasan dan supply harian yang bikin operasional toko lebih rapi.",
};

function getIndustryDescription(name: string) {
  return (
    INDUSTRY_DESCRIPTIONS[name] ??
    `Solusi packaging yang disesuaikan untuk kebutuhan operasional ${name}.`
  );
}

// Ambang batas geser (px) sebelum mouse-down dianggap "drag".
// Di bawah ambang ini tetap dianggap klik biasa, bukan drag — jadi
// hover-reveal / tap-target di dalam card gak ke-intercept.
const DRAG_THRESHOLD = 5;

export default function IndustriesShowcase() {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const isPointerDown = useRef(false);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const startScrollLeft = useRef(0);
  const [isDraggingState, setIsDraggingState] = useState(false);

  const handlePointerDown = (e: React.MouseEvent) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    isPointerDown.current = true;
    isDragging.current = false;
    startX.current = e.clientX;
    startScrollLeft.current = scroller.scrollLeft;
  };

  const handlePointerMove = (e: React.MouseEvent) => {
    const scroller = scrollerRef.current;
    if (!scroller || !isPointerDown.current) return;

    const delta = e.clientX - startX.current;

    if (!isDragging.current && Math.abs(delta) > DRAG_THRESHOLD) {
      isDragging.current = true;
      setIsDraggingState(true);
    }

    if (isDragging.current) {
      e.preventDefault();
      scroller.scrollLeft = startScrollLeft.current - delta;
    }
  };

  const endDrag = () => {
    isPointerDown.current = false;
    // Reset isDragging sedikit belakangan supaya click yang nembak tepat
    // setelah mouseup (kalau nanti card ada link) masih bisa ke-cancel
    // lewat handleCardClickCapture.
    requestAnimationFrame(() => {
      isDragging.current = false;
      setIsDraggingState(false);
    });
  };

  // Cegah klik "nyangkut" ke card kalau user barusan drag (bukan klik biasa).
  const handleCardClickCapture = (e: React.MouseEvent) => {
    if (isDragging.current) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  return (
    <>
      {/* ===================== MOBILE — IG Story replica ===================== */}
      <MobileStoryInner />

      {/* ===================== DESKTOP — horizontal scroll, hover reveal, drag pakai cursor ===================== */}
      <div
        ref={scrollerRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onClickCapture={handleCardClickCapture}
        className={`hidden md:flex overflow-x-auto no-scrollbar gap-4 select-none ${
          isDraggingState
            ? "cursor-grabbing snap-none"
            : "cursor-grab snap-x snap-mandatory"
        }`}
      >
        {INDUSTRIES.map((ind) => {
          const Icon = getIndustryIcon(ind);
          return (
            <div
              key={ind}
              className="group relative shrink-0 w-[calc(100%/6_-_14px)] aspect-[3/4] snap-start rounded-2xl overflow-hidden hover-lift"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={getIndustryImage(ind)}
                alt={ind}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent" />

              <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center">
                <Icon className="w-4 h-4 text-ink" strokeWidth={1.5} />
              </div>

              <div className="absolute bottom-4 left-4 right-4">
                <span className="text-white font-medium text-sm block">
                  {ind}
                </span>
                <p className="text-white/75 text-xs leading-relaxed mt-1.5 max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100 transition-all duration-300 overflow-hidden">
                  {getIndustryDescription(ind)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function MobileStoryInner() {
  const SLIDE_DURATION = 4000;
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number>(0);
  const touchStartX = useRef<number | null>(null);

  const goTo = (i: number) => {
    setIndex((i + INDUSTRIES.length) % INDUSTRIES.length);
    setProgress(0);
    startRef.current = performance.now();
  };

  useEffect(() => {
    startRef.current = performance.now();

    const tick = (now: number) => {
      if (!paused) {
        const elapsed = now - startRef.current;
        const pct = Math.min(elapsed / SLIDE_DURATION, 1);
        setProgress(pct);
        if (pct >= 1) {
          goTo(index + 1);
        }
      } else {
        startRef.current = now - progress * SLIDE_DURATION;
      }
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, paused]);

  const active = INDUSTRIES[index];
  const ActiveIcon = getIndustryIcon(active);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    if (deltaX > 40) goTo(index - 1);
    else if (deltaX < -40) goTo(index + 1);
    touchStartX.current = null;
    setPaused(false);
  };

  return (
    <div
      className="md:hidden relative w-screen left-1/2 -translate-x-1/2 h-[80vh] overflow-hidden rounded-b-[32px] mb-10"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {INDUSTRIES.map((ind, i) => (
        <img
          key={ind}
          src={getIndustryImage(ind)}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ease-out"
          style={{ opacity: i === index ? 1 : 0 }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/75" />

      {/* progress bars */}
      <div className="absolute top-3 left-3 right-3 z-20 flex gap-1">
        {INDUSTRIES.map((ind, i) => (
          <div
            key={ind}
            className="h-[2.5px] flex-1 rounded-full bg-white/30 overflow-hidden"
          >
            <div
              className="h-full bg-white rounded-full"
              style={{
                width:
                  i < index
                    ? "100%"
                    : i === index
                      ? `${progress * 100}%`
                      : "0%",
                transition: i === index ? "none" : "width 0.2s ease",
              }}
            />
          </div>
        ))}
      </div>

      {/* profile row */}
      <div className="absolute top-7 left-3 right-3 z-20 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center ring-2 ring-white/40 shrink-0">
          <ActiveIcon className="w-4 h-4 text-ink" strokeWidth={1.5} />
        </div>
        <span className="text-white text-sm font-semibold tracking-tight">
          {active}
        </span>
        <span className="text-white/50 text-xs">· Industri kami</span>
      </div>

      {/* tap zones */}
      <button
        onClick={() => goTo(index - 1)}
        className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
        aria-label="Sebelumnya"
      />
      <button
        onClick={() => goTo(index + 1)}
        className="absolute right-0 top-0 bottom-0 w-1/3 z-10"
        aria-label="Berikutnya"
      />

      {/* caption */}
      <div className="absolute bottom-8 left-5 right-5 z-20 pointer-events-none">
        <span className="text-white/60 text-[11px] font-data uppercase tracking-widest mb-2 block">
          {active}
        </span>
        <h2
          key={active}
          className="font-display text-2xl text-white leading-[1.15]"
        >
          {getIndustryDescription(active)}
        </h2>
      </div>
    </div>
  );
}
