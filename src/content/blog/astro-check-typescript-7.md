---
title: "astro check falla con TypeScript 7: causa y solución"
description: "npm i -D typescript ya instala la 7 y astro check falla con ERESOLVE o fileExists. Por qué pasa, cómo volver a TS 6 y la vía experimental con TS 7.1."
slug: astro-check-typescript-7
pubDate: 2026-10-21
tags: [astro, typescript]
draft: false
---

En un proyecto Astro con TypeScript recién instalado, `npm i -D @astrojs/check` se detiene así:

```text
npm error code ERESOLVE
npm error ERESOLVE unable to resolve dependency tree
npm error
npm error Found: typescript@7.0.2
npm error node_modules/typescript
npm error   dev typescript@"^7.0.2" from the root project
npm error
npm error Could not resolve dependency:
npm error peer typescript@"^5.0.0 || ^6.0.0" from @astrojs/check@0.9.12
npm error node_modules/@astrojs/check
npm error   dev @astrojs/check@"*" from the root project
```

Desde el 8 de julio de 2026, `npm i -D typescript` sin versión instala TypeScript 7, y `astro check` todavía no funciona con él. Si fuerzas la instalación, el error cambia según la versión de Astro, pero la causa y el arreglo son los mismos.

## El problema

TypeScript 7 es el compilador nativo. La versión 7.0 no incluye la API de JavaScript que usan las herramientas que integran TypeScript en otros formatos de archivo. `astro check` es una de ellas: `@astrojs/language-server` está construido sobre Volar y carga el compilador con `require('typescript')` para analizar los `.astro`.

En `typescript@7.0.2`, la entrada `"."` del paquete apunta a `./lib/version.cjs`. Ese `require` ya no devuelve el compilador:

```bash
node -e "console.log(Object.keys(require('typescript')))"
```

```text
[ 'version', 'versionMajorMinor' ]
```

El [anuncio de TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) lo dice sin rodeos: *"Projects using Vue, MDX, Astro, Svelte, and others will need to continue using TypeScript 6.0 for now."* Por eso `@astrojs/check`, incluida la 0.9.12 publicada el 21 de octubre, declara `typescript: "^5.0.0 || ^6.0.0"` como peer dependency.

La salida que sugiere npm (`--force` o `--legacy-peer-deps`) instala los paquetes, pero `astro check` falla igual. Al reproducirlo con Node 24.22.1 y npm 11.19.1 en Windows 11, cada combinación dio un mensaje distinto:

| Combinación probada | Qué aparece |
| --- | --- |
| npm, `@astrojs/check` después de TS 7 | `ERESOLVE unable to resolve dependency tree` |
| pnpm 11.1 | `[WARN] Issues with peer dependencies found` y la instalación continúa |
| Astro 7.4.2 | `astro check does not currently support TypeScript 7.0` |
| Astro 7.3.3 o 6.4.4 con `@astrojs/language-server` 2.17.3 | `The TypeScript module loaded (found 7.0.2) does not expose the programmatic API…` |
| Astro 7.0.5 con `@astrojs/language-server` 2.16.11 | `Cannot read properties of undefined (reading 'fileExists')` |

