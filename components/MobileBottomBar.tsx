"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ClipboardList, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/cart-context";

// "Akun" was dropped: there's no account/login system yet, so it was
// quietly aliasing to /contact and just caused confusion. Cart is now the
// sole mobile entry point for the cart (the Header hides its cart icon on
// mobile — see components/Header.tsx row 1 actions).
const ITEMS = [
  { href: "/", label: "Beranda", icon: Home },
  { href: "/products", label: "Produk", icon: LayoutGrid },
  { href: "/kerjasama", label: "Kerja Sama", icon: ClipboardList },
  { href: "/quotation-list", label: "Cart", icon: ShoppingCart },
];

export default function MobileBottomBar() {
  const pathname = usePathname();
  const { count: cartCount } = useCart();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-line pb-[env(safe-area-inset-bottom)]"
      aria-label="Navigasi utama"
      suppressHydrationWarning
    >
      <div className="grid grid-cols-4 h-16" suppressHydrationWarning>
        {ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1"
            >
              {/* `relative` lives on this icon-sized wrapper (not on the
                  outer Link, which also contains the label below it) so the
                  badge below can anchor to just the icon with a plain
                  -top/-right offset — no magic numbers that break when the
                  grid's column count/width changes. */}
              <span
                className={`relative flex items-center justify-center w-9 h-6 rounded-full transition-colors ${
                  isActive ? "bg-brand/10" : ""
                }`}
                suppressHydrationWarning
              >
                <Icon
                  className={`w-[19px] h-[19px] ${isActive ? "text-brand" : "text-ink/55"}`}
                  strokeWidth={isActive ? 2.1 : 1.75}
                />
                {item.href === "/quotation-list" && cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-1 rounded-full bg-brand text-white text-[9px] font-data font-semibold flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </span>
              <span
                className={`text-[10px] font-medium ${isActive ? "text-brand" : "text-ink/55"}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
