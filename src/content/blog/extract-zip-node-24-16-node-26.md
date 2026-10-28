---
title: "extract-zip se cuelga en Node 24.16 y 26: causa y arreglo"
description: "extract-zip termina sin error y deja archivos a medias en Node 24.16, 24.17 y 26. Por qué pasa y cómo arreglarlo con npm, pnpm o yauzl 3."
slug: extract-zip-node-24-16-node-26
pubDate: 2026-10-27
tags: [node, extract-zip, npm, pnpm]
draft: false
---

Con Node 24.16.0, 24.17.0 o 26.x, `extract-zip@2.0.1` deja de descomprimir archivos grandes y no lanza ningún error. Si se llama con `await` en el nivel superior de un módulo ESM, Node termina con este aviso y código de salida 13:

```text
Warning: Detected unsettled top-level await at file:///<proyecto>/extract.mjs:10
await extract("bundle.zip", { dir });
^
```

En CommonJS es peor: el proceso termina con código 0, sin ningún mensaje, y el archivo extraído queda incompleto. Les pasa también a las herramientas que usan `extract-zip` por dentro, como Cypress 15.15.0, `@puppeteer/browsers` 2.x o `@electron/packager` 20.0.0.

## El problema

`extract-zip` 2.0.1 es de junio de 2020 y sigue siendo su última versión. Depende de `yauzl` `^2.10.0`, publicado en 2018. Node 24.16.0 incluyó el [PR #62557](https://github.com/nodejs/node/pull/62557) ("stream: pause/resume on destroyed streams should be noop"): desde esa versión, `pause()` y `resume()` no hacen nada sobre un stream destruido. Según el análisis del [issue nodejs/node#63487](https://github.com/nodejs/node/issues/63487), el cambio dejó al descubierto un bug latente de `yauzl` 2.x. Cuando una entrada del zip es lo bastante grande para que el stream de escritura aplique *backpressure*, la lectura se pausa y nunca se reanuda. La promesa de `extract()` no se resuelve ni se rechaza.

Para reproducirlo se usó un zip con una sola entrada de 91694408 bytes (el ejecutable de Node, comprimido a 34 MB con `tar -a` de Windows), y cada versión de Node se instaló en su propia carpeta con `npm install node@<versión>`. Resultado en Windows 11:

| Node | `extract()` | Bytes en disco |
| --- | --- | --- |
| 24.15.0 | termina | 91694408 |
| 24.16.0 | nunca se resuelve | 91650377 |
| 24.17.0 | nunca se resuelve | 91650377 |
| 24.18.0 | termina | 91694408 |
| 24.22.1 | termina | 91694408 |
| 26.12.1 | nunca se resuelve | 91650377 |

En las versiones afectadas faltan los últimos 44031 bytes. Lo que pasa después depende de lo que quede vivo en el event loop:

- **ESM con `await` en el nivel superior y nada más pendiente:** el aviso `Detected unsettled top-level await` y código de salida 13.
- **CommonJS, o una función `async` que nadie espera:** código de salida 0, sin mensaje. Es la variante más peligrosa, porque un script de CI o de build la da por buena.
- **Con un handle activo** (un servidor HTTP, un navegador abierto, un `setInterval`): el proceso se queda colgado. En la prueba, con un `setInterval` vivo, Node 26.12.1 siguió esperando hasta que `timeout` lo cortó a los 30 segundos.

Node 24.18.0 revirtió el cambio solo en la línea 24 ([PR #63834](https://github.com/nodejs/node/pull/63834)). En la línea 26 sigue: según el issue, falla desde 26.1.0, y en la prueba 26.12.1, la última versión publicada, también falla. En el issue se explica que el revert es específico de la línea 24: el cambio destapó un bug de `yauzl` 2.x que ya está corregido en `yauzl` 3.3.1, y no se considera necesario revertirlo en 26.

Tampoco falla con cualquier zip. Según el issue, el disparador es el tamaño de cada entrada, no el total: una entrada de 64 MB se queda trabada y 8000 archivos pequeños que suman unos 47 MB se extraen bien. Un proyecto puede funcionar en desarrollo con zips pequeños y fallar en producción con un binario real.

Las salidas obvias no sirven:

- **Actualizar `extract-zip`:** no hay versión nueva. La 2.0.1 es la última, y el [issue #154](https://github.com/max-mapper/extract-zip/issues/154) del repositorio no tiene respuesta.
- **`try/catch` o reintentos:** no hay error que capturar. La promesa queda pendiente para siempre.
- **Volver a Node 24.15.0:** funciona, pero 24.18.0 ya lo corrige sin retroceder, y no ayuda a quien ya está en Node 26.

## La solución

En la línea 24, basta con actualizar Node a 24.18.0 o posterior. En Node 26 hay que sacar `yauzl` 2.x del proyecto: forzar `yauzl` 3.3.1 o posterior debajo de `extract-zip` con `overrides`, o reemplazar `extract-zip` por `yauzl` 3. Si `extract-zip` llega a través de una herramienta, actualiza la herramienta.

### 1. Averigua quién trae extract-zip

Con npm:

```bash
npm ls yauzl
```

```text
mi-proyecto@1.0.0 <proyecto>
`-- extract-zip@2.0.1
  `-- yauzl@2.10.0
```

Con pnpm:

```bash
pnpm why yauzl
```

```text
yauzl@2.10.0
└─┬ extract-zip@2.0.1
  └── mi-proyecto@1.0.0 (dependencies)

Found 1 version of yauzl
```

Si aparece `yauzl@2.x` debajo de `extract-zip`, el proyecto está afectado en Node 24.16.0, 24.17.0 y 26.x.

### 2. Reproduce el fallo con tu zip

Este script descomprime un zip y solo imprime el tamaño del archivo si `extract()` termina. Necesita un zip con al menos una entrada grande, de decenas de MB:

```js
// extract.mjs
import extract from "extract-zip";
import { statSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const dir = resolve("out");
rmSync(dir, { recursive: true, force: true });

console.log(`Node ${process.version}: extrayendo bundle.zip…`);
await extract("bundle.zip", { dir });
console.log("extract-zip terminó:", statSync(resolve(dir, "big.bin")).size, "bytes");
```

```bash
npm install extract-zip@2.0.1
node extract.mjs
```

En una versión afectada sale el aviso del principio. En una corregida:

```text
Node v24.18.0: extrayendo bundle.zip…
extract-zip terminó: 91694408 bytes
```

### 3. En Node 24, actualiza a 24.18.0 o posterior

Con 24.18.0 y 24.22.1, el mismo script y el mismo zip terminaron con el archivo completo. Comprueba la versión con `node -v` en el lugar donde corre el proceso: el contenedor, el runner de CI o la plataforma de hosting, no solo tu máquina.

La misma versión corrige otra regresión de Node 24 que rompía `node-fetch@2`, explicada en [node-fetch Premature close tras actualizar a Node 24.17](/blog/node-fetch-premature-close-node-24-17/). Si te quedaste en 24.16 o 24.17, actualizar resuelve las dos.

### 4. En Node 26, fuerza yauzl 3.3.1 con overrides

`extract-zip` usa `yauzl.open()`, `readEntry()` y `openReadStream()`, que siguen existiendo en `yauzl` 3, así que se le puede cambiar la dependencia sin tocar su código. Con npm, en `package.json`:

```json
{
  "dependencies": {
    "extract-zip": "2.0.1"
  },
  "overrides": {
    "extract-zip": {
      "yauzl": "^3.3.1"
    }
  }
}
```

```bash
npm install
npm ls yauzl
```

```text
fix-npm@ <proyecto>
`-- extract-zip@2.0.1 overridden
  `-- yauzl@3.4.0 overridden
```

En la prueba, `npm install` aplicó el override también en un proyecto que ya tenía `yauzl@2.10.0` en el `package-lock.json`, sin borrar el lockfile.

Con pnpm 11, el override va en `pnpm-workspace.yaml`, no en `package.json`:

```yaml
# pnpm-workspace.yaml
overrides:
  extract-zip>yauzl: ^3.3.1
```

```bash
pnpm install
pnpm why yauzl
```

```text
yauzl@3.4.0
└─┬ extract-zip@2.0.1
  └── fix-pnpm (dependencies)

Found 1 version of yauzl
```

Con el override, el script del paso 2 terminó con el archivo completo en Node 24.16.0 y 26.12.1, tanto en ESM como en CommonJS, y también en la variante con un `setInterval` vivo, que antes se colgaba. El rango tiene que empezar en 3.3.1: con `yauzl` 3.3.0, Node 26.12.1 volvió a dejar el archivo en 91650377 bytes.

### 5. O deja de usar extract-zip

Si `extract-zip` está en tu propio código, `yauzl` 3.4 ya trae una API con promesas (`openPromise()`, `eachEntry()`, `openReadStreamPromise()`) y no hace falta una capa encima:

```bash
npm install yauzl@^3.4.0
```

```js
// lib/unzip.mjs
import yauzl from "yauzl";
import { createWriteStream } from "node:fs";
import { mkdir } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pipeline } from "node:stream/promises";

export async function unzip(zipPath, destDir) {
  const root = resolve(destDir);
  // openPromise activa lazyEntries; yauzl rechaza rutas absolutas y "..".
  const zipfile = await yauzl.openPromise(zipPath);
  try {
    for await (const entry of zipfile.eachEntry()) {
      const target = join(root, entry.fileName);
      if (entry.fileName.endsWith("/")) {
        await mkdir(target, { recursive: true });
        continue;
      }
      await mkdir(dirname(target), { recursive: true });
      const readStream = await zipfile.openReadStreamPromise(entry);
      await pipeline(readStream, createWriteStream(target));
    }
  } finally {
    zipfile.close();
  }
}
```

```js
// extract.mjs
import { unzip } from "./lib/unzip.mjs";

await unzip("bundle.zip", "out");
```

En la prueba, `unzip()` extrajo el mismo zip completo en Node 24.16.0 y 26.12.1, y `cmp` confirmó que el archivo es idéntico al original. La validación de nombres la hace `yauzl`: con `decodeStrings` activado, que es el valor por defecto, rechaza entradas con rutas absolutas, segmentos `..` o barras invertidas.

Esta función no hace todo lo que hace `extract-zip`. `extract-zip` lee los permisos de cada entrada (`externalFileAttributes`), los aplica al archivo y crea los enlaces simbólicos. `unzip()` escribe todo como archivos normales con los permisos por defecto. Para zips de datos no importa. Si el zip trae ejecutables para Linux o macOS, o symlinks, usa el override del paso 4.

### 6. Si llega por una herramienta, actualízala

Las tres herramientas más mencionadas en el issue ya dejaron `extract-zip`. Según sus dependencias publicadas en npm:

| Paquete | Versión con `extract-zip` | Versión sin `extract-zip` |
| --- | --- | --- |
| `cypress` | 15.15.0 | 15.16.0 (usa `yauzl` `^3.3.1`) |
| `@puppeteer/browsers` | 2.13.0 | 3.0.4 |
| `@electron/packager` | 20.0.0 | 20.0.1 |

Si usas el paquete sin scope `electron-packager`, está deprecado desde la 17.1.2 con el mensaje "Please use @electron/packager moving forward". La API es la misma, solo cambia el nombre.

## Troubleshooting

### `Warning: Detected unsettled top-level await` al descomprimir

```text
Warning: Detected unsettled top-level await at file:///<proyecto>/extract.mjs:10
await extract("bundle.zip", { dir });
^
```

La promesa de `extract()` quedó pendiente y no había nada más en el event loop, así que Node salió con código 13. No es un problema del `await` en sí: el mismo código en CommonJS sale con 0 y en silencio. Aplica el paso 3, el 4 o el 5.

### El script termina con código 0 pero el archivo está incompleto

Es la misma traba vista desde CommonJS: la función `async` queda esperando una promesa que nunca se resuelve, el event loop se vacía y Node termina normalmente. En la prueba, el archivo quedó con 91650377 de 91694408 bytes. En Cypress o Puppeteer se nota después, cuando el binario descargado no arranca o falta el ejecutable. Revisa `npm ls yauzl` (paso 1).

### El proceso se queda colgado durante la extracción

Si hay un handle activo, como un servidor HTTP, un navegador o un timer, Node no puede salir y el proceso espera para siempre. Es lo que pasa cuando la extracción ocurre dentro de una herramienta que mantiene algo abierto. El arreglo es el mismo; un timeout solo cambia el colgado por un error.

### `[WARN] The "pnpm" field in package.json is no longer read by pnpm`

```text
[WARN] The "pnpm" field in package.json is no longer read by pnpm. The following keys were ignored: "pnpm.overrides". See https://pnpm.io/settings for the new home of each setting.
```

pnpm 11 ignora el campo `pnpm` de `package.json`. En la prueba, con `pnpm.overrides` en `package.json`, pnpm 11.1.3 mostró ese aviso y `pnpm why yauzl` siguió resolviendo `yauzl@2.10.0`. Mueve el override a `pnpm-workspace.yaml` (paso 4).

### Con el override a yauzl 3.3.0 sigue fallando

El arreglo de `yauzl` está en 3.3.1: "Fixed bugs related to interrupting streams with `destroy()`", según su historial de cambios. Con 3.3.0, Node 26.12.1 dejó el archivo incompleto igual que con 2.10.0. Usa `^3.3.1`.

### Con zips pequeños funciona y con el de producción no

El fallo depende del tamaño de cada entrada: según el issue, una entrada de 64 MB lo dispara y miles de archivos pequeños no. Si pruebas en local con un zip de unos pocos KB, no vas a ver el problema. Reprodúcelo con el zip real (paso 2).

## Referencias

- [nodejs/node#63487](https://github.com/nodejs/node/issues/63487): el reporte original, con los casos de Cypress, Puppeteer, Playwright y electron-forge.
- [nodejs/node#62557](https://github.com/nodejs/node/pull/62557): el cambio en `pause()` y `resume()` que lo destapó.
- [nodejs/node#63834](https://github.com/nodejs/node/pull/63834): el revert en la línea 24, publicado en 24.18.0.
- [Historial de cambios de yauzl](https://github.com/thejoshwolfe/yauzl#change-history): el arreglo en 3.3.1 y la API con promesas de 3.4.0.
- [max-mapper/extract-zip#154](https://github.com/max-mapper/extract-zip/issues/154): el issue abierto en `extract-zip`.
