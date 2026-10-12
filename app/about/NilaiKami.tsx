import {
  ShieldCheck,
  Zap,
  HeartHandshake,
  BadgeCheck,
  Briefcase,
} from "lucide-react";

// Nilai perusahaan mengacu ke company profile.
const NILAI = [
  {
    icon: ShieldCheck,
    title: "Kepercayaan",
    desc: "Pengadaan yang aman dan bisa diandalkan.",
  },
  {
    icon: Zap,
    title: "Kecepatan Layanan",
    desc: "Pengiriman tepat waktu sesuai jadwal mitra.",
  },
  {
    icon: HeartHandshake,
    title: "Komitmen",
    desc: "Relasi jangka panjang yang tumbuh bersama mitra.",
  },
  {
    icon: BadgeCheck,
    title: "Kualitas",
    desc: "Bahan baku pilihan dengan standar mutu terjamin.",
  },
  {
    icon: Briefcase,
    title: "Profesionalisme",
    desc: "Layanan yang rapi dan konsisten untuk usaha HORECA.",
  },
];

/* Gaya kartu disamain dengan kartu perbandingan di halaman Keunggulan:
   border-line, ikon bulat sand, judul font-display. Kartu terakhir melebar
   di layar sm supaya grid 2 kolom gak nyisain lubang.
   Hover: kartu terangkat (hover-lift), ikon bulat jadi brand — sama
   dengan kartu kategori & "Kenapa Makmur A3'S" di homepage. */
export default function NilaiKami() {
  return (
    <ul className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-5 md:gap-6">
      {NILAI.map((n, i) => (
        <li
          key={n.title}
          className={`group flex items-center gap-4 sm:block rounded-2xl border border-line p-4 sm:p-6 hover-lift hover:border-brand/30 transition-colors ${
            i === NILAI.length - 1 ? "sm:col-span-2 lg:col-span-1" : ""
          }`}
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 shrink-0 rounded-full bg-sand flex items-center justify-center sm:mb-5 group-hover:bg-brand transition-colors duration-300">
            <n.icon
              className="w-5 h-5 text-ink/60 group-hover:text-white transition-colors duration-300"
              strokeWidth={1.75}
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-display text-base md:text-lg text-ink mb-0.5 sm:mb-2 group-hover:text-brand transition-colors">
              {n.title}
            </h3>
            <p className="text-sm text-ink/55 leading-relaxed">{n.desc}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