Astro 7.3.4 añadió una comprobación de versión antes de cargar `@astrojs/check` ([PR #18053](https://github.com/withastro/astro/pull/18053)). Hasta entonces, el error salía del language-server, y su versión depende del lockfile, no de Astro: con un lockfile anterior al 13 de julio aparece el `fileExists`. Astro 6 no recibió ese cambio: la última 6.x (6.4.8) es de junio.

## La solución

Fijar TypeScript en la 6.x hasta que `astro check` soporte la 7. Si quieres probar TypeScript 7 de todas formas, el paso 4 explica la vía experimental con la 7.1 beta.

### 1. Confirma qué versión instaló npm

```bash
npm ls typescript
```

Si forzaste la instalación, npm marca TypeScript como `invalid`:

```text
+-- @astrojs/check@0.9.9
| +-- @astrojs/language-server@2.17.3
| | `-- @volar/kit@2.4.28
| |   `-- typescript@7.0.2 deduped invalid: "^5.0.0 || ^6.0.0" from node_modules/@astrojs/check
| `-- typescript@7.0.2 deduped invalid: "^5.0.0 || ^6.0.0" from node_modules/@astrojs/check
`-- typescript@7.0.2 invalid: "^5.0.0 || ^6.0.0" from node_modules/@astrojs/check

npm error code ELSPROBLEMS
```

Con pnpm, el equivalente es `pnpm peers check`:

```text
Issues with peer dependencies found

✕ unmet peer typescript
  Installed: 7.0.2
  Wanted:
    "^5.0.0 || ^6.0.0":
      @astrojs/check@0.9.11
```

### 2. Instala TypeScript 6

```bash
npm i -D typescript@^6 @astrojs/check
```

Con pnpm:

```bash
pnpm add -D typescript@^6 @astrojs/check
```

En la prueba se instaló la 6.0.3, sin flags ni avisos de peer dependencies. En `package.json` queda `"typescript": "^6.0.3"`: el `^` mantiene las actualizaciones dentro de la 6.x, así que `npm update` no vuelve a subir a la 7. Si usas Renovate o Dependabot, también te propondrán la 7: limita esa actualización hasta que tu verificación de tipos la soporte.

Si en algún momento instalaste con `--legacy-peer-deps`, o tienes `legacy-peer-deps=true` en `.npmrc`, revisa el primer caso del Troubleshooting antes de seguir.

### 3. Comprueba que `astro check` detecta errores

Un componente con una prop tipada:

```astro
---
// src/components/Saludo.astro
interface Props {
  nombre: string;
}
const { nombre } = Astro.props;
---
<p>Hola, {nombre}</p>
```

Y una página que le pasa un número:

```astro
---
// src/pages/index.astro
import Saludo from '../components/Saludo.astro';
---
<html lang="es">
  <body>
    <Saludo nombre={42} />
  </body>
</html>
```

```bash
npx astro check
```

```text
src/pages/index.astro:6:13 - error ts(2322): Type 'number' is not assignable to type 'string'.

6     <Saludo nombre={42} />
              ~~~~~~

Result (4 files):
- 1 error
- 0 warnings
- 0 hints
```

El comando termina con código de salida 1 cuando hay errores y con 0 cuando no los hay, así que sirve como paso de CI. Para el editor, el anuncio de TypeScript 7.0 indica que en VS Code el comando **Disable TypeScript 7 Language Server** de la paleta vuelve a TypeScript 6.0. Ese paso no forma parte de esta reproducción.

### 4. Opcional: TypeScript 7.1 beta con `@astrojs/ts-content-mapper`

La [7.1 beta](https://devblogs.microsoft.com/typescript/announcing-typescript-7-1-beta/), publicada el 20 de octubre de 2026, introduce los *content mappers*: paquetes que traducen otros formatos de archivo para que `tsc` los compruebe directamente. Astro publica uno para `.astro`. Con él, `tsc` reemplaza a `astro check`.

Es una beta: para la CI de producción, TypeScript 6 sigue siendo la opción estable. Para probarlo, quita `@astrojs/check`, que no acepta la 7, e instala la beta con el content mapper:

```bash
npm uninstall @astrojs/check
npm i -D typescript@7.1.0-beta @astrojs/ts-content-mapper
```

Registra el content mapper en `tsconfig.json`:

```jsonc
// tsconfig.json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "contentMappers": [
    {
      "package": "@astrojs/ts-content-mapper",
      "extensions": [".astro"]
    }
  ]
}
```

`astro check` ejecutaba `astro sync` antes de comprobar (está en `astro/dist/cli/check/index.js`). `tsc` no sabe nada de Astro, así que el script tiene que encadenarlo. `astro sync` genera `.astro/types.d.ts`, con los tipos de `astro:content` y de colecciones como las que se configuran en [Content Collections con Astro 6](/blog/astro-6-content-collections-migracion/).

```bash
npm pkg set scripts.check="astro sync && tsc --noEmit --runExternalCode"
npm run check
```

El comando `npm pkg set` funciona igual en bash y en PowerShell. Con la misma página de prueba, `tsc` encuentra el mismo error dentro del `.astro`:

```text
src/pages/index.astro(6,13): error TS2322: Type 'number' is not assignable to type 'string'.
```

El flag `--runExternalCode` es obligatorio porque un content mapper ejecuta código de `node_modules` durante la compilación. Según el anuncio de la 7.1 beta, en VS Code además hace falta confiar en el workspace y conceder permiso a los content mappers, y se pueden desactivar con el ajuste `js/ts.contentMappers.enabled`.

## Troubleshooting

### `To continue, Astro requires the following dependency to be installed: @astrojs/check.` con `@astrojs/check` ya instalado

```text
To continue, Astro requires the following dependency to be installed: @astrojs/check.

  Astro will run the following command:
  If you skip this step, you can always run it yourself later
╭────────────────────────────────────╮
│  npm i @astrojs/check typescript   │
╰────────────────────────────────────╯
◆  Continue?
● Yes / ○ No
```

Aparece aunque ya hayas vuelto a TypeScript 6, si la instalación se hizo con `--legacy-peer-deps` o con `legacy-peer-deps=true` en `.npmrc`. Ese modo no instala las peer dependencies. `@astrojs/language-server` depende de `@astrojs/astro2tsx`, que usa `@napi-rs/wasm-runtime`, y este declara `@emnapi/runtime` como peer. Sin ella, importar `@astrojs/check` falla. Astro intenta importar el paquete y trata cualquier fallo como "no instalado":

```js
// node_modules/astro/dist/cli/install-package.js (fragmento, Astro 7.4.2)
export async function getPackage(packageName, logger, options, otherDeps = []) {
	try {
		const resolved = require.resolve(packageName, { paths: [options.cwd ?? process.cwd()] });
		const packageImport = await import(pathToFileURL(resolved).href);
		return packageImport;
	} catch {
		if (options.optional) return undefined;
		// …
```

Para ver el error real que se traga ese `catch`:

```bash
node --input-type=module -e "await import('@astrojs/check')"
```

```text
Error [ERR_MODULE_NOT_FOUND]: Cannot find package '@emnapi/runtime' imported from …\node_modules\@napi-rs\wasm-runtime\runtime.js
```

No aceptes la instalación que propone: `npm i @astrojs/check typescript` instala `typescript` sin versión, es decir, la 7. Borra la línea `legacy-peer-deps=true` de `.npmrc` y ejecuta `npm i`. npm añade la peer que falta y `astro check` vuelve a funcionar.

### `Cannot read properties of undefined (reading 'fileExists')`

```text
Cannot read properties of undefined (reading 'fileExists')
  Location:
    …\node_modules\@astrojs\language-server\dist\check.js:162:73
  Stack trace:
    at AstroCheck.getTsconfig (…\node_modules\@astrojs\language-server\dist\check.js:162:73)
    at new AstroCheck (…\node_modules\@astrojs\language-server\dist\check.js:58:14)
```

Aparece con `@astrojs/language-server` 2.16.11 o anterior y TypeScript 7. En la línea 121, el language-server carga `require('typescript')`; en la 162 lee `this.ts.sys.fileExists`. Con TypeScript 7.0.2, ese objeto solo tiene `version` y `versionMajorMinor`, así que `sys` es `undefined`. La versión 2.16.12 reemplazó el fallo por un mensaje explicativo ([PR #17345](https://github.com/withastro/astro/pull/17345)). El arreglo es el paso 2.

### `The TypeScript module loaded (found 7.0.2) does not expose the programmatic API…`

```text
The TypeScript module loaded (found 7.0.2) does not expose the programmatic API that `astro check` relies on. TypeScript's native compiler (7.0 and later) does not ship this API yet. Until it does, run `astro check` with a TypeScript version that still provides it (6.x). See https://github.com/withastro/roadmap/discussions/1321 to track support.
  Location:
    …\node_modules\@astrojs\language-server\dist\check.js:200:19
```

Es el mismo problema que el anterior, detectado por las versiones recientes de `@astrojs/language-server` (en la prueba, la 2.17.3). Sale con Astro 6.4 y con Astro 7 anterior a la 7.3.4, que todavía no comprueban la versión de TypeScript por su cuenta. El arreglo es el paso 2.

### `astro check does not currently support TypeScript 7.0`

```text
[ERROR] [check] astro check does not currently support TypeScript 7.0. To continue using astro check, install TypeScript 6 instead.

astro check will be deprecated in a future Astro release. Experimental support for type-checking Astro files with TypeScript 7.1+ is available through @astrojs/ts-content-mapper. See its README for setup instructions:
https://github.com/withastro/astro/tree/main/packages/language-tools/ts-content-mapper#usage
```

Es el mensaje de Astro 7.3.4 o posterior. Astro lee la versión de `typescript` antes de cargar `@astrojs/check` y se detiene si es la 7 o superior. Las opciones son el paso 2 o el paso 4.

### pnpm instala TypeScript 7 sin fallar

pnpm 11.1 no detiene la instalación por un conflicto de peer dependencies: muestra `[WARN] Issues with peer dependencies found. Run "pnpm peers check" to list them.` y deja TypeScript 7.0.2 en `node_modules`. El fallo aparece después, en `pnpm astro check`. Se arregla con `pnpm add -D typescript@^6`. Después, `pnpm peers check` responde `No peer dependency issues found`.

### `error TS18068: Content mappers require the '--runExternalCode' command line flag to be enabled.`

`tsconfig.json` tiene `contentMappers`, pero `tsc` se ejecutó sin `--runExternalCode`. TypeScript exige ese flag para ejecutar código de terceros durante la compilación. Añádelo al script, como en el paso 4.

### `error TS5023: Unknown compiler option '--runExternalCode'.`

`tsc` es de la versión 7.0, que no conoce los content mappers. Hacen falta TypeScript 7.1 o posterior: `npm i -D typescript@7.1.0-beta`, o la versión estable cuando se publique.

## Referencias

- [withastro/astro#17268](https://github.com/withastro/astro/issues/17268): issue de seguimiento de `astro check` con TypeScript 7.
- [Announcing TypeScript 7.0](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/) y [Announcing TypeScript 7.1 Beta](https://devblogs.microsoft.com/typescript/announcing-typescript-7-1-beta/).
- [README de `@astrojs/ts-content-mapper`](https://github.com/withastro/astro/tree/main/packages/language-tools/ts-content-mapper#usage).
