"use client";

import { useState, FormEvent } from "react";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import Button from "@/components/ui/Button";
import SectionHeading from "@/components/ui/SectionHeading";

const WHATSAPP_NUMBER = "6287878311243";

const PARTNERSHIP_TYPES = [
  "Supplier bahan baku / material",
  "Distributor / reseller",
  "Kerja sama korporat / kontrak rutin",
  "Lainnya",
];

type FormState = {
  company: string;
  type: string;
  contactName: string;
  role: string;
  phone: string;
  email: string;
  city: string;
  message: string;
};

const INITIAL_FORM: FormState = {
  company: "",
  type: "",
  contactName: "",
  role: "",
  phone: "",
  email: "",
  city: "",
  message: "",
};

export default function KerjasamaPage() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState<FormState>(INITIAL_FORM);

  const update =
    (field: keyof FormState) =>
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >,
    ) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const buildWhatsAppUrl = () => {
    const message = encodeURIComponent(
      `Halo Makmur A3'S, saya ingin mengajukan kerja sama.\n\n` +
        `Perusahaan/usaha: ${form.company}\n` +
        `Jenis kerja sama: ${form.type}\n` +
        `Narahubung: ${form.contactName}${form.role ? ` (${form.role})` : ""}\n` +
        `WhatsApp/telepon: ${form.phone}\n` +
        (form.email ? `Email: ${form.email}\n` : "") +
        `Kota/wilayah: ${form.city}\n\n` +
        `Rencana kerja sama:\n${form.message}`,
    );
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${message}`;
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      window.open(buildWhatsAppUrl(), "_blank");
      setSending(false);
      setSubmitted(true);
    }, 450);
  };

  const reopenWhatsApp = () => {
    window.open(buildWhatsAppUrl(), "_blank");
  };

  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-12 md:py-16">
      <div className="max-w-2xl mx-auto text-center">
        <SectionHeading
          eyebrow="Ajukan kerja sama"
          title="Yuk, jadi mitra Makmur A3'S"
          body="Isi profil usaha kamu, kami review dalam 2×24 jam, lalu lanjut ngobrol via WhatsApp."
        />
      </div>

      {/* FORM — di tengah, satu kolom */}
      <div className="max-w-2xl mx-auto border border-line rounded-3xl p-6 sm:p-7 md:p-9 mt-10">
        {submitted ? (
          <div className="py-12 sm:py-16 text-center">
            <CheckCircle2 className="w-10 h-10 text-brand mx-auto mb-4" />
            <h3 className="font-display text-2xl mb-2">Pengajuan terkirim</h3>
            <p className="text-ink/45 max-w-sm mx-auto mb-2">
              Kami sudah buka WhatsApp dengan ringkasan pengajuan kamu — tinggal
              kirim pesannya ke tim kami.
            </p>
            <p className="text-sm text-ink/35 mb-6">
              Tidak terbuka otomatis?{" "}
              <button
                type="button"
                onClick={reopenWhatsApp}
                className="text-brand underline underline-offset-2 hover:text-ink transition-colors"
              >
                Klik di sini
              </button>
            </p>
            <Button
              variant="outline"
              onClick={() => {
                setForm(INITIAL_FORM);
                setSubmitted(false);
              }}
            >
              Isi pengajuan lain
            </Button>
          </div>
        ) : (
          <form
            className="flex flex-col gap-6 sm:gap-7"
            onSubmit={handleSubmit}
          >
            <div>
              <div className="text-[11px] uppercase tracking-widest text-brand font-data font-semibold mb-3">
                Profil usaha
              </div>
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
                <Field
                  label="Nama perusahaan / usaha"
                  placeholder="PT / Nama usaha"
                  value={form.company}
                  onChange={update("company")}
                />
                <div>
                  <label className="text-xs uppercase tracking-widest text-ink/45 font-data mb-2 block">
                    Jenis kerja sama
                  </label>
                  <select
                    required
                    value={form.type}
                    onChange={update("type")}
                    className="w-full border border-line rounded-xl px-4 py-3 text-sm outline-none focus:border-ink bg-white"
                  >
                    <option value="" disabled>
                      Pilih jenis kerja sama
                    </option>
                    {PARTNERSHIP_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <Field
                    label="Kota / wilayah operasional"
                    placeholder="cth. Jakarta, Bandung"
                    value={form.city}
                    onChange={update("city")}
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-widest text-brand font-data font-semibold mb-3">
                Narahubung
              </div>
              <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
                <Field
                  label="Nama narahubung"
                  placeholder="Nama lengkap"
                  value={form.contactName}
                  onChange={update("contactName")}
                />
                <Field
                  label="Jabatan"
                  placeholder="cth. Owner, Purchasing Manager"
                  value={form.role}
                  onChange={update("role")}
                  required={false}
                  optional
                />
                <Field
                  label="WhatsApp / telepon"
                  placeholder="+62"
                  value={form.phone}
                  onChange={update("phone")}
                />
                <Field
                  label="Email"
                  placeholder="you@company.com"
                  type="email"
                  value={form.email}
                  onChange={update("email")}
                  required={false}
                  optional
                />
              </div>
            </div>

            <div>
              <label className="text-xs uppercase tracking-widest text-ink/45 font-data mb-2 block">
                Ceritakan rencana kerja sama kamu
              </label>
              <textarea
                required
                rows={4}
                value={form.message}
                onChange={update("message")}
                className="w-full border border-line rounded-xl px-4 py-3 text-sm outline-none focus:border-ink resize-none"
                placeholder="cth. Kami ingin jadi distributor resmi Makmur A3'S di wilayah Jawa Barat"
              />
            </div>

            <Button
              variant="brand"
              className="w-full sm:w-auto"
              type="submit"
              disabled={sending}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="w-4 h-4"
              >
                <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232" />
              </svg>
              {sending ? "Membuka WhatsApp..." : "Kirim & lanjut ke WhatsApp"}
              {!sending && <ArrowRight className="w-4 h-4" />}
            </Button>
            <p className="text-[11px] text-ink/35 -mt-3 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              Data kamu tidak dibagikan ke pihak ketiga.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  required = true,
  optional = false,
}: {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  optional?: boolean;
}) {
  return (
    <div>
      <label
        className={`text-xs uppercase tracking-widest font-data mb-2 block ${
          optional ? "text-ink/30" : "text-ink/45"
        }`}
      >
        {label}
      </label>
      <input
        required={required}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border border-line rounded-xl px-4 py-3 text-sm outline-none focus:border-ink"
      />
    </div>
  );
}
