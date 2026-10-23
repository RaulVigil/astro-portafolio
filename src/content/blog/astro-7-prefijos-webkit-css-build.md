---
title: "Astro 7 elimina los prefijos -webkit- del CSS en el build"
description: "backdrop-blur funciona en dev y desaparece en Safari tras el build. Por qué Astro 7 elimina los prefijos -webkit- y cómo evitarlo con cssTarget."
slug: astro-7-prefijos-webkit-css-build
pubDate: 2026-10-23
tags: [astro, vite, tailwind, css]
draft: false
---

Después de `astro build`, el CSS de `dist/` ya no tiene `-webkit-backdrop-filter`, aunque el código fuente lo incluye y `astro dev` lo sirve:

```text
/* astro dev */
.glass {
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
}

/* dist/_astro/index.CXj5RmJM.css */
.glass{backdrop-filter:blur(8px)}
```

Según los datos de compatibilidad de MDN, Safari e iOS anteriores a la versión 18 solo soportan la declaración con prefijo, así que en esos navegadores el desenfoque desaparece. Lo mismo pasa con utilidades de Tailwind como `backdrop-blur-sm`. La solución es una opción en `astro.config.mjs`.

## El problema

Al reproducirlo con Astro 7.4.2, Vite 8.3.5, Tailwind 4.3.3 y Node 24.22.1, con la configuración por defecto, el build eliminó `-webkit-backdrop-filter` en tres lugares: en una regla escrita a mano, en la utilidad `backdrop-blur-sm` y en un bloque `<style>` de un componente. Pasó igual con `output: 'static'` que con `output: 'server'` y `@astrojs/node` 11.1.9. El proyecto usaba Tailwind v4 con `@tailwindcss/vite`, la misma configuración de [las variables de @theme que no llegan al CSS](/blog/tailwind-v4-variables-theme-no-se-generan/), pero Tailwind no interviene: el CSS sin Tailwind perdió el prefijo igual.

La causa son cuatro valores por defecto que se encadenan:

