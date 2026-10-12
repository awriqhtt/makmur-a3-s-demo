"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Send,
  ArrowLeft,
  ArrowRight,
  CheckCheck,
  Building2,
  ShoppingBag,
  ClipboardList,
  Truck,
  Wallet,
  Handshake, // kalau error import (lucide-react lama), ganti jadi Users
  RotateCcw,
  type LucideIcon,
} from "lucide-react";
const WA_GREETING = "Halo Admin, saya mau bertanya:";
const WA_NUMBER = "6287878311243";

const CS_NAME = "Makmur A3'S Support";
const AVATAR_SRC = "/avatars/admin-cs.jpg";

// Ganti kalau route halaman produk beda.
const PRODUK_HREF = "/produk";
const KERJASAMA_HREF = "/kerjasama";

// Background chat — dot pattern dua lapis (pure CSS).
// Polos: CHAT_BG_PATTERN = "none".
const CHAT_BG_COLOR = "bg-[#ece4d6]";
const CHAT_BG_PATTERN =
  "radial-gradient(rgba(0,0,0,0.055) 1.2px, transparent 1.2px), radial-gradient(rgba(0,0,0,0.035) 1.2px, transparent 1.2px)";
const CHAT_BG_SIZE = "28px 28px, 28px 28px";
const CHAT_BG_POSITION = "0 0, 14px 14px";

// Timing animasi chat (ms)
const READ_DELAY = 600; // klik -> ceklis biru + mulai typing
const LINK_DELAY = 700; // jeda ke bubble kedua (yang ada tombol link)

type FaqLink = { text: string; label: string; href: string };

type FaqItem = {
  id: string;
  q: string;
  a: string;
  // Kalau ada, muncul sebagai bubble kedua berisi teks + tombol.
  link?: FaqLink;
};

type Topic = {
  id: string;
  name: string;
  icon: LucideIcon;
  intro: string;
  faqs: FaqItem[];
};

