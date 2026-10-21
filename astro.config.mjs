// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

import node from '@astrojs/node';

/**
 * Envuelve cada bloque de código del blog en `.pp-code` con la etiqueta del lenguaje.
 * Se resuelve en build: sin JS y sin layout shift. El botón "copiar" lo añade
 * src/pages/blog/[...slug].astro de forma absoluta, sin mover el contenido.
 * @type {NonNullable<import('astro').ShikiConfig['transformers']>[number]}
 */
const codeFrame = {
  name: 'pp-code-frame',
  root(root) {
    // Astro solo conserva root.children[0]: el <pre> debe quedar dentro del wrapper.
    const pre = root.children[0];
    if (pre?.type !== 'element') return;
    const lang = this.options.lang === 'plaintext' ? 'text' : this.options.lang;
    root.children = [
      {
        type: 'element',
        tagName: 'div',
        properties: { className: ['pp-code'] },
        children: [
          {
            type: 'element',
            tagName: 'span',
            properties: { className: ['pp-code-lang'], ariaHidden: 'true' },
            children: [{ type: 'text', value: lang }],
          },
          pre,
        ],
      },
    ];
  },
};

// https://astro.build/config
export default defineConfig({
  site: 'https://raulo.dev',
  output: 'static',
  adapter: node({
    mode: 'standalone'
  }),
  integrations: [
    react(),
    // Los archivos de tags llevan noindex: no tiene sentido enviarlos en el sitemap.
    sitemap({ filter: (page) => !page.includes('/blog/tags/') })
  ],
  markdown: {
    shikiConfig: {
      theme: 'vesper',
      transformers: [codeFrame],
    },
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
