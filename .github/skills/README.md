# Skills del proyecto — Prompt & Patch

Directrices de referencia para la sección `/blog` de raulo.dev. Cada carpeta es una skill en
formato Agent Skills (`SKILL.md` con frontmatter `name` y `description`), legible por asistentes
de código y por personas.

| Skill | Cuándo aplicarla |
| --- | --- |
| [`maquetador-frontend-pro`](./maquetador-frontend-pro/SKILL.md) | Crear o modificar UI del blog: componentes, estilos, layout. |
| [`tech-writer-anti-ai`](./tech-writer-anti-ai/SKILL.md) | Escribir, editar o revisar artículos en `src/content/blog/`. |
| [`seo-technical-strategist`](./seo-technical-strategist/SKILL.md) | Elegir keywords, definir metadatos, tocar `<head>`, sitemap, RSS o anuncios. |

## Meta del blog

Generar tráfico orgánico de programadores resolviendo problemas técnicos concretos y monetizarlo
de forma legítima con Google AdSense. Todo lo que ponga en riesgo la cuenta de AdSense (tráfico
artificial, clics incentivados, contenido de relleno) está fuera de la mesa.

## Mapa del código

```
src/content.config.ts            Esquema de la colección `blog` (Zod 4, glob loader)
src/content/blog/*.md            Artículos (`_plantilla.md` = plantilla, excluida del build)
src/lib/blog.ts                  getPosts, URLs, tags, tiempo de lectura, metaTitle, fechas
src/data.ts → blogConfig         Nombre, descripción, autor y configuración de AdSense
src/layouts/BlogLayout.astro     <head> SEO completo, header y footer del blog
src/components/blog/             Logo, BlogHeader, BlogFooter, PostRow, TagLink, TableOfContents, AdSlot
src/pages/blog/                  index, [...slug], tags/[tag], rss.xml
src/styles/blog.css              Prosa, bloques de código y anuncios
src/styles/global.css            Tokens `--color-pp-*` y `--font-pp-*` (@theme static)
astro.config.mjs                 Tema Shiki `vesper`, marco de código, filtro del sitemap
```

El contexto original del que salen estas skills está en `contexto_proyecto.md` (raíz del repo).
