// lib/variants.ts  (REVISI Okt 2026 — revisi klien #1-26)
// Lapisan varian di atas lib/data.ts. data.ts TIDAK diubah.
//
// Konsep:
//  - GroupDef  = satu produk di katalog (mis. "Handglove Nitrile") dengan beberapa opsi.
//  - VariantDef = satu kombinasi opsi, punya `code` sendiri (dipakai untuk URL, cart, gambar).
//  - Kalau `code` varian sudah ada di ALL_PRODUCTS, produk lama itu dipakai apa adanya.
//    Kalau belum ada, produknya dibuat otomatis dengan menyalin field dari `baseCode`
//    (+ `overrides` grup + `patch` varian).
//  - `legacyCodes` = produk lama di data.ts yang sudah digantikan grup. Disembunyikan dari
//    CATALOG_PRODUCTS; URL lama tetap jalan (diarahkan ke varian pertama grup).
import { ALL_PRODUCTS, hasProductImage } from "@/lib/data";
import type { Product } from "@/lib/data";

export type OptionDef = {
  key: string; // mis. "ukuran", "warna", "tipe"
  label: string; // tampil di UI, mis. "Ukuran"
  swatches?: Record<string, string>; // nilai -> hex, untuk chip warna
};
export type VariantDef = {
  code: string;
  values: Record<string, string>;
  patch?: Partial<Product>; // override field produk khusus varian ini (hanya untuk yang auto-generate)
};
export type GroupDef = {
  id: string;
  name: string; // judul di katalog & detail
  baseCode: string; // kode produk lama untuk disalin field-nya
  options: OptionDef[]; // urutan = urutan baris chip di detail
  variants: VariantDef[]; // urutan = urutan chip
  imageCode?: string; // gambar gabungan; default: varian pertama yang punya gambar
  legacyCodes?: string[]; // produk lama di data.ts yang digantikan grup ini
  overrides?: Partial<Product>; // override field untuk semua varian auto-generate (mis. material)
  // Key nilai yang dipakai untuk field `size` produk auto-generate; default "ukuran".
  // Harus data biasa (bukan fungsi): GroupDef dikirim dari server component ke client component.
  sizeKey?: string;
};

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

// Generator kombinasi: dimensi pertama berubah paling lambat.
function combos(
  dims: { key: string; values: string[] }[],
  codeOf: (v: Record<string, string>) => string,
  skip?: (v: Record<string, string>) => boolean,
): VariantDef[] {
  let acc: Record<string, string>[] = [{}];
  for (const d of dims) {
    acc = acc.flatMap((a) => d.values.map((val) => ({ ...a, [d.key]: val })));
  }
  return acc
    .filter((v) => !skip?.(v))
    .map((values) => ({ code: codeOf(values), values }));
}

// Grup satu opsi. `pairs` = [nilai, kode]. Kode yang sudah ada di data.ts dipakai apa adanya.
function simple(
  id: string,
  name: string,
  baseCode: string,
  key: string,
  label: string,
  pairs: [string, string][],
  extra: Partial<GroupDef> & { swatches?: Record<string, string> } = {},
): GroupDef {
  const { swatches, ...rest } = extra;
  return {
    id,
    name,
    baseCode,
    options: [{ key, label, swatches }],
    variants: pairs.map(([val, code]) => ({ code, values: { [key]: val } })),
    ...rest,
  };
}

// Ukuran "LxP" (cm). Urut numerik. Kode = prefix + angka tanpa "x" dan ",".
// Contoh: bawang "10x20" -> PB-BWG1020 (cocok dengan kode lama di data.ts).
const sortSizes = (a: string, b: string) => {
  const p = (s: string) =>
    s.split("x").map((n) => parseFloat(n.replace(",", ".")));
  const [aw, ah] = p(a);
  const [bw, bh] = p(b);
  return aw - bw || ah - bh;
};
const sizeVariants = (prefix: string, sizes: string[]): VariantDef[] =>
  [...new Set(sizes)].sort(sortSizes).map((s) => ({
    code: `${prefix}${s.replace(/[x,]/g, "")}`,
    values: { ukuran: `${s.replace("x", "×")} cm` },
  }));

// ---------------------------------------------------------------------------
// Data ukuran / warna
// ---------------------------------------------------------------------------

const GLOVE_SIZES = ["XS", "S", "M", "L", "XL"];
const GLOVE_COLORS = ["Putih", "Hitam"];
const glovePrefix = (w: string) => (w === "Putih" ? "P" : "H");
const GLOVE_SWATCH = { Putih: "#FFFFFF", Hitam: "#1F1F1F" };

// Ukuran acuan Google (revisi klien #12). Dipakai Plastik Bawang, Klip, OPP.
const REF_SIZES = [
  "6x30",
  "9x20",
  "10x20",
  "10x25",
  "12x25",
  "12x30",
  "14x35",
  "15x30",
  "17x35",
  "20x35",
  "20x40",
  "30x45",
  "35x50",
  "40x60",
  "50x75",
  "60x100",
];

// 43 ukuran Plastik Vacuum dari klien (dipakai Emboss dan Polos).
const VACUUM_SIZES = [
  "6x8",
  "7x10",
  "7x12",
  "8x12",
  "6,5x15",
  "8x15",
  "9x14",
  "10x15",
  "11x16",
  "12x17",
  "12x20",
  "12x25",
  "14x16",
  "14x18",
  "14x28",
  "14x22",
  "15x20",
  "16x21",
  "15x25",
  "17x22",
  "17x25",
  "20x25",
  "16,5x27,5",
  "18x28",
  "20x27",
  "17x30",
  "20x30",
  "25x30",
  "20x20",
  "27x34",
  "13x36",
  "15x27",
  "15x30",
  "15x35",
  "16x24",
  "23x30",
  "22x32",
  "23x34",
  "25x35",
  "25x37,5",
  "27x40",
  "22x45",
  "30x40",
];

