---
title: "npm ci Missing e Invalid from lock file: causas y arreglos"
description: "npm ci falla con Missing o Invalid aunque acabas de correr npm install. Dos causas con arreglos distintos, probados de npm 10.8 a 12.2."
slug: npm-ci-missing-invalid-lock-file
pubDate: 2026-11-04
tags: [npm, node]
draft: false
---

`npm ci` termina con `Missing: is-odd@3.0.1 from lock file` o con `Invalid: lock file's node-fetch@2.7.0 does not satisfy node-fetch@2.6.11`, aunque el `package-lock.json` acaba de salir de un `npm install` sin errores.

Detrás del mismo aviso hay dos bugs distintos, y el arreglo de uno no sirve para el otro. A esos se suma el caso normal, en el que el lockfile sí está desactualizado:

| Línea del error | Causa | ¿Actualizar npm lo arregla? | Arreglo probado |
| --- | --- | --- | --- |
| `Missing:` de algo que acabas de añadir | `package.json` cambió y el lockfile no | No hace falta | Un `npm install` |
| `Missing:` con el lockfile recién generado | Paquete con `bundleDependencies` incompleto | No, sigue en npm 12.2.1 | Repetir `npm install` o declarar la dependencia |
| `Invalid: lock file's…` | Bug de npm al resolver una `peerOptional` | Sí, desde npm 11.10.1 | `npm install --package-lock-only` |

## El problema

Los casos comparten el encabezado y solo cambia la línea final:

```text
npm error code EUSAGE
npm error
npm error `npm ci` can only install packages when your package.json and package-lock.json or npm-shrinkwrap.json are in sync. Please update your lock file with `npm install` before continuing.
npm error
npm error Missing: is-odd@3.0.1 from lock file
npm error Missing: is-number@6.0.0 from lock file
```

El mensaje pide correr `npm install`, pero ese lockfile ya salió de ahí. Borrarlo y regenerarlo con la misma versión de npm tampoco sirve: da el mismo error en los dos bugs.

### `Missing`: un paquete con `bundleDependencies` incompleto

Ocurre cuando un paquete mete una dependencia en su bundle, pero deja fuera las dependencias de esa dependencia. Este script lo reproduce en segundos y sin publicar nada:

```bash
# reproducir.sh
mkdir -p outer/node_modules/inner app

cat > outer/node_modules/inner/package.json <<'EOF'
{ "name": "inner", "version": "1.0.0", "dependencies": { "is-odd": "^3.0.1" } }
EOF
echo 'module.exports = require("is-odd");' > outer/node_modules/inner/index.js

cat > outer/package.json <<'EOF'
{ "name": "outer", "version": "1.0.0", "dependencies": { "inner": "1.0.0" }, "bundleDependencies": ["inner"] }
EOF
echo 'module.exports = require("inner");' > outer/index.js

(cd outer && npm pack --pack-destination ../app)

cd app
cat > package.json <<'EOF'
{ "name": "app", "version": "1.0.0", "private": true, "dependencies": { "outer": "file:./outer-1.0.0.tgz" } }
EOF

npm install
node -e "require('outer')"
npm ci
```

`npm install` termina con código 0, y aun así la aplicación ya está rota. Esta es la salida con npm 10.9.3 y Node 22.19 en Windows, recortada a las líneas relevantes:

```text
$ node -e "require('outer')"
Error: Cannot find module 'is-odd'

$ npm ci
npm error Missing: is-odd@3.0.1 from lock file
npm error Missing: is-number@6.0.0 from lock file
```