// Isi mengacu ke company profile. Hal yang gak ada di compro (angka MOQ,
// lama kirim, metode bayar spesifik, dll) sengaja gak disebut — diarahkan
// ke tim. Nama badan hukum sengaja gak dipakai, cukup brand "Makmur A3'S".
const TOPICS: Topic[] = [
  {
    id: "tentang",
    name: "Tentang Kami",
    icon: Building2,
    intro: "Mau kenalan dulu sama Makmur A3'S?",
    faqs: [
      {
        id: "tentang-1",
        q: "Makmur A3'S bergerak di bidang apa?",
        a: "Kami distributor kebutuhan HORECA (hotel, restoran, katering) yang melayani area Jabodetabek dan sekitarnya.",
      },
      {
        id: "tentang-2",
        q: "Kenapa pilih Makmur A3'S?",
        a: "Kami fokus di produk berkualitas, layanan cepat dan responsif, harga yang bersaing, dan fleksibel buat kebutuhan khusus. Tujuan kami jadi mitra jangka panjang buat usaha kamu.",
      },
      {
        id: "tentang-3",
        q: "Udah dipercaya siapa aja?",
        a: "Kami sudah dipercaya berbagai pelaku usaha kuliner di Jabodetabek dan sekitarnya, mulai dari restoran, kafe, sampai usaha lainnya di sektor HORECA. Jaringan kemitraan kami terus bertambah.",
      },
    ],
  },
  {
    id: "produk",
    name: "Produk",
    icon: ShoppingBag,
    intro: "Mau tau produk apa aja yang tersedia?",
    faqs: [
      {
        id: "produk-1",
        q: "Produk apa aja yang tersedia?",
        a: "Ada empat kelompok besar: kemasan makanan, plastik & kantong, perlengkapan makan dan operasional, serta groceries. Rinciannya bisa kamu tanyain satu-satu di sini.",
        link: {
          text: "Daftar lengkapnya ada di halaman Produk ya.",
          label: "Lihat Produk",
          href: PRODUK_HREF,
        },
      },
      {
        id: "produk-2",
        q: "Kemasan makanan apa aja?",
        a: "Antara lain cup plastik dan cup kertas dengan lid (dari 35 ml sampai 650 ml, plus cup plastik 12 oz dan 16 oz), thinwall, tray & foil alumunium beserta lid, bento, kraft paper box, dus berbagai ukuran, paper bag, drink tray, kertas nasi, kertas shawarma, dan baking paper.",
      },
      {
        id: "produk-3",
        q: "Plastik dan kantong apa aja?",
        a: "Ada kantong plastik berbagai ukuran, plastik PE, plastik klip, plastik OPP, plastik bawang, plastik anti panas, plastik sheet/alas, plastik vaccum, plastik sealed minuman, plastik wrapping, kantong sampah, dan polymailer.",
      },
      {
        id: "produk-4",
        q: "Perlengkapan makan, operasional, dan groceries?",
        a: "Perlengkapan: sendok, garpu, sedotan, stirrer, tusuk sate, tusuk gigi, tisu, handglove (latex dan plastik), kertas thermal, lakban, tali rafia, karet gelang, dan nampan tampah. Groceries: arang batok kelapa, kacang almond sliced, dan kelapa parut kering.",
      },
      {
        id: "produk-5",
        q: "Produk apa aja yang bisa custom?",
        a: "Cup plastik/kertas, kraft paper, dan bento bisa dibuat custom. Ceritain kebutuhan kamu ke tim kami, nanti dibantu sesuai spesifikasinya.",
      },
      {
        id: "produk-6",
        q: "Produk yang aku cari gak ada di daftar?",
        a: "Tetap tanyain aja. Sebutin produk dan ukuran yang kamu cari, nanti tim kami bantu cek apa bisa disiapkan. Kami melayani pengadaan kebutuhan HORECA sesuai permintaan.",
      },
    ],
  },
  {
    id: "order",
    name: "Cara Order",
    icon: ClipboardList,
    intro: "Ada yang mau ditanyain soal cara order atau minimum pemesanan?",
    faqs: [
      {
        id: "order-1",
        q: "Gimana cara mulai order?",
        a: "Kamu bisa kirim daftar produk yang dibutuhin, nanti tim kami bantu hitungin quotation berdasarkan stok yang tersedia.",
      },
      {
        id: "order-2",
        q: "Ada minimum order (MOQ)?",
        a: "Minimum order bisa beda-beda tergantung jenis produk dan kemasannya. Share aja produk yang kamu incar, nanti tim kami infoin MOQ pastinya.",
      },
      {
        id: "order-3",
        q: "Bisa custom ukuran atau spesifikasi?",
        a: "Bisa untuk beberapa produk, misalnya cup, kraft paper, dan bento. Kirim spesifikasi yang kamu mau ke tim kami dulu, nanti dicek kelayakannya.",
      },
      {
        id: "order-4",
        q: "Bisa konsultasi buat konsep usaha baru?",
        a: "Bisa. Kami juga menerima konsultasi pengadaan bahan khusus sesuai konsep usaha kamu. Ceritain konsepnya ke tim kami.",
      },
    ],
  },
  {
    id: "kerjasama",
    name: "Kerjasama Rutin",
    icon: Handshake,
    intro: "Tertarik langganan rutin atau order volume besar?",
    faqs: [
      {
        id: "kerja-1",
        q: "Bisa kerjasama supply rutin bulanan?",
        a: "Bisa. Kami memang fokus membangun kemitraan jangka panjang dengan pelaku usaha HORECA.",
        link: {
          text: "Mulai diskusi kebutuhan kamu lewat form pengajuan.",
          label: "Ajukan Kerja Sama",
          href: KERJASAMA_HREF,
        },
      },
      {
        id: "kerja-2",
        q: "Ada penyesuaian harga buat volume besar?",
        a: "Bisa didiskusikan, tergantung jumlah dan kerutinan order. Ceritain skala kebutuhan kamu, nanti tim kami hitungin penawarannya.",
      },
    ],
  },
  {
    id: "pembayaran",
    name: "Pembayaran",
    icon: Wallet,
    intro: "Ada pertanyaan soal cara bayar atau dokumen penagihan?",
    faqs: [
      {
        id: "bayar-1",
        q: "Metode pembayaran apa aja yang diterima?",
        a: "Metode pembayaran dikonfirmasi langsung sama tim kami saat order diajukan. Untuk order rutin, skema pembayarannya bisa didiskusikan.",
      },
      {
        id: "bayar-2",
        q: "Gimana soal dokumen penagihan?",
        a: "Soal dokumen penagihan, silakan diskusikan langsung dengan tim kami ya, nanti disesuaikan dengan kebutuhan usaha kamu.",
      },
    ],
  },
  {
    id: "pengiriman",
    name: "Pengiriman",
    icon: Truck,
    intro: "Nanya-nanya soal jangkauan kirim atau estimasi waktu sampai?",
    faqs: [
      {
        id: "kirim-1",
        q: "Area pengiriman sampai mana aja?",
        a: "Kami melayani area Jabodetabek dan sekitarnya. Kalau tujuan kamu di luar itu, kabarin kotanya ke tim kami buat dicek.",
      },
      {
        id: "kirim-2",
        q: "Ada pengiriman terjadwal?",
        a: "Ada, kami punya layanan pengiriman cepat dan terjadwal untuk mitra. Jadwalnya bisa didiskusikan sesuai kebutuhan kamu.",
      },
      {
        id: "kirim-3",
        q: "Berapa lama estimasi sampainya?",
        a: "Tergantung ketersediaan stok dan lokasi tujuan. Tim kami bisa kasih estimasi begitu tau produk dan alamat tujuan.",
      },
      {
        id: "kirim-4",
        q: "Ongkirnya gimana?",
        a: "Detail biaya kirim disesuaikan dengan produk dan tujuan pengiriman. Tanyain ke tim kami ya.",
      },
    ],
  },
  {
    id: "retur",
    name: "Retur & Komplain",
    icon: RotateCcw,
    intro: "Ada barang yang gak sesuai, atau mau sampaikan komplain?",
    faqs: [
      {
        id: "retur-1",
        q: "Barang yang diterima gak sesuai, gimana?",
        a: "Langsung hubungi tim kami dengan foto barang dan bukti pesanan, biar cepat dicek dan ditindaklanjuti.",
      },
      {
        id: "retur-2",
        q: "Bisa tukar atau retur barang?",
        a: "Tergantung kondisi dan jenis produknya, jadi perlu dicek kasus per kasus. Sampaikan detailnya dulu ke tim kami ya.",
      },
    ],
  },
];