const CUTLERY_COLORS: [string, string][] = [
  ["Bening", "BNG"],
  ["Putih", "PTH"],
  ["Hitam", "HTM"],
];
const CUTLERY_SWATCH = {
  Bening: "#F3F4F6",
  Putih: "#FFFFFF",
  Hitam: "#1F1F1F",
};
// Cutlery tidak punya foto gabungan, jadi "gambar awal" kartu katalog = varian
// pertama grup. `defaultColor` menentukan warna mana yang jadi varian pertama
// (default kartu, pilihan awal di detail, dan tujuan URL lama). Sisanya tetap
// urut Bening, Putih, Hitam.
function cutlery(
  id: string,
  name: string,
  baseCode: string,
  defaultColor = "Bening",
): GroupDef {
  const colors = [
    ...CUTLERY_COLORS.filter(([c]) => c === defaultColor),
    ...CUTLERY_COLORS.filter(([c]) => c !== defaultColor),
  ];
  return simple(
    id,
    name,
    baseCode,
    "warna",
    "Warna",
    colors.map(([c, s]) => [c, `${baseCode}-${s}`]),
    { swatches: CUTLERY_SWATCH, legacyCodes: [baseCode] },
  );
}

// ---------------------------------------------------------------------------
// GROUPS
// ---------------------------------------------------------------------------
// ALL_GROUPS = semua grup. GROUPS (di bawah) = ALL_GROUPS tanpa grup yang
// sedang dinonaktifkan (lihat DISABLED_GROUP_IDS).
const ALL_GROUPS: GroupDef[] = [
  // ===== Aluminium Foil =====
  // Foil Roll: lebar x panjang. Hanya kombinasi yang dijual (acuan marketplace + kode lama):
  // 30x7,6 · 45x7,6 · 45x75 · 30x150 · 45x150 · 45x300. Isi per pack/box/karton tidak dipakai.
  // Semua kode mengikuti pola AF-RL-<lebar>-<panjang>; nama file gambar harus sama.
  // AF-RL-45-76 = 45x7,6 dan AF-RL-45-300 = 45x300 (dulu AF-021 dan AF-014), dipakai apa adanya dari data.ts.
  // TODO: konfirmasi 45x300 m masih dijual; daftar acuan baris terakhir (45x150) terpotong.
  simple(
    "foil-roll",
    "Aluminium Foil Roll",
    "AF-RL-45-76",
    "ukuran",
    "Ukuran",
    [
      ["30 cm × 7,6 m", "AF-RL-30-76"],
      ["45 cm × 7,6 m", "AF-RL-45-76"],
      ["45 cm × 75 m", "AF-RL-45-75"],
      ["30 cm × 150 m", "AF-RL-30-150"],
      ["45 cm × 150 m", "AF-RL-45-150"],
      ["30 cm × 300 m", "AF-RL-30-300"],
      ["45 cm × 300 m", "AF-RL-45-300"],
    ],
  ),
  // Foil Tray (BX4381, RX1200, dst) = beda tipe, jadi produk sendiri-sendiri (tidak digabung).

  // Brown Paper Thinwall: 650 ml & 800 ml (revisi klien).
  // PP-TW800 = produk lama, dipakai apa adanya. PP-TW650 baru (salin dari PP-TW800).
  // TODO: cek isi pack & MOQ untuk 650 ml (sementara sama dengan 800 ml).
  // Kraft Food Box: XS-XL (revisi klien). Semua kode baru (salin dari PP-KFT181105).
  // PP-KFT181105 (18×11×5) jadi legacy: disembunyikan, URL lamanya diarahkan ke varian XS.
  // Kraft Food Box: S / M / L (revisi klien). Semua kode baru (salin dari PP-KFT181105).
  // PP-KFT181105 (18×11×5) jadi legacy: disembunyikan, URL lamanya diarahkan ke varian S.
  // TODO: isi dimensi tiap ukuran lewat `patch` kalau sudah ada; cek isi pack & MOQ.
  // ===== Paper & Corrugated =====
  // Brown Paper Thinwall: 650 ml & 800 ml (revisi klien).
  // PP-TW800 = produk lama, dipakai apa adanya. PP-TW650 baru (salin dari PP-TW800).
  // TODO: cek isi pack & MOQ untuk 650 ml (sementara sama dengan 800 ml).
  // Kertas Nasi: Coklat (warteg) dan Putih = 2 produk terpisah (beda jenis kertas).
  // Kode lama (PP-NASI-C / PP-NASI-P) = ukuran pertama, dipakai apa adanya dari data.ts.
  // TODO: ukuran dari hasil Google, konfirmasi ke klien; isi pack disalin dari produk dasar.
  simple(
    "kertas-nasi-putih",
    "Kertas Nasi Putih",
    "PP-NASI-P-2527",
    "ukuran",
    "Ukuran",
    [
      ["22×27 cm", "PP-NASI-P-2227"],
      ["25×27 cm", "PP-NASI-P-2527"],
    ],
    { legacyCodes: ["PP-NASI-P"] },
  ),
  simple(
    "kertas-nasi-coklat",
    "Kertas Nasi Coklat Warteg",
    "PP-NASI-C-2535",
    "ukuran",
    "Ukuran",
    [
      ["25×35 cm", "PP-NASI-C-2535"],
      ["27×36 cm", "PP-NASI-C-2736"],
      ["30×30 cm", "PP-NASI-C-3030"],
      ["30×40 cm", "PP-NASI-C-3040"],
    ],
    { legacyCodes: ["PP-NASI-C"] },
  ),

  simple(
    "brown-paper-thinwall",
    "Brown Paper Thinwall",
    "PP-TW-ALL",
    "ukuran",
    "Ukuran",
    [
      ["650 ml", "PP-TW650"],
      ["800 ml", "PP-TW800"],
    ],
    { imageCode: "PP-TW-ALL", legacyCodes: ["PP-TW-ALL"] },
  ),
  // Kraft Food Box: S / M / L (revisi klien). Semua kode baru (salin dari PP-KFT181105).
  // PP-KFT181105 (18×11×5) jadi legacy: disembunyikan, URL lamanya diarahkan ke varian S.
  // Gambar default = foto komparasi S/M/L (PP-KFT-ALL), foto per ukuran muncul setelah chip dipilih.
  // Dimensi asli: S 13×8×5 · M 16×9×5 · L 18×11×5 cm (belum ditampilkan, lihat catatan di bawah).
  // TODO: cek isi pack & MOQ per ukuran.
  simple(
    "kraft-food-box",
    "Kraft Food Box",
    "PP-KFT181105",
    "ukuran",
    "Ukuran",
    ["S", "M", "L"].map((s) => [s, `PP-KFT-${s}`] as [string, string]),
    { legacyCodes: ["PP-KFT181105"], imageCode: "PP-KFT-ALL" },
  ),
  simple(
    "dus",
    "Dus Corrugated",
    "PP-DUS151005",
    "ukuran",
    "Ukuran",
    [
      ["15×10×5 cm", "PP-DUS151005"],
      ["25×20×10 cm", "PP-DUS252010"],
      ["39×26×24 cm", "PP-DUS392624"],
      ["60×40×30 cm (Big Order)", "PP-DUS604030"], // sebelumnya "PP-DUSXL"
    ],
    { imageCode: "PP-DUS-ALL" },
  ),
  {
    id: "paper-bag",
    name: "Paper Bag",
    baseCode: "PP-BAG-L",
    imageCode: "PP-BAG-ALL", // sebelumnya "PP-BAG-L"
    options: [{ key: "ukuran", label: "Ukuran" }],
    variants: [
      { code: "PP-BAG-S", values: { ukuran: "S" } },
      { code: "PP-BAG-M", values: { ukuran: "M" } },
      { code: "PP-BAG-L", values: { ukuran: "L" } },
    ],
  },

  // ===== Cups & Beverage =====
  // Cup Saus + Lid: 25 / 35 / 60 / 100 / 150 ml (sesuai foto).
  // CB-035, CB-100, CB-150 = produk lama, dipakai apa adanya.
  // CB-025 dan CB-060 baru (salin dari CB-035).
  // TODO: cek isi pack & MOQ untuk 25 ml dan 60 ml.
  simple(
    "cup-saus",
    "Cup Saus + Lid",
    "CB-035",
    "ukuran",
    "Ukuran",
    [
      ["25 ml", "CB-025"],
      ["35 ml", "CB-035"],
      ["60 ml", "CB-060"],
      ["100 ml", "CB-100"],
      ["150 ml", "CB-150"],
    ],
    { imageCode: "CB-SAUS-ALL" },
  ),
  // Round/Bowl = Thinwall Bowl dari daftar klien (200-1000 ml). 200/400/650 pakai kode lama.
  // Gambar awal (kartu katalog + detail sebelum pilih ukuran) = foto lineup ALL (CB-BWL-ALL).
  simple(
    "cup-bowl",
    "Cup Round/Bowl + Lid",
    "CB-200",
    "ukuran",
    "Ukuran",
    [
      ["200 ml", "CB-200"],
      ["300 ml", "CB-BWL300"],
      ["400 ml", "CB-400"],
      ["450 ml", "CB-BWL450"],
      ["500 ml", "CB-BWL500"],
      ["650 ml", "CB-650"],
      ["750 ml", "CB-BWL750"],
      ["1000 ml", "CB-BWL1000"],
    ],
    { imageCode: "CB-BWL-ALL" },
  ),
  // Thinwall PP: tiap bentuk = produk sendiri, yang jadi varian cuma ukuran (ml).
  // Thinwall Cup 100/150 ml di daftar klien = Cup Saus 100/150 ml, tidak diduplikasi.
  // LB Sekat 4 A (CB-TWLB4A) dan B (CB-TWLB4B) produk terpisah, lihat EXTRA_PRODUCTS.
  // SEMENTARA DINONAKTIFKAN (5 grup thinwall-* di bawah): lihat DISABLED_GROUP_IDS.
  simple(
    "thinwall-rect",
    "PP Thinwall Rectangle",
    "CB-TWRC200",
    "ukuran",
    "Ukuran",
    [200, 250, 300, 500, 650, 750, 1000].map(
      (n) => [`${n} ml`, `CB-TWRC${n}`] as [string, string],
    ),
  ),
  simple(
    "thinwall-square",
    "PP Thinwall Square",
    "CB-TWSQ350",
    "ukuran",
    "Ukuran",
    [350, 1000, 1500, 2000, 3000].map(
      (n) => [`${n} ml`, `CB-TWSQ${n}`] as [string, string],
    ),
  ),
  simple(
    "thinwall-round",
    "PP Thinwall Round",
    "CB-TWRD300",
    "ukuran",
    "Ukuran",
    [300, 450].map((n) => [`${n} ml`, `CB-TWRD${n}`] as [string, string]),
  ),
  // LB Sekat 4: A dan B digabung jadi 1 kartu. B = di tengah bentuk bulat, tempat saos.
  {
    id: "thinwall-lb",
    name: "PP Thinwall LB Sekat 4",
    baseCode: "CB-TWLB4A",
    options: [{ key: "tipe", label: "Tipe" }],
    variants: [
      { code: "CB-TWLB4A", values: { tipe: "A" } },
      { code: "CB-TWLB4B", values: { tipe: "B" }, patch: { size: "Tipe B" } },
    ],
  },
  simple(
    "thinwall-foodbox",
    "PP Thinwall Food Box",
    "CB-TWFB750",
    "ukuran",
    "Ukuran",
    [750, 1000].map((n) => [`${n} ml`, `CB-TWFB${n}`] as [string, string]),
  ),
  // Gelas plastik 10/12/14/16 oz. Biasa dan Custom = 2 produk terpisah (beda tipe).
  // CB-PL10 / CB-PL14 / CB-PL10C / CB-PL12C / CB-PL14C baru: isi pack & MOQ disalin dari
  // produk dasar. TODO: cek isi pack & MOQ tiap ukuran.
  // Gambar awal (kartu katalog + detail sebelum pilih ukuran) = foto lineup ALL:
  //   Biasa  -> CB-PL-ALL  (lineup 4 cup bening polos)
  //   Custom -> CB-PLC-ALL (lineup 4 cup bening + logo)
  simple(
    "cup-plastik",
    "Cup Plastik",
    "CB-PL12",
    "ukuran",
    "Ukuran",
    [
      ["10 oz", "CB-PL10"],
      ["12 oz", "CB-PL12"],
      ["14 oz", "CB-PL14"],
      ["16 oz", "CB-PL16"],
    ],
    { imageCode: "CB-PL-ALL" },
  ),
  simple(
    "cup-plastik-custom",
    "Cup Plastik Custom",
    "CB-PL16C",
    "ukuran",
    "Ukuran",
    [
      ["10 oz", "CB-PL10C"],
      ["12 oz", "CB-PL12C"],
      ["14 oz", "CB-PL14C"],
      ["16 oz", "CB-PL16C"],
    ],
    { imageCode: "CB-PLC-ALL" },
  ),
  // Cup Kertas 4 / 6,5 / 8 / 12 / 14 / 16 oz. Polos dan Custom = 2 produk terpisah.
  // CB-PPRCUP (lama, "Custom") disembunyikan, digantikan grup Custom.
  // Gambar awal (kartu katalog + detail sebelum pilih ukuran) = foto lineup ALL:
  //   Polos  -> CB-PPR-ALL  (lineup putih polos)
  //   Custom -> CB-PPRC-ALL (lineup 6 cup warna-warni)
  // Foto satuan per ukuran muncul setelah chip dipilih.
  // TODO: isi pack, MOQ, dan material disalin dari CB-PPRCUP; cek per ukuran.
  simple(
    "cup-kertas-polos",
    "Cup Kertas Polos",
    "CB-PPRCUP",
    "ukuran",
    "Ukuran",
    [
      ["4 oz", "CB-PPR-4"],
      ["6,5 oz", "CB-PPR-65"],
      ["8 oz", "CB-PPR-8"],
      ["12 oz", "CB-PPR-12"],
      ["14 oz", "CB-PPR-14"],
      ["16 oz", "CB-PPR-16"],
    ],
    { imageCode: "CB-PPR-ALL" },
  ),
  simple(
    "cup-kertas-custom",
    "Cup Kertas Custom",
    "CB-PPRCUP",
    "ukuran",
    "Ukuran",
    [
      ["4 oz", "CB-PPRC-4"],
      ["6,5 oz", "CB-PPRC-65"],
      ["8 oz", "CB-PPRC-8"],
      ["12 oz", "CB-PPRC-12"],
      ["14 oz", "CB-PPRC-14"],
      ["16 oz", "CB-PPRC-16"],
    ],
    { legacyCodes: ["CB-PPRCUP"], imageCode: "CB-PPRC-ALL" },
  ),
  // Varian = ukuran (dan warna). Beda tipe = produk sendiri:
  // Sedotan Steril/Nonsteril ada di EXTRA_PRODUCTS.
  // Revisi #7: Stirrer straw 12/15/17 cm.
  simple(
    "stirrer",
    "Stirrer Straw",
    "CB-STIRRER",
    "ukuran",
    "Ukuran",
    [
      ["12 cm", "CB-STIRRER-12"],
      ["15 cm", "CB-STIRRER-15"],
      ["17 cm", "CB-STIRRER-17"],
    ],
    { legacyCodes: ["CB-STIRRER"] },
  ),

  // ===== Cutlery (tanpa brand, warna bening/putih/hitam) — revisi #8 =====
  // Argumen ke-4 = warna default (varian pertama = gambar awal di kartu katalog).
  // Selang-seling supaya 3 warna kelihatan di katalog: Bening, Putih, Hitam, Bening, Putih.
  cutlery("garpu", "Garpu Makan Plastik", "DC-FORK", "Bening"),
  cutlery("sendok-makan", "Sendok Makan Plastik", "DC-SPOON", "Putih"),
  cutlery("sendok-teh", "Sendok Teh", "DC-TSPOON", "Hitam"),
  cutlery("sendok-puding", "Sendok Puding", "DC-PUD", "Bening"),
  cutlery("spoon-fork", "Spoon Fork", "DC-SPFK", "Putih"),

  // ===== Plastic Bags & Films =====
  // Revisi #9: Kantong Gelas Jus 1 cup / 2 cup.
  // Polymailer Pink: 7 ukuran (cm). PB-POLYP (lama, ukuran "Standard") jadi legacy.
  // Isi 100 lembar, kecuali 35×50 = 50 lembar.
  {
    id: "polymailer",
    name: "Polymailer Pink",
    baseCode: "PB-POLYP",
    legacyCodes: ["PB-POLYP"],
    imageCode: "PB-POLYP-ALL", // thumbnail katalog + gambar default sebelum pilih ukuran
    overrides: { pack: "100 lembar / pack" },
    options: [{ key: "ukuran", label: "Ukuran" }],
    variants: sizeVariants("PB-POLY", [
      "10x20",
      "15x25",
      "17x30",
      "20x30",
      "25x35",
      "30x40",
      "35x50",
    ]).map((v) =>
      v.code === "PB-POLY3550"
        ? { ...v, patch: { pack: "50 lembar / pack" } }
        : v,
    ),
  },

  simple(
    "kantong-gelas-jus",
    "Kantong Gelas Jus",
    "PB-GLS",
    "ukuran",
    "Ukuran",
    [
      ["1 cup", "PB-GLS-1"],
      ["2 cup", "PB-GLS-2"],
    ],
    { legacyCodes: ["PB-GLS"], imageCode: "PB-GLS-ALL" },
  ),
  // #10: Kantong Plastik 15/17/24/28/35/40. PB-50 (jumbo) sengaja TIDAK ikut,
  // tetap produk sendiri di data.ts. PB-17 dan PB-40 baru (salin dari PB-15).
  // TODO: satuan ukuran (cm?) belum dikonfirmasi.
  simple("kantong-plastik", "Kantong Plastik", "PB-15", "ukuran", "Ukuran", [
    ["15", "PB-15"],
    ["17", "PB-17"],
    ["24", "PB-24"],
    ["28", "PB-28"],
    ["35", "PB-35"],
    ["40", "PB-40"],
  ]),
  simple(
    "kantong-sampah",
    "Kantong Plastik Sampah",
    "PB-TR60100",
    "ukuran",
    "Ukuran",
    [
      ["60×100 cm", "PB-TR60100"],
      ["90×120 cm", "PB-TR90120"],
    ],
  ),
  simple("plastik-pe", "Plastik PE", "PB-PE1025", "ukuran", "Ukuran", [
    ["10×25 cm", "PB-PE1025"],
    ["12×25 cm", "PB-PE1225"],
    ["15×30 cm", "PB-PE1530"],
    ["20×35 cm", "PB-PE2035"],
  ]),
  // Plastik Anti Panas (Obor): 4 ukuran + acuan berat. Beda produk dari Plastik PE.
  // PB-HEAT2035 = produk lama 20×35, dipakai apa adanya. Sisanya baru (salin dari PB-HEAT2035).
  // TODO: cek isi pack & MOQ per ukuran.
  simple(
    "plastik-anti-panas",
    "Plastik Anti Panas",
    "PB-HEAT2035",
    "ukuran",
    "Ukuran",
    [
      ["10×20 cm (¼ kg)", "PB-HEAT1020"],
      ["12×25 cm (½ kg)", "PB-HEAT1225"],
      ["15×30 cm (1 kg)", "PB-HEAT1530"],
      ["20×35 cm (2 kg)", "PB-HEAT2035"],
    ],
    { imageCode: "PB-HEAT-ALL" },
  ),
  simple("plastik-sheet", "Plastik Sheet", "PB-SHT2020", "ukuran", "Ukuran", [
    ["20×20 cm", "PB-SHT2020"],
    ["25×35 cm (Alas)", "PB-SHT2535"],
    ["30×45 cm", "PB-SHT3045"],
  ]),
  // Revisi #12: Plastik Bawang, 16 ukuran acuan Google (jadi dropdown di picker).
  {
    id: "plastik-bawang",
    name: "Plastik Bawang",
    baseCode: "PB-BWG1020",
    options: [{ key: "ukuran", label: "Ukuran" }],
    variants: sizeVariants("PB-BWG", REF_SIZES),
  },
  // Revisi #13: Klip & OPP — ukuran lama + ukuran acuan yang sama.
  // TODO: konfirmasi ke klien apakah daftar acuan Klip/OPP memang sama dengan Bawang.
  {
    id: "plastik-klip",
    name: "Plastik Klip",
    baseCode: "PB-CLIP58",
    options: [{ key: "ukuran", label: "Ukuran" }],
    variants: sizeVariants("PB-CLIP", ["5x8", "10x7", "13x8,7", ...REF_SIZES]),
  },
  {
    id: "plastik-opp",
    name: "Plastik OPP",
    baseCode: "PB-OPP722",
    options: [{ key: "ukuran", label: "Ukuran" }],
    variants: sizeVariants("PB-OPP", ["7x22", "9x25", ...REF_SIZES]),
  },
  // Revisi #14: Plastik Vacuum Emboss dan Polos = 2 produk, masing-masing 43 ukuran.
  {
    id: "plastik-vacuum-emboss",
    name: "Plastik Vacuum Emboss",
    baseCode: "PB-VAC1218",
    options: [{ key: "ukuran", label: "Ukuran" }],
    variants: sizeVariants("PB-VACE-", VACUUM_SIZES),
  },
  {
    id: "plastik-vacuum-polos",
    name: "Plastik Vacuum Polos",
    baseCode: "PB-VAC1218",
    options: [{ key: "ukuran", label: "Ukuran" }],
    variants: sizeVariants("PB-VACP-", VACUUM_SIZES),
    legacyCodes: ["PB-VAC1218", "PB-VAC1520", "PB-VAC3040"],
  },
  // Revisi #15: Plastik Wrapping (Best Fresh) — lebar 30/40/45 cm x panjang 250/500 m.
  // Revisi #15: Plastik Wrapping (Best Fresh) - 8 ukuran (revisi ukuran yang benar).
  // PB-WRAP30500 = produk lama 30 cm × 500 m, dipakai apa adanya.
  simple(
    "plastik-wrapping",
    "Plastik Wrapping",
    "PB-WRAP30500",
    "ukuran",
    "Ukuran",
    [
      ["20 cm × 500 m", "PB-WRAP20500"],
      ["25 cm × 500 m", "PB-WRAP25500"],
      ["30 cm × 250 m", "PB-WRAP30250"],
      ["30 cm × 500 m", "PB-WRAP30500"],
      ["35 cm × 500 m", "PB-WRAP35500"],
      ["40 cm × 500 m", "PB-WRAP40500"],
      ["45 cm × 500 m", "PB-WRAP45500"],
      ["60 cm × 500 m", "PB-WRAP60500"],
    ],
  ),

  // ===== Operational Supplies =====
  // Revisi #17: Handglove tanpa brand. Ukuran XS-XL, warna putih/hitam.
  {
    id: "handglove-nitrile",
    name: "Handglove Nitrile",
    baseCode: "OP-GLVL-M",
    imageCode: "HG-NIT-ALL",
    overrides: { material: "Nitrile" },
    options: [
      { key: "ukuran", label: "Ukuran" },
      { key: "warna", label: "Warna", swatches: GLOVE_SWATCH },
    ],
    variants: combos(
      [
        { key: "ukuran", values: GLOVE_SIZES },
        { key: "warna", values: GLOVE_COLORS },
      ],
      (v) => `HG-NIT-${v.ukuran}-${glovePrefix(v.warna)}`,
    ),
  },
  {
    id: "handglove-latex-powder",
    name: "Handglove Latex Powder",
    baseCode: "OP-GLVL-M",
    imageCode: "HG-LTX-PW-ALL",
    legacyCodes: ["OP-GLVL-S", "OP-GLVL-M", "OP-GLVL-L"],
    options: [
      { key: "ukuran", label: "Ukuran" },
      { key: "warna", label: "Warna", swatches: GLOVE_SWATCH },
    ],
    variants: combos(
      [
        { key: "ukuran", values: GLOVE_SIZES },
        { key: "warna", values: GLOVE_COLORS },
      ],
      (v) => `HG-LTX-${v.ukuran}-PW-${glovePrefix(v.warna)}`,
    ),
  },
  {
    id: "handglove-latex-nonpowder",
    name: "Handglove Latex Non-powder",
    baseCode: "OP-GLVL-M",
    imageCode: "HG-LTX-NP-ALL",
    options: [
      { key: "ukuran", label: "Ukuran" },
      { key: "warna", label: "Warna", swatches: GLOVE_SWATCH },
    ],
    variants: combos(
      [
        { key: "ukuran", values: GLOVE_SIZES },
        { key: "warna", values: GLOVE_COLORS },
      ],
      (v) => `HG-LTX-${v.ukuran}-NP-${glovePrefix(v.warna)}`,
    ),
  },
  {
    id: "handglove-plastik",
    name: "Handglove Plastik",
    baseCode: "OP-GLVP",
    imageCode: "HG-PLS-ALL",
    legacyCodes: ["OP-GLVP"],
    options: [
      { key: "ukuran", label: "Ukuran" },
      { key: "warna", label: "Warna", swatches: GLOVE_SWATCH },
    ],
    variants: combos(
      [
        { key: "ukuran", values: GLOVE_SIZES },
        { key: "warna", values: GLOVE_COLORS },
      ],
      (v) => `HG-PLS-${v.ukuran}-${glovePrefix(v.warna)}`,
    ),
  },
  // Revisi #18: Lakban OPP tanpa brand. Bening & Coklat pakai kode lama.
  // Kuning dibuang (tidak ada di daftar revisi); tambahkan lagi kalau masih dijual.
  simple(
    "lakban-opp",
    "Lakban OPP",
    "OP-TAPE-CL",
    "warna",
    "Warna",
    [
      ["Bening", "OP-TAPE-CL"],
      ["Coklat", "OP-TAPE-BR"],
      ["Hitam", "OP-TAPE-HTM"],
      ["Putih", "OP-TAPE-PTH"],
      ["Merah", "OP-TAPE-MRH"],
      ["Biru", "OP-TAPE-BRU"],
      ["Hijau", "OP-TAPE-HJU"],
      ["Pink", "OP-TAPE-PNK"],
    ],
    {
      imageCode: "OP-TAPE-ALL",
      swatches: {
        Bening: "#F3F4F6",
        Coklat: "#B07F4F",
        Hitam: "#1F1F1F",
        Putih: "#FFFFFF",
        Merah: "#D2382E",
        Biru: "#2F6DB5",
        Hijau: "#3E9B5A",
        Pink: "#EC7FA9",
      },
    },
  ),
  // Revisi #19: Tali Rafia 9 warna, tanpa brand.
  simple(
    "tali-rafia",
    "Tali Rafia",
    "OP-RAFIA",
    "warna",
    "Warna",
    [
      ["Hijau", "OP-RAFIA-HJU"],
      ["Kuning", "OP-RAFIA-KNG"],
      ["Merah", "OP-RAFIA-MRH"],
      ["Biru", "OP-RAFIA-BRU"],
      ["Ungu", "OP-RAFIA-UNG"],
      ["Oren", "OP-RAFIA-ORN"],
      ["Abu-abu", "OP-RAFIA-ABU"],
      ["Putih", "OP-RAFIA-PTH"],
      ["Hitam", "OP-RAFIA-HTM"],
    ],
    {
      legacyCodes: ["OP-RAFIA"],
      swatches: {
        Hijau: "#3E9B5A",
        Kuning: "#F2C230",
        Merah: "#D2382E",
        Biru: "#2F6DB5",
        Ungu: "#7A4FA3",
        Oren: "#F08A24",
        "Abu-abu": "#9CA3AF",
        Putih: "#FFFFFF",
        Hitam: "#1F1F1F",
      },
    },
  ),
  // Revisi #20: Kertas Thermal 8 ukuran lebar (30/38/40/50/57/60/70/80 mm).
  // 57 mm = OP-TH5730 dan 80 mm = OP-TH8080 (produk lama dipakai apa adanya).
  // TODO: daftar klien menulis "50 MM" dua kali — kalau yang dimaksud bukan 57, ganti.
  simple("kertas-thermal", "Kertas Thermal", "OP-TH5730", "ukuran", "Ukuran", [
    ["30 mm", "OP-TH-30"],
    ["38 mm", "OP-TH-38"],
    ["40 mm", "OP-TH-40"],
    ["50 mm", "OP-TH-50"],
    ["57 mm", "OP-TH5730"],
    ["60 mm", "OP-TH-60"],
    ["70 mm", "OP-TH-70"],
    ["80 mm", "OP-TH8080"],
  ]),

  // ===== Food Ingredients =====
  // Revisi #23: Puff Pastry 375 g & 750 g.
  simple(
    "puff-pastry",
    "Puff Pastry",
    "FI-PUFF750",
    "berat",
    "Ukuran",
    [
      ["375 g", "FI-PUFF375"],
      ["750 g", "FI-PUFF750"],
    ],
    { sizeKey: "berat" },
  ),

  // ===== Other Supplies =====
  // Revisi #25: Paping Bag tanpa brand (kode lama dipakai apa adanya).
  simple(
    "paping-bag",
    "Paping Bag",
    "OT-PAPING-BSR",
    "ukuran",
    "Ukuran",
    [
      ["Kecil", "OT-PAPING-KCL"],
      ["Besar", "OT-PAPING-BSR"],
    ],
    { imageCode: "OT-PAPING-ALL" },
  ),
  // Revisi #26: Tampah 30 / 40 / 50 cm.
  simple(
    "tampah",
    "Tampah Nampan",
    "OT-TAMPAH",
    "ukuran",
    "Ukuran",
    [
      ["30 cm", "OT-TAMPAH-30"],
      ["40 cm", "OT-TAMPAH-40"],
      ["50 cm", "OT-TAMPAH-50"],
    ],
    { legacyCodes: ["OT-TAMPAH"] },
  ),
];

