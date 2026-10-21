---
name: seo-technical-strategist
description: Estrategia SEO técnica y monetización con AdSense para Prompt & Patch (raulo.dev/blog). Usar al elegir el tema o la keyword de un artículo, definir su frontmatter, modificar el head, el sitemap, el RSS o los datos estructurados, o colocar y configurar anuncios.
---

# SEO Technical Strategist — Prompt & Patch

## Estrategia de contenido: long-tail técnico

Apuntar a búsquedas muy específicas con intención de resolver algo ahora:

- Mensajes de error literales: `LegacyContentConfigError astro 6`.
- Integraciones concretas: "webhook de Stripe en Astro con endpoint server", "Resend + Astro form".
- Flujos exactos de automatización: "n8n + Google Sheets + WhatsApp Cloud API".
- Migraciones entre versiones: "migrar X de v4 a v5".

Antes de escribir: buscar la keyword en Google, leer los 5 primeros resultados y escribir solo si
el artículo puede ser más preciso, más actual o más completo en el troubleshooting.

## Metadatos (validados en build por `src/content.config.ts`)

| Campo | Regla |
| --- | --- |
| `title` | ≤ 60 caracteres. Keyword principal al inicio + gancho técnico. También es el H1. `metaTitle()` añade ` \| Prompt & Patch` solo si cabe. |
| `description` | ≤ 150 caracteres. El dolor del lector y qué se lleva. Incluir la keyword de forma natural. |
| `slug` | kebab-case, keyword principal, sin fechas ni stopwords innecesarias. **Inmutable una vez publicado.** |
| `pubDate` | `YYYY-MM-DD`. |
| `updatedDate` | Solo cuando el contenido cambia de forma sustancial. Nunca para fingir frescura. |
| `tags` | 1–5, en minúsculas. Reutilizar tags existentes antes de crear nuevos. |
| `draft` | `true` hasta pasar el checklist de `tech-writer-anti-ai`. Los borradores no se generan en producción. |
| `ogImage` | Opcional, ruta en `/public`, 1200×630. |

## Lo que ya está automatizado

No duplicar esto a mano en los artículos:

- `<link rel="canonical">` con barra final (las páginas se sirven como directorio).
- Open Graph, Twitter Card, `article:published_time`, `article:modified_time`, `article:tag`.
- JSON-LD: `BlogPosting` + `BreadcrumbList` en cada artículo; `Blog` en el listado.
- Sitemap (`@astrojs/sitemap`), excluyendo `/blog/tags/`.
- RSS en `/blog/rss.xml`, enlazado en el `<head>`.
- `noindex, follow` en archivos de tags, en borradores y en `/blog/` mientras no haya artículos.
- Índice de contenidos desde los H2/H3, artículos relacionados por tags y tiempo de lectura.

## Google Search Console

- **Propiedad:** de dominio, `raulo.dev`, verificada con un registro TXT `google-site-verification` en Cloudflare. **No borrar ese registro.**
- **Enviados en Sitemaps:** `https://raulo.dev/sitemap-index.xml` y `https://raulo.dev/blog/rss.xml`. Google descubre los artículos nuevos por el RSS.
- **Al publicar un artículo:** Inspección de URLs → URL nueva → **Solicitar indexación**, una sola vez; repetirlo no acelera nada.
- **Seguimiento:** Indexación → Páginas. "Descubierta: actualmente sin indexar" es normal los primeros días.

## Estructura on-page

- Un solo H1 (el `title`). En el markdown se empieza en `##`.
- H2 para las secciones obligatorias; H3 para pasos y errores. No saltar niveles.
- Los H2/H3 deben poder leerse como respuestas: incluyen el término que alguien buscaría.
- Enlazar 2–3 artículos propios relacionados con texto ancla descriptivo (no "aquí").
- Enlaces externos solo a fuentes primarias: documentación oficial, código fuente, RFCs.

## Rendimiento (Core Web Vitals)

- Sin frameworks de cliente en el blog. Scripts mínimos y no bloqueantes.
- Imágenes con `width`/`height` explícitos o vía `astro:assets`.
- Todo lo que carga tarde reserva altura (`AdSlot` reserva 280px).

## AdSense: monetización legítima

### Activar anuncios

1. Completar `blogConfig.adsense.client` (`ca-pub-…`) y los `slots` en `src/data.ts`.
   Con `client` vacío no se carga ningún script de anuncios.
2. Crear `public/ads.txt` con: `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`.
3. Ubicaciones actuales: final del artículo (`postEnd`) y bajo el listado (`listing`). Para más
   ubicaciones, usar `<AdSlot>`; nunca dentro de un elemento sticky o flotante.

### Requisitos previos a solicitar la aprobación

- [ ] Suficiente contenido original publicado (no borradores ni artículos de relleno).
- [ ] Página de política de privacidad que mencione cookies de terceros y Google AdSense.
- [ ] Página de contacto/autor accesible (el portafolio cumple esa función: enlazarlo).
- [ ] Mensaje de consentimiento (CMP certificado por Google) para usuarios del EEE, Reino Unido y Suiza.

### Línea roja: tráfico inválido

Prohibido, sin excepciones: hacer clic en los propios anuncios, pedir clics o visitas, bots o
scripts de tráfico, tráfico pagado de baja calidad, intercambio de clics, colocar anuncios cerca
de botones de forma engañosa. Un solo incidente puede cerrar la cuenta.

### Distribución orgánica

Reddit, Hacker News, LinkedIn, dev.to y comunidades de la stack: compartir cuando el artículo
resuelve algo que alguien preguntó ahí, respetar las reglas de cada comunidad sobre autopromoción,
y nunca manipular votos. En cross-posts (dev.to, Hashnode) apuntar la URL canónica a raulo.dev.
