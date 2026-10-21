---
name: maquetador-frontend-pro
description: Identidad visual y reglas de UI del blog Prompt & Patch (raulo.dev/blog). Usar al crear o modificar componentes, estilos o layouts bajo src/components/blog, src/layouts/BlogLayout.astro, src/pages/blog o src/styles/blog.css. Estética editorial y minimalista técnica, dark mode first, sin estética genérica de IA.
---

# Maquetador Frontend Pro — Prompt & Patch

## Dirección

Editorial y minimalista técnico: una página de documentación bien compuesta, no una landing.
La jerarquía se construye con tipografía, espacio en blanco y líneas de 1px. El color es escaso
y significa algo.

## Prohibido (estética genérica de IA)

- Degradados morados/azules, glows, `box-shadow` decorativos, glassmorphism, blobs animados.
  (El portafolio en `/` usa varios de estos: **no** se heredan al blog.)
- Tarjetas flotantes con sombra y hover que "levanta". Los listados son filas separadas por hairlines.
- Layouts simétricos centrados para todo. El contenido se alinea a la izquierda con aire a la derecha.
- Ilustraciones de robots, cerebros, circuitos o stock 3D.
- Ventanas de terminal falsas con los tres puntos de macOS, animaciones de máquina de escribir.
- Emojis como iconos. Si hace falta un icono, que sea un carácter tipográfico (`>`, `/`, `#`, `↗`).
- Radios grandes: máximo `6px` (bloques de código, imágenes, caja de autor).

## Tokens

Definidos en `src/styles/global.css` (`@theme static`). Usar las utilidades de Tailwind
(`bg-pp-bg`, `text-pp-muted`, `border-pp-border`…) o `var(--color-pp-*)` en CSS. Nunca hex sueltos.

| Token | Valor | Uso |
| --- | --- | --- |
| `pp-bg` | `#0a0a0c` | Fondo de página |
| `pp-surface` | `#16181d` | Superficies: caja de autor, código inline |
| `pp-border` | `#272a33` | Todas las líneas y bordes (1px) |
| `pp-text` | `#f1f5f9` | Títulos, texto de énfasis |
| `pp-prose` | `#cdd5df` | Cuerpo de los artículos (menos halo que blanco puro) |
| `pp-muted` | `#94a3b8` | Descripciones, lead, navegación |
| `pp-faint` | `#7d8796` | Metadatos, labels. **Mínimo** para texto: 4.9:1 sobre `pp-surface` |
| `pp-amber` | `#f59e0b` | Marca: caret `>`, cursor, estado activo, foco, borradores |
| `pp-cyan` | `#38bdf8` | Enlaces dentro del texto |

Regla de acentos: **ámbar = marca y estado; cian = enlace.** Nunca los dos en el mismo elemento,
y nunca como fondo de bloques grandes.

## Tipografía

- `font-pp-sans` (Inter): lectura y titulares. H1 `font-bold` con tracking negativo (`-0.03em`).
- `font-pp-mono` (JetBrains Mono): logo, metadatos, fechas, tags, labels, navegación, código.
- Labels de sección: mono, `text-xs`, `uppercase`, `tracking-wider`, `text-pp-faint`.
- Prosa: 17px, `line-height: 1.75`, columna de `44rem` (~68 caracteres por línea).
- No añadir familias tipográficas nuevas: cada una cuesta tiempo de carga.

## Motivos de terminal (lista cerrada)

Solo estos, siempre discretos:

1. Caret `>` en ámbar: logo y hover de las filas del listado.
2. Prompt como kicker sobre el H1: `~/blog $ cat README.md`, `$ whoami`.
3. `##` antes de cada H2 de la prosa (pseudo-elemento, no se copia).
4. Cursor de bloque parpadeante solo en el logo del header (respeta `prefers-reduced-motion`).
5. Fechas ISO (`2026-10-21`) en listados.

## Componentes existentes

| Componente | Notas |
| --- | --- |
| `Logo.astro` | `size` sm/md/lg, `href` opcional, `cursor` on/off. Texto real, no SVG. |
| `BlogHeader.astro` / `BlogFooter.astro` | Contenedor `max-w-6xl px-5 sm:px-8` (usar el mismo en páginas nuevas). |
| `PostRow.astro` | Fila de listado. `as="h2"` o `"h3"` según la jerarquía de la página. |
| `TagLink.astro` | `#tag` en mono; `count` opcional. |
| `TableOfContents.astro` | `variant="inline"` (details en móvil) y `"sidebar"` (sticky en desktop). |
| `AdSlot.astro` | Ver skill `seo-technical-strategist`. Nunca dentro de un elemento sticky. |

## Bloques de código

Los genera Shiki con el tema `vesper` y el transformer `pp-code-frame` (`astro.config.mjs`), que
envuelve cada `<pre>` en `.pp-code` con la etiqueta del lenguaje. El botón "copiar" se inyecta con
posición absoluta para no causar layout shift. Siempre indicar el lenguaje en el fence.

## Accesibilidad y rendimiento

- Contraste AA mínimo en todo texto; `pp-faint` es el tono más bajo permitido para texto.
- `focus-visible` visible en todos los interactivos (ámbar).
- Skip link "Saltar al contenido" ya incluido en `BlogLayout.astro`.
- El blog no usa islas de React: Astro puro + scripts mínimos. Mantenerlo así.
- Cualquier elemento que cargue tarde (anuncios, embeds) reserva su altura.
- Verificar siempre a 360px de ancho: sin scroll horizontal de página (los `<pre>` y tablas
  hacen scroll dentro de su propio contenedor).
