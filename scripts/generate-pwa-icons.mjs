import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const iconsDir = path.join(root, "public", "icons");
const svgPath = path.join(root, "public", "fin_logo.svg");

await mkdir(iconsDir, { recursive: true });

const sizes = [
  { name: "android-chrome-192x192.png", size: 192 },
  { name: "icon-512x512.png", size: 512 },
  { name: "maskable-icon-512x512.png", size: 512, maskable: true },
];

for (const { name, size, maskable } of sizes) {
  const padding = maskable ? Math.round(size * 0.1) : 0;
  const inner = size - padding * 2;

  await sharp(svgPath)
    .resize(inner, inner, { fit: "contain", background: { r: 33, g: 88, b: 216, alpha: 1 } })
    .extend({
      top: padding,
      bottom: padding,
      left: padding,
      right: padding,
      background: maskable ? { r: 33, g: 88, b: 216, alpha: 1 } : { r: 239, g: 243, b: 255, alpha: 1 },
    })
    .png()
    .toFile(path.join(iconsDir, name));
}

console.log("PWA icons generated in public/icons/");
