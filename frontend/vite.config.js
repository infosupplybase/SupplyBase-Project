import { copyFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from "@tailwindcss/vite";

// Vercel serves dist/404.html, with a 404 status, for any path that matches
// no file and no rewrite in vercel.json. A copy of the app there means an
// unknown address still shows the site's own "Page not found" screen.
const notFoundPage = {
  name: 'not-found-page',
  apply: 'build',
  writeBundle(options) {
    copyFileSync(join(options.dir, 'index.html'), join(options.dir, '404.html'));
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss(), notFoundPage],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
