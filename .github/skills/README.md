# Skills del proyecto — Prompt & Patch

Directrices de referencia para la sección `/blog` de raulo.dev. Cada carpeta es una skill en
formato Agent Skills (`SKILL.md` con frontmatter `name` y `description`), legible por asistentes
de código y por personas.

| Skill | Cuándo aplicarla |
| --- | --- |
| [`maquetador-frontend-pro`](./maquetador-frontend-pro/SKILL.md) | Crear o modificar UI del blog: componentes, estilos, layout. |
| [`tech-writer-anti-ai`](./tech-writer-anti-ai/SKILL.md) | Escribir, editar o revisar artículos en `src/content/blog/`. |
| [`seo-technical-strategist`](./seo-technical-strategist/SKILL.md) | Elegir keywords, definir metadatos, tocar `<head>`, sitemap, RSS o anuncios. |

## Uso con Claude Code

Claude Code busca las skills en `.claude/skills/`. Ahí hay una entrada corta por cada skill de esta
carpeta, que solo apunta a su `SKILL.md`: **esta carpeta es la fuente única**. Si cambias la
`description` de una skill aquí, cópiala también en su entrada de `.claude/skills/`.

Además, `.claude/skills/nuevo-articulo/` es el flujo completo para escribir un artículo: pide el
material real, verifica, redacta, valida y deja los pasos de publicación.

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

## Infraestructura en producción

- **Hosting:** Namecheap (cPanel), solo archivos estáticos en `public_html`. Se sube el contenido
  de `dist/client`; nunca `dist/server` ni zips que queden ahí.
- **DNS y proxy:** Cloudflare. `.htaccess` tiene `Options -Indexes` (sin listado de carpetas).
- **Formulario de contacto:** Cloudflare Worker `raulo-contact` en la ruta `raulo.dev/api/send`
  (código en `workers/contact/worker.js`). `src/pages/api/send.ts` solo corre en `pnpm dev`.
  Si cambias el formato del correo, cámbialo en los dos y vuelve a pegar el Worker en Cloudflare.
- **Search Console:** propiedad de dominio `raulo.dev`, verificada con un TXT en Cloudflare.

El contexto original del que salen estas skills está en `contexto_proyecto.md` (raíz del repo).