type ChatMessage = {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
  status?: "delivered" | "read"; // opsional biar session lama tetap kebaca
  link?: { label: string; href: string };
};

function nowLabel() {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function waCallLink() {
  const text = "Halo Admin, saya mau bertanya.";
  return `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
}

// sessionStorage: riwayat bertahan selama tab kebuka, bersih pas tab ditutup.
function loadSession(topicId: string): {
  messages: ChatMessage[];
  answered: string[];
} | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(`bantuan-chat:${topicId}`);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveSession(
  topicId: string,
  data: { messages: ChatMessage[]; answered: string[] },
) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(
      `bantuan-chat:${topicId}`,
      JSON.stringify(data),
    );
  } catch {
    // penuh/gak tersedia — chat tetap jalan di memori
  }
}

// Logo WhatsApp (path yang sama dengan WhatsAppFloatingButton)
function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
    </svg>
  );
}

// Foto kalau ada, fallback ke inisial "A3" kalau gagal load.
function CsAvatar({ className = "w-10 h-10" }: { className?: string }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div
        className={`${className} rounded-full bg-brand/10 flex items-center justify-center shrink-0`}
      >
        <span className="text-brand font-semibold text-xs">A3</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={AVATAR_SRC}
      alt={CS_NAME}
      onError={() => setImgError(true)}
      className={`${className} rounded-full object-cover shrink-0`}
    />
  );
}

export default function BantuanPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messagesByTopic, setMessagesByTopic] = useState<
    Record<string, ChatMessage[]>
  >({});
  const [answeredByTopic, setAnsweredByTopic] = useState<
    Record<string, string[]>
  >({});
  const [typingTopicId, setTypingTopicId] = useState<string | null>(null);
  // Kunci tombol FAQ dari klik sampai balasan terakhir masuk
  const [busyTopicId, setBusyTopicId] = useState<string | null>(null);
  // Langkah bubble penutup per topik: 0 = belum, 1 = bubble teks, 2 = bubble
  // tombol WA. Topik yang di-restore (semua FAQ udah dijawab) langsung tampil
  // penuh, jadi default-nya 2 kalau belum ada entry.
  const [closingStepByTopic, setClosingStepByTopic] = useState<
    Record<string, number>
  >({});
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  // Jarak widget dari atas halaman (= tinggi navbar/header situs). Diukur
  // otomatis biar gak perlu nebak angka px; 130 cuma nilai awal sebelum diukur.
  const [topOffset, setTopOffset] = useState(130);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const activeTopic = useMemo(
    () => TOPICS.find((t) => t.id === activeId) ?? null,
    [activeId],
  );

  useEffect(() => {
    function measure() {
      const el = sectionRef.current;
      if (!el) return;
      // Pas room chat mobile lagi fixed, posisinya bukan posisi in-flow
      if (getComputedStyle(el).position === "fixed") return;
      setTopOffset(Math.round(el.getBoundingClientRect().top + window.scrollY));
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  // Ingat topik yang lagi dibuka: pas refresh atau balik dari halaman lain
  // (Lihat Produk -> Back), user langsung kembali ke room yang sama.
  useEffect(() => {
    try {
      const last = window.sessionStorage.getItem("bantuan-active");
      if (last && TOPICS.some((t) => t.id === last)) setActiveId(last);
    } catch {
      // sessionStorage gak tersedia — mulai dari list topik aja
    }
  }, []);

  useEffect(() => {
    if (!activeId) return;
    try {
      window.sessionStorage.setItem("bantuan-active", activeId);
    } catch {}
  }, [activeId]);

  // Bersihin timer pas halaman ditutup
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  function later(fn: () => void, ms: number) {
    timersRef.current.push(setTimeout(fn, ms));
  }

  useEffect(() => {
    if (!activeId) return;
    setMessagesByTopic((prev) => {
      if (prev[activeId]) return prev;
      const saved = loadSession(activeId);
      // Ceklis user dipaksa "read" biar gak nyangkut abu pas di-restore
      const restored = (saved?.messages ?? []).map((m) =>
        m.sender === "user" ? { ...m, status: "read" as const } : m,
      );
      return { ...prev, [activeId]: restored };
    });
    setAnsweredByTopic((prev) => {
      if (prev[activeId]) return prev;
      const saved = loadSession(activeId);
      return { ...prev, [activeId]: saved?.answered ?? [] };
    });
  }, [activeId]);

  useEffect(() => {
    // Jangan nyimpen sebelum data topik ini selesai di-load, biar
    // session lama gak ke-timpa array kosong.
    if (!activeId) return;
    if (!messagesByTopic[activeId] || !answeredByTopic[activeId]) return;
    saveSession(activeId, {
      messages: messagesByTopic[activeId],
      answered: answeredByTopic[activeId],
    });
  }, [activeId, messagesByTopic, answeredByTopic]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messagesByTopic, typingTopicId, closingStepByTopic, activeId]);

  // Mobile: kunci scroll body pas room chat full-screen
  useEffect(() => {
    if (typeof window === "undefined" || !activeId) return;
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (!isMobile) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [activeId]);

  function pushMessage(topicId: string, msg: ChatMessage) {
    setMessagesByTopic((prev) => ({
      ...prev,
      [topicId]: [...(prev[topicId] ?? []), msg],
    }));
  }

  function setClosingStep(topicId: string, step: number) {
    setClosingStepByTopic((prev) => ({ ...prev, [topicId]: step }));
  }

  // Urutan: user (ceklis 2 abu) -> ceklis biru + typing -> jawaban
  // -> (kalau ada link) typing lagi -> bubble kedua berisi tombol.
  function askQuestion(topic: Topic, faq: FaqItem) {
    const stamp = Date.now();
    const userMsgId = `${faq.id}-q-${stamp}`;
    const link = faq.link;
    // Pertanyaan terakhir di topik ini -> setelah jawabannya, bubble penutup
    // masuk bertahap (bukan langsung muncul).
    const isLast =
      (answeredByTopic[topic.id] ?? []).length + 1 >= topic.faqs.length;
    if (isLast) setClosingStep(topic.id, 0);

    pushMessage(topic.id, {
      id: userMsgId,
      sender: "user",
      text: faq.q,
      time: nowLabel(),
      status: "delivered",
    });
    setAnsweredByTopic((prev) => ({
      ...prev,
      [topic.id]: [...(prev[topic.id] ?? []), faq.id],
    }));
    setBusyTopicId(topic.id);

    const clear = () => {
      setTypingTopicId((cur) => (cur === topic.id ? null : cur));
      setBusyTopicId((cur) => (cur === topic.id ? null : cur));
    };

    const finish = () => {
      if (!isLast) {
        clear();
        return;
      }
      // Jawaban terakhir udah masuk: jeda sebentar -> typing -> bubble teks
      // -> typing lagi -> bubble tombol WA. Tombol FAQ tetap terkunci sampai selesai.
      const typingOff = () =>
        setTypingTopicId((cur) => (cur === topic.id ? null : cur));
      typingOff();
      later(() => setTypingTopicId(topic.id), 600);
      later(() => {
        typingOff();
        setClosingStep(topic.id, 1);
      }, 1700);
      later(() => setTypingTopicId(topic.id), 2200);
      later(() => {
        setClosingStep(topic.id, 2);
        clear();
      }, 3000);
    };

    later(() => {
      setMessagesByTopic((prev) => ({
        ...prev,
        [topic.id]: (prev[topic.id] ?? []).map((m) =>
          m.id === userMsgId ? { ...m, status: "read" } : m,
        ),
      }));
      setTypingTopicId(topic.id);
    }, READ_DELAY);

    later(
      () => {
        pushMessage(topic.id, {
          id: `${faq.id}-a-${stamp}`,
          sender: "bot",
          text: faq.a,
          time: nowLabel(),
        });
        if (!link) {
          finish();
          return;
        }
        later(() => {
          pushMessage(topic.id, {
            id: `${faq.id}-l-${stamp}`,
            sender: "bot",
            text: link.text,
            time: nowLabel(),
            link: { label: link.label, href: link.href },
          });
          finish();
        }, LINK_DELAY);
      },
      READ_DELAY + 900 + Math.random() * 600,
    );
  }

  function sendToWhatsApp() {
    const question = draft.trim();
    if (!question) return;

    const text = `${WA_GREETING}\n\n${question}`;
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setDraft("");
  }

  const activeMessages = activeId ? (messagesByTopic[activeId] ?? []) : [];
  const activeAnswered = activeId ? (answeredByTopic[activeId] ?? []) : [];
  const remainingFaqs =
    activeTopic?.faqs.filter((f) => !activeAnswered.includes(f.id)) ?? [];
  const isTyping = typingTopicId === activeTopic?.id;
  const isBusy = busyTopicId === activeTopic?.id;
  const closingStep = activeId ? (closingStepByTopic[activeId] ?? 2) : 2;

  return (
    // Desktop: widget in-flow, tingginya = sisa layar di bawah navbar
    // (tinggi navbar diukur otomatis lewat sectionRef), max 900px.
    // Footer langsung di bawah widget, jadi baru kelihatan pas di-scroll.
    // Mobile: list topik setinggi layar; room chat = fixed inset-0.
    <section
      ref={sectionRef}
      style={{ "--bantuan-top": `${topOffset}px` } as React.CSSProperties}
      className={
        activeId
          ? "fixed inset-0 z-[999] bg-white md:static md:inset-auto md:z-auto md:border-b md:border-line"
          : "relative w-full bg-white md:border-b md:border-line"
      }
    >
      <div
        className={
          activeId
            ? "w-full h-full md:h-[min(calc(100dvh-var(--bantuan-top)),900px)] md:min-h-[440px] flex"
            : "w-full h-[calc(100dvh-var(--bantuan-top))] min-h-[480px] md:h-[min(calc(100dvh-var(--bantuan-top)),900px)] md:min-h-[440px] flex"
        }
      >
        {/* Sidebar — daftar topik */}
        <aside
          className={`w-full md:w-[340px] shrink-0 border-r border-line flex-col bg-white ${
            activeId ? "hidden md:flex" : "flex"
          }`}
        >
          <div className="px-5 py-4 border-b border-line shrink-0">
            <h1 className="font-display text-xl">Pusat Bantuan</h1>
            <p className="text-xs text-ink/40 mt-0.5">
              Pilih topik buat lihat pertanyaan yang sering ditanyain
            </p>
          </div>
          <div className="flex-1 overflow-y-auto">
            {TOPICS.map((t) => {
              const msgs = messagesByTopic[t.id];
              const preview =
                msgs && msgs.length > 0 ? msgs[msgs.length - 1].text : t.intro;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveId(t.id)}
                  className={`relative w-full flex items-center gap-3.5 px-5 py-3.5 text-left border-b border-line/60 transition-colors ${
                    activeId === t.id ? "bg-sand" : "hover:bg-sand/60"
                  }`}
                >
                  {activeId === t.id && (
                    <span className="absolute left-0 inset-y-0 w-[3px] bg-brand" />
                  )}
                  <div className="w-12 h-12 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                    <t.icon className="w-5 h-5 text-brand" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm text-ink truncate">
                      {t.name}
                    </div>
                    <div className="text-xs text-ink/45 truncate mt-0.5">
                      {preview}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Chat area — key bikin panel remount tiap ganti topik (animasi slide-in) */}
        <div
          key={activeId ?? "empty"}
          className={`chat-panel-enter flex-1 flex-col min-w-0 ${activeId ? "flex" : "hidden md:flex"}`}
        >
          <style jsx>{`
            @keyframes chatPanelSlideIn {
              from {
                opacity: 0;
                transform: translateX(12px);
              }
              to {
                opacity: 1;
                transform: translateX(0);
              }
            }
            .chat-panel-enter {
              animation: chatPanelSlideIn 200ms ease-out;
            }
          `}</style>
          {activeTopic ? (
            <>
              <header className="flex items-center gap-3 px-4 md:px-6 py-3.5 border-b border-line shrink-0 bg-white">
                <button
                  onClick={() => {
                    setActiveId(null);
                    try {
                      window.sessionStorage.removeItem("bantuan-active");
                    } catch {}
                  }}
                  className="md:hidden w-9 h-9 -ml-1 rounded-full flex items-center justify-center hover:bg-sand transition-colors"
                  aria-label="Kembali"
                >
                  <ArrowLeft
                    className="w-5 h-5 text-ink/60"
                    strokeWidth={1.75}
                  />
                </button>
                <CsAvatar />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm text-ink truncate">
                    {CS_NAME}
                  </div>
                  <div className="text-xs text-ink/40">
                    {isTyping ? "typing…" : "online"}
                  </div>
                </div>
              </header>

              <div
                ref={scrollRef}
                className={`flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-3 ${CHAT_BG_COLOR}`}
                style={{
                  backgroundImage: CHAT_BG_PATTERN,
                  backgroundSize: CHAT_BG_SIZE,
                  backgroundPosition: CHAT_BG_POSITION,
                }}
              >
                {activeMessages.length === 0 && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] md:max-w-[60%] bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-ink shadow-sm">
                      {activeTopic.intro}
                    </div>
                  </div>
                )}

                {activeMessages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] md:max-w-[60%] px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
                        m.sender === "user"
                          ? "bg-brand text-white rounded-2xl rounded-tr-sm"
                          : "bg-white text-ink rounded-2xl rounded-tl-sm"
                      }`}
                    >
                      <div>{m.text}</div>
                      {m.link && (
                        <Link
                          href={m.link.href}
                          className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-brand/30 px-3.5 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white transition-colors"
                        >
                          {m.link.label}
                          <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                        </Link>
                      )}
                      <div
                        className={`flex items-center gap-1 mt-1 text-[10px] ${
                          m.sender === "user"
                            ? "text-white/70 justify-end"
                            : "text-ink/35"
                        }`}
                      >
                        {m.time}
                        {m.sender === "user" && (
                          <CheckCheck
                            className={`w-3.5 h-3.5 ${
                              m.status === "read" ? "text-[#53bdeb]" : ""
                            }`}
                            strokeWidth={2}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {remainingFaqs.length === 0 &&
                  activeMessages.length > 0 &&
                  closingStep >= 1 && (
                    <div className="space-y-3">
                      <div className="flex justify-start">
                        <div className="max-w-[80%] md:max-w-[60%] bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-ink shadow-sm">
                          Masih ada yang mau ditanyain? Ketik aja di bawah,
                          pertanyaanmu bakal diteruskan ke tim kami lewat
                          WhatsApp.
                        </div>
                      </div>
                      {closingStep >= 2 && (
                        <div className="flex justify-start">
                          <div className="max-w-[80%] md:max-w-[60%] bg-white rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-ink shadow-sm">
                            <div>Atau langsung chat sama tim kami ya.</div>
                            <a
                              href={waCallLink()}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="mt-2 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1ebe5b] transition-colors"
                            >
                              <WhatsAppIcon />
                              Chat via WhatsApp
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                {/* Harus setelah bubble penutup, biar titik typing selalu di paling bawah */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-ink/30 animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-ink/30 animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-ink/30 animate-bounce" />
                    </div>
                  </div>
                )}

                {remainingFaqs.length > 0 && (
                  <div className="flex flex-col items-end gap-2 pt-2">
                    {remainingFaqs.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => askQuestion(activeTopic, f)}
                        disabled={isBusy}
                        className={`max-w-[80%] md:max-w-[60%] text-left text-sm px-4 py-2.5 rounded-2xl rounded-tr-sm border transition-colors ${
                          isBusy
                            ? "border-line text-ink/30 bg-white/60 cursor-not-allowed"
                            : "border-brand/30 text-brand bg-white hover:bg-brand hover:text-white"
                        }`}
                      >
                        {f.q}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="shrink-0 border-t border-line px-3 md:px-4 py-3 bg-white">
                <div className="flex items-center gap-2">
                  <input
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") sendToWhatsApp();
                    }}
                    placeholder="Ketik pertanyaan, lanjut ke WhatsApp…"
                    className="flex-1 rounded-full bg-sand px-4 py-2.5 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brand/40"
                  />
                  <button
                    onClick={sendToWhatsApp}
                    disabled={!draft.trim()}
                    aria-label="Kirim ke WhatsApp"
                    className="w-10 h-10 shrink-0 rounded-full bg-brand text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand/90 transition-colors"
                  >
                    <Send className="w-4.5 h-4.5" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center px-8">
              <div className="max-w-xs flex flex-col items-center">
                <CsAvatar className="w-16 h-16 mb-4" />
                <p className="text-sm text-ink/45 leading-relaxed">
                  Pilih topik di sebelah kiri buat mulai ngobrol sama {CS_NAME},
                  atau ketik pertanyaan langsung ke tim kami lewat WhatsApp.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
