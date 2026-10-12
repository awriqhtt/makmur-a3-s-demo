"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Plus,
  Trash2,
  Download,
  Printer,
  Share2,
  Upload,
  RotateCcw,
  PanelLeftClose,
  PanelLeftOpen,
  Eye,
  Pencil,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileText,
  Truck,
  ClipboardList,
  User,
  Package,
  SlidersHorizontal,
  Landmark,
  PenTool,
  X,
  Mail,
  LogOut,
} from "lucide-react";
import { ALL_PRODUCTS } from "@/lib/data";
import Logomark from "@/components/Logomark";

const COMPANY_DEFAULT = {
  address:
    "Jl. Jalak I No. 41, Pondok Ranji, Bintaro, Tangerang Selatan, Banten",
  phone: "0878-7831-1243",
  email: "management@makmurathrees.com",
};

const DEFAULT_BANK = {
  bankName: "Bank BCA",
  accountNumber: "1234567890",
  accountHolder: "PT Makmur A3'S",
};

const TOP_OPTIONS = [
  { label: "Cash / COD", days: 0 },
  { label: "7 Hari", days: 7 },
  { label: "14 Hari", days: 14 },
  { label: "30 Hari", days: 30 },
  { label: "60 Hari", days: 60 },
  { label: "90 Hari", days: 90 },
  { label: "Custom", days: null },
] as const;

const UNIT_SUGGESTIONS = [
  "pcs",
  "pack",
  "roll",
  "kg",
  "g",
  "box",
  "lusin",
  "rim",
  "sak",
  "unit",
  "carton",
];

// Prefix badan usaha yang harus di-skip biar gak ikut kehitung sebagai
// inisial — "PT. Emados Kebab Indonesia" harus jadi "EKI", bukan "PEK".
const LEGAL_ENTITY_PREFIXES = [
  "PT",
  "CV",
  "UD",
  "PD",
  "PO",
  "FA",
  "TBK",
  "PERSERO",
];

type LineItem = {
  id: string;
  name: string;
  unit: string;
  qty: number;
  price: number;
};

// Satu Surat Jalan = satu "batch kirim". Satu invoice bisa punya banyak
// Shipment (SJ-XXX-1, SJ-XXX-2, dst). `itemsById` nyimpen qty yang dikirim
// di batch ini per item invoice. `manuallyEdited` nge-flag baris ini biar
// berhenti ke-auto-isi ulang begitu user ubah manual qty-nya.
type ShipmentItemEntry = {
  qty: number;
  included: boolean;
  manuallyEdited: boolean;
};

type Shipment = {
  id: string;
  seq: number;
  date: string;
  itemsById: Record<string, ShipmentItemEntry>;
};

type DocType = "invoice" | "suratJalan";

function currency(n: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(isNaN(n) ? 0 : n);
}

function formatNumber(n: number) {
  return new Intl.NumberFormat("id-ID").format(isNaN(n) ? 0 : n);
}

// Input harga dengan separator ribuan ("15.000"): input-nya text biasa,
// lalu apa yang diketik dibersihin ke angka murni di sini.
function parseNumberInput(v: string) {
  return Number(v.replace(/\D/g, "")) || 0;
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function customerInitials(name: string) {
  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.replace(/[.,]/g, ""));
  const filtered = words.filter(
    (w) => !LEGAL_ENTITY_PREFIXES.includes(w.toUpperCase()),
  );
  const source = filtered.length > 0 ? filtered : words;
  const clean = source
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return clean.slice(0, 3) || "CUST";
}

function autoInvoiceNumber(customerName: string) {
  const d = new Date();
  const ymd = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
  const rand = String(Math.floor(Math.random() * 90) + 10);
  return `INV-${customerInitials(customerName)}-${ymd}-${rand}`;
}

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

// Ubah nomor HP lokal ("0878-7831-1243") jadi format wa.me ("62878...").
// Kalau kosong, hasilnya string kosong (wa.me tanpa nomor = pilih kontak manual).
function toWaNumber(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (!d) return "";
  if (d.startsWith("62")) return d;
  if (d.startsWith("0")) return "62" + d.slice(1);
  return d;
}

// Salam otomatis sesuai jam perangkat (dipanggil pas pesan dibuat).
function greeting() {
  const h = new Date().getHours();
  if (h >= 4 && h < 11) return "Selamat pagi";
  if (h >= 11 && h < 15) return "Selamat siang";
  if (h >= 15 && h < 18) return "Selamat sore";
  return "Selamat malam";
}

// Render nomor referensi panjang dengan titik wrap yang rapi — <wbr/>
// disisipin PERSIS setelah tiap tanda "-".
function RefNumber({ value }: { value: string }) {
  const parts = value.split("-");
  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && "-"}
          {part}
          {i < parts.length - 1 && <wbr />}
        </span>
      ))}
    </>
  );
}

// Berapa qty item yang udah "kepakai" di shipment dengan seq lebih kecil
// dari `beforeSeq` (alokasi FIFO).
function computeAvailableBefore(
  shipments: Shipment[],
  itemId: string,
  beforeSeq: number,
) {
  const consumed = shipments.reduce((sum, s) => {
    if (s.seq >= beforeSeq) return sum;
    const entry = s.itemsById[itemId];
    if (!entry || !entry.included) return sum;
    return sum + entry.qty;
  }, 0);
  return consumed;
}

// Hitung ulang alokasi qty semua shipment berdasarkan urutan seq (FIFO).
// Entry yang `manuallyEdited` dipertahankan (di-clamp ke sisa tersedia),
// sisanya (auto-filled) dihitung ulang dari sisa qty.
function recalcShipments(
  shipmentsList: Shipment[],
  itemsList: LineItem[],
): Shipment[] {
  const sorted = [...shipmentsList].sort((a, b) => a.seq - b.seq);
  const consumed: Record<string, number> = {};
  const recalced = new Map<string, Shipment>();

  sorted.forEach((s) => {
    const itemsById: Record<string, ShipmentItemEntry> = {};
    itemsList.forEach((it) => {
      const already = consumed[it.id] ?? 0;
      const available = Math.max(it.qty - already, 0);
      const existing = s.itemsById[it.id];

      let qty: number;
      let included: boolean;
      let manuallyEdited: boolean;

      if (existing?.manuallyEdited) {
        qty = Math.min(Math.max(existing.qty, 0), available);
        included = existing.included;
        manuallyEdited = true;
      } else {
        qty = available;
        included = available > 0;
        manuallyEdited = false;
      }

      itemsById[it.id] = { qty, included, manuallyEdited };
      consumed[it.id] = already + (included ? qty : 0);
    });
    recalced.set(s.id, { ...s, itemsById });
  });

  // Balikin ke urutan array semula biar urutan tab SJ gak berubah sendiri.
  return shipmentsList.map((s) => recalced.get(s.id)!);
}

// Nunggu semua <img> selesai load (atau error) sebelum html2canvas jalan.
async function waitForImages(container: HTMLElement) {
  const imgs = Array.from(container.querySelectorAll("img"));
  await Promise.all(
    imgs.map((img) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener("load", () => resolve(), { once: true });
            img.addEventListener("error", () => resolve(), { once: true });
          }),
    ),
  );
}

function WhatsAppIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.148-.67.15-.198.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.297-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.876 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.001 2C6.478 2 2 6.477 2 12c0 1.986.577 3.836 1.573 5.393L2 22l4.735-1.548A9.953 9.953 0 0 0 12.001 22C17.523 22 22 17.523 22 12S17.523 2 12.001 2zm0 18.19a8.17 8.17 0 0 1-4.166-1.14l-.299-.177-3.108 1.016 1.033-3.03-.194-.31A8.19 8.19 0 1 1 20.19 12a8.199 8.199 0 0 1-8.189 8.19z" />
    </svg>
  );
}

// Cap perusahaan. Teks atas dibaca kiri-ke-kanan lewat atas, teks bawah
// kiri-ke-kanan lewat bawah (tegak, gak kebalik). ID path dibuat unik per
// instance (useId) karena komponen ini dirender 3x (canvas, preview,
// export) dan ID kembar bisa bikin teks melengkung hilang.
function InvoiceStamp() {
  const sid = useId().replace(/:/g, "");
  const top = `stampTop-${sid}`;
  const bottom = `stampBottom-${sid}`;
  return (
    <svg
      viewBox="0 0 160 160"
      className="w-20 h-20 opacity-80"
      style={{ transform: "rotate(-8deg)" }}
    >
      <circle
        cx="80"
        cy="80"
        r="74"
        fill="none"
        stroke="#B81812"
        strokeWidth="3"
      />
      <circle
        cx="80"
        cy="80"
        r="64"
        fill="none"
        stroke="#B81812"
        strokeWidth="1.5"
      />
      <path id={top} d="M 26 80 A 54 54 0 0 1 134 80" fill="none" />
      <path id={bottom} d="M 20 80 A 60 60 0 0 0 140 80" fill="none" />
      <text fill="#B81812" fontSize="11" fontWeight="700" letterSpacing="2">
        <textPath href={`#${top}`} startOffset="50%" textAnchor="middle">
          MAKMUR A3&apos;S
        </textPath>
      </text>
      <text fill="#B81812" fontSize="9" fontWeight="600" letterSpacing="3">
        <textPath href={`#${bottom}`} startOffset="50%" textAnchor="middle">
          PACKAGING &amp; SUPPLY
        </textPath>
      </text>
    </svg>
  );
}

