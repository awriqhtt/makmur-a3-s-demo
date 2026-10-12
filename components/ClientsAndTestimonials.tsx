import SectionHeading from "@/components/ui/SectionHeading";

// 8 klien asli. File logo di /public/clients/ TIDAK diubah.
// Semua penyeragaman dilakukan di kode:
//  - `w` x `h`  : ukuran kotak tampil (px, desktop). Sudah dihitung dari luas
//                 isi logo supaya beban visualnya setara; logo tipis dibuat
//                 sedikit lebih besar dari logo solid. Di HP otomatis 80%.
//  - `crop`     : [lebar%, kiri%, atas%] untuk memotong padding kosong di
//                 sekeliling logo (kotak tampil = area isi logo saja).
//  - `round`    : logo bulat, dipotong bulat (buang sudut kotak/pola abu).
//  - `multiply` : logo punya background putih solid, di-"transparent-in"
//                 pakai mix-blend-multiply.
//
// TODO: Company Profile juga menyebut "Emados Elite" sebagai klien terpisah,
// belum ada file logonya di /public/clients/.
type Client = {
  name: string;
  logo: string;
  w: number;
  h: number;
  crop: [number, number, number];
  round?: boolean;
  multiply?: boolean;
};

const CLIENTS: Client[] = [
  {
    name: "HokBen",
    logo: "/clients/hokben.png",
    w: 66,
    h: 66,
    crop: [110.6, -5.8, -5.9],
    round: true,
  },
  {
    name: "Mak Gobang",
    logo: "/clients/mak-gobang.png",
    w: 99,
    h: 57,
    crop: [117.6, -12.1, -1],
  },
  {
    name: "Rindu Mu",
    logo: "/clients/rindumu.png",
    w: 66,
    h: 66,
    crop: [107.8, -3.6, -4.7],
    round: true,
  },
  {
    name: "Al Jazeerah Signature",
    logo: "/clients/al-jazeerah-signature.png",
    w: 105,
    h: 64,
    crop: [101.1, -0.5, -0.9],
  },
  {
    name: "Emado's",
    logo: "/clients/emados.png",
    w: 115,
    h: 45,
    crop: [105.2, -2.2, -15],
    multiply: true,
  },
  {
    name: "Teman Coffee",
    logo: "/clients/teman-coffee.png",
    w: 66,
    h: 66,
    crop: [111, -5.2, -5.8],
    round: true,
  },
  {
    name: "Amar",
    logo: "/clients/amar.png",
    w: 95,
    h: 68,
    crop: [110.6, -5.6, -29.4],
  },
  {
    name: "Richeese Factory",
    logo: "/clients/richeese.png",
    w: 90,
    h: 48,
    crop: [101.8, -0.7, -2.6],
  },
];

function ClientLogo({ client }: { client: Client }) {
  const [iw, ix, iy] = client.crop;
  return (
    <div
      style={
        {
          "--w": `${client.w}px`,
          "--h": `${client.h}px`,
        } as React.CSSProperties
      }
      className={`relative overflow-hidden shrink-0 w-[calc(var(--w)*0.8)] h-[calc(var(--h)*0.8)] md:w-[var(--w)] md:h-[var(--h)] ${
        client.round ? "rounded-full" : ""
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={client.logo}
        alt={client.name}
        style={{ width: `${iw}%`, left: `${ix}%`, top: `${iy}%` }}
        className={`absolute max-w-none h-auto select-none grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all duration-200 ${
          client.multiply ? "mix-blend-multiply" : ""
        }`}
      />
    </div>
  );
}

function ClientMarqueeRow() {
  const duplicated = [...CLIENTS, ...CLIENTS, ...CLIENTS, ...CLIENTS];
  return (
    // overflow-x-clip (BUKAN overflow-x-hidden): kalau x = hidden dan y =
    // visible, browser otomatis ubah y jadi auto dan munculin scrollbar
    // vertikal. `clip` tidak punya efek samping itu.
    <div className="group overflow-x-clip overflow-y-visible w-full py-3 md:py-4">
      {/* Jarak antar logo pakai padding-right per item (bukan gap) supaya
          lebar total tepat kelipatan 4 salinan dan loop marquee tidak loncat. */}
      <div className="flex items-center w-max animate-marquee-left group-hover:[animation-play-state:paused]">
        {duplicated.map((client, i) => (
          <div
            key={`${client.name}-${i}`}
            className="shrink-0 pr-10 md:pr-14 flex items-center"
          >
            <ClientLogo client={client} />
          </div>
        ))}
      </div>
    </div>
  );
}

// Nama file/komponen dipertahankan supaya import di app/page.tsx tidak
// berubah. Testimoni lama (kutipan karangan) sudah dihapus — kalau nanti ada
// kutipan klien asli (dengan izin), tambahkan lagi di atas marquee.
export default function ClientsAndTestimonials() {
  return (
    <section className="bg-sand pt-20 md:pt-28 pb-12 md:pb-16">
      <div className="max-w-7xl mx-auto px-5 md:px-8">
        <SectionHeading
          eyebrow="Dipercaya klien"
          title="Bisnis yang sudah bekerja sama dengan kami"
          align="center"
        />

        {/* Logo marquee — ambient/dekoratif */}
        <div className="mt-10 md:mt-12 space-y-5 md:space-y-6">
          <ClientMarqueeRow />
        </div>
      </div>
    </section>
  );
}
