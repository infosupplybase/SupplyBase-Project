import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from "@tailwindcss/vite";
import { prerenderPages } from './scripts/prerender-pages.mjs';

// prerenderPages writes one HTML file per public page (its own title,
// description, canonical link and structured data), dist/sitemap.xml, and
// dist/404.html: Vercel serves that file, with a 404 status, for any path
// that matches no file and no rewrite in vercel.json, so an unknown address
// still shows the site's own "Page not found" screen.
export default defineConfig({
  plugins: [react(), tailwindcss(), prerenderPages()],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
