import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import toIco from "to-ico";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const logoPath = join(root, "public", "logo.png");
const black = { r: 0, g: 0, b: 0, alpha: 1 };

async function squarePng(size) {
  return sharp(logoPath)
    .resize(size, size, {
      fit: "contain",
      background: black,
    })
    .png()
    .toBuffer();
}

async function main() {
  const [png16, png32, png48, png180] = await Promise.all([
    squarePng(16),
    squarePng(32),
    squarePng(48),
    squarePng(180),
  ]);

  const publicDir = join(root, "public");
  const appDir = join(root, "app");

  await Promise.all([
    writeFile(join(publicDir, "favicon-16x16.png"), png16),
    writeFile(join(publicDir, "favicon-32x32.png"), png32),
    writeFile(join(publicDir, "apple-touch-icon.png"), png180),
    writeFile(join(appDir, "apple-icon.png"), png180),
  ]);

  const ico = await toIco([png16, png32, png48]);
  await Promise.all([
    writeFile(join(publicDir, "favicon.ico"), ico),
    writeFile(join(appDir, "favicon.ico"), ico),
  ]);

  console.log("Generated favicon assets in public/ and app/");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