// Grup yang disembunyikan sementara dari katalog. Kosongkan set ini untuk
// menampilkannya lagi. (Pasangannya: DISABLED_CODES di lib/data.ts.)
const DISABLED_GROUP_IDS = new Set([
  "thinwall-rect",
  "thinwall-square",
  "thinwall-round",
  "thinwall-lb",
  "thinwall-foodbox",
]);
export const GROUPS: GroupDef[] = ALL_GROUPS.filter(
  (g) => !DISABLED_GROUP_IDS.has(g.id),
);

// ---------------------------------------------------------------------------

export function getVariantLabel(group: GroupDef, v: VariantDef): string {
  const vals = group.options.map((o) => v.values[o.key]).filter(Boolean);
  return [group.name, ...vals].join(" – ");
}

const byCode = new Map<string, Product>(ALL_PRODUCTS.map((p) => [p.code, p]));
const generated: Product[] = [];
for (const g of GROUPS) {
  const base = byCode.get(g.baseCode);
  for (const v of g.variants) {
    if (byCode.has(v.code)) continue;
    if (!base) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          `[variants] baseCode "${g.baseCode}" tidak ada di ALL_PRODUCTS, varian ${v.code} dilewati`,
        );
      }
      continue;
    }
    const p = {
      ...base,
      ...g.overrides,
      code: v.code,
      name: getVariantLabel(g, v),
      size: v.values[g.sizeKey ?? "ukuran"] ?? base.size,
      ...v.patch,
    } as Product;
    byCode.set(p.code, p);
    generated.push(p);
  }
}

