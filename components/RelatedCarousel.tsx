"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import type { Product } from "@/lib/data";

export default function RelatedCarousel({ products }: { products: Product[] }) {
  return (
    <div className="relative group/carousel">
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth pb-2 -mx-5 px-5 md:mx-0 md:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {products.map((p) => (
          <div
            key={p.code}
            className="snap-start shrink-0 w-[68%] sm:w-[42%] md:w-[31%]"
          >
            <ProductCard product={p} />
          </div>
        ))}
      </div>

      {/* Desktop nav arrows — hidden on touch/mobile where swipe is natural */}
      <CarouselArrows />
    </div>
  );
}

function CarouselArrows() {
  return (
    <>
      <button
        type="button"
        aria-label="Sebelumnya"
        onClick={(e) => {
          const track = e.currentTarget
            .closest(".group\\/carousel")
            ?.querySelector("div.flex.overflow-x-auto") as HTMLElement | null;
          track?.scrollBy({ left: -260, behavior: "smooth" });
        }}
        className="hidden md:flex absolute -left-4 top-[35%] -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-line items-center justify-center shadow-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:border-brand"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <button
        type="button"
        aria-label="Berikutnya"
        onClick={(e) => {
          const track = e.currentTarget
            .closest(".group\\/carousel")
            ?.querySelector("div.flex.overflow-x-auto") as HTMLElement | null;
          track?.scrollBy({ left: 260, behavior: "smooth" });
        }}
        className="hidden md:flex absolute -right-4 top-[35%] -translate-y-1/2 w-9 h-9 rounded-full bg-white border border-line items-center justify-center shadow-sm opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:border-brand"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </>
  );
}
