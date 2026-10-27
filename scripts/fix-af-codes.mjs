// Jalankan dari root project:  node fix-af-codes.mjs
// Samakan kode foil roll lama dengan pola AF-RL-<lebar>-<panjang>:
//   AF-014 / AF-RL-014 (45 cm x 300 m)  -> AF-RL-45-300
//   AF-021 / AF-RL-021 (45 cm x 7,6 m)  -> AF-RL-45-76
// Aman dijalankan berulang, dan aman walau sebelumnya sudah sempat jadi AF-RL-014/021.
import fs from "node:fs";

const FILES = ["lib/data.ts", "lib/variants.ts"];
const RULES = [
  [/"AF-(RL-)?014"/g, '"AF-RL-45-300"'],
  [/"AF-(RL-)?021"/g, '"AF-RL-45-76"'],
  [
    /AF-(RL-)?021 = 45x7,6 dan AF-(RL-)?014 = 45x300/g,
    "AF-RL-45-76 = 45x7,6 dan AF-RL-45-300 = 45x300",
  ],
];

for (const f of FILES) {
  if (!fs.existsSync(f)) {
    console.error(`SKIP ${f}: file tidak ditemukan (jalankan dari root project)`);
    continue;
  }
  const before = fs.readFileSync(f, "utf8");
  let after = before;
  for (const [from, to] of RULES) after = after.replace(from, to);
  fs.writeFileSync(f, after);
  console.log(`${before === after ? "tidak berubah" : "OK"}  ${f}`);
}

const LEFT = [];
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", ".git", "public"].includes(e.name)) continue;
    const p = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(p);
    else if (/\.(ts|tsx|js|jsx|mjs|json)$/.test(e.name)) {
      fs.readFileSync(p, "utf8")
        .split("\n")
        .forEach((line, i) => {
          if (/AF-(RL-)?0(14|21)/.test(line))
            LEFT.push(`${p}:${i + 1}: ${line.trim()}`);
        });
    }
  }
}
for (const d of ["lib", "app", "components"]) if (fs.existsSync(d)) walk(d);

console.log(
  LEFT.length
    ? `\nMasih ada kode lama, ganti manual:\n${LEFT.join("\n")}`
    : "\nBersih: tidak ada AF-014 / AF-021 / AF-RL-014 / AF-RL-021 tersisa.",
);
console.log("\nRename PNG: AF-RL-014.png -> AF-RL-45-300.png, AF-RL-021.png -> AF-RL-45-76.png");
console.log("Lalu: npm run generate:images");
