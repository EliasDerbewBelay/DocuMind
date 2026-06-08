import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const sources = [
  'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
  'node_modules/pdfjs-dist/build/pdf.worker.min.js',
];

const dest = join(root, 'public', 'pdf.worker.min.js');

let copied = false;
for (const src of sources) {
  const fullSrc = join(root, src);
  if (existsSync(fullSrc)) {
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(fullSrc, dest);
    console.log(`Copied PDF worker from ${src}`);
    copied = true;
    break;
  }
}

if (!copied) {
  console.warn('PDF worker not found — run npm install first');
}
