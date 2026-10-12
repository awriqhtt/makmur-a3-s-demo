import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Boxes, Users, ClipboardCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/SectionHeading";
import StatsBar from "@/components/StatsBar";
import PillarShowcase from "@/components/PillarShowcase";
import FeaturedProductsCarousel from "@/components/FeaturedProductsCarousel";
import { TESTIMONIALS, STATS, getFeaturedProducts } from "@/lib/data";

const COMPARISON_CARDS = [
  {
    icon: Boxes,
    old: "Stok gak pasti",
    new: "Direstock rutin sebelum menipis",
    body: "Bukan nunggu kehabisan baru restock — kami cek dan isi ulang SKU utama secara berkala, jadi pesanan berulang gak perlu nunggu jadwal produksi baru.",
  },
  {
    icon: Users,
    old: "Kontak beda-beda tiap order",
    new: "Satu account handler tetap",
    body: "Gak perlu jelasin ulang riwayat order atau preferensi packing dari nol — satu orang yang sama yang pegang akun kamu dari awal.",
  },
  {
    icon: ClipboardCheck,
    old: "QC gak terdokumentasi",
    new: "Tercatat & bisa ditelusuri",
    body: "Setiap batch yang masuk diperiksa sesuai spesifikasi, dan dokumentasinya bisa diminta kapan aja kalau kamu butuh untuk audit internal.",
  },
];

// Pull-quote diambil dari TESTIMONIALS di lib/data.ts. `org` harus persis
// "Hotel & Resort Group" — kalau beda satu karakter, section-nya hilang.
const PULL_QUOTE = TESTIMONIALS.find((t) => t.org === "Hotel & Resort Group");

// Jumlah produk unggulan di halaman ini. Daftar & urutannya sama dengan Home
// (FEATURED_CODES di lib/data.ts), cuma diambil N pertama. Hapus .slice()
// di bawah kalau mau menampilkan semuanya.
const FEATURED_COUNT_KEUNGGULAN = 6;