function Watermark() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
      <span
        className="text-[6rem] font-black text-ink whitespace-nowrap"
        style={{ opacity: 0.035, transform: "rotate(-18deg)" }}
      >
        MAKMUR A3&apos;S
      </span>
    </div>
  );
}

// Header konsisten di paling atas tiap tab sidebar.
function SidebarSectionHeader({
  icon: Icon,
  label,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 pb-3 mb-1 border-b border-line">
      <span className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-sand text-ink/60">
        <Icon className="w-4 h-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink leading-tight">{label}</p>
        {hint && (
          <p className="text-[11px] text-ink/40 leading-tight mt-0.5">{hint}</p>
        )}
      </div>
    </div>
  );
}

function SidebarSubLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[11px] font-semibold uppercase tracking-wide text-ink/40">
      {children}
    </span>
  );
}

// Field serba-bisa: editable=true -> input/textarea beneran; editable=false
// -> teks polos (aman buat html2canvas). Kalau non-editable dan kosong,
// gak render apa-apa.
function Field({
  editable,
  value,
  onChange,
  placeholder,
  className = "",
  widthClass = "w-full",
  multiline = false,
  type = "text",
}: {
  editable: boolean;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  className?: string;
  widthClass?: string;
  multiline?: boolean;
  type?: string;
}) {
  if (!editable) {
    if (!value) return null;
    return (
      <span
        className={`${widthClass} ${className} whitespace-pre-line inline-block`}
      >
        {value}
      </span>
    );
  }
  if (multiline) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className={`${widthClass} bg-transparent border border-transparent hover:border-ink/20 focus:border-ink outline-none transition-colors resize-none rounded ${className}`}
      />
    );
  }
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className={`${widthClass} bg-transparent border-b border-transparent hover:border-ink/20 focus:border-ink outline-none transition-colors ${className}`}
    />
  );
}

