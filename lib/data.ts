import {
  Package,
  Boxes,
  Coffee,
  UtensilsCrossed,
  Recycle,
  Wheat,
  Layers,
  ShieldCheck,
  Hotel,
  ShoppingCart,
  Truck,
  Store,
  Building2,
  Tag,
  Handshake,
  type LucideIcon,
} from "lucide-react";
import productImages from "./product-images.generated.json";

/*
 * ============================================================
 * DAFTAR TODO (cari "TODO" di file ini)
 * ============================================================
 * 1. PB-SPR60100  : nama asli "Suprah" belum dikonfirmasi
 * 2. PP-BAG-S/M/L : ukuran S (11×11×28) dan M (21×21) janggal, cek ulang
 * 3. PP-NASI-P    : apakah Cap Gajah? kalau ya, cantumkan di nama
 * 4. Dome lid     : belum ditambah sebagai produk (kode CB-?)
 * 5. PB-15..PB-50 : ukuran belum ada satuan
 * 6. Produk "Standard": ukuran belum jelas (sedotan, sendok, bento, dll.)
 * 7. CB-PL16C     : cek isi pack & MOQ
 * 8. Isi per pack untuk produk "1 pack" / "1 roll"
 * 9. Jumlah SKU di STATS dihitung dari ALL_PRODUCTS (produk dasar saja,
 *    belum termasuk varian di variants.ts). Idealnya dihitung dari
 *    CATALOG_PRODUCTS di file yang mengimpor keduanya (data.ts tidak boleh
 *    mengimpor variants.ts: circular).
 * 10. Item baru dari compro: OP-TISU, OT-TUSUKGIGI, CB-PPRCUP — detail
 *     (jenis, ukuran, satuan, MOQ) masih TODO, ambil dari pricelist/klien
 * 11. AF-OX1400   : di pricelist ditulis "Alumunium OX1400 + Lid" (tanpa
 *     kata "Foil"); di sini disamakan dengan 7 item foil lainnya
 * 12. PB-GLS      : pricelist "Kantong glas juzz" — konfirmasi apakah
 *     "Juzz" memang penulisan sengaja
 * 13. Material tray foil ("Aluminium + PET lid") belum ada di pricelist
 * 14. Item compro yang baru terwakili sebagian: thinwall (selain 800 ml),
 *     kraft paper lembaran/roll, bento custom, rafia per warna, groceries
 * 15. MOQ_ENABLED = false — MOQ dinonaktifkan sementara. Data `moq` tetap
 *     ada; aktifkan lagi setelah angkanya dikonfirmasi klien.
 * --- Baru dari perapihan kategori ---
 * 16. CB-400 : masuk Cup Bowl hanya tebakan dari ukuran. Konfirmasi ke
 *     klien (400 ml bowl atau gelas?). CB-200 sudah dikonfirmasi Bowl.
 * 17. PB-HEAT2035 vs PB-PE2035 : sama-sama 20×35 dan sama-sama di
 *     "PE, Sheet & Wrapping". Kalau produk yang sama, hapus salah satu.
 *     Material HEAT2035 "Nylon/PA" kemungkinan salah (anti panas biasanya
 *     PP / PE tahan panas).
 * 18. PP-KFT181105 : material "Kraft corrugated" perlu dicek; kalau kotak
 *     makanan, lebih tepat "Kraft paper" / "Kraft board".
 * 19. OT-PAPING-*  : material "LDPE" perlu dicek (piping bag biasanya
 *     PE/PP).
 * 20. PB-GLS ada di "Kantong" (bisa pindah ke "Kemasan Minuman" kalau klien
 *     setuju). PB-POLYP ada di "Dus, Bag & Mailer". OP-BENANG tampil di
 *     "Dapur & Bakery" (kode tetap OP-).
 * --- Baru dari revisi klien (Okt 2026) ---
 * 21. ATURAN VARIAN: yang jadi varian (chip di detail) hanya UKURAN dan
 *     WARNA. Beda tipe/model = produk sendiri (mis. Sedotan Steril vs
 *     Nonsteril, Cup Kertas Polos vs Custom, Vacuum Emboss vs Polos, Latex
 *     Powder vs Non-powder). Pengecualian: LB Sekat 4 A/B digabung 1 kartu.
 *     Penggabungan ada di lib/variants.ts (GROUPS). File INI tetap daftar
 *     produk dasar; varian baru dibuat otomatis di variants.ts dari produk
 *     dasar. Produk lama yang digantikan grup disembunyikan (legacy) tapi
 *     URL lamanya tetap jalan.
 * 22. CB-TWRC200, CB-TWSQ350, CB-TWRD300, CB-TWFB750, CB-TWLB4A : produk
 *     dasar subkategori "Thinwall, Cup Saus & Bowl". Ukuran lain dibuat di variants.ts
 *     (Rect 200-1000, Square 350-3000, Round 300/450, Food Box 750/1000,
 *     Bowl lewat grup Cup Bowl). Isi unit/pack/MOQ masih tebakan.
 *     SEMENTARA DINONAKTIFKAN: lihat DISABLED_CODES di bawah (dan
 *     DISABLED_GROUP_IDS di lib/variants.ts).
 * 23. FI-KISMIS, FI-PUFF750 : produk baru Bahan Baku. Isi pack/MOQ
 *     masih tebakan. Puff Pastry tanpa brand: di variants.ts ubah nama grup
 *     "Puff Pastry EDO" jadi "Puff Pastry".
 * 24. ON-RECHECK tinggal Tisu (OP-TISU), sengaja belum diubah. Kantong
 *     Plastik sudah dikerjakan (15/17/24/28/35/40, PB-50 jumbo dipisah).
 * 25. Produk BARU yang dibuat otomatis di variants.ts (isi pack/MOQ
 *     disalin dari produk dasar, cek per ukuran): Cup Plastik 10/14 oz +
 *     Custom 10/12/14 oz, Cup Kertas Polos & Custom 4/6,5/8/12/14/16 oz,
 *     Foil Roll 30x7,6 / 45x75 / 30x150 / 45x150, Kantong Plastik 17 & 40,
 *     Plastik Wrapping 30/40/45 x 250/500, Thermal 30/38/40/50/60/70 mm,
 *     Vacuum Emboss & Polos (43 ukuran), Plastik Bawang/Klip/OPP (ukuran
 *     acuan), Handglove Nitrile & semua ukuran/warna, Lakban & Rafia warna.
 * 26. Kode baru di variants.ts belum punya foto sendiri; kartu/detail
 *     memakai foto grup (varian atau produk lama yang punya foto).
 * --- Struktur kategori FINAL (Okt 2026) ---
 * 27. Struktur tampil = LAYOUT (di bawah RAW_DIVISIONS): 8 Kategori,
 *     19 Subkategori. ATURAN: tidak ada subkategori dengan 1 kartu sendirian. RAW_DIVISIONS cuma gudang data produk. Pindah produk
 *     antar subkategori = pindahkan KODE-nya di LAYOUT, jangan objeknya.
 *     Produk baru di RAW_DIVISIONS WAJIB didaftarkan di LAYOUT, kalau tidak
 *     tidak tampil (ada peringatan di terminal saat dev).
 *
 * CATATAN:
 * - Kode produk berubah di 2 tempat (harus rename file gambar di
 *   public/products/ lalu jalankan `npm run generate:images`):
 *     FI-ARANG  -> OT-ARANG
 *     OT-BENANG -> OP-BENANG
 *   URL produk juga ikut berubah (slug = kode).
 * - Kode foil roll juga diseragamkan ke pola AF-RL-<lebar>-<panjang>
 *   (nama file gambar harus sama):
 *     AF-014 -> AF-RL-45-300
 *     AF-021 -> AF-RL-45-76
 * - Kode lain TIDAK diubah, supaya mapping gambar tetap jalan
 *   (termasuk CB-035..CB-650 yang sekarang jadi Cup Saus / Cup Bowl).
 *   Karena itu prefix kode (AF-, DC-, FI-, OT-, HG-) tidak selalu sama
 *   dengan Kategori tempat produk tampil.
 * - Nama produk mengikuti PRICELIST klien. Ejaan/format boleh dirapikan,
 *   tapi istilahnya jangan diganti (Handglove, Drink Tray, dst).
 *   Pengecualian: "Cup Saus"/"Cup Bowl" dan "Kraft Food Box" adalah
 *   keputusan penamaan internal, bukan istilah pricelist.
 * - `unit` = satuan jual dari pricelist (sumber yang sudah pasti).
 *   `pack` & `moq` masih sebagian tebakan, jangan ditampilkan sebagai fakta.
 * - Istilah di UI: Divisi (kode) = "Kategori" (tampil),
 *   Category (kode) = "Subkategori" (tampil).
 */
