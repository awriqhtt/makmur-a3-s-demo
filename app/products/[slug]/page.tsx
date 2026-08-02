import Link from "next/link";
import { notFound } from "next/navigation";
import { X } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import RelatedCarousel from "@/components/RelatedCarousel";
import { ALL_PRODUCTS, getProductBySlug } from "@/lib/data";
import ProductActions from "@/components/ProductActions";

export function generateStaticParams() {
  return ALL_PRODUCTS.map((p) => ({ slug: p.code }));
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const related = ALL_PRODUCTS.filter(
    (p) => p.categoryId === product.categoryId && p.code !== product.code,
  ).slice(0, 8);

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs font-data tracking-widest text-ink/45 uppercase">
          {product.categoryName}
        </span>
        <Link
          href="/products"
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-sand"
        >
          <X className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-0 border border-line rounded-3xl overflow-hidden">
        <ProductImage code={product.code} name={product.name} />
        <div className="p-6 md:p-8">
          <span className="text-[11px] font-data font-semibold tracking-widest text-brand">
            {product.code}
          </span>
          <h1 className="font-display text-2xl md:text-3xl mt-1 mb-4 leading-tight">
            {product.name}
          </h1>
          <div className="grid grid-cols-2 gap-4 mb-6 font-data">
            <Spec label="Material" value={product.material} />
            <Spec label="Ukuran" value={product.size} />
            <Spec label="Packaging" value={product.pack} />
            <Spec label="MOQ" value={product.moq} />
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {["Restoran", "Kafe", "Katering", "Retail"].map((tag) => (
              <span
                key={tag}
                className="text-xs bg-sand px-3 py-1.5 rounded-full text-ink/70"
              >
                {tag}
              </span>
            ))}
          </div>
          <ProductActions product={product} />
        </div>
      </div>

      {related.length > 0 && (
        <div className="mt-10">
          <div className="text-xs uppercase tracking-widest text-ink/45 font-data mb-4">
            Produk terkait di divisi ini
          </div>
          <RelatedCarousel products={related} />
        </div>
      )}
    </div>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-ink/45 mb-1">
        {label}
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
