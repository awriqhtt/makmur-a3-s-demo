"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/data";

const DRAG_THRESHOLD = 6; // px — di bawah ini dianggap klik, bukan drag

export default function FeaturedProductsCarousel({
  products,
}: {
  products: Product[];
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const isPointerDown = useRef(false);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartScroll = useRef(0);

  const updateArrows = () => {
    const el = scrollerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  };

  const scrollByCards = (direction: 1 | -1) => {
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>("[data-card]");
    const step = card ? card.offsetWidth + 20 : el.clientWidth * 0.8;
    el.scrollBy({ left: step * direction, behavior: "smooth" });
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const el = scrollerRef.current;
    if (!el) return;
    isPointerDown.current = true;
    isDragging.current = false;
    dragStartX.current = e.clientX;
    dragStartScroll.current = el.scrollLeft;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const el = scrollerRef.current;
    if (!el || !isPointerDown.current) return;

    const delta = e.clientX - dragStartX.current;

    if (!isDragging.current && Math.abs(delta) > DRAG_THRESHOLD) {
      isDragging.current = true;
      el.setPointerCapture(e.pointerId);
      el.classList.add("cursor-grabbing");
      el.classList.remove("cursor-grab");
    }

    if (isDragging.current) {
      el.scrollLeft = dragStartScroll.current - delta;
    }
  };

  const endDrag = (e: React.PointerEvent) => {
    const el = scrollerRef.current;
    isPointerDown.current = false;
    if (isDragging.current && el?.hasPointerCapture(e.pointerId)) {
      el.releasePointerCapture(e.pointerId);
    }
    isDragging.current = false;
    el?.classList.remove("cursor-grabbing");
    el?.classList.add("cursor-grab");
  };

  return (
    <div className="group/carousel relative">
      <div
        ref={scrollerRef}
        onScroll={updateArrows}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        className="flex gap-5 overflow-x-auto cursor-grab select-none snap-x snap-mandatory scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {products.map((p) => (
          <div
            key={p.code}
            data-card
            className="snap-start shrink-0 w-[85%] sm:w-[calc(50%-10px)] lg:w-[calc(25%-15px)]"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      {canScrollLeft && (
        <button
          type="button"
          aria-label="Geser ke kiri"
          onClick={() => scrollByCards(-1)}
          className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-11 h-11 items-center justify-center rounded-full border border-line bg-white text-ink shadow-md opacity-0 group-hover/carousel:opacity-100 hover:!opacity-100 hover:border-brand hover:text-brand transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {canScrollRight && (
        <button
          type="button"
          aria-label="Geser ke kanan"
          onClick={() => scrollByCards(1)}
          className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-11 h-11 items-center justify-center rounded-full border border-line bg-white text-ink shadow-md opacity-0 group-hover/carousel:opacity-100 hover:!opacity-100 hover:border-brand hover:text-brand transition-all"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
