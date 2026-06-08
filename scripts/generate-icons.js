import { writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { deflateSync } from 'zlib';

const __dirname = dirname(fileURLToPath(import.meta.url));
const iconsDir = join(__dirname, '..', 'public', 'icons');
mkdirSync(iconsDir, { recursive: true });

function createPNG(size) {
  const width = size;
  const height = size;
  const raw = Buffer.alloc((width * height * 4) + height);
  let offset = 0;

  for (let y = 0; y < height; y++) {
    raw[offset++] = 0;
    for (let x = 0; x < width; x++) {
      const inSquare =
        x >= size * 0.1 &&
        x <= size * 0.9 &&
        y >= size * 0.1 &&
        y <= size * 0.9;
      if (inSquare) {
        raw[offset++] = 108; // R #6C
        raw[offset++] = 99;  // G #63
        raw[offset++] = 255; // B #FF
        raw[offset++] = 255; // A
      } else {
        raw[offset++] = 13;  // R #0D
        raw[offset++] = 15;  // G #0F
        raw[offset++] = 26;  // B #1A
        raw[offset++] = 255;
      }
    }
  }

  const compressed = deflateSync(raw);

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0);
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(width, 8);
  ihdr.writeUInt32BE(height, 12);
  ihdr[16] = 8;
  ihdr[17] = 6;
  ihdr[18] = 0;
  ihdr[19] = 0;
  ihdr[20] = 0;
  const ihdrCrc = crc32(Buffer.concat([Buffer.from('IHDR'), ihdr.slice(8, 21)]));
  ihdr.writeUInt32BE(ihdrCrc, 21);

  const idat = Buffer.alloc(compressed.length + 12);
  idat.writeUInt32BE(compressed.length, 0);
  idat.write('IDAT', 4);
  compressed.copy(idat, 8);
  const idatCrc = crc32(Buffer.concat([Buffer.from('IDAT'), compressed]));
  idat.writeUInt32BE(idatCrc, 8 + compressed.length);

  const iend = Buffer.from([
    0, 0, 0, 0, 73, 72, 69, 78, 68, 174, 66, 96, 130,
  ]);

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

for (const size of [16, 48, 128]) {
  const path = join(iconsDir, `icon${size}.png`);
  writeFileSync(path, createPNG(size));
  console.log(`Generated ${path}`);
}
