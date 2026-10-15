"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
  AlertTriangle,
  Info,
  Settings,
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
  accountHolder: "Budi Santoso",
};

// Batas total invoice yang kemungkinan perlu materai Rp10.000. Dipakai
// sebagai "5 juta ATAU LEBIH", jadi total pas Rp5.000.000 pun tetap diingatkan.
const MATERAI_THRESHOLD = 5_000_000;

// Zoom awal preview di HP: cukup besar supaya teks terbaca (dokumen 780px
// di layar ~390px akan scroll horizontal; pinch-zoom / tombol Fit tersedia).
const READABLE_ZOOM = 0.85;

// ── Ukuran halaman untuk export / print / preview ────────────────────────
// Lebar dokumen 780px. Tinggi 1100px = rasio A4 (210:297) dikurangi sedikit
// supaya hasil PDF (296,2mm) dan hasil print (291mm) tidak pernah meluber
// ke halaman tambahan akibat pembulatan.
const PAGE_W = 780;
const PAGE_H = 1100;
// Ruang cadangan di dasar halaman (jaga-jaga selisih pembulatan ukuran).
const PAGE_SAFE = 22;
// Saat blok akhir (total + rekening + TTD) tidak muat, paling banyak sekian
// baris item terakhir ikut pindah supaya tanda tangan tidak sendirian.
const MAX_CARRY_ROWS = 1;

// Maksimal tambahan padding per baris (px, total atas+bawah) saat halaman
// yang bukan terakhir direnggangkan supaya tidak terlihat kosong.
const MAX_STRETCH = 16;

// Tinggi tombol "Tambah baris" di editor (mt-2 = 8px + tinggi 16px). Tinggi
// ini dikurangkan dari margin bawah tabel supaya tombol tidak mengubah posisi
// blok di bawahnya -> layout editor identik dengan PDF.
const ADD_ROW_H = 24;

// Level kepadatan: 0 normal, 1 rapat, 2 sangat rapat.
// pad = padding halaman (margin), gap = jarak kop ke body, meta = jarak blok
// customer ke tabel, tbl = jarak bawah tabel, tot = padding bawah blok total,
// row = padding atas/bawah tiap baris item. Level 0 = tampilan asli.
const DENSITY = [
  { pad: 40, gap: 24, meta: 32, tbl: 24, tot: 24, row: 8 },
  { pad: 32, gap: 16, meta: 20, tbl: 16, tot: 16, row: 5 },
  { pad: 24, gap: 12, meta: 12, tbl: 12, tot: 12, row: 3 },
];

// Lokasi gambar cap perusahaan (public/invoice/cap.png).
const STAMP_SRC = "/invoice/cap.png";

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

const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
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
  // Kode GR / penerimaan barang dari customer. Per pengiriman, karena
  // tiap pengiriman diterima sendiri-sendiri.
  grCode: string;
  // Alamat tujuan per pengiriman.
  shipTo: ShipTo;
  itemsById: Record<string, ShipmentItemEntry>;
};

// Alamat tujuan satu surat jalan. Default: sama dengan alamat customer di
// invoice. Tiap SJ boleh beda (misal pengiriman parsial ke outlet berbeda).
type ShipTo = {
  sameAsCustomer: boolean;
  name: string;
  address: string;
  phone: string;
};

const DEFAULT_SHIP_TO: ShipTo = {
  sameAsCustomer: true,
  name: "",
  address: "",
  phone: "",
};

type DocType = "invoice" | "suratJalan";

// Satu dokumen yang akan di-export (PDF / print / share).
type ExportDoc = {
  key: string;
  kind: DocType;
  fileName: string;
  shipment?: Shipment; // hanya untuk kind "suratJalan"
  props: Record<string, any>;
};

type BuiltPdf = { fileName: string; pdf: import("jspdf").jsPDF };

// Dialog konfirmasi yang sedang aktif (hapus SJ / keluar).
type ConfirmState = { kind: "logout" } | { kind: "shipment"; id: string };

// Satu halaman hasil paginasi: baris item [start, end), apakah blok total
// ada di halaman ini, dan apakah blok rekening + tanda tangan ada di sini.
type PageSlice = {
  start: number;
  end: number;
  total: boolean;
  rest: boolean;
  pad?: number; // tambahan padding per baris (px) untuk halaman ini
};

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

// "2026-10-13" -> "13 Oktober 2026". Split manual (bukan new Date) supaya
// tidak kena pergeseran zona waktu. Kalau format tidak valid, dikembalikan
// apa adanya.
function formatDateID(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d || m < 1 || m > 12) return iso;
  return `${d} ${MONTHS_ID[m - 1]} ${y}`;
}

// Date -> "YYYY-MM-DD" berdasarkan tanggal LOKAL (bukan UTC).
function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayISO() {
  return toISODate(new Date());
}

// Aritmetika tanggal dari komponen y/m/d lokal, bukan new Date(iso) yang
// diparse sebagai UTC.
function addDaysISO(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return toISODate(new Date(y, m - 1, d + days));
}

