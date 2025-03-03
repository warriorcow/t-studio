import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';

import relativeLinks from 'astro-relative-links';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  site: 'https://warriorcow.github.io/t-studio/',
  outDir: 'dist',
  base: '/',
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

  integrations: [relativeLinks()]
});