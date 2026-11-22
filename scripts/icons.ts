/**
 * npm run icons – erzeugt die App-Icons (PNG) ohne zusätzliche Abhängigkeiten.
 * Motiv: zwei gestapelte Karteikarten mit Häkchen auf Teal.
 */
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'public');

function crc32(buf: Buffer): number {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return ~c >>> 0;
}

function png(size: number, pixel: (x: number, y: number) => [number, number, number]): Buffer {
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      // 4×4-Supersampling für glatte Kanten
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < 4; sy++)
        for (let sx = 0; sx < 4; sx++) {
          const p = pixel((x + (sx + 0.5) / 4) / size, (y + (sy + 0.5) / 4) / size);
          r += p[0]; g += p[1]; b += p[2];
        }
      const o = y * (size * 3 + 1) + 1 + x * 3;
      raw[o] = r / 16; raw[o + 1] = g / 16; raw[o + 2] = b / 16;
    }
  }
  const chunk = (type: string, data: Buffer) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length);
    const td = Buffer.concat([Buffer.from(type), data]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(td));
    return Buffer.concat([len, td, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

const inRoundRect = (x: number, y: number, x0: number, y0: number, x1: number, y1: number, r: number) => {
  const cx = Math.max(x0 + r, Math.min(x, x1 - r));
  const cy = Math.max(y0 + r, Math.min(y, y1 - r));
  return x >= x0 && x <= x1 && y >= y0 && y <= y1 && (x - cx) ** 2 + (y - cy) ** 2 <= r * r;
};
const distToSeg = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => {
  const t = Math.max(0, Math.min(1, ((px - ax) * (bx - ax) + (py - ay) * (by - ay)) / ((bx - ax) ** 2 + (by - ay) ** 2)));
  return Math.hypot(px - (ax + t * (bx - ax)), py - (ay + t * (by - ay)));
};

const TEAL: [number, number, number] = [15, 118, 110];
const TEAL_LIGHT: [number, number, number] = [94, 184, 172];
const WHITE: [number, number, number] = [255, 255, 255];
const CHECK: [number, number, number] = [13, 148, 136];

// Motiv füllt die „Safe Zone“ (für maskable Icons ~80 %)
const icon = (x: number, y: number): [number, number, number] => {
  // hintere Karte (leicht versetzt)
  if (inRoundRect(x, y, 0.3, 0.22, 0.8, 0.62, 0.05)) {
    if (!inRoundRect(x, y, 0.22, 0.3, 0.72, 0.78, 0.05)) return TEAL_LIGHT;
  }
  // vordere Karte
  if (inRoundRect(x, y, 0.22, 0.3, 0.72, 0.78, 0.05)) {
    const d = Math.min(distToSeg(x, y, 0.33, 0.55, 0.43, 0.65), distToSeg(x, y, 0.43, 0.65, 0.62, 0.43));
    return d < 0.035 ? CHECK : WHITE;
  }
  return TEAL;
};

writeFileSync(join(out, 'pwa-512.png'), png(512, icon));
writeFileSync(join(out, 'pwa-192.png'), png(192, icon));
writeFileSync(join(out, 'apple-touch-icon.png'), png(180, icon));
writeFileSync(
  join(out, 'favicon.svg'),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#0f766e"/><rect x="30" y="22" width="50" height="40" rx="5" fill="#5eb8ac"/><rect x="22" y="30" width="50" height="48" rx="5" fill="#fff"/><path d="M33 55l10 10 19-22" fill="none" stroke="#0d9488" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></svg>\n`,
);
console.log('Icons erzeugt in public/');
