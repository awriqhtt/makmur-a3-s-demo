"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Layers } from "lucide-react";
import { hasProductImage, getProductImagePath } from "@/lib/data";

const ZOOM_LEVEL = 2.2;

export default function ProductImage({
  code,
  name,
}: {
  code: string;
  name: string;
}) {
  const available = hasProductImage(code);
  const imageUrl = getProductImagePath(code);
  const containerRef = useRef<HTMLDivElement>(null);
  const [zooming, setZooming] = useState(false);
  const [bgPos, setBgPos] = useState({ x: 50, y: 50 });

  const handleMove = (e: React.MouseEvent) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setBgPos({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  };

  if (!available || !imageUrl) {
    return (
      <div className="bg-sand h-full w-full relative overflow-hidden flex items-center justify-center">
        <Layers className="w-20 h-20 text-ink/10" strokeWidth={1} />
        <span className="absolute bottom-4 left-4 right-4 h-1.5 tag-stripe opacity-30" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden group/zoom"
      onMouseEnter={() => setZooming(true)}
      onMouseLeave={() => setZooming(false)}
      onMouseMove={handleMove}
    >
      <div className="absolute inset-0 bg-sand">
        <Image
          src={imageUrl}
          alt={name}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover"
        />
      </div>

      {/* Zoom lens + magnified overlay — desktop only (needs mouse hover) */}
      {zooming && (
        <div
          className="absolute inset-0 pointer-events-none hidden md:block"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: `${ZOOM_LEVEL * 100}%`,
            backgroundPosition: `${bgPos.x}% ${bgPos.y}%`,
            backgroundRepeat: "no-repeat",
          }}
        />
      )}

      {zooming && (
        <div
          className="absolute w-16 h-16 border-2 border-white/80 bg-white/10 rounded-sm pointer-events-none hidden md:block shadow-lg"
          style={{
            left: `calc(${bgPos.x}% - 32px)`,
            top: `calc(${bgPos.y}% - 32px)`,
          }}
        />
      )}

      <span className="absolute bottom-4 left-4 right-4 h-1.5 tag-stripe opacity-30 pointer-events-none" />
    </div>
  );
}
