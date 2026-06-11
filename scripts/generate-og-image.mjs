import { writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const width = 1200;
const height = 630;

async function loadResized(path, targetWidth) {
  const image = sharp(join(publicDir, path));
  const resized = image.resize(targetWidth);
  const buffer = await resized.png().toBuffer();
  const meta = await sharp(buffer).metadata();
  return { buffer, width: meta.width ?? targetWidth, height: meta.height ?? 0 };
}

async function main() {
  const background = await sharp(join(publicDir, "hero-bg.png"))
    .resize(width, height, { fit: "cover", position: "top" })
    .png()
    .toBuffer();

  const [laptop, character, logo] = await Promise.all([
    loadResized("hero-laptop-mockup.png", 500),
    loadResized("hero-right-character.png", 360),
    loadResized("logo.png", 180),
  ]);

  const laptopTop = height - laptop.height - 28;
  const characterTop = height - character.height;
  const logoTop = 48;

  const output = await sharp(background)
    .composite([
      { input: logo.buffer, left: 56, top: logoTop },
      { input: laptop.buffer, left: 56, top: laptopTop },
      { input: character.buffer, left: width - character.width - 40, top: characterTop },
    ])
    .png()
    .toBuffer();

  await writeFile(join(publicDir, "og-image.png"), output);
  console.log("Generated public/og-image.png");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