export const CLIENTS = [
  { name: "HokBen", logo: "/clients/hokben.png" },
  { name: "Richeese Factory", logo: "/clients/richeese.png" },
  { name: "Emado's", logo: "/clients/emados.png" },
  { name: "Rindu Mu", logo: "/clients/rindumu.png" },
  { name: "Teman Coffee", logo: "/clients/teman-coffee.png" },
  { name: "Mak Gobang", logo: "/clients/mak-gobang.png" },
  { name: "Al Jazeerah Signature", logo: "/clients/al-jazeerah-signature.png" },
  { name: "Amar", logo: "/clients/amar.png" },
];

// Sumber tunggal poin keunggulan — disamakan dengan 5 poin di Company
// Profile. Dipakai di section "Keunggulan" homepage.
export const WHY_US = [
  {
    icon: ShieldCheck,
    title: "Produk berkualitas",
    body: "Bahan baku pilihan dengan standar mutu terjamin.",
  },
  {
    icon: Truck,
    title: "Layanan cepat & responsif",
    body: "Pengiriman tepat waktu sesuai jadwal mitra.",
  },
  {
    icon: Layers,
    title: "Fleksibel & custom order",
    body: "Kebutuhan khusus disiapkan sesuai permintaan usaha HORECA kamu.",
  },
  {
    icon: Tag,
    title: "Harga kompetitif",
    body: "Penawaran harga bersaing tanpa mengurangi kualitas.",
  },
  {
    icon: Handshake,
    title: "Mitra bisnis jangka panjang",
    body: "Fokus membangun relasi profesional dan berkelanjutan.",
  },
];

export type Product = {
  code: string;
  name: string;
  material: string;
  size: string;
  unit: string; // satuan jual sesuai pricelist (Roll, Set, Pack, Pcs, Kg, ...)
  pack: string;
  moq: string;
  divisionId: string;
  divisionName: string;
  categoryId: string;
  categoryName: string;
};

// Saklar MOQ: false = nonaktif (tidak ditampilkan & tidak dipakai validasi).
// Data `moq` di tiap produk tetap disimpan. Ubah ke true kalau MOQ sudah final.
export const MOQ_ENABLED = false;

// Pakai ini di mana pun butuh nilai MOQ, jangan baca product.moq langsung.
// Mengembalikan null saat MOQ nonaktif.
export function getMoq(product: Pick<Product, "moq">): string | null {
  return MOQ_ENABLED ? product.moq : null;
}

// Subkategori — sub-grouping di dalam satu Kategori. Gak butuh icon sendiri;
// icon kategori udah cukup buat identitas visual di sidebar/breadcrumb.
export type Category = {
  id: string;
  name: string;
  products: Omit<
    Product,
    "divisionId" | "divisionName" | "categoryId" | "categoryName"
  >[];
};

// Kategori (di kode: Division) — level teratas, tampil di Header (sticky,
// site-wide).
export type Division = {
  id: string;
  code: string;
  name: string;
  icon: LucideIcon;
  blurb: string;
  categories: Category[];
};