// Produk terpisah (bukan varian) yang dibuat dari produk dasar.
const EXTRA_PRODUCTS: { baseCode: string; patch: Partial<Product> }[] = [
  // Thinwall LB Sekat 4 B: di tengah bentuk bulat, tempat saos. (A = CB-TWLB4A di data.ts)
  // Sedotan: CB-STRAW (lama) disembunyikan, diganti 2 produk ini.
  {
    baseCode: "CB-STRAW",
    patch: { code: "CB-STRAW-ST", name: "Sedotan Steril" },
  },
  {
    baseCode: "CB-STRAW",
    patch: { code: "CB-STRAW-NS", name: "Sedotan Nonsteril" },
  },
];
const HIDDEN_CODES = new Set(["CB-STRAW"]);
for (const e of EXTRA_PRODUCTS) {
  const base = byCode.get(e.baseCode);
  const code = e.patch.code as string;
  if (!base || byCode.has(code)) continue;
  const p = { ...base, ...e.patch } as Product;
  byCode.set(code, p);
  generated.push(p);
}

const codeToGroup = new Map<string, GroupDef>();
const legacyToGroup = new Map<string, GroupDef>();
for (const g of GROUPS) {
  for (const v of g.variants) codeToGroup.set(v.code, g);
}
for (const g of GROUPS) {
  for (const c of g.legacyCodes ?? []) {
    if (!codeToGroup.has(c)) legacyToGroup.set(c, g);
  }
}