// Selisih hari (to - from) dari komponen y/m/d. Pakai Date.UTC supaya
// aman dari DST dan zona waktu.
function diffDaysISO(fromIso: string, toIso: string) {
  const [y1, m1, d1] = fromIso.split("-").map(Number);
  const [y2, m2, d2] = toIso.split("-").map(Number);
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return null;
  return Math.round(
    (Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000,
  );
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

// Baris tabel SJ untuk satu shipment tertentu.
function computeSjRows(
  items: LineItem[],
  shipments: Shipment[],
  shipment: Shipment | undefined,
) {
  if (!shipment) return [];
  return items.map((it) => {
    const entry = shipment.itemsById[it.id] ?? {
      qty: 0,
      included: false,
      manuallyEdited: false,
    };
    const availableBefore = computeAvailableBefore(
      shipments,
      it.id,
      shipment.seq,
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
}

// SJ dianggap "ada isinya" kalau minimal satu item dicentang DAN qty > 0.
function shipmentHasItems(shipment: Shipment | undefined) {
  if (!shipment) return false;
  return Object.values(shipment.itemsById).some((e) => e.included && e.qty > 0);
}

// Satu-satunya tempat nomor SJ dibentuk dari nomor invoice.
function buildSuratJalanNumber(invoiceNumber: string, seq?: number) {
  const base = invoiceNumber.replace(/^INV-/, "SJ-");
  return seq === undefined ? base : `${base}-${seq}`;
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

// Tunggu 2 frame supaya DOM area export pasti sudah sinkron dengan state.
const nextFrames = () =>
  new Promise<void>((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
  );

const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ── Paginasi ─────────────────────────────────────────────────────────────
// Isi baris item halaman demi halaman (greedy). Halaman pertama punya
// kapasitas `cap1` (karena ada blok customer/meta), halaman lanjutan `capC`.
// Satu baris tidak pernah terbelah, dan tiap halaman minimal berisi 1 baris.
function layoutRows(h: number[], n: number, cap1: number, capC: number) {
  const pages: { start: number; end: number }[] = [];
  let i = 0;
  while (i < n) {
    const cap = pages.length === 0 ? cap1 : capC;
    const start = i;
    let used = 0;
    while (i < n && (i === start || used + h[i] <= cap)) {
      used += h[i];
      i++;
    }
    pages.push({ start, end: i });
  }
  return pages;
}

// h = tinggi tiap baris item, totalH = tinggi blok subtotal..Total, restH =
// tinggi blok rekening + tanda tangan, addH = tinggi tombol "Tambah baris"
// (hanya di editor, 0 untuk preview/PDF/print).
// Total + rekening + TTD adalah SATU blok yang tidak pernah dipecah.
// Aturan:
// 1. Baris item diisi PENUH halaman demi halaman (greedy).
// 2. Blok akhir muat di sisa halaman terakhir -> selesai.
// 3. Tidak muat -> blok akhir pindah ke halaman baru. Supaya halaman itu
//    tidak berisi tanda tangan saja, MAX_CARRY_ROWS baris terakhir ikut
//    pindah, tapi hanya kalau memang muat bersama blok akhir.
function computePageSlices(
  h: number[],
  cap1: number,
  capC: number,
  totalH: number,
  restH: number,
  addH: number,
): PageSlice[] {
  const n = h.length;
  if (n === 0) return [{ start: 0, end: 0, total: true, rest: true }];
  const sum = (a: number, b: number) => {
    let s = 0;
    for (let i = a; i < b; i++) s += h[i];
    return s;
  };

  const pages = layoutRows(h, n, cap1, capC);
  const last = pages[pages.length - 1];
  const lastCap = pages.length === 1 ? cap1 : capC;
  const used = sum(last.start, last.end) + addH;

  // 2. Semua muat.
  if (used + totalH + restH <= lastCap) {
    return pages.map((p, i) => ({
      ...p,
      total: i === pages.length - 1,
      rest: i === pages.length - 1,
    }));
  }

  // 3. Blok akhir pindah. Bawa baris terakhir hanya jika muat bersama blok
  // akhir; kalau tidak, blok akhir berdiri di halaman sendiri.
  let m = n > 1 ? Math.min(MAX_CARRY_ROWS, n - 1) : 0;
  while (m > 0 && sum(n - m, n) + addH + totalH + restH > capC) m--;
  const pre = layoutRows(h, n - m, cap1, capC).map((p) => ({
    ...p,
    total: false,
    rest: false,
  }));
  return [...pre, { start: n - m, end: n, total: true, rest: true }];
}

// Renggangkan baris di halaman yang BUKAN halaman terakhir supaya ruang
// kosong di dasar halaman terisi (halaman 1 tetap terlihat penuh).
function stretchPages(
  slices: PageSlice[],
  h: number[],
  cap1: number,
  capC: number,
  totalH: number,
): PageSlice[] {
  if (slices.length <= 1) return slices;
  return slices.map((s, i) => {
    if (s.rest) return s; // halaman akhir: biarkan
    const n = s.end - s.start;
    if (n <= 0) return s;
    let used = 0;
    for (let k = s.start; k < s.end; k++) used += h[k];
    const cap = i === 0 ? cap1 : capC;
    const gap = cap - used - (s.total ? totalH : 0) - 4; // 4px pengaman
    const pad = Math.floor(Math.min(Math.max(gap / n, 0), MAX_STRETCH));
    return { ...s, pad };
  });
}

// ── Cap perusahaan (gambar) ──────────────────────────────────────────────
// Gambar cap dimuat sekali. Kalau file-nya masih berlatar putih (bukan PNG
// transparan), latar putihnya dihapus otomatis lewat canvas supaya cap tidak
// menutupi tanda tangan. Hasilnya berupa data URL, jadi aman untuk html2canvas.
let stampSrcCache: string | null | undefined; // undefined = belum selesai dimuat
let stampPromise: Promise<string | null> | null = null;

function loadStamp(): Promise<string | null> {
  if (stampPromise) return stampPromise;
  stampPromise = new Promise<string | null>((resolve) => {
    const finish = (v: string | null) => {
      stampSrcCache = v;
      resolve(v);
    };
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        const ctx = c.getContext("2d");
        if (!ctx) return finish(STAMP_SRC);
        ctx.drawImage(img, 0, 0);
        const data = ctx.getImageData(0, 0, c.width, c.height);
        const px = data.data;
        // Sudah transparan: pakai apa adanya.
        if (px[3] < 250) return finish(STAMP_SRC);

        // Warna tinta = rata-rata piksel merah gelap.
        let r = 0;
        let g = 0;
        let b = 0;
        let n = 0;
        for (let i = 0; i < px.length; i += 4) {
          if (px[i] > 120 && px[i + 1] < 90 && px[i + 2] < 90) {
            r += px[i];
            g += px[i + 1];
            b += px[i + 2];
            n++;
          }
        }
        const ink = n ? [r / n, g / n, b / n] : [184, 24, 18];
        const inkMin = Math.min(ink[0], ink[1], ink[2]);

        for (let i = 0; i < px.length; i += 4) {
          const min = Math.min(px[i], px[i + 1], px[i + 2]);
          let t = (255 - min) / (255 - inkMin);
          t = Math.min(Math.max(t, 0), 1);
          if (t < 0.08) t = 0; // buang noise tipis dari kompresi JPEG
          px[i] = ink[0];
          px[i + 1] = ink[1];
          px[i + 2] = ink[2];
          px[i + 3] = Math.round(t * 255);
        }
        ctx.putImageData(data, 0, 0);
        finish(c.toDataURL("image/png"));
      } catch {
        finish(STAMP_SRC);
      }
    };
    img.onerror = () => finish(null);
    img.src = STAMP_SRC;
  });
  return stampPromise;
}

function StampImage({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  const [src, setSrc] = useState<string | null | undefined>(stampSrcCache);
  useEffect(() => {
    let alive = true;
    loadStamp().then((v) => {
      if (alive) setSrc(v);
    });
    return () => {
      alive = false;
    };
  }, []);
  if (!src) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt="Cap perusahaan" className={className} style={style} />
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

// Watermark di tengah SELURUH kertas (kop menutupinya dengan latar putih),
// jadi posisinya identik di setiap halaman. Ukuran & kemiringan sama dengan
// versi awal.
function Watermark() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0">
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

// Satu baris checkbox bundling di bar aksi / sheet Bagikan.
function BundleCheck({
  checked,
  disabled,
  label,
  note,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  label: string;
  note?: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <div>
      <label
        className={`flex items-center gap-2 text-xs py-2 lg:py-0 ${
          disabled
            ? "text-ink/30 cursor-not-allowed"
            : "text-ink/80 cursor-pointer"
        }`}
      >
        <input
          type="checkbox"
          className="w-5 h-5 lg:w-4 lg:h-4 accent-ink"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
        />
        {label}
      </label>
      {note && <p className="text-[11px] text-ink/40 mt-0.5 pl-7">{note}</p>}
    </div>
  );
}

// Field serba-bisa: editable=true -> input/textarea beneran; editable=false
// -> teks polos (aman buat html2canvas). Kalau non-editable dan kosong,
// gak render apa-apa (kecuali showPlaceholder: mode ketuk-untuk-edit di HP,
// supaya area kosong tetap kelihatan dan bisa diketuk).
function Field({
  editable,
  value,
  onChange,
  placeholder,
  className = "",
  widthClass = "w-full",
  multiline = false,
  type = "text",
  showPlaceholder = false,
}: {
  editable: boolean;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  className?: string;
  widthClass?: string;
  multiline?: boolean;
  type?: string;
  showPlaceholder?: boolean;
}) {
  if (!editable) {
    if (!value) {
      if (showPlaceholder && placeholder) {
        return (
          <span
            className={`${widthClass} ${className} block italic !text-ink/30`}
          >
            {placeholder}
          </span>
        );
      }
      return null;
    }
    return (
      <span className={`${widthClass} ${className} whitespace-pre-line block`}>
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
        rows={1}
        // Tinggi textarea mengikuti isi (seperti teks statis di PDF), bukan
        // tetap 2 baris. Border 1px dikompensasi margin -1px.
        style={
          {
            fieldSizing: "content",
            padding: 0,
            margin: "-1px 0",
            display: "block",
          } as React.CSSProperties
        }
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
      className={`${widthClass} block -mb-px bg-transparent border-b border-transparent hover:border-ink/20 focus:border-ink outline-none transition-colors ${className}`}
    />
  );
}

// ── Dropdown mengambang (nama produk / satuan) ───────────────────────────
// Posisi dihitung terhadap visual viewport: kalau ruang di bawah input
// sempit (misal ketutup keyboard HP), daftar dibuka ke ATAS input.
type DropdownPos = {
  top?: number;
  bottom?: number;
  left: number;
  width: number;
  maxHeight: number;
};

function computeDropdownPos(
  el: HTMLElement,
  minWidth: number,
  desiredMax: number,
): DropdownPos {
  const r = el.getBoundingClientRect();
  const vv = window.visualViewport;
  const viewTop = vv ? vv.offsetTop : 0;
  const viewBottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
  const spaceBelow = viewBottom - r.bottom - 8;
  const spaceAbove = r.top - viewTop - 8;
  const openUp =
    spaceBelow < Math.min(desiredMax, 160) && spaceAbove > spaceBelow;
  const maxHeight = Math.max(
    Math.min(desiredMax, openUp ? spaceAbove : spaceBelow),
    96,
  );
  const width = Math.max(r.width, minWidth);
  const left = Math.min(
    Math.max(r.left, 8),
    Math.max(window.innerWidth - width - 8, 8),
  );
  return openUp
    ? { bottom: window.innerHeight - r.top + 4, left, width, maxHeight }
    : { top: r.bottom + 4, left, width, maxHeight };
}

function useFloatingList(minWidth: number, desiredMax: number) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<DropdownPos>({
    top: 0,
    left: 0,
    width: minWidth,
    maxHeight: desiredMax,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const el = inputRef.current;
      if (!el) return;
      setPos(computeDropdownPos(el, minWidth, desiredMax));
    };
    update();
    const vv = window.visualViewport;
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
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
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open, minWidth, desiredMax]);

  return { open, setOpen, pos, inputRef, dropdownRef };
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
  const { open, setOpen, pos, inputRef, dropdownRef } = useFloatingList(
    220,
    256,
  );

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
            className="no-print fixed z-[999] bg-white border border-line rounded-lg shadow-lg overflow-y-auto"
            style={{
              top: pos.top,
              bottom: pos.bottom,
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxHeight,
            }}
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
                className="w-full text-left px-3 py-2.5 lg:py-2 text-sm hover:bg-sand"
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
  const { open, setOpen, pos, inputRef, dropdownRef } = useFloatingList(
    120,
    224,
  );

  const results = useMemo(() => {
    const q = value.trim().toLowerCase();
    return q
      ? UNIT_SUGGESTIONS.filter((u) => u.toLowerCase().includes(q))
      : UNIT_SUGGESTIONS;
  }, [value]);

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
            className="no-print fixed z-[999] bg-white border border-line rounded-lg shadow-lg overflow-y-auto"
            style={{
              top: pos.top,
              bottom: pos.bottom,
              left: pos.left,
              width: pos.width,
              maxHeight: pos.maxHeight,
            }}
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
                className="w-full text-left px-3 py-2.5 lg:py-2 text-sm hover:bg-sand"
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

// Dialog konfirmasi (hapus SJ, keluar). Tombol setinggi 44px biar aman
// disentuh jari.
function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;
  return (
    <div
      className="no-print fixed inset-0 z-[300] flex items-center justify-center p-4 bg-ink/50"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-base font-semibold text-ink">{title}</p>
        <p className="text-sm text-ink/60 mt-1.5 leading-relaxed">{message}</p>
        <div className="flex gap-2 mt-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 min-h-11 rounded-lg border border-line text-sm font-medium text-ink/70 hover:bg-sand"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 min-h-11 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// Inset bawah akibat keyboard (selisih layout viewport vs visual viewport),
// supaya bottom sheet naik di atas keyboard dan tidak ketutup.
function useViewportInset() {
  const [state, setState] = useState({ inset: 0, height: 0 });
  useEffect(() => {
    const vv = window.visualViewport;
    const update = () => {
      const h = vv ? vv.height : window.innerHeight;
      const top = vv ? vv.offsetTop : 0;
      setState({
        inset: Math.max(window.innerHeight - h - top, 0),
        height: h,
      });
    };
    update();
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);
  return state;
}

function BottomSheetInner({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const { inset, height } = useViewportInset();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="no-print fixed inset-0 z-[250]">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="sheet-up absolute left-0 right-0 bg-white rounded-t-2xl shadow-2xl flex flex-col"
        style={{
          bottom: inset,
          maxHeight: height ? height * 0.88 : "88%",
        }}
      >
        <div className="shrink-0 flex items-center justify-between pl-4 pr-2 border-b border-line">
          <span className="text-sm font-semibold text-ink">{title}</span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-12 px-4 text-sm font-semibold text-ink"
          >
            Selesai
          </button>
        </div>
        <div className="sheet-body flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
}

function BottomSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <BottomSheetInner title={title} onClose={onClose}>
      {children}
    </BottomSheetInner>
  );
}

// ── Dokumen bersama — dipakai TIGA cara: editable (canvas desktop),
// non-editable + onEdit (layar utama HP: ketuk bagian untuk edit lewat
// bottom sheet), dan non-editable biasa (preview + versi export).
//
// Mode `paged` dipakai untuk canvas / preview / PDF / print: dokumen dipecah
// jadi halaman A4 tetap (PAGE_W x PAGE_H). Kop selalu dirender di tiap
// halaman; blok customer/meta hanya di halaman pertama; tabel hanya memuat
// baris [rowStart, rowEnd); blok total (showTotal) dan blok rekening + tanda
// tangan (showRest) bisa berada di halaman berbeda. Tombol "Tambah baris"
// (showAddRow) hanya dirender di halaman terakhir yang punya tabel. ────────
function InvoiceDocument({
  editable,
  onEdit,
  docType,
  company,
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
  poNumber,
  grCode,
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
  showLogo,
  showMateraiBox,
  showSjStamp,
  taxRate,
  taxAmount,
  shippingAddress,
  updateShipTo,
  sjRows,
  updateSjItem,
  paged = false,
  rowStart = 0,
  rowEnd,
  showMeta = true,
  showTotal = true,
  showRest = true,
  showAddRow = true,
  showTable = true,
  density = 0,
  rowExtra = 0,
  pageNo = 1,
  pageCount = 1,
}: any) {
  const isSJ = docType === "suratJalan";
  // Kepadatan: level lebih tinggi = margin/spasi lebih rapat supaya dokumen
  // yang meluber tipis muat di satu halaman.
  const D = DENSITY[density] ?? DENSITY[0];
  const rp = ""; // padding baris lewat CSS variable --rp (lihat <style>)
  const rowVars = {
    "--rp": `${D.row + rowExtra / 2}px`,
  } as React.CSSProperties;
  const hasCompanyContact = Boolean(company.phone || company.email);

  const allRows: any[] = isSJ ? sjRows : items;
  const visibleRows: any[] = paged
    ? allRows.slice(rowStart, rowEnd ?? allRows.length)
    : allRows;

  // Mode ketuk-untuk-edit (HP). Tiap bagian dibungkus area yang bisa diketuk
  // dan diberi outline tipis. Di mode lain props-nya cuma className biasa.
  const tapMode = Boolean(onEdit);
  const tp = (section: string, cls = "") =>
    tapMode
      ? {
          role: "button" as const,
          onClick: () => onEdit(section),
          className: `${cls} cursor-pointer rounded-lg p-1.5 ring-2 ring-ink/10 active:bg-ink/5`,
        }
      : { className: cls };

  return (
    <div
      data-pg="root"
      className={`relative bg-white overflow-hidden w-[780px] export-page ${
        paged ? "flex flex-col" : ""
      }`}
      style={paged ? { height: PAGE_H, padding: D.pad } : { padding: D.pad }}
    >
      {/* Watermark di tengah seluruh halaman; kop (latar putih) menutupinya
          di area atas. Posisinya identik di setiap halaman. */}
      <Watermark />

      {/* Kop dibungkus latar putih penuh (sampai tepi halaman) supaya
          watermark tidak kelihatan di area kop; terpotong di garis merah.
          Dirender di SETIAP halaman. */}
      <div
        data-pg="kop"
        className="relative z-10 bg-white shrink-0"
        style={{
          margin: `-${D.pad}px -${D.pad}px 0`,
          padding: `${D.pad}px ${D.pad}px 0`,
        }}
      >
        {/* ── HEADER: identitas di kiri, judul + nomor di kanan ── */}
        <div className="relative z-10 flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            {showLogo && <Logomark unoptimized markOnly />}
            <div>
              <p className="font-display text-xl text-ink leading-tight whitespace-nowrap">
                Makmur A3&apos;S
              </p>
              <p className="font-data text-[10px] uppercase tracking-[0.2em] text-ink/45 leading-tight mt-0.5">
                Supply &amp; Packaging
              </p>
              {hasCompanyContact && (
                <div className="text-xs text-ink/50 mt-1.5 leading-relaxed">
                  {company.phone && <p>{company.phone}</p>}
                  {company.email && <p>{company.email}</p>}
                </div>
              )}
            </div>
          </div>

          <div {...tp("info", "text-right shrink-0")}>
            <h2 className="font-display text-2xl text-brand whitespace-nowrap tracking-wide">
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
          </div>
        </div>

        {/* Garis pemisah brand */}
        <div className="relative z-10 h-[2px] bg-brand" />
      </div>

      <div className="shrink-0" style={{ height: D.gap }} />

      {/* Body. Di mode biasa minHeight menjamin tinggi cukup walau isi
          dokumen pendek. Di mode paged, body mengisi sisa tinggi halaman. */}
      <div
        data-pg="body"
        className={paged ? "relative flex-1 min-h-0" : "relative"}
        style={paged ? undefined : { minHeight: 360 }}
      >
        {showMeta && (
          /* Billing/shipping di kiri, meta dokumen di kanan */
          <div
            className="relative z-10 flex items-start justify-between gap-6"
            style={{ marginBottom: D.meta }}
          >
            <div {...tp("customer", "flex-1 min-w-0")}>
              <p className="text-xs uppercase tracking-widest text-ink/40 mb-1">
                {isSJ ? "Kirim ke" : "Ditagihkan kepada"}
              </p>
              {isSJ && shippingAddress.sameAsCustomer ? (
                <>
                  <Field
                    editable={false}
                    value={customerName}
                    placeholder="Nama customer"
                    showPlaceholder={tapMode}
                    className="text-sm font-semibold"
                  />
                  <Field
                    editable={false}
                    value={customer.address}
                    placeholder="Alamat"
                    showPlaceholder={tapMode}
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
                    onChange={(v: string) => updateShipTo({ name: v })}
                    placeholder="Nama penerima / gudang / outlet"
                    showPlaceholder={tapMode}
                    className="text-sm font-semibold"
                  />
                  <Field
                    editable={editable}
                    value={shippingAddress.address}
                    onChange={(v: string) => updateShipTo({ address: v })}
                    placeholder="Alamat pengiriman"
                    showPlaceholder={tapMode}
                    multiline
                    className="text-xs text-ink/60 mt-1"
                  />
                  {shippingAddress.phone && (
                    <Field
                      editable={editable}
                      value={shippingAddress.phone}
                      onChange={(v: string) => updateShipTo({ phone: v })}
                      widthClass="w-40"
                      className="text-xs text-ink/60 mt-1"
                    />
                  )}
                </>
              ) : (
                <>
                  <Field
                    editable={editable}
                    value={customerName}
                    onChange={onCustomerNameChange}
                    placeholder="Nama customer"
                    showPlaceholder={tapMode}
                    className="text-sm font-semibold"
                  />
                  <Field
                    editable={editable}
                    value={customer.address}
                    onChange={(v: string) =>
                      setCustomer((c: any) => ({ ...c, address: v }))
                    }
                    placeholder="Alamat"
                    showPlaceholder={tapMode}
                    multiline
                    className="text-xs text-ink/60 mt-1"
                  />
                  {(customer.phone || customer.email) && (
                    <div className="flex gap-3 mt-1">
                      <Field
                        editable={editable}
                        value={customer.phone}
                        onChange={(v: string) =>
                          setCustomer((c: any) => ({ ...c, phone: v }))
                        }
                        placeholder="No. HP"
                        showPlaceholder={tapMode}
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
                        showPlaceholder={tapMode}
                        widthClass="w-44"
                        className="text-xs text-ink/60"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Kolom meta kanan — min-w (bukan w tetap) supaya nomor referensi
            panjang tetap satu baris; kolom alamat di kiri yang mengalah. */}
            <div {...tp("info", "shrink-0 min-w-52 text-xs")}>
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between gap-3">
                  <span className="text-ink/40">
                    {isSJ ? "Tgl. Kirim" : "Tanggal"}
                  </span>
                  <span className="text-ink/80 whitespace-nowrap">
                    {documentDate}
                  </span>
                </div>
                {!isSJ && (
                  <>
                    <div className="flex justify-between gap-3">
                      <span className="text-ink/40">Termin</span>
                      <span className="text-ink/80 whitespace-nowrap">
                        {topLabel}
                      </span>
                    </div>
                    <div className="flex justify-between gap-3">
                      <span className="text-ink/40">Jatuh tempo</span>
                      <span className="text-ink/80 whitespace-nowrap">
                        {dueDate}
                      </span>
                    </div>
                    {poNumber && (
                      <div className="flex justify-between gap-3">
                        <span className="text-ink/40 whitespace-nowrap">
                          No. PO
                        </span>
                        <span className="font-data text-ink/80 text-right whitespace-nowrap">
                          {poNumber}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {isSJ && (
                  <>
                    <div className="flex justify-between gap-3">
                      <span className="text-ink/40 whitespace-nowrap">
                        Ref. Invoice
                      </span>
                      <span className="font-data text-ink/80 text-right whitespace-nowrap">
                        {invoiceNumber}
                      </span>
                    </div>
                    {/* No. PO milik invoice: tampil di SJ hanya kalau diisi. */}
                    {poNumber && (
                      <div className="flex justify-between gap-3">
                        <span className="text-ink/40 whitespace-nowrap">
                          No. PO
                        </span>
                        <span className="font-data text-ink/80 text-right whitespace-nowrap">
                          {poNumber}
                        </span>
                      </div>
                    )}
                    {/* Kode GR milik surat jalan: SELALU tampil. Kalau kosong,
                    diberi garis titik-titik supaya bisa ditulis tangan.
                    borderBottom inline (aman untuk html2canvas). */}
                    <div className="flex justify-between items-end gap-3">
                      <span className="text-ink/40 whitespace-nowrap">
                        Kode GR
                      </span>
                      <span
                        className="font-data text-ink/80 text-right whitespace-nowrap inline-block min-w-[110px] h-4"
                        style={
                          grCode
                            ? undefined
                            : { borderBottom: "1px dotted rgba(0,0,0,0.4)" }
                        }
                      >
                        {grCode}
                      </span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {showTable && (
          <div
            data-pg="table"
            {...tp(isSJ ? "barang" : "item", "relative z-10 overflow-x-auto")}
            style={{
              marginBottom:
                D.tbl - (editable && !isSJ && showAddRow ? ADD_ROW_H : 0),
            }}
          >
            <table className="w-full text-sm min-w-[480px]">
              <thead data-pg="thead">
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
              <tbody style={rowVars}>
                {isSJ
                  ? visibleRows.map((it: any) => (
                      <tr
                        key={it.id}
                        data-pg-row
                        className={`border-b border-line ${!it.included ? "opacity-40" : ""}`}
                      >
                        <td className={`${rp} pr-2`}>{it.name}</td>
                        <td className={`${rp} text-right`}>
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
                              sisa {it.remainingAfterThis} {it.unit} belum
                              dikirim
                            </span>
                          )}
                        </td>
                        <td className={`${rp} text-right`}>{it.unit}</td>
                        {editable && (
                          <td className={`${rp} pl-1 no-print text-right`}>
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
                  : visibleRows.map((it: LineItem) => (
                      <tr
                        key={it.id}
                        data-pg-row
                        className="border-b border-line"
                      >
                        <td className={`${rp} pr-2`}>
                          <ItemNameField
                            editable={editable}
                            value={it.name}
                            onChange={(v: string) =>
                              updateItem(it.id, { name: v })
                            }
                          />
                        </td>
                        <td className={`${rp} text-right`}>
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
                        <td className={`${rp} text-right`}>
                          <UnitField
                            editable={editable}
                            value={it.unit}
                            onChange={(v: string) =>
                              updateItem(it.id, { unit: v })
                            }
                          />
                        </td>
                        <td className={`${rp} text-right`}>
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
                        <td className={`${rp} text-right`}>
                          {currency(it.qty * it.price)}
                        </td>
                        {editable && (
                          <td className={`${rp} pl-1 no-print`}>
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
            {editable && !isSJ && showAddRow && (
              <button
                data-pg="addrow"
                onClick={addItem}
                className="no-print mt-2 flex items-center gap-1.5 text-xs text-ink/50 hover:text-ink"
                style={{ height: ADD_ROW_H - 8, lineHeight: "16px" }}
              >
                <Plus className="w-3.5 h-3.5" /> Tambah baris
              </button>
            )}
          </div>
        )}

        {/* Blok subtotal/total. Diukur terpisah (data-pg="total"). Spasi
            bawah pakai padding (bukan margin) supaya ikut terukur. */}
        {showTotal && !isSJ && (
          <div
            data-pg="total"
            className="relative z-10 flex justify-end"
            style={{ paddingBottom: D.tot }}
          >
            <div {...tp("diskon", "w-64 flex flex-col gap-1.5 text-sm")}>
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

        {/* Blok rekening + tanda tangan (invoice) / tanda tangan (SJ).
            Diukur terpisah (data-pg="rest"); tidak pernah terbelah. */}
        {showRest && (
          <div data-pg="rest" className={`relative z-10 ${isSJ ? "pt-4" : ""}`}>
            {isSJ ? (
              <div className="flex items-end justify-between gap-8 mt-6">
                <div className="flex flex-col items-center gap-1 w-32">
                  <div className="relative w-full h-16">
                    {showSjStamp && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <StampImage
                          style={{
                            width: 124,
                            height: "auto",
                            maxWidth: "none",
                            opacity: 0.88,
                            transform: "rotate(-5deg)",
                          }}
                        />
                      </div>
                    )}
                  </div>
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
              <div className="flex items-end justify-between gap-8">
                <div {...tp("rekening", "text-xs text-ink/60 max-w-[260px]")}>
                  <p className="font-semibold text-ink mb-1">Pembayaran ke:</p>
                  <p>{bank.bankName}</p>
                  <p>{bank.accountNumber}</p>
                  <p>a.n. {bank.accountHolder}</p>
                </div>

                <div {...tp("ttd", "flex items-end gap-3")}>
                  {/* Kotak materai opsional — tempat nempel materai manual. */}
                  {showMateraiBox && (
                    <div className="w-20 h-14 mb-8 border border-dashed border-ink/40 flex flex-col items-center justify-center text-center text-[9px] leading-tight text-ink/40">
                      <span>Tempel</span>
                      <span>Materai</span>
                    </div>
                  )}

                  {/* Blok tanda tangan: tanda tangan di lapisan bawah, cap di lapisan
                atas dan menimpa tanda tangan. Cap bisa dimatikan lewat toggle
                di tab TTD. Nama dan jabatan opsional. */}
                  <div className="flex flex-col items-center gap-1">
                    <p className="text-xs text-ink/60">Hormat kami,</p>
                    <div className="relative w-40 h-[72px]">
                      {signatureUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={signatureUrl}
                          alt="Tanda tangan"
                          className="absolute right-2 bottom-1 z-0 h-16 max-w-[110px] object-contain"
                        />
                      )}
                      {showStamp && (
                        <div className="absolute left-0 bottom-1 z-10">
                          <StampImage
                            style={{
                              width: 132,
                              height: "auto",
                              maxWidth: "none",
                              opacity: 0.88,
                              transform: "rotate(-5deg)",
                            }}
                          />
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
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nomor halaman — hanya kalau dokumen lebih dari satu halaman. Ada di
          area padding bawah halaman. */}
      {paged && pageCount > 1 && (
        <div
          className="absolute left-0 right-0 z-10 text-center text-[10px] text-ink/40 font-data"
          style={{ bottom: 8 }}
        >
          Halaman {pageNo} dari {pageCount}
        </div>
      )}
    </div>
  );
}

// Dokumen berhalaman: mengukur DOM dokumen utuh (di portal tersembunyi),
// menghitung pembagian halaman, lalu merender tiap halaman sebagai kotak A4
// tetap. Dipakai untuk canvas editor, preview, PDF, print, dan share.
function PagedDocument({
  pageClassName = "",
  pageGap = 0,
  onPageCount,
  ...props
}: any) {
  const isSJ = props.docType === "suratJalan";
  const rowCount: number = isSJ ? props.sjRows.length : props.items.length;
  const r0 = useRef<HTMLDivElement>(null);
  const r1 = useRef<HTMLDivElement>(null);
  const r2 = useRef<HTMLDivElement>(null);
  const measureRefs = [r0, r1, r2];
  const sigRef = useRef("");
  const [layout, setLayout] = useState<{
    slices: PageSlice[];
    density: number;
  } | null>(null);
  const slices = layout?.slices ?? null;
  const density = layout?.density ?? 0;

  // Hitung pembagian halaman dari satu salinan dokumen yang diukur.
  const calc = (host: HTMLDivElement | null): PageSlice[] | null => {
    const root = host?.querySelector<HTMLElement>('[data-pg="root"]');
    if (!root) return null;
    const q = (k: string) =>
      root.querySelector<HTMLElement>(`[data-pg="${k}"]`);
    const body = q("body");
    const tableWrap = q("table");
    const thead = q("thead");
    const totalEl = q("total");
    const restEl = q("rest");
    const addEl = q("addrow");
    const table = tableWrap?.querySelector<HTMLElement>("table");
    if (!body || !tableWrap || !thead || !table) return null;

    // offsetHeight / offsetTop dipakai (bukan getBoundingClientRect) supaya
    // tidak terpengaruh transform: scale() di pembungkus preview.
    const bodyTop = body.offsetTop; // kop + spacer
    if (bodyTop === 0) return null; // sedang disembunyikan (misal saat print)

    const padBottom = parseFloat(getComputedStyle(root).paddingBottom) || 0;
    const tblMb = parseFloat(getComputedStyle(tableWrap).marginBottom) || 0;
    // Jarak dari atas body ke atas tabel = tinggi blok customer/meta + margin.
    const metaH = tableWrap.offsetTop;
    const theadH = thead.offsetHeight;
    const rows = Array.from(
      root.querySelectorAll<HTMLElement>("[data-pg-row]"),
    );
    const tops = rows.map((r) => r.offsetTop);
    const h = tops.map(
      (t, i) => (i < tops.length - 1 ? tops[i + 1] : table.offsetHeight) - t,
    );
    // Blok total (invoice saja) dan blok rekening/TTD diukur terpisah.
    const totalH = totalEl ? totalEl.offsetHeight : 0;
    const restH = restEl ? restEl.offsetHeight : 0;
    // Tombol "Tambah baris" (editor saja) + margin atasnya (mt-2 = 8px).
    const addH = addEl ? addEl.offsetHeight + 8 : 0;

    // Area di bawah kop + spacer sampai dasar halaman.
    const usable = PAGE_H - bodyTop - padBottom - PAGE_SAFE;
    const cap1 = Math.max(usable - metaH - theadH - tblMb, 40);
    // Halaman lanjutan tidak punya judul tambahan: tabel langsung di bawah kop.
    const capC = Math.max(usable - theadH - tblMb, 40);

    return stretchPages(
      computePageSlices(h, cap1, capC, totalH, restH, addH),
      h,
      cap1,
      capC,
      totalH,
    );
  };

  const measure = () => {
    const results = measureRefs.map((r) => calc(r.current));
    if (!results[0]) return;
    // Pilih level paling longgar dengan jumlah halaman paling sedikit.
    const counts = results.map((r) => (r ? r.length : Infinity));
    const d = counts.indexOf(Math.min(...counts));
    const chosen = results[d]!;
    const sig = JSON.stringify({ chosen, d });
    if (sig !== sigRef.current) {
      sigRef.current = sig;
      setLayout({ slices: chosen, density: d });
    }
  };
  const measureLatest = useRef(measure);
  measureLatest.current = measure;

  // Ukur ulang setiap render (murah), hanya set state kalau hasilnya berubah.
  useLayoutEffect(() => {
    measureLatest.current();
  });

  // Ukur ulang kalau tinggi dokumen berubah sendiri (logo / font selesai load).
  useEffect(() => {
    const run = () => measureLatest.current();
    const ro = new ResizeObserver(run);
    measureRefs.forEach((r) => r.current && ro.observe(r.current));
    (document as any).fonts?.ready?.then(run);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pages: PageSlice[] = slices ?? [
    { start: 0, end: rowCount, total: true, rest: true },
  ];

  useEffect(() => {
    onPageCount?.(pages.length);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages.length]);

  return (
    <>
      {typeof document !== "undefined" &&
        [0, 1, 2].map((d) =>
          createPortal(
            <div
              ref={measureRefs[d]}
              data-measure
              aria-hidden
              style={{
                position: "fixed",
                top: 0,
                left: -10000,
                width: PAGE_W,
                visibility: "hidden",
                pointerEvents: "none",
                zIndex: -1,
              }}
            >
              <InvoiceDocument
                {...props}
                editable={false}
                onEdit={undefined}
                density={d}
              />
            </div>,
            document.body,
            `measure-${d}`,
          ),
        )}
      <div>
        {pages.map((s, i) => (
          <div
            key={i}
            data-export-page
            data-page-index={i}
            className={pageClassName}
            style={i < pages.length - 1 ? { marginBottom: pageGap } : undefined}
          >
            <InvoiceDocument
              {...props}
              paged
              density={density}
              rowExtra={s.pad ?? 0}
              pageNo={i + 1}
              pageCount={pages.length}
              showMeta={i === 0}
              showTotal={s.total}
              showRest={s.rest}
              showTable={s.end > s.start || s.start === 0}
              showAddRow={s.end === rowCount}
              rowStart={s.start}
              rowEnd={s.end}
            />
          </div>
        ))}
      </div>
    </>
  );
}

// Ukuran layout asli sebuah elemen. transform: scale() gak ngubah ukuran layout,
// jadi dokumen 780px yang di-scale kecil tetep bikin area scroll selebar 780px
// dan sisi kirinya kepotong di layar sempit. Ukuran ini dipakai buat bikin
// pembungkus yang ukurannya ikut skala. `active` = elemennya sedang dirender.
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
  const mobileWrapRef = useRef<HTMLDivElement>(null);
  const mobilePageRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<"pdf" | "share" | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  // Jumlah halaman hasil paginasi per dokumen export (key = ExportDoc.key).
  const [pageCounts, setPageCounts] = useState<Record<string, number>>({});

  // Portal area export tidak boleh dirender saat SSR.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Layout desktop (>= lg) vs HP/tablet. Yang tidak dipakai tidak dirender
  // sama sekali, jadi form tidak pernah ada dua kali di DOM.
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  const showDesktop = mounted && isDesktop;
  const showMobile = mounted && !isDesktop;

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
    } else {
      base.push({ id: "barang", label: "Barang", icon: Package });
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

  // Bottom sheet (HP): edit bagian dokumen, Bagikan, dan Pengaturan.
  const [sheetOpen, setSheetOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const openSheet = (tab: string) => {
    setActiveSidebarTab(tab);
    setSheetOpen(true);
  };

  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const shareBtnRef = useRef<HTMLDivElement>(null);

  const [shareNotice, setShareNotice] = useState<{
    channel: "wa" | "email";
    count: number;
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
  const [mobileZoom, setMobileZoom] = useState(0.5);
  const canvasSize = useElementSize(pageRef, showDesktop);
  const previewSize = useElementSize(previewPageRef, showFullPreview);
  const mobileSize = useElementSize(mobilePageRef, showMobile);

  const [company, setCompany] = useState(COMPANY_DEFAULT);
  const [customerName, setCustomerName] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState(autoInvoiceNumber(""));
  const [invoiceNumberTouched, setInvoiceNumberTouched] = useState(false);
  const [invoiceDate, setInvoiceDate] = useState(todayISO());
  const [poNumber, setPoNumber] = useState("");
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
  // Logo bisa dimatikan — kalau off, diganti nama perusahaan (teks).
  const [showLogo, setShowLogo] = useState(true);
  // Kotak kosong buat nempel materai manual — default mati.
  const [showMateraiBox, setShowMateraiBox] = useState(false);
  // Cap perusahaan di kolom "Pengirim" surat jalan — default mati (SJ
  // biasanya ditandatangani/dicap basah saat serah terima).
  const [showSjStamp, setShowSjStamp] = useState(false);

  // Bundling invoice + surat jalan. Default mati, dan di-reset tiap pindah
  // tab Invoice <-> Surat Jalan supaya artinya selalu jelas:
  // - Tab Invoice: bundleOn = ikutkan SEMUA surat jalan yang ada barangnya.
  // - Tab Surat Jalan: bundleOn = ikutkan Invoice (SJ-nya = SJ aktif).
  //   Mau kirim satu SJ saja? Pilih SJ-nya di tab Surat Jalan.
  const [bundleOn, setBundleOn] = useState(false);
  // Kalau true dan ada >1 dokumen, PDF/share digabung jadi 1 file.
  // Default false (file terpisah) karena invoice & SJ biasanya dipakai
  // orang berbeda (finance vs gudang).
  const [mergePdf, setMergePdf] = useState(false);

  const resetBundle = () => {
    setBundleOn(false);
    setMergePdf(false);
  };

  const initialShipmentId = useRef(uid()).current;
  const [shipments, setShipments] = useState<Shipment[]>(() =>
    recalcShipments(
      [
        {
          id: initialShipmentId,
          seq: 1,
          date: todayISO(),
          grCode: "",
          shipTo: { ...DEFAULT_SHIP_TO },
          itemsById: {},
        },
      ],
      items,
    ),
  );
  const [activeShipmentId, setActiveShipmentId] =
    useState<string>(initialShipmentId);

  const activeShipment = useMemo(
    () => shipments.find((s) => s.id === activeShipmentId) ?? shipments[0],
    [shipments, activeShipmentId],
  );

  // Alamat tujuan milik SJ yang sedang aktif + updater-nya.
  const activeShipTo = activeShipment?.shipTo ?? DEFAULT_SHIP_TO;
  const updateShipTo = (patch: Partial<ShipTo>) =>
    setShipments((prev) =>
      prev.map((s) =>
        s.id === activeShipment?.id
          ? { ...s, shipTo: { ...s.shipTo, ...patch } }
          : s,
      ),
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
    const latestShipment = shipments.length
      ? [...shipments].sort((a, b) => b.seq - a.seq)[0]
      : undefined;
    const newShipment: Shipment = {
      id: newId,
      seq: nextSeq,
      date: todayISO(),
      grCode: "",
      // Alamat SJ baru = salinan alamat SJ terakhir (bisa diubah bebas).
      shipTo: latestShipment
        ? { ...latestShipment.shipTo }
        : { ...DEFAULT_SHIP_TO },
      itemsById: {},
    };
    setShipments((prev) => recalcShipments([...prev, newShipment], items));
    setActiveShipmentId(newId);
  };

  const removeShipment = (id: string) => {
    setShipments((prev) => {
      if (prev.length <= 1) return prev;
      const filtered = prev.filter((s) => s.id !== id);
      // Nomor SJ dirapatkan lagi supaya tidak bolong: hapus SJ #3 dari
      // 1,2,3,4 -> sisanya jadi 1,2,3 (SJ #4 lama menjadi #3). Urutan seq
      // lama dipertahankan, jadi alokasi FIFO qty tetap sama.
      const seqById = new Map(
        [...filtered]
          .sort((a, b) => a.seq - b.seq)
          .map((s, i) => [s.id, i + 1] as const),
      );
      const renumbered = filtered.map((s) => ({
        ...s,
        seq: seqById.get(s.id)!,
      }));
      const next = recalcShipments(renumbered, items);
      if (activeShipmentId === id) setActiveShipmentId(next[0].id);
      return next;
    });
  };

  const updateShipmentDate = (date: string) => {
    setShipments((prev) =>
      prev.map((s) => (s.id === activeShipmentId ? { ...s, date } : s)),
    );
  };

  const updateShipmentGrCode = (grCode: string) => {
    setShipments((prev) =>
      prev.map((s) => (s.id === activeShipmentId ? { ...s, grCode } : s)),
    );
  };

  const subtotal = items.reduce((sum, it) => sum + it.qty * it.price, 0);
  // Diskon dibulatkan ke rupiah utuh & gak boleh lebih dari subtotal, biar
  // angka yang tampil di invoice selalu cocok kalau dijumlah.
  const rawDiscount =
    discountType === "percent"
      ? (subtotal * discountValue) / 100
      : discountValue;
  const discountAmount = Math.min(
    Math.round(Math.max(rawDiscount, 0)),
    subtotal,
  );
  // PPN dihitung dari subtotal setelah diskon; ongkir tidak dikenai PPN.
  const taxableBase = Math.max(subtotal - discountAmount, 0);
  const taxAmount = taxEnabled ? Math.round((taxableBase * taxRate) / 100) : 0;
  const grandTotal = taxableBase + taxAmount + shippingCost;
  const needsMaterai = grandTotal >= MATERAI_THRESHOLD;
  const showMateraiNotice = docType === "invoice" && needsMaterai;
  const showPpnNotice = docType === "invoice" && taxEnabled && taxAmount > 0;

  const suratJalanNumber = buildSuratJalanNumber(
    invoiceNumber,
    activeShipment?.seq,
  );
  const documentDate =
    docType === "suratJalan"
      ? (activeShipment?.date ?? invoiceDate)
      : invoiceDate;

  const topLabel =
    topDays === null
      ? // Custom: yang tampil di dokumen cukup jumlah harinya, tanpa kata
        // "Custom". Kalau angkanya belum diisi, tampil strip.
        customTopDays !== "" && !isNaN(customTopDays)
        ? `${customTopDays} Hari`
        : "-"
      : (TOP_OPTIONS.find((t) => t.days === topDays)?.label ??
        `${topDays} Hari`);

  // Auto-fit canvas desktop. Canvas sekarang berisi halaman A4 bertumpuk,
  // jadi "fit" memakai tinggi SATU halaman (PAGE_H), bukan seluruh tumpukan.
  useEffect(() => {
    if (!showDesktop || !autoFit) return;
    const recompute = () => {
      const wrap = canvasWrapRef.current;
      const page = pageRef.current;
      if (!wrap || !page) return;
      const availW = wrap.clientWidth - 48;
      const availH = wrap.clientHeight - 48;
      const scale = Math.min(availW / page.scrollWidth, availH / PAGE_H, 1);
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
  }, [showDesktop, autoFit, docType, panelCollapsed]);

  // Layar utama HP: dokumen selalu pas selebar layar.
  useEffect(() => {
    if (!showMobile) return;
    const recompute = () => {
      const wrap = mobileWrapRef.current;
      if (!wrap) return;
      setMobileZoom(Math.min((wrap.clientWidth - 24) / 780, 1));
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    if (mobileWrapRef.current) ro.observe(mobileWrapRef.current);
    window.addEventListener("resize", recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", recompute);
    };
  }, [showMobile]);

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
      // Preview bisa berisi beberapa halaman bertumpuk, jadi tinggi yang
      // dipakai untuk "fit" adalah SATU halaman (PAGE_H), bukan seluruh tumpukan.
      // Di HP/tablet portrait: fit ke lebar saja biar teks gak terlalu kecil.
      const scale = narrow
        ? Math.min(availW / page.scrollWidth, 1.4)
        : Math.min(availW / page.scrollWidth, availH / PAGE_H, 1.4);
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

  // Tombol Esc menutup preview.
  useEffect(() => {
    if (!showFullPreview) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowFullPreview(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showFullPreview]);

  // ── Preview: pinch-zoom 2 jari + double-tap (HP) ────────────────────
  // Zoom mengikuti titik tengah jari (anchorRef dipakai useLayoutEffect di
  // bawah untuk menggeser scroll). Double-tap: pindah antara "Fit" dan 100%.
  const previewZoomRef = useRef(1);
  previewZoomRef.current = previewZoom;
  const previewAutoFitRef = useRef(true);
  previewAutoFitRef.current = previewAutoFit;
  const pinchRef = useRef<{
    dist: number;
    zoom: number;
    docX: number;
    docY: number;
    cx: number;
    cy: number;
  } | null>(null);
  const anchorRef = useRef<{
    docX: number;
    docY: number;
    cx: number;
    cy: number;
  } | null>(null);
  const lastTapRef = useRef<{ t: number; x: number; y: number } | null>(null);
  const tapStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!showFullPreview) return;
    const wrap = previewWrapRef.current;
    if (!wrap) return;
    const dist = (t: TouchList) =>
      Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const page = previewPageRef.current;
        if (!page) return;
        const rect = page.getBoundingClientRect();
        const cx = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const cy = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const z = previewZoomRef.current;
        pinchRef.current = {
          dist: dist(e.touches),
          zoom: z,
          docX: (cx - rect.left) / z,
          docY: (cy - rect.top) / z,
          cx,
          cy,
        };
        tapStartRef.current = null;
      } else if (e.touches.length === 1) {
        tapStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    const onMove = (e: TouchEvent) => {
      const p = pinchRef.current;
      if (p && e.touches.length === 2) {
        const next = Math.min(
          Math.max((p.zoom * dist(e.touches)) / p.dist, 0.3),
          3,
        );
        anchorRef.current = {
          docX: p.docX,
          docY: p.docY,
          cx: p.cx,
          cy: p.cy,
        };
        setPreviewAutoFit(false);
        setPreviewZoom(next);
      } else if (tapStartRef.current && e.touches.length === 1) {
        const t = e.touches[0];
        if (
          Math.hypot(
            t.clientX - tapStartRef.current.x,
            t.clientY - tapStartRef.current.y,
          ) > 10
        ) {
          tapStartRef.current = null;
        }
      }
    };

    const onEnd = (e: TouchEvent) => {
      if (pinchRef.current) {
        if (e.touches.length < 2) {
          pinchRef.current = null;
          anchorRef.current = null;
        }
        return;
      }
      const s = tapStartRef.current;
      tapStartRef.current = null;
      if (!s || e.touches.length > 0) return;
      const now = Date.now();
      const last = lastTapRef.current;
      if (
        last &&
        now - last.t < 300 &&
        Math.hypot(s.x - last.x, s.y - last.y) < 30
      ) {
        lastTapRef.current = null;
        if (previewAutoFitRef.current) {
          setPreviewAutoFit(false);
          setPreviewZoom(1);
        } else {
          setPreviewAutoFit(true);
        }
      } else {
        lastTapRef.current = { t: now, x: s.x, y: s.y };
      }
    };

    wrap.addEventListener("touchstart", onStart, { passive: true });
    wrap.addEventListener("touchmove", onMove, { passive: true });
    wrap.addEventListener("touchend", onEnd, { passive: true });
    wrap.addEventListener("touchcancel", onEnd, { passive: true });
    return () => {
      wrap.removeEventListener("touchstart", onStart);
      wrap.removeEventListener("touchmove", onMove);
      wrap.removeEventListener("touchend", onEnd);
      wrap.removeEventListener("touchcancel", onEnd);
    };
  }, [showFullPreview]);

  useLayoutEffect(() => {
    const a = anchorRef.current;
    const wrap = previewWrapRef.current;
    const page = previewPageRef.current;
    if (!a || !wrap || !page) return;
    const rect = page.getBoundingClientRect();
    wrap.scrollLeft += rect.left - (a.cx - a.docX * previewZoom);
    wrap.scrollTop += rect.top - (a.cy - a.docY * previewZoom);
  }, [previewZoom]);

  // Buka preview. Di HP mulai dari zoom yang terbaca (bukan fit-lebar yang
  // bikin teks mini); di desktop/tablet tetap fit ke layar.
  const openPreview = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setPreviewAutoFit(false);
      setPreviewZoom(READABLE_ZOOM);
    } else {
      setPreviewAutoFit(true);
    }
    setShowFullPreview(true);
  };

  const handleCustomerNameChange = (name: string) => {
    setCustomerName(name);
    if (!invoiceNumberTouched) setInvoiceNumber(autoInvoiceNumber(name));
  };

  const handleTopChange = (days: number | null) => {
    setTopDays(days);
    if (days !== null) setDueDate(addDaysISO(invoiceDate, days));
  };

  // Hari custom tidak boleh negatif / pecahan.
  const handleCustomTopDaysChange = (v: string) => {
    const n = v === "" ? "" : Math.max(0, Math.floor(Number(v)));
    setCustomTopDays(n);
    if (n !== "" && !isNaN(n)) setDueDate(addDaysISO(invoiceDate, n));
  };

  const handleInvoiceDateChange = (date: string) => {
    setInvoiceDate(date);
    if (topDays !== null) setDueDate(addDaysISO(date, topDays));
    else if (customTopDays !== "" && !isNaN(customTopDays))
      setDueDate(addDaysISO(date, customTopDays));
  };

  // Jatuh tempo diubah manual -> hitung selisih hari dari tanggal invoice.
  // Kalau cocok dengan preset TOP, pilih preset itu; kalau tidak, pindah ke
  // Custom dengan jumlah hari terisi. Jadi label Termin selalu cocok dengan
  // tanggal jatuh tempo.
  const handleDueDateChange = (date: string) => {
    if (!date) return;
    const diff = diffDaysISO(invoiceDate, date);
    if (diff === null || diff < 0) return;
    setDueDate(date);
    const preset = TOP_OPTIONS.find((t) => t.days === diff);
    if (preset) {
      setTopDays(diff);
    } else {
      setTopDays(null);
      setCustomTopDays(diff);
    }
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
  // Hapus baris. Kalau ini baris terakhir, jangan dibiarkan kosong atau
  // diabaikan: reset jadi satu baris kosong (sama seperti kondisi awal).
  const removeItem = (id: string) =>
    setItems((prev) =>
      prev.length > 1
        ? prev.filter((it) => it.id !== id)
        : [{ id: uid(), name: "", unit: "pcs", qty: 1, price: 0 }],
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

  // Aksi yang menunggu konfirmasi (hapus SJ / keluar).
  const handleConfirm = () => {
    const c = confirm;
    setConfirm(null);
    if (!c) return;
    if (c.kind === "logout") handleLogout();
    else removeShipment(c.id);
  };
  const confirmShipment =
    confirm?.kind === "shipment"
      ? shipments.find((s) => s.id === confirm.id)
      : undefined;

  // ── Template pesan share — disusun dari blok sesuai dokumen yang ikut
  // terkirim (exportDocs). Salam ngikutin jam perangkat saat pesan dibuat.
  // Sapaan sengaja "Bapak/Ibu" saja (tanpa nama perusahaan). ─────────────
  const buildSjBlock = (s: Shipment) => {
    const lines = [
      `Surat jalan ${buildSuratJalanNumber(invoiceNumber, s.seq)}`,
      `Tanggal kirim: ${formatDateID(s.date)}`,
    ];
    if (s.grCode.trim()) lines.push(`Kode GR: ${s.grCode.trim()}`);
    if (!s.shipTo.sameAsCustomer) {
      const dest = [s.shipTo.name, s.shipTo.address]
        .map((v) => v.trim().replace(/\s*\n\s*/g, ", "))
        .filter(Boolean)
        .join(", ");
      if (dest) lines.push(`Dikirim ke: ${dest}`);
    }
    return lines.join("\n");
  };

  const shareCaption = () => {
    const head = `${greeting()}, Bapak/Ibu.`;
    const hasInvoice = exportDocs.some((d) => d.kind === "invoice");
    const sjList = exportDocs
      .filter((d) => d.kind === "suratJalan" && d.shipment)
      .map((d) => d.shipment as Shipment);

    const invoiceBlock = [
      `Tanggal invoice: ${formatDateID(invoiceDate)}`,
      ...(poNumber.trim() ? [`No. PO: ${poNumber.trim()}`] : []),
      `Total tagihan: ${currency(grandTotal)}`,
      `Termin: ${topLabel}`,
      `Jatuh tempo: ${formatDateID(dueDate)}`,
    ].join("\n");

    const bankBlock = `Pembayaran dapat ditransfer ke:\n${bank.bankName} ${bank.accountNumber}\na.n. ${bank.accountHolder}`;

    // Invoice saja (perilaku lama).
    if (hasInvoice && sjList.length === 0) {
      return [
        head,
        `Berikut kami kirimkan invoice ${invoiceNumber} dari Makmur A3'S.`,
        invoiceBlock,
        bankBlock,
        "Invoice terlampir dalam PDF. Mohon dicek, Pak/Bu, terima kasih.",
      ].join("\n\n");
    }

    // Surat jalan saja (perilaku lama).
    if (!hasInvoice) {
      const s = sjList[0] ?? activeShipment;
      const sjNo = buildSuratJalanNumber(invoiceNumber, s?.seq);
      const grLine = s?.grCode.trim() ? `Kode GR: ${s.grCode.trim()}` : "";
      return [
        head,
        `Berikut kami kirimkan surat jalan ${sjNo} (ref. invoice ${invoiceNumber}) untuk pengiriman tanggal ${formatDateID(s?.date ?? documentDate)}.`,
        ...(grLine ? [grLine] : []),
        "Surat jalan terlampir dalam PDF. Mohon dicek saat barang diterima, Pak/Bu, terima kasih.",
      ].join("\n\n");
    }

    // Gabungan: invoice + satu atau lebih surat jalan.
    const sjNumbers = sjList.map((s) =>
      buildSuratJalanNumber(invoiceNumber, s.seq),
    );
    const attachLine =
      fileCount > 1
        ? `Seluruh dokumen terlampir dalam ${fileCount} file PDF.`
        : "Seluruh dokumen terlampir dalam 1 file PDF.";
    return [
      head,
      `Berikut kami kirimkan invoice ${invoiceNumber} beserta surat jalan ${sjNumbers.join(", ")} dari Makmur A3'S.`,
      invoiceBlock,
      ...sjList.map(buildSjBlock),
      bankBlock,
      `${attachLine} Mohon dicek, Pak/Bu, terima kasih.`,
    ].join("\n\n");
  };

  // Nomor tujuan WhatsApp: kalau bundling nyala -> HP customer. Kalau mati,
  // perilaku lama: surat jalan ke alamat lain -> HP penerima, selain itu HP
  // customer.
  const shareTargetPhone = () =>
    exportDocs.length <= 1 &&
    docType === "suratJalan" &&
    !activeShipTo.sameAsCustomer
      ? activeShipTo.phone
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

  const emailSubjectText = () => {
    const hasInvoice = exportDocs.some((d) => d.kind === "invoice");
    const hasSj = exportDocs.some((d) => d.kind === "suratJalan");
    if (hasInvoice && hasSj)
      return `Invoice ${invoiceNumber} + Surat Jalan — Makmur A3'S`;
    return docType === "invoice"
      ? `Invoice ${invoiceNumber} — Makmur A3'S`
      : `Surat Jalan ${suratJalanNumber} — Makmur A3'S`;
  };

  // Print: area export dirender lewat portal langsung di <body>, dan CSS
  // print menyembunyikan semua anak body lain. Tiap halaman hasil paginasi
  // ([data-export-page]) dipisah dengan page break, jadi 1 dokumen maupun
  // bundling sama-sama satu print job.
  const handlePrint = () => window.print();

  // Tambahkan SATU halaman (kotak A4 hasil paginasi) ke PDF. Karena halaman
  // sudah dipotong rapi oleh paginasi, tidak ada lagi pemotongan gambar di
  // tengah baris / tanda tangan seperti sebelumnya.
  const addPageToPdf = async (
    pdf: import("jspdf").jsPDF,
    el: HTMLElement,
    isFirst: boolean,
  ) => {
    const html2canvas = (await import("html2canvas")).default;
    await waitForImages(el);
    const canvas = await html2canvas(el, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
    });
    const imgData = canvas.toDataURL("image/png");
    const pageWidth = 210;
    const pageHeight = 297;
    let w = pageWidth;
    let imgHeight = (canvas.height * w) / canvas.width;
    if (imgHeight > pageHeight) {
      imgHeight = pageHeight;
      w = (canvas.width * imgHeight) / canvas.height;
    }
    if (!isFirst) pdf.addPage();
    pdf.addImage(imgData, "PNG", (pageWidth - w) / 2, 0, w, imgHeight);
  };

  const pagesOf = (el: HTMLElement) =>
    Array.from(el.querySelectorAll<HTMLElement>("[data-export-page]"));

  // Semua dokumen di exportDocs -> daftar PDF. Kalau mergeActive: satu PDF
  // gabungan. Kalau tidak: satu PDF per dokumen. Tiap dokumen bisa terdiri
  // dari beberapa halaman. Diproses berurutan supaya memori html2canvas
  // tidak numpuk.
  const buildPdfDocuments = async (): Promise<BuiltPdf[]> => {
    const root = exportRef.current;
    if (!root) return [];
    // Pastikan cap sudah diproses dan font sudah siap sebelum ditangkap.
    await loadStamp();
    await nextFrames();
    try {
      await (document as any).fonts?.ready;
    } catch {
      // abaikan
    }
    await nextFrames();
    const { jsPDF } = await import("jspdf");

    const targets = exportDocs
      .map((d) => ({
        d,
        el: root.querySelector<HTMLElement>(`[data-export-key="${d.key}"]`),
      }))
      .filter((t): t is { d: ExportDoc; el: HTMLElement } => !!t.el);

    if (targets.length === 0) return [];

    if (mergeActive) {
      const pdf = new jsPDF("p", "mm", "a4");
      let first = true;
      for (const t of targets) {
        for (const page of pagesOf(t.el)) {
          await addPageToPdf(pdf, page, first);
          first = false;
        }
      }
      return [{ fileName: `${invoiceNumber}-SJ.pdf`, pdf }];
    }

    const built: BuiltPdf[] = [];
    for (const { d, el } of targets) {
      const pdf = new jsPDF("p", "mm", "a4");
      let first = true;
      for (const page of pagesOf(el)) {
        await addPageToPdf(pdf, page, first);
        first = false;
      }
      built.push({ fileName: d.fileName, pdf });
    }
    return built;
  };

  const getPdfFiles = async (): Promise<File[]> => {
    const built = await buildPdfDocuments();
    return built.map(
      ({ fileName, pdf }) =>
        new File([pdf.output("blob") as Blob], fileName, {
          type: "application/pdf",
        }),
    );
  };

  const downloadFile = (file: File) => {
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    // Jangan di-revoke langsung — di sebagian browser mobile download
    // bisa gagal kalau URL-nya keburu dicabut.
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const handleDownloadPdf = async () => {
    setBusy("pdf");
    try {
      const built = await buildPdfDocuments();
      for (let i = 0; i < built.length; i++) {
        built[i].pdf.save(built[i].fileName);
        // Jeda antar download supaya browser tidak menelan file berikutnya.
        if (i < built.length - 1) await wait(400);
      }
    } finally {
      setBusy(null);
    }
  };

  // Share: Web Share API (HP) kirim semua PDF + teks. Template juga disalin
  // ke clipboard dulu, karena WhatsApp sering membuang teks saat ada file.
  // Kalau Web Share gak didukung (desktop), buka dropdown WhatsApp/Email.
  const handleShareClick = async () => {
    setBusy("share");
    setShareNotice(null);
    copyCaption(); // sebelum await, supaya masih dianggap klik user
    try {
      const files = await getPdfFiles();
      const caption = shareCaption();
      if (
        files.length > 0 &&
        typeof navigator !== "undefined" &&
        (navigator as any).canShare?.({ files })
      ) {
        try {
          await (navigator as any).share({
            files,
            text: caption,
            title: files.length === 1 ? files[0].name : invoiceNumber,
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
      const files = await getPdfFiles();
      for (let i = 0; i < files.length; i++) {
        downloadFile(files[i]);
        if (i < files.length - 1) await wait(400);
      }
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
      setShareNotice({ channel, count: files.length });
    } finally {
      setBusy(null);
    }
  };

  const getShareNoticeText = () => {
    if (!shareNotice) return null;
    const target = shareNotice.channel === "wa" ? "WhatsApp" : "aplikasi email";
    const multi = shareNotice.count > 1;
    const pdfs = multi ? `${shareNotice.count} PDF` : "PDF";
    const attach = multi ? "semua PDF-nya" : "PDF-nya";
    return isMobile
      ? `${pdfs} sudah otomatis kedownload, dan ${target} sudah kebuka dengan teks siap kirim. Lampirkan ${attach} dari folder Download. Teks pesan juga sudah disalin, tinggal paste kalau belum muncul.`
      : `${pdfs} sudah otomatis kedownload ke komputer, dan ${target} kebuka di tab/aplikasi baru dengan teks siap kirim. Lampirkan ${multi ? "semua PDF yang" : "PDF yang"} barusan kedownload. Teks pesan juga sudah disalin ke clipboard.`;
  };

  // Props dokumen untuk satu jenis dokumen + satu shipment. Default shipment =
  // SJ aktif, jadi canvas dan preview tidak berubah. Area export memanggilnya
  // lagi untuk SJ lain (bundling).
  const buildDocProps = (
    type: DocType,
    shipment: Shipment | undefined = activeShipment,
  ) => {
    const isSJ = type === "suratJalan";
    return {
      docType: type,
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
      suratJalanNumber: buildSuratJalanNumber(invoiceNumber, shipment?.seq),
      documentDate: formatDateID(
        isSJ ? (shipment?.date ?? invoiceDate) : invoiceDate,
      ),
      dueDate: formatDateID(dueDate),
      topLabel,
      poNumber: poNumber.trim(),
      grCode: (shipment?.grCode ?? "").trim(),
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
      showLogo,
      showMateraiBox,
      showSjStamp,
      taxRate,
      taxAmount,
      shippingAddress: shipment?.shipTo ?? DEFAULT_SHIP_TO,
      updateShipTo,
      sjRows: isSJ ? computeSjRows(items, shipments, shipment) : [],
      updateSjItem: updateShipmentItem,
    };
  };

  const docProps = buildDocProps(docType);

  // Dokumen yang akan di-export (PDF/print/share). Urutannya selalu: invoice
  // dulu, baru surat jalan. Bundling mati -> hanya dokumen tab aktif, sama
  // persis dengan perilaku lama.
  const makeInvoiceDoc = (): ExportDoc => ({
    key: "invoice",
    kind: "invoice",
    fileName: `${invoiceNumber}.pdf`,
    props: buildDocProps("invoice"),
  });

  const makeSjDoc = (s: Shipment): ExportDoc => ({
    key: `sj-${s.id}`,
    kind: "suratJalan",
    fileName: `${buildSuratJalanNumber(invoiceNumber, s.seq)}.pdf`,
    shipment: s,
    props: buildDocProps("suratJalan", s),
  });

  const exportDocs: ExportDoc[] = (() => {
    if (!bundleOn) {
      if (docType === "invoice") return [makeInvoiceDoc()];
      return activeShipment ? [makeSjDoc(activeShipment)] : [];
    }
    if (docType === "invoice") {
      const picked = [...shipments]
        .filter(shipmentHasItems)
        .sort((a, b) => a.seq - b.seq);
      return [makeInvoiceDoc(), ...picked.map(makeSjDoc)];
    }
    // Tab Surat Jalan + "Sertakan Invoice". Kalau SJ-nya kosong, balik ke
    // perilaku lama (SJ saja) supaya tidak tiba-tiba mengekspor invoice.
    if (activeShipment && shipmentHasItems(activeShipment)) {
      return [makeInvoiceDoc(), makeSjDoc(activeShipment)];
    }
    return activeShipment ? [makeSjDoc(activeShipment)] : [];
  })();

  // Jumlah dokumen vs jumlah file hasil export (1 kalau digabung). Satu
  // dokumen bisa lebih dari 1 halaman, jadi total halaman dihitung terpisah
  // dari hasil paginasi (default 1 sebelum selesai diukur).
  const docCount = exportDocs.length;
  const mergeActive = mergePdf && docCount > 1;
  const fileCount = mergeActive ? 1 : docCount;
  const totalPages = exportDocs.reduce(
    (sum, d) => sum + (pageCounts[d.key] ?? 1),
    0,
  );

  // Label tombol dinamis — polos kalau cuma 1 file dan 1 halaman.
  // Digabung -> 1 file berisi N halaman ("pages"); tidak digabung -> N file.
  const countSuffix = mergeActive
    ? ` (${totalPages} pages)`
    : fileCount > 1
      ? ` (${fileCount} files)`
      : totalPages > 1
        ? ` (${totalPages} pages)`
        : "";
  const shareLabel = `Share${countSuffix}`;
  const pdfLabel = `PDF${countSuffix}`;
  const printLabel = totalPages > 1 ? `Print (${totalPages} pages)` : "Print";

  // Daftar alamat dari SJ lain yang bisa disalin (tanpa duplikat). Muncul
  // sebagai dropdown "Salin dari SJ lain" di tab Kirim Ke.
  const shipToSources = (() => {
    const seen = new Set<string>();
    const out: { key: string; label: string; shipTo: ShipTo }[] = [];
    [...shipments]
      .sort((a, b) => a.seq - b.seq)
      .forEach((sh) => {
        if (sh.id === activeShipment?.id) return;
        const t = sh.shipTo;
        if (t.sameAsCustomer) return;
        const name = t.name.trim();
        const addr = t.address.trim();
        if (!name && !addr) return;
        const k = `${name.toLowerCase()}|${addr.toLowerCase()}`;
        if (seen.has(k)) return;
        seen.add(k);
        out.push({
          key: sh.id,
          label: `SJ #${sh.seq} — ${name || addr.split("\n")[0]}`,
          shipTo: t,
        });
      });
    return out;
  })();

  // Pemilih SJ (pilih / hapus / tambah). Dipakai di tab "Kirim Ke", "Surat
  // Jalan", dan "Barang". Tombol hapus terpisah dari tombol pilih (target
  // sentuh sendiri) dan selalu minta konfirmasi.
  const shipmentChips = (
    <div className="flex items-center gap-1.5 flex-wrap mt-1">
      {shipments.map((s) => {
        const active = s.id === activeShipment?.id;
        return (
          <div
            key={s.id}
            className={`flex items-center rounded-full border transition-colors ${
              active
                ? "bg-ink text-white border-ink"
                : "border-line text-ink/60 hover:border-ink"
            }`}
          >
            <button
              type="button"
              onClick={() => setActiveShipmentId(s.id)}
              className={`min-h-10 lg:min-h-0 lg:py-1 pl-3.5 text-xs font-medium ${
                shipments.length > 1 ? "pr-1.5" : "pr-3.5"
              }`}
            >
              SJ #{s.seq}
            </button>
            {shipments.length > 1 && (
              <button
                type="button"
                aria-label={`Hapus SJ #${s.seq}`}
                onClick={() => setConfirm({ kind: "shipment", id: s.id })}
                className="w-10 h-10 lg:w-7 lg:h-7 flex items-center justify-center rounded-full opacity-60 hover:opacity-100"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={addShipment}
        className="flex items-center gap-1 min-h-10 lg:min-h-0 px-3 lg:px-2.5 lg:py-1 rounded-full text-xs font-medium border border-dashed border-line text-ink/50 hover:border-ink hover:text-ink"
      >
        <Plus className="w-3 h-3" /> SJ Baru
      </button>
    </div>
  );

  // UI bundling di atas tombol Share/PDF/Print: satu centang per tab.
  // Tab Invoice -> semua SJ yang ada barangnya. Tab SJ -> invoice.
  const sjWithItems = shipments.filter(shipmentHasItems).length;
  let bundleUi: React.ReactNode;
  if (docType === "invoice") {
    const has = sjWithItems > 0;
    bundleUi = (
      <BundleCheck
        checked={bundleOn && has}
        disabled={!has}
        label={
          has ? `Sertakan Surat Jalan (${sjWithItems})` : "Sertakan Surat Jalan"
        }
        note={has ? undefined : "Belum ada surat jalan yang berisi barang."}
        onChange={(v) => setBundleOn(v)}
      />
    );
  } else {
    const has = shipmentHasItems(activeShipment);
    bundleUi = (
      <BundleCheck
        checked={bundleOn && has}
        disabled={!has}
        label="Sertakan Invoice"
        note={has ? undefined : "SJ ini belum ada barang yang dikirim."}
        onChange={(v) => setBundleOn(v)}
      />
    );
  }

  // Pengingat materai / Faktur Pajak. Ketuk untuk loncat ke bagian terkait
  // (desktop: tab sidebar, HP: sheet edit).
  const jumpToTab = (tab: string) => {
    setShareSheetOpen(false);
    if (showMobile) {
      openSheet(tab);
    } else {
      setPanelCollapsed(false);
      setActiveSidebarTab(tab);
    }
  };
  const noticeChips =
    docType === "invoice" && (showMateraiNotice || showPpnNotice) ? (
      <div className="flex flex-wrap gap-1.5">
        {showMateraiNotice && (
          <button
            type="button"
            onClick={() => jumpToTab("ttd")}
            className="flex items-center gap-1 min-h-10 lg:min-h-0 rounded-full border border-amber-200 bg-amber-50 px-3 lg:px-2.5 lg:py-1.5 text-[11px] font-medium text-amber-900 hover:bg-amber-100"
          >
            <AlertTriangle className="w-3 h-3 shrink-0" />
            Kemungkinan perlu materai
          </button>
        )}
        {showPpnNotice && (
          <button
            type="button"
            onClick={() => jumpToTab("diskon")}
            className="flex items-center gap-1 min-h-10 lg:min-h-0 rounded-full border border-sky-200 bg-sky-50 px-3 lg:px-2.5 lg:py-1.5 text-[11px] font-medium text-sky-900 hover:bg-sky-100"
          >
            <Info className="w-3 h-3 shrink-0" />
            Siapkan Faktur Pajak
          </button>
        )}
      </div>
    ) : null;

  const shareNoticeBox = shareNotice ? (
    <div className="flex items-start gap-2 bg-sand/60 border border-line rounded-lg px-3 py-2 text-[11px] text-ink/70 leading-relaxed max-h-24 overflow-y-auto">
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
  ) : null;

  // Bar aksi di sidebar (DESKTOP): pilihan dokumen + PDF / Print / Share.
  const renderActionBar = () => (
    <div className="no-print shrink-0 border-t border-line p-3 bg-white flex flex-col gap-2">
      {shareNoticeBox}
      {noticeChips}

      {/* Pilihan dokumen: selalu kelihatan, satu centang + opsi gabung. */}
      <div className="border border-line rounded-lg px-3 py-2 flex flex-col gap-1.5">
        {bundleUi}
        {docCount > 1 && (
          <BundleCheck
            checked={mergePdf}
            disabled={false}
            label="Gabungkan jadi 1 file PDF"
            onChange={setMergePdf}
          />
        )}
      </div>

      {/* PDF + Print: 2 kolom, label menunjukkan jumlah file/halaman. */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={handleDownloadPdf}
          disabled={busy === "pdf"}
          className="min-w-0 flex items-center justify-center gap-1.5 rounded-lg border border-line px-2 py-2.5 text-xs font-medium text-ink/80 hover:bg-sand hover:border-ink/30 transition-colors disabled:opacity-60"
        >
          <Download className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {busy === "pdf" ? "Memproses…" : pdfLabel}
          </span>
        </button>
        <button
          onClick={handlePrint}
          className="min-w-0 flex items-center justify-center gap-1.5 rounded-lg border border-line px-2 py-2.5 text-xs font-medium text-ink/80 hover:bg-sand hover:border-ink/30 transition-colors"
        >
          <Printer className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{printLabel}</span>
        </button>
      </div>

      {/* Share: full width, paling bawah */}
      <div ref={shareBtnRef} className="relative">
        <button
          onClick={handleShareClick}
          disabled={busy === "share"}
          className="w-full min-w-0 flex items-center justify-center gap-1.5 rounded-lg bg-ink text-white px-3 py-2.5 text-xs font-medium hover:bg-ink/90 transition-colors disabled:opacity-60"
        >
          <Share2 className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            {busy === "share" ? "Memproses…" : shareLabel}
          </span>
        </button>

        {shareMenuOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-line rounded-lg shadow-lg overflow-hidden z-30">
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
    </div>
  );

  // Pengaturan tampilan kop — dipakai di tab Invoice/Surat Jalan (desktop)
  // dan di sheet ⚙️ (HP).
  const tampilanUi = (
    <div className="flex flex-col gap-2">
      <SidebarSubLabel>Tampilan</SidebarSubLabel>
      <label className="flex items-center justify-between gap-3 border border-line rounded-lg px-3 py-3 lg:py-2.5 cursor-pointer">
        <span className="text-sm text-ink/80">Tampilkan logo</span>
        <input
          type="checkbox"
          checked={showLogo}
          onChange={(e) => setShowLogo(e.target.checked)}
          className="w-5 h-5 lg:w-4 lg:h-4 accent-ink"
        />
      </label>
      {!showLogo && (
        <p className="text-[11px] text-ink/40">
          Logo dimatikan — kop tetap menampilkan nama &quot;Makmur
          A3&apos;S&quot; dalam bentuk teks.
        </p>
      )}
      {docType === "suratJalan" && (
        <label className="flex items-center justify-between gap-3 border border-line rounded-lg px-3 py-3 lg:py-2.5 cursor-pointer">
          <span className="text-sm text-ink/80">Cap di kolom Pengirim</span>
          <input
            type="checkbox"
            checked={showSjStamp}
            onChange={(e) => setShowSjStamp(e.target.checked)}
            className="w-5 h-5 lg:w-4 lg:h-4 accent-ink"
          />
        </label>
      )}
    </div>
  );

  // ── Isi form per tab. Dipakai di sidebar (desktop) ATAU bottom sheet
  // (HP) — tidak pernah dua-duanya sekaligus. ───────────────────────────
  const tabContent = (
    <>
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
              onChange={(e) => handleCustomerNameChange(e.target.value)}
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
              <label className="text-xs font-medium text-ink/60">No. HP</label>
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
              <label className="text-xs font-medium text-ink/60">Email</label>
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
            No. HP dipakai untuk membuka chat WhatsApp langsung ke customer saat
            Share.
          </p>
        </>
      )}

      {activeSidebarTab === "customer" && docType === "suratJalan" && (
        <>
          <SidebarSectionHeader icon={Truck} label="Tujuan Kirim" />

          <div>
            <label className="text-xs font-medium text-ink/60">
              Pengiriman ke-
            </label>
            {shipmentChips}
          </div>

          <div className="flex flex-col gap-2">
            <SidebarSubLabel>
              {shipments.length > 1
                ? `Alamat Pengiriman SJ #${activeShipment?.seq}`
                : "Alamat Pengiriman"}
            </SidebarSubLabel>
            <div className="flex items-center gap-1 flex-wrap">
              <button
                type="button"
                onClick={() => updateShipTo({ sameAsCustomer: true })}
                className={`min-h-10 lg:min-h-0 px-3 lg:px-2.5 lg:py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  activeShipTo.sameAsCustomer
                    ? "bg-ink text-white border-ink"
                    : "border-line text-ink/60 hover:border-ink"
                }`}
              >
                Sama dengan Invoice
              </button>
              <button
                type="button"
                onClick={() => updateShipTo({ sameAsCustomer: false })}
                className={`min-h-10 lg:min-h-0 px-3 lg:px-2.5 lg:py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  !activeShipTo.sameAsCustomer
                    ? "bg-ink text-white border-ink"
                    : "border-line text-ink/60 hover:border-ink"
                }`}
              >
                Alamat Lain
              </button>
            </div>
            {shipToSources.length > 0 && (
              <select
                value=""
                onChange={(e) => {
                  const src = shipToSources.find(
                    (x) => x.key === e.target.value,
                  );
                  if (src)
                    updateShipTo({
                      ...src.shipTo,
                      sameAsCustomer: false,
                    });
                }}
                className="border border-line rounded-lg px-3 py-2 text-sm bg-white text-ink/70 outline-none focus:border-ink"
              >
                <option value="">Salin alamat dari SJ lain…</option>
                {shipToSources.map((x) => (
                  <option key={x.key} value={x.key}>
                    {x.label}
                  </option>
                ))}
              </select>
            )}
            {!activeShipTo.sameAsCustomer && (
              <>
                <input
                  placeholder="Nama penerima / gudang / outlet"
                  value={activeShipTo.name}
                  onChange={(e) => updateShipTo({ name: e.target.value })}
                  className="border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow"
                />
                <textarea
                  placeholder="Alamat pengiriman (gudang/outlet)"
                  value={activeShipTo.address}
                  onChange={(e) => updateShipTo({ address: e.target.value })}
                  rows={2}
                  className="border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow resize-none"
                />
                <input
                  placeholder="No. HP penerima (opsional)"
                  value={activeShipTo.phone}
                  onChange={(e) => updateShipTo({ phone: e.target.value })}
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
                  className="flex items-center gap-1 min-h-10 lg:min-h-0 pl-3 text-[11px] text-ink/40 hover:text-ink"
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
                    onChange={(e) => handleInvoiceDateChange(e.target.value)}
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
                    min={invoiceDate}
                    onChange={(e) => handleDueDateChange(e.target.value)}
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
                    const val = t.days === null ? "custom" : String(t.days);
                    const active =
                      (topDays === null ? "custom" : String(topDays)) === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleTopChange(t.days)}
                        className={`min-h-10 lg:min-h-0 px-3 lg:px-2.5 lg:py-1.5 rounded-full text-xs font-medium border transition-colors ${
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
                        step={1}
                        value={customTopDays}
                        onChange={(e) =>
                          handleCustomTopDaysChange(e.target.value)
                        }
                        placeholder="0"
                        className="touch-compact w-10 bg-transparent outline-none text-xs font-medium text-right"
                      />
                      <span className="text-xs font-medium text-ink/60">
                        Hari
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-ink/60">
                  No. PO (opsional)
                </label>
                <input
                  value={poNumber}
                  onChange={(e) => setPoNumber(e.target.value)}
                  placeholder="Nomor PO dari customer"
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow mt-1"
                />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="text-xs font-medium text-ink/60">
                  Pengiriman ke-
                </label>
                {shipmentChips}
                <p className="text-[11px] text-ink/40 mt-1.5">
                  Kalau barang dikirim bertahap, klik &quot;SJ Baru&quot; untuk
                  tiap pengiriman. Contoh: pesanan 100 pcs dikirim 2 kali. SJ #1
                  isi 60, lalu SJ #2 otomatis terisi sisanya, 40.
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
                  Kode GR (opsional)
                </label>
                <input
                  value={activeShipment?.grCode ?? ""}
                  onChange={(e) => updateShipmentGrCode(e.target.value)}
                  placeholder="Good Receipt / kode penerimaan barang"
                  className="w-full border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow mt-1"
                />
                <p className="text-[11px] text-ink/40 mt-1">
                  Kode penerimaan dari customer. Diisi per pengiriman, jadi tiap
                  SJ punya kode sendiri. Kalau dikosongkan, di dokumen tetap
                  tampil garis titik-titik untuk ditulis tangan.
                </p>
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

          {/* Tampilan kop dokumen — di desktop ada di sini; di HP pindah ke
              sheet ⚙️. */}
          <div className="hidden lg:flex flex-col pt-4 mt-1 border-t border-line">
            {tampilanUi}
          </div>
        </>
      )}

      {docType === "suratJalan" && activeSidebarTab === "barang" && (
        <>
          <SidebarSectionHeader
            icon={Package}
            label="Barang Dikirim"
            hint={
              shipments.length > 1
                ? `Untuk SJ #${activeShipment?.seq}`
                : undefined
            }
          />
          <div>
            <label className="text-xs font-medium text-ink/60">
              Pengiriman ke-
            </label>
            {shipmentChips}
          </div>

          {docProps.sjRows.length === 0 ||
          items.every((it) => !it.name.trim()) ? (
            <p className="text-[11px] text-ink/40">
              Belum ada item di invoice. Isi dulu di mode Invoice, bagian Item.
            </p>
          ) : null}

          <div className="flex flex-col gap-2">
            {docProps.sjRows.map((it: any) => (
              <div
                key={it.id}
                className={`border border-line rounded-lg p-2.5 flex flex-col gap-2 ${
                  !it.included ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium min-w-0 break-words">
                    {it.name || (
                      <span className="text-ink/40">(item tanpa nama)</span>
                    )}
                  </p>
                  <label className="shrink-0 flex items-center gap-1.5 text-xs text-ink/70 min-h-11 lg:min-h-0 pl-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-5 h-5 lg:w-4 lg:h-4 accent-ink"
                      checked={it.included}
                      onChange={(e) =>
                        updateShipmentItem(it.id, {
                          included: e.target.checked,
                        })
                      }
                    />
                    Kirim
                  </label>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="text-[10px] text-ink/40">
                      Qty dikirim
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={it.maxAllowed}
                      value={it.shippedQty}
                      onChange={(e) =>
                        updateShipmentItem(it.id, {
                          qty: Number(e.target.value),
                        })
                      }
                      className="w-full border border-line rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow"
                    />
                  </div>
                  <span className="pb-2 text-sm text-ink/60 w-14 shrink-0">
                    {it.unit}
                  </span>
                </div>
                <p className="text-[11px] text-ink/40">
                  Pesanan {it.qty} {it.unit}
                  {it.shippedQty < it.maxAllowed || it.maxAllowed < it.qty
                    ? ` · maks. ${it.maxAllowed} untuk SJ ini`
                    : ""}
                  {it.remainingAfterThis > 0
                    ? ` · sisa ${it.remainingAfterThis} belum dikirim`
                    : ""}
                </p>
              </div>
            ))}
          </div>
        </>
      )}

      {docType === "invoice" && activeSidebarTab === "item" && (
        <>
          <SidebarSectionHeader icon={Package} label="Item & Harga" />
          <button
            onClick={addItem}
            className="flex items-center justify-center gap-1.5 border border-dashed border-line rounded-lg min-h-11 lg:min-h-0 py-2 text-sm text-ink/60 hover:border-ink hover:text-ink transition-colors"
          >
            <Plus className="w-4 h-4" /> Tambah Baris Kosong
          </button>

          {/* [MOBILE] daftar saran satuan untuk input Satuan */}
          <datalist id="unit-options">
            {UNIT_SUGGESTIONS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>

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
                        onChange={(v: string) => updateItem(it.id, { name: v })}
                      />
                    </div>
                    <button
                      onClick={() => removeItem(it.id)}
                      aria-label="Hapus baris"
                      className="shrink-0 w-11 h-11 lg:w-6 lg:h-6 flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4 lg:w-3.5 lg:h-3.5 text-ink/30 hover:text-brand" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <label className="text-[10px] text-ink/40">Qty</label>
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
                    {/* [MOBILE] Satuan — di desktop sudah ada di canvas */}
                    <div className="flex-1 lg:hidden">
                      <label className="text-[10px] text-ink/40">Satuan</label>
                      <input
                        list="unit-options"
                        value={it.unit}
                        onChange={(e) =>
                          updateItem(it.id, { unit: e.target.value })
                        }
                        placeholder="pcs"
                        className="w-full border border-line rounded-lg px-2.5 py-1.5 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-ink/40">Harga</label>
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
                  {/* [MOBILE] Subtotal per item */}
                  <p className="text-right text-xs text-ink/50 lg:hidden">
                    Subtotal{" "}
                    <span className="font-semibold text-ink">
                      {currency(it.qty * it.price)}
                    </span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {docType === "invoice" && activeSidebarTab === "diskon" && (
        <>
          <SidebarSectionHeader icon={SlidersHorizontal} label="Tambahan" />
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
                    className={`min-h-11 lg:min-h-0 px-3.5 lg:px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
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
                onChange={(e) => setDiscountValue(Number(e.target.value))}
                placeholder="0"
                className="flex-1 min-w-0 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-ink focus:ring-2 focus:ring-ink/5 transition-shadow"
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
            <label className="flex items-center justify-between gap-3 border border-line rounded-lg px-3 py-3 lg:py-2.5 cursor-pointer">
              <span className="text-sm text-ink/80">Kenakan PPN</span>
              <input
                type="checkbox"
                checked={taxEnabled}
                onChange={(e) => setTaxEnabled(e.target.checked)}
                className="w-5 h-5 lg:w-4 lg:h-4 accent-ink"
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
              Dihitung dari subtotal setelah diskon. Ongkir tidak dikenai PPN.
            </p>
            {showPpnNotice && (
              <div className="bg-sky-50 border border-sky-200 rounded-lg px-3 py-2 text-[11px] text-sky-900 leading-relaxed">
                <p className="flex items-center gap-1 font-semibold">
                  <Info className="w-3 h-3" /> Faktur Pajak
                </p>
                <p>
                  Invoice ini memuat PPN {taxRate}% — jangan lupa terbitkan dan
                  kirim Faktur Pajak ke customer.
                </p>
              </div>
            )}
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
                className="flex-1 min-w-0 bg-transparent text-sm outline-none"
              />
            </div>
            <p className="text-[11px] text-ink/40">
              Diisi kalau ongkirnya ditagihkan ke customer — otomatis
              ditambahkan ke Total di invoice. Kosongkan / isi 0 kalau gratis
              ongkir.
            </p>
          </div>
        </>
      )}

      {docType === "invoice" && activeSidebarTab === "rekening" && (
        <>
          <SidebarSectionHeader icon={Landmark} label="Rekening Bank" />
          <div>
            <label className="text-xs font-medium text-ink/60">Nama Bank</label>
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
            <label className="text-xs font-medium text-ink/60">Atas Nama</label>
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
          {showMateraiNotice && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-[11px] text-amber-900 leading-relaxed">
              <p className="flex items-center gap-1 font-semibold">
                <AlertTriangle className="w-3 h-3" /> Perlu materai
              </p>
              <p>
                Total invoice {currency(MATERAI_THRESHOLD)} atau lebih —
                kemungkinan memerlukan materai.
              </p>
              {!showMateraiBox && (
                <button
                  type="button"
                  onClick={() => setShowMateraiBox(true)}
                  className="mt-1 min-h-10 lg:min-h-0 font-semibold underline underline-offset-2"
                >
                  Tambah kotak materai
                </button>
              )}
            </div>
          )}
          <label className="flex items-center justify-between gap-3 border border-line rounded-lg px-3 py-3 lg:py-2.5 cursor-pointer">
            <span className="text-sm text-ink/80">Tampilkan cap</span>
            <input
              type="checkbox"
              checked={showStamp}
              onChange={(e) => setShowStamp(e.target.checked)}
              className="w-5 h-5 lg:w-4 lg:h-4 accent-ink"
            />
          </label>
          <label className="flex items-center justify-between gap-3 border border-line rounded-lg px-3 py-3 lg:py-2.5 cursor-pointer">
            <span className="text-sm text-ink/80">Kotak tempel materai</span>
            <input
              type="checkbox"
              checked={showMateraiBox}
              onChange={(e) => setShowMateraiBox(e.target.checked)}
              className="w-5 h-5 lg:w-4 lg:h-4 accent-ink"
            />
          </label>
          <label className="flex items-center justify-center gap-2 border border-dashed border-line rounded-lg min-h-11 lg:min-h-0 py-2.5 text-sm text-ink/60 hover:border-ink cursor-pointer transition-colors">
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
              Belum ada tanda tangan diupload — cuma cap yang bakal tampil di
              invoice.
            </p>
          )}
          {signatureUrl && (
            <button
              type="button"
              onClick={() => setSignatureUrl(null)}
              className="min-h-10 lg:min-h-0 text-[11px] text-ink/40 hover:text-brand self-start"
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
              Tampil di bawah garis tanda tangan. Kalau nama dikosongkan, yang
              tampil &quot;Makmur A3&apos;S&quot;.
            </p>
          </div>
        </>
      )}
    </>
  );

  const sheetTitle = `Edit ${sidebarTabs.find((t) => t.id === activeSidebarTab)?.label ?? ""}`;

  return (
    <div className="print-root fixed inset-0 z-[100] bg-neutral-100 flex flex-col overflow-hidden">
      <style>{`
        /* Padding baris item diatur lewat variable --rp (kepadatan + stretch). */
        [data-pg-row] > td {
          padding-top: var(--rp, 8px);
          padding-bottom: var(--rp, 8px);
          line-height: 20px;
        }
        /* Input di editor dipaksa setinggi teks statis (20px) supaya tinggi
           baris di editor sama persis dengan di PDF / print. */
        [data-pg-row] input:not([type="checkbox"]) {
          height: 20px;
          line-height: 20px;
          padding-top: 0;
          padding-bottom: 0;
          vertical-align: top;
        }
        [data-pg-row] > td > span,
        [data-pg-row] > td > label {
          vertical-align: top;
        }
        [data-pg-row] button {
          display: block;
        }

        /* Area export disembunyikan di luar layar saat mode normal. */
        #print-portal { position: fixed; top: 0; left: -10000px; z-index: -1; }

        @media print {
          /* Margin 0: halaman dokumen sudah punya padding sendiri, dan
             ukurannya (780 x 1100px = 206 x 291mm) pas di dalam A4. */
          @page { size: A4; margin: 0; }
          html, body {
            margin: 0;
            height: auto !important;
            overflow: visible !important;
          }

          /* Sembunyikan semua anak body kecuali portal export (termasuk
             portal pengukur paginasi). Portal ada langsung di <body>, jadi
             tidak ada ancestor (fixed / overflow hidden) yang bisa
             memotong kontennya. */
          body > *:not(#print-portal) { display: none !important; }
          #print-portal {
            display: block !important;
            position: static !important;
            left: auto !important;
            z-index: auto !important;
          }

          /* Tiap halaman hasil paginasi = satu lembar A4, ukuran tetap. */
          #invoice-export-area [data-export-page] {
            width: ${PAGE_W}px;
            margin: 0 auto;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          #invoice-export-area .overflow-x-auto { overflow: visible !important; }

          /* Halaman baru untuk tiap halaman, kecuali halaman paling pertama
             dari dokumen paling pertama. */
          #invoice-export-area [data-export-page]:not([data-page-index="0"]),
          #invoice-export-area [data-export-doc] + [data-export-doc] [data-export-page][data-page-index="0"] {
            break-before: page;
            page-break-before: always;
          }

          /* Pertahankan warna (garis brand, cap) saat print. */
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
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
        @keyframes sheet-up {
          from { transform: translateY(32px); opacity: 0; }
          to { transform: none; opacity: 1; }
        }
        .sheet-up { animation: sheet-up 0.18s ease-out; }
        @media (max-width: 1023px) {
          input:not([type="checkbox"]):not([type="radio"]),
          textarea,
          select {
            font-size: 16px !important;
          }
          /* Input di sheet minimal setinggi 44px (area sentuh). */
          .sheet-body input:not([type="checkbox"]):not([type="radio"]):not([type="file"]):not(.touch-compact),
          .sheet-body select {
            min-height: 44px;
          }
        }
      `}</style>

      {/* ── TOOLBAR ATAS ─────────────────────────────────────────── */}
      <div className="no-print flex items-center gap-2 px-3 lg:px-4 py-2 lg:py-2.5 bg-white border-b border-line shrink-0">
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
              resetBundle();
            }}
            className={`flex items-center gap-1.5 px-3.5 lg:px-3 min-h-10 lg:min-h-0 lg:py-1.5 rounded-full text-xs font-medium transition-colors ${
              docType === "invoice" ? "bg-ink text-white" : "text-ink/60"
            }`}
          >
            <FileText className="w-3.5 h-3.5 hidden sm:block" /> Invoice
          </button>
          <button
            onClick={() => {
              setDocType("suratJalan");
              setShareNotice(null);
              resetBundle();
            }}
            className={`flex items-center gap-1.5 px-3.5 lg:px-3 min-h-10 lg:min-h-0 lg:py-1.5 rounded-full text-xs font-medium transition-colors ${
              docType === "suratJalan" ? "bg-ink text-white" : "text-ink/60"
            }`}
          >
            <Truck className="w-3.5 h-3.5 hidden sm:block" /> Surat Jalan
          </button>
        </div>

        {/* Desktop: Preview + zoom + Keluar. HP: Preview pindah ke bar bawah,
            Keluar pindah ke sheet ⚙️. */}
        <button
          onClick={openPreview}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-line text-ink/60 hover:border-ink hover:text-ink transition-colors lg:mr-1"
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
          onClick={() => setConfirm({ kind: "logout" })}
          disabled={loggingOut}
          aria-label="Keluar"
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-60"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>{loggingOut ? "Keluar…" : "Keluar"}</span>
        </button>

        <button
          onClick={() => setSettingsOpen(true)}
          aria-label="Pengaturan"
          className="lg:hidden w-11 h-11 flex items-center justify-center rounded-full border border-line text-ink/70 active:bg-sand"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex min-h-0 relative">
        {/* ── SIDEBAR KIRI (desktop) ───────────────────────────────── */}
        {showDesktop && (
          <div
            className={`no-print bg-white border-r border-line flex flex-col shrink-0 h-full transition-all duration-200 ${
              panelCollapsed ? "w-0 overflow-hidden" : "w-[380px]"
            }`}
          >
            <div className="flex-1 flex min-h-0">
              {/* Rail tab vertikal */}
              <div className="w-16 shrink-0 border-r border-line flex flex-col items-center gap-1 py-3 overflow-y-auto">
                {sidebarTabs.map((t) => {
                  const Icon = t.icon;
                  const active = activeSidebarTab === t.id;
                  // Titik peringatan: materai -> tab TTD, Faktur Pajak -> tab Tambahan.
                  const alert =
                    (t.id === "ttd" && showMateraiNotice) ||
                    (t.id === "diskon" && showPpnNotice);
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveSidebarTab(t.id)}
                      className={`relative w-14 flex flex-col items-center gap-1 py-2 rounded-lg text-[10px] font-medium transition-colors ${
                        active
                          ? "bg-ink text-white"
                          : "text-ink/50 hover:bg-sand"
                      }`}
                    >
                      {alert && (
                        <span
                          className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-amber-500"
                          aria-label="Ada peringatan"
                        />
                      )}
                      <Icon className="w-4 h-4" />
                      <span className="leading-tight text-center">
                        {t.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex-1 min-w-0 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-4 flex flex-col gap-4">
                  {tabContent}
                </div>
              </div>
            </div>

            {renderActionBar()}
          </div>
        )}

        {/* ── CANVAS (zoomable, desktop) — halaman A4 bertumpuk ────── */}
        {showDesktop && (
          <div
            ref={canvasWrapRef}
            className="flex-1 h-full overflow-auto flex items-start p-6 relative"
          >
            <div
              className="mx-auto shrink-0"
              style={{
                width: canvasSize.w * zoom,
                height: canvasSize.h * zoom,
              }}
            >
              <div
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: "top left",
                  width: "max-content",
                }}
              >
                <div ref={pageRef}>
                  <PagedDocument
                    editable
                    {...docProps}
                    pageClassName="rounded-2xl border border-line shadow-sm overflow-hidden"
                    pageGap={24}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── LAYAR UTAMA HP: dokumen, ketuk bagian untuk mengedit ─── */}
        {showMobile && (
          <div ref={mobileWrapRef} className="flex-1 min-h-0 overflow-auto p-3">
            <p className="text-[11px] text-ink/50 text-center mb-2">
              Ketuk bagian dokumen untuk mengedit
            </p>
            <div
              className="mx-auto shrink-0"
              style={{
                width: mobileSize.w * mobileZoom,
                height: mobileSize.h * mobileZoom,
              }}
            >
              <div
                style={{
                  transform: `scale(${mobileZoom})`,
                  transformOrigin: "top left",
                  width: "max-content",
                }}
              >
                <div ref={mobilePageRef}>
                  <PagedDocument
                    editable={false}
                    {...docProps}
                    onEdit={openSheet}
                    pageClassName="rounded-2xl border border-line shadow-sm overflow-hidden"
                    pageGap={16}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BAR BAWAH HP: Total · Perbesar · Bagikan ─────────────── */}
      {showMobile && (
        <div className="no-print shrink-0 bg-white border-t border-line px-3 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] flex items-center gap-2">
          <div className="min-w-0 mr-auto">
            <p className="text-[11px] text-ink/50 leading-tight">
              {docType === "invoice" ? "Total" : "Surat Jalan"}
            </p>
            <p className="text-base font-semibold leading-tight truncate">
              {docType === "invoice"
                ? currency(grandTotal)
                : `SJ #${activeShipment?.seq ?? 1}`}
            </p>
          </div>
          <button
            type="button"
            onClick={openPreview}
            className="shrink-0 flex items-center justify-center gap-1.5 min-h-11 px-4 rounded-lg border border-line text-xs font-medium text-ink/80 active:bg-sand"
          >
            <ZoomIn className="w-4 h-4" /> Perbesar
          </button>
          <button
            type="button"
            onClick={() => {
              setShareMenuOpen(false);
              setShareSheetOpen(true);
            }}
            className="shrink-0 flex items-center justify-center gap-1.5 min-h-11 px-5 rounded-lg bg-ink text-white text-xs font-medium active:bg-ink/90"
          >
            <Share2 className="w-4 h-4" /> Bagikan
            {(showMateraiNotice || showPpnNotice) && (
              <span
                className="w-2 h-2 rounded-full bg-amber-400"
                aria-label="Ada peringatan"
              />
            )}
          </button>
        </div>
      )}

      {/* ── SHEET: edit bagian dokumen (HP) ──────────────────────── */}
      {showMobile && (
        <BottomSheet
          open={sheetOpen}
          title={sheetTitle}
          onClose={() => setSheetOpen(false)}
        >
          <div className="flex flex-col gap-4">{tabContent}</div>
        </BottomSheet>
      )}

      {/* ── SHEET: Bagikan (HP) — bundling, PDF, share ───────────── */}
      {showMobile && (
        <BottomSheet
          open={shareSheetOpen}
          title="Bagikan"
          onClose={() => setShareSheetOpen(false)}
        >
          <div className="flex flex-col gap-3">
            {shareNoticeBox}
            {noticeChips}

            <div className="border border-line rounded-lg px-3 py-1 flex flex-col">
              {bundleUi}
              {docCount > 1 && (
                <BundleCheck
                  checked={mergePdf}
                  disabled={false}
                  label="Gabungkan jadi 1 file PDF"
                  onChange={setMergePdf}
                />
              )}
            </div>

            <button
              type="button"
              onClick={handleShareClick}
              disabled={busy === "share"}
              className="w-full flex items-center justify-center gap-2 min-h-12 rounded-lg bg-ink text-white text-sm font-medium disabled:opacity-60"
            >
              <Share2 className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {busy === "share" ? "Memproses…" : shareLabel}
              </span>
            </button>

            {shareMenuOpen && (
              <div className="border border-line rounded-lg overflow-hidden">
                <p className="px-3 pt-2.5 pb-1.5 text-[10px] uppercase tracking-wide text-ink/40 font-semibold">
                  Bagikan lewat
                </p>
                <button
                  type="button"
                  onClick={() => handleShareFallback("wa")}
                  className="w-full flex items-center gap-3 px-3 min-h-12 text-sm text-ink/80 active:bg-sand"
                >
                  <span className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full bg-[#25D366] text-white">
                    <WhatsAppIcon className="w-4 h-4" />
                  </span>
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => handleShareFallback("email")}
                  className="w-full flex items-center gap-3 px-3 min-h-12 text-sm text-ink/80 active:bg-sand border-t border-line"
                >
                  <span className="w-7 h-7 shrink-0 flex items-center justify-center rounded-full bg-ink text-white">
                    <Mail className="w-4 h-4" />
                  </span>
                  Email
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={busy === "pdf"}
              className="w-full flex items-center justify-center gap-2 min-h-12 rounded-lg border border-line text-sm font-medium text-ink/80 active:bg-sand disabled:opacity-60"
            >
              <Download className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {busy === "pdf" ? "Memproses…" : `Unduh ${pdfLabel}`}
              </span>
            </button>
          </div>
        </BottomSheet>
      )}

      {/* ── SHEET: Pengaturan ⚙️ (HP) ────────────────────────────── */}
      {showMobile && (
        <BottomSheet
          open={settingsOpen}
          title="Pengaturan"
          onClose={() => setSettingsOpen(false)}
        >
          <div className="flex flex-col gap-4">
            {tampilanUi}
            <div className="pt-4 border-t border-line">
              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  setConfirm({ kind: "logout" });
                }}
                className="w-full flex items-center justify-center gap-2 min-h-12 rounded-lg border border-red-200 text-red-600 text-sm font-medium active:bg-red-50"
              >
                <LogOut className="w-4 h-4" /> Keluar
              </button>
            </div>
          </div>
        </BottomSheet>
      )}

      {/* ── KONFIRMASI hapus SJ / keluar ─────────────────────────── */}
      <ConfirmDialog
        open={confirm !== null}
        title={
          confirm?.kind === "logout"
            ? "Keluar dari Invoice Generator?"
            : `Hapus SJ #${confirmShipment?.seq ?? ""}?`
        }
        message={
          confirm?.kind === "logout"
            ? "Data invoice yang sedang dibuat akan hilang kalau belum diunduh atau dibagikan."
            : "Pengiriman ini dan isinya akan dihapus. Nomor SJ berikutnya akan dirapatkan otomatis."
        }
        confirmLabel={confirm?.kind === "logout" ? "Keluar" : "Hapus"}
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />

      {/* ── FULL PREVIEW OVERLAY ─────────────────────────────────── */}
      {showFullPreview && (
        <div className="no-print fixed inset-0 z-[200] bg-ink/60 backdrop-blur-sm flex flex-col">
          <div className="flex items-center gap-2 px-4 py-2 lg:py-3 bg-white border-b border-line shrink-0">
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
                className="w-10 h-10 lg:w-7 lg:h-7 flex items-center justify-center rounded-lg hover:bg-sand text-ink/60"
                aria-label="Perkecil"
              >
                <ZoomOut className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
              </button>
              <span className="text-xs text-ink/50 w-10 text-center font-data">
                {Math.round(previewZoom * 100)}%
              </span>
              <button
                onClick={() => {
                  setPreviewAutoFit(false);
                  setPreviewZoom((z) => Math.min(3, z + 0.1));
                }}
                className="w-10 h-10 lg:w-7 lg:h-7 flex items-center justify-center rounded-lg hover:bg-sand text-ink/60"
                aria-label="Perbesar"
              >
                <ZoomIn className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
              </button>
              <button
                onClick={() => setPreviewAutoFit(true)}
                className="w-10 h-10 lg:w-7 lg:h-7 flex items-center justify-center rounded-lg hover:bg-sand text-ink/60"
                aria-label="Fit ke layar"
              >
                <Maximize2 className="w-4 h-4 lg:w-3.5 lg:h-3.5" />
              </button>
              <button
                onClick={() => setShowFullPreview(false)}
                className="w-11 h-11 lg:w-8 lg:h-8 flex items-center justify-center rounded-lg hover:bg-sand text-ink/60 ml-1"
                aria-label="Tutup preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div
            ref={previewWrapRef}
            className="flex-1 overflow-auto flex items-start p-3 sm:p-8"
            style={{ touchAction: "pan-x pan-y" }}
            onClick={(e) => {
              // Klik di area gelap (di luar dokumen) menutup preview.
              if (
                previewPageRef.current &&
                !previewPageRef.current.contains(e.target as Node)
              ) {
                setShowFullPreview(false);
              }
            }}
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
                {/* Preview = persis hasil PDF/print: halaman A4 bertumpuk. */}
                <div ref={previewPageRef}>
                  <PagedDocument
                    {...docProps}
                    pageClassName="rounded-2xl shadow-2xl overflow-hidden"
                    pageGap={24}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Versi statis tersembunyi — dipakai KHUSUS buat print & PDF. Dirender
          lewat portal langsung ke <body> supaya tidak terpotong ancestor
          (fixed/overflow-hidden) saat print. Tiap dokumen punya wrapper
          sendiri ([data-export-doc]) dan di dalamnya satu atau lebih halaman
          A4 ([data-export-page]) hasil paginasi, supaya bisa di-capture per
          halaman dan dipisah halaman saat print. */}
      {mounted &&
        createPortal(
          <div id="print-portal" aria-hidden>
            <div id="invoice-export-area" ref={exportRef}>
              {exportDocs.map((d) => (
                <div key={d.key} data-export-doc data-export-key={d.key}>
                  <PagedDocument
                    {...d.props}
                    onPageCount={(n: number) =>
                      setPageCounts((prev) =>
                        prev[d.key] === n ? prev : { ...prev, [d.key]: n },
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
