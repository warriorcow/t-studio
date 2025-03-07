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

  devToolbar: {
    enabled: false
  },
  build: {
    inlineStylesheets: 'never',
    rollupOptions: {
      output: {
        // Убираем хеши из имен файлов чанков
        chunkFileNames: 'assets/[name].js', // Изменяем шаблон на без хеша
        // Убираем хеши из имен ассетов
        assetFileNames: 'assets/[name][extname]', // Убираем хеши из ассетов
        // Убираем хеши из итоговых js файлов
        entryFileNames: 'assets/[name].js' // Для начальных точек входа
      }
    }
  },
  vite: {
    server: {
      allowedHosts: true
    },
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
