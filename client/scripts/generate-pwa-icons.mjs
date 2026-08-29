import sharp from "sharp";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(__dirname, "..", "public");
const source = resolve(publicDir, "football.jpg");

const targets = [
  { name: "pwa-192x192.png", size: 192 },
  { name: "pwa-512x512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
];

for (const { name, size } of targets) {
  await sharp(source)
    .resize(size, size, { fit: "cover", position: "center" })
    .png()
    .toFile(resolve(publicDir, name));
  console.log(`generated ${name} (${size}x${size})`);
}