En Linux (Docker) `npm ci` falla igual con las ocho versiones probadas: 10.8.2, 10.9.2, 10.9.9, 11.6.2, 11.10.0, 11.10.1, 11.16.0 y 12.2.1. El caso real es el [issue #9321 de npm/cli](https://github.com/npm/cli/issues/9321), abierto al 4 de noviembre de 2026: con `@aws-amplify/data-construct`, la prueba dio entre 215 y 219 dependencias faltantes en todas las versiones hasta la 12.2.1.

La causa probable está en [`build-ideal-tree.js`](https://github.com/npm/cli/blob/latest/workspaces/arborist/lib/arborist/build-ideal-tree.js). El método `#problemEdges` empieza con el comentario "skip over any bundled deps, they're not our problem", y los paquetes con bundle se desempaquetan después, al instalar. El lockfile queda con `inner` marcado como `inBundle`, pero sin `is-odd`. Es una inferencia a partir del código, no una causa confirmada.

### `Invalid`: npm ignoraba una `peerOptional` al resolver

Se reproduce con el escenario del [PR #8981 de npm/cli](https://github.com/npm/cli/pull/8981): `addons-linter@6.13.0` y `htmlhint@1.1.4` como `devDependencies`.

En ese árbol, `addons-scanner-utils@9.3.0` declara `node-fetch` 2.6.11 exacto como dependencia peer opcional, y `htmlhint` pide `^2.6.2`. Un npm antiguo escribe 2.7.0 en el lockfile y después `npm ci` lo rechaza:

```text
npm error Invalid: lock file's node-fetch@2.7.0 does not satisfy node-fetch@2.6.11
```

Este es el resultado con lockfiles generados en Windows y `npm ci --dry-run` en Linux:

| `npm ci` con | Lock de npm 10.9.2 | Lock de npm 11.6.2 | Lock de npm 11.16.0 |
| --- | --- | --- | --- |
| 10.9.2, 10.9.9, 11.6.2, 11.10.0 | `Invalid` | `Invalid` | Pasa |
| 11.10.1, 11.16.0, 12.2.1 | Pasa | Pasa | Pasa |

El PR se [publicó en npm 11.10.1](https://github.com/npm/cli/releases/tag/v11.10.1). Lo que importa entonces es qué npm trae tu Node, según [el índice de nodejs.org](https://nodejs.org/dist/index.json):

| Node | npm incluido | ¿Trae el arreglo? |
| --- | --- | --- |
| 20.20.2 | 10.8.2 | No |
| 22.23.4 | 10.9.9 | No |
| 24.13.0 | 11.6.2 | No |
| 24.14.1 | 11.11.0 | Sí |
| 26.0.0 | 11.12.1 | Sí |

Al 4 de noviembre de 2026, ninguna versión de Node 22 trae npm 11, así que subir de versión dentro de esa línea no lo arregla.

## La solución

Lee la línea final del error y sigue el paso que le corresponde. Los arreglos no son intercambiables.

### 1. Descarta el caso normal

Si `Missing` nombra algo que acabas de añadir a `package.json`, el lockfile sí está desactualizado. Al añadir `is-even` a mano, `npm ci` da `Missing: is-even@1.0.0 from lock file` junto con sus dependencias, y un solo `npm install` lo resuelve. Haz commit del lockfile.

Para comprobar si el bundle puede ser la causa:

```bash
grep -c '"inBundle": true' package-lock.json
```

Con 0 queda descartado. Un número mayor no lo confirma, solo indica que hay paquetes con bundle.

### 2. Para `Missing` con bundle: repite `npm install`

```bash
npm install
git add package-lock.json
```

En la reproducción, el segundo `npm install` añade 21 líneas al lockfile, con `is-odd` y `is-number`. Después `npm ci` pasa y `require('outer')` carga. Borrar `node_modules` antes de repetirlo genera el mismo lockfile.

El arreglo vive solo en ese archivo: si alguien lo borra y lo regenera, el error vuelve. La alternativa es declarar la dependencia que falta:

```bash
npm install is-odd@^3.0.1
```

También funciona y aguanta una regeneración del lockfile, pero deja en tu `package.json` algo que no usas directamente. Con las más de 200 dependencias faltantes de `@aws-amplify/data-construct`, no es práctico.

### 3. Para `Invalid`: refresca el lockfile sin borrarlo

```bash
npm install --package-lock-only
git add package-lock.json
```

Sobre el lockfile de npm 10.9.2, ese comando cambió 3 líneas y dejó `node-fetch` en 2.6.11. Luego `npm ci --dry-run` pasó con npm 10.9.3. En Linux dio el mismo resultado al refrescarlo con 10.9.2, 11.10.0, 11.10.1 y 11.16.0, y un `npm ci` completo pasó con 10.9.2 y 11.10.0.

Una misma versión antigua de npm arregla el lockfile existente, pero lo genera mal si parte de cero. Por eso no conviene borrarlo.

Este cambio baja `node-fetch` de 2.7.0 a 2.6.11, y la prueba no ejecutó ninguna aplicación con esa versión: revisa que la tuya funcione. Si además ves `Premature close`, es otro problema de la misma línea, [`node-fetch@2` con Node 24.17](/blog/node-fetch-premature-close-node-24-17/).

### 4. Para `Invalid`: o usa un npm con el arreglo en CI

Con Node 24.14.1 o superior, o con Node 26, el npm incluido ya lo trae. En Node 22 hay que instalarlo aparte:

```bash
# paso previo a npm ci en tu pipeline, no ejecutado
npm install -g npm@11.16.0
npm ci
```

La prueba llamó a cada versión de npm directamente, así que este `-g` no se ejecutó.

## Troubleshooting

### `Missing` sigue apareciendo después de probar otras opciones

Estos intentos no sirvieron en la reproducción con npm 11.16.0:

| Intento | Resultado |
| --- | --- |
| Borrar `package-lock.json` y `node_modules`, y regenerar con npm 12.2.1 | `Missing` |
| Generar el lockfile con `npm install --package-lock-only` | `Missing` |
| `npm ci --legacy-peer-deps`, `--force` u `--omit=optional` | `Missing` |
| `npm ci --install-strategy=nested`, `shallow` o `linked` | `Missing` |
| `npm install` y `npm ci`, ambos con `--install-strategy=nested` o `shallow` | `Missing` |

La excepción fue usar `--install-strategy=linked` en `npm install` y también en `npm ci`: pasó sin errores, pero la prueba no comprobó que el módulo cargara. Cambia además la forma de `node_modules` en todo el proyecto.

### `Error: Cannot find module 'is-odd'` con `npm install` en verde

Es la misma causa de `Missing`, vista en ejecución y no en CI. El módulo no llega a `node_modules` en el primer `npm install`. Se arregla con el paso 2.

### pnpm no da error, pero el módulo sigue sin cargar

Con pnpm 12.16.1, `pnpm import` y `pnpm install --frozen-lockfile` terminan con código 0. Aun así, `require('outer')` sigue dando `Cannot find module 'is-odd'`. Cambiar de gestor retrasa el fallo hasta la ejecución.

### ¿Un lockfile generado en Windows rompe `npm ci` en Linux?

En esta prueba, no. Con `tailwindcss` 4.3.2 hubo 98 corridas reales de 98 sin fallos en cada sistema, con siete versiones de npm entre 10.9.2 y 12.2.1. Otras 168 corridas con `--dry-run` en Linux, sumando Vite 8, `sharp`, `wrangler` y Astro, tampoco fallaron. Los lockfiles de Windows y Linux salieron idénticos byte a byte con npm 10.9.2, 11.6.2, 11.16.0 y 12.2.1. Esto vale para esos paquetes y no descarta otros.

### `npm ci` ya pasa, pero la instalación deja archivos a medias

Es otro problema y no aparece en el lockfile. Una causa documentada en este blog es [`extract-zip` en Node 24.16 y 26](/blog/extract-zip-node-24-16-node-26/).

### Límites de esta prueba

- Repetir `npm install` se probó en la reproducción mínima, no con `@aws-amplify/data-construct`.
- El paso de `Invalid` a correcto con npm 11.10.1 o superior se midió con `--dry-run`, no con una instalación completa.
- En el caso `Invalid` no se probaron opciones como `--force` o `--legacy-peer-deps`: esa parte de la prueba se cortó antes de terminar.
- Nada se ejecutó en un proveedor de CI real. Las corridas fueron locales en Windows y en Docker con Linux.