// Pakai ini sebagai pengganti ALL_PRODUCTS di semua halaman katalog.
// Produk lama yang sudah digantikan grup (legacy) tidak ikut.
export const CATALOG_PRODUCTS: Product[] = [
  ...ALL_PRODUCTS.filter(
    (p) => !legacyToGroup.has(p.code) && !HIDDEN_CODES.has(p.code),
  ),
  ...generated,
];

// Statistik katalog untuk halaman Keunggulan. Dihitung di sini (bukan di
// data.ts) karena variants.ts yang tahu soal grup/ukuran/warna.
//   TOTAL_SKU      = semua ukuran/warna yang bisa dipesan
//   TOTAL_PRODUK   = jumlah kartu di katalog (1 grup = 1)
export const TOTAL_SKU = CATALOG_PRODUCTS.length;
export const TOTAL_PRODUK = new Set(
  CATALOG_PRODUCTS.map((p) => getGroupByCode(p.code)?.id ?? p.code),
).size;

const lowerIndex = new Map<string, Product>();
for (const [code, p] of byCode) lowerIndex.set(code.toLowerCase(), p);
const legacyLower = new Map<string, GroupDef>();
for (const [code, g] of legacyToGroup) legacyLower.set(code.toLowerCase(), g);

export function getGroupByCode(code: string): GroupDef | null {
  return codeToGroup.get(code) ?? legacyToGroup.get(code) ?? null;
}

