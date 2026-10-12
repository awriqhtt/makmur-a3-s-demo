"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCheck, Send } from "lucide-react";

const WA_NUMBER = "6287878311243";
const CS_NAME = "Makmur A3'S Support";
const AVATAR_SRC = "/avatars/admin-cs.jpg";
// Ganti kalau route halaman bantuan beda.
const BANTUAN_HREF = "/bantuan";

// Samain dengan background chat di halaman Bantuan.
const CHAT_BG_COLOR = "bg-[#ece4d6]";
const CHAT_BG_PATTERN =
  "radial-gradient(rgba(0,0,0,0.055) 1.2px, transparent 1.2px), radial-gradient(rgba(0,0,0,0.035) 1.2px, transparent 1.2px)";
const CHAT_BG_SIZE = "28px 28px, 28px 28px";
const CHAT_BG_POSITION = "0 0, 14px 14px";

// Timing animasi (ms), disamakan dengan halaman Bantuan.
const READ_DELAY = 500; // klik -> ceklis biru + mulai typing
const ANSWER_DELAY = 900; // typing -> jawaban masuk

// Pilihan pertanyaan teratas. Teks jawaban DISALIN dari TOPICS di halaman
// Bantuan (id sama). Kalau jawaban di sana diubah, ubah di sini juga.
const PREVIEW_FAQS = [
  {
    id: "tentang-1",
    q: "Makmur A3'S bergerak di bidang apa?",
    a: "Kami distributor kebutuhan HORECA (hotel, restoran, katering) yang melayani area Jabodetabek dan sekitarnya.",
  },
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
    id: "kirim-1",
    q: "Area pengiriman sampai mana aja?",
    a: "Kami melayani area Jabodetabek dan sekitarnya. Kalau tujuan kamu di luar itu, kabarin kotanya ke tim kami buat dicek.",
  },
];

type Msg = {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
  status?: "delivered" | "read";
};

