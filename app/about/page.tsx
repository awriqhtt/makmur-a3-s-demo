import SectionHeading, { Eyebrow } from "@/components/ui/SectionHeading";
import { Warehouse, ShieldCheck, Truck } from "lucide-react";

const OPS = [
  { icon: Warehouse, title: "Gudang", body: "Stok terpusat di seluruh delapan divisi, dengan replenishment berkelanjutan berdasarkan riwayat order real." },
  { icon: ShieldCheck, title: "Quality control", body: "Setiap batch yang masuk dicek sesuai spesifikasi material, food-grade, dan dimensi sebelum disimpan." },
  { icon: Truck, title: "Distribusi", body: "Rute pengiriman terjadwal untuk klien repeat order, plus freight nasional untuk klien luar kota dan industri." },
];

export default function AboutPage() {
  return (
    <div>
      <section className="max-w-7xl mx-auto px-5 md:px-8 pt-16 pb-20">
        <Eyebrow>Tentang Makmur A3&apos;S</Eyebrow>
        <h1 className="font-display text-4xl md:text-5xl leading-[1.05] max-w-3xl mb-6">
          Dibangun jadi satu-satunya supplier yang gak perlu dikhawatirkan dapur manapun.
        </h1>
        <p className="text-ink/70 text-lg leading-relaxed max-w-2xl">
          Makmur A3&apos;S tumbuh dari satu counter packaging jadi supplier B2B full-catalog — melayani
          restoran, hotel, bakery, pabrik, dan ritel modern dengan rangkaian produk packaging dan
          operasional yang konsisten dan terspesifikasi dengan baik.
        </p>
      </section>

      <section className="bg-sand py-20">
        <div className="max-w-7xl mx-auto px-5 md:px-8 grid md:grid-cols-2 gap-10">
          <div className="bg-white rounded-3xl p-9 border border-line">
            <h3 className="font-display text-2xl mb-3">Visi</h3>
            <p className="text-ink/70 leading-relaxed">
              Menjadi partner supply packaging dan operasional single-source paling andal di Indonesia
              untuk industri makanan dan hospitality.
            </p>
          </div>
          <div className="bg-white rounded-3xl p-9 border border-line">
            <h3 className="font-display text-2xl mb-3">Misi</h3>
            <p className="text-ink/70 leading-relaxed">
              Menjaga operasional setiap klien tetap tersuplai lewat katalog yang rapi, quality control
              yang disiplin, dan distribusi yang bisa diandalkan — order demi order.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-5 md:px-8 py-20">
        <SectionHeading eyebrow="Operasional" title="Gudang, quality control & distribusi" />
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          {OPS.map((b) => (
            <div key={b.title} className="border border-line rounded-2xl p-7 hover-lift">
              <b.icon className="w-6 h-6 text-brand mb-5" strokeWidth={1.5} />
              <h3 className="font-semibold mb-2">{b.title}</h3>
              <p className="text-sm text-ink/45 leading-relaxed">{b.body}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
