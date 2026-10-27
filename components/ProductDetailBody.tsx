"use client";

// components/ProductDetailBody.tsx  (REVISI: peringatan "Pilih ukuran/warna dulu")
// Bagian interaktif halaman detail: gambar, spesifikasi, pemilih varian, aksi.
// Produk dengan pilihan: saat dibuka belum ada varian terpilih, tombol cart ditahan
// sampai pengunjung memilih. page.tsx TIDAK perlu diubah.
// REVISI GAMBAR: sebelum memilih varian, gambar yang tampil = gambar default grup
// (getGroupImageCode), bukan gambar varian tertentu.
import { useEffect, useRef, useState } from "react";
import { AlertCircle } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import ProductActions from "@/components/ProductActions";
import VariantPicker from "@/components/VariantPicker";
import {
  getCatalogProduct,
  getDisplayImageCode,
  getGroupImageCode,
  getVariantLabel,
  needsVariantChoice,
} from "@/lib/variants";
import type { GroupDef } from "@/lib/variants";
import type { Product } from "@/lib/data";

export default function ProductDetailBody({
  product,
  group,
}: {
  product: Product;
  group: GroupDef | null;
}) {
  const [code, setCode] = useState(product.code);
  // Default: produk yang punya ukuran/warna/tipe TIDAK memilih apa pun, pengunjung wajib
  // memilih dulu. Pengecualian: link varian yang sudah dipilih (?dipilih=1, dibuat otomatis
  // setelah memilih) langsung terpilih, jadi link varian bisa dibagikan.
  const [unchosen, setUnchosen] = useState(() => needsVariantChoice(group));
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("dipilih") === "1") {
      setUnchosen(false);
    }
  }, []);

  const actionsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    actionsRef.current?.toggleAttribute("inert", unchosen);
  }, [unchosen]);

  const current = (group && getCatalogProduct(code)) || product;
  const variantDef = group?.variants.find((v) => v.code === code);
  const title = group ? group.name : product.name;
  const displayName =
    group && variantDef ? getVariantLabel(group, variantDef) : product.name;

  // Teks peringatan, mis. "Pilih ukuran & warna dulu". Hanya opsi yang punya >1 nilai.
  const choiceText = group
    ? group.options
        .filter(
          (o) =>
            new Set(group.variants.map((v) => v.values[o.key]).filter(Boolean))
              .size > 1,
        )
        .map((o) => o.label.toLowerCase())
        .join(" & ")
    : "";

  const handleSelect = (next: string) => {
    setCode(next);
    setUnchosen(false);
    // URL ikut berubah tanpa reload, jadi link tiap varian bisa dibagikan.
    window.history.replaceState(null, "", `/products/${next}?dipilih=1`);
  };

  const hasSize = !!current.size && current.size !== "-";

  // Sebelum memilih: gambar default grup (bukan gambar varian tertentu).
  // Setelah memilih: gambar varian, atau gambar grup kalau varian tidak punya gambar sendiri.
  const imageCode =
    unchosen && group
      ? (getGroupImageCode(group) ?? current.code)
      : (getDisplayImageCode(current.code) ?? current.code);

  return (
    <div className="grid md:grid-cols-2 gap-6 md:gap-10 items-start">
      {/* Gaya e-commerce: foto 1:1 di kiri (menempel saat scroll di desktop),
          info di kanan. Foto yang sama dengan kartu katalog. */}
      <div className="md:sticky md:top-24 aspect-square border border-line rounded-3xl overflow-hidden">
        <ProductImage code={imageCode} name={unchosen ? title : displayName} />
      </div>
      <div className="md:py-2">
        {!unchosen && (
          <span className="text-[11px] font-data font-semibold tracking-widest text-brand">
            {current.code}
          </span>
        )}
        <h1 className="font-display text-2xl md:text-3xl mt-1 mb-3 leading-tight">
          {title}
        </h1>

        {group && (
          <VariantPicker
            group={group}
            selectedCode={code}
            onSelect={handleSelect}
            unchosen={unchosen}
          />
        )}

        {/* Satuan = satuan jual dari pricelist (data pasti). Kolom Packaging
            & MOQ sengaja tidak ditampilkan dulu karena isinya masih
            sebagian tebakan (lihat TODO di lib/data.ts). */}
        <div className="grid grid-cols-2 gap-3 mb-4 font-data">
          <Spec label="Material" value={current.material} />
          {hasSize && !unchosen && <Spec label="Ukuran" value={current.size} />}
          <Spec label="Satuan" value={current.unit} />
          {/* col-span-2 supaya nama kategori yang panjang muat satu baris */}
          <div className="col-span-2">
            <Spec label="Kategori" value={current.divisionName} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mb-4">
          {["Hotel", "Restoran", "Katering", "Kafe"].map((tag) => (
            <span
              key={tag}
              className="text-xs bg-sand px-3 py-1.5 rounded-full text-ink/70"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Tombol cart & WhatsApp (ProductActions) tetap tampil tapi nonaktif
            selama belum memilih. `inert` memblokir klik, fokus keyboard, dan
            pembaca layar tanpa perlu mengubah ProductActions. */}
        {unchosen && (
          <p className="flex items-center gap-2 text-xs font-semibold text-amber-700 mb-3">
            <AlertCircle className="w-4 h-4 shrink-0" />
            Pilih {choiceText} dulu untuk menambah ke cart atau chat WhatsApp
          </p>
        )}
        <div
          ref={actionsRef}
          aria-disabled={unchosen}
          className={
            unchosen
              ? "opacity-40 grayscale pointer-events-none select-none"
              : ""
          }
        >
          <ProductActions product={current} displayName={displayName} />
        </div>
      </div>
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-ink/45 mb-1">
        {label}
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
