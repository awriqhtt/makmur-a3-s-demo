"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { Layers, ArrowUpRight, ShoppingCart, Minus, Plus } from "lucide-react";
import type { Product } from "@/lib/data";
import { hasProductImage, getProductImagePath } from "@/lib/data";
import { useCart } from "@/lib/cart-context";

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { items, addItem, updateQty } = useCart();
  // Gambar dideteksi otomatis dari public/products/ via lib/product-images.generated.json
  // (dibangun oleh scripts/generate-image-manifest.mjs). Tinggal taruh file, gak perlu
  // update kode manual lagi.
  const available = hasProductImage(product.code);
  const imageSrc = getProductImagePath(product.code);

  const cartItem = items.find((i) => i.code === product.code);

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const handleAdd = (e: React.MouseEvent) => {
    stop(e);
    addItem({
      code: product.code,
      name: product.name,
      categoryName: product.categoryName,
    });
  };

  const handleInc = (e: React.MouseEvent) => {
    stop(e);
    if (cartItem) updateQty(product.code, cartItem.qty + 1);
  };

  const handleDec = (e: React.MouseEvent) => {
    stop(e);
    if (cartItem) updateQty(product.code, cartItem.qty - 1);
  };

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={() => router.push(`/products/${product.code}`)}
      onKeyDown={(e) =>
        e.key === "Enter" && router.push(`/products/${product.code}`)
      }
      className="group text-left bg-white border border-line rounded-2xl overflow-hidden hover-lift cursor-pointer flex flex-col h-full"
    >
      <div className="relative h-40 shrink-0 bg-sand flex items-center justify-center border-b border-line overflow-hidden">
        {available && imageSrc ? (
          <Image
            src={imageSrc}
            alt={product.name}
            fill
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover"
          />
        ) : (
          <Layers
            className="w-10 h-10 text-ink/15 group-hover:text-brand/30 transition-colors"
            strokeWidth={1.3}
          />
        )}
        <span className="absolute top-3 left-3 text-[10px] font-data font-semibold tracking-widest text-ink/45 bg-white/80 px-2 py-1 rounded-full border border-line">
          {product.code}
        </span>
        <span className="absolute bottom-0 left-0 right-0 h-1.5 tag-stripe opacity-40" />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="text-[10px] uppercase tracking-widest text-brand font-data font-semibold mb-1.5">
          {product.categoryName}
        </div>
        <h3 className="font-semibold text-ink leading-snug mb-3">
          {product.name}
        </h3>

        <div className="mt-auto">
          <div className="flex flex-col gap-1.5 text-xs text-ink/45 font-data border-t border-line pt-3 mb-3">
            <span>MOQ {product.moq}</span>
            <span className="inline-flex items-center gap-1 text-ink group-hover:text-brand font-semibold transition-colors">
              Lihat spesifikasi <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {cartItem ? (
            <div className="w-full inline-flex items-center justify-between bg-brand text-white rounded-full py-1.5 px-2">
              <button
                onClick={handleDec}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="text-sm font-semibold font-data min-w-[2ch] text-center">
                {cartItem.qty}
              </span>
              <button
                onClick={handleInc}
                className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAdd}
              className="w-full inline-flex items-center justify-center gap-2 text-xs font-semibold rounded-full py-2.5 bg-sand text-ink hover:bg-ink hover:text-white transition-colors"
            >
              Tambah ke cart <ShoppingCart className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
