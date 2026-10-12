import { Mail, Clock, MapPin, ArrowUpRight, Phone } from "lucide-react";
import Button from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/SectionHeading";
import FaqPreview from "@/components/FaqPreview";

const WA_NUMBER = "6287878311243";
const EMAIL = "management@makmurathrees.com";
const CITY_AREA = "Tangerang Selatan, Banten";
const GMAIL_COMPOSE_URL = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
  EMAIL,
)}`;
function WhatsAppIcon({
  className,
}: {
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.2h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.87 9.87 0 0 0 12.04 2zm0 1.67c2.19 0 4.25.85 5.79 2.4a8.18 8.18 0 0 1 2.4 5.83c0 4.54-3.7 8.24-8.24 8.24a8.24 8.24 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.18 8.18 0 0 1-1.26-4.37c0-4.54 3.7-8.24 8.3-8.24zm-4.5 4.55c-.17 0-.44.06-.67.32-.23.25-.87.86-.87 2.08 0 1.22.9 2.4 1.02 2.57.12.17 1.75 2.79 4.31 3.8 2.13.84 2.56.68 3.03.64.46-.04 1.5-.61 1.71-1.2.2-.59.2-1.1.14-1.2-.06-.11-.23-.17-.47-.29-.25-.12-1.5-.74-1.73-.82-.23-.09-.4-.13-.57.13-.17.25-.65.82-.8.99-.15.17-.29.19-.54.06-.25-.12-1.06-.39-2.03-1.25-.75-.67-1.25-1.5-1.4-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.12-.15.16-.25.24-.42.08-.17.04-.31-.02-.44-.06-.12-.57-1.38-.79-1.89-.2-.5-.4-.43-.57-.44a10 10 0 0 0-.44-.01z" />
    </svg>
  );
}

// NOTE: hanya level kota, bukan alamat lengkap — sama seperti Footer,
// permintaan klien biar gak ada alamat spesifik yang ke-expose ke publik.
const INFO_ROWS = [
  {
    icon: Phone,
    label: "WhatsApp",
    value: "0878-7831-1243",
    href: `https://wa.me/${WA_NUMBER}`,
  },
  {
    icon: Mail,
    label: "Email",
    value: EMAIL,
    href: GMAIL_COMPOSE_URL,
  },
  {
    icon: Clock,
    label: "Jam operasional",
    value: "Sen–Sab, 08.00–17.00 WIB",
    href: null,
  },
  {
    icon: MapPin,
    label: "Lokasi",
    value: CITY_AREA,
    href: null,
  },
];

export default function ContactPage() {
  return (
    <>
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-5 md:px-8 pt-4 md:pt-6 pb-8 md:pb-10">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10 items-start">
            <div className="order-2 lg:order-1 pt-2 md:pt-4">
              <Eyebrow>Hubungi kami</Eyebrow>
              <h1 className="font-display text-3xl md:text-5xl leading-[1.08] max-w-xl mt-3">
                Ngobrol langsung sama tim kami di WhatsApp.
              </h1>
              <p className="text-ink/45 text-sm md:text-base leading-relaxed max-w-lg mt-5">
                Untuk pengajuan quotation & kerjasama produk, kunjungi halaman
                Kerjasama. Ada pertanyaan lain? Chat kami langsung, tim kami
                standby di jam kerja.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <a
                  href={`https://wa.me/${WA_NUMBER}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto"
                >
                  <Button className="!bg-[#25D366] !text-white hover:!bg-[#1fb958] justify-center gap-2.5 w-full">
                    <WhatsAppIcon className="w-4 h-4" />
                    Chat WhatsApp
                  </Button>
                </a>
                <a href="/kerjasama" className="w-full sm:w-auto">
                  <Button className="!bg-transparent !text-ink border border-ink/15 hover:!bg-ink hover:!text-white justify-center w-full">
                    Ajukan Kerjasama <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </a>
              </div>
            </div>

            <div className="order-1 lg:order-2 h-[200px] sm:h-[270px] md:h-[360px] lg:h-[420px] flex items-start justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/contacts/contact-hero.png"
                alt="Tim Makmur A3'S siap membalas chat WhatsApp"
                className="h-full w-auto max-w-full object-contain mx-auto"
              />
            </div>
          </div>
        </div>
      </section>

      {/* HP preview FAQ (kiri) + satu kartu berisi header & detail kontak
          (kanan). Sama tinggi: tinggi HP (±560px) jadi patokan, kartu kanan
          meregang (items-stretch), header di atas, baris kontak membagi
          sisa tinggi rata (flex-1). Mobile: kartu kontak dulu, HP di bawah. */}
      <section className="bg-sand py-14 md:py-16">
        <div className="max-w-7xl mx-auto px-5 md:px-8">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-stretch">
            <div className="order-2 lg:order-1">
              <FaqPreview />
            </div>

            <div className="order-1 lg:order-2 flex flex-col rounded-2xl bg-white border border-ink/10 px-6 md:px-8 pt-7 md:pt-8">
              <div className="pb-6 border-b border-ink/10 shrink-0">
                <Eyebrow>Info kontak</Eyebrow>
                <h2 className="font-display text-2xl md:text-3xl leading-[1.1] mt-3">
                  Detail kontak kami
                </h2>
              </div>

              <div className="flex-1 flex flex-col">
                {INFO_ROWS.map((row) => {
                  const content = (
                    <>
                      <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                        <row.icon
                          className="w-[18px] h-[18px] text-brand"
                          strokeWidth={1.75}
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-data uppercase tracking-widest text-ink/40 mb-1.5">
                          {row.label}
                        </div>
                        <div className="font-medium text-ink leading-snug break-words">
                          {row.value}
                        </div>
                      </div>
                    </>
                  );
                  const rowClass =
                    "flex-1 flex items-center gap-4 py-5 border-b border-ink/10 last:border-b-0";
                  return row.href ? (
                    <a
                      key={row.label}
                      href={row.href}
                      target={
                        row.href.startsWith("http") ? "_blank" : undefined
                      }
                      rel={
                        row.href.startsWith("http")
                          ? "noopener noreferrer"
                          : undefined
                      }
                      className={`group ${rowClass} hover:pl-1 transition-[padding] duration-200`}
                    >
                      {content}
                      <ArrowUpRight className="w-4 h-4 text-ink/25 shrink-0 ml-auto group-hover:text-brand group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                    </a>
                  ) : (
                    <div key={row.label} className={rowClass}>
                      {content}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
