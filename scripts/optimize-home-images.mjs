import { mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const names = [
  'home-diwali-smart-band-wellness',
  'home-desktop-diwali-band-style',
  'home-collection-bands-banner',
  'home-collection-rings-banner',
  'home-collection-fans-banner',
];
const outputDir = new URL('../public/images/optimized/', import.meta.url);
await mkdir(outputDir, { recursive: true });
let sourceBytes = 0;
let mobileBytes = 0;
for (const name of names) {
  const input = new URL(`../assets/images/${name}.webp`, import.meta.url);
  sourceBytes += (await stat(input)).size;
  for (const width of [480, 768, 1280]) {
    const output = new URL(`${name}-${width}.webp`, outputDir);
    await sharp(fileURLToPath(input))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 75, effort: 5 })
      .toFile(fileURLToPath(output));
    if (width === 480) mobileBytes += (await stat(output)).size;
  }
}
console.log(`Home images: ${(sourceBytes / 1024).toFixed(0)} KB originals; ${(mobileBytes / 1024).toFixed(0)} KB at 480px.`);
