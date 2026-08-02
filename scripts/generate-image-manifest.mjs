import fs from "node:fs";
import path from "node:path";

const PRODUCTS_DIR = path.join(process.cwd(), "public", "products");
const OUTPUT_FILE = path.join(
  process.cwd(),
  "lib",
  "product-images.generated.json",
);
const VALID_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];

function generateManifest() {
  const manifest = {};

  if (!fs.existsSync(PRODUCTS_DIR)) {
    console.warn(`[image-manifest] Folder tidak ditemukan: ${PRODUCTS_DIR}`);
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, "{}\n");
    return;
  }

  for (const file of fs.readdirSync(PRODUCTS_DIR)) {
    const ext = path.extname(file).toLowerCase();
    if (!VALID_EXTENSIONS.includes(ext)) continue;
    const code = path.basename(file, ext);
    manifest[code] = `/products/${file}`;
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(manifest, null, 2) + "\n");
  console.log(
    `[image-manifest] ${Object.keys(manifest).length} gambar terdeteksi -> ${path.relative(process.cwd(), OUTPUT_FILE)}`,
  );
}

generateManifest();
