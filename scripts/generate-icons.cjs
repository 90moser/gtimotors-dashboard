/**
 * Generates PWA icons and favicon-32x32.png from public/rsmotors-logo.png.
 * Run automatically via "prebuild" in package.json.
 * Requires: npm install --save-dev sharp
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC_LOGO  = path.join(__dirname, '..', 'public', 'rsmotors-logo.png');
const SRC_SVG   = path.join(__dirname, '..', 'public', 'favicon.svg');
const OUT_DIR   = path.join(__dirname, '..', 'public');

async function main() {
  if (!fs.existsSync(SRC_LOGO)) {
    console.warn('[generate-icons] rsmotors-logo.png not found — skipping icon generation');
    return;
  }

  const pad = (size) => Math.round(size * 0.06);

  // apple-touch-icon: 180x180 with logo centered on dark bg
  await sharp({
    create: { width: 180, height: 180, channels: 4,
               background: { r: 5, g: 5, b: 5, alpha: 1 } },
  })
    .composite([{
      input: await sharp(SRC_LOGO)
        .resize(180 - pad(180) * 2, 180 - pad(180) * 2, { fit: 'contain',
          background: { r: 5, g: 5, b: 5, alpha: 1 } })
        .png().toBuffer(),
      gravity: 'center',
    }])
    .png()
    .toFile(path.join(OUT_DIR, 'apple-touch-icon.png'));
  console.log('[generate-icons] apple-touch-icon.png');

  // icon-192
  await sharp({
    create: { width: 192, height: 192, channels: 4,
               background: { r: 5, g: 5, b: 5, alpha: 1 } },
  })
    .composite([{
      input: await sharp(SRC_LOGO)
        .resize(192 - pad(192) * 2, 192 - pad(192) * 2, { fit: 'contain',
          background: { r: 5, g: 5, b: 5, alpha: 1 } })
        .png().toBuffer(),
      gravity: 'center',
    }])
    .png()
    .toFile(path.join(OUT_DIR, 'icon-192.png'));
  console.log('[generate-icons] icon-192.png');

  // icon-512
  await sharp({
    create: { width: 512, height: 512, channels: 4,
               background: { r: 5, g: 5, b: 5, alpha: 1 } },
  })
    .composite([{
      input: await sharp(SRC_LOGO)
        .resize(512 - pad(512) * 2, 512 - pad(512) * 2, { fit: 'contain',
          background: { r: 5, g: 5, b: 5, alpha: 1 } })
        .png().toBuffer(),
      gravity: 'center',
    }])
    .png()
    .toFile(path.join(OUT_DIR, 'icon-512.png'));
  console.log('[generate-icons] icon-512.png');

  // favicon-32x32.png from SVG (sharp reads SVG natively via libvips)
  try {
    await sharp(SRC_SVG, { density: 300 })
      .resize(32, 32)
      .png()
      .toFile(path.join(OUT_DIR, 'favicon-32x32.png'));
    console.log('[generate-icons] favicon-32x32.png');
  } catch {
    console.warn('[generate-icons] Could not rasterize favicon.svg — skipping favicon-32x32.png');
  }

  console.log('[generate-icons] Done.');
}

main().catch(err => {
  console.error('[generate-icons] Error:', err.message);
  process.exit(1);
});
