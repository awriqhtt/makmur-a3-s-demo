import { ArrowUpRight } from "lucide-react";
import Button from "@/components/ui/Button";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      className={className}
    >
      <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
    </svg>
  );
}

export default function PromoBanner() {
  return (
    <section className="max-w-7xl mx-auto px-5 md:px-8">
      <div className="relative overflow-hidden rounded-3xl bg-brand text-white">
        {/* gradient base + balanced wave, same treatment as LocationAvailabilityBanner */}
        <div
          className="absolute inset-0 pointer-events-none overflow-hidden"
          aria-hidden="true"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-black/25 via-transparent to-black/10" />

          <svg
            className="absolute bottom-0 left-0 w-full h-10 md:h-16"
            viewBox="0 0 1440 100"
            preserveAspectRatio="none"
            fill="none"
          >
            <path
              d="M0 20 C 480 95, 960 -15, 1440 20 L1440 100 L0 100 Z"
              fill="rgba(255,255,255,0.06)"
            />
            <path
              d="M0 40 C 480 105, 960 5, 1440 40 L1440 100 L0 100 Z"
              fill="rgba(0,0,0,0.12)"
            />
          </svg>
        </div>

        <div className="relative z-10 px-6 md:px-10 pt-8 md:pt-10 pb-10 md:pb-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/15 flex items-center justify-center shrink-0">
              <WhatsAppIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-display text-lg md:text-xl text-white leading-snug">
                Butuh volume besar atau request khusus?
              </h3>
              <p className="text-sm text-white/70 mt-1">
                Chat tim kami langsung — kami bantu susun kebutuhan dan harga
                sesuai skala bisnis kamu.
              </p>
            </div>
          </div>

          <a
            href="https://wa.me/6287722888916"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <Button className="!bg-white !text-ink hover:!bg-ink hover:!text-white">
              Chat via WhatsApp <ArrowUpRight className="w-4 h-4" />
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}