export function getGroupVariants(group: GroupDef) {
  return group.variants
    .map((def) => ({ def, product: byCode.get(def.code) }))
    .filter((x): x is { def: VariantDef; product: Product } => !!x.product);
}

// URL lama (kode legacy) diarahkan ke varian pertama grup penggantinya.
export function getCatalogProduct(slug: string): Product | undefined {
  const key = slug.toLowerCase();
  const lg = legacyLower.get(key);
  if (lg) {
    const first = getGroupVariants(lg)[0]?.product;
    if (first) return first;
  }
  return lowerIndex.get(key);
}

// Untuk homepage: ganti getFeaturedProducts() dengan ini. Kode legacy otomatis
// jadi varian pertama grup, dan satu grup hanya tampil sekali.
export function getFeaturedCatalogProducts(codes: string[]): Product[] {
  const seen = new Set<string>();
  const out: Product[] = [];
  for (const c of codes) {
    const p = getCatalogProduct(c);
    if (!p) continue;
    const g = getGroupByCode(p.code);
    const k = g ? `g:${g.id}` : p.code;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(p);
  }
  return out;
}

// Gambar gabungan untuk grup: imageCode -> varian pertama yang punya gambar
// -> gambar produk legacy -> null.
export function getGroupImageCode(group: GroupDef): string | null {
  if (group.imageCode && hasProductImage(group.imageCode))
    return group.imageCode;
  const withImage = group.variants.find((v) => hasProductImage(v.code));
  if (withImage) return withImage.code;
  const legacy = (group.legacyCodes ?? []).find((c) => hasProductImage(c));
  return legacy ?? null;
}

