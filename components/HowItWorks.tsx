import Link from "next/link";
import { ArrowRight, ClipboardList } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";

const STEPS = [
  {
    number: "1",
    title: "Jelajahi katalog",
    body: "Lihat produk, spesifikasi, dan cek ketersediaan stok sesuai kebutuhan kamu.",
    accent: false,
  },
  {
    number: "2",
    title: "Konfirmasi via WhatsApp",
    body: "Chat tim kami buat konfirmasi harga, stok, dan detail order kamu.",
    accent: true,
  },
  {
    number: "3",
    title: "Terima quotation",
    body: "Tim kami siapkan penawaran lengkap — harga, stok, dan jadwal kirim.",
    accent: false,
  },
];

export default function HowItWorks() {
  return (
    <section className="max-w-7xl mx-auto px-5 md:px-8 py-20 md:py-28">
      <SectionHeading
        eyebrow="Cara kerja kami"
        title="Tiga langkah simpel buat mulai order"
      />

      {/* Flow 1-2-3 — angka besar sebagai elemen visual utama */}
      <div className="mt-16 grid md:grid-cols-3 gap-10 md:gap-8">
        {STEPS.map((step, i) => (
          <div key={step.number} className="relative">
            {/* divider kiri, cuma antar kolom di desktop */}
            {i > 0 && (
              <div className="hidden md:block absolute -left-4 top-1 bottom-1 w-px bg-line" />
            )}

            <span
              className={`font-display text-5xl md:text-6xl leading-none ${
                step.accent ? "text-brand" : "text-ink/15"
              }`}
            >
              {step.number}
            </span>
            <h3 className="font-semibold text-lg mt-4 mb-2">{step.title}</h3>
            <p className="text-sm text-ink/50 leading-relaxed max-w-xs">
              {step.body}
            </p>
          </div>
        ))}
      </div>

      {/* CTA — isi form pengajuan */}
      <div className="mt-14 rounded-2xl border border-brand/25 bg-gradient-to-br from-brand/[0.06] to-transparent p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
            <ClipboardList className="w-5 h-5 text-brand" strokeWidth={1.75} />
          </div>
          <div>
            <h3 className="font-semibold text-base mb-1">
              Udah tau mau order apa?
            </h3>
            <p className="text-sm text-ink/50 leading-relaxed">
              Atau langsung isi form pengajuan kerja sama, tim kami follow up
              dengan quotation lengkap.
            </p>
          </div>
        </div>
        <Link href="/kerjasama" className="shrink-0 w-full md:w-auto">
          <span className="inline-flex items-center justify-center gap-1.5 w-full md:w-auto px-6 py-3 rounded-full bg-ink text-white text-sm font-medium hover:bg-brand transition-colors">
            Isi form pengajuan <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </Link>
      </div>
    </section>
  );
}
