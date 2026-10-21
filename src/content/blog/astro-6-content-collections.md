---
title: "Astro 6: migrar Content Collections sin romper tus URLs"
description: "LegacyContentConfigError, entry.slug undefined y z deprecado: cómo migrar Content Collections a Astro 6 con glob loader y Zod 4."
slug: astro-6-content-collections-migracion
pubDate: 2026-10-21
tags: [astro, content-collections, zod, seo]
draft: false
---

Si un proyecto viene de Astro 2–4, lo primero que hace `astro build` en la versión 6 es detenerse antes de generar una sola página:

```text
LegacyContentConfigError: Found legacy content config file in "src/content/config.ts".
Please move this file to "src/content.config.ts" and ensure each collection has a loader defined.
```

Mover el archivo es la parte fácil. Lo que de verdad importa en un blog con tráfico orgánico es que, al terminar, **cada URL indexada siga respondiendo exactamente igual**. Esta es la configuración que usa este blog y los fallos que conviene anticipar.

## El problema

Astro 6 eliminó la API heredada de colecciones. Ya no existe el flag de compatibilidad de Astro 5: o la colección define un `loader`, o el build falla. Estos son los cambios que rompen código existente:

| Antes (Astro 2–4)                   | Astro 6                          |
| ----------------------------------- | -------------------------------- |
| `src/content/config.ts`             | `src/content.config.ts`          |
| `type: 'content'`                   | `loader: glob({ ... })`          |
| `entry.slug`                        | `entry.id`                       |
| `entry.render()`                    | `render(entry)`                  |
| `import { z } from 'astro:content'` | `import { z } from 'astro/zod'`  |

El riesgo silencioso está en la tercera fila. Las entradas del Content Layer no tienen `slug`: si `getStaticPaths` sigue leyendo `post.slug`, recibe `undefined`. Y si el `id` que genera el loader no coincide con el slug que usaban tus URLs, Google empieza a encontrar 404 donde antes había artículos posicionados.

## La solución

### 1. Configuración con glob loader

```ts
// src/content.config.ts
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  loader: glob({ base: './src/content/blog', pattern: '**/[^_]*.md' }),
  schema: z.object({
    title: z.string().max(60),
    description: z.string().max(150),
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string().trim().toLowerCase()).min(1).max(5),
    draft: z.boolean().default(false),
  }),
});

export const collections = { blog };
```

Dos decisiones deliberadas:

1. Los límites de `title` (60) y `description` (150) son los de la SERP. Un título que Google truncaría detiene el build en lugar de llegar a producción.
2. El patrón `[^_]*` ignora archivos que empiezan con guion bajo, así que una plantilla o un borrador local pueden vivir junto a los artículos sin publicarse.

### 2. Fijar la URL con `slug` en el frontmatter

El glob loader decide el `id` de cada entrada así (simplificado de `astro/dist/content/loaders/glob.js`):

```js
function generateIdDefault({ entry, base, data }) {
  if (data.slug) {
    return data.slug;
  }
  // Sin slug: ruta del archivo relativa a `base`, sin extensión y slugificada.
  // ...
}
```

Por eso el esquema exige `slug`: la URL deja de depender del nombre o la ubicación del archivo. Puedes reorganizar `src/content/blog/` en carpetas por año sin tocar una sola URL. Si migras un blog existente, copia en cada artículo el slug que ya tenía publicado:

```yaml
---
title: "Astro 6: migrar Content Collections sin romper tus URLs"
slug: astro-6-content-collections-migracion
pubDate: 2026-10-21
tags: [astro, content-collections]
---
```

### 3. Rutas y renderizado

`entry.render()` ya no existe en las entradas: `render` se importa desde `astro:content`.

```astro
---
// src/pages/blog/[...slug].astro
import { getCollection, render } from 'astro:content';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return posts.map((post) => ({
    params: { slug: post.id },
    props: { post },
  }));
}

const { post } = Astro.props;
const { Content, headings } = await render(post);
---

<h1>{post.data.title}</h1>
<Content />
```

`headings` devuelve `depth`, `slug` y `text` de cada encabezado del markdown. Con eso se arma un índice de contenidos sin plugins adicionales.

### 4. Zod 4 desde `astro/zod`

`import { z } from 'astro:content'` sigue funcionando, pero está marcado como deprecado. Además, Astro 6 incluye Zod 4 (`astro/zod` reexporta `zod/v4`), así que conviene revisar validadores escritos para Zod 3: los formatos de string ahora tienen función propia (`z.email()`, `z.url()`) y variantes como `z.string().email()` quedan deprecadas.

## Troubleshooting

### Un artículo desaparece sin ningún error

Dos archivos con el mismo `slug` producen el mismo `id`. El build no falla: emite una advertencia y la última entrada procesada sobrescribe a la anterior.

```text
Duplicate id "mi-articulo" found in …/src/content/blog/mi-articulo-v2.md. Later items with the same id will overwrite earlier ones.
```

En CI vale la pena convertir esa advertencia en un error:

```bash
set -o pipefail
pnpm astro build 2>&1 | tee build.log
if grep -q "Duplicate id" build.log; then
  echo "Hay slugs duplicados en src/content/blog" >&2
  exit 1
fi
```

### Un `.mdx` que nunca aparece

Con el patrón `**/[^_]*.md`, los `.mdx` ni siquiera se leen. Si amplías el patrón sin instalar la integración, el loader los descarta con un `No entry type found for …` en la consola. Solución: `pnpm astro add mdx` y patrón `**/[^_]*.{md,mdx}`.

### Fechas que se muestran un día antes

`z.coerce.date()` convierte `2026-10-21` en medianoche UTC. Si el build corre en una máquina configurada en `America/El_Salvador` (UTC−6), `toLocaleDateString()` muestra el 20 de octubre. El resultado depende de dónde se ejecute el build, así que formatea siempre en UTC:

```ts
const formatDate = new Intl.DateTimeFormat('es', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
}).format;
```

### El build falla por un título largo

Es intencional. Con `.max(60)` en el esquema, el error de validación indica la entrada y el campo. Acorta el título; no relajes el límite.