// Gambar untuk satu kode: punya sendiri -> gambar grup -> null.
export function getDisplayImageCode(code: string): string | null {
  if (hasProductImage(code)) return code;
  const g = getGroupByCode(code);
  return g ? getGroupImageCode(g) : null;
}

// Teks badge di kartu katalog, pengganti "N varian". Contoh: "4 ukuran",
// "9 warna", "5 ukuran · 2 warna". Hitung nilai unik per opsi, bukan jumlah kombinasi.
// Badge menampilkan ISI pilihannya, bukan cuma jumlah:
//   "12 · 16 oz", "35 · 100 · 150 ml", "XS–XL · 2 warna", "6×8–30×40 cm", "9 warna".
// Aturan: warna -> jumlah; <=3 nilai -> disebut semua; >3 nilai -> rentang awal–akhir.
// Kalau teksnya terlalu panjang untuk badge, jatuh ke jumlah ("4 ukuran").
const UNIT_RE = /\s*(ml|oz|cm|mm|g|kg|m|cup)$/i;
function summarizeValues(values: string[]): string {
  const unit = values[0].match(UNIT_RE)?.[0];
  const sameUnit = !!unit && values.every((v) => v.endsWith(unit));
  const strip = (v: string) => (sameUnit ? v.slice(0, -unit!.length) : v);
  const body =
    values.length <= 3
      ? values.map(strip).join(" · ")
      : `${strip(values[0])}–${strip(values[values.length - 1])}`;
  return sameUnit ? `${body}${unit}` : body;
}

