import sharp from "sharp";
import { mkdir } from "fs/promises";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "../apps/web/public/icons");

await mkdir(OUT, { recursive: true });

const svg = (size) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="#0b0d10" rx="${Math.round(size * 0.18)}"/>
  <text x="50%" y="62%" dominant-baseline="middle" text-anchor="middle"
    font-family="system-ui,-apple-system,sans-serif"
    font-size="${Math.round(size * 0.55)}"
    font-weight="700"
    fill="#5865f2">N</text>
</svg>`;

for (const size of [192, 512]) {
  await sharp(Buffer.from(svg(size)))
    .resize(size, size)
    .png()
    .toFile(join(OUT, `icon-${size}.png`));
  console.log(`Generated icon-${size}.png`);
}
console.log("Icons generated in apps/web/public/icons/");
