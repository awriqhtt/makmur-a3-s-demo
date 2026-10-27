"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Menu,
  X,
  Search,
  ClipboardList,
  ShoppingCart,
  Phone,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
} from "lucide-react";
import Logomark from "./Logomark";
import { DIVISIONS } from "@/lib/data";
import { CATALOG_PRODUCTS, groupCatalog } from "@/lib/variants";
import { useCart } from "@/lib/cart-context";

// "Produk" is handled separately below as an expandable accordion (it shows
// the 8 kategori inline), so it's marked with a special href instead of living
// in this flat list. "Kerja Sama" isn't in this list at all — it renders as
// its own sticky CTA button at the bottom of the drawer instead of a plain
// row, since it's the highest-priority action. Anchor items (href
// containing "#") are intentionally excluded from the "active" highlight —
// see isNavActive() for why.
//
// "Klien" (/industries) and "Artikel" (/#artikel) were removed from this
// nav per revision — the "Klien" preview section on the homepage stays
// as-is, it's just no longer linked from the navbar/drawer.
const NAV_ITEMS = [
  { href: "/", label: "Beranda" },
  { href: "__produk__", label: "Produk" },
  { href: "/about", label: "Tentang" },
  { href: "/keunggulan", label: "Keunggulan" },
  { href: "/contact", label: "Kontak" },
  { href: "/bantuan", label: "Bantuan" },
];

const SEARCH_PLACEHOLDER = "Cari produk, mis. Aluminium Foil, Cup 16oz…";
const MAX_PRODUCT_SUGGESTIONS = 5;
const MAX_DIVISION_SUGGESTIONS = 3;

// An anchor link (href with "#") points at a section of a page it shares
// with another nav item (e.g. "/#keunggulan" shares "/" with "Beranda").
// Matching only on pathname would light up both items at once, which reads
// as a bug. So anchor items never get the "active" treatment from pathname
// alone — only true, standalone routes do.
function isNavActive(href: string, pathname: string) {
  if (href.includes("#")) return false;
  return pathname === href;
}

type ProductSuggestion = { key: string; label: string; sub: string };

// Matches on product name, SKU code, and subkategori name so "cup",
// "CB-400", and "gelas" all find relevant results. Searches the full catalog
// (CATALOG_PRODUCTS, including generated variants) and collapses variants of
// the same group into ONE suggestion, same as the catalog cards. The label is
// the group name, which is a prefix of every variant name, so the search on
// /products?q=... always finds the card.
function getProductSuggestions(query: string): ProductSuggestion[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const matched = CATALOG_PRODUCTS.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.code.toLowerCase().includes(q) ||
      p.categoryName.toLowerCase().includes(q),
  );
  return groupCatalog(matched)
    .slice(0, MAX_PRODUCT_SUGGESTIONS)
    .map(({ product, group }) => ({
      key: group?.id ?? product.code,
      label: group?.name ?? product.name,
      sub: group
        ? product.categoryName
        : `${product.code} · ${product.categoryName}`,
    }));
}

// Separate match against KATEGORI (division) names — shown above the product
// matches so typing "cup" surfaces the whole "Cups, Lids & Beverage Packaging"
// kategori as a one-click filter, not just individual SKUs inside it.
function getDivisionSuggestions(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return DIVISIONS.filter((d) => d.name.toLowerCase().includes(q)).slice(
    0,
    MAX_DIVISION_SUGGESTIONS,
  );
}

