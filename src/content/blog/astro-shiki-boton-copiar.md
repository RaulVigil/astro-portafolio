---
title: "Astro + Shiki: botón copiar en bloques de código sin CLS"
description: "Un transformer de Shiki que envuelve cada bloque de código de Astro en el build: etiqueta del lenguaje y botón copiar sin mover el contenido."
slug: astro-shiki-boton-copiar-bloques-codigo
pubDate: 2026-10-21
tags: [astro, shiki, markdown, rendimiento]
draft: false
---

La forma habitual de agregar un botón "copiar" a los bloques de código de un blog en Astro es un script que, al cargar la página, envuelve cada `<pre>` y le inserta una cabecera. Funciona, pero cada cabecera insertada empuja hacia abajo todo lo que viene después: layout shift en cada artículo con código, justo lo que mide el CLS de Core Web Vitals.

En este blog la etiqueta del lenguaje sale del build y el botón se monta después sin mover un píxel.

## El problema

Astro resalta los bloques de código del Markdown con Shiki durante el build. Este es el HTML que genera para un bloque `ts` con el tema `vesper` (Astro 6.4):

```html
<pre class="astro-code vesper" style="background-color:#101010;color:#FFF; overflow-x: auto;" tabindex="0" data-language="ts">
  <code>…</code>
</pre>
```

Tres detalles de ese `<pre>` descartan las soluciones rápidas:

1. **`overflow-x: auto` va inline.** El propio `<pre>` es el contenedor de scroll horizontal. Si lo posicionas para anclar dentro una etiqueta o un botón con `position: absolute`, ese elemento se desplaza junto con las líneas largas y desaparece por la izquierda.
2. **El fondo del tema también va inline.** Cambiarlo desde una hoja de estilos exige `!important`.
3. **Un wrapper agregado con JavaScript llega tarde.** Si la cabecera ocupa espacio en el flujo, el contenido salta cuando corre el script.

Hace falta un contenedor *fuera* del `<pre>` que ya exista en el HTML que sale del build.

## La solución

Un transformer de Shiki genera esta estructura para cada bloque:

```html
<div class="pp-code">
  <span class="pp-code-lang" aria-hidden="true">ts</span>
  <pre class="astro-code vesper" …>…</pre>
</div>
```

La etiqueta y el botón van en posición absoluta sobre un `padding-top` que el `<pre>` reserva desde el primer render. Cuando el script agrega el botón, nada en el flujo cambia de tamaño.

### 1. El transformer en `astro.config.mjs`

```js
// astro.config.mjs
// @ts-check
import { defineConfig } from 'astro/config';

/** @type {NonNullable<import('astro').ShikiConfig['transformers']>[number]} */
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

export default defineConfig({
  markdown: {
    shikiConfig: {
      theme: 'vesper',
      transformers: [codeFrame],
    },
  },
});
```

El hook `root` recibe el árbol hast del bloque ya resaltado. El comentario dentro de `root` es la parte importante. Así reemplaza Astro el bloque original:

```js
// node_modules/@astrojs/markdown-remark/dist/highlight.js (v7.2, extracto)
const result = await highlighter(code, language, { meta });
// ...
replacement = result.children[0];
// ...
grandParent.children[index] = replacement;
```

Solo se usa el primer hijo de la raíz. Si la etiqueta y el `<pre>` quedaran como hermanos, Astro se quedaría con la etiqueta y descartaría el código.

### 2. CSS que reserva el espacio desde el primer render

```css
/* src/styles/blog.css (simplificado) */
.pp-code {
  position: relative;
  border: 1px solid #272a33;
  border-radius: 6px;
  background: #0f1013;
  overflow: hidden;
}

.pp-code-lang {
  position: absolute;
  inset: 0 0 auto 0;
  display: flex;
  align-items: center;
  height: 2.25rem;
  padding-inline: 1rem;
  border-bottom: 1px solid #272a33;
  font-size: 0.75rem;
  pointer-events: none;
}

.pp-code pre {
  margin: 0;
  /* Barra de 2.25rem + aire, reservado antes de que exista el botón. */
  padding: 3.25rem 1.25rem 1.25rem;
  overflow-x: auto;
  background: transparent !important; /* el tema lo pone inline */
}

.pp-code-copy {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  height: 2.25rem;
  padding-inline: 1rem;
}
```