function nowLabel() {
  return new Date().toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function CsAvatar({ className = "w-9 h-9" }: { className?: string }) {
  const [imgError, setImgError] = useState(false);

  if (imgError) {
    return (
      <div
        className={`${className} rounded-full bg-brand/10 flex items-center justify-center shrink-0`}
      >
        <span className="text-brand font-semibold text-[11px]">A3</span>
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

// Tombol ke Pusat Bantuan — dipakai di bubble pembuka & penutup biar
// tampilannya seragam. Label dikunci satu baris (whitespace-nowrap) dan
// tombol seukuran isinya, bukan selebar bubble.
function HelpLink() {
  return (
    <Link
      href={BANTUAN_HREF}
      className="mt-3 inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-brand/30 px-3.5 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white hover:border-brand transition-colors"
    >
      Buka Pusat Bantuan
      <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
    </Link>
  );
}

export default function FaqPreview() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [answered, setAnswered] = useState<string[]>([]);
  const [typing, setTyping] = useState(false);
  const [busy, setBusy] = useState(false);
  // Bubble penutup bertahap: 0 = belum, 1 = bubble teks, 2 = bubble link.
  const [closingStep, setClosingStep] = useState(0);
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach(clearTimeout);
  }, []);

  // Scroll cuma di dalam frame HP, bukan seluruh halaman.
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, typing, closingStep]);

  function later(fn: () => void, ms: number) {
    timersRef.current.push(setTimeout(fn, ms));
  }

  function ask(faq: (typeof PREVIEW_FAQS)[number]) {
    if (busy) return;
    const stamp = Date.now();
    const qId = `${faq.id}-q-${stamp}`;
    const isLast = answered.length + 1 >= PREVIEW_FAQS.length;

    setBusy(true);
    setMessages((prev) => [
      ...prev,
      {
        id: qId,
        sender: "user",
        text: faq.q,
        time: nowLabel(),
        status: "delivered",
      },
    ]);
    setAnswered((prev) => [...prev, faq.id]);

    later(() => {
      setMessages((prev) =>
        prev.map((m) => (m.id === qId ? { ...m, status: "read" } : m)),
      );
      setTyping(true);
    }, READ_DELAY);

    later(() => {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: `${faq.id}-a-${stamp}`,
          sender: "bot",
          text: faq.a,
          time: nowLabel(),
        },
      ]);

      if (!isLast) {
        setBusy(false);
        return;
      }

      // Jawaban terakhir udah masuk: jeda -> typing -> bubble teks
      // -> jeda -> typing -> bubble link. Tombol dikunci sampai selesai.
      later(() => setTyping(true), 600);
      later(() => {
        setTyping(false);
        setClosingStep(1);
      }, 1700);
      later(() => setTyping(true), 2200);
      later(() => {
        setTyping(false);
        setClosingStep(2);
        setBusy(false);
      }, 3000);
    }, READ_DELAY + ANSWER_DELAY);
  }

  function sendToWhatsApp() {
    const text = draft.trim();
    if (!text) return;
    // Template pembuka, lalu pertanyaan user di baris baru.
    const message = `Halo Makmur A3'S, saya mau tanya:\n${text}`;
    const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setDraft("");
  }

  const remaining = PREVIEW_FAQS.filter((f) => !answered.includes(f.id));

  return (
    <div>
      {/* Frame HP */}
      <div className="relative mx-auto w-[290px] sm:w-[310px] rounded-[2.75rem] bg-ink p-[10px] shadow-[0_30px_60px_-20px_rgba(0,0,0,0.35)]">
        <div className="absolute top-[18px] left-1/2 -translate-x-1/2 w-20 h-5 rounded-full bg-ink z-10" />
        <div className="rounded-[2.1rem] overflow-hidden bg-white h-[540px] flex flex-col">
          <header className="flex items-center gap-2.5 px-4 pt-9 pb-3 border-b border-line shrink-0 bg-white">
            <CsAvatar />
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-[13px] text-ink truncate">
                {CS_NAME}
              </div>
              <div className="text-[11px] text-ink/40">
                {typing ? "typing…" : "online"}
              </div>
            </div>
          </header>

          <div
            ref={scrollRef}
            className={`flex-1 overflow-y-auto px-3 py-4 space-y-2.5 ${CHAT_BG_COLOR}`}
            style={{
              backgroundImage: CHAT_BG_PATTERN,
              backgroundSize: CHAT_BG_SIZE,
              backgroundPosition: CHAT_BG_POSITION,
            }}
          >
            <div className="flex justify-start">
              <div className="max-w-[85%] bg-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[13px] text-ink shadow-sm">
                <div>
                  Mau tau seputar Makmur A3&apos;S? Pilih pertanyaan di bawah
                  ya, atau lihat daftar lengkapnya.
                </div>
                <HelpLink />
              </div>
            </div>

            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2 text-[13px] leading-relaxed shadow-sm ${
                    m.sender === "user"
                      ? "bg-brand text-white rounded-2xl rounded-tr-sm"
                      : "bg-white text-ink rounded-2xl rounded-tl-sm"
                  }`}
                >
                  <div>{m.text}</div>
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

            {/* Bubble penutup, masuk bertahap setelah jawaban terakhir */}
            {remaining.length === 0 && closingStep >= 1 && (
              <div className="space-y-2.5">
                <div className="flex justify-start">
                  <div className="max-w-[85%] bg-white rounded-2xl rounded-tl-sm px-3.5 py-2 text-[13px] text-ink shadow-sm">
                    Masih ada yang mau ditanyain? Ketik aja di bawah,
                    pertanyaanmu bakal diteruskan ke tim kami lewat WhatsApp.
                  </div>
                </div>
                {closingStep >= 2 && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] bg-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 text-[13px] text-ink shadow-sm">
                      <div>Atau cek jawaban dari pertanyaan lainnya.</div>
                      <HelpLink />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Harus setelah bubble penutup, biar titik typing selalu di bawah */}
            {typing && (
              <div className="flex justify-start">
                <div className="bg-white rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-ink/30 animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-ink/30 animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-ink/30 animate-bounce" />
                </div>
              </div>
            )}

            {remaining.length > 0 && (
              <div className="flex flex-col items-end gap-2 pt-1">
                {remaining.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => ask(f)}
                    disabled={busy}
                    className={`max-w-[85%] text-left text-[13px] px-3.5 py-2 rounded-2xl rounded-tr-sm border transition-colors ${
                      busy
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

          <div className="shrink-0 border-t border-line px-3 py-3 bg-white">
            <div className="flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendToWhatsApp();
                }}
                placeholder="Ketik pertanyaan, lanjut ke WhatsApp…"
                className="flex-1 min-w-0 rounded-full bg-sand px-4 py-2.5 text-[13px] text-ink placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-brand/40"
              />
              <button
                onClick={sendToWhatsApp}
                disabled={!draft.trim()}
                aria-label="Kirim ke WhatsApp"
                className="w-9 h-9 shrink-0 rounded-full bg-brand text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-brand/90 transition-colors"
              >
                <Send className="w-4 h-4" strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