// Shared dropdown used by both the desktop search bar and the mobile
// expanded search row — keeps the suggestion UI and behavior in one place
// instead of duplicating it per breakpoint.
function SearchSuggestions({
  query,
  onSelectProduct,
  onSelectDivision,
}: {
  query: string;
  onSelectProduct: (value: string) => void;
  onSelectDivision: (id: string) => void;
}) {
  const divisions = useMemo(() => getDivisionSuggestions(query), [query]);
  const products = useMemo(() => getProductSuggestions(query), [query]);
  if (divisions.length === 0 && products.length === 0) return null;

  return (
    <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-line rounded-2xl shadow-lg shadow-ink/10 overflow-hidden z-10">
      {divisions.length > 0 && (
        <div className="py-1.5">
          <div className="px-4 pt-1 pb-1 text-[10px] uppercase tracking-widest text-ink/35 font-data">
            Kategori
          </div>
          {divisions.map((d) => (
            <button
              key={d.id}
              type="button"
              // onMouseDown (not onClick) fires before the input's onBlur
              // closes the dropdown, so the selection registers instead of
              // getting dismissed first.
              onMouseDown={(e) => {
                e.preventDefault();
                onSelectDivision(d.id);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-sand transition-colors"
            >
              <d.icon
                className="w-4 h-4 text-brand shrink-0"
                strokeWidth={1.75}
              />
              <span className="text-sm font-medium text-ink truncate">
                {d.name}
              </span>
            </button>
          ))}
        </div>
      )}

      {divisions.length > 0 && products.length > 0 && (
        <div className="border-t border-line" />
      )}

      {products.length > 0 && (
        <div className="py-1.5">
          <div className="px-4 pt-1 pb-1 text-[10px] uppercase tracking-widest text-ink/35 font-data">
            Produk
          </div>
          {products.map((p) => (
            <button
              key={p.key}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onSelectProduct(p.label);
              }}
              className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-sand transition-colors"
            >
              <span className="min-w-0">
                <span className="block text-sm font-medium text-ink truncate">
                  {p.label}
                </span>
                <span className="block text-xs text-ink/45 font-data truncate">
                  {p.sub}
                </span>
              </span>
              <Search className="w-3.5 h-3.5 text-ink/30 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOnProducts = pathname === "/products";
  // Only accept a divisi id that still exists. Old bookmarks/links (e.g.
  // ?divisi=foil) then count as "All Products" instead of highlighting nothing.
  const divisiParam = isOnProducts ? searchParams.get("divisi") : null;
  const activeDivisi = DIVISIONS.some((d) => d.id === divisiParam)
    ? divisiParam
    : null;
  const isAllActive = isOnProducts && !activeDivisi;
  // Halaman Bantuan pakai chat widget full-width sendiri yang jadi
  // sticky-nya sendiri (lihat app/bantuan/page.tsx) — header situs sengaja
  // gak sticky di sini biar begitu discroll, dia geser naik ilang dan
  // digantikan chat widget yang "ambil alih" penuh layar. Baris quick-nav
  // kategori juga gak relevan di halaman ini jadi tetap disembunyiin.
  const hideDivisiBar = pathname === "/bantuan";
  const { count: cartCount } = useCart();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [produkOpen, setProdukOpen] = useState(false);
  const [searchOpenMobile, setSearchOpenMobile] = useState(false);
  const [query, setQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [suggestOpenDesktop, setSuggestOpenDesktop] = useState(false);
  const [suggestOpenMobile, setSuggestOpenMobile] = useState(false);

  const categoryScrollRef = useRef<HTMLElement>(null);
  const dragState = useRef({
    isDown: false,
    startX: 0,
    startScroll: 0,
    moved: false,
  });
  const [isDragging, setIsDragging] = useState(false);

  const onCategoryMouseDown = (e: React.MouseEvent) => {
    const el = categoryScrollRef.current;
    if (!el) return;
    dragState.current = {
      isDown: true,
      startX: e.pageX,
      startScroll: el.scrollLeft,
      moved: false,
    };
    setIsDragging(false);
  };

  const onCategoryMouseMove = (e: React.MouseEvent) => {
    const el = categoryScrollRef.current;
    if (!el || !dragState.current.isDown) return;
    const delta = e.pageX - dragState.current.startX;
    if (Math.abs(delta) > 4) {
      dragState.current.moved = true;
      setIsDragging(true);
    }
    el.scrollLeft = dragState.current.startScroll - delta;
  };

  const endCategoryDrag = () => {
    dragState.current.isDown = false;
    requestAnimationFrame(() => setIsDragging(false));
  };

  const onCategoryClickCapture = (e: React.MouseEvent) => {
    if (dragState.current.moved) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  // Hysteresis: enter the "scrolled" (shadow/compact height) state past
  // 40px, only leave it once below 20px. The dead zone in between
  // stops momentum-scroll/trackpad jitter from toggling it back and forth.
  useEffect(() => {
    const onScroll = () => {
      setScrolled((prev) => {
        if (window.scrollY > 40) return true;
        if (window.scrollY < 20) return false;
        return prev;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Collapse the Produk accordion whenever the drawer closes, so it doesn't
  // reopen already-expanded next time for no reason.
  useEffect(() => {
    if (!drawerOpen) setProdukOpen(false);
  }, [drawerOpen]);

  const runSearch = (value: string) => {
    router.push(
      value.trim()
        ? `/products?q=${encodeURIComponent(value.trim())}`
        : "/products",
    );
    setSearchOpenMobile(false);
    setSuggestOpenDesktop(false);
    setSuggestOpenMobile(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  const handleSelectProduct = (value: string) => {
    setQuery(value);
    runSearch(value);
  };

  const handleSelectDivision = (id: string) => {
    router.push(`/products?divisi=${id}`, { scroll: false });
    setQuery("");
    setSearchOpenMobile(false);
    setSuggestOpenDesktop(false);
    setSuggestOpenMobile(false);
  };

  return (
    <>
      <header
        className={`${hideDivisiBar ? "" : "sticky top-0"} z-50 bg-white/95 border-b transition-shadow duration-300 ${
          scrolled
            ? "border-line shadow-md shadow-ink/5"
            : "border-line shadow-none"
        }`}
        suppressHydrationWarning
      >
        {/* ROW 1 — logo/hamburger (left) | search (grows) | actions (right) */}
        <div
          className={`max-w-7xl mx-auto px-5 md:px-8 flex items-center gap-4 transition-[height] duration-300 ${
            scrolled ? "h-16" : "h-20"
          }`}
          suppressHydrationWarning
        >
          <Link href="/" className="shrink-0">
            <Logomark compact={scrolled} />
          </Link>

          <button
            onClick={() => setDrawerOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-brand/10 hover:text-brand transition-colors shrink-0"
            aria-label="Buka menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <form
            onSubmit={handleSearchSubmit}
            className="hidden md:flex flex-1 min-w-0"
          >
            <div className="relative w-full" suppressHydrationWarning>
              <Search className="w-4 h-4 text-ink/45 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSuggestOpenDesktop(true)}
                onBlur={() => setSuggestOpenDesktop(false)}
                placeholder={SEARCH_PLACEHOLDER}
                className="w-full border border-line rounded-full pl-11 pr-4 py-2.5 text-sm outline-none focus:border-brand transition-colors bg-sand/60 focus:bg-white truncate"
              />
              {suggestOpenDesktop && (
                <SearchSuggestions
                  query={query}
                  onSelectProduct={handleSelectProduct}
                  onSelectDivision={handleSelectDivision}
                />
              )}
            </div>
          </form>

          {/* Actions — mobile: search icon only (cart lives in the Bottom
              Bar, contact lives in the drawer — see components/MobileBottomBar.tsx
              and the drawer's NAV_ITEMS above). Desktop order left to right:
              search icon is hidden (full search bar takes its place), cart,
              contact, Ajukan Kerja Sama (primary CTA, always last).
              ml-auto pushes this block to the far right on mobile, since the
              flex-1 search form that normally does that job is hidden there;
              md:ml-0 cancels it on desktop where the search form already fills
              the gap. */}
          <div
            className="flex items-center gap-2 md:gap-3 shrink-0 ml-auto md:ml-0"
            suppressHydrationWarning
          >
            <button
              onClick={() => setSearchOpenMobile((v) => !v)}
              className="md:hidden w-10 h-10 flex items-center justify-center rounded-full hover:bg-brand/10 hover:text-brand transition-colors"
              aria-label="Cari"
            >
              <Search className="w-5 h-5" />
            </button>

            <Link
              href="/quotation-list"
              className="hidden md:flex relative w-10 h-10 items-center justify-center rounded-full hover:bg-brand/10 hover:text-brand transition-colors"
              aria-label="Cart"
              title="Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-brand text-white text-[10px] font-data font-semibold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            <Link
              href="/contact"
              className="hidden md:flex w-10 h-10 items-center justify-center rounded-full hover:bg-brand/10 hover:text-brand transition-colors"
              aria-label="Kontak"
              title="Kontak"
            >
              <Phone className="w-5 h-5" />
            </Link>

            {/* Ajukan Kerja Sama — primary CTA, always the rightmost element */}
            <Link
              href="/kerjasama"
              className="hidden md:flex items-center gap-2 pl-4 pr-5 py-2.5 rounded-full bg-ink text-white text-sm font-medium hover:bg-brand transition-colors shrink-0"
            >
              <ClipboardList className="w-4 h-4" />
              <span className={scrolled ? "hidden lg:inline" : "inline"}>
                Ajukan Kerja Sama
              </span>
            </Link>
          </div>
        </div>

        {searchOpenMobile && (
          <form onSubmit={handleSearchSubmit} className="md:hidden px-5 pb-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-ink/45 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setSuggestOpenMobile(true)}
                onBlur={() => setSuggestOpenMobile(false)}
                placeholder={SEARCH_PLACEHOLDER}
                className="w-full border border-line rounded-full pl-11 pr-4 py-2.5 text-sm outline-none focus:border-ink bg-white"
              />
              {suggestOpenMobile && (
                <SearchSuggestions
                  query={query}
                  onSelectProduct={handleSelectProduct}
                  onSelectDivision={handleSelectDivision}
                />
              )}
            </div>
          </form>
        )}

        {/* Kategori quick-nav — visible on every page including /products,
            and always reachable since <header> (this whole block) is
            sticky and never hides. This is the ONE sticky control for
            kategori selection; the sidebar in ProductsClient shows
            Subkategori (one level down, scoped to the active kategori)
            instead of duplicating this same list.
            EXCEPTION: hidden on /bantuan — see hideDivisiBar above. */}
        {!hideDivisiBar && (
          <div
            className="border-t border-line bg-white"
            suppressHydrationWarning
          >
            <div
              className="max-w-7xl mx-auto px-5 md:px-8"
              suppressHydrationWarning
            >
              <nav
                ref={categoryScrollRef}
                onMouseDown={onCategoryMouseDown}
                onMouseMove={onCategoryMouseMove}
                onMouseUp={endCategoryDrag}
                onMouseLeave={endCategoryDrag}
                onClickCapture={onCategoryClickCapture}
                className={`flex items-center gap-1 overflow-x-auto no-scrollbar -mx-1 select-none transition-[padding] duration-300 ${
                  scrolled ? "py-1.5" : "py-2.5"
                } ${isDragging ? "cursor-grabbing" : "cursor-grab"}`}
              >
                <Link
                  href="/products"
                  draggable={false}
                  className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                    isAllActive
                      ? "bg-brand/10 text-brand"
                      : "text-ink/70 hover:text-brand hover:bg-sand"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.75} />
                  All Products
                </Link>
                {DIVISIONS.map((d) => {
                  const isActive = activeDivisi === d.id;
                  return (
                    <Link
                      key={d.id}
                      href={`/products?divisi=${d.id}`}
                      draggable={false}
                      className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? "bg-brand/10 text-brand"
                          : "text-ink/70 hover:text-brand hover:bg-sand"
                      }`}
                    >
                      <d.icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                      {d.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        )}
      </header>

      {/* HAMBURGER DRAWER — sibling of <header>, not nested inside it.
          <header> no longer uses backdrop-blur, so this fixed drawer isn't
          trapped in a containing block and correctly covers the full viewport. */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 h-20 border-b border-line">
              <Logomark />
              <button
                onClick={() => setDrawerOpen(false)}
                className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-sand"
                aria-label="Tutup menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <div className="px-5 text-xs uppercase tracking-widest text-ink/40 font-data mb-2">
                Menu
              </div>

              {NAV_ITEMS.map((item) => {
                // "Produk" is a special accordion entry, not a plain link —
                // it expands in place to show the 8 kategori inline instead of
                // navigating away and duplicating that list further down.
                if (item.href === "__produk__") {
                  return (
                    <div key="produk" className="border-b border-line/60">
                      <button
                        type="button"
                        onClick={() => setProdukOpen((v) => !v)}
                        aria-expanded={produkOpen}
                        className={`w-full flex items-center justify-between px-5 py-3.5 text-base font-medium ${
                          isOnProducts ? "text-brand" : "text-ink"
                        }`}
                      >
                        Produk
                        <ChevronDown
                          className={`w-4 h-4 text-ink/30 transition-transform duration-200 ${
                            produkOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {produkOpen && (
                        <div className="pb-2 bg-sand/40">
                          <Link
                            href="/products"
                            onClick={() => setDrawerOpen(false)}
                            className={`flex items-center gap-3 px-8 py-2.5 text-sm ${
                              isAllActive
                                ? "text-brand font-medium"
                                : "text-ink/70"
                            } hover:text-ink`}
                          >
                            <LayoutGrid
                              className="w-4 h-4 text-brand"
                              strokeWidth={1.5}
                            />
                            Semua Produk
                          </Link>
                          {DIVISIONS.map((d) => {
                            const isActive = activeDivisi === d.id;
                            return (
                              <Link
                                key={d.id}
                                href={`/products?divisi=${d.id}`}
                                onClick={() => setDrawerOpen(false)}
                                className={`flex items-center gap-3 px-8 py-2.5 text-sm ${
                                  isActive
                                    ? "text-brand font-medium"
                                    : "text-ink/70"
                                } hover:text-ink`}
                              >
                                <d.icon
                                  className="w-4 h-4 text-brand"
                                  strokeWidth={1.5}
                                />
                                {d.name}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                const active = isNavActive(item.href, pathname);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center justify-between px-5 py-3.5 text-base font-medium border-b border-line/60 ${
                      active ? "text-brand" : "text-ink"
                    }`}
                  >
                    {item.label}
                    <ChevronRight className="w-4 h-4 text-ink/30" />
                  </Link>
                );
              })}
            </div>

            {/* Sticky CTA — "Kerja Sama" lives here instead of in the scrollable
                list above, so it's always visible and reads as the priority
                action rather than one more row to scroll past. */}
            <div className="p-5 border-t border-line shrink-0">
              <Link
                href="/kerjasama"
                onClick={() => setDrawerOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-ink text-white text-sm font-semibold hover:bg-brand transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                Ajukan Kerja Sama
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
