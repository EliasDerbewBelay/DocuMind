import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

/** Content scripts run as classic scripts — import.meta is invalid. */
function stripImportMeta(): Plugin {
  return {
    name: 'strip-import-meta',
    renderChunk(code, chunk) {
      const isContentChunk =
        chunk.fileName.includes('index.ts') ||
        chunk.fileName.includes('pdf-extractor') ||
        chunk.moduleIds.some((id) => id.includes('/src/content/'));

      if (!isContentChunk) return null;

      return {
        code: code
          .replace(/import\.meta\.url/g, '""')
          .replace(/import\.meta\.env\b/g, '({}).env')
          .replace(/import\.meta/g, '({url:""})'),
        map: null,
      };
    },
  };
}

export default defineConfig({
  plugins: [react(), crx({ manifest }), stripImportMeta()],
  build: {
    rollupOptions: {
      input: {
        sidepanel: 'public/sidepanel.html',
        popup: 'src/popup/popup.html',
      },
    },
  },
});
