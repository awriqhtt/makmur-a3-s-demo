"use client";

import { useState } from "react";
import Link from "next/link";
import { Phone, Mail, MapPin, Clock, ChevronDown } from "lucide-react";
import Logomark from "./Logomark";
import { DIVISIONS } from "@/lib/data";

// Kept in sync with Header's NAV_ITEMS (components/Header.tsx) — if a link
// is added/renamed/removed in the header drawer, mirror it here too so the
// footer doesn't quietly drift into its own, slightly different menu.
// "Klien" and "Artikel" are intentionally NOT here: they were removed from
// the header nav, so the footer follows.
const COMPANY_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/products", label: "Produk" },
  { href: "/about", label: "Tentang" },
  { href: "/keunggulan", label: "Keunggulan" },
  { href: "/contact", label: "Kontak" },
  { href: "/bantuan", label: "Bantuan" },
];

// Sumber tunggal data kontak — disamakan persis dengan yang dipakai di
// app/contact/page.tsx (WA_NUMBER, email, dll). Kalau data ini berubah
// di contact page, mirror juga ke sini biar gak ada dua sumber kebenaran.
// NOTE: lokasi sengaja cuma level kota (bukan alamat lengkap) — permintaan
// klien, biar gak ada alamat spesifik yang ke-expose di publik.
const CONTACT = {
  whatsappDisplay: "0878-7831-1243",
  whatsappHref: "https://wa.me/6287878311243",
  email: "management@makmurathrees.com",
  cityArea: "Tangerang Selatan, Banten",
  operatingHours: "Senin–Sabtu, 08.00–17.00 WIB",
};

type SectionKey = "perusahaan" | "katalog" | "kontak";

// On mobile each column becomes a tap-to-expand accordion (title + chevron,
// content collapsed by default). On desktop (md+) the button/chevron is
// hidden and the content is always shown — same visual column layout as
// before, just driven by one shared component instead of three copies.
// NOTE: border between sections now lives on the parent grid (`divide-y`),
// not here — otherwise the LAST section also gets a border-b, which stacks
// with the copyright bar's border-t right below it and reads as a big empty
// gap on mobile.
function FooterSection({
  title,
  sectionKey,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  sectionKey: SectionKey;
  isOpen: boolean;
  onToggle: (key: SectionKey) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="py-4 md:py-0">
      <button
        type="button"
        onClick={() => onToggle(sectionKey)}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between md:hidden"
      >
        <span className="text-xs uppercase tracking-widest text-white/40 font-data">
          {title}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-white/40 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <div className="hidden md:block text-xs uppercase tracking-widest text-white/40 font-data mb-4">
        {title}
      </div>

      <div
        className={`${
          isOpen ? "flex" : "hidden"
        } md:flex flex-col gap-3 text-sm text-white/70 mt-3 md:mt-0`}
      >
        {children}
      </div>
    </div>
  );
}

export default function Footer() {
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>(
    {
      perusahaan: false,
      katalog: false,
      kontak: false,
    },
  );
  // Langsung buka Gmail web compose, gak perlu coba mailto: / deteksi
  // blur segala — lebih simpel dan konsisten hasilnya di semua device.
  const handleEmailClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
      CONTACT.email,
    )}`;
    window.open(gmailUrl, "_blank", "noopener,noreferrer");
  };

  const toggleSection = (key: SectionKey) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <footer className="bg-ink text-white">
      <div className="max-w-7xl mx-auto px-5 md:px-8 py-16 grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-0 md:gap-12 divide-y divide-white/10 md:divide-y-0">
        <div className="pb-6 md:pb-0">
          <Logomark dark />
          <p className="text-white/50 text-sm leading-relaxed mt-5 max-w-xs">
            Distributor kebutuhan HORECA — food packaging, plastic packaging,
            paper packaging, dan kebutuhan operasional untuk hotel, restoran,
            dan katering di Jabodetabek dan sekitarnya.
          </p>
        </div>

        <FooterSection
          title="Perusahaan"
          sectionKey="perusahaan"
          isOpen={openSections.perusahaan}
          onToggle={toggleSection}
        >
          {COMPANY_LINKS.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-white">
              {item.label}
            </Link>
          ))}
        </FooterSection>

        {/* DIVISIONS di kode = "Kategori" di tampilan (permintaan client). */}
        <FooterSection
          title="Kategori"
          sectionKey="katalog"
          isOpen={openSections.katalog}
          onToggle={toggleSection}
        >
          {DIVISIONS.map((d) => (
            <Link
              key={d.id}
              href={`/products?divisi=${d.id}`}
              className="hover:text-white"
            >
              {d.name}
            </Link>
          ))}
        </FooterSection>

        <FooterSection
          title="Kontak"
          sectionKey="kontak"
          isOpen={openSections.kontak}
          onToggle={toggleSection}
        >
          <a
            href={CONTACT.whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-white"
          >
            <Phone className="w-4 h-4 shrink-0" /> {CONTACT.whatsappDisplay}
          </a>

          <a
            href={`mailto:${CONTACT.email}`}
            onClick={handleEmailClick}
            className="flex items-center gap-2 hover:text-white"
          >
            <Mail className="w-4 h-4 shrink-0" /> {CONTACT.email}
          </a>

          <span className="flex items-center gap-2">
            <MapPin className="w-4 h-4 shrink-0" /> {CONTACT.cityArea}
          </span>

          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4 shrink-0" /> {CONTACT.operatingHours}
          </span>
        </FooterSection>
      </div>

      <div className="border-t border-white/10 py-6">
        <div className="max-w-7xl mx-auto px-5 md:px-8 flex flex-col sm:flex-row justify-between gap-3 text-xs text-white/40">
          <span>
            © {new Date().getFullYear()} Makmur A3&apos;S. Hak cipta dilindungi.
          </span>
          <span>Melayani sejak 2020</span>
        </div>
      </div>
    </footer>
  );
}