// ---------------------------------------------------------------------------
// RAW_DIVISIONS = GUDANG DATA PRODUK. Pengelompokan di sini TIDAK dipakai
// untuk tampilan; lihat LAYOUT di bawah. Isi produk tidak diubah.
// ---------------------------------------------------------------------------
const RAW_DIVISIONS: Division[] = [
  {
    id: "foil",
    code: "AF",
    name: "Aluminium Foil & Food Containers",
    icon: Package,
    blurb:
      "Foil roll dan foil tray beserta lid untuk kebutuhan pengemasan makanan.",
    categories: [
      {
        id: "af-roll",
        name: "Foil Roll",
        // Digabung jadi "Aluminium Foil Roll" di variants.ts, 7 ukuran
        // (30x7,6 / 45x7,6 / 45x75 / 30x150 / 45x150 / 30x300 / 45x300).
        products: [
          {
            code: "AF-RL-45-300",
            name: "Aluminium Foil 45 cm × 300 m",
            material: "Food-grade aluminium",
            size: "45 cm × 300 m",
            unit: "Roll",
            pack: "1 roll / karton",
            moq: "10 karton",
          },
          {
            code: "AF-RL-45-76",
            name: "Aluminium Foil 45 cm × 7,6 m",
            material: "Food-grade aluminium",
            size: "45 cm × 7,6 m",
            unit: "Roll",
            pack: "24 roll / karton",
            moq: "5 karton",
          },
        ],
      },
      {
        id: "af-container",
        name: "Foil Tray + Lid",
        products: [
          {
            code: "AF-BX4381",
            name: "Aluminium Foil BX4381 + Lid AX350",
            material: "Aluminium + PET lid",
            size: "BX4381 · lid AX350",
            unit: "Set",
            pack: "100 set / karton",
            moq: "5 karton",
          }, // TODO: material lid
          {
            code: "AF-BX52180",
            name: "Aluminium Foil BX52180 + Lid",
            material: "Aluminium + PET lid",
            size: "BX52180",
            unit: "Set",
            pack: "100 set / karton",
            moq: "5 karton",
          },
          {
            code: "AF-RX1200",
            name: "Aluminium Foil RX1200 + Lid",
            material: "Aluminium + PET lid",
            size: "RX1200 · 1200 ml",
            unit: "Set",
            pack: "50 set / karton",
            moq: "5 karton",
          },
          {
            code: "AF-RX145",
            name: "Aluminium Foil RX145 + Lid",
            material: "Aluminium + PET lid",
            size: "RX145",
            unit: "Set",
            pack: "100 set / karton",
            moq: "5 karton",
          },
          {
            code: "AF-RX725",
            name: "Aluminium Foil RX725 + Lid",
            material: "Aluminium + PET lid",
            size: "RX725 · 725 ml",
            unit: "Set",
            pack: "100 set / karton",
            moq: "5 karton",
          },
          {
            code: "AF-OX1400",
            name: "Aluminium Foil OX1400 + Lid",
            material: "Aluminium + PET lid",
            size: "OX1400",
            unit: "Set",
            pack: "50 set / karton",
            moq: "5 karton",
          }, // TODO: pricelist tanpa kata "Foil"
        ],
      },
    ],
  },
  {
    id: "paper",
    code: "PP",
    name: "Paper & Corrugated Packaging",
    icon: Boxes,
    blurb:
      "Thinwall, bento, kraft, dan dus corrugated untuk delivery, retail, dan pengiriman.",
    categories: [
      {
        id: "pp-thinwall",
        name: "Food Box (Thinwall & Bento)",
        products: [
          {
            code: "PP-TW-ALL",
            name: "Brown Paper Thinwall 800 ml",
            material: "Kraft-lined thinwall",
            size: "800 ml",
            unit: "Pcs",
            pack: "50 pcs / sleeve",
            moq: "10 sleeve",
          },
          {
            code: "PP-BENTO",
            name: "Bento Box",
            material: "Kraft board",
            size: "Standard",
            unit: "Pcs",
            pack: "50 pcs / sleeve",
            moq: "10 sleeve",
          }, // TODO: isi ukuran
          {
            code: "PP-KFT181105",
            name: "Kraft Food Box 18×11×5",
            material: "Kraft corrugated",
            size: "18×11×5 cm",
            unit: "Pcs",
            pack: "25 pcs / bundle",
            moq: "4 bundle",
          }, // TODO: cek material (kemungkinan "Kraft paper"/"Kraft board", bukan corrugated)
        ],
      },
      {
        id: "pp-box",
        name: "Dus & Box",
        products: [
          {
            code: "PP-DUS151005",
            name: "Dus 15×10×5",
            material: "3-ply corrugated",
            size: "15×10×5 cm",
            unit: "Pcs",
            pack: "25 pcs / bundle",
            moq: "4 bundle",
          },
          {
            code: "PP-DUS252010",
            name: "Dus 25×20×10",
            material: "3-ply corrugated",
            size: "25×20×10 cm",
            unit: "Pcs",
            pack: "20 pcs / bundle",
            moq: "4 bundle",
          },
          {
            code: "PP-DUS392624",
            name: "Dus 39×26×24",
            material: "5-ply corrugated",
            size: "39×26×24 cm",
            unit: "Pcs",
            pack: "10 pcs / bundle",
            moq: "2 bundle",
          },
          {
            code: "PP-DUS604030",
            name: "Dus Big Order 60×40×30",
            material: "5-ply heavy duty",
            size: "60×40×30 cm",
            unit: "Pcs",
            pack: "5 pcs / bundle",
            moq: "1 bundle",
          },
        ],
      },
      {
        id: "pp-bag",
        name: "Paper Bag",
        // TODO: ukuran S/M/L janggal (S lebih tinggi dari M, M cuma 2 dimensi). Cek ulang.
        products: [
          {
            code: "PP-BAG-L",
            name: "Paper Bag L 22×24×28",
            material: "Kraft paper",
            size: "22×24×28 cm",
            unit: "Pcs",
            pack: "50 pcs / pack",
            moq: "10 pack",
          },
          {
            code: "PP-BAG-M",
            name: "Paper Bag M 21×21",
            material: "Kraft paper",
            size: "21×21 cm",
            unit: "Pcs",
            pack: "50 pcs / pack",
            moq: "10 pack",
          },
          {
            code: "PP-BAG-S",
            name: "Paper Bag S 11×11×28",
            material: "Kraft paper",
            size: "11×11×28 cm",
            unit: "Pcs",
            pack: "50 pcs / pack",
            moq: "10 pack",
          },
        ],
      },
      {
        id: "pp-food-sheet",
        name: "Food Paper Sheet",
        products: [
          // Revisi klien: Kertas Shawarma harus yang POLOS (bukan custom gambar).
          // Foto produknya juga perlu diganti ke versi polos.
          {
            code: "PP-SHAW30",
            name: "Kertas Shawarma",
            material: "Greaseproof paper",
            size: "30×30 cm",
            unit: "Rim",
            pack: "500 lembar / rim",
            moq: "5 rim",
          },
          {
            code: "PP-NASI-C-2535",
            name: "Kertas Nasi Coklat Warteg",
            material: "Food-grade paper",
            size: "25×35 cm",
            unit: "Pack",
            pack: "500 lembar / pack",
            moq: "5 pack",
          }, // TODO: konfirmasi ukuran & isi pack ke klien
          {
            code: "PP-NASI-P-2527",
            name: "Kertas Nasi Putih",
            material: "Food-grade paper",
            size: "25×27 cm",
            unit: "Pack",
            pack: "500 lembar / pack",
            moq: "5 pack",
          }, // TODO: konfirmasi ukuran & isi pack ke klien/ TODO: kalau Cap Gajah, cantumkan di nama; isi ukuran
          {
            code: "PP-BAKE",
            name: "Baking Paper",
            material: "Silicone-coated paper",
            size: "Standard roll",
            unit: "Roll",
            pack: "1 roll",
            moq: "20 unit",
          }, // TODO: isi ukuran
        ],
      },
    ],
  },
  {
    id: "cups",
    code: "CB",
    name: "Cups, Lids & Beverage Packaging",
    icon: Coffee,
    blurb:
      "Cup saus, bowl, gelas minuman, botol, dan perlengkapan minuman untuk cafe dan brand minuman.",
    categories: [
      {
        // Kode CB-035..CB-200 tidak diubah (mapping gambar).
        id: "cb-cup-saus",
        name: "Cup Saus & Dessert (+ Lid)",
        products: [
          {
            code: "CB-035",
            name: "Cup Saus 35 ml + Lid",
            material: "PP food-grade",
            size: "35 ml",
            unit: "Pack",
            pack: "50 set / sleeve",
            moq: "20 sleeve",
          },
          {
            code: "CB-100",
            name: "Cup Saus 100 ml + Lid",
            material: "PP food-grade",
            size: "100 ml",
            unit: "Pack",
            pack: "50 set / sleeve",
            moq: "20 sleeve",
          },
          {
            code: "CB-150",
            name: "Cup Saus 150 ml + Lid",
            material: "PP food-grade",
            size: "150 ml",
            unit: "Pack",
            pack: "50 set / sleeve",
            moq: "20 sleeve",
          },
        ],
      },
      {
        id: "cb-cup-bowl",
        name: "Cup Bowl (+ Lid)",
        products: [
          {
            code: "CB-200",
            name: "Cup Bowl 200 ml + Lid",
            material: "PP food-grade",
            size: "200 ml",
            unit: "Pack",
            pack: "50 set / sleeve",
            moq: "20 sleeve",
          }, // sudah dikonfirmasi: 200 ml = Bowl
          {
            code: "CB-400",
            name: "Cup Bowl 400 ml + Lid",
            material: "PP food-grade",
            size: "400 ml",
            unit: "Pack",
            pack: "50 set / sleeve",
            moq: "10 sleeve",
          }, // TODO: tebakan Bowl vs gelas, konfirmasi ke klien
          {
            code: "CB-650",
            name: "Cup Bowl 650 ml + Lid",
            material: "PP food-grade",
            size: "650 ml",
            unit: "Pack",
            pack: "50 set / sleeve",
            moq: "10 sleeve",
          },
        ],
      },
      {
        // BARU dari daftar PP Thinwall klien (tanpa brand). Isi di bawah hanya
        // produk DASAR tiap grup; ukuran lainnya dibuat di lib/variants.ts.
        // TODO: unit/pack/MOQ tebakan, belum ada di pricelist.
        id: "cb-thinwall",
        name: "Thinwall PP (+ Lid)",
        products: [
          {
            code: "CB-TWRC200",
            name: "PP Thinwall Rectangle 200 ml",
            material: "PP food-grade",
            size: "200 ml",
            unit: "Pack",
            pack: "1 pack",
            moq: "10 pack",
          },
          {
            code: "CB-TWSQ350",
            name: "PP Thinwall Square 350 ml",
            material: "PP food-grade",
            size: "350 ml",
            unit: "Pack",
            pack: "1 pack",
            moq: "10 pack",
          },
          {
            code: "CB-TWRD300",
            name: "PP Thinwall Round 300 ml",
            material: "PP food-grade",
            size: "300 ml",
            unit: "Pack",
            pack: "1 pack",
            moq: "10 pack",
          },
          {
            code: "CB-TWFB750",
            name: "PP Thinwall Food Box 750 ml",
            material: "PP food-grade",
            size: "750 ml",
            unit: "Pack",
            pack: "1 pack",
            moq: "10 pack",
          },
          {
            code: "CB-TWLB4A",
            name: "PP Thinwall LB Sekat 4 A",
            material: "PP food-grade",
            size: "Tipe A",
            unit: "Pack",
            pack: "1 pack",
            moq: "10 pack",
          },
        ],
      },
      {
        id: "cb-gelas",
        name: "Gelas Minuman",
        // Cup Plastik 10/12/14/16 oz (biasa) dan Custom 10/12/14/16 oz dibuat di
        // variants.ts dari CB-PL12 dan CB-PL16C.
        // TODO: dome lid belum ditambah sebagai produk (ada di gambar katalog)
        products: [
          {
            code: "CB-PL12",
            name: "Cup Plastik 12 oz",
            material: "PET",
            size: "12 oz",
            unit: "Pack",
            pack: "50 pcs / sleeve",
            moq: "20 sleeve",
          },
          {
            code: "CB-PL16",
            name: "Cup Plastik 16 oz",
            material: "PET",
            size: "16 oz",
            unit: "Pack",
            pack: "50 pcs / sleeve",
            moq: "20 sleeve",
          },
          {
            code: "CB-PL16C",
            name: "Cup Plastik 16 oz (Custom)",
            material: "PET",
            size: "16 oz",
            unit: "Pcs",
            pack: "500 pcs",
            moq: "5 karton",
          }, // TODO: cek isi pack & MOQ
          // Legacy: diganti Cup Kertas Polos & Cup Kertas Custom (4-16 oz) di variants.ts.
          {
            code: "CB-PPRCUP",
            name: "Cup Kertas (Custom)",
            material: "Paper",
            size: "Custom",
            unit: "Pack",
            pack: "1 pack",
            moq: "Sesuai permintaan",
          }, // TODO: material, ukuran, satuan, MOQ
        ],
      },
      {
        id: "cb-bottle",
        name: "Botol Plastik",
        products: [
          {
            code: "CB-BTL250",
            name: "Botol Plastik Pir",
            material: "PET",
            size: "250 ml",
            unit: "Btl",
            pack: "24 pcs / karton",
            moq: "5 karton",
          },
        ],
      },
      {
        id: "cb-perlengkapan",
        name: "Perlengkapan Minuman",
        products: [
          {
            code: "CB-STRAW",
            name: "Sedotan",
            material: "PP",
            size: "Standard",
            unit: "Pcs",
            pack: "500 pcs / pack",
            moq: "10 pack",
          }, // legacy → diganti Sedotan Steril/Nonsteril di variants.ts
          {
            code: "CB-STIRRER",
            name: "Stirrer Straw",
            material: "PP",
            size: "Standard",
            unit: "Pack",
            pack: "500 pcs / pack",
            moq: "10 pack",
          }, // legacy → varian 12/15/17 cm di variants.ts
          {
            code: "CB-TRAY4",
            name: "Drink Tray 4 Cup",
            material: "Recycled pulp",
            size: "4 cup",
            unit: "Pcs",
            pack: "50 pcs / karton",
            moq: "5 karton",
          },
          // Revisi klien: ukuran dihilangkan (size dikosongkan, baris Ukuran otomatis tidak tampil).
          {
            code: "CB-SEAL",
            name: "Plastik Sealed Minuman",
            material: "PP sealing film",
            size: "",
            unit: "Roll",
            pack: "1 roll",
            moq: "10 roll",
          },
        ],
      },
    ],
  },
  {
    id: "cutlery",
    code: "DC",
    name: "Disposable Cutlery & Tableware",
    icon: UtensilsCrossed,
    blurb:
      "Rangkaian alat makan sekali pakai untuk volume QSR, katering, dan delivery.",
    categories: [
      {
        // Semua tanpa brand. Varian warna (bening/putih/hitam) dibuat di variants.ts.
        id: "dc-cutlery",
        name: "Cutlery",
        products: [
          {
            code: "DC-FORK",
            name: "Garpu Makan Plastik",
            material: "PP",
            size: "Standard",
            unit: "Pack",
            pack: "50 pcs / pack",
            moq: "20 pack",
          }, // TODO: isi ukuran
          {
            code: "DC-SPOON",
            name: "Sendok Makan Plastik",
            material: "PP",
            size: "Standard",
            unit: "Pack",
            pack: "50 pcs / pack",
            moq: "20 pack",
          }, // TODO: isi ukuran
          {
            code: "DC-TSPOON",
            name: "Sendok Teh",
            material: "PP",
            size: "Mini",
            unit: "Pack",
            pack: "50 pcs / pack",
            moq: "20 pack",
          },
          {
            code: "DC-PUD",
            name: "Sendok Puding",
            material: "PP",
            size: "Mini",
            unit: "Pcs",
            pack: "50 pcs / pack",
            moq: "20 pack",
          },
          {
            code: "DC-SPFK",
            name: "Spoon Fork",
            material: "PP",
            size: "Standard",
            unit: "Pack",
            pack: "50 pcs / pack",
            moq: "20 pack",
          }, // TODO: isi ukuran
        ],
      },
    ],
  },
  {
    id: "plastics",
    code: "PB",
    name: "Plastic Bags & Films",
    icon: Recycle,
    blurb:
      "Kantong, plastik PE, klip, OPP, vacuum, dan wrapping untuk retail dan packing.",
    categories: [
      {
        id: "pb-kantong",
        name: "Kantong Plastik",
        // TODO: ukuran PB-15..PB-50 belum ada satuan (cm?)
        // PB-15/24/28/35 digabung jadi "Kantong Plastik" di variants.ts
        // (+ 17 dan 40 yang dibuat di sana). PB-50 = jumbo, tetap produk sendiri.
        products: [
          {
            code: "PB-15",
            name: "Kantong Plastik 15",
            material: "HDPE",
            size: "15",
            unit: "Pack",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
          {
            code: "PB-24",
            name: "Kantong Plastik 24",
            material: "HDPE",
            size: "24",
            unit: "Pack",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
          {
            code: "PB-28",
            name: "Kantong Plastik 28",
            material: "HDPE",
            size: "28",
            unit: "Pack",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
          {
            code: "PB-35",
            name: "Kantong Plastik 35",
            material: "HDPE",
            size: "35",
            unit: "Pack",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
          {
            code: "PB-50",
            name: "Kantong Plastik Jumbo 50",
            material: "HDPE",
            size: "50",
            unit: "Pack",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
          {
            code: "PB-GLS",
            name: "Kantong Gelas Jus",
            material: "OPP",
            size: "Standard",
            unit: "Pack",
            pack: "1 pack",
            moq: "10 pack",
          }, // legacy → varian 1 cup / 2 cup di variants.ts; TODO: konfirmasi "Juzz"
          {
            code: "PB-TR60100",
            name: "Kantong Plastik Sampah 60×100",
            material: "LDPE",
            size: "60×100 cm",
            unit: "Pack",
            pack: "1 pack",
            moq: "10 pack",
          }, // TODO: isi per pack
          {
            code: "PB-TR90120",
            name: "Kantong Plastik Sampah 90×120",
            material: "LDPE",
            size: "90×120 cm",
            unit: "Pack",
            pack: "1 pack",
            moq: "10 pack",
          }, // TODO: isi per pack
          {
            code: "PB-POLYP",
            name: "Polymailer Pink",
            material: "LDPE",
            size: "Standard",
            unit: "Pcs",
            pack: "100 pcs / pack",
            moq: "5 pack",
          }, // TODO: isi ukuran
        ],
      },
      {
        id: "pb-pe-sheet",
        name: "Plastik PE & Sheet",
        // Revisi klien: foto produk memakai gambar PENGGUNAAN produk.
        products: [
          {
            code: "PB-PE1025",
            name: "Plastik PE 10×25",
            material: "PE",
            size: "10×25 cm",
            unit: "Pack",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
          {
            code: "PB-PE1225",
            name: "Plastik PE 12×25",
            material: "PE",
            size: "12×25 cm",
            unit: "Pack",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
          {
            code: "PB-PE1530",
            name: "Plastik PE 15×30",
            material: "PE",
            size: "15×30 cm",
            unit: "Pack",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
          {
            code: "PB-PE2035",
            name: "Plastik PE 20×35",
            material: "PE",
            size: "20×35 cm",
            unit: "Pack",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
          {
            code: "PB-HEAT2035",
            name: "Plastik Anti Panas 20×35",
            material: "Nylon/PA",
            size: "20×35 cm",
            unit: "Pack",
            pack: "1 pack",
            moq: "10 pack",
          }, // TODO: isi per pack; cek material; kemungkinan sama dengan PB-PE2035
          {
            code: "PB-BWG1020",
            name: "Plastik Bawang 10×20",
            material: "HDPE",
            size: "10×20 cm",
            unit: "Pack",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
          {
            code: "PB-BWG1225",
            name: "Plastik Bawang 12×25",
            material: "HDPE",
            size: "12×25 cm",
            unit: "Pack",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
          {
            code: "PB-SHT2020",
            name: "Plastik Sheet 20×20",
            material: "PE",
            size: "20×20 cm",
            unit: "Pack",
            pack: "1 pack",
            moq: "10 pack",
          }, // TODO: isi per pack
          {
            code: "PB-SHT2535",
            name: "Plastik Sheet Alas 25×35",
            material: "PE",
            size: "25×35 cm",
            unit: "Pack",
            pack: "1 pack",
            moq: "10 pack",
          }, // TODO: isi per pack
          {
            code: "PB-SPR60100",
            name: "Plastik Suprah",
            material: "PE",
            size: "60×100 cm",
            unit: "Pack",
            pack: "1 pack",
            moq: "10 pack",
          }, // TODO: konfirmasi nama asli "Suprah"; isi per pack
        ],
      },
      {
        id: "pb-klip-opp",
        name: "Plastik Klip & OPP",
        // Ukuran acuan Klip & OPP di variants.ts sementara disamakan dengan Plastik
        // Bawang (16 ukuran). TODO: konfirmasi ke klien.
        products: [
          {
            code: "PB-CLIP58",
            name: "Plastik Klip 5×8",
            material: "PE",
            size: "5×8 cm",
            unit: "Pack",
            pack: "1 pack",
            moq: "10 pack",
          }, // TODO: isi per pack
          {
            code: "PB-CLIP107",
            name: "Plastik Klip 10×7",
            material: "PE",
            size: "10×7 cm",
            unit: "Pack",
            pack: "1 pack",
            moq: "10 pack",
          }, // TODO: isi per pack
          {
            code: "PB-CLIP1387",
            name: "Plastik Klip 13×8,7",
            material: "PE",
            size: "13×8,7 cm",
            unit: "Pack",
            pack: "1 pack",
            moq: "10 pack",
          }, // TODO: isi per pack
          {
            code: "PB-OPP722",
            name: "Plastik OPP 7×22",
            material: "OPP",
            size: "7×22 cm",
            unit: "Pack",
            pack: "1 pack",
            moq: "10 pack",
          }, // TODO: isi per pack
          {
            code: "PB-OPP925",
            name: "Plastik OPP 9×25",
            material: "OPP",
            size: "9×25 cm",
            unit: "Pack",
            pack: "1 pack",
            moq: "10 pack",
          }, // TODO: isi per pack
        ],
      },
      {
        id: "pb-vacuum-wrap",
        name: "Plastik Vacuum & Wrap",
        // Plastik Vacuum: 3 produk lama di bawah jadi legacy; diganti 2 produk
        // (Plastik Vacuum Emboss dan Polos), masing-masing 43 ukuran, di variants.ts.
        // Plastik Wrapping: ukuran 30/40/45 x 250/500 dibuat di variants.ts.
        products: [
          {
            code: "PB-VAC1218",
            name: "Plastik Vacuum 12×18",
            material: "PA/PE",
            size: "12×18 cm",
            unit: "Pcs",
            pack: "1 pack",
            moq: "10 pack",
          }, // TODO: isi per pack
          {
            code: "PB-VAC1520",
            name: "Plastik Vacuum 15×20",
            material: "PA/PE",
            size: "15×20 cm",
            unit: "Pcs",
            pack: "1 pack",
            moq: "10 pack",
          }, // TODO: isi per pack
          {
            code: "PB-VAC3040",
            name: "Plastik Vacuum 30×40",
            material: "PA/PE",
            size: "30×40 cm",
            unit: "Pcs",
            pack: "1 pack",
            moq: "10 pack",
          }, // TODO: isi per pack
          {
            code: "PB-WRAP30500",
            name: "Plastik Wrapping 30×500",
            material: "PVC/PE",
            size: "30 cm × 500 m",
            unit: "Roll",
            pack: "1 roll",
            moq: "10 roll",
          },
        ],
      },
    ],
  },
  {
    id: "ops",
    code: "OP",
    name: "Operational Supplies",
    icon: ShieldCheck,
    blurb:
      "Handglove, lakban, tali, thermal roll, dan tisu yang menjaga operasional back-of-house tetap jalan.",
    categories: [
      {
        // Semua tanpa brand. 4 produk lama jadi legacy; diganti 4 produk di variants.ts:
        // Handglove Nitrile, Latex Powder, Latex Non-powder, Plastik
        // (masing-masing ukuran XS-XL x warna putih/hitam).
        id: "op-glove",
        name: "Handglove",
        products: [
          {
            code: "OP-GLVL-S",
            name: "Handglove Latex S",
            material: "Latex",
            size: "S",
            unit: "Pack",
            pack: "100 pcs / box",
            moq: "5 box",
          },
          {
            code: "OP-GLVL-M",
            name: "Handglove Latex M",
            material: "Latex",
            size: "M",
            unit: "Pack",
            pack: "100 pcs / box",
            moq: "5 box",
          },
          {
            code: "OP-GLVL-L",
            name: "Handglove Latex L",
            material: "Latex",
            size: "L",
            unit: "Pack",
            pack: "100 pcs / box",
            moq: "5 box",
          },
          {
            code: "OP-GLVP",
            name: "Handglove Plastik",
            material: "PE",
            size: "Universal",
            unit: "Pack",
            pack: "100 pcs / box",
            moq: "5 box",
          },
        ],
      },
      {
        // Lakban Bening & Coklat jadi varian warna di variants.ts (+ Hitam, Putih,
        // Merah, Biru, Hijau, Pink). Lakban Fragile tetap produk sendiri.
        id: "op-tape",
        name: "Lakban",
        products: [
          {
            code: "OP-TAPE-CL",
            name: "Lakban Bening",
            material: "BOPP",
            size: "48 mm × 90 yard",
            unit: "Roll",
            pack: "6 roll / tube",
            moq: "5 tube",
          },
          {
            code: "OP-TAPE-BR",
            name: "Lakban Coklat",
            material: "BOPP",
            size: "48 mm × 90 yard",
            unit: "Roll",
            pack: "6 roll / tube",
            moq: "5 tube",
          },
          {
            code: "OP-TAPE-FR",
            name: "Lakban Fragile",
            material: "BOPP printed",
            size: "48 mm × 90 yard",
            unit: "Roll",
            pack: "6 roll / tube",
            moq: "5 tube",
          },
        ],
      },
      {
        id: "op-tali-karet",
        name: "Tali & Karet",
        products: [
          {
            code: "OP-RAFIA",
            name: "Tali Rafia",
            material: "PP fiber",
            size: "Standard",
            unit: "Roll",
            pack: "1 roll",
            moq: "10 roll",
          }, // legacy → varian 9 warna di variants.ts (tanpa brand)
          {
            code: "OP-RUBBER",
            name: "Karet Gelang",
            material: "Natural rubber",
            size: "Standard",
            unit: "Pack",
            pack: "1 kg / pack",
            moq: "5 kg",
          }, // TODO: isi ukuran
          // Kode lama: OT-BENANG. Revisi klien: nama "Benang Ayam / Tali Ayam", gambar tanpa brand.
          {
            code: "OP-BENANG",
            name: "Benang Ayam / Tali Ayam",
            material: "Cotton",
            size: "Standard",
            unit: "Pack",
            pack: "1 roll",
            moq: "10 roll",
          }, // TODO: isi ukuran
        ],
      },
      {
        id: "op-thermal-tisu",
        name: "Thermal & Tisu",
        // ON-RECHECK: OP-TISU sengaja belum diubah.
        products: [
          {
            code: "OP-TH5730",
            name: "Kertas Thermal 57×30",
            material: "Thermal-coated paper",
            size: "57×30 mm",
            unit: "Roll",
            pack: "10 roll / pack",
            moq: "5 pack",
          },
          {
            code: "OP-TH8080",
            name: "Kertas Thermal 80×80",
            material: "Thermal-coated paper",
            size: "80×80 mm",
            unit: "Roll",
            pack: "10 roll / pack",
            moq: "5 pack",
          },
          // BARU dari compro: "Tisu semua ukuran, jenis dan merk"
          {
            code: "OP-TISU",
            name: "Tisu",
            material: "Paper",
            size: "Standard",
            unit: "Pack",
            pack: "1 pack",
            moq: "10 pack",
          }, // TODO: jenis/ukuran (tisu makan, wajah, gulung, dll.), satuan, MOQ
        ],
      },
    ],
  },
  {
    id: "ingredients",
    code: "FI",
    name: "Food Ingredients & Raw Materials",
    icon: Wheat,
    blurb: "Bahan baku pilihan untuk bakery dan commissary.",
    categories: [
      {
        id: "fi-bahan-baku",
        name: "Bahan Baku",
        products: [
          {
            code: "FI-ALMND",
            name: "Kacang Almond Sliced",
            material: "Almond",
            size: "Bulk",
            unit: "Kg",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
          // Revisi klien: Kelapa Parut Kering per 500 gram.
          {
            code: "FI-COCO",
            name: "Kelapa Parut Kering",
            material: "Coconut",
            size: "500 g",
            unit: "Pack",
            pack: "500 g / pack",
            moq: "10 pack",
          },
          // BARU (revisi klien)
          {
            code: "FI-KISMIS",
            name: "Kismis",
            material: "Raisin",
            size: "Bulk",
            unit: "Kg",
            pack: "1 kg / pack",
            moq: "5 kg",
          }, // TODO: isi pack & MOQ
          // BARU (revisi klien): Puff Pastry (tanpa brand), 2 berat (750 g & 375 g).
          // Varian 375 g dibuat di variants.ts.
          {
            code: "FI-PUFF750",
            name: "Puff Pastry 750 g",
            material: "Pastry dough",
            size: "750 g",
            unit: "Pack",
            pack: "1 pack",
            moq: "10 pack",
          }, // TODO: isi pack & MOQ
        ],
      },
    ],
  },
  {
    id: "other",
    code: "OT",
    name: "Other Supplies",
    icon: Layers,
    blurb:
      "Kebutuhan dapur, bakery, dan grill yang melengkapi pesanan full-service.",
    categories: [
      {
        id: "ot-grill",
        name: "Arang & Tusuk",
        products: [
          // Kode lama: FI-ARANG. Diganti supaya awalan sesuai divisi.
          {
            code: "OT-ARANG",
            name: "Arang Batok Kelapa",
            material: "Coconut shell",
            size: "Bulk",
            unit: "Kg",
            pack: "10 kg / karung",
            moq: "5 karung",
          },
          {
            code: "OT-TUSUK",
            name: "Tusuk Sate",
            material: "Bamboo",
            size: "Standard",
            unit: "Pack",
            pack: "1 pack",
            moq: "10 pack",
          }, // TODO: isi ukuran & per pack
          // BARU dari compro: "Tusuk gigi"
          {
            code: "OT-TUSUKGIGI",
            name: "Tusuk Gigi",
            material: "Bamboo",
            size: "Standard",
            unit: "Pack",
            pack: "1 pack",
            moq: "10 pack",
          }, // TODO: material, ukuran, satuan, MOQ
        ],
      },
      {
        id: "ot-dapur-bakery",
        name: "Dapur & Bakery",
        products: [
          {
            code: "OT-TAMPAH",
            name: "Tampah Nampan",
            material: "Bamboo",
            size: "Standard",
            unit: "Pcs",
            pack: "1 pcs",
            moq: "20 pcs",
          }, // legacy → varian 30/40/50 di variants.ts
          {
            code: "OT-PAPING-BSR",
            name: "Paping Bag Besar",
            material: "LDPE",
            size: "Besar",
            unit: "Pack",
            pack: "1 pack",
            moq: "10 pack",
          }, // TODO: "Paping Bag" apa adanya, atau "Piping Bag (Paping)"; cek material; isi ukuran & per pack
          {
            code: "OT-PAPING-KCL",
            name: "Paping Bag Kecil",
            material: "LDPE",
            size: "Kecil",
            unit: "Pack",
            pack: "1 pack",
            moq: "10 pack",
          }, // TODO: sama seperti di atas
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// LAYOUT = STRUKTUR KATEGORI FINAL (Okt 2026): 8 Kategori, 19 Subkategori.
// Inilah yang tampil di Header, sidebar, dan katalog. Pindah produk antar
// subkategori = pindahkan KODE-nya di sini saja.
// ---------------------------------------------------------------------------
type LayoutCategory = { id: string; name: string; codes: string[] };
type Layout = Omit<Division, "categories"> & { categories: LayoutCategory[] };

const LAYOUT: Layout[] = [
  {
    id: "foil",
    code: "AF",
    name: "Aluminium Foil",
    icon: Package,
    blurb:
      "Aluminium foil roll dan foil tray beserta lid untuk kebutuhan pengemasan makanan.",
    categories: [
      {
        // Pengecualian aturan "min. 2 kartu": 1 kartu tapi 7 ukuran.
        id: "af-roll",
        name: "Foil Roll",
        codes: ["AF-RL-45-76", "AF-RL-45-300"],
      },
      {
        id: "af-tray",
        name: "Foil Tray",
        codes: [
          "AF-BX4381",
          "AF-BX52180",
          "AF-RX145",
          "AF-RX725",
          "AF-RX1200",
          "AF-OX1400",
        ],
      },
    ],
  },
  {
    id: "paper",
    code: "PP",
    name: "Paper & Corrugated Packaging",
    icon: Boxes,
    blurb:
      "Bento, kraft, dus corrugated, dan kertas makanan untuk delivery, retail, dan pengiriman.",
    categories: [
      {
        id: "pp-foodbox",
        name: "Food Box & Bento",
        codes: ["PP-TW-ALL", "PP-BENTO", "PP-KFT181105"],
      },
      {
        id: "pp-dus-bag",
        name: "Dus, Bag & Mailer",
        // data.ts → LAYOUT → id: "pp-dus-bag"
        codes: [
          "PP-DUS151005",
          "PP-DUS252010",
          "PP-DUS392624",
          "PP-DUS604030", // sebelumnya "PP-DUSXL"
          "PP-BAG-S",
          "PP-BAG-M",
          "PP-BAG-L",
          "PB-POLYP",
        ],
      },
      {
        id: "pp-food-paper",
        name: "Food Paper",
        codes: ["PP-SHAW30", "PP-NASI-C-2535", "PP-NASI-P-2527", "PP-BAKE"],
      },
    ],
  },
  {
    id: "cups",
    code: "CB",
    name: "Cups, Lids & Beverage Packaging",
    icon: Coffee,
    blurb:
      "Cup saus, bowl, gelas minuman, botol, dan pelengkap minuman untuk cafe dan brand minuman.",
    categories: [
      {
        id: "cb-thinwall",
        name: "Cup Saus & Bowl",
        codes: [
          "CB-035",
          "CB-100",
          "CB-150",
          "CB-200",
          "CB-400",
          "CB-650",
          "CB-TWRC200",
          "CB-TWSQ350",
          "CB-TWRD300",
          "CB-TWFB750",
          "CB-TWLB4A",
        ],
      },
      {
        id: "cb-kemasan-minuman",
        name: "Kemasan Minuman",
        codes: ["CB-PL12", "CB-PL16", "CB-PL16C", "CB-PPRCUP", "CB-BTL250"],
      },
      {
        id: "cb-pelengkap",
        name: "Pelengkap Minuman",
        codes: ["CB-STRAW", "CB-STIRRER", "CB-TRAY4", "CB-SEAL"],
      },
    ],
  },
  {
    id: "cutlery",
    code: "DC",
    name: "Disposable Cutlery & Tableware",
    icon: UtensilsCrossed,
    blurb:
      "Rangkaian alat makan sekali pakai untuk volume QSR, katering, dan delivery.",
    categories: [
      {
        id: "dc-cutlery",
        name: "Cutlery",
        codes: ["DC-FORK", "DC-SPOON", "DC-TSPOON", "DC-PUD", "DC-SPFK"],
      },
    ],
  },
  {
    id: "plastics",
    code: "PB",
    name: "Plastic Bags & Films",
    icon: Recycle,
    blurb:
      "Kantong, plastik PE, klip, OPP, vacuum, dan wrapping untuk retail dan packing.",
    categories: [
      {
        id: "pb-kantong",
        name: "Kantong",
        codes: [
          "PB-15",
          "PB-24",
          "PB-28",
          "PB-35",
          "PB-50",
          "PB-GLS",
          "PB-TR60100",
          "PB-TR90120",
        ],
      },
      {
        id: "pb-pe-sheet",
        name: "Plastik PE & Sheet",
        codes: [
          "PB-PE1025",
          "PB-PE1225",
          "PB-PE1530",
          "PB-PE2035",
          "PB-HEAT2035",
          "PB-BWG1020",
          "PB-BWG1225",
          "PB-SHT2020",
          "PB-SHT2535",
          "PB-SPR60100",
        ],
      },
      {
        id: "pb-klip-opp",
        name: "Klip & OPP",
        codes: [
          "PB-CLIP58",
          "PB-CLIP107",
          "PB-CLIP1387",
          "PB-OPP722",
          "PB-OPP925",
        ],
      },
      {
        id: "pb-kemasan-produk",
        name: "Kemasan Produk",
        codes: ["PB-VAC1218", "PB-VAC1520", "PB-VAC3040", "PB-WRAP30500"],
      },
    ],
  },
  {
    id: "ops",
    code: "OP",
    name: "Operational Supplies",
    icon: ShieldCheck,
    blurb:
      "Handglove, tisu, kertas kasir, lakban, dan tali yang menjaga operasional back-of-house tetap jalan.",
    categories: [
      {
        id: "op-outlet",
        name: "Outlet Supplies",
        codes: [
          "OP-GLVL-S",
          "OP-GLVL-M",
          "OP-GLVL-L",
          "OP-GLVP",
          "OP-TISU",
          "OP-TH5730",
          "OP-TH8080",
        ],
      },
      {
        id: "op-packing",
        name: "Packing",
        codes: [
          "OP-TAPE-CL",
          "OP-TAPE-BR",
          "OP-TAPE-FR",
          "OP-RAFIA",
          "OP-RUBBER",
        ],
      },
    ],
  },
  {
    id: "ingredients",
    code: "FI",
    name: "Food Ingredients & Raw Materials",
    icon: Wheat,
    blurb: "Bahan baku pilihan untuk bakery dan commissary.",
    categories: [
      {
        id: "fi-bahan-baku",
        name: "Bahan Baku",
        codes: ["FI-ALMND", "FI-COCO", "FI-KISMIS", "FI-PUFF750"],
      },
    ],
  },
  {
    id: "other",
    code: "OT",
    name: "Other Supplies",
    icon: Layers,
    blurb:
      "Kebutuhan dapur, bakery, dan grill yang melengkapi pesanan full-service.",
    categories: [
      {
        id: "ot-grill",
        name: "Arang & Tusuk",
        codes: ["OT-ARANG", "OT-TUSUK", "OT-TUSUKGIGI"],
      },
      {
        id: "ot-dapur-bakery",
        name: "Dapur & Bakery",
        codes: ["OT-TAMPAH", "OT-PAPING-BSR", "OT-PAPING-KCL", "OP-BENANG"],
      },
    ],
  },
];

const RAW_BY_CODE = new Map(
  RAW_DIVISIONS.flatMap((d) => d.categories.flatMap((c) => c.products)).map(
    (p) => [p.code, p],
  ),
);

// Produk yang disembunyikan sementara dari katalog. Data tetap ada di
// RAW_DIVISIONS dan LAYOUT. Kosongkan set ini untuk menampilkannya lagi.
// (Pasangannya: DISABLED_GROUP_IDS di lib/variants.ts.)
const DISABLED_CODES = new Set([
  "CB-TWRC200",
  "CB-TWSQ350",
  "CB-TWRD300",
  "CB-TWFB750",
  "CB-TWLB4A",
]);

export const DIVISIONS: Division[] = LAYOUT.map((d) => ({
  ...d,
  categories: d.categories.map((c) => ({
    id: c.id,
    name: c.name,
    products: c.codes.flatMap((code) => {
      if (DISABLED_CODES.has(code)) return [];
      const p = RAW_BY_CODE.get(code);
      if (!p && process.env.NODE_ENV !== "production") {
        console.warn(
          `[data] kode "${code}" di LAYOUT tidak ada di RAW_DIVISIONS`,
        );
      }
      return p ? [p] : [];
    }),
  })),
}));

// Pengaman: produk di RAW_DIVISIONS yang lupa didaftarkan ke LAYOUT tidak
// akan tampil di katalog, jadi dikasih peringatan saat dev.
if (process.env.NODE_ENV !== "production") {
  const placed = new Set(
    LAYOUT.flatMap((d) => d.categories.flatMap((c) => c.codes)),
  );
  for (const code of RAW_BY_CODE.keys()) {
    if (!placed.has(code)) {
      console.warn(`[data] produk "${code}" belum masuk LAYOUT`);
    }
  }
}

export const ALL_PRODUCTS: Product[] = DIVISIONS.flatMap((d) =>
  d.categories.flatMap((c) =>
    c.products.map((p) => ({
      ...p,
      divisionId: d.id,
      divisionName: d.name,
      categoryId: c.id,
      categoryName: c.name,
    })),
  ),
);

export function getProductBySlug(slug: string): Product | undefined {
  return ALL_PRODUCTS.find((p) => p.code.toLowerCase() === slug.toLowerCase());
}

// Produk unggulan di homepage. Urutan di sini = urutan tampil.
// Ganti produk cukup dengan edit daftar kode ini. Kode yang salah ketik atau
// sudah dihapus dari katalog otomatis dilewati.
// Homepage sebaiknya memakai getFeaturedCatalogProducts(FEATURED_CODES) dari
// lib/variants.ts: kode legacy (mis. OP-GLVL-M, OP-RAFIA, OT-TAMPAH) otomatis
// jadi varian pertama grupnya, dan satu grup hanya tampil sekali.
export const FEATURED_CODES = [
  "AF-RL-45-300", // Aluminium Foil 45 cm × 300 m
  "AF-OX1400", // Aluminium Foil OX1400 + Lid
  "PP-BENTO", // Bento Box
  "CB-100", // Cup Saus 100 ml + Lid
  "CB-400", // Cup Bowl 400 ml + Lid
  "PP-NASI-P-2527", // Kertas Nasi Putih // Kertas Nasi Putih
  "DC-SPOON", // Sendok Makan Plastik
  "DC-SPFK", // Spoon Fork
  "PB-15", // Kantong Plastik 15
  "PB-50", // Kantong Plastik 50
  "PB-TR90120", // Kantong Plastik Sampah 90×120
  "PB-BWG1020", // Plastik Bawang 10×20 (TODO: atau 12×25?)
  "PB-WRAP30500", // Plastik Wrapping 30×500
  "FI-ALMND", // Kacang Almond Sliced
  "OT-TAMPAH", // Tampah Nampan
  "OP-GLVL-M", // Handglove Latex M
  "OP-TAPE-FR", // Lakban Fragile
  "OP-BENANG", // Benang Ayam
  "OP-RAFIA", // Tali Rafia
  "OP-TH5730", // Kertas Thermal 57×30
  "OP-TISU", // Tisu
];

export function getFeaturedProducts(): Product[] {
  return FEATURED_CODES.map((code) => getProductBySlug(code)).filter(
    (p): p is Product => p !== undefined,
  );
}

// Manifest gambar produk, di-generate otomatis oleh
// scripts/generate-image-manifest.mjs dari isi folder public/products/.
// Jangan diedit manual — cukup taruh file gambar dan jalankan `npm run dev`
// atau `npm run generate:images`.
const IMAGE_MAP = productImages as Record<string, string>;

export function hasProductImage(code: string): boolean {
  return code in IMAGE_MAP;
}

export function getProductImagePath(code: string): string | undefined {
  return IMAGE_MAP[code];
}

// Industri yang ditampilkan di homepage. Compro menyebut tiga segmen utama:
// Hotel, Restoran, Katering. Kafe didukung klien (Teman Coffee). Bakery
// ditambahkan karena katalog punya produk bakery (almond slice, kelapa parut,
// baking paper, paping bag). Segmen lain (Pabrik Makanan, Distributor, Ritel,
// Rumah Sakit, UMKM) DISEMBUNYIKAN dulu karena belum ada dasarnya di
// compro/daftar klien — kembalikan kalau sudah dikonfirmasi klien.
export const INDUSTRIES = ["Restoran", "Hotel", "Katering", "Kafe", "Bakery"];

export const INDUSTRY_IMAGES: Record<string, string> = {
  Restoran: "/industries/restoran.png",
  Kafe: "/industries/kafe.png",
  Hotel: "/industries/hotel.png",
  Bakery: "/industries/bakery.png",
  "Pabrik Makanan": "/industries/pabrik.png",
  Distributor: "/industries/distributor.png",
  "Ritel & Supermarket": "/industries/ritel.png",
  "Rumah Sakit": "/industries/rumah-sakit.png",
  Katering: "/industries/katering.png",
  UMKM: "/industries/umkm.png",
};

const INDUSTRY_ICON_RULES: [RegExp, LucideIcon][] = [
  [/kafe|coffee|kedai/i, Coffee],
  [/katering|resto|restoran|dapur|f&b|f & b/i, UtensilsCrossed],
  [/hotel|hospitality|resort|penginapan/i, Hotel],
  [/ritel|retail|minimarket|supermarket/i, ShoppingCart],
  [/distributor|grosir|wholesaler/i, Truck],
  [/toko|warung|outlet/i, Store],
  [/rumah sakit|klinik|institusi|sekolah|kampus/i, Building2],
  [/catering event|banquet|jasa boga/i, UtensilsCrossed],
];

export function getIndustryImage(name: string) {
  return INDUSTRY_IMAGES[name] ?? "/industries/default.png";
}

export function getIndustryIcon(name: string) {
  const match = INDUSTRY_ICON_RULES.find(([pattern]) => pattern.test(name));
  return match ? match[1] : Package;
}

// Dihitung otomatis dari data supaya selalu cocok dengan katalog.
// CATATAN: ini baru menghitung produk DASAR (belum termasuk varian di
// variants.ts), jadi angkanya lebih kecil dari isi katalog sebenarnya.
const TOTAL_SKU = ALL_PRODUCTS.length;
// Dibulatkan ke bawah per 10, jadi selalu jujur dan ikut naik sendiri kalau
// produk bertambah.
const SKU_DIBULATKAN = Math.floor(TOTAL_SKU / 10) * 10;
const TOTAL_JENIS_PRODUK = DIVISIONS.reduce(
  (n, d) => n + d.categories.length,
  0,
);

// STATS dipakai di StatsBar halaman Keunggulan (app/keunggulan). `icon` adalah
// key string yang di-resolve di components/StatsBar.tsx. Klaim "100% batch
// lolos QC" dihapus (tidak ada di compro). "24 Jam" dipakai lagi atas
// keputusan owner, dengan label "Layanan responsif" (nyambung ke poin WHY_US
// "Layanan cepat & responsif") — pastikan memang bisa dipenuhi tim.
export const STATS = [
  { value: `${SKU_DIBULATKAN}+`, label: "SKU produk", icon: "package" },
  {
    value: `${TOTAL_JENIS_PRODUK}`,
    label: "Jenis produk",
    icon: "layout-grid",
  },
  { value: "24 Jam", label: "Layanan responsif", icon: "clock" },
  { value: "2020", label: "Berdiri sejak", icon: "calendar" },
];

// TODO: PROCESS berisi klaim ("stock real", "produksi custom") yang belum
// diverifikasi ke compro/klien. Dibiarkan apa adanya karena belum dipakai di
// homepage — cek dulu sebelum dipakai di halaman lain.
export const PROCESS = [
  {
    step: "01",
    title: "Ajukan quotation",
    body: "Kirim daftar produk atau shopping list kamu — kami hitung berdasarkan stock real, bukan perkiraan.",
  },
  {
    step: "02",
    title: "Konfirmasi spesifikasi",
    body: "Kami samakan material, ukuran, printing, dan MOQ sebelum invoice diterbitkan.",
  },
  {
    step: "03",
    title: "Produksi & packing",
    body: "Item yang ready stock langsung dipacking; produksi custom dijadwalkan dan dikonfirmasi.",
  },
  {
    step: "04",
    title: "Pengiriman",
    body: "Pesanan dikonsolidasi, didokumentasikan, dan dikirim sesuai rute serta jadwal yang disepakati.",
  },
];

// Testimoni lama berisi kutipan karangan (placeholder) dan sudah dihapus.
// Isi hanya dengan kutipan klien ASLI (dengan izin). Entri di bawah dipakai
// sebagai pull-quote di halaman Keunggulan — `org` harus persis cocok dengan
// yang dicari di KeunggulanPage.
export const TESTIMONIALS: { quote: string; name: string; org: string }[] = [
  {
    quote:
      "Satu supplier buat hampir semua kebutuhan operasional kami. Sourcing yang dulu ribet, sekarang simpel.",
    name: "Procurement Manager",
    org: "Hotel & Resort Group",
  },
];