El contenedor de scroll es el `<pre>`, no `.pp-code`, así que la barra y el botón se quedan fijos mientras el código se desplaza en horizontal. En el blog real esos colores son tokens `var(--color-pp-*)` de Tailwind. Qué variables de `@theme` llegan de verdad al CSS está en [Tailwind v4: variables de @theme que no llegan al CSS](/blog/tailwind-v4-variables-theme-no-se-generan/).

### 3. El botón "copiar"

```ts
// src/pages/blog/[...slug].astro (dentro de <script>)
for (const frame of document.querySelectorAll<HTMLElement>('.pp-prose .pp-code')) {
  const pre = frame.querySelector('pre');
  if (!pre || !navigator.clipboard) continue;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'pp-code-copy';
  button.textContent = 'copiar';
  button.addEventListener('click', async () => {
    await navigator.clipboard.writeText(pre.innerText);
    button.textContent = 'copiado';
    button.dataset.copied = '';
    setTimeout(() => {
      button.textContent = 'copiar';
      delete button.dataset.copied;
    }, 1600);
  });
  frame.append(button);
}
```

- `navigator.clipboard` solo existe en contextos seguros (HTTPS o `localhost`). Si no está disponible, no se agrega el botón: mejor ninguno que uno que no hace nada.
- Sin JavaScript el bloque se ve igual, solo que sin botón. La etiqueta del lenguaje ya viene en el HTML.

## Troubleshooting

### La etiqueta aparece, pero el código desaparece

El transformer dejó más de un nodo en la raíz, por ejemplo `[etiqueta, pre]`. Astro toma `result.children[0]` y descarta el resto. Todo lo que agregues tiene que quedar dentro de un único nodo raíz.

### `Cannot read properties of undefined (reading 'options')`

El hook está escrito como arrow function: `root: (root) => { this.options… }`. Una arrow function no tiene `this` propio, y en el nivel superior de un módulo ES `this` es `undefined`. Con la sintaxis de método, `root(root) { … }`, Shiki puede pasar su contexto.

### `// @ts-check` marca errores en el transformer

El primer intento de tipado fue `import('shiki').ShikiTransformer`:

```text
error TS2307: Cannot find module 'shiki' or its corresponding type declarations.
```

Con pnpm, `shiki` no es dependencia directa del proyecto y no se resuelve desde la raíz. `astro` sí exporta `ShikiConfig`, pero indexarlo directamente tampoco compila:

```text
error TS2537: Type 'ShikiTransformer[] | undefined' has no matching index signature for type 'number'.
```

`transformers` es opcional, por eso hace falta `NonNullable<…>` antes de `[number]`. Con el tipo ya correcto apareció un tercer error al hacer `...root.children` dentro del wrapper:

```text
error TS2322: Type 'RootContent' is not assignable to type 'ElementContent'.
```

La raíz hast admite nodos, como `doctype`, que un elemento no puede contener. Comprobar `pre?.type === 'element'` estrecha el tipo y, de paso, protege el build si Shiki devolviera algo inesperado.

### Los bloques `math` no reciben el marco

Astro excluye `math` del resaltado por defecto (`defaultExcludeLanguages = ["math"]` en `@astrojs/internal-helpers`), así que esos bloques nunca pasan por Shiki. Los bloques sin lenguaje sí pasan, como `plaintext`, y el transformer los etiqueta como `text`.

### El componente `<Code />` no usa el transformer

`markdown.shikiConfig` solo aplica al Markdown. `<Code />` tiene sus propios valores por defecto (`theme = 'github-dark'`, `transformers = []`), así que el tema y el transformer se pasan como props. Para eso, el transformer tiene que vivir en su propio módulo en lugar de dentro de `astro.config.mjs`:

```astro
---
// src/components/Snippet.astro
import { Code } from 'astro:components';
import { codeFrame } from '../lib/code-frame.mjs';

const { code, lang } = Astro.props;
---

<Code code={code} lang={lang} theme="vesper" transformers={[codeFrame]} />
```
