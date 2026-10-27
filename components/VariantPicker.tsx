"use client";

// components/VariantPicker.tsx  (REVISI: peringatan "Pilih ukuran/warna" di halaman detail)
// `unchosen` = true saat pengunjung datang dari kartu tanpa memilih (belum ada chip aktif).
// Halaman detail memegang state-nya: set false begitu onSelect dipanggil.
import { AlertCircle } from "lucide-react";
import type { GroupDef } from "@/lib/variants";
import { pickVariant } from "@/lib/variants";

// Lebih dari ini -> pakai dropdown, bukan chip (mis. Plastik Vacuum 43 ukuran).
const MAX_CHIPS = 12;

export default function VariantPicker({
  group,
  selectedCode,
  onSelect,
  unchosen = false,
}: {
  group: GroupDef;
  selectedCode: string;
  onSelect: (code: string) => void;
  unchosen?: boolean;
}) {
  const current =
    group.variants.find((v) => v.code === selectedCode)?.values ?? {};

  return (
    <div className="flex flex-col gap-4 mb-6">
      {group.options.map((o) => {
        const values = Array.from(
          new Set(group.variants.map((v) => v.values[o.key]).filter(Boolean)),
        );
        // Opsi dengan 1 nilai saja tidak perlu dipilih.
        const needsPick = unchosen && values.length > 1;
        const useDropdown = values.length > MAX_CHIPS;

        const choose = (val: string) => {
          const next = pickVariant(group, current, o.key, val);
          if (next) onSelect(next.code);
        };

        return (
          <div key={o.key}>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-[10px] uppercase tracking-widest text-ink/45 font-data">
                {o.label}
              </span>
              {needsPick ? (
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700">
                  <AlertCircle className="w-3.5 h-3.5 self-center" />
                  Pilih {o.label.toLowerCase()}
                </span>
              ) : (
                !useDropdown && (
                  <span className="text-sm font-medium">{current[o.key]}</span>
                )
              )}
            </div>

            {useDropdown ? (
              <select
                value={needsPick ? "" : (current[o.key] ?? "")}
                onChange={(e) => choose(e.target.value)}
                aria-label={o.label}
                className={`w-full sm:w-72 border rounded-full px-4 py-2.5 text-sm font-medium bg-white outline-none transition-colors ${
                  needsPick
                    ? "border-amber-400 ring-2 ring-amber-100"
                    : "border-line focus:border-ink"
                }`}
              >
                {needsPick && (
                  <option value="" disabled>
                    Pilih {o.label.toLowerCase()}
                  </option>
                )}
                {values.map((val) => (
                  <option key={val} value={val}>
                    {val}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex flex-wrap gap-2">
                {values.map((val) => {
                  const active = !needsPick && current[o.key] === val;
                  // Ada varian dengan kombinasi persis (opsi lain tetap)?
                  const exact =
                    needsPick ||
                    group.variants.some(
                      (v) =>
                        v.values[o.key] === val &&
                        group.options.every(
                          (x) =>
                            x.key === o.key ||
                            v.values[x.key] === current[x.key],
                        ),
                    );
                  const swatch = o.swatches?.[val];
                  return (
                    <button
                      key={val}
                      type="button"
                      aria-pressed={active}
                      onClick={() => choose(val)}
                      className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full border text-sm font-medium transition-colors ${
                        active
                          ? "bg-ink text-white border-ink"
                          : `${needsPick ? "border-amber-300" : "border-line"} text-ink/70 hover:border-ink ${
                              exact ? "" : "opacity-50"
                            }`
                      }`}
                    >
                      {swatch && (
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-ink/25 shrink-0"
                          style={{ backgroundColor: swatch }}
                        />
                      )}
                      {val}
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
