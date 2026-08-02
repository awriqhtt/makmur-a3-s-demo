# Makmur A3'S — Website (Next.js 15)

Presentation-ready B2B corporate website for Makmur A3'S, built with Next.js 15 (App Router),
TypeScript and Tailwind CSS. No backend, database or authentication — product data lives in
`lib/data.ts` and the contact form is a front-end-only mock (wire it to your API/CRM before going live).

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Structure

```
app/
  layout.tsx              Root layout (Header + Footer + fonts)
  page.tsx                Home
  products/page.tsx        Product catalog (search + filter)
  products/[slug]/page.tsx Product detail (dynamic route, one per SKU code)
  about/page.tsx
  industries/page.tsx
  contact/page.tsx         Quotation request form (front-end only)
components/
  Header.tsx, Footer.tsx, Logomark.tsx, ProductCard.tsx
  ui/Button.tsx, ui/SectionHeading.tsx
lib/
  data.ts                 All category & product data, single source of truth
```

## Brand tokens (tailwind.config.ts)

- `brand` — #E5231B (logo red)
- `ink` — #141414 (near-black text/background)
- `sand` — #F4F4F2 (section background)
- `line` — #E4E4E1 (hairline borders)

## Next steps for production

- Replace placeholder photography (currently abstract spec-tag graphics) with real product photography.
- Wire the contact form in `app/contact/page.tsx` to your quotation/CRM endpoint.
- Replace mock testimonials, partner names and article copy in `lib/data.ts` / `app/page.tsx` with real content.
- Add real Google Maps embed on the contact page.
- Consider adding `next/image` optimized product photography once assets are available.
