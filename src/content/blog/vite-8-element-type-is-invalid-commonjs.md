---
title: "Element type is invalid en Vite 8: imports de CommonJS"
description: "Tras actualizar a Vite 8, un import por defecto de CommonJS llega como objeto y React lanza Element type is invalid. Causa y tres arreglos probados."
slug: vite-8-element-type-is-invalid-commonjs
pubDate: 2026-10-29
tags: [vite, react, commonjs]
draft: false
---

Después de actualizar a Vite 8, la app de React deja de renderizar y el servidor de desarrollo muestra este error:

```text
[vite] (client) [Unhandled error] Error: Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: object.
```

En el build de producción el mensaje cambia, pero es el mismo fallo:

```text
Minified React error #130; visit https://react.dev/errors/130?args[]=object&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
```

En la prueba, el culpable fue una sola línea que con Vite 7 funcionaba: `import AddIcon from "@mui/icons-material/Add"`, con MUI v5.

## El problema

Vite 8 cambió cómo resuelve el import por defecto de un módulo CommonJS. La [guía de migración](https://github.com/vitejs/vite/blob/main/docs/guide/migration.md) lo explica en "Consistent CommonJS Interop": `import X from "paquete"` devuelve `module.exports` completo, y no `module.exports.default`, si se cumple cualquiera de estas condiciones:

- El archivo que importa es `.mjs` o `.mts`.
- El `package.json` más cercano al archivo que importa tiene `"type": "module"`.
- El módulo CommonJS no marca `module.exports.__esModule` como `true`.

Antes, en dev, las dos primeras condiciones solo contaban si el archivo que importa era una dependencia pre-empaquetada por Vite, no tu código; en el build ni siquiera se miraban. Ahora se aplican a todo, en dev y en build. Las plantillas de `create-vite` traen `"type": "module"` en su `package.json`, así que casi cualquier proyecto creado con Vite cae en la segunda condición.

`@mui/icons-material` 5.18.0 no tiene campo `exports`, y el import profundo `@mui/icons-material/Add` resuelve a `Add.js`, un archivo CommonJS generado por Babel:

```js
// node_modules/@mui/icons-material/Add.js (extracto)
Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
```

El ícono está en `exports.default`. Con Vite 7, el `__esModule: true` hacía que el import por defecto devolviera `exports.default`. Con Vite 8 y `"type": "module"`, devuelve el objeto `exports` entero, `{ default: Icono }`, y React recibe un objeto donde esperaba un componente.

La prueba usó React 19.3.1, `@mui/material` y `@mui/icons-material` 5.18.0, `@vitejs/plugin-react` 6.1.2 (5.x con Vite 7) y Chrome 156 en modo headless, con un `Button` y el ícono como única página:

| Vite | `"type": "module"` | `vite` (dev) | `vite build` |
| --- | --- | --- | --- |
| 7.3.7 | sí | funciona | funciona |
| 8.0.13 | sí | falla | no se probó |
| 8.0.14 | sí | falla | no se probó |
| 8.3.5 | sí | falla | falla (error #130) |
| 8.3.5 | no | funciona | funciona |

No es exclusivo de MUI. Le pasa a cualquier paquete CommonJS que exporte su componente en `exports.default` con `__esModule: true`. Hay reportes con la misma causa en [react-countup](https://github.com/glennreyes/react-countup/issues/884) y [react-qr-code](https://github.com/rosskhanas/react-qr-code/issues/285); esos dos no se reprodujeron en esta prueba.

Las salidas obvias no sirven:

- **`optimizeDeps.include`:** era el arreglo habitual de este mismo error en versiones viejas de Vite. En Vite 8.3.5, con `optimizeDeps: { include: ["@mui/icons-material/Add"] }`, el import siguió llegando como objeto.
- **Volver a Vite 7:** funciona, pero solo pospone la migración. Si usas Astro 7, que trae Vite 8, tampoco es una opción; ese salto ya trajo otros cambios silenciosos, como [la eliminación de los prefijos -webkit- en el build](/blog/astro-7-prefijos-webkit-css-build/).

## La solución

La salida limpia es importar la versión ESM del paquete, que no pasa por el interop de CommonJS. Si hay demasiados imports para cambiarlos ahora, Vite 8 tiene una opción temporal que restaura el comportamiento anterior.

### 1. Confirma que el import llega como objeto

Un `console.log` antes del render lo muestra:

```jsx
// src/main.jsx
import AddIcon from "@mui/icons-material/Add";

console.log("AddIcon:", typeof AddIcon, Object.keys(AddIcon).join(","));
```

Con el problema, la única clave es `default`:

```text
AddIcon: object default
```

Con el componente bien importado, las claves son las de un componente de React envuelto en `memo`:

```text
AddIcon: object $$typeof,type,compare
```

Sirve para cualquier librería: si un componente importado por defecto muestra solo `default`, es este problema.

### 2. Importa la versión ESM del paquete

`@mui/icons-material` 5.18.0 declara `"module": "./esm/index.js"` en su `package.json`. Un import con nombre desde la raíz del paquete resuelve a esa entrada ESM:

```jsx
// src/main.jsx
import { createRoot } from "react-dom/client";
import Button from "@mui/material/Button";
import { Add as AddIcon } from "@mui/icons-material";

createRoot(document.getElementById("root")).render(
  <Button variant="contained" startIcon={<AddIcon />}>Agregar</Button>
);
```

La otra opción es apuntar al archivo ESM del ícono:

```jsx
// src/main.jsx
import AddIcon from "@mui/icons-material/esm/Add";
```

Con las dos formas, Vite 8.3.5 renderizó el botón en dev y en build. El import con nombre desde `@mui/icons-material` es la API pública del paquete. La ruta `/esm/` depende de la estructura interna de la versión 5, así que úsala solo si necesitas cambiar pocas líneas.

### 3. Si no puedes cambiar los imports: legacy.inconsistentCjsInterop

```js
// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  legacy: {
    inconsistentCjsInterop: true,
  },
});
```

Con esta opción, el mismo `import AddIcon from "@mui/icons-material/Add"` volvió a funcionar en Vite 8.3.5, en dev y en build. La guía de migración la marca como deprecada y la presenta como una solución temporal: sirve para actualizar a Vite 8 hoy y cambiar los imports después. La misma guía pide reportar al autor del paquete cada caso que encuentres, con un enlace a la [explicación de Rolldown](https://rolldown.rs/in-depth/bundling-cjs#ambiguous-default-import-from-cjs-modules).

## Troubleshooting

### `Minified React error #130` solo en producción

```text
Minified React error #130; visit https://react.dev/errors/130?args[]=object&args[]= for the full message or use the non-minified dev environment for full errors and additional helpful warnings.
```

El error #130 es la versión minificada de `Element type is invalid`, y el `args[]=object` dice que React recibió un objeto. En Vite 8 el interop es el mismo en dev y en build, así que si el build falla, `vite` en dev también debería fallar. Aplica el paso 2 o el 3.

### `optimizeDeps.include` no lo arregla

Es una solución de versiones viejas de Vite, de cuando el problema venía del pre-bundling. En Vite 8 la regla depende del archivo que importa, no de si la dependencia se pre-empaqueta. En la prueba, con el paquete en `optimizeDeps.include`, el `console.log` siguió mostrando `AddIcon: object default`.

### Quitar `"type": "module"` del `package.json` también lo arregla

En la prueba funcionó en dev y en build, porque deja de cumplirse la segunda condición. Pero cambia cómo Node interpreta todos los `.js` del proyecto: sin `"type": "module"`, cualquier script `.js` con `import` que ejecutes con Node pasa a leerse como CommonJS. Es cambiar un problema de Vite por otro de Node; mejor el paso 2.

### El mismo error con otra librería que no es MUI

Haz la comprobación del paso 1 con el componente que falla. Si muestra solo `default`, busca en el `package.json` de la librería un campo `module` o un `exports` con condición `import`, e importa esa entrada. Si la librería solo publica CommonJS, usa la opción del paso 3 mientras el autor lo corrige.

## Referencias

- [Guía de migración a Vite 8](https://github.com/vitejs/vite/blob/main/docs/guide/migration.md): sección "Consistent CommonJS Interop" y la opción `legacy.inconsistentCjsInterop`.
- [Rolldown: Ambiguous `default` import from CJS modules](https://rolldown.rs/in-depth/bundling-cjs#ambiguous-default-import-from-cjs-modules): por qué el import por defecto de CommonJS es ambiguo.
- [glennreyes/react-countup#884](https://github.com/glennreyes/react-countup/issues/884) y [rosskhanas/react-qr-code#285](https://github.com/rosskhanas/react-qr-code/issues/285): el mismo problema en otras librerías.
