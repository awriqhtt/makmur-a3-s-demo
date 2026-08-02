"use client";

import { useState, useEffect } from "react";
import { MapPin, Search, Check, X } from "lucide-react";

const COVERAGE_AREAS = [
  { name: "Jakarta", note: "Armada reguler, kirim H+1" },
  { name: "Tangerang", note: "Armada reguler, kirim H+1" },
  { name: "Bekasi", note: "Armada reguler, kirim H+1" },
  { name: "Depok", note: "Armada reguler, kirim H+1" },
  { name: "Bogor", note: "Armada reguler, kirim H+2" },
  { name: "Bandung", note: "Partner freight, kirim H+3" },
  { name: "Surabaya", note: "Partner freight, kirim H+4" },
  { name: "Semarang", note: "Partner freight, kirim H+3" },
  { name: "Yogyakarta", note: "Partner freight, kirim H+3" },
  { name: "Malang", note: "Partner freight, kirim H+4" },
  { name: "Solo", note: "Partner freight, kirim H+3" },
  { name: "Cikarang", note: "Armada reguler, kirim H+1" },
  { name: "Karawang", note: "Armada reguler, kirim H+2" },
  { name: "Serang", note: "Partner freight, kirim H+2" },
  { name: "Medan", note: "Partner freight, kirim H+5" },
  { name: "Makassar", note: "Partner freight, kirim H+6" },
];

export default function LocationAvailabilityBanner() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const filtered = COVERAGE_AREAS.filter((a) =>
    a.name.toLowerCase().includes(query.toLowerCase()),
  );

  const handleCheck = () => setOpen(true);

  return (
    <>
      <section className="relative overflow-hidden bg-red-700 text-white">
        {/* gradient base + balanced double wave */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-900 via-red-700 to-red-600" />

          <svg
            className="absolute bottom-0 left-0 w-full h-10 md:h-16"
            viewBox="0 0 1440 100"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M0 55 C 240 25, 480 25, 720 55 C 960 85, 1200 85, 1440 55 L1440 100 L0 100 Z"
              fill="rgba(255,255,255,0.06)"
            />
            <path
              d="M0 70 C 240 45, 480 45, 720 70 C 960 95, 1200 95, 1440 70 L1440 100 L0 100 Z"
              fill="rgba(0,0,0,0.12)"
            />
          </svg>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-5 md:px-8 pt-10 md:pt-12 pb-12 md:pb-14 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-white" strokeWidth={1.75} />
            </div>
            <div>
              <h3 className="font-semibold text-base md:text-lg leading-snug">
                Cek ketersediaan pengiriman
              </h3>
              <p className="text-sm text-white/70">
                Ketik nama kota, kami tunjukkan cakupan armada kami
              </p>
            </div>
          </div>

          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="w-4 h-4 text-white/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCheck()}
                placeholder="Cari kota..."
                className="w-full bg-white/10 border border-white/20 rounded-full pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/50 focus:outline-none focus:border-white/50 transition-colors"
              />
            </div>
            <button
              onClick={handleCheck}
              className="shrink-0 bg-white text-red-700 rounded-full px-5 py-2.5 text-sm font-semibold hover:bg-white/90 transition-colors"
            >
              Cek Lokasi
            </button>
          </div>
        </div>
      </section>

      {/* centered modal, blurred backdrop, close button */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-5"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-line shrink-0">
              <div>
                <h4 className="font-semibold text-ink text-sm">
                  {filtered.length > 0
                    ? `${filtered.length} lokasi tersedia`
                    : "Kota belum tersedia"}
                </h4>
                {query && (
                  <p className="text-xs text-ink/45 mt-0.5">
                    Hasil untuk &quot;{query}&quot;
                  </p>
                )}
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-ink/40 hover:text-ink transition-colors shrink-0"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <div className="overflow-y-auto p-4">
              {filtered.length > 0 ? (
                <div className="flex flex-col divide-y divide-line">
                  {filtered.map((area) => (
                    <div
                      key={area.name}
                      className="flex items-center justify-between gap-3 px-2 py-3"
                    >
                      <span className="flex items-center gap-2 text-sm font-medium text-ink">
                        <Check className="w-3.5 h-3.5 text-red-700 shrink-0" />
                        {area.name}
                      </span>
                      <span className="text-xs text-ink/45 leading-snug text-right">
                        {area.note}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-ink/50 px-1 py-4">
                  Belum ada di kota ini — chat kami dulu, kita cek opsi
                  pengirimannya.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
