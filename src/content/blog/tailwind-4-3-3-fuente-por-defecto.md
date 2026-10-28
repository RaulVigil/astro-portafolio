---
title: "Tailwind 4.3.3 cambió la fuente por defecto: cómo fijarla"
description: "Tailwind 4.3.3 cambió --font-sans de system-ui a fuentes por plataforma. Dónde se nota, cómo volver a la lista anterior y cómo fijar tu fuente."
slug: tailwind-4-3-3-fuente-por-defecto
pubDate: 2026-10-28
tags: [tailwind, css, tipografia]
draft: false
---

Al actualizar Tailwind CSS de 4.3.2 a 4.3.3, sin tocar ningún archivo CSS, el texto puede cambiar de fuente y los tests de regresión visual empiezan a fallar. La causa está en el CSS generado: aparte del comentario con la versión, la misma página compilada con las dos versiones solo difiere en la lista de `--font-sans`, en la lista de reserva de `html` y en un selector de Firefox.

```text
<     --font-sans: ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji",
<       "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji";
---
>     --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
>       "Noto Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
>       "Segoe UI Symbol", "Noto Color Emoji";
```

## El problema

Tailwind 4.3.3 salió el 16 de julio de 2026 con el [PR #20318](https://github.com/tailwindlabs/tailwindcss/pull/20318), que cambia `ui-sans-serif, system-ui` por una lista explícita de fuentes de cada plataforma. Las [notas de la versión](https://github.com/tailwindlabs/tailwindcss/releases/tag/v4.3.3) lo listan entre los arreglos: "Use explicit platform fonts instead of `system-ui` and `ui-sans-serif` so CJK text respects the page's `lang` attribute on Windows". En Windows configurado en japonés, `system-ui` carga una fuente que dibuja mal algunos caracteres e ignora el atributo `lang`. El PR cita la nota de MDN sobre `system-ui`: está pensada para imitar la interfaz del sistema, no para párrafos de texto.

El cambio toca tres lugares:

- **`--font-sans`** en el tema por defecto, que usan la clase `font-sans` y, a través de `--default-font-family`, el `font-family` de `html`.
- **La lista de reserva de Preflight** en `html`, la que se aplica si `--default-font-family` no está definida.
- **`fontFamily.sans` de `tailwindcss/defaultTheme`**, el tema en JavaScript que se usa con `tailwind.config.js`.

Que la fuente cambie en pantalla depende de qué resolvía `system-ui` antes en cada sistema y qué fuente de la lista nueva encuentra ahora. Para medirlo, se compiló la misma página con `@tailwindcss/cli` 4.3.2 y 4.3.3 y se abrió en Chrome 156 en Windows 11 en español. La fuente usada de verdad se leyó con el protocolo de DevTools (`CSS.getPlatformFontsForNode`):

| Texto | Tailwind 4.3.2 | Tailwind 4.3.3 |
| --- | --- | --- |
| Español | Segoe UI | Segoe UI |
| Japonés (`lang="ja"`) | Yu Gothic | Yu Gothic |
| Chino (`lang="zh-CN"`) | Microsoft YaHei | Microsoft YaHei |
| Coreano (`lang="ko"`) | Malgun Gothic | Malgun Gothic |

En Windows en español, el resultado es idéntico. Los cambios visibles vienen de otros entornos: en el [issue #20348](https://github.com/tailwindlabs/tailwindcss/issues/20348) hay reportes de capturas que cambiaron en GitHub Actions con Ubuntu 24.04 y de tests de regresión visual que detectaron diferencias en párrafos con la configuración por defecto. La prueba no cubrió Linux ni macOS.

Las salidas obvias tienen un costo:

- **Volver a 4.3.2** recupera la fuente, pero también pierde los demás arreglos de 4.3.3. Por ejemplo, `--spacing(0)` vuelve a compilarse como `0` en lugar de `0px` dentro de `calc()`.
- **Redefinir solo `--default-font-family`** cambia el texto de `html`, pero la clase `font-sans` sigue con la lista nueva (ver Troubleshooting).

## La solución

Hay tres opciones. La primera es aceptar la lista nueva y regenerar las capturas de referencia. La segunda, redefinir `--font-sans` con la lista de 4.3.2. La tercera, cargar tu propia fuente para que el resultado no dependa del sistema operativo; es la que recomiendan los mantenedores en el issue si necesitas la misma fuente en todas las plataformas.

### 1. Comprueba qué lista genera tu build

Primero, la versión instalada:

```bash
npm ls tailwindcss
```

```text
tw4.3.3@1.0.0 <proyecto>
+-- @tailwindcss/cli@4.3.3
| +-- @tailwindcss/node@4.3.3
| | `-- tailwindcss@4.3.3 deduped
| `-- tailwindcss@4.3.3 deduped
`-- tailwindcss@4.3.3
```

Después, la lista que llegó al CSS compilado. La variable ocupa varias líneas, por eso el `-A2`. Cambia `dist/*.css` por la carpeta de salida de tu proyecto:

```bash
grep -A2 -- "--font-sans:" dist/*.css
```

```text
    --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
      "Noto Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji",
      "Segoe UI Symbol", "Noto Color Emoji";
```

Si empieza con `-apple-system`, el proyecto ya usa la lista de 4.3.3. En el navegador, la pestaña **Computed** de DevTools muestra la `font-family` de `html` y, al final del panel, la fuente que se dibujó de verdad (**Rendered Fonts**).

### 2. Si quieres la fuente anterior, redefine --font-sans en @theme

```css
/* src/styles/global.css */
@import "tailwindcss";

@theme {
  --font-sans:
    ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol",
    "Noto Color Emoji";
}
```

Con este bloque en 4.3.3, la `font-family` computada de `html` y de la clase `font-sans` volvió a ser exactamente la de 4.3.2:

```text
ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"
```

Ten en cuenta que esto devuelve también el problema que 4.3.3 corrigió: si tu sitio tiene páginas en japonés que se ven en Windows, vuelven a usar `system-ui`. Si una variable de `@theme` no aparece en el CSS compilado, revisa [Tailwind v4: variables de @theme que no llegan al CSS](/blog/tailwind-v4-variables-theme-no-se-generan/).

### 3. Para que no dependa del sistema, carga tu propia fuente

`ui-sans-serif` y `system-ui` siempre dependieron del sistema, también antes de 4.3.3. Si necesitas que la página se vea igual en todas partes, sirve la fuente tú mismo y ponla primera en `--font-sans`. En la prueba se usó el archivo `inter-latin-wght-normal.woff2` del paquete `@fontsource-variable/inter`, copiado a `fonts/` junto al CSS compilado:

```css
/* src/styles/global.css */
@import "tailwindcss";

@font-face {
  font-family: "Inter Variable";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("./fonts/inter-latin-wght-normal.woff2") format("woff2");
}

@theme {
  --font-sans:
    "Inter Variable", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue",
    "Noto Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol",
    "Noto Color Emoji";
}
```

Resultado en Chrome 156:

| Texto | Fuente usada |
| --- | --- |
| Español | Inter |
| Japonés | Yu Gothic |
| Chino | Microsoft YaHei |
| Coreano | Malgun Gothic (y Inter para el espacio) |

Ese archivo solo trae caracteres latinos, así que el japonés, el chino y el coreano caen en las fuentes de la lista que va detrás de Inter. Por eso conviene dejar la lista de 4.3.3 como reserva: es la que respeta `lang` en Windows. La ruta del `url()` tiene que apuntar a donde el navegador encuentra el archivo; en la prueba, el CSS compilado y la carpeta `fonts/` estaban en el mismo directorio.

### 4. Si usas tailwind.config.js con defaultTheme

Si tu configuración en JavaScript extiende la fuente con `defaultTheme.fontFamily.sans` como reserva, la reserva también cambió:

```js
// tailwind.config.js
import defaultTheme from "tailwindcss/defaultTheme";

export default {
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter Variable", ...defaultTheme.fontFamily.sans],
      },
    },
  },
};
```

Valor de `defaultTheme.fontFamily.sans` en cada versión:

```text
4.3.2 ["ui-sans-serif","system-ui","sans-serif","\"Apple Color Emoji\"","\"Segoe UI Emoji\"","\"Segoe UI Symbol\"","\"Noto Color Emoji\""]
4.3.3 ["-apple-system","BlinkMacSystemFont","\"Segoe UI\"","Roboto","\"Helvetica Neue\"","\"Noto Sans\"","Arial","sans-serif","\"Apple Color Emoji\"","\"Segoe UI Emoji\"","\"Segoe UI Symbol\"","\"Noto Color Emoji\""]
```

Si necesitas la reserva anterior, escribe la lista a mano en lugar de expandir `defaultTheme`.

## Troubleshooting

### El CSS compilado sigue mostrando `-apple-system` en el `font-family` de `html`

Después de redefinir `--font-sans`, el CSS compilado con 4.3.3 sigue teniendo esta línea en Preflight:

```text
font-family: var(--default-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji");
```

Es la reserva de `var()`, y solo se usa si `--default-font-family` no está definida. Tailwind la define como `var(--font-sans)`, así que gana tu valor: en la prueba, la `font-family` computada de `html` fue la lista de 4.3.2. Revísalo en la pestaña **Computed**, no en el CSS compilado.

### Cambié `--default-font-family` y la clase `font-sans` sigue con la lista nueva

Con `--default-font-family: ui-sans-serif, system-ui, sans-serif;` en `@theme`, la `font-family` computada fue:

```text
html:       ui-sans-serif, system-ui, sans-serif
.font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "Noto Sans", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"
```

`--default-font-family` solo afecta a `html`; la clase `font-sans` lee `--font-sans` directamente. Redefine `--font-sans` (paso 2) y las dos quedan iguales.

### En mi máquina se ve igual, pero las capturas del CI cambiaron

Es lo esperable si desarrollas en Windows en español y el CI corre en Linux: en la prueba, Windows usó la misma fuente con las dos versiones, y los reportes de cambios visibles del issue vienen de Ubuntu en GitHub Actions. Revisa la fuente usada dentro del entorno del CI, no en tu máquina. Para quedarte con la nueva, regenera las capturas de referencia; para conservar las anteriores, aplica el paso 2 o el 3.

### Volver a Tailwind 4.3.2

Funciona, pero fija todos los paquetes de Tailwind a la misma versión exacta, por ejemplo `tailwindcss` y `@tailwindcss/vite` en `4.3.2` sin `^`. Con `^4.3.2`, la siguiente instalación sin lockfile vuelve a traer 4.3.3. Además pierdes los otros arreglos de esa versión, entre ellos `--spacing(0)` como `0px` ([#20319](https://github.com/tailwindlabs/tailwindcss/pull/20319)) y el selector `:-moz-focusring:where(:not(iframe))` de Preflight, que dejó de pisar el contorno de foco nativo de los `iframe` en Firefox ([#20292](https://github.com/tailwindlabs/tailwindcss/pull/20292)). Redefinir `--font-sans` (paso 2) da el mismo resultado visual sin quedarte atrás.

## Referencias

- [tailwindlabs/tailwindcss#20318](https://github.com/tailwindlabs/tailwindcss/pull/20318): el cambio de la lista de fuentes y su motivo.
- [tailwindlabs/tailwindcss#20348](https://github.com/tailwindlabs/tailwindcss/issues/20348): los reportes de capturas que cambiaron y la respuesta de los mantenedores.
- [Notas de Tailwind CSS v4.3.3](https://github.com/tailwindlabs/tailwindcss/releases/tag/v4.3.3).
- [MDN: `font-family`, valor `system-ui`](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/font-family#system-ui).
