// app/products/[slug]/page.tsx  (REVISI: halaman detail dilebarkan)
import Link from "next/link";
import { notFound } from "next/navigation";
import { X } from "lucide-react";
import RelatedCarousel from "@/components/RelatedCarousel";
import ProductDetailBody from "@/components/ProductDetailBody";
import {
  CATALOG_PRODUCTS,
  getCatalogProduct,
  getGroupByCode,
  groupCatalog,
} from "@/lib/variants";

// Tetap per kode varian supaya link lama (/products/PB-CLIP58) tidak putus.
export function generateStaticParams() {
  return CATALOG_PRODUCTS.map((p) => ({ slug: p.code }));
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = getCatalogProduct(slug);
  if (!product) notFound();

  const group = getGroupByCode(product.code);
  const groupCodes = new Set(group ? group.variants.map((v) => v.code) : []);

  // Terkait: utamakan produk di subkategori yang sama, lalu sisanya dari
  // kategori yang sama. Varian dari grup yang sama dibuang, dan varian dari
  // grup lain dijadikan satu entri supaya tidak muncul berulang.
  // (Di kode: categoryId = subkategori, divisionId = kategori.)
  const sameSubkategori = CATALOG_PRODUCTS.filter(
    (p) =>
      p.categoryId === product.categoryId &&
      p.code !== product.code &&
      !groupCodes.has(p.code),
  );
  const sameKategori = CATALOG_PRODUCTS.filter(
    (p) =>
      p.divisionId === product.divisionId &&
      p.categoryId !== product.categoryId &&
      !groupCodes.has(p.code),
  );
  const related = groupCatalog([...sameSubkategori, ...sameKategori])
    .map((e) => e.product)
    .slice(0, 8);

  return (
    <div className="max-w-5xl mx-auto px-5 md:px-8 py-12">
      <div className="flex items-center justify-between mb-6">
        <span className="text-xs font-data tracking-widest text-ink/45 uppercase">
          {product.divisionName} › {product.categoryName}
        </span>
        <Link
          href="/products"
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-sand"
        >
          <X className="w-4 h-4" />
        </Link>
      </div>

      <ProductDetailBody key={product.code} product={product} group={group} />

      {related.length > 0 && (
        <div className="mt-10">
          <div className="text-xs uppercase tracking-widest text-ink/45 font-data mb-4">
            Produk terkait
          </div>
          <RelatedCarousel products={related} />
        </div>
      )}
    </div>
  );
}
