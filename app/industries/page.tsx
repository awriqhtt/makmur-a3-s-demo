import Link from "next/link";
import { ArrowRight } from "lucide-react";
import SectionHeading from "@/components/ui/SectionHeading";
import { INDUSTRIES, getIndustryImage, getIndustryIcon } from "@/lib/data";

export default function IndustriesPage() {
  return (
    <div className="max-w-7xl mx-auto px-5 md:px-8 py-16">
      <SectionHeading
        eyebrow="Industri yang kami layani"
        title="Dari kafe satu outlet sampai distributor nasional"
        body="Setiap divisi katalog distok dan dipacking dengan mempertimbangkan jenis operator berbeda — begini biasanya klien order."
      />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-14">
        {INDUSTRIES.map((ind) => {
          const Icon = getIndustryIcon(ind);
          return (
            <div
              key={ind}
              className="group flex flex-col rounded-2xl border border-line overflow-hidden hover-lift"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={getIndustryImage(ind)}
                  alt={ind}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
                <div className="absolute top-4 left-4 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center">
                  <Icon className="w-4.5 h-4.5 text-ink" strokeWidth={1.5} />
                </div>
                <h3 className="absolute bottom-4 left-5 right-5 text-white font-display text-lg leading-snug">
                  {ind}
                </h3>
              </div>
              <div className="flex flex-col flex-1 p-6">
                <p className="text-sm text-ink/45 leading-relaxed mb-5 flex-1">
                  Order biasanya menggabungkan packaging food-contact,
                  disposable, dan kebutuhan operasional yang disesuaikan dengan
                  volume {ind.toLowerCase()}.
                </p>
                <Link
                  href="/contact"
                  className="text-sm font-medium inline-flex items-center gap-1 text-ink hover:text-brand"
                >
                  Hubungi sales <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
