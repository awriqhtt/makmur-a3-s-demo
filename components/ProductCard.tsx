"use client";

// components/ProductCard.tsx  (REVISI)
// Props tetap `product`, jadi RelatedCarousel tidak perlu diubah.
// Kalau produk bagian dari grup varian, kartu tampil sebagai satu produk grup.
// Tombol selalu "Tambah ke cart". Kalau produk punya pilihan ukuran/warna/tipe,
// klik tombol diarahkan ke halaman detail untuk memilih dulu.
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Layers, ArrowUpRight, ShoppingCart, Minus, Plus } from "lucide-react";
import type { Product } from "@/lib/data";
import { hasProductImage, getProductImagePath, getMoq } from "@/lib/data";
import { useCart } from "@/lib/cart-context";
import {
  getGroupByCode,
  getGroupImageCode,
  getGroupVariants,
  needsVariantChoice,
} from "@/lib/variants";

export default function ProductCard({ product }: { product: Product }) {
  const router = useRouter();
  const { items, addItem, updateQty } = useCart();

  const group = getGroupByCode(product.code);
  const mustChoose = needsVariantChoice(group);

  // Gambar dideteksi otomatis dari public/products/ via lib/product-images.generated.json
  // Untuk grup: pakai gambar gabungan grup.
  const imgCode = group ? getGroupImageCode(group) : product.code;
  const available = imgCode ? hasProductImage(imgCode) : false;
  const imageSrc = imgCode ? getProductImagePath(imgCode) : null;

  const title = group ? group.name : product.name;
  // Badge foto = kode produk di semua kartu (grup: kode varian pertama).
  // Info pilihan pindah ke baris di bawah judul, mis. "5 ukuran, 2 warna".
  const badge = group
    ? (getGroupVariants(group)[0]?.product.code ?? product.code)
    : product.code;
  const groupInfo = group
    ? group.options
        .map((o) => {
          const n = new Set(
            group.variants.map((v) => v.values[o.key]).filter(Boolean),
          ).size;
          // Lebar/panjang/berat = ukuran, ditulis seragam "ukuran".
          // Warna dan tipe tetap memakai namanya sendiri.
          const l = o.label.toLowerCase();
          const label = ["lebar", "panjang", "berat"].includes(l)
            ? "ukuran"
            : l;
          return n > 1 ? `${n} ${label}` : null;
        })
        .filter(Boolean)
        .join(", ")
    : "";
  // Baris bawah judul = info pilihan, hanya untuk produk yang punya pilihan
  // ("5 ukuran, 2 warna"). Produk tunggal tidak punya baris ini; ukuran dan satuannya
  // ada di halaman detail.
  const info = groupInfo;

  // null kalau MOQ_ENABLED = false (lihat lib/data.ts). Grup tidak menampilkan MOQ.
  const moq = group ? null : getMoq(product);

  // Deretan swatch kecil kalau grup punya opsi warna.
  const swatchOpt = group?.options.find((o) => o.swatches);
  const swatchColors =
    group && swatchOpt
      ? Array.from(new Set(group.variants.map((v) => v.values[swatchOpt.key])))
          .map((val) => swatchOpt.swatches![val])
          .filter(Boolean)
      : [];

  const cartItem = items.find((i) => i.code === product.code);

  const stop = (e: React.MouseEvent) => e.stopPropagation();

  const handleAdd = (e: React.MouseEvent) => {
    stop(e);
    if (mustChoose) {
      // Arahkan ke detail; di sana belum ada varian terpilih (peringatan "Pilih ukuran/warna").
      router.push(`/products/${product.code}`);
      return;
    }
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
            alt={title}
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
          {badge}
        </span>
        <span className="absolute bottom-0 left-0 right-0 h-1.5 tag-stripe opacity-40" />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="text-[10px] uppercase tracking-widest text-brand font-data font-semibold mb-1.5">
          {product.categoryName}
        </div>
        <h3
          className={`font-semibold text-ink leading-snug ${info ? "mb-1" : "mb-3"}`}
        >
          {title}
        </h3>
        {info && <p className="text-xs text-ink/50 font-data mb-3">{info}</p>}

        <div className="mt-auto">
          <div className="flex flex-col gap-1.5 text-xs text-ink/45 font-data border-t border-line pt-3 mb-3">
            {moq && <span>MOQ {moq}</span>}
            {swatchColors.length > 0 && (
              <span className="inline-flex items-center gap-1">
                {swatchColors.slice(0, 5).map((c) => (
                  <span
                    key={c}
                    className="w-3.5 h-3.5 rounded-full border border-ink/25"
                    style={{ backgroundColor: c }}
                  />
                ))}
                {swatchColors.length > 5 && (
                  <span className="ml-0.5">+{swatchColors.length - 5}</span>
                )}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-ink group-hover:text-brand font-semibold transition-colors">
              Lihat spesifikasi <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>

          {cartItem && !mustChoose ? (
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