1. Astro configura su build de Vite con `target: "esnext"` (en `astro/dist/core/build/vite-build-config.js`), porque ese JavaScript se ejecuta en Node. En ese mismo build se minifica el CSS que llega al navegador, y Astro pasa `cssMinify: true`.
2. Vite usa `build.target` como `build.cssTarget` si no defines otro. Así lo dice la [documentación de `build.cssTarget`](https://vite.dev/config/build-options#build-csstarget): "Default: the same as build.target".
3. Con `cssMinify: true`, Vite 7 minifica con esbuild y Vite 8 con Lightning CSS. En el código de `minifyCSS()`, Vite 7 solo usa Lightning CSS si el valor es exactamente `"lightningcss"`, y Vite 8 solo usa esbuild si es exactamente `"esbuild"`. Astro 6 trae Vite 7; Astro 7 trae Vite 8.
4. Para pasarle navegadores a Lightning CSS, Vite convierte `cssTarget` con `convertTargets()`, que descarta `esnext`. Lightning CSS se queda sin navegadores objetivo.

Lo que recibe Lightning CSS depende de la versión exacta de Vite. Hasta Vite 8.2.1, `convertTargets()` devolvía un objeto vacío, `targets: {}`, y con eso Lightning CSS quita todos los prefijos. El [PR #23295 de Vite](https://github.com/vitejs/vite/pull/23295), publicado en la 8.2.2, cambió ese caso para devolver `undefined`. Sin `targets`, Lightning CSS 1.33.0 conserva los prefijos con una excepción: al llamar a su API `transform()` sin `targets`, de nueve declaraciones con prefijo solo eliminó `-webkit-backdrop-filter`.

En la prueba, el mismo proyecto dio estos resultados:

| Declaración en el código | Astro 6.4.8 (Vite 7.3.7) | Astro 7.2.0 (Vite 8.2.1) | Astro 7.4.2 (Vite 8.3.5) |
| --- | --- | --- | --- |
| `-webkit-backdrop-filter` (`.glass`, `backdrop-blur-sm`) | Se conserva | Se elimina | Se elimina |
| `-webkit-user-select` (`select-none`) | Se conserva | Se elimina | Se conserva |
| `-webkit-box-decoration-break` (`box-decoration-clone`) | Se conserva | Se elimina | Se conserva |

Según los datos de compatibilidad de MDN (`@mdn/browser-compat-data` 8.1.7), Safari soporta `backdrop-filter` sin prefijo desde la versión 18. Antes, desde la 9, solo con `-webkit-`. `user-select` sin prefijo no está en ninguna versión estable de Safari, solo en Technology Preview, y `box-decoration-break` solo existe con prefijo. Con Vite 8.2.1 o anterior, entonces, `select-none` deja de aplicarse en todos los Safari. Astro 7.4.x exige `vite@^8.3.4`, pero un proyecto que se actualizó desde una versión 7 anterior puede tener todavía una Vite vieja en el lockfile.

El problema se reportó en [withastro/astro#17647](https://github.com/withastro/astro/issues/17647) y se cerró como *not planned*. La respuesta del equipo de Astro fue que Astro no tiene un target de CSS por defecto y que cada app debe definirlo si lo necesita. Tampoco sirve la solución que parece obvia, configurar `vite.css.lightningcss.targets`: según la misma documentación de Vite, en el paso de minificación manda `build.cssTarget`.

Si llegaste aquí después de actualizar a Astro 7, es el mismo salto de versión que deja sin efecto [los plugins de remark y rehype](/blog/astro-7-plugins-remark-rehype/). Con la diferencia de que este no avisa.

## La solución

Define `vite.build.cssTarget` con los navegadores que soporta tu sitio. Así Lightning CSS recibe targets reales y conserva los prefijos que esos navegadores necesitan. `cssTarget` solo afecta al CSS: el target del JavaScript no cambia.

### 1. Comprueba si tu build está afectado

Haz el build y cuenta cuántas veces aparece cada propiedad, con prefijo y sin él:

```bash
npx astro build
grep -rhoE "(-webkit-)?(backdrop-filter|user-select|box-decoration-break):" dist --include=*.css --include=*.html --include=*.mjs | sort | uniq -c
```

En PowerShell:

```powershell
npx astro build
Get-ChildItem dist -Recurse -Include *.css,*.html,*.mjs | Select-String -Pattern "(-webkit-)?(backdrop-filter|user-select|box-decoration-break):" -AllMatches | ForEach-Object { $_.Matches.Value } | Group-Object | Select-Object Count, Name
```

Se revisan también los `.html` porque Astro inserta como `<style>` el CSS pequeño, y los `.mjs` porque con `output: 'server'` esos estilos quedan dentro de `dist/server/chunks/`. Con Astro 7.4.2, el proyecto de prueba dio esto:

```text
      1 -webkit-box-decoration-break:
      1 -webkit-user-select:
      2 backdrop-filter:
      1 box-decoration-break:
      1 user-select:
```

Cada propiedad debería tener su pareja con `-webkit-`. `backdrop-filter` aparece dos veces, en `.glass` y en `backdrop-blur-sm`, y `-webkit-backdrop-filter` no aparece. Si usas otras propiedades con prefijo, añádelas al patrón.

### 2. Define `vite.build.cssTarget`

```js
// astro.config.mjs
import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  vite: {
    plugins: [tailwindcss()],
    build: {
      cssTarget: ["chrome111", "edge111", "firefox114", "safari16.4", "ios16.4"],
    },
  },
});
```

La lista es la que Vite 8.3.5 usa cuando `build.target` vale `"baseline-widely-available"`, su valor por defecto: la constante `ESBUILD_BASELINE_WIDELY_AVAILABLE_TARGET` de `vite/dist/node/chunks/node.js`. Cámbiala según los navegadores que soportes. Si no usas Tailwind, el bloque `build` es el mismo, sin el plugin.

Si la lista empieza en `safari18`, Lightning CSS elimina `-webkit-backdrop-filter`, y es correcto: al llamar a su API con targets de Safari 18, el prefijo desapareció porque esa versión ya no lo necesita. La diferencia es que ahora la decisión sale de tu lista de navegadores.

### 3. Repite el build y verifica

Con `cssTarget`, el mismo comando del paso 1 devuelve cada propiedad con su pareja:

```text
      2 -webkit-backdrop-filter:
      1 -webkit-box-decoration-break:
      1 -webkit-user-select:
      2 backdrop-filter:
      1 box-decoration-break:
      1 user-select:
```

Y la regla del principio vuelve a tener las dos declaraciones:

```text
.glass{-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px)}
```

En la prueba, el arreglo funcionó igual con Vite 8.2.1, donde se habían perdido los tres prefijos, y con `output: 'server'`.

## Troubleshooting

### `[lightningcss minify] Unsupported target "baseline-widely-available"`

```text
[ERROR] [vite] ✗ Build failed in 142ms
[lightningcss minify] Unsupported target "baseline-widely-available"
```

Aparece con `cssTarget: "baseline-widely-available"`, el mismo valor que acepta `build.target`. Vite convierte ese nombre en una lista de navegadores solo para `build.target`. `cssTarget` llega tal cual a `convertTargets()`, que no lo reconoce. Usa la lista explícita del paso 2.

### `Cannot find package 'esbuild' imported from ...`

```text
[ERROR] [vite] ✗ Build failed in 144ms
Cannot find package 'esbuild' imported from <proyecto>\node_modules\vite\dist\node\chunks\node.js
```

Sale al configurar `vite.build.cssMinify: "esbuild"` para volver al minificador de Astro 6. Vite 8 no instala esbuild: es una `peerDependency` opcional (`^0.27.0 || ^0.28.0`), y la documentación de `build.cssMinify` indica instalarlo con `npm add -D esbuild`. En la prueba, con esbuild 0.28.2 instalado, el build conservó los tres prefijos. Funciona, pero añade una dependencia solo para cambiar de minificador, cuando `cssTarget` lo resuelve con el que Vite trae por defecto.

### `css.lightningcss.targets` no cambia el resultado

Con `vite.css.lightningcss.targets` definido a partir de `browserslistToTargets(browserslist("safari >= 16.4"))`, y sin `cssTarget`, el build siguió generando `.glass{backdrop-filter:blur(8px)}`. En `minifyCSS()`, Vite copia las opciones de `css.lightningcss` y después sobrescribe `targets` con el resultado de `convertTargets(config.build.cssTarget)`. Para la minificación, la opción que cuenta es `cssTarget`.

### Se pierden todos los prefijos, no solo `-webkit-backdrop-filter`

Si tu código usa esos prefijos y el comando del paso 1 no devuelve ninguna línea con `-webkit-`, tu proyecto tiene Vite 8.0.0–8.2.1. Es el caso del issue original, reportado con Astro 7.2.0 y Vite 8.2.1. Compruébalo con:

```bash
npm ls vite
```

Actualizar Vite a 8.2.2 o posterior reduce la pérdida a `-webkit-backdrop-filter`, pero no la elimina. `cssTarget` corrige los dos casos.

### En `astro dev` y en Chrome todo se ve bien

`astro dev` no minifica el CSS. En la prueba, el servidor de desarrollo sirvió `.glass` y `backdrop-blur-sm` con `-webkit-backdrop-filter`. Según MDN, Chrome (76), Edge (79) y Firefox (103) soportan `backdrop-filter` sin prefijo, así que en esos navegadores el build tampoco cambia nada visible. Para detectar el problema sin un Safari anterior a la 18, revisa `dist/` con el comando del paso 1.

## Referencias

- [withastro/astro#17647](https://github.com/withastro/astro/issues/17647): el reporte original y la respuesta del equipo de Astro.
- [vitejs/vite#23295](https://github.com/vitejs/vite/pull/23295): el cambio de `convertTargets()` en Vite 8.2.2.
- [Vite: `build.cssTarget` y `build.cssMinify`](https://vite.dev/config/build-options#build-csstarget)
- [MDN: `backdrop-filter`](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)
