import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Port 3002: the customer site is 5173 and the admin panel is 3001, so all
// three can run side by side. strictPort so a busy port fails loudly instead
// of quietly hopping to one the API's CORS list does not allow.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    strictPort: true,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
