"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Boxes, ShieldCheck, Users, Truck, Headset } from "lucide-react";

const PILLARS = [
  {
    title: "Ketersediaan Stok",
    body: "SKU utama kami cek dan restock rutin sebelum menipis — bukan reaktif setelah kehabisan. Jadi pesanan berulang bisa langsung dikirim tanpa nunggu jadwal produksi baru.",
    icon: Boxes,
    stat: "Restock rutin, bukan reaktif",
    image: "/keunggulan/stok.jpg",
  },
  {
    title: "Kualitas & Keamanan Pangan",
    body: "Setiap batch yang masuk diperiksa sesuai spesifikasi material dan standar food-safety sebelum sampai ke dock kamu, dengan dokumentasi yang bisa ditelusuri per pengiriman.",
    icon: ShieldCheck,
    stat: "QC per batch, terdokumentasi",
    image: "/keunggulan/kualitas.jpg",
  },
  {
    title: "Kemudahan Kerja Sama",
    body: "Satu account handler tetap yang hafal riwayat order dan preferensi packing kamu, jadi kamu gak perlu jelasin ulang dari nol tiap kali mau order.",
    icon: Users,
    stat: "1 account handler tetap",
    image: "/keunggulan/kerjasama.jpg",
  },
  {
    title: "Responsif Admin",
    body: "Mau tanya stok, ubah jadwal kirim, atau ada komplain? Admin kami sigap bales chat WhatsApp hari itu juga — gak digantung nunggu berhari-hari.",
    icon: Headset,
    stat: "Chat cepat direspons, gak digantung",
    image: "/keunggulan/admin.jpg",
  },
  {
    title: "Pengiriman Tepat Waktu",
    body: "Armada terjadwal untuk rute Jabodetabek, dikemas rapi biar barang sampai dalam kondisi utuh, dan status pengirimannya bisa dipantau — bukan tinggal nunggu tanpa kabar.",
    icon: Truck,
    stat: "Armada terjadwal, status bisa dipantau",
    image: "/keunggulan/pengiriman.jpg",
  },
];

const AUTO_ADVANCE_MS = 4500;

export default function PillarShowcase() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  // Auto-advance ke pilar berikutnya tiap AUTO_ADVANCE_MS.
  // Timer di-reset tiap kali `active` berubah (termasuk saat user klik manual),
  // jadi klik manual otomatis "menunda" giliran auto-advance berikutnya.
  // Berhenti total saat `paused` (hover/focus), biar user yang lagi baca
  // gak keputus di tengah jalan.
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % PILLARS.length);
    }, AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [active, paused]);

  return (
    <div
      className="grid md:grid-cols-2 gap-8 md:gap-12 items-center"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Kiri — daftar tab pilar. order-2 di mobile biar gambar (order-1)
          tampil duluan, baru teks — lebih menarik secara visual saat di-scroll */}
      <div className="space-y-2 order-2 md:order-1" role="tablist">
        {PILLARS.map((p, i) => {
          const Icon = p.icon;
          const isActive = i === active;
          return (
            <button
              key={p.title}
              onClick={() => setActive(i)}
              onFocus={() => setPaused(true)}
              onBlur={() => setPaused(false)}
              role="tab"
              aria-selected={isActive}
              className={`w-full text-left rounded-2xl p-5 md:p-6 border transition-colors duration-300 ${
                isActive
                  ? "bg-sand border-line"
                  : "bg-transparent border-transparent hover:bg-sand/50"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors duration-300 ${
                    isActive ? "bg-brand/10" : "bg-ink/5"
                  }`}
                >
                  <Icon
                    className={`w-4.5 h-4.5 transition-colors duration-300 ${
                      isActive ? "text-brand" : "text-ink/40"
                    }`}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className={`font-display text-base md:text-lg mb-1.5 transition-colors duration-300 ${
                      isActive ? "text-ink" : "text-ink/50"
                    }`}
                  >
                    {p.title}
                  </h3>
                  {/* Body cuma ditampilkan penuh untuk tab yang aktif,
                      biar list gak kepanjangan waktu inactive */}
                  <div
                    className={`grid transition-all duration-300 ease-out ${
                      isActive
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="text-sm text-ink/60 leading-relaxed mb-2">
                        {p.body}
                      </p>
                      <div className="text-xs font-semibold text-brand">
                        {p.stat}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar tipis — nunjukkin auto-advance timer berjalan
                  untuk tab yang lagi aktif */}
              {isActive && (
                <div className="mt-3 ml-14 h-0.5 rounded-full bg-ink/10 overflow-hidden">
                  <div
                    key={active}
                    className="h-full bg-brand rounded-full"
                    style={{
                      animation: `pillar-progress ${AUTO_ADVANCE_MS}ms linear forwards`,
                    }}
                  />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Kanan — foto besar, crossfade sesuai tab aktif. order-1 di mobile
          biar muncul duluan sebelum daftar tab (order-2) */}
      <div
        className="relative rounded-2xl overflow-hidden aspect-[4/5] md:aspect-[4/4.5] order-1 md:order-2"
        role="tabpanel"
      >
        {PILLARS.map((p, i) => (
          <Image
            key={p.image}
            src={p.image}
            alt={p.title}
            fill
            sizes="(min-width: 768px) 45vw, 100vw"
            className={`object-cover transition-opacity duration-700 ease-out ${
              i === active ? "opacity-100" : "opacity-0"
            }`}
            priority={i === 0}
          />
        ))}
      </div>

      <style jsx>{`
        @keyframes pillar-progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
