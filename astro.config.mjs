// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';
import { satteri } from '@astrojs/markdown-satteri';
import { URL } from 'node:url';
import { lastModified } from './scripts/lib/lastmod.mjs';

export default defineConfig({
  site: 'https://sethos.com.br',
  trailingSlash: 'never',
  build: { format: 'file', inlineStylesheets: 'never' },
  integrations: [
    sitemap({
      // lastmod = data do último commit que alterou o conteúdo daquela página (omitido se não der para saber).
      serialize(item) {
        const lastmod = lastModified(new URL(item.url).pathname);
        return lastmod ? { ...item, lastmod } : item;
      },
    }),
    icon(),
  ],
  // Texto jurídico não pode ser "embelezado": aspas retas continuam retas, "--" não vira travessão etc.
  markdown: { processor: satteri({ features: { smartPunctuation: false } }) },
  vite: { plugins: [tailwindcss()] },
});
