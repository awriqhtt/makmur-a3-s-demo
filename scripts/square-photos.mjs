// scripts/square-photos.mjs
// Ubah SEMUA foto produk jadi 1:1 tanpa memotong produk.
// Foto landscape/portrait diletakkan utuh di tengah, sisanya diisi
// kelanjutan background (tepi foto di-copy lalu di-blur), jadi mulus untuk
// foto studio dengan background polos/gradasi.
//
// Pakai:  node scripts/square-photos.mjs
// Input : public/products/*.(png|jpg|jpeg|webp)
// Output: public/products-square/  (file asli TIDAK diubah)
// Cek hasilnya, lalu salin isi products-square ke products dan jalankan
// `npm run generate:images`.
import sharp from "sharp";
import { readdir, mkdir } from "node:fs/promises";
import path from "node:path";

const SRC = "public/products";
const OUT = "public/products-square";
const SIZE = 1200;
await mkdir(OUT, { recursive: true });

for (const file of await readdir(SRC)) {
  if (!/\.(png|jpe?g|webp)$/i.test(file)) continue;
  const base = path.parse(file).name;
  const input = sharp(path.join(SRC, file)).rotate();
  const { width: w, height: h } = await input.metadata();
  if (!w || !h) continue;

  // Sudah (hampir) persegi: cukup resize.
  if (Math.abs(w - h) / Math.max(w, h) < 0.02) {
    await input.resize(SIZE, SIZE).png().toFile(path.join(OUT, `${base}.png`));
    console.log("ok  ", file, "(sudah 1:1)");
    continue;
  }

  // Produk utuh, sisi terpanjang = SIZE.
  const fitted = await input
    .clone()
    .resize(SIZE, SIZE, { fit: "inside" })
    .png()
    .toBuffer();
  const fm = await sharp(fitted).metadata();
  const padX = Math.floor((SIZE - fm.width) / 2);
  const padY = Math.floor((SIZE - fm.height) / 2);

  // Background: copy tepi ke samping lalu blur kuat.
  const bg = await sharp(fitted)
    .extend({
      top: padY,
      bottom: SIZE - fm.height - padY,
      left: padX,
      right: SIZE - fm.width - padX,
      extendWith: "copy",
    })
    .blur(30)
    .png()
    .toBuffer();

  await sharp(bg)
    .composite([{ input: fitted, left: padX, top: padY }])
    .png()
    .toFile(path.join(OUT, `${base}.png`));
  console.log("ok  ", file, `${w}x${h} -> ${SIZE}x${SIZE}`);
}
console.log("Selesai. Cek folder", OUT);
