"use client";

// app/quotation-list/page.tsx  (REVISI)
// Perubahan: produk dicari lewat getCatalogProduct (mendukung varian baru),
// dan gambar item memakai gambar grup kalau varian belum punya foto sendiri.
import Link from "next/link";
import Image from "next/image";
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  Layers,
} from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import Button from "@/components/ui/Button";
import { useCart } from "@/lib/cart-context";
import { getProductImagePath, getMoq } from "@/lib/data";
import { getCatalogProduct, getDisplayImageCode } from "@/lib/variants";

const WHATSAPP_NUMBER = "6287878311243";

export default function QuotationListPage() {
  const { items, updateQty, removeItem, clearCart, count } = useCart();

  const buildWhatsAppMessage = () => {
    const lines = items.map(
      (i, idx) => `${idx + 1}. ${i.name} (${i.code}) — ${i.qty} unit`,
    );
    return encodeURIComponent(
      `Halo Makmur A3'S, saya mau ajukan quotation untuk produk berikut:\n\n${lines.join(
        "\n",
      )}\n\nMohon info harga dan ketersediaannya. Terima kasih.`,
    );
  };

  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessage()}`;

  return (
    <div className="max-w-4xl mx-auto px-5 md:px-8 py-16">
      <SectionHeading
        eyebrow="Quotation builder"
        title="Quotation list kamu"
        body="Produk yang sudah kamu tambahkan untuk quotation. Follow up daftar ini lewat WhatsApp buat minta harga sekaligus."
      />

      {items.length === 0 ? (
        <div className="mt-14 border border-dashed border-line rounded-3xl py-20 flex flex-col items-center text-center">
          <ShoppingCart className="w-8 h-8 text-brand mb-4" />
          <p className="text-ink/45 max-w-sm mb-6">
            Belum ada produk di quotation list kamu. Jelajahi katalog dan
            tambahkan produk yang kamu butuhkan.
          </p>
          <Link href="/products">
            <Button variant="brand">
              Jelajahi produk <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-12">
          <div className="flex flex-col gap-3">
            {items.map((item) => {
              const imgCode = getDisplayImageCode(item.code);
              const imgSrc = imgCode ? getProductImagePath(imgCode) : null;
              const product = getCatalogProduct(item.code);
              // null kalau MOQ_ENABLED = false (lihat lib/data.ts), jadi
              // badge "Di bawah MOQ" otomatis tidak muncul.
              const moq = product ? getMoq(product) : null;
              const moqNum = moq ? parseInt(moq, 10) : NaN;
              const belowMoq = !isNaN(moqNum) && item.qty < moqNum;
              return (
                <div
                  key={item.code}
                  className="flex items-center gap-3 sm:gap-4 border border-line rounded-2xl p-4"
                >
                  <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-sand border border-line overflow-hidden shrink-0 flex items-center justify-center">
                    {imgSrc ? (
                      <Image
                        src={imgSrc}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <Layers
                        className="w-5 h-5 text-ink/15"
                        strokeWidth={1.3}
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-data text-ink/45 mb-1">
                      {item.code} · {item.categoryName}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-sm font-medium leading-snug truncate">
                        {item.name}
                      </div>
                      {belowMoq && (
                        <span className="text-[10px] font-data font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full whitespace-nowrap">
                          Di bawah MOQ (min. {moq})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 border border-line rounded-full shrink-0">
                    <button
                      onClick={() => updateQty(item.code, item.qty - 1)}
                      aria-label="Kurangi jumlah"
                      className="w-8 h-8 flex items-center justify-center hover:bg-sand rounded-full"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 text-center text-sm font-data">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => updateQty(item.code, item.qty + 1)}
                      aria-label="Tambah jumlah"
                      className="w-8 h-8 flex items-center justify-center hover:bg-sand rounded-full"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    onClick={() => removeItem(item.code)}
                    aria-label="Hapus dari quotation list"
                    className="w-9 h-9 flex items-center justify-center rounded-full text-ink/40 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-line pt-6">
            <div className="text-sm text-ink/45">
              {count} item di quotation list
            </div>
            <div className="flex gap-3 w-full sm:w-auto">
              <Button variant="ghost" onClick={clearCart} className="text-sm">
                Kosongkan
              </Button>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none"
              >
                <Button variant="brand" className="w-full">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                    className="w-4 h-4"
                  >
                    <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
                  </svg>{" "}
                  Kirim ke WhatsApp
                </Button>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
