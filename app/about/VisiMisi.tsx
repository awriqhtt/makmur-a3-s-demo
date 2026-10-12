import { Target, Compass, PackageCheck, Handshake, Layers } from "lucide-react";

// Visi dan misi mengacu ke company profile.
const VISI = {
  text: "Menjadi perusahaan penyedia kebutuhan HORECA yang terpercaya dan unggul di Indonesia.",
  sub: "Kami ingin dipercaya hotel, restoran, dan katering sebagai mitra pengadaan yang cepat, andal, dan profesional.",
};

const MISI_POINTS = [
  {
    icon: PackageCheck,
    text: "Menyediakan produk berkualitas dengan layanan distribusi terbaik",
    sub: "Bahan baku pilihan dengan standar mutu terjamin, dikirim cepat dan terjadwal sesuai kebutuhan mitra.",
  },
  {
    icon: Handshake,
    text: "Membangun kemitraan jangka panjang dengan pelaku usaha di sektor HORECA",
    sub: "Kami mengutamakan relasi yang profesional dan berkelanjutan, supaya tumbuh bersama usaha mitra.",
  },
  {
    icon: Layers,
    text: "Menjadi solusi terpadu bagi kebutuhan operasional hotel, restoran, dan katering",
    sub: "Dari kemasan dan plastik sampai perlengkapan makan dan groceries, kebutuhan operasional bisa dipenuhi lewat satu mitra.",
  },
];

/* Dua panel, padding sama, grid 1:1 + items-stretch supaya tinggi sejajar.
   Misi dibuat rapat (py-4, tanpa flex-1) supaya panelnya gak terlalu tinggi,
   dan Visi pakai teks lebih besar + glow (sama kayak pull-quote di
   Keunggulan) supaya panel gelapnya gak kelihatan kosong. */
export default function VisiMisi() {
  return (
    <div className="grid lg:grid-cols-2 gap-5 lg:gap-6 items-stretch">
      {/* Visi */}
      <div className="relative overflow-hidden rounded-2xl bg-ink p-6 md:p-8 flex flex-col justify-between gap-8">
        <div className="absolute -top-20 -right-16 w-64 h-64 bg-brand/[0.18] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-16 w-56 h-56 bg-white/[0.06] rounded-full blur-3xl pointer-events-none" />
        <span className="relative z-10 font-display text-sm text-white/60 inline-flex items-center gap-2">
          <Target className="w-4 h-4" strokeWidth={1.5} />
          Visi
        </span>
        <div className="relative z-10">
          <p className="font-display text-2xl md:text-3xl lg:text-4xl text-white leading-snug">
            {VISI.text}
          </p>
          <p className="text-sm md:text-base text-white/65 leading-relaxed mt-4 max-w-md">
            {VISI.sub}
          </p>
        </div>
      </div>

      {/* Misi */}
      <div className="rounded-2xl border border-line p-6 md:p-8 flex flex-col">
        <span className="font-display text-sm text-brand inline-flex items-center gap-2 mb-2">
          <Compass className="w-4 h-4" strokeWidth={1.5} />
          Misi
        </span>
        <ul className="divide-y divide-line">
          {MISI_POINTS.map((point) => (
            <li
              key={point.text}
              className="flex items-start gap-4 py-4 first:pt-3 last:pb-0"
            >
              <div className="w-10 h-10 rounded-full bg-sand flex items-center justify-center shrink-0">
                <point.icon className="w-5 h-5 text-brand" strokeWidth={1.5} />
              </div>
              <div>
                <p className="font-semibold text-ink text-sm md:text-base leading-snug">
                  {point.text}
                </p>
                <p className="text-sm text-ink/60 leading-relaxed mt-1">
                  {point.sub}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
