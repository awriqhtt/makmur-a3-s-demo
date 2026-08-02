"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  X,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { DIVISIONS, ALL_PRODUCTS } from "@/lib/data";

const PAGE_SIZE = 12;

function sortProducts<T extends { name: string; code: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name));
}

// Full Kategori tree, grouped by Divisi — always shows every divisi and
// its kategori, regardless of what's currently active (fixes the "pick a
// divisi first" dead end). No product-count badges — this list is purely
// for picking a filter, counts just added visual noise. One click per row
// does everything: selecting a divisi also opens its kategori list, no
// separate chevron hit-target to reason about.
// Accordion behavior: only one divisi's kategori list is expanded at a
// time — opening another one auto-closes whichever was open.
function KategoriTree({
  activeDivisiId,
  activeKategoriId,
  expandedId,
  onToggleGroup,
  onSelectDivisi,
  onSelectKategori,
}: {
  activeDivisiId: string;
  activeKategoriId: string | null;
  expandedId: string | null;
  onToggleGroup: (divisiId: string) => void;
  onSelectDivisi: (divisiId: string) => void;
  onSelectKategori: (divisiId: string, kategoriId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => onSelectDivisi("all")}
        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
          activeDivisiId === "all"
            ? "bg-ink text-white"
            : "text-ink/70 hover:bg-sand"
        }`}
      >
        <LayoutGrid className="w-4 h-4 shrink-0" strokeWidth={1.75} />
        Semua Produk
      </button>

      {DIVISIONS.map((d) => {
        const isDivisiActive = activeDivisiId === d.id;
        const isExpanded = expandedId === d.id;
        return (
          <div key={d.id}>
            <button
              onClick={() => {
                onSelectDivisi(d.id);
                onToggleGroup(d.id);
              }}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                isDivisiActive && !activeKategoriId
                  ? "bg-ink text-white"
                  : "text-ink/70 hover:bg-sand"
              }`}
            >
              <d.icon className="w-4 h-4 shrink-0" strokeWidth={1.75} />
              <span className="truncate flex-1">{d.name}</span>
              <ChevronDown
                className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                  isExpanded ? "rotate-180" : ""
                } ${
                  isDivisiActive && !activeKategoriId
                    ? "text-white/70"
                    : "text-ink/30"
                }`}
              />
            </button>

            {isExpanded && (
              <div className="ml-4 pl-3 border-l border-line flex flex-col gap-0.5 mt-0.5 mb-1">
                {d.categories.map((c) => {
                  const isActive = isDivisiActive && activeKategoriId === c.id;
                  return (
                    <button
                      key={c.id}
                      onClick={() => onSelectKategori(d.id, c.id)}
                      className={`px-3 py-2 rounded-lg text-sm text-left truncate transition-colors ${
                        isActive
                          ? "bg-ink text-white font-medium"
                          : "text-ink/60 hover:bg-sand"
                      }`}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function ProductsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState("");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [page, setPage] = useState(1);

  const rawDivisi = searchParams.get("divisi");
  const activeDivisiId =
    rawDivisi && DIVISIONS.some((d) => d.id === rawDivisi) ? rawDivisi : "all";
  const activeDivision = DIVISIONS.find((d) => d.id === activeDivisiId);

  const rawKategori = searchParams.get("kategori");
  const activeKategoriId =
    activeDivision &&
    rawKategori &&
    activeDivision.categories.some((c) => c.id === rawKategori)
      ? rawKategori
      : null;

  // Which divisi group is expanded in the sidebar tree — accordion style,
  // only one at a time. Starts with the active one open (if any) so the
  // tree isn't a wall of collapsed groups on first load.
  const [expandedId, setExpandedId] = useState<string | null>(
    activeDivisiId !== "all" ? activeDivisiId : null,
  );

  // If the URL's divisi changes from somewhere else (Header strip, back
  // button), make sure that group is expanded too instead of leaving it
  // collapsed while showing as "active".
  useEffect(() => {
    if (activeDivisiId !== "all") {
      setExpandedId(activeDivisiId);
    }
  }, [activeDivisiId]);

  useEffect(() => {
    setQuery(searchParams.get("q") ?? "");
  }, [searchParams]);

  useEffect(() => {
    const id = setTimeout(() => {
      const params = new URLSearchParams();
      if (activeDivisiId !== "all") params.set("divisi", activeDivisiId);
      if (activeKategoriId) params.set("kategori", activeKategoriId);
      if (query.trim()) params.set("q", query.trim());
      const qs = params.toString();
      const target = qs ? `/products?${qs}` : "/products";
      const current = window.location.pathname + window.location.search;
      if (target !== current) {
        router.push(target, { scroll: false });
      }
    }, 400);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const scrollToGridTop = () => {
    requestAnimationFrame(() => {
      document
        .getElementById("product-grid-top")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const goToDivisi = (divisiId: string) => {
    const params = new URLSearchParams();
    if (divisiId !== "all") params.set("divisi", divisiId);
    if (query.trim()) params.set("q", query.trim());
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products", { scroll: false });
    setMobileFilterOpen(false);
    scrollToGridTop();
  };

  // Picking a kategori sets BOTH divisi and kategori in one go — a kategori
  // always belongs to exactly one divisi, so there's no such thing as
  // "kategori without a divisi". This also keeps the Header's sticky divisi
  // strip in sync automatically, no extra state needed.
  const goToKategori = (divisiId: string, kategoriId: string) => {
    const params = new URLSearchParams();
    params.set("divisi", divisiId);
    params.set("kategori", kategoriId);
    if (query.trim()) params.set("q", query.trim());
    router.push(`/products?${params.toString()}`, { scroll: false });
    setMobileFilterOpen(false);
    scrollToGridTop();
  };

  const toggleGroup = (divisiId: string) => {
    setExpandedId((prev) => (prev === divisiId ? null : divisiId));
  };

  const filtered = useMemo(() => {
    const matches = ALL_PRODUCTS.filter((p) => {
      const matchDivisi =
        activeDivisiId === "all" || p.divisionId === activeDivisiId;
      const matchKategori =
        !activeKategoriId || p.categoryId === activeKategoriId;
      const matchQuery =
        query.trim() === "" ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.code.toLowerCase().includes(query.toLowerCase());
      return matchDivisi && matchKategori && matchQuery;
    });
    return sortProducts(matches);
  }, [activeDivisiId, activeKategoriId, query]);

  useEffect(() => {
    setPage(1);
  }, [activeDivisiId, activeKategoriId, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const goToPage = (p: number) => {
    setPage(Math.min(Math.max(1, p), totalPages));
    document
      .getElementById("product-grid-top")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearQuery = () => {
    const params = new URLSearchParams();
    if (activeDivisiId !== "all") params.set("divisi", activeDivisiId);
    if (activeKategoriId) params.set("kategori", activeKategoriId);
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products", { scroll: false });
  };

  const mobileFilterLabel = activeKategoriId
    ? activeDivision?.categories.find((c) => c.id === activeKategoriId)?.name
    : activeDivisiId !== "all"
      ? activeDivision?.name
      : "Filter";

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-16">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-sand flex items-center justify-center shrink-0">
          {activeDivisiId === "all" ? (
            <LayoutGrid className="w-5 h-5 text-ink" strokeWidth={1.75} />
          ) : (
            activeDivision && (
              <activeDivision.icon
                className="w-5 h-5 text-ink"
                strokeWidth={1.75}
              />
            )
          )}
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-xl md:text-2xl leading-snug">
            {activeKategoriId
              ? activeDivision?.categories.find(
                  (c) => c.id === activeKategoriId,
                )?.name
              : activeDivisiId === "all"
                ? "Semua Produk"
                : activeDivision?.name}
          </h1>
          <p className="text-sm text-ink/45 leading-relaxed truncate">
            {activeDivisiId === "all"
              ? "Filter berdasarkan divisi/kategori atau cari nama/kode produk."
              : activeDivision?.blurb}
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 mt-10">
        <aside className="hidden lg:block w-64 shrink-0">
          <div>
            <div className="text-xs uppercase tracking-widest text-ink/40 font-data mb-3 px-1">
              Divisi & Kategori
            </div>
            <KategoriTree
              activeDivisiId={activeDivisiId}
              activeKategoriId={activeKategoriId}
              expandedId={expandedId}
              onToggleGroup={toggleGroup}
              onSelectDivisi={goToDivisi}
              onSelectKategori={goToKategori}
            />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-ink/45 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama atau kode produk…"
                className="w-full border border-line rounded-full pl-11 pr-10 py-2.5 text-sm outline-none focus:border-ink bg-sand/60 focus:bg-white transition-colors"
              />
              {query.trim() && (
                <button
                  onClick={clearQuery}
                  aria-label="Hapus pencarian"
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full hover:bg-ink/10"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full border border-line text-sm font-medium text-ink/70 hover:border-ink transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              {mobileFilterLabel}
            </button>
          </div>

          <div className="text-xs text-ink/45 font-data mb-6">
            {filtered.length} produk
            {query.trim() && <> · hasil untuk &quot;{query}&quot;</>}
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-24 text-ink/45">
              Gak ada produk yang cocok dengan &quot;{query}&quot;. Coba keyword
              atau divisi/kategori lain.
            </div>
          ) : (
            <>
              <div
                id="product-grid-top"
                className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-5 scroll-mt-24"
              >
                {paginated.map((p) => (
                  <ProductCard key={p.code} product={p} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between gap-4 mt-10 pt-6 border-t border-line">
                  <span className="text-xs text-ink/45 font-data">
                    Halaman {page} dari {totalPages} · {filtered.length} produk
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => goToPage(page - 1)}
                      disabled={page === 1}
                      aria-label="Halaman sebelumnya"
                      className="w-9 h-9 flex items-center justify-center rounded-full border border-line text-ink/70 hover:border-ink disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(
                        (p) =>
                          p === 1 ||
                          p === totalPages ||
                          Math.abs(p - page) <= 1,
                      )
                      .map((p, idx, arr) => (
                        <span key={p} className="flex items-center gap-1.5">
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <span className="text-ink/30 text-sm px-0.5">
                              …
                            </span>
                          )}
                          <button
                            onClick={() => goToPage(p)}
                            className={`w-9 h-9 flex items-center justify-center rounded-full text-sm font-medium transition-colors ${
                              p === page
                                ? "bg-ink text-white"
                                : "text-ink/70 hover:bg-sand"
                            }`}
                          >
                            {p}
                          </button>
                        </span>
                      ))}
                    <button
                      onClick={() => goToPage(page + 1)}
                      disabled={page === totalPages}
                      aria-label="Halaman berikutnya"
                      className="w-9 h-9 flex items-center justify-center rounded-full border border-line text-ink/70 hover:border-ink disabled:opacity-30 disabled:pointer-events-none transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {mobileFilterOpen && (
        <div className="lg:hidden fixed inset-0 z-[60]">
          <div
            className="absolute inset-0 bg-ink/50 backdrop-blur-sm"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div className="absolute left-0 right-0 bottom-0 max-h-[80vh] bg-white rounded-t-3xl shadow-2xl flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
              <span className="text-sm font-semibold">Filter</span>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-sand"
                aria-label="Tutup filter"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              <div className="text-xs uppercase tracking-widest text-ink/40 font-data mb-2 px-1">
                Divisi & Kategori
              </div>
              <KategoriTree
                activeDivisiId={activeDivisiId}
                activeKategoriId={activeKategoriId}
                expandedId={expandedId}
                onToggleGroup={toggleGroup}
                onSelectDivisi={goToDivisi}
                onSelectKategori={goToKategori}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