export function getGroupBadge(group: GroupDef): string {
  const parts = group.options
    .map((o) => {
      const values = Array.from(
        new Set(group.variants.map((v) => v.values[o.key]).filter(Boolean)),
      );
      if (values.length < 2) return null;
      return { o, values };
    })
    .filter((x): x is { o: OptionDef; values: string[] } => !!x);

  const counts = parts.map(
    (p) => `${p.values.length} ${p.o.label.toLowerCase()}`,
  );
  const detailed = parts.map((p) =>
    p.o.swatches
      ? `${p.values.length} ${p.o.label.toLowerCase()}`
      : summarizeValues(p.values),
  );
  const text = detailed.join(" · ");
  return text.length <= 24 ? text : counts.join(" · ");
}

// True kalau produk punya pilihan (ukuran/warna/tipe lebih dari 1 nilai) yang harus dipilih
// dulu. Kartu katalog: tombol tetap "Tambah ke cart" untuk semua produk, tapi kalau ini
// true, klik tombol diarahkan ke halaman detail untuk memilih dulu (bukan langsung masuk cart).
export function needsVariantChoice(group: GroupDef | null): boolean {
  if (!group) return false;
  return group.options.some(
    (o) =>
      new Set(group.variants.map((v) => v.values[o.key]).filter(Boolean)).size >
      1,
  );
}

export type CatalogEntry = { product: Product; group: GroupDef | null };

// Satukan produk hasil filter menjadi entri katalog (1 entri per grup).
export function groupCatalog(products: Product[]): CatalogEntry[] {
  const codes = new Set(products.map((p) => p.code));
  const seen = new Set<string>();
  const out: CatalogEntry[] = [];
  for (const p of products) {
    const g = codeToGroup.get(p.code) ?? null;
    if (!g) {
      out.push({ product: p, group: null });
      continue;
    }
    if (seen.has(g.id)) continue;
    seen.add(g.id);
    const rep =
      getGroupVariants(g).find((v) => codes.has(v.product.code))?.product ?? p;
    out.push({ product: rep, group: g });
  }
  return out;
}

// Dipanggil saat chip diklik. Kalau kombinasi persis tidak ada, ambil varian
// terdekat (opsi di atas diprioritaskan), jadi chip tidak pernah "buntu".
export function pickVariant(
  group: GroupDef,
  current: Record<string, string>,
  key: string,
  value: string,
): VariantDef | undefined {
  const cands = group.variants.filter((v) => v.values[key] === value);
  let best: VariantDef | undefined = cands[0];
  let bestScore = -1;
  for (const v of cands) {
    let score = 0;
    group.options.forEach((o, i) => {
      if (o.key !== key && v.values[o.key] === current[o.key]) {
        score += 1 << (group.options.length - i);
      }
    });
    if (score > bestScore) {
      best = v;
      bestScore = score;
    }
  }
  return best;
}
