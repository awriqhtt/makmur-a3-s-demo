"use client";

import { useState, useEffect } from "react";
import { ShoppingCart, Check, Minus, Plus } from "lucide-react";
import Button from "@/components/ui/Button";
import { useCart } from "@/lib/cart-context";
import type { Product } from "@/lib/data";

const WHATSAPP_NUMBER = "6287878311243";

export default function ProductActions({ product }: { product: Product }) {
  const { items, addItem, updateQty } = useCart();
  const cartItem = items.find((i) => i.code === product.code);

  const [qty, setQty] = useState(cartItem?.qty ?? 1);
  const [added, setAdded] = useState(false);

  // Keep local selector synced if cart qty changes elsewhere (e.g. from ProductCard)
  useEffect(() => {
    if (cartItem) setQty(cartItem.qty);
  }, [cartItem?.qty]);

  const handleDec = () => {
    if (cartItem) {
      updateQty(product.code, cartItem.qty - 1);
    } else {
      setQty((q) => Math.max(1, q - 1));
    }
  };

  const handleInc = () => {
    if (cartItem) {
      updateQty(product.code, cartItem.qty + 1);
    } else {
      setQty((q) => q + 1);
    }
  };

  const handleAdd = () => {
    addItem(
      {
        code: product.code,
        name: product.name,
        categoryName: product.categoryName,
      },
      qty,
    );
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  const waMessage = encodeURIComponent(
    `Halo Makmur A3'S, saya mau tanya soal produk ${product.name} (${product.code}).`,
  );
  const waHref = `https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-widest text-ink/45 font-data">
          Kuantiti
        </span>
        <div className="inline-flex items-center bg-sand rounded-full">
          <button
            onClick={handleDec}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-ink hover:text-white transition-colors"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <span className="text-sm font-semibold font-data min-w-[3ch] text-center">
            {qty}
          </span>
          <button
            onClick={handleInc}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-ink hover:text-white transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
        {cartItem && (
          <span className="text-xs text-ink/45">sudah di keranjang</span>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {!cartItem && (
          <Button variant="brand" className="flex-1 w-full" onClick={handleAdd}>
            {added ? (
              <>
                Ditambahkan <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                Tambah ke cart <ShoppingCart className="w-4 h-4" />
              </>
            )}
          </Button>
        )}
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1"
        >
          <Button variant="outline" className="w-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 16 16"
              fill="currentColor"
              className="w-4 h-4"
            >
              <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
            </svg>{" "}
            WhatsApp
          </Button>
        </a>
      </div>
    </div>
  );
}
