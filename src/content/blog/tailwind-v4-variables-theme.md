---
title: "Tailwind v4: variables de @theme que no llegan al CSS"
description: "Tailwind v4 solo emite las variables de @theme que encuentra escritas en tu proyecto. Qué detecta, qué no y cuándo usar @theme static o @source."
slug: tailwind-v4-variables-theme-no-se-generan
pubDate: 2026-10-21
tags: [tailwind, css, vite]
draft: false
---

Esta regla llega intacta al CSS de producción:

```css
.widget { color: var(--color-brand); }
```

`--color-brand` está definida en el `@theme` del proyecto, pero en el CSS final no hay ninguna declaración `--color-brand: …`. El navegador trata ese `var()` como inválido en tiempo de cómputo y la propiedad se comporta como `unset`. No aparece ningún error en consola; el color simplemente se hereda del padre.

## El problema

Tailwind v4 no emite todas las variables de `@theme`: solo las que considera usadas, y definirlas no cuenta como uso. Para saber qué cuenta, se probaron nueve casos en este mismo blog (Astro 6.4, `tailwindcss` y `@tailwindcss/vite` 4.3.0). Cada variable de prueba se mencionó en un solo lugar y, después del build, se buscó su declaración en el CSS generado.

| Dónde aparece el nombre de la variable                 | ¿Se emite? |
| ------------------------------------------------------ | ---------- |
| Clase de utilidad en un `.astro` (`text-zz-utility`)   | Sí         |
| `var()` en el mismo CSS que importa Tailwind           | Sí         |
| `var()` en otro `.css` del proyecto                    | Sí         |
| `var()` en el `<style>` de un componente `.astro`      | Sí         |
| `style="color: var(--color-…)"` en el markup           | Sí         |
| String en un `<script>`: `getPropertyValue("--color-…")` | Sí       |
| Nombre armado en JS: `"--color-zz-" + tone`            | **No**     |
| `var()` en el CSS de un paquete de `node_modules`      | **No**     |
| Definida y nunca mencionada                            | No         |

El patrón es este: si el nombre completo aparece escrito en un archivo del proyecto, sea CSS, markup o JavaScript, la variable se conserva. Se pierde cuando no está escrito en ningún archivo que Tailwind revise, como pasa con los nombres armados en runtime y con el CSS que vive en `node_modules`.

El segundo caso es el más traicionero. Una librería de componentes pensada para Tailwind v4 consume tokens como `var(--color-primary)` desde su propio CSS. La regla entra al bundle, pero la variable no. Esto quedó en el CSS final de la prueba, sin ninguna declaración de `--color-zz-pkg`:

```text
.zz-widget{color:var(--color-zz-pkg);border-color:var(--color-zz-pkgstatic)}
```

## La solución

Hay tres opciones, de la más acotada a la más amplia.

### 1. `@source` para el paquete que consume tus tokens

```css
/* src/styles/global.css */
@import "tailwindcss";
@source "../../node_modules/@acme/ui";
```

La ruta es relativa al archivo CSS. En la prueba (un paquete falso en `node_modules/zz-fake-lib`), esta línea cambió el resultado de **No** a **Sí**. Ten en cuenta que `@source` registra el paquete como fuente de clases: Tailwind también generará las utilidades que encuentre ahí.

### 2. `@theme static` para tokens que se consumen en runtime

```css
/* src/styles/global.css */
@theme static {
  --color-pp-bg: #0a0a0c;
  --color-pp-surface: #16181d;
  --color-pp-border: #272a33;
  --color-pp-text: #f1f5f9;
  --color-pp-amber: #f59e0b;
  --color-pp-cyan: #38bdf8;
}
```

`static` emite todas las variables del bloque, se usen o no: en la prueba, una variable declarada en un bloque `static` y sin ninguna mención en el proyecto llegó igual al CSS. Es la opción correcta cuando el nombre se arma en JavaScript: paletas de gráficos, temas por usuario, estados que vienen de una API.

El costo es que cada variable del bloque viaja en el CSS de todas las páginas. Para una paleta de una decena de tokens es despreciable; no conviertas todo el tema en `static`.

### 3. Escribir el nombre completo en el código

Si el nombre dinámico sale de un conjunto conocido, basta un mapa con los nombres literales, porque los strings en JavaScript sí se detectan:

```ts
// src/lib/status-color.ts
const styles = getComputedStyle(document.documentElement);

// Mal: Tailwind nunca ve "--color-status-error" completo.
export const statusColorDynamic = (status: 'ok' | 'error') =>
  styles.getPropertyValue(`--color-status-${status}`);

// Bien: los nombres completos están escritos en el código.
const statusVar = {
  ok: '--color-status-ok',
  error: '--color-status-error',
} as const;

export const statusColor = (status: keyof typeof statusVar) =>
  styles.getPropertyValue(statusVar[status]);
```

## Troubleshooting

### Cómo comprobar si una variable llegó al build

```bash
pnpm build
grep -o -- "--color-brand:[^;]*" dist/client/_astro/*.css
```

Con el adapter de Node de Astro los assets quedan en `dist/client/_astro/`; en un sitio estático sin adapter, en `dist/_astro/`. Si `grep` no imprime nada, la variable no existe en producción, aunque haya reglas que la usen.

Para reproducir la tabla completa: define una variable con un valor distinto por caso (`--color-zz-utility: #a00001`, `--color-zz-js: #a00002`…), menciónala en un solo lugar, haz el build y recórrelas:

```bash
for t in utility globalcss blogcss astrostyle inlinestyle js dyn pkg unused; do
  if grep -qh -- "--color-zz-$t:" dist/client/_astro/*.css; then
    echo "$t: sí"
  else
    echo "$t: no"
  fi
done
```

### ¿Hace falta `static` para usar `var()` en un `.css` propio?

No. Es la fila "otro `.css` del proyecto" de la tabla. Este blog declaró su paleta con `@theme static` asumiendo lo contrario, y la prueba lo desmintió. Lo dejamos como garantía barata, once variables, por si algún token termina consumiéndose con un nombre dinámico.

### La regla está en el bundle, pero el estilo no se aplica

Busca la declaración de la variable con el `grep` de arriba. Si no aparece, revisa dónde está escrito su nombre. Si solo está en `node_modules`, usa `@source`; si se arma en runtime, usa `@theme static` o un mapa de nombres literales.