// Field nama produk dengan dropdown custom (portal ke document.body).
function ItemNameField({
  editable,
  value,
  onChange,
}: {
  editable: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 220 });
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = value.trim().toLowerCase();
    const source = q
      ? ALL_PRODUCTS.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.code.toLowerCase().includes(q),
        )
      : ALL_PRODUCTS;
    return source.slice(0, 8);
  }, [value]);

  const updatePosition = () => {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 220) });
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  if (!editable) {
    if (!value) return null;
    return <span className="whitespace-pre-line inline-block">{value}</span>;
  }

  return (
    <>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Nama produk"
        className="w-full bg-transparent border-b border-transparent hover:border-ink/20 focus:border-ink outline-none transition-colors"
      />
      {open &&
        results.length > 0 &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            className="no-print fixed z-[999] bg-white border border-line rounded-lg shadow-lg max-h-64 overflow-y-auto"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            {results.map((p) => (
              <button
                key={p.code}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(p.name);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-sand"
              >
                <span className="font-medium">{p.name}</span>{" "}
                <span className="text-ink/40 font-data text-xs">{p.code}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

// Field satuan — arsitektur sama dengan ItemNameField.
function UnitField({
  editable,
  value,
  onChange,
}: {
  editable: boolean;
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 140 });
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const results = useMemo(() => {
    const q = value.trim().toLowerCase();
    return q
      ? UNIT_SUGGESTIONS.filter((u) => u.toLowerCase().includes(q))
      : UNIT_SUGGESTIONS;
  }, [value]);

  const updatePosition = () => {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({ top: r.bottom + 4, left: r.left, width: Math.max(r.width, 120) });
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onScrollOrResize = () => updatePosition();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  if (!editable) {
    if (!value) return null;
    return <span className="whitespace-pre-line inline-block">{value}</span>;
  }

  return (
    <>
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          if (!open) setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder="Satuan"
        className="w-20 bg-transparent border-b border-transparent hover:border-ink/20 focus:border-ink outline-none transition-colors text-right"
      />
      {open &&
        results.length > 0 &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            className="no-print fixed z-[999] bg-white border border-line rounded-lg shadow-lg max-h-56 overflow-y-auto"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
          >
            {results.map((u) => (
              <button
                key={u}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onChange(u);
                  setOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm hover:bg-sand"
              >
                {u}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </>
  );
}

// ── Dokumen bersama — dipakai DUA KALI: sekali editable (canvas layar),
// sekali non-editable (versi export tersembunyi buat PDF/print). ─────────
function InvoiceDocument({
  editable,
  docType,
  company,
  setCompany,
  customerName,
  onCustomerNameChange,
  customer,
  setCustomer,
  invoiceNumber,
  onInvoiceNumberChange,
  suratJalanNumber,
  documentDate,
  dueDate,
  topLabel,
  items,
  updateItem,
  removeItem,
  addItem,
  subtotal,
  discountAmount,
  shippingCost,
  grandTotal,
  bank,
  signatureUrl,
  signerName,
  signerTitle,
  showStamp,
  taxRate,
  taxAmount,
  shippingAddress,
  setShippingAddress,
  sjRows,
  updateSjItem,
}: any) {
  const isSJ = docType === "suratJalan";
  const hasCompanyContact = Boolean(company.phone || company.email);

  return (
    <div className="relative bg-white p-6 md:p-10 overflow-hidden w-[780px] export-page">
      <Watermark />

      <div className="relative z-10 flex items-start justify-between gap-4 mb-8">
        <div className="flex items-start gap-3">
          <Logomark unoptimized />
          <div>
            <Field
              editable={editable}
              value={company.address}
              onChange={(v: string) =>
                setCompany((c: any) => ({ ...c, address: v }))
              }
              multiline
              widthClass="w-48"
              className="text-xs text-ink/50"
            />
            {editable ? (
              <div className="text-xs text-ink/50 mt-1">
                {company.phone} · {company.email}
              </div>
            ) : (
              hasCompanyContact && (
                <div className="text-xs text-ink/50 mt-1">
                  {[company.phone, company.email].filter(Boolean).join(" · ")}
                </div>
              )
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <h2 className="font-display text-xl text-brand whitespace-nowrap">
            {isSJ ? "SURAT JALAN" : "INVOICE"}
          </h2>
          {isSJ ? (
            <p className="text-sm font-data mt-1 whitespace-nowrap">
              {suratJalanNumber}
            </p>
          ) : (
            <Field
              editable={editable}
              value={invoiceNumber}
              onChange={onInvoiceNumberChange}
              className="text-sm font-data mt-1 text-right"
            />
          )}
          <p className="text-xs text-ink/50 mt-1 whitespace-nowrap">
            Tanggal: {documentDate}
          </p>
          {!isSJ && (
            <>
              <p className="text-xs text-ink/50 whitespace-nowrap">
                Termin: {topLabel}
              </p>
              <p className="text-xs text-ink/50 whitespace-nowrap">
                Jatuh tempo: {dueDate}
              </p>
            </>
          )}
          {isSJ && (
            <div className="text-xs text-ink/50 mt-2 leading-relaxed">
              <span className="block">Referensi Invoice</span>
              <span className="block font-data text-ink/70 whitespace-nowrap">
                {invoiceNumber}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Billing address (invoice) vs shipping address (surat jalan) */}
      <div className="relative z-10 mb-8">
        <p className="text-xs uppercase tracking-widest text-ink/40 mb-1">
          {isSJ ? "Kirim ke" : "Ditagihkan kepada"}
        </p>
        {isSJ && shippingAddress.sameAsCustomer ? (
          <>
            <Field
              editable={false}
              value={customerName}
              placeholder="Nama customer"
              className="text-sm font-semibold"
            />
            <Field
              editable={false}
              value={customer.address}
              placeholder="Alamat"
              className="text-xs text-ink/60 mt-1"
            />
            {customer.phone && (
              <p className="text-xs text-ink/60 mt-1">{customer.phone}</p>
            )}
          </>
        ) : isSJ ? (
          <>
            <Field
              editable={editable}
              value={shippingAddress.name}
              onChange={(v: string) =>
                setShippingAddress((s: any) => ({ ...s, name: v }))
              }
              placeholder="Nama penerima / gudang / outlet"
              className="text-sm font-semibold"
            />
            <Field
              editable={editable}
              value={shippingAddress.address}
              onChange={(v: string) =>
                setShippingAddress((s: any) => ({ ...s, address: v }))
              }
              placeholder="Alamat pengiriman"
              multiline
              className="text-xs text-ink/60 mt-1"
            />
            <Field
              editable={editable}
              value={shippingAddress.phone}
              onChange={(v: string) =>
                setShippingAddress((s: any) => ({ ...s, phone: v }))
              }
              placeholder="No. HP penerima"
              widthClass="w-40"
              className="text-xs text-ink/60 mt-1"
            />
          </>
        ) : (
          <>
            <Field
              editable={editable}
              value={customerName}
              onChange={onCustomerNameChange}
              placeholder="Nama customer"
              className="text-sm font-semibold"
            />
            <Field
              editable={editable}
              value={customer.address}
              onChange={(v: string) =>
                setCustomer((c: any) => ({ ...c, address: v }))
              }
              placeholder="Alamat"
              multiline
              className="text-xs text-ink/60 mt-1"
            />
            {(editable || customer.phone || customer.email) && (
              <div className="flex gap-3 mt-1">
                <Field
                  editable={editable}
                  value={customer.phone}
                  onChange={(v: string) =>
                    setCustomer((c: any) => ({ ...c, phone: v }))
                  }
                  placeholder="No. HP"
                  widthClass="w-32"
                  className="text-xs text-ink/60"
                />
                <Field
                  editable={editable}
                  value={customer.email}
                  onChange={(v: string) =>
                    setCustomer((c: any) => ({ ...c, email: v }))
                  }
                  placeholder="Email"
                  widthClass="w-44"
                  className="text-xs text-ink/60"
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className="relative z-10 overflow-x-auto mb-6">
        <table className="w-full text-sm min-w-[480px]">
          <thead>
            <tr className="border-b border-ink/20 text-left text-xs uppercase tracking-wide text-ink/40">
              <th className="py-2">Produk</th>
              <th className="py-2 text-right">
                {isSJ ? "Qty Dikirim" : "Qty"}
              </th>
              <th className="py-2 text-right">Satuan</th>
              {!isSJ && <th className="py-2 text-right">Harga</th>}
              {!isSJ && <th className="py-2 text-right">Subtotal</th>}
              {editable && !isSJ && <th className="py-2 no-print" />}
              {editable && isSJ && (
                <th className="py-2 text-right no-print">Kirim?</th>
              )}
            </tr>
          </thead>
          <tbody>
            {isSJ
              ? sjRows.map((it: any) => (
                  <tr
                    key={it.id}
                    className={`border-b border-line ${!it.included ? "opacity-40" : ""}`}
                  >
                    <td className="py-2 pr-2">{it.name}</td>
                    <td className="py-2 text-right">
                      {editable ? (
                        <input
                          type="number"
                          min={0}
                          max={it.maxAllowed}
                          value={it.shippedQty}
                          onChange={(e) =>
                            updateSjItem(it.id, {
                              qty: Number(e.target.value),
                            })
                          }
                          className="w-16 bg-transparent border-b border-transparent hover:border-ink/20 focus:border-ink outline-none text-right"
                        />
                      ) : (
                        <span>{it.shippedQty}</span>
                      )}
                      {it.shippedQty < it.qty && (
                        <span className="block text-[10px] text-brand">
                          dari {it.qty} {it.unit} (parsial)
                        </span>
                      )}
                      {it.remainingAfterThis > 0 && (
                        <span className="block text-[10px] text-ink/40">
                          sisa {it.remainingAfterThis} {it.unit} belum dikirim
                        </span>
                      )}
                    </td>
                    <td className="py-2 text-right">{it.unit}</td>
                    {editable && (
                      <td className="py-2 pl-1 no-print text-right">
                        <label className="inline-flex items-center gap-1 text-[10px] text-ink/50">
                          <input
                            type="checkbox"
                            checked={it.included}
                            onChange={(e) =>
                              updateSjItem(it.id, {
                                included: e.target.checked,
                              })
                            }
                          />
                          Kirim
                        </label>
                      </td>
                    )}
                  </tr>
                ))
              : items.map((it: LineItem) => (
                  <tr key={it.id} className="border-b border-line">
                    <td className="py-2 pr-2">
                      <ItemNameField
                        editable={editable}
                        value={it.name}
                        onChange={(v: string) => updateItem(it.id, { name: v })}
                      />
                    </td>
                    <td className="py-2 text-right">
                      <Field
                        editable={editable}
                        type="number"
                        value={String(it.qty)}
                        onChange={(v: string) =>
                          updateItem(it.id, { qty: Number(v) })
                        }
                        widthClass="w-14"
                        className="text-right"
                      />
                    </td>
                    <td className="py-2 text-right">
                      <UnitField
                        editable={editable}
                        value={it.unit}
                        onChange={(v: string) => updateItem(it.id, { unit: v })}
                      />
                    </td>
                    <td className="py-2 text-right">
                      {editable ? (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-ink/40 text-xs">Rp</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            value={it.price ? formatNumber(it.price) : ""}
                            onChange={(e) =>
                              updateItem(it.id, {
                                price: parseNumberInput(e.target.value),
                              })
                            }
                            placeholder="0"
                            className="w-24 bg-transparent border-b border-transparent hover:border-ink/20 focus:border-ink outline-none transition-colors text-right"
                          />
                        </div>
                      ) : (
                        <span>Rp {formatNumber(it.price)}</span>
                      )}
                    </td>
                    <td className="py-2 text-right">
                      {currency(it.qty * it.price)}
                    </td>
                    {editable && (
                      <td className="py-2 pl-1 no-print">
                        <button
                          onClick={() => removeItem(it.id)}
                          aria-label="Hapus baris"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-ink/30 hover:text-brand" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
          </tbody>
        </table>
        {editable && !isSJ && (
          <button
            onClick={addItem}
            className="no-print mt-2 flex items-center gap-1.5 text-xs text-ink/50 hover:text-ink"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah baris
          </button>
        )}
      </div>

      {!isSJ && (
        <div className="relative z-10 flex justify-end mb-10">
          <div className="w-64 flex flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-ink/60">Subtotal</span>
              <span>{currency(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-brand">
                <span>Diskon</span>
                <span>-{currency(discountAmount)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-ink/60">PPN {taxRate}%</span>
                <span>{currency(taxAmount)}</span>
              </div>
            )}
            {shippingCost > 0 && (
              <div className="flex justify-between">
                <span className="text-ink/60">Ongkir</span>
                <span>{currency(shippingCost)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-base pt-1.5 border-t border-ink/20">
              <span>Total</span>
              <span>{currency(grandTotal)}</span>
            </div>
          </div>
        </div>
      )}

      {isSJ ? (
        <div className="relative z-10 flex items-end justify-between gap-8 mt-10">
          <div className="flex flex-col items-center gap-1 w-32">
            <div className="h-16" />
            <div className="w-full border-t border-ink/30 pt-1 text-xs text-ink/50 text-center">
              Pengirim
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 w-32">
            <div className="h-16" />
            <div className="w-full border-t border-ink/30 pt-1 text-xs text-ink/50 text-center">
              Penerima
            </div>
          </div>
        </div>
      ) : (
        <div className="relative z-10 flex items-end justify-between gap-8">
          <div className="text-xs text-ink/60 max-w-[260px]">
            <p className="font-semibold text-ink mb-1">Pembayaran ke:</p>
            <p>{bank.bankName}</p>
            <p>{bank.accountNumber}</p>
            <p>a.n. {bank.accountHolder}</p>
          </div>

          {/* Blok tanda tangan: tanda tangan di lapisan bawah, cap di lapisan
              atas dan menimpa tanda tangan. Cap bisa dimatikan lewat toggle
              di tab TTD. Nama dan jabatan opsional. */}
          <div className="flex flex-col items-center gap-1">
            <p className="text-xs text-ink/60">Hormat kami,</p>
            <div className="relative w-40 h-20">
              {signatureUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={signatureUrl}
                  alt="Tanda tangan"
                  className="absolute right-2 bottom-1 z-0 h-16 max-w-[110px] object-contain"
                />
              )}
              {showStamp && (
                <div className="absolute left-8 bottom-0 z-10">
                  <InvoiceStamp />
                </div>
              )}
            </div>
            <div className="w-40 border-t border-ink/30 pt-1 text-center">
              <p className="text-xs font-semibold text-ink/70">
                {signerName || "Makmur A3'S"}
              </p>
              {signerTitle && (
                <p className="text-[11px] text-ink/50">{signerTitle}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Ukuran layout asli sebuah elemen. transform: scale() gak ngubah ukuran layout,
// jadi dokumen 780px yang di-scale kecil tetep bikin area scroll selebar 780px
// dan sisi kirinya kepotong di layar sempit. Ukuran ini dipakai buat bikin
// pembungkus yang ukurannya ikut skala.
function useElementSize(
  ref: React.RefObject<HTMLElement | null>,
  active = true,
) {
  const [size, setSize] = useState({ w: 780, h: 1100 });
  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    const update = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, active]);
  return size;
}

export default function InvoiceGenerator() {
  const router = useRouter();
  const canvasWrapRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const previewWrapRef = useRef<HTMLDivElement>(null);
  const previewPageRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"pdf" | "share" | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  const [mobileView, setMobileView] = useState<"edit" | "preview">("edit");
  const [panelCollapsed, setPanelCollapsed] = useState(false);
  const [docType, setDocType] = useState<DocType>("invoice");

  const [activeSidebarTab, setActiveSidebarTab] = useState<string>("customer");

  const sidebarTabs = useMemo(() => {
    const base = [
      {
        id: "customer",
        label: docType === "invoice" ? "Customer" : "Kirim Ke",
        icon: docType === "invoice" ? User : Truck,
      },
      {
        id: "info",
        label: docType === "invoice" ? "Invoice" : "Surat Jalan",
        icon: ClipboardList,
      },
    ];
    if (docType === "invoice") {
      base.push(
        { id: "item", label: "Item", icon: Package },
        { id: "diskon", label: "Tambahan", icon: SlidersHorizontal },
        { id: "rekening", label: "Rekening", icon: Landmark },
        { id: "ttd", label: "TTD", icon: PenTool },
      );
    }
    return base;
  }, [docType]);

  useEffect(() => {
    if (!sidebarTabs.some((t) => t.id === activeSidebarTab)) {
      setActiveSidebarTab("customer");
    }
  }, [sidebarTabs, activeSidebarTab]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    setIsMobile(/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));
  }, []);

  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const shareBtnRef = useRef<HTMLDivElement>(null);

  const [shareNotice, setShareNotice] = useState<{
    channel: "wa" | "email";
  } | null>(null);

  useEffect(() => {
    if (!shareMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (
        shareBtnRef.current &&
        !shareBtnRef.current.contains(e.target as Node)
      ) {
        setShareMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [shareMenuOpen]);

  const [zoom, setZoom] = useState(1);
  const [autoFit, setAutoFit] = useState(true);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [previewAutoFit, setPreviewAutoFit] = useState(true);
  const [showFullPreview, setShowFullPreview] = useState(false);
  const canvasSize = useElementSize(pageRef);
  const previewSize = useElementSize(previewPageRef, showFullPreview);

  const [company, setCompany] = useState(COMPANY_DEFAULT);
  const [customerName, setCustomerName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(autoInvoiceNumber(""));
  const [invoiceNumberTouched, setInvoiceNumberTouched] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(todayISO());
  const [topDays, setTopDays] = useState<number | null>(7);
  const [customTopDays, setCustomTopDays] = useState<number | "">("");
  const [dueDate, setDueDate] = useState(addDaysISO(todayISO(), 7));
  const [customer, setCustomer] = useState({
    address: "",
    phone: "",
    email: "",
  });
  const [items, setItems] = useState<LineItem[]>([
    { id: uid(), name: "", unit: "pcs", qty: 1, price: 0 },
  ]);
  const [discountType, setDiscountType] = useState<"percent" | "fixed">(
    "percent",
  );
  const [discountValue, setDiscountValue] = useState(0);
  const [shippingCost, setShippingCost] = useState(0);
  // PPN opsional — default mati, tarifnya bisa diubah.
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState(11);
  const [bank, setBank] = useState(DEFAULT_BANK);
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  // Nama & jabatan penandatangan — opsional. Kalau nama kosong, di
  // dokumen tampil "Makmur A3'S" sebagai default.
  const [signerName, setSignerName] = useState("");
  const [signerTitle, setSignerTitle] = useState("");
  // Cap perusahaan bisa dimatikan (misal kalau pakai cap basah).
  const [showStamp, setShowStamp] = useState(true);

  const [shippingAddress, setShippingAddress] = useState({
    sameAsCustomer: true,
    name: "",
    address: "",
    phone: "",
  });

  const initialShipmentId = useRef(uid()).current;
  const [shipments, setShipments] = useState<Shipment[]>(() =>
    recalcShipments(
      [{ id: initialShipmentId, seq: 1, date: todayISO(), itemsById: {} }],
      items,
    ),
  );
  const [activeShipmentId, setActiveShipmentId] =
    useState<string>(initialShipmentId);

  const activeShipment = useMemo(
    () => shipments.find((s) => s.id === activeShipmentId) ?? shipments[0],
    [shipments, activeShipmentId],
  );

  useEffect(() => {
    setShipments((prev) => recalcShipments(prev, items));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  const updateShipmentItem = (
    itemId: string,
    patch: { qty?: number; included?: boolean },
  ) => {
    setShipments((prev) => {
      const active = prev.find((s) => s.id === activeShipmentId);
      if (!active) return prev;
      const entry = active.itemsById[itemId] ?? {
        qty: 0,
        included: true,
        manuallyEdited: false,
      };
      let nextQty = patch.qty !== undefined ? patch.qty : entry.qty;
      const item = items.find((i) => i.id === itemId);
      if (item) {
        const availableBefore = computeAvailableBefore(
          prev,
          itemId,
          active.seq,
        );
        const maxAllowed = Math.max(item.qty - availableBefore, 0);
        nextQty = Math.min(Math.max(nextQty, 0), maxAllowed);
      }
      const updated = prev.map((s) =>
        s.id !== active.id
          ? s
          : {
              ...s,
              itemsById: {
                ...s.itemsById,
                [itemId]: {
                  qty: nextQty,
                  included:
                    patch.included !== undefined
                      ? patch.included
                      : entry.included,
                  manuallyEdited: true,
                },
              },
            },
      );
      return recalcShipments(updated, items);
    });
  };

  const addShipment = () => {
    const newId = uid();
    const nextSeq = shipments.length
      ? Math.max(...shipments.map((s) => s.seq)) + 1
      : 1;
    const newShipment: Shipment = {
      id: newId,
      seq: nextSeq,
      date: todayISO(),
      itemsById: {},
    };
    setShipments((prev) => recalcShipments([...prev, newShipment], items));
    setActiveShipmentId(newId);
  };

  const removeShipment = (id: string) => {
    setShipments((prev) => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter((s) => s.id !== id);
      const next = recalcShipments(filtered, items);
      if (activeShipmentId === id) setActiveShipmentId(next[0].id);
      return next;
    });
  };

  const updateShipmentDate = (date: string) => {
    setShipments((prev) =>
      prev.map((s) => (s.id === activeShipmentId ? { ...s, date } : s)),
    );
  };

  const sjRows = useMemo(() => {
    if (!activeShipment) return [];
    return items.map((it) => {
      const entry = activeShipment.itemsById[it.id] ?? {
        qty: 0,
        included: false,
        manuallyEdited: false,
      };
      const availableBefore = computeAvailableBefore(
        shipments,
        it.id,
        activeShipment.seq,
      );
      const maxAllowed = Math.max(it.qty - availableBefore, 0);
      const remainingAfterThis = Math.max(
        it.qty - availableBefore - entry.qty,
        0,
      );
      return {
        ...it,
        shippedQty: entry.qty,
        included: entry.included,
        maxAllowed,
        remainingAfterThis,
      };
    });
  }, [items, activeShipment, shipments]);

  const subtotal = items.reduce((sum, it) => sum + it.qty * it.price, 0);
  const discountAmount =
    discountType === "percent"
      ? (subtotal * discountValue) / 100
      : discountValue;
  // PPN dihitung dari subtotal setelah diskon; ongkir tidak dikenai PPN.
  const taxableBase = Math.max(subtotal - discountAmount, 0);
  const taxAmount = taxEnabled ? Math.round((taxableBase * taxRate) / 100) : 0;
  const grandTotal = taxableBase + taxAmount + shippingCost;

  const suratJalanBase = invoiceNumber.replace(/^INV-/, "SJ-");
  const suratJalanNumber = activeShipment
    ? `${suratJalanBase}-${activeShipment.seq}`
    : suratJalanBase;
  const documentDate =
    docType === "suratJalan"
      ? (activeShipment?.date ?? invoiceDate)
      : invoiceDate;

  const topLabel =
    topDays === null
      ? customTopDays !== "" && !isNaN(customTopDays)
        ? `Custom (${customTopDays} Hari)`
        : "Custom"
      : (TOP_OPTIONS.find((t) => t.days === topDays)?.label ?? "Custom");

  useEffect(() => {
    if (!autoFit) return;
    const recompute = () => {
      const wrap = canvasWrapRef.current;
      const page = pageRef.current;
      if (!wrap || !page) return;
      const availW = wrap.clientWidth - 48;
      const availH = wrap.clientHeight - 48;
      const scale = Math.min(
        availW / page.scrollWidth,
        availH / page.scrollHeight,
        1,
      );
      setZoom(scale > 0.1 ? scale : 0.5);
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    if (canvasWrapRef.current) ro.observe(canvasWrapRef.current);
    if (pageRef.current) ro.observe(pageRef.current);
    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [autoFit, items.length, docType, panelCollapsed]);

  useEffect(() => {
    if (!showFullPreview || !previewAutoFit) return;
    const recompute = () => {
      const wrap = previewWrapRef.current;
      const page = previewPageRef.current;
      if (!wrap || !page) return;
      const narrow = wrap.clientWidth < 768;
      const pad = narrow ? 24 : 64;
      const availW = wrap.clientWidth - pad;
      const availH = wrap.clientHeight - pad;
      // Di HP/tablet portrait: fit ke lebar saja biar teks gak terlalu kecil.
      const scale = narrow
        ? Math.min(availW / page.scrollWidth, 1.4)
        : Math.min(
            availW / page.scrollWidth,
            availH / page.scrollHeight,
            1.4,
          );
      setPreviewZoom(scale > 0.1 ? scale : 0.5);
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    if (previewWrapRef.current) ro.observe(previewWrapRef.current);
    if (previewPageRef.current) ro.observe(previewPageRef.current);
    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [showFullPreview, previewAutoFit, items.length, docType]);

  const handleCustomerNameChange = (name: string) => {
    setCustomerName(name);
    if (!invoiceNumberTouched) setInvoiceNumber(autoInvoiceNumber(name));
  };

  const handleTopChange = (days: number | null) => {
    setTopDays(days);
    if (days !== null) setDueDate(addDaysISO(invoiceDate, days));
  };

  const handleCustomTopDaysChange = (v: string) => {
    const n = v === "" ? "" : Number(v);
    setCustomTopDays(n);
    if (n !== "" && !isNaN(n)) setDueDate(addDaysISO(invoiceDate, n));
  };

  const handleInvoiceDateChange = (date: string) => {
    setInvoiceDate(date);
    if (topDays !== null) setDueDate(addDaysISO(date, topDays));
    else if (customTopDays !== "" && !isNaN(customTopDays))
      setDueDate(addDaysISO(date, customTopDays));
  };

  const addItem = () =>
    setItems((prev) => [
      ...prev,
      { id: uid(), name: "", unit: "pcs", qty: 1, price: 0 },
    ]);
  const updateItem = (id: string, patch: Partial<LineItem>) =>
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...patch } : it)),
    );
  const removeItem = (id: string) =>
    setItems((prev) =>
      prev.length > 1 ? prev.filter((it) => it.id !== id) : prev,
    );

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSignatureUrl(URL.createObjectURL(file));
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  };

  // ── Template pesan share — dihitung otomatis sesuai docType. Salam
  // (pagi/siang/sore/malam) ngikutin jam perangkat saat pesan dibuat. ─────
  const shareCaption = () => {
    const salam = greeting();
    if (docType === "invoice") {
      const sapaan = `Bapak/Ibu${customerName ? ` ${customerName}` : ""}`;
      return `${salam}, ${sapaan}.\n\nBerikut kami kirimkan invoice ${invoiceNumber} dari Makmur A3'S.\n\nTotal tagihan: ${currency(grandTotal)}\nTermin: ${topLabel}\nJatuh tempo: ${dueDate}\n\nPembayaran dapat ditransfer ke:\n${bank.bankName} ${bank.accountNumber}\na.n. ${bank.accountHolder}\n\nInvoice terlampir dalam PDF. Mohon dicek, Pak/Bu, terima kasih.`;
    }
    const targetName = shippingAddress.sameAsCustomer
      ? customerName
      : shippingAddress.name;
    const sapaan = `Bapak/Ibu${targetName ? ` ${targetName}` : ""}`;
    return `${salam}, ${sapaan}.\n\nBerikut kami kirimkan surat jalan ${suratJalanNumber} (ref. invoice ${invoiceNumber}) untuk pengiriman tanggal ${activeShipment?.date ?? documentDate}.\n\nSurat jalan terlampir dalam PDF. Mohon dicek saat barang diterima, Pak/Bu, terima kasih.`;
  };

  // Nomor tujuan WhatsApp: surat jalan ke alamat lain -> HP penerima,
  // selain itu -> HP customer.
  const shareTargetPhone = () =>
    docType === "suratJalan" && !shippingAddress.sameAsCustomer
      ? shippingAddress.phone
      : customer.phone;

  // Salin template pesan ke clipboard (cadangan kalau WhatsApp membuang
  // teks saat file PDF ikut dikirim). Harus dipanggil langsung dari klik.
  const copyCaption = () => {
    try {
      navigator.clipboard?.writeText(shareCaption()).catch(() => {});
    } catch {
      // clipboard gak tersedia — abaikan
    }
  };

  const emailSubjectText = () =>
    docType === "invoice"
      ? `Invoice ${invoiceNumber} — Makmur A3'S`
      : `Surat Jalan ${suratJalanNumber} — Makmur A3'S`;

  const handlePrint = () => window.print();

  const getPdfFileName = () =>
    `${docType === "invoice" ? invoiceNumber : suratJalanNumber}.pdf`;

  const buildPdfDocument = async () => {
    if (!exportRef.current) return null;
    const html2canvas = (await import("html2canvas")).default;
    const { jsPDF } = await import("jspdf");
    await waitForImages(exportRef.current);
    const canvas = await html2canvas(exportRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * pageWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;
    pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
    heightLeft -= pageHeight;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
      heightLeft -= pageHeight;
    }
    return pdf;
  };

  const getPdfFile = async (): Promise<File | null> => {
    const pdf = await buildPdfDocument();
    if (!pdf) return null;
    const blob = pdf.output("blob") as Blob;
    return new File([blob], getPdfFileName(), { type: "application/pdf" });
  };

  const downloadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    setBusy("pdf");
    try {
      const pdf = await buildPdfDocument();
      pdf?.save(getPdfFileName());
    } finally {
      setBusy(null);
    }
  };

  // Share: Web Share API (HP) kirim PDF + teks. Template juga disalin ke
  // clipboard dulu, karena WhatsApp sering membuang teks saat ada file.
  // Kalau Web Share gak didukung (desktop), buka dropdown WhatsApp/Email.
  const handleShareClick = async () => {
    setBusy("share");
    setShareNotice(null);
    copyCaption(); // sebelum await, supaya masih dianggap klik user
    try {
      const file = await getPdfFile();
      const caption = shareCaption();
      if (
        file &&
        typeof navigator !== "undefined" &&
        (navigator as any).canShare?.({ files: [file] })
      ) {
        try {
          await (navigator as any).share({
            files: [file],
            text: caption,
            title: getPdfFileName(),
          });
          return;
        } catch (err: any) {
          if (err?.name === "AbortError") return;
        }
      }
      setShareMenuOpen(true);
    } finally {
      setBusy(null);
    }
  };

  const handleShareFallback = async (channel: "wa" | "email") => {
    setShareMenuOpen(false);
    setBusy("share");
    copyCaption();
    try {
      const file = await getPdfFile();
      if (file) downloadFile(file);
      if (channel === "wa") {
        window.open(
          `https://wa.me/${toWaNumber(shareTargetPhone())}?text=${encodeURIComponent(shareCaption())}`,
          "_blank",
        );
      } else {
        window.location.href = `mailto:${customer.email}?subject=${encodeURIComponent(
          emailSubjectText(),
        )}&body=${encodeURIComponent(shareCaption())}`;
      }
      setShareNotice({ channel });
    } finally {
      setBusy(null);
    }
  };

  const getShareNoticeText = () => {
    if (!shareNotice) return null;
    const target = shareNotice.channel === "wa" ? "WhatsApp" : "aplikasi email";
    return isMobile
      ? `PDF sudah otomatis kedownload, dan ${target} sudah kebuka dengan teks siap kirim. Lampirkan PDF-nya dari folder Download. Teks pesan juga sudah disalin, tinggal paste kalau belum muncul.`
      : `PDF sudah otomatis kedownload ke komputer, dan ${target} kebuka di tab/aplikasi baru dengan teks siap kirim. Lampirkan PDF yang barusan kedownload. Teks pesan juga sudah disalin ke clipboard.`;
  };

  const docProps = {
    docType,
    company,
    setCompany,
    customerName,
    onCustomerNameChange: handleCustomerNameChange,
    customer,
    setCustomer,
    invoiceNumber,
    onInvoiceNumberChange: (v: string) => {
      setInvoiceNumber(v);
      setInvoiceNumberTouched(true);
    },
    suratJalanNumber,
    documentDate,
    dueDate,
    topLabel,
    items,
    updateItem,
    removeItem,
    addItem,
    subtotal,
    discountAmount,
    shippingCost,
    grandTotal,
    bank,
    signatureUrl,
    signerName,
    signerTitle,
    showStamp,
    taxRate,
    taxAmount,
    shippingAddress,
    setShippingAddress,
    sjRows,
    updateSjItem: updateShipmentItem,
  };

  return (
    <div className="fixed inset-0 z-[100] bg-neutral-100 flex flex-col overflow-hidden">
      <style>{`
        @media print {
          @page { size: A4; margin: 10mm; }
          body { margin: 0; }
          body * { visibility: hidden; }
          #invoice-export-area, #invoice-export-area * { visibility: visible; }
          #invoice-export-area {
            position: fixed !important; left: 0 !important; top: 0 !important;
            width: 100% !important; z-index: 999999 !important;
          }
          #invoice-export-area .export-page {
            width: 100% !important;
          }
          #invoice-export-area .overflow-x-auto {
            overflow: visible !important;
          }
          .no-print { display: none !important; }
        }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
        input[type="number"] {
          -moz-appearance: textfield;
        }
        @media (max-width: 1023px) {
          input:not([type="checkbox"]):not([type="radio"]),
          textarea,
          select {
            font-size: 16px !important;
          }
        }
      `}</style>

      {/* ── TOOLBAR ATAS ─────────────────────────────────────────── */}
      <div className="no-print flex items-center gap-2 px-4 py-2.5 bg-white border-b border-line shrink-0 flex-wrap">
        <button
          onClick={() => setPanelCollapsed((v) => !v)}
          className="hidden lg:flex w-8 h-8 items-center justify-center rounded-lg hover:bg-sand text-ink/50"
        >
          {panelCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
        <span className="font-display text-sm mr-2 hidden sm:inline">
          Invoice Generator
        </span>

        <div className="flex items-center gap-1 bg-sand rounded-full p-0.5 mr-auto">
          <button
            onClick={() => {
              setDocType("invoice");
              setShareNotice(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              docType === "invoice" ? "bg-ink text-white" : "text-ink/60"
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Invoice
          </button>
          <button
            onClick={() => {
              setDocType("suratJalan");
              setShareNotice(null);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              docType === "suratJalan" ? "bg-ink text-white" : "text-ink/60"
            }`}
          >
            <Truck className="w-3.5 h-3.5" /> Surat Jalan
          </button>
        </div>

        <button
          onClick={() => {
            setPreviewAutoFit(true);
            setShowFullPreview(true);
          }}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-line text-ink/60 hover:border-ink hover:text-ink transition-colors mr-1"
        >
          <Eye className="w-3.5 h-3.5" />
          Preview
        </button>

        <div className="hidden lg:flex items-center gap-1">
          <button
            onClick={() => {
              setAutoFit(false);
              setZoom((z) => Math.max(0.2, z - 0.1));
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-sand text-ink/60"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs text-ink/50 w-10 text-center font-data">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => {
              setAutoFit(false);
              setZoom((z) => Math.min(2, z + 0.1));
            }}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-sand text-ink/60"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setAutoFit(true)}
            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-sand text-ink/60"
            aria-label="Fit ke layar"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        <button
          onClick={handleLogout}
          disabled={loggingOut}
          aria-label="Keluar"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-60"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {loggingOut ? "Keluar…" : "Keluar"}
          </span>
        </button>
      </div>

      <div className="no-print lg:hidden flex items-center gap-1 bg-white border-b border-line px-3 py-2 shrink-0">
        <button
          onClick={() => setMobileView("edit")}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors ${mobileView === "edit" ? "bg-ink text-white" : "text-ink/60"}`}
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
        <button
          onClick={() => {
            setPreviewAutoFit(true);
            setShowFullPreview(true);
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors text-ink/60`}
        >
          <Eye className="w-3.5 h-3.5" /> Preview
        </button>
      </div>

      <div className="flex-1 flex min-h-0 relative">
        {/* ── SIDEBAR KIRI ─────────────────────────────────────────── */}
        <div
          className={`no-print bg-white border-r border-line flex flex-col shrink-0 h-full transition-all duration-200 ${
            panelCollapsed
              ? "w-0 overflow-hidden"
              : "w-full lg:w-[380px]"
          } ${mobileView === "preview" ? "hidden lg:flex" : "flex"}`}
        >
          <div className="flex-1 flex min-h-0">
            {/* Rail tab vertikal */}
            <div className="w-16 shrink-0 border-r border-line flex flex-col items-center gap-1 py-3 overflow-y-auto">
              {sidebarTabs.map((t) => {
                const Icon = t.icon;
                const active = activeSidebarTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveSidebarTab(t.id)}
                    className={`w-14 flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] font-medium transition-colors ${
                      active ? "bg-ink text-white" : "text-ink/50 hover:bg-sand"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="leading-tight text-center">{t.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                {activeSidebarTab === "customer" && docType === "invoice" && (
                  <>
                    <SidebarSectionHeader icon={User} label="Customer" />
                    <div>
                      <label className="text-xs font-medium text-ink/60">
                        Nama Customer
                      </label>
                      <input
                        placeholder="Nama customer"
                        value={customerName}
                        onChange={(e) =>
                          handleCustomerNameChange(e.target.value)
                        }
                        className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow mt-1"
                      />
                      <p className="text-[11px] text-ink/40 mt-1">
                        No. Invoice otomatis dibuat dari nama ini.
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-ink/60">
                        Alamat (tagihan)
                      </label>
                      <textarea
                        placeholder="Alamat (tagihan)"
                        value={customer.address}
                        onChange={(e) =>
                          setCustomer((c) => ({
                            ...c,
                            address: e.target.value,
                          }))
                        }
                        rows={2}
                        className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow resize-none mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs font-medium text-ink/60">
                          No. HP
                        </label>
                        <input
                          placeholder="Opsional"
                          value={customer.phone}
                          onChange={(e) =>
                            setCustomer((c) => ({
                              ...c,
                              phone: e.target.value,
                            }))
                          }
                          className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-ink/60">
                          Email
                        </label>
                        <input
                          placeholder="Opsional"
                          value={customer.email}
                          onChange={(e) =>
                            setCustomer((c) => ({
                              ...c,
                              email: e.target.value,
                            }))
                          }
                          className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow mt-1"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-ink/40 -mt-2">
                      No. HP dipakai untuk membuka chat WhatsApp langsung ke
                      customer saat Share.
                    </p>
                  </>
                )}

                {activeSidebarTab === "customer" &&
                  docType === "suratJalan" && (
                    <>
                      <SidebarSectionHeader icon={Truck} label="Tujuan Kirim" />
                      <div className="flex flex-col gap-2">
                        <SidebarSubLabel>Alamat Pengiriman</SidebarSubLabel>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              setShippingAddress((s) => ({
                                ...s,
                                sameAsCustomer: true,
                              }))
                            }
                            className={`px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              shippingAddress.sameAsCustomer
                                ? "bg-ink text-white border-ink"
                                : "border-line text-ink/60 hover:border-ink"
                            }`}
                          >
                            Sama dengan Invoice
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setShippingAddress((s) => ({
                                ...s,
                                sameAsCustomer: false,
                              }))
                            }
                            className={`px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                              !shippingAddress.sameAsCustomer
                                ? "bg-ink text-white border-ink"
                                : "border-line text-ink/60 hover:border-ink"
                            }`}
                          >
                            Alamat Lain
                          </button>
                        </div>
                        {!shippingAddress.sameAsCustomer && (
                          <>
                            <input
                              placeholder="Nama penerima / gudang / outlet"
                              value={shippingAddress.name}
                              onChange={(e) =>
                                setShippingAddress((s) => ({
                                  ...s,
                                  name: e.target.value,
                                }))
                              }
                              className="border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow"
                            />
                            <textarea
                              placeholder="Alamat pengiriman (gudang/outlet)"
                              value={shippingAddress.address}
                              onChange={(e) =>
                                setShippingAddress((s) => ({
                                  ...s,
                                  address: e.target.value,
                                }))
                              }
                              rows={2}
                              className="border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow resize-none"
                            />
                            <input
                              placeholder="No. HP penerima (opsional)"
                              value={shippingAddress.phone}
                              onChange={(e) =>
                                setShippingAddress((s) => ({
                                  ...s,
                                  phone: e.target.value,
                                }))
                              }
                              className="border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow"
                            />
                          </>
                        )}
                      </div>
                    </>
                  )}

                {activeSidebarTab === "info" && (
                  <>
                    <SidebarSectionHeader
                      icon={ClipboardList}
                      label={docType === "invoice" ? "Invoice" : "Surat Jalan"}
                    />
                    {docType === "invoice" ? (
                      <>
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-medium text-ink/60">
                            No. Invoice
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setInvoiceNumber(autoInvoiceNumber(customerName));
                              setInvoiceNumberTouched(false);
                            }}
                            className="flex items-center gap-1 text-[11px] text-ink/40 hover:text-ink"
                          >
                            <RotateCcw className="w-3 h-3" /> Regenerate
                          </button>
                        </div>
                        <input
                          value={invoiceNumber}
                          onChange={(e) => {
                            setInvoiceNumber(e.target.value);
                            setInvoiceNumberTouched(true);
                          }}
                          className="border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow font-data"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs font-medium text-ink/60">
                              Tanggal
                            </label>
                            <input
                              type="date"
                              value={invoiceDate}
                              onChange={(e) =>
                                handleInvoiceDateChange(e.target.value)
                              }
                              className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow mt-1"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-ink/60">
                              Jatuh Tempo
                            </label>
                            <input
                              type="date"
                              value={dueDate}
                              onChange={(e) => setDueDate(e.target.value)}
                              className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow mt-1"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-ink/60">
                            Termin Pembayaran (TOP)
                          </label>
                          <div className="flex items-center gap-1 flex-wrap mt-1">
                            {TOP_OPTIONS.map((t) => {
                              const val =
                                t.days === null ? "custom" : String(t.days);
                              const active =
                                (topDays === null
                                  ? "custom"
                                  : String(topDays)) === val;
                              return (
                                <button
                                  key={val}
                                  type="button"
                                  onClick={() => handleTopChange(t.days)}
                                  className={`px-2.5 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                                    active
                                      ? "bg-ink text-white border-ink"
                                      : "border-line text-ink/60 hover:border-ink"
                                  }`}
                                >
                                  {t.label}
                                </button>
                              );
                            })}
                            {topDays === null && (
                              <div className="flex items-center gap-1 pl-2.5 py-1 pr-2.5 rounded-full border border-ink bg-ink/5">
                                <input
                                  type="number"
                                  min={0}
                                  value={customTopDays}
                                  onChange={(e) =>
                                    handleCustomTopDaysChange(e.target.value)
                                  }
                                  placeholder="0"
                                  className="w-10 bg-transparent outline-none text-xs font-medium text-right"
                                />
                                <span className="text-xs font-medium text-ink/60">
                                  Hari
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="text-xs font-medium text-ink/60">
                            Batch Kirim
                          </label>
                          <div className="flex items-center gap-1.5 flex-wrap mt-1">
                            {shipments.map((s) => (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => setActiveShipmentId(s.id)}
                                className={`flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                                  s.id === activeShipmentId
                                    ? "bg-ink text-white border-ink"
                                    : "border-line text-ink/60 hover:border-ink"
                                }`}
                              >
                                SJ #{s.seq}
                                {shipments.length > 1 && (
                                  <span
                                    role="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      removeShipment(s.id);
                                    }}
                                    className="opacity-60 hover:opacity-100 p-0.5"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </span>
                                )}
                              </button>
                            ))}
                            <button
                              type="button"
                              onClick={addShipment}
                              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border border-dashed border-line text-ink/50 hover:border-ink hover:text-ink"
                            >
                              <Plus className="w-3 h-3" /> SJ Baru
                            </button>
                          </div>
                          <p className="text-[11px] text-ink/40 mt-1.5">
                            Buat SJ baru kalau kirimannya dipecah beberapa kali
                            — qty yang udah kepakai di batch lain otomatis gak
                            bisa dobel diinput.
                          </p>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-ink/60">
                            No. Surat Jalan
                          </label>
                          <div className="border border-line rounded-lg px-3 py-2 text-sm font-data bg-sand/40 text-ink/70 mt-1">
                            {suratJalanNumber}
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-ink/60">
                            Tanggal Kirim (batch ini)
                          </label>
                          <input
                            type="date"
                            value={activeShipment?.date ?? todayISO()}
                            onChange={(e) => updateShipmentDate(e.target.value)}
                            className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-ink/60">
                            Referensi Invoice
                          </label>
                          <div className="border border-line rounded-lg px-3 py-2 text-sm font-data bg-sand/40 text-ink/70 mt-1 break-words">
                            <RefNumber value={invoiceNumber} />
                          </div>
                        </div>
                      </>
                    )}
                  </>
                )}

                {docType === "invoice" && activeSidebarTab === "item" && (
                  <>
                    <SidebarSectionHeader icon={Package} label="Item & Harga" />
                    <button
                      onClick={addItem}
                      className="flex items-center justify-center gap-1.5 border border-dashed border-line rounded-lg py-2 text-sm text-ink/60 hover:border-ink hover:text-ink transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Tambah Baris Kosong
                    </button>

                    {items.length > 0 && (
                      <div className="flex flex-col gap-2">
                        {items.map((it) => (
                          <div
                            key={it.id}
                            className="border border-line rounded-lg p-2.5 flex flex-col gap-1.5"
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex-1 min-w-0 text-xs font-medium">
                                <ItemNameField
                                  editable
                                  value={it.name}
                                  onChange={(v: string) =>
                                    updateItem(it.id, { name: v })
                                  }
                                />
                              </div>
                              <button
                                onClick={() => removeItem(it.id)}
                                aria-label="Hapus baris"
                                className="shrink-0"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-ink/30 hover:text-brand" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1">
                                <label className="text-[10px] text-ink/40">
                                  Qty
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  value={it.qty}
                                  onChange={(e) =>
                                    updateItem(it.id, {
                                      qty: Number(e.target.value),
                                    })
                                  }
                                  className="w-full border border-line rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow"
                                />
                              </div>
                              <div className="flex-1">
                                <label className="text-[10px] text-ink/40">
                                  Harga
                                </label>
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  value={it.price ? formatNumber(it.price) : ""}
                                  onChange={(e) =>
                                    updateItem(it.id, {
                                      price: parseNumberInput(e.target.value),
                                    })
                                  }
                                  placeholder="0"
                                  className="w-full border border-line rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {docType === "invoice" && activeSidebarTab === "diskon" && (
                  <>
                    <SidebarSectionHeader
                      icon={SlidersHorizontal}
                      label="Tambahan"
                    />
                    <div className="flex flex-col gap-2">
                      <SidebarSubLabel>Diskon</SidebarSubLabel>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          {[
                            { label: "%", value: "percent" as const },
                            { label: "Rp", value: "fixed" as const },
                          ].map((o) => (
                            <button
                              key={o.value}
                              type="button"
                              onClick={() => setDiscountType(o.value)}
                              className={`px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                                discountType === o.value
                                  ? "bg-ink text-white border-ink"
                                  : "border-line text-ink/60 hover:border-ink"
                              }`}
                            >
                              {o.label}
                            </button>
                          ))}
                        </div>
                        <input
                          type="number"
                          min={0}
                          value={discountValue || ""}
                          onChange={(e) =>
                            setDiscountValue(Number(e.target.value))
                          }
                          placeholder="0"
                          className="flex-1 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow"
                        />
                      </div>
                      {discountAmount > 0 && (
                        <p className="text-[11px] text-brand">
                          Potongan: -{currency(discountAmount)}
                        </p>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 pt-4 mt-1 border-t border-line">
                      <SidebarSubLabel>PPN</SidebarSubLabel>
                      <label className="flex items-center justify-between gap-3 border border-line rounded-lg px-3 py-2.5 cursor-pointer">
                        <span className="text-sm text-ink/80">Kenakan PPN</span>
                        <input
                          type="checkbox"
                          checked={taxEnabled}
                          onChange={(e) => setTaxEnabled(e.target.checked)}
                          className="w-4 h-4 accent-ink"
                        />
                      </label>
                      {taxEnabled && (
                        <>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min={0}
                              step="0.1"
                              value={taxRate}
                              onChange={(e) => setTaxRate(Number(e.target.value))}
                              className="w-24 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow"
                            />
                            <span className="text-sm text-ink/60">%</span>
                          </div>
                          {taxAmount > 0 && (
                            <p className="text-[11px] text-ink/40">
                              PPN: +{currency(taxAmount)}
                            </p>
                          )}
                        </>
                      )}
                      <p className="text-[11px] text-ink/40">
                        Dihitung dari subtotal setelah diskon. Ongkir tidak
                        dikenai PPN.
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 pt-4 mt-1 border-t border-line">
                      <SidebarSubLabel>Ongkos Kirim</SidebarSubLabel>
                      <label className="text-xs font-medium text-ink/60">
                        Biaya Ongkir (opsional)
                      </label>
                      <div className="flex items-center gap-1 border border-line rounded-lg px-3 py-2 focus-within:border-ink focus-within:ring-2 focus-within:ring-ink/5 transition-shadow">
                        <span className="text-ink/40 text-xs">Rp</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          value={shippingCost ? formatNumber(shippingCost) : ""}
                          onChange={(e) =>
                            setShippingCost(parseNumberInput(e.target.value))
                          }
                          placeholder="0"
                          className="flex-1 bg-transparent text-sm outline-none"
                        />
                      </div>
                      <p className="text-[11px] text-ink/40">
                        Diisi kalau ongkirnya ditagihkan ke customer — otomatis
                        ditambahkan ke Total di invoice. Kosongkan / isi 0 kalau
                        gratis ongkir.
                      </p>
                    </div>
                  </>
                )}

                {docType === "invoice" && activeSidebarTab === "rekening" && (
                  <>
                    <SidebarSectionHeader
                      icon={Landmark}
                      label="Rekening Bank"
                    />
                    <div>
                      <label className="text-xs font-medium text-ink/60">
                        Nama Bank
                      </label>
                      <input
                        value={bank.bankName}
                        onChange={(e) =>
                          setBank((b) => ({ ...b, bankName: e.target.value }))
                        }
                        placeholder="Nama bank"
                        className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-ink/60">
                        No. Rekening
                      </label>
                      <input
                        value={bank.accountNumber}
                        onChange={(e) =>
                          setBank((b) => ({
                            ...b,
                            accountNumber: e.target.value,
                          }))
                        }
                        placeholder="No. rekening"
                        className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-ink/60">
                        Atas Nama
                      </label>
                      <input
                        value={bank.accountHolder}
                        onChange={(e) =>
                          setBank((b) => ({
                            ...b,
                            accountHolder: e.target.value,
                          }))
                        }
                        placeholder="Atas nama"
                        className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow mt-1"
                      />
                    </div>
                  </>
                )}

                {docType === "invoice" && activeSidebarTab === "ttd" && (
                  <>
                    <SidebarSectionHeader icon={PenTool} label="Tanda Tangan" />
                    <label className="flex items-center justify-between gap-3 border border-line rounded-lg px-3 py-2.5 cursor-pointer">
                      <span className="text-sm text-ink/80">Tampilkan cap</span>
                      <input
                        type="checkbox"
                        checked={showStamp}
                        onChange={(e) => setShowStamp(e.target.checked)}
                        className="w-4 h-4 accent-ink"
                      />
                    </label>
                    <label className="flex items-center justify-center gap-2 border border-dashed border-line rounded-lg py-2.5 text-sm text-ink/60 hover:border-ink cursor-pointer transition-colors">
                      <Upload className="w-4 h-4" />{" "}
                      {signatureUrl ? "Ganti file" : "Upload tanda tangan"}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSignatureUpload}
                        className="hidden"
                      />
                    </label>
                    {!signatureUrl && (
                      <p className="text-[11px] text-ink/40">
                        Belum ada tanda tangan diupload — cuma cap yang bakal
                        tampil di invoice.
                      </p>
                    )}
                    {signatureUrl && (
                      <button
                        type="button"
                        onClick={() => setSignatureUrl(null)}
                        className="text-[11px] text-ink/40 hover:text-brand self-start"
                      >
                        Hapus tanda tangan
                      </button>
                    )}

                    <div className="flex flex-col gap-2 pt-4 mt-1 border-t border-line">
                      <SidebarSubLabel>Penandatangan</SidebarSubLabel>
                      <div>
                        <label className="text-xs font-medium text-ink/60">
                          Nama (opsional)
                        </label>
                        <input
                          value={signerName}
                          onChange={(e) => setSignerName(e.target.value)}
                          placeholder="Contoh: Budi Santoso"
                          className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow mt-1"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-ink/60">
                          Jabatan (opsional)
                        </label>
                        <input
                          value={signerTitle}
                          onChange={(e) => setSignerTitle(e.target.value)}
                          placeholder="Contoh: Direktur"
                          className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow mt-1"
                        />
                      </div>
                      <p className="text-[11px] text-ink/40">
                        Tampil di bawah garis tanda tangan. Kalau nama
                        dikosongkan, yang tampil &quot;Makmur A3&apos;S&quot;.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ── Bar aksi: Share, PDF, Print ── */}
          <div className="no-print shrink-0 border-t border-line p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-white flex flex-col gap-2">
            {shareNotice && (
              <div className="flex items-start gap-2 bg-sand/60 border border-line rounded-lg px-3 py-2 text-[11px] text-ink/70 leading-relaxed">
                <span className="flex-1">{getShareNoticeText()}</span>
                <button
                  type="button"
                  onClick={() => setShareNotice(null)}
                  aria-label="Tutup"
                  className="text-ink/40 hover:text-ink shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <div className="grid grid-cols-3 gap-2">
              <div ref={shareBtnRef} className="relative">
                <button
                  onClick={handleShareClick}
                  disabled={busy === "share"}
                  className="w-full flex items-center justify-center gap-1.5 rounded-lg bg-ink text-white py-2.5 text-xs font-medium hover:bg-ink/90 transition-colors disabled:opacity-60"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  {busy === "share" ? "Memproses…" : "Share"}
                </button>

                {shareMenuOpen && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-line rounded-lg shadow-lg overflow-hidden z-20">
                    <p className="px-3 pt-2.5 pb-1.5 text-[10px] uppercase tracking-wide text-ink/40 font-semibold">
                      Bagikan lewat
                    </p>
                    <button
                      onClick={() => handleShareFallback("wa")}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-ink/80 hover:bg-sand transition-colors"
                    >
                      <span className="w-5 h-5 shrink-0 flex items-center justify-center rounded-full bg-[#25D366] text-white">
                        <WhatsAppIcon className="w-3 h-3" />
                      </span>
                      WhatsApp
                    </button>
                    <button
                      onClick={() => handleShareFallback("email")}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-ink/80 hover:bg-sand transition-colors border-t border-line"
                    >
                      <span className="w-5 h-5 shrink-0 flex items-center justify-center rounded-full bg-ink text-white">
                        <Mail className="w-3 h-3" />
                      </span>
                      Email
                    </button>
                  </div>
                )}
              </div>
              <button
                onClick={handleDownloadPdf}
                disabled={busy === "pdf"}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-line py-2.5 text-xs font-medium text-ink/80 hover:bg-sand hover:border-ink/30 transition-colors disabled:opacity-60"
              >
                <Download className="w-3.5 h-3.5" />
                {busy === "pdf" ? "Memproses…" : "PDF"}
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-line py-2.5 text-xs font-medium text-ink/80 hover:bg-sand hover:border-ink/30 transition-colors"
              >
                <Printer className="w-3.5 h-3.5" />
                Print
              </button>
            </div>
          </div>
        </div>

        {/* ── CANVAS (zoomable) ────────────────────────────────────── */}
        <div
          ref={canvasWrapRef}
          className={`flex-1 h-full overflow-auto flex items-start p-6 relative ${mobileView === "edit" ? "hidden lg:flex" : "flex"}`}
        >
          <div
            className="mx-auto shrink-0"
            style={{ width: canvasSize.w * zoom, height: canvasSize.h * zoom }}
          >
            <div
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                width: "max-content",
              }}
            >
              <div
                ref={pageRef}
                className="rounded-2xl border border-line shadow-sm overflow-hidden"
              >
                <InvoiceDocument editable {...docProps} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FULL PREVIEW OVERLAY ─────────────────────────────────── */}
      {showFullPreview && (
        <div className="no-print fixed inset-0 z-[200] bg-ink/60 backdrop-blur-sm flex flex-col">
          <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-line shrink-0">
            <Eye className="w-4 h-4 text-ink/50" />
            <span className="font-display text-sm">
              Preview {docType === "invoice" ? "Invoice" : "Surat Jalan"}
            </span>
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => {
                  setPreviewAutoFit(false);
                  setPreviewZoom((z) => Math.max(0.2, z - 0.1));
                }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-sand text-ink/60"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-ink/50 w-10 text-center font-data">
                {Math.round(previewZoom * 100)}%
              </span>
              <button
                onClick={() => {
                  setPreviewAutoFit(false);
                  setPreviewZoom((z) => Math.min(2, z + 0.1));
                }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-sand text-ink/60"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPreviewAutoFit(true)}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-sand text-ink/60"
                aria-label="Fit ke layar"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowFullPreview(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-sand text-ink/60 ml-1"
                aria-label="Tutup preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div
            ref={previewWrapRef}
            className="flex-1 overflow-auto flex items-start p-3 sm:p-8"
          >
            <div
              className="mx-auto shrink-0"
              style={{
                width: previewSize.w * previewZoom,
                height: previewSize.h * previewZoom,
              }}
            >
              <div
                style={{
                  transform: `scale(${previewZoom})`,
                  transformOrigin: "top left",
                  width: "max-content",
                }}
              >
                <div
                  ref={previewPageRef}
                  className="rounded-2xl shadow-2xl overflow-hidden"
                >
                  <InvoiceDocument editable={false} {...docProps} />
                </div>
              </div>
            </div>
          </div>
          <div className="no-print shrink-0 border-t border-line bg-white p-3 flex items-center justify-center gap-2">
            <button
              onClick={() => setShowFullPreview(false)}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-line px-4 py-2 text-xs font-medium text-ink/80 hover:bg-sand transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" /> Kembali Edit
            </button>
            <button
              onClick={handleShareClick}
              disabled={busy === "share"}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-ink text-white px-4 py-2 text-xs font-medium hover:bg-ink/90 transition-colors disabled:opacity-60"
            >
              <Share2 className="w-3.5 h-3.5" />
              {busy === "share" ? "Memproses…" : "Share"}
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={busy === "pdf"}
              className="flex items-center justify-center gap-1.5 rounded-lg border border-line px-4 py-2 text-xs font-medium text-ink/80 hover:bg-sand transition-colors disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              {busy === "pdf" ? "Memproses…" : "PDF"}
            </button>
          </div>
        </div>
      )}

      {/* Versi statis tersembunyi — dipakai KHUSUS buat print & PDF. */}
      <div
        style={{ position: "fixed", top: 0, left: "-10000px", zIndex: -1 }}
        aria-hidden
      >
        <div id="invoice-export-area" ref={exportRef}>
          <InvoiceDocument editable={false} {...docProps} />
        </div>
      </div>
    </div>
  );
}