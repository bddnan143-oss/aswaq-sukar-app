import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const svgPath = path.resolve('public/icons/icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

async function generate() {
  const iconsDir = path.resolve('public/icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  // 192x192
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.resolve(iconsDir, 'icon-192.png'));
  console.log('Created icon-192.png');

  // 512x512
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.resolve(iconsDir, 'icon-512.png'));
  console.log('Created icon-512.png');

  // 512x512 maskable (with 10% padding safe zone)
  await sharp(svgBuffer)
    .resize(410, 410)
    .extend({
      top: 51,
      bottom: 51,
      left: 51,
      right: 51,
      background: { r: 5, g: 150, b: 105, alpha: 1 }
    })
    .png()
    .toFile(path.resolve(iconsDir, 'icon-maskable-512.png'));
  console.log('Created icon-maskable-512.png');

  // Apple touch icon 180x180
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.resolve('public/apple-touch-icon.png'));
  console.log('Created apple-touch-icon.png');

  // Favicon 64x64 & 32x32
  await sharp(svgBuffer)
    .resize(64, 64)
    .png()
    .toFile(path.resolve('public/favicon.png'));
  
  // Favicon SVG copy
  fs.copyFileSync(svgPath, path.resolve('public/favicon.svg'));

  console.log('All PWA icon assets generated successfully!');
}

generate().catch(console.error);
