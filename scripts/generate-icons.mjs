import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const src = 'C:/Users/ADMIN/Documents/VSCODE/MoneyWise/assets/brand-source.png';
const outDir = 'C:/Users/ADMIN/Documents/VSCODE/MoneyWise/assets';
const navy = { r: 11, g: 33, b: 72, alpha: 1 };

const meta = await sharp(src).metadata();
console.log('source', meta.width, meta.height, meta.format);

const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height } = info;

function isBg(i) {
  const r = data[i];
  const g = data[i + 1];
  const b = data[i + 2];
  const a = data[i + 3];
  return a < 20 || (r > 220 && g > 220 && b > 220);
}

let minX = width;
let minY = height;
let maxX = 0;
let maxY = 0;
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4;
    if (!isBg(i)) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
}

console.log('content box', { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 });

const contentW = maxX - minX + 1;
const contentH = maxY - minY + 1;
const pad = 2;
const crop = {
  left: Math.max(0, minX - pad),
  top: Math.max(0, minY - pad),
  width: Math.min(width - Math.max(0, minX - pad), contentW + pad * 2),
  height: Math.min(height - Math.max(0, minY - pad), contentH + pad * 2),
};

const trimmed = sharp(src).extract(crop);
await fs.promises.mkdir(outDir, { recursive: true });
await trimmed.clone().png().toFile(path.join(outDir, 'logo-full.png'));

// The mark is the top square of the trimmed image (icon above the wordmark).
const square = Math.min(crop.width, crop.height);
const iconExtract = {
  left: crop.left + Math.floor((crop.width - square) / 2),
  top: crop.top,
  width: square,
  height: square,
};
console.log('icon crop', iconExtract);

const iconSrc = sharp(src).extract(iconExtract);

await iconSrc.clone().resize(1024, 1024, { fit: 'fill' }).png().toFile(path.join(outDir, 'icon.png'));
await iconSrc.clone().resize(192, 192).png().toFile(path.join(outDir, 'logo.png'));
await iconSrc.clone().resize(48, 48).png().toFile(path.join(outDir, 'favicon.png'));

// Adaptive foreground: icon inset so Android's mask does not clip it.
const fgSize = 1024;
const fgPad = Math.round(fgSize * 0.18);
const inner = fgSize - fgPad * 2;
const fgIcon = await iconSrc.clone().resize(inner, inner).png().toBuffer();
await sharp({
  create: { width: fgSize, height: fgSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([{ input: fgIcon, left: fgPad, top: fgPad }])
  .png()
  .toFile(path.join(outDir, 'android-icon-foreground.png'));

await sharp({
  create: { width: fgSize, height: fgSize, channels: 3, background: navy },
})
  .png()
  .toFile(path.join(outDir, 'android-icon-background.png'));

const mono = await iconSrc
  .clone()
  .resize(inner, inner)
  .greyscale()
  .png()
  .toBuffer();
await sharp({
  create: { width: fgSize, height: fgSize, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
})
  .composite([{ input: mono, left: fgPad, top: fgPad }])
  .png()
  .toFile(path.join(outDir, 'android-icon-monochrome.png'));

// Splash: square icon centered on navy.
const splashSize = 1284;
const splashIcon = await iconSrc
  .clone()
  .resize(Math.round(splashSize * 0.52), Math.round(splashSize * 0.52))
  .png()
  .toBuffer();
const splashIconMeta = await sharp(splashIcon).metadata();
await sharp({
  create: {
    width: splashSize,
    height: splashSize,
    channels: 3,
    background: navy,
  },
})
  .composite([
    {
      input: splashIcon,
      left: Math.round((splashSize - splashIconMeta.width) / 2),
      top: Math.round((splashSize - splashIconMeta.height) / 2),
    },
  ])
  .png()
  .toFile(path.join(outDir, 'splash-icon.png'));

console.log('wrote icons to', outDir);
