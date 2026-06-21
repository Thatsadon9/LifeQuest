/**
 * Generate LifeQuest app icons from a raster source portrait.
 *
 * Place the master image at public/icon-source.png (square recommended).
 * Run with: npm run gen-icons
 *
 * Outputs (in /public):
 *   favicon-32x32.png      browser tab favicon
 *   pwa-192x192.png        manifest icon, purpose "any"
 *   pwa-512x512.png        manifest icon, purpose "any"
 *   maskable-512x512.png   manifest icon, purpose "maskable" (~18% safe padding)
 *   apple-touch-icon.png   180x180 iOS home-screen icon
 */
import sharp from 'sharp';
import { existsSync, mkdirSync } from 'node:fs';

const SOURCE = 'public/icon-source.png';
/** Corner radius as a fraction of icon size (~iOS squircle feel). */
const CORNER_RATIO = 0.22;

mkdirSync('public', { recursive: true });

if (!existsSync(SOURCE)) {
  console.error(`Missing ${SOURCE} — add a square PNG source image first.`);
  process.exit(1);
}

function roundedRectMask(size, radius) {
  return Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="white"/>
    </svg>`,
  );
}

/** Clip to a rounded square; pixels outside become transparent. */
async function applyRoundedCorners(image, size) {
  const radius = Math.max(2, Math.round(size * CORNER_RATIO));
  return sharp(image)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .ensureAlpha()
    .composite([{ input: roundedRectMask(size, radius), blend: 'dest-in' }])
    .png()
    .toBuffer();
}

/** Sample the top-left pixel colour from the source for maskable backgrounds. */
async function sampleBackground() {
  const { data } = await sharp(SOURCE).resize(1, 1).raw().toBuffer({ resolveWithObject: true });
  const [r, g, b] = data;
  return { r, g, b };
}

/** Rasterise the source to a square PNG and assert dimensions. */
async function render(size, file, { maskable = false, rounded = true } = {}) {
  const out = `public/${file}`;

  if (maskable) {
    const bg = await sampleBackground();
    const inner = Math.round(size * 0.82);
    const portrait = await sharp(SOURCE)
      .resize(inner, inner, { fit: 'cover', position: 'centre' })
      .png()
      .toBuffer();

    await sharp({
      create: {
        width: size,
        height: size,
        channels: 3,
        background: bg,
      },
    })
      .composite([{ input: portrait, gravity: 'centre' }])
      .png()
      .toFile(out);
  } else if (rounded) {
    const roundedImage = await applyRoundedCorners(SOURCE, size);
    await sharp(roundedImage).toFile(out);
  } else {
    await sharp(SOURCE)
      .resize(size, size, { fit: 'cover', position: 'centre' })
      .png()
      .toFile(out);
  }

  const { width, height } = await sharp(out).metadata();
  if (width !== size || height !== size) {
    throw new Error(`${file}: expected ${size}x${size}, got ${width}x${height}`);
  }
  console.log(`  ${file.padEnd(22)} ${width}x${height}`);
}

console.log('Generating LifeQuest icons from icon-source.png…');
await render(32, 'favicon-32x32.png');
await render(192, 'pwa-192x192.png');
await render(512, 'pwa-512x512.png');
await render(512, 'maskable-512x512.png', { maskable: true, rounded: false });
await render(180, 'apple-touch-icon.png');
console.log('Done.');
