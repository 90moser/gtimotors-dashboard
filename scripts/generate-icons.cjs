/**
 * Generates PWA icons, favicon-32x32.png, and favicon.ico from source assets.
 * Run automatically via "prebuild" in package.json.
 * Requires: npm install --save-dev sharp
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC_LOGO  = path.join(__dirname, '..', 'public', 'rsmotors-logo.png');
const SRC_SVG   = path.join(__dirname, '..', 'public', 'favicon.svg');
const OUT_DIR   = path.join(__dirname, '..', 'public');

async function buildIco(sizes, svgPath) {
  const pngBuffers = await Promise.all(
    sizes.map(size =>
      sharp(svgPath, { density: 300 }).resize(size, size).png().toBuffer()
    )
  );
  const headerSize = 6;
  const dirEntrySize = 16;
  let offset = headerSize + sizes.length * dirEntrySize;
  const dirEntries = pngBuffers.map((buf, i) => {
    const w = sizes[i] >= 256 ? 0 : sizes[i];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(w, 0);
    entry.writeUInt8(w, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(buf.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += buf.length;
    return entry;
  });
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(sizes.length, 4);
  return Buffer.concat([header, ...dirEntries, ...pngBuffers]);
}

async function main() {
  // favicon.ico from SVG (always generated, no logo required)
  try {
    const icoBuffer = await buildIco([16, 32, 48], SRC_SVG);
    fs.writeFileSync(path.join(OUT_DIR, 'favicon.ico'), icoBuffer);
    console.log('[generate-icons] favicon.ico');
  } catch (e) {
    console.warn('[generate-icons] Could not generate favicon.ico:', e.message);
  }

  if (!fs.existsSync(SRC_LOGO)) {
    console.warn('[generate-icons] rsmotors-logo.png not found — skipping PNG icon generation');
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
