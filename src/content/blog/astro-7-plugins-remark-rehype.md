---
title: "Astro 7: plugins de remark y rehype que dejan de funcionar"
description: "Astro 7 usa Sätteri: los plugins de remark/rehype rompen el build o se ignoran en MDX. Cómo mantenerlos con unified() o portarlos a Sätteri."
slug: astro-7-plugins-remark-rehype
pubDate: 2026-10-22
tags: [astro, markdown, mdx]
draft: false
---

Después de actualizar a Astro 7 con `npx @astrojs/upgrade`, `astro build` se detiene antes de generar una sola página:

```text
`markdown.remarkPlugins`, `markdown.rehypePlugins`, and `markdown.remarkRehype` run on the `unified` processor from `@astrojs/markdown-remark`, which is no longer installed by default now that Sätteri is the default Markdown processor. Install it with:
  npm install @astrojs/markdown-remark
```

Ese es el caso fácil, porque el error dice qué hacer. El difícil es el que no falla: con plugins en `mdx({...})`, o con `processor: satteri()` en la configuración, el build termina bien y los plugins simplemente no se aplican.

## El problema

Desde Astro 7.0, los `.md` y `.mdx` se renderizan con [Sätteri](https://satteri.bruits.org/), el procesador de Markdown nativo de Astro, en lugar del pipeline de remark y rehype. Sätteri tiene su propia API de plugins y no ejecuta plugins de unified. El paquete que sí los ejecuta, `@astrojs/markdown-remark`, ya no viene con Astro: en un proyecto con Astro 6.4.8 estaba instalado como dependencia (7.2.0), y después de `@astrojs/upgrade` desapareció de `node_modules`.

Para medir el impacto, se partió de un proyecto en Astro 6.4.8 con una colección `glob`, un plugin de tiempo de lectura, `remark-math` + `rehype-katex`, `rehype-external-links` y un transformer de Shiki. Se actualizó a Astro 7.4.2 con `@astrojs/upgrade` (Node 24.22.1, `@astrojs/mdx` 8.1.1), y este fue el resultado según la configuración:

| Configuración en Astro 7 | `astro build` | ¿Se aplican los plugins? |
| --- | --- | --- |
| `markdown.remarkPlugins`/`rehypePlugins` sin `@astrojs/markdown-remark` | Falla con el error de arriba | — |
| Lo mismo, con `@astrojs/markdown-remark` instalado | Termina, con un aviso de opción obsoleta | Sí |
| `markdown.processor: unified({...})` | Termina, sin avisos | Sí |
| `markdown.processor: satteri()` y las claves antiguas | Termina, con un warning | **No** |
| Plugins en `mdx({ remarkPlugins, rehypePlugins })` | Termina, con dos `[WARN]` | **No**, en los `.mdx` |

Astro 7.0.0 da el mismo error que la 7.4.2 en el primer caso, así que ninguna versión 7 ignora en silencio las claves antiguas cuando falta el paquete. Los fallos silenciosos son los dos últimos, y se explican en `astro/dist/core/config/validate.js`: si no hay `processor` o es `unified()`, Astro mete los plugins antiguos en `unified()`. Si el procesador es otro, como `satteri()`, solo avisa.

Lo que no se rompe es `markdown.shikiConfig`. El tema y los transformers de Shiki se aplicaron igual con Sätteri que con `unified()`. Si usas un transformer como el de [el botón de copiar en bloques de código](/blog/astro-shiki-boton-copiar-bloques-codigo/), sigue funcionando.

## La solución

Hay dos caminos. Mantener los plugins actuales con `unified()` funciona con cualquier plugin y es obligatorio si renderizas fórmulas con KaTeX. Portarlos a Sätteri tiene sentido si son pocos y simples: el ejemplo de este artículo porta el tiempo de lectura y los enlaces externos.

### 1. Instala `@astrojs/markdown-remark`

```bash
npm i @astrojs/markdown-remark
```

En la prueba se instaló la 7.3.4. Con esto, el build ya no falla: Astro mueve las claves antiguas a `unified()` y muestra este aviso:

```text
[astro] `markdown.remarkPlugins`, `markdown.rehypePlugins`, and `markdown.remarkRehype` are deprecated. Pass them to `unified({...})` from `@astrojs/markdown-remark` directly instead.
```

### 2. Pasa los plugins a `unified()`

Los plugins van dentro de `unified()`. `shikiConfig` se queda donde estaba, y `mdx()` va sin opciones: hereda los plugins del procesador.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { unified } from '@astrojs/markdown-remark';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeExternalLinks from 'rehype-external-links';
import { remarkReadingTime } from './remark-reading-time.mjs';

export default defineConfig({
  integrations: [mdx()],
  markdown: {
    processor: unified({
      remarkPlugins: [remarkReadingTime, remarkMath],
      rehypePlugins: [rehypeKatex, [rehypeExternalLinks, { target: '_blank', rel: ['noopener'] }]],
    }),
    shikiConfig: { theme: 'vesper' },
  },
});
```

Si tenías opciones en `markdown.remarkRehype`, también van dentro, como `unified({ remarkRehype: { ... } })`. Con esta configuración, el build de la prueba terminó sin avisos, y los tres plugins se aplicaron en `.md` y en `.mdx`.

El plugin de tiempo de lectura es el de la [receta oficial de Astro](https://docs.astro.build/en/recipes/reading-time/), sin cambios para Astro 7:

```js
// remark-reading-time.mjs
import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';

export function remarkReadingTime() {
  return function (tree, { data }) {
    const readingTime = getReadingTime(toString(tree));
    data.astro.frontmatter.minutesRead = readingTime.text;
  };
}
```

### 3. Comprueba que no haya plugins ignorados

En dos de los casos de la tabla, el build termina con código de salida 0, así que un CI que solo mira el resultado no se entera. Busca los avisos en la salida:

```bash
npx astro build 2>&1 | grep -iE "deprecated|doesn't run|are ignored"
```

En PowerShell:

```powershell
npx astro build 2>&1 | Select-String -Pattern "deprecated|doesn't run|are ignored"
```

El `2>&1` es necesario: en la prueba, los avisos de `@astrojs/mdx` salieron por stdout, pero el de `satteri()` salió por stderr. Si el comando no imprime nada, Astro no detectó plugins ignorados. Para confirmarlo del todo, abre una página generada en `dist/` y busca algo que solo ponga un plugin, como un `target="_blank"` o el tiempo de lectura.

### 4. Opcional: porta los plugins a Sätteri

Si tus plugins son pocos y no tocan fórmulas, puedes dejar unified. Sätteri usa plugins `mdast` (equivalentes a remark) y `hast` (equivalentes a rehype). El de tiempo de lectura sigue la receta oficial de Astro para Sätteri, y el de enlaces externos adapta el ejemplo de la [documentación de plugins de Sätteri](https://satteri.bruits.org/docs/plugins/):

```bash
npm i @astrojs/markdown-satteri satteri
```

```js
// satteri-plugins.mjs
import getReadingTime from 'reading-time';
import { defineHastPlugin, defineMdastPlugin } from 'satteri';

export const mdastReadingTime = defineMdastPlugin({
  name: 'mdast-reading-time',
  after(root, ctx) {
    const readingTime = getReadingTime(ctx.textContent(root));
    if (ctx.data.astro !== undefined) {
      ctx.data.astro.frontmatter.minutesRead = readingTime.text;
    }
  },
});

export const hastExternalLinks = defineHastPlugin({
  name: 'hast-external-links',
  element: {
    filter: ['a'],
    visit(node, ctx) {
      const href = node.properties.href;
      if (typeof href === 'string' && /^https?:\/\//.test(href)) {
        ctx.setProperty(node, 'target', '_blank');
        ctx.setProperty(node, 'rel', 'noopener');
      }
    },
  },
});
```

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import { satteri } from '@astrojs/markdown-satteri';
import { hastExternalLinks, mdastReadingTime } from './satteri-plugins.mjs';

export default defineConfig({
  integrations: [mdx()],
  markdown: {
    processor: satteri({
      mdastPlugins: [mdastReadingTime],
      hastPlugins: [hastExternalLinks],
    }),
    shikiConfig: { theme: 'vesper' },
  },
});
```

En la prueba (`satteri` 0.10.5, `@astrojs/markdown-satteri` 0.4.5), los dos plugins funcionaron en `.md` y en `.mdx`. En las páginas, el dato se sigue leyendo con `remarkPluginFrontmatter`, igual que con unified. Ese nombre no cambia con Sätteri:

```astro
---
// src/pages/blog/[...slug].astro
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog');
  return posts.map((post) => ({ params: { slug: post.id }, props: { post } }));
}

const { post } = Astro.props;
const { Content, remarkPluginFrontmatter } = await render(post);
---
<h1>{post.data.title}</h1>
<p>{remarkPluginFrontmatter.minutesRead}</p>
<Content />
```

Si `render()` o `post.id` no te resultan familiares, vienen del Content Layer: están explicados en [la migración de Content Collections a Astro 6](/blog/astro-6-content-collections-migracion/). Una vez portados los plugins, puedes desinstalar `@astrojs/markdown-remark`, `mdast-util-to-string` y los paquetes `remark-*` y `rehype-*` que ya no uses.

## Troubleshooting

### `[astro] ... are set, but your satteri processor doesn't run them.`

```text
[astro] `markdown.remarkPlugins`/`rehypePlugins`/`remarkRehype` are set, but your `satteri` processor doesn't run them. Move them to `unified({...})` from `@astrojs/markdown-remark` and set `markdown.processor: unified({...})` if you want them to apply.
```

El build termina, pero los plugins de `remarkPlugins` y `rehypePlugins` no se ejecutan. Pasa cuando la configuración tiene `processor: satteri()` (por ejemplo, para ajustar `features`) y también las claves antiguas. Elige un solo camino: el paso 2 o el paso 4.

### `[WARN] [@astrojs/mdx] ... are ignored because your satteri processor does not run remark/rehype plugins.`

```text
[WARN] [@astrojs/mdx] `remarkPlugins`, `rehypePlugins` on `mdx({...})` are deprecated. Pass them to `unified({...})` from `@astrojs/markdown-remark` and set it as `markdown.processor` instead — MDX will inherit them. Will be removed in a future major.
[WARN] [@astrojs/mdx] `remarkPlugins`, `rehypePlugins` on `mdx({...})` are ignored because your `satteri` processor does not run remark/rehype plugins. Set `markdown.processor: unified({...})` from `@astrojs/markdown-remark` to apply them.
```

Los plugins pasados a `mdx({...})` no se aplican mientras el procesador sea Sätteri, que es el valor por defecto. En la prueba apareció incluso con `@astrojs/markdown-remark` instalado, porque instalarlo no cambia el procesador. Muévelos a `unified()` y deja `mdx()` sin opciones, como en el paso 2.

### Las fórmulas salen como texto con `$$` o como bloque de código

Sin `remark-math` y `rehype-katex` en ejecución, la prueba dio dos resultados distintos. Con Sätteri por defecto, la fórmula queda como texto, y además se pierde la barra de `\,`, porque Markdown la trata como un escape:

```text
<p>$$
\int_0^1 x^2 , dx = \frac{1}{3}
$$</p>
```

Con `satteri({ features: { math: true } })`, Sätteri reconoce la fórmula, pero no la renderiza: la deja como bloque de código.

```text
<pre><code class="language-math math-display">\int_0^1 x^2 \, dx = \frac{1}{3}</code></pre>
```

La [documentación de plugins de Sätteri](https://satteri.bruits.org/docs/plugins/) no incluye un plugin de KaTeX. Para fórmulas, usa `unified()` con `remark-math` y `rehype-katex`, como en el paso 2.

### `Cannot compile a raw node (raw HTML) to MDX/JSX output`

```text
Cannot compile a `raw` node (raw HTML) to MDX/JSX output. A plugin returned an `html` node (`{ type: "html", value: ... }`), which cannot be represented as JSX. Return `{ raw: ..., mdxExpressions: false }` instead so the HTML is parsed into JSX, or enable `features: { rawHtml: true }` to parse it into elements. (mdxjs-rs:raw-html)
```

Aparece al portar a Sätteri un plugin `hast` que inserta HTML devolviendo `{ type: 'raw', value }`, como un renderizador de KaTeX hecho a mano. En `.md` funciona; en `.mdx`, el build falla. En la prueba no funcionó ninguna de las dos salidas que propone el mensaje. Con `features: { rawHtml: true }`, el error es el mismo. Devolviendo `{ raw, mdxExpressions: false }`, sale otro:

```text
satteri: cannot encode replacement content into the structural op-stream — unsupported node type or out-of-range numeric field.
```

Si tienes `.mdx` y un plugin que genera HTML, mantenlo en `unified()`.

## Referencias

- [Upgrade to Astro v7: New default Markdown processor](https://docs.astro.build/en/guides/upgrade-to/v7/)
- [Receta de Astro: tiempo de lectura](https://docs.astro.build/en/recipes/reading-time/), con las versiones para Sätteri y unified.
- [Sätteri: plugins](https://satteri.bruits.org/docs/plugins/)
