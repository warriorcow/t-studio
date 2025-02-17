import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

import relativeLinks from 'astro-relative-links';

import vue from '@astrojs/vue';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  site: 'https://warriorcow.github.io/t-studio/',
  outDir: 'dist',
  base: '/t-studio/',
  trailingSlash: "always",
  assetsPrefix: 'https://cdn.example.com',
  compressHTML: false,
  build: {
    inlineStylesheets: `never`,
  },
  vite: {
    resolve: {
      alias: {
        '@/': `${path.resolve(__dirname, 'src')}/`
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: undefined, // Отключаем разбиение на чанки
        },
      },
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "@/styles/vars" as *;
            @use "@/styles/fonts" as *;
          `
        }
      }
    }
  },

  integrations: [relativeLinks(), vue()]
});