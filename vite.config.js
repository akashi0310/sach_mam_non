import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Đường dẫn tương đối giúp deploy mượt mà trên GitHub Pages, Vercel, Netlify
  server: {
    port: 5173,
    open: false,
    host: true
  }
});
