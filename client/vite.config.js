import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: './' → göreli asset yolları; GitHub Pages alt-yolunda (kullanıcı/repo/) çalışır.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: { port: 5173 },
});
