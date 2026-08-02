// lib/data.ts
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
  type LucideIcon,
} from "lucide-react";
import productImages from "./product-images.generated.json";

export type Product = {
  code: string;
  name: string;
  material: string;
  size: string;
  pack: string;
  moq: string;
  divisionId: string;
  divisionName: string;
  categoryId: string;
  categoryName: string;
};

// Kategori — sub-grouping di dalam satu Divisi. Gak butuh icon sendiri;
// icon divisi udah cukup buat identitas visual di sidebar/breadcrumb.
export type Category = {
  id: string;
  name: string;
  products: Omit<
    Product,
    "divisionId" | "divisionName" | "categoryId" | "categoryName"
  >[];
};

// Divisi — level teratas, ini yang tampil di Header (sticky, site-wide).
export type Division = {
  id: string;
  code: string;
  name: string;
  icon: LucideIcon;
  blurb: string;
  categories: Category[];
};

export const DIVISIONS: Division[] = [
  {
    id: "foil",
    code: "AF",
    name: "Aluminium Foil & Food Containers",
    icon: Package,
    blurb:
      "Nampan foil, roll, dan tutup foil siap-seal untuk lini pengemasan makanan panas.",
    categories: [
      {
        id: "af-roll",
        name: "Foil Roll",
        products: [
          {
            code: "AF-014",
            name: "Aluminium Foil 45x300",
            material: "Food-grade aluminium",
            size: "45cm x 300m",
            pack: "1 roll / carton",
            moq: "10 cartons",
          },
          {
            code: "AF-021",
            name: "Aluminium Foil 45x7,6 m",
            material: "Food-grade aluminium",
            size: "45cm x 7.6m",
            pack: "24 rolls / carton",
            moq: "5 cartons",
          },
        ],
      },
      {
        id: "af-container",
        name: "Foil Container + Lid",
        products: [
          {
            code: "AF-BX4381",
            name: "Aluminium Foil BX4381 + Lid AX350",
            material: "Aluminium + PET lid",
            size: "BX4381",
            pack: "100 sets / carton",
            moq: "5 cartons",
          },
          {
            code: "AF-BX52180",
            name: "Aluminium Foil BX52180 + Lid",
            material: "Aluminium + PET lid",
            size: "BX52180",
            pack: "100 sets / carton",
            moq: "5 cartons",
          },
          {
            code: "AF-RX1200",
            name: "Aluminium Foil RX1200 + Lid",
            material: "Aluminium + PET lid",
            size: "RX1200 · 1200ml",
            pack: "50 sets / carton",
            moq: "5 cartons",
          },
          {
            code: "AF-RX145",
            name: "Aluminium Foil RX145 + Lid",
            material: "Aluminium + PET lid",
            size: "RX145",
            pack: "100 sets / carton",
            moq: "5 cartons",
          },
          {
            code: "AF-RX725",
            name: "Aluminium Foil RX725 + Lid",
            material: "Aluminium + PET lid",
            size: "RX725 · 725ml",
            pack: "100 sets / carton",
            moq: "5 cartons",
          },
          {
            code: "AF-OX1400",
            name: "Aluminium Foil OX1400 + Lid",
            material: "Aluminium + PET lid",
            size: "OX1400",
            pack: "50 sets / carton",
            moq: "5 cartons",
          },
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
        name: "Thinwall & Bento",
        products: [
          {
            code: "PP-TW800",
            name: "Brown Paper Thinwall 800ml",
            material: "Kraft-lined thinwall",
            size: "800ml",
            pack: "50 pcs / sleeve",
            moq: "10 sleeves",
          },
          {
            code: "PP-BENTO",
            name: "Bento Box",
            material: "Kraft board",
            size: "Standard",
            pack: "50 pcs / sleeve",
            moq: "10 sleeves",
          },
        ],
      },
      {
        id: "pp-box",
        name: "Corrugated Box",
        products: [
          {
            code: "PP-KFT181105",
            name: "Kraft Paper Box 18x11x5",
            material: "Kraft corrugated",
            size: "18x11x5 cm",
            pack: "25 pcs / bundle",
            moq: "4 bundles",
          },
          {
            code: "PP-DUS151005",
            name: "Dus 15x10x5",
            material: "3-ply corrugated",
            size: "15x10x5 cm",
            pack: "25 pcs / bundle",
            moq: "4 bundles",
          },
          {
            code: "PP-DUS252010",
            name: "Dus 25x20x10",
            material: "3-ply corrugated",
            size: "25x20x10 cm",
            pack: "20 pcs / bundle",
            moq: "4 bundles",
          },
          {
            code: "PP-DUS392624",
            name: "Dus 39x26x24",
            material: "5-ply corrugated",
            size: "39x26x24 cm",
            pack: "10 pcs / bundle",
            moq: "2 bundles",
          },
          {
            code: "PP-DUSXL",
            name: "Dus Big Order 60x40x30",
            material: "5-ply heavy duty",
            size: "60x40x30 cm",
            pack: "5 pcs / bundle",
            moq: "1 bundle",
          },
        ],
      },
      {
        id: "pp-bag",
        name: "Paper Bag",
        products: [
          {
            code: "PP-BAG-L",
            name: "Paper Bag L 22x24x28",
            material: "Kraft paper",
            size: "22x24x28 cm",
            pack: "50 pcs / pack",
            moq: "10 packs",
          },
          {
            code: "PP-BAG-M",
            name: "Paper Bag M 21x21",
            material: "Kraft paper",
            size: "21x21 cm",
            pack: "50 pcs / pack",
            moq: "10 packs",
          },
          {
            code: "PP-BAG-S",
            name: "Paper Bag S 11x11x28",
            material: "Kraft paper",
            size: "11x11x28 cm",
            pack: "50 pcs / pack",
            moq: "10 packs",
          },
        ],
      },
      {
        id: "pp-food-sheet",
        name: "Food Paper Sheet",
        products: [
          {
            code: "PP-SHAW30",
            name: "Kertas Shawarma 30x30",
            material: "Greaseproof paper",
            size: "30x30 cm",
            pack: "500 sheets / rim",
            moq: "5 rims",
          },
          {
            code: "PP-NASI-C",
            name: "Kertas Nasi Coklat (Warteg)",
            material: "Food-grade paper",
            size: "Standard",
            pack: "500 sheets / pack",
            moq: "5 packs",
          },
          {
            code: "PP-NASI-P",
            name: "Kertas Nasi Putih",
            material: "Food-grade paper",
            size: "Standard",
            pack: "500 sheets / pack",
            moq: "5 packs",
          },
          {
            code: "PP-BAKE",
            name: "Baking Paper",
            material: "Silicone-coated paper",
            size: "Standard roll",
            pack: "1 roll / unit",
            moq: "20 units",
          },
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
      "Cup dingin & panas, sealing film, dan sedotan untuk cafe dan brand minuman.",
    categories: [
      {
        id: "cb-cup-lid",
        name: "Cup + Lid",
        products: [
          {
            code: "CB-035",
            name: "Cup 35ml + Lid",
            material: "PP food-grade",
            size: "35ml",
            pack: "50 sets / sleeve",
            moq: "20 sleeves",
          },
          {
            code: "CB-100",
            name: "Cup 100ml + Lid",
            material: "PP food-grade",
            size: "100ml",
            pack: "50 sets / sleeve",
            moq: "20 sleeves",
          },
          {
            code: "CB-150",
            name: "Cup 150ml + Lid",
            material: "PP food-grade",
            size: "150ml",
            pack: "50 sets / sleeve",
            moq: "20 sleeves",
          },
          {
            code: "CB-200",
            name: "Cup 200ml + Lid",
            material: "PP food-grade",
            size: "200ml",
            pack: "50 sets / sleeve",
            moq: "20 sleeves",
          },
          {
            code: "CB-400",
            name: "Cup 400ml + Lid",
            material: "PP food-grade",
            size: "400ml",
            pack: "50 sets / sleeve",
            moq: "10 sleeves",
          },
          {
            code: "CB-650",
            name: "Cup 650ml + Lid",
            material: "PP food-grade",
            size: "650ml",
            pack: "50 sets / sleeve",
            moq: "10 sleeves",
          },
        ],
      },
      {
        id: "cb-plastic-cup",
        name: "Plastic Cup & Bottle",
        products: [
          {
            code: "CB-PL12",
            name: "Cup Plastik 12oz",
            material: "PET",
            size: "12oz",
            pack: "50 pcs / sleeve",
            moq: "20 sleeves",
          },
          {
            code: "CB-PL16",
            name: "Cup Plastik 16oz",
            material: "PET",
            size: "16oz",
            pack: "50 pcs / sleeve",
            moq: "20 sleeves",
          },
          {
            code: "CB-PL16C",
            name: "Cup Plastik 16oz (Custom)",
            material: "PET",
            size: "16oz",
            pack: "500 pcs / order",
            moq: "5 cartons",
          },
          {
            code: "CB-BTL250",
            name: "Botol Plastik Pir 250ml",
            material: "PET",
            size: "250ml",
            pack: "24 pcs / carton",
            moq: "5 cartons",
          },
        ],
      },
      {
        id: "cb-straw",
        name: "Straw & Stirrer",
        products: [
          {
            code: "CB-STRAW",
            name: "Sedotan",
            material: "PP",
            size: "Standard",
            pack: "500 pcs / pack",
            moq: "10 packs",
          },
          {
            code: "CB-STIRRER",
            name: "Stirrer Straw",
            material: "PP",
            size: "Standard",
            pack: "500 pcs / pack",
            moq: "10 packs",
          },
        ],
      },
      {
        id: "cb-tray-seal",
        name: "Tray & Sealing",
        products: [
          {
            code: "CB-TRAY4",
            name: "Drink Tray 4 Cup",
            material: "Recycled pulp",
            size: "4-cup",
            pack: "50 pcs / carton",
            moq: "5 cartons",
          },
          {
            code: "CB-SEAL15",
            name: "Plastik Sealed Minuman 15cm",
            material: "PP sealing film",
            size: "15cm",
            pack: "1 roll / unit",
            moq: "10 units",
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
        id: "dc-cutlery",
        name: "Cutlery",
        products: [
          {
            code: "DC-FORK",
            name: "Garpu Makan Plastik",
            material: "PP",
            size: "Standard",
            pack: "50 pcs / pack",
            moq: "20 packs",
          },
          {
            code: "DC-SPOON",
            name: "Sendok Makan Plastik",
            material: "PP",
            size: "Standard",
            pack: "50 pcs / pack",
            moq: "20 packs",
          },
          {
            code: "DC-TSPOON",
            name: "Sendok Teh",
            material: "PP",
            size: "Mini",
            pack: "50 pcs / pack",
            moq: "20 packs",
          },
          {
            code: "DC-PUD",
            name: "Sendok Puding",
            material: "PP",
            size: "Mini",
            pack: "50 pcs / pack",
            moq: "20 packs",
          },
          {
            code: "DC-SPFK",
            name: "Spoon Fork",
            material: "PP",
            size: "Standard",
            pack: "50 pcs / pack",
            moq: "20 packs",
          },
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
      "Film retail, packing, dan vacuum dalam berbagai grade PE, OPP, dan tahan panas.",
    categories: [
      {
        id: "pb-kantong",
        name: "Kantong Plastik",
        products: [
          {
            code: "PB-GLS",
            name: "Kantong Glas Juzz",
            material: "OPP",
            size: "Standard",
            pack: "1 pack / unit",
            moq: "10 packs",
          },
          {
            code: "PB-15",
            name: "Kantong Plastik 15",
            material: "HDPE",
            size: "15",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
          {
            code: "PB-24",
            name: "Kantong Plastik 24",
            material: "HDPE",
            size: "24",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
          {
            code: "PB-28",
            name: "Kantong Plastik 28",
            material: "HDPE",
            size: "28",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
          {
            code: "PB-35",
            name: "Kantong Plastik 35",
            material: "HDPE",
            size: "35",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
          {
            code: "PB-50",
            name: "Kantong Plastik 50",
            material: "HDPE",
            size: "50",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
          {
            code: "PB-TR60100",
            name: "Kantong Plastik Sampah 60x100",
            material: "LDPE",
            size: "60x100 cm",
            pack: "1 pack / unit",
            moq: "10 packs",
          },
          {
            code: "PB-TR90120",
            name: "Kantong Plastik Sampah 90x120",
            material: "LDPE",
            size: "90x120 cm",
            pack: "1 pack / unit",
            moq: "10 packs",
          },
          {
            code: "PB-BWG1020",
            name: "Plastik Bawang 10x20",
            material: "HDPE",
            size: "10x20 cm",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
          {
            code: "PB-BWG1225",
            name: "Plastik Bawang 12x25",
            material: "HDPE",
            size: "12x25 cm",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
        ],
      },
      {
        id: "pb-klip-opp",
        name: "Plastik Klip & OPP",
        products: [
          {
            code: "PB-CLIP58",
            name: "Plastik Klip 5x8",
            material: "PE",
            size: "5x8 cm",
            pack: "1 pack / unit",
            moq: "10 packs",
          },
          {
            code: "PB-CLIP107",
            name: "Plastik Klip 10x7",
            material: "PE",
            size: "10x7 cm",
            pack: "1 pack / unit",
            moq: "10 packs",
          },
          {
            code: "PB-CLIP1387",
            name: "Plastik Klip 13x8,7",
            material: "PE",
            size: "13x8,7 cm",
            pack: "1 pack / unit",
            moq: "10 packs",
          },
          {
            code: "PB-OPP722",
            name: "Plastik OPP 7x22",
            material: "OPP",
            size: "7x22 cm",
            pack: "1 pack / unit",
            moq: "10 packs",
          },
          {
            code: "PB-OPP925",
            name: "Plastik OPP 9x25",
            material: "OPP",
            size: "9x25 cm",
            pack: "1 pack / unit",
            moq: "10 packs",
          },
        ],
      },
      {
        id: "pb-pe-sheet",
        name: "Plastik PE & Sheet",
        products: [
          {
            code: "PB-PE1025",
            name: "Plastik PE 10x25",
            material: "PE",
            size: "10x25 cm",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
          {
            code: "PB-PE1225",
            name: "Plastik PE 12x25",
            material: "PE",
            size: "12x25 cm",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
          {
            code: "PB-PE1530",
            name: "Plastik PE 15x30",
            material: "PE",
            size: "15x30 cm",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
          {
            code: "PB-PE2035",
            name: "Plastik PE 20x35",
            material: "PE",
            size: "20x35 cm",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
          {
            code: "PB-SHT2020",
            name: "Plastik Sheet 20x20",
            material: "PE",
            size: "20x20 cm",
            pack: "1 pack / unit",
            moq: "10 packs",
          },
          {
            code: "PB-SHT2535",
            name: "Plastik Sheet Alas 25x35",
            material: "PE",
            size: "25x35 cm",
            pack: "1 pack / unit",
            moq: "10 packs",
          },
          {
            code: "PB-SPR60100",
            name: "Plastik Suprah 60x100",
            material: "PE",
            size: "60x100 cm",
            pack: "1 pack / unit",
            moq: "10 packs",
          },
        ],
      },
      {
        id: "pb-vacuum-wrap",
        name: "Plastik Vacuum & Wrapping",
        products: [
          {
            code: "PB-HEAT2035",
            name: "Plastik Anti Panas 20x35",
            material: "Nylon/PA",
            size: "20x35 cm",
            pack: "1 pack / unit",
            moq: "10 packs",
          },
          {
            code: "PB-VAC1218",
            name: "Plastik Vacuum 12x18",
            material: "PA/PE",
            size: "12x18 cm",
            pack: "1 pack / unit",
            moq: "10 packs",
          },
          {
            code: "PB-VAC1520",
            name: "Plastik Vacuum 15x20",
            material: "PA/PE",
            size: "15x20 cm",
            pack: "1 pack / unit",
            moq: "10 packs",
          },
          {
            code: "PB-VAC3040",
            name: "Plastik Vacuum 30x40",
            material: "PA/PE",
            size: "30x40 cm",
            pack: "1 pack / unit",
            moq: "10 packs",
          },
          {
            code: "PB-WRAP30500",
            name: "Plastik Wrapping 30x500",
            material: "PVC/PE",
            size: "30cm x 500m",
            pack: "1 roll / unit",
            moq: "10 units",
          },
        ],
      },
      {
        id: "pb-polymailer",
        name: "Polymailer",
        products: [
          {
            code: "PB-POLYP",
            name: "Polymailer Pink",
            material: "LDPE",
            size: "Standard",
            pack: "100 pcs / pack",
            moq: "5 packs",
          },
        ],
      },
    ],
  },
  {
    id: "ops",
    code: "OP",
    name: "Cleaning & Operational Supplies",
    icon: ShieldCheck,
    blurb:
      "Sarung tangan, tape, dan thermal roll yang menjaga operasional back-of-house tetap jalan.",
    categories: [
      {
        id: "op-glove",
        name: "Handglove",
        products: [
          {
            code: "OP-GLVL-S",
            name: "Handglove Latex S",
            material: "Latex",
            size: "S",
            pack: "100 pcs / box",
            moq: "5 boxes",
          },
          {
            code: "OP-GLVL-M",
            name: "Handglove Latex M",
            material: "Latex",
            size: "M",
            pack: "100 pcs / box",
            moq: "5 boxes",
          },
          {
            code: "OP-GLVL-L",
            name: "Handglove Latex L",
            material: "Latex",
            size: "L",
            pack: "100 pcs / box",
            moq: "5 boxes",
          },
          {
            code: "OP-GLVP",
            name: "Handglove Plastik",
            material: "PE",
            size: "Universal",
            pack: "100 pcs / box",
            moq: "5 boxes",
          },
        ],
      },
      {
        id: "op-tape",
        name: "Lakban / Tape",
        products: [
          {
            code: "OP-TAPE-CL",
            name: "Lakban Bening",
            material: "BOPP",
            size: "48mm x 90y",
            pack: "6 rolls / tube",
            moq: "5 tubes",
          },
          {
            code: "OP-TAPE-BR",
            name: "Lakban Coklat",
            material: "BOPP",
            size: "48mm x 90y",
            pack: "6 rolls / tube",
            moq: "5 tubes",
          },
          {
            code: "OP-TAPE-FR",
            name: "Lakban Fragile",
            material: "BOPP printed",
            size: "48mm x 90y",
            pack: "6 rolls / tube",
            moq: "5 tubes",
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
            pack: "1 roll / unit",
            moq: "10 units",
          },
          {
            code: "OP-RUBBER",
            name: "Karet Gelang",
            material: "Natural rubber",
            size: "Standard",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
        ],
      },
      {
        id: "op-thermal",
        name: "Kertas Thermal",
        products: [
          {
            code: "OP-TH5730",
            name: "Kertas Thermal 57x30",
            material: "Thermal-coated paper",
            size: "57x30 mm",
            pack: "10 rolls / pack",
            moq: "5 packs",
          },
          {
            code: "OP-TH8080",
            name: "Kertas Thermal 80x80",
            material: "Thermal-coated paper",
            size: "80x80 mm",
            pack: "10 rolls / pack",
            moq: "5 packs",
          },
        ],
      },
    ],
  },
  {
    id: "ingredients",
    code: "FI",
    name: "Food Ingredients & Raw Materials",
    icon: Wheat,
    blurb: "Bahan baku pilihan untuk bakery, grill house, dan commissary.",
    categories: [
      {
        id: "fi-bahan-baku",
        name: "Bahan Baku",
        products: [
          {
            code: "FI-ARANG",
            name: "Arang Batok Kelapa",
            material: "Coconut shell",
            size: "Bulk",
            pack: "10 kg / sack",
            moq: "5 sacks",
          },
          {
            code: "FI-ALMND",
            name: "Kacang Almond Sliced",
            material: "Almond",
            size: "Bulk",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
          {
            code: "FI-COCO",
            name: "Kelapa Parut Kering",
            material: "Coconut",
            size: "Bulk",
            pack: "1 kg / pack",
            moq: "5 kg",
          },
        ],
      },
    ],
  },
  {
    id: "other",
    code: "OT",
    name: "Other Supplies",
    icon: Layers,
    blurb: "Kebutuhan operasional harian yang melengkapi pesanan full-service.",
    categories: [
      {
        id: "ot-lainnya",
        name: "Perlengkapan Lain",
        products: [
          {
            code: "OT-BENANG",
            name: "Benang Ayam",
            material: "Cotton",
            size: "Standard",
            pack: "1 roll / unit",
            moq: "10 units",
          },
          {
            code: "OT-TAMPAH",
            name: "Tampah Nampan",
            material: "Bamboo",
            size: "Standard",
            pack: "1 pc / unit",
            moq: "20 units",
          },
          {
            code: "OT-TUSUK",
            name: "Tusuk Sate",
            material: "Bamboo",
            size: "Standard",
            pack: "1 pack / unit",
            moq: "10 packs",
          },
          {
            code: "OT-PAPING-BSR",
            name: "Paping Bag Besar",
            material: "LDPE",
            size: "Besar",
            pack: "1 pack / unit",
            moq: "10 packs",
          },
          {
            code: "OT-PAPING-KCL",
            name: "Paping Bag Kecil",
            material: "LDPE",
            size: "Kecil",
            pack: "1 pack / unit",
            moq: "10 packs",
          },
        ],
      },
    ],
  },
];

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

export const INDUSTRIES = [
  "Restoran",
  "Kafe",
  "Hotel",
  "Bakery",
  "Pabrik Makanan",
  "Distributor",
  "Ritel & Supermarket",
  "Rumah Sakit",
  "Katering",
  "UMKM",
];

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

export const STATS = [
  { value: "120+", label: "SKU siap kirim", icon: "package" },
  { value: "8", label: "Divisi produk", icon: "layout-grid" },
  { value: "250+", label: "Klien B2B aktif", icon: "users" },
  { value: "24 Jam", label: "Proses quotation", icon: "clock" },
];

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

export const TESTIMONIALS = [
  {
    quote:
      "Makmur A3'S satu-satunya supplier yang kami percaya buat restock aluminium foil di minggu yang sama — lini produksi kami gak pernah nunggu.",
    name: "Manajer Operasional",
    org: "Jaringan QSR Nasional",
  },
  {
    quote:
      "Spec sheet mereka bikin proses purchasing gampang. Kami tahu persis material, ukuran, dan MOQ yang dipesan sebelum telepon.",
    name: "Purchasing Lead",
    org: "Bakery Group, Jakarta",
  },
  {
    quote:
      "Satu supplier, satu invoice, untuk packaging, cup, dan cleaning supplies. Sourcing back-of-house kami jadi jauh lebih simpel.",
    name: "F&B Director",
    org: "Hotel & Resort Group",
  },
];