export default function KeunggulanPage() {
  const featuredProducts = getFeaturedProducts().slice(
    0,
    FEATURED_COUNT_KEUNGGULAN,
  );

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-ink overflow-hidden min-h-[420px] md:min-h-[480px] flex items-end pb-24 md:pb-28">
        <Image
          src="/keunggulan/hero.jpg"
          alt="Gudang dan operasional Makmur A3'S"
          fill
          sizes="100vw"
          className="object-cover opacity-70"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
        <div className="relative z-10 w-full max-w-3xl mx-auto px-5 md:px-8 text-center flex flex-col items-center">
          <Eyebrow>
            <span className="text-white/70">Kenapa Makmur A3&apos;S</span>
          </Eyebrow>
          <h1 className="font-display text-2xl sm:text-3xl md:text-4xl leading-[1.1] text-white mt-3 mb-5 max-w-2xl">
            Supplier yang bikin tim procurement berhenti khawatir.
          </h1>
          <p className="text-white/70 leading-relaxed max-w-xl mb-7">
            Bukan sekadar jual barang — kami pegang tanggung jawab supaya dapur
            kamu gak pernah kehabisan stok, dari packaging sampai kebutuhan
            operasional harian.
          </p>
          <Link href="/kerjasama">
            <Button className="!bg-brand !text-white hover:!bg-white hover:!text-ink">
              Ajukan Kerja Sama <ArrowUpRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* StatsBar ngambang */}
      <div className="relative z-20 max-w-6xl mx-auto px-5 md:px-8 -mt-16 md:-mt-20">
        <div className="rounded-2xl overflow-hidden shadow-2xl shadow-ink/20">
          <StatsBar stats={STATS} />
        </div>
      </div>

      {/* Pilar — carousel. pb dikepras (cuma pt penuh) biar gap ke section
          Perbandingan di bawahnya gak dobel-padding. */}
      <section className="max-w-7xl mx-auto px-5 md:px-8 pt-16 md:pt-24 pb-6 md:pb-8">
        <Eyebrow>Kenapa Klien Bertahan</Eyebrow>
        <h2 className="font-display text-2xl md:text-3xl leading-snug mt-3 mb-10 max-w-xl">
          Hal-hal yang kami jaga di setiap pesanan.
        </h2>
        <PillarShowcase />
      </section>

      {/* Perbandingan — pt dikepras juga, biar gap ke Pillar di atasnya
          gak dobel. pb tetap penuh karena section di bawahnya (Pull-quote)
          punya padding sendiri yang beda konteks (dark, bukan lanjutan). */}
      <section className="bg-white pt-6 md:pt-8 pb-16 md:pb-24">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <Eyebrow>Bedanya Kalau Sama Kami</Eyebrow>
          <h2 className="font-display text-2xl md:text-3xl leading-snug mt-3 mb-10 max-w-xl">
            Bukan cuma soal harga, tapi soal gak perlu mikirin lagi.
          </h2>

          <div className="grid md:grid-cols-3 gap-6 md:gap-8">
            {COMPARISON_CARDS.map((c) => (
              <div
                key={c.old}
                className="rounded-2xl border border-line p-6 md:p-7"
              >
                <div className="w-11 h-11 rounded-full bg-sand flex items-center justify-center mb-5">
                  <c.icon className="w-5 h-5 text-ink/60" strokeWidth={1.75} />
                </div>

                <div className="text-xs text-ink/35 line-through decoration-ink/20 mb-1.5">
                  {c.old}
                </div>
                <h3 className="font-display text-base md:text-lg text-ink mb-3">
                  {c.new}
                </h3>
                <p className="text-sm text-ink/55 leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pull-quote — dark, signature glow accent.
          Quote & attribution FINAL (sumber: TESTIMONIALS di lib/data.ts):
          quote: "Satu supplier buat hampir semua kebutuhan operasional
                  kami. Sourcing yang dulu ribet, sekarang simpel."
          name:  "Procurement Manager"
          org:   "Hotel & Resort Group" */}
      {PULL_QUOTE && (
        <section className="relative bg-ink py-12 md:py-16 overflow-hidden">
          <div className="absolute -top-24 -right-16 w-72 h-72 bg-brand/[0.18] rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-16 w-64 h-64 bg-white/[0.06] rounded-full blur-3xl pointer-events-none" />
          <div className="max-w-4xl mx-auto px-5 md:px-8 text-center relative z-10">
            <p className="font-display text-xl md:text-3xl text-white leading-snug mb-5">
              &ldquo;{PULL_QUOTE.quote}&rdquo;
            </p>
            <div className="text-sm text-white/50">
              {PULL_QUOTE.name}, {PULL_QUOTE.org}
            </div>
          </div>
        </section>
      )}

      {/* Produk Unggulan — section penutup halaman. Judul disamakan dengan
          Home. Daftar produk dipilih manual lewat FEATURED_CODES di
          lib/data.ts (bukan dari data penjualan, jadi gak pakai klaim
          "paling sering dipercaya"). */}
      <section className="bg-sand py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-10">
            <div>
              <Eyebrow>Produk Unggulan</Eyebrow>
              <h2 className="font-display text-2xl md:text-3xl leading-snug mt-3 max-w-xl">
                Mulai dari produk-produk andalan kami.
              </h2>
            </div>
            {/* Desktop: link di kanan atas, sejajar judul */}
            <Link
              href="/products"
              className="group hidden md:inline-flex items-center gap-1.5 shrink-0 text-sm font-semibold text-ink hover:text-brand transition-colors"
            >
              Lihat produk selengkapnya
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>

          <div className="mt-12">
            <FeaturedProductsCarousel products={featuredProducts} />
          </div>

          {/* Mobile: tombol di bawah carousel */}
          <div className="mt-8 flex justify-center md:hidden">
            <Link
              href="/products"
              className="group inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink hover:bg-brand hover:text-white hover:border-brand transition-colors"
            >
              Lihat produk selengkapnya
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
