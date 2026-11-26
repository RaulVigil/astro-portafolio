---
title: "ERR_PNPM_IGNORED_BUILDS en Docker: falta pnpm-workspace.yaml"
description: "pnpm install --frozen-lockfile pasa en local y falla en Docker con Ignored build scripts. La causa es un COPY incompleto y se arregla en una línea."
slug: err-pnpm-ignored-builds-docker
pubDate: 2026-11-27
tags: [pnpm, docker, node]
draft: true # programado
---

En local, `pnpm install --frozen-lockfile` termina bien. En el `docker build`, el mismo paso corta la imagen con:

```text
[ERR_PNPM_IGNORED_BUILDS] Ignored build scripts: esbuild@0.25.12

Run "pnpm approve-builds" to pick which dependencies should be allowed to run scripts.
```

El lockfile está al día y no le falta nada. Lo que falta en la imagen es otro archivo.

## El problema

Desde pnpm 10, los scripts de instalación de las dependencias (`postinstall` y similares) no se ejecutan salvo que los apruebes. La lista de paquetes aprobados se guarda en `pnpm-workspace.yaml`, no en `package.json` ni en el lockfile:

```yaml
# pnpm-workspace.yaml
allowBuilds:
  esbuild: true
  sharp: true
```

Un Dockerfile típico copia primero solo los manifiestos, para que Docker reutilice la capa de `pnpm install` mientras no cambien las dependencias:

```dockerfile
# Dockerfile (versión que falla)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
```

Dentro de la imagen no está `pnpm-workspace.yaml`, así que pnpm no sabe que `esbuild` está aprobado. `--frozen-lockfile` tampoco lo detecta, porque la sección `settings` del lockfile no guarda esa lista. En la prueba solo tenía `autoInstallPeers` y `excludeLinksFromLockfile`.

### Por qué en local funciona y en Docker no

La versión de pnpm decide si es un aviso o un error. En la prueba, un proyecto con `esbuild` 0.25.12, sin `pnpm-workspace.yaml` y con `node_modules` borrado, dio esto:

| pnpm | Sin `pnpm-workspace.yaml` | Con `allowBuilds` |
| --- | --- | --- |
| 10.33.0 | Aviso `Ignored build scripts`, código 0 | Código 0 |
| 11.1.3 | `ERR_PNPM_IGNORED_BUILDS`, código 1 | Código 0 |
| 12.23.0 | `Ignored build scripts`, código 1 | Código 0 |

Con `CI=true`, pnpm 11.1.3 dio el mismo error.

Si el Dockerfile usa `corepack enable` y `package.json` no tiene el campo `packageManager`, corepack descarga la última versión publicada de pnpm. En la prueba, con corepack 0.34.0, resolvió a la 12.23.0, que era el `latest` del registro ese día. Así, tu equipo puede tener pnpm 10, que solo avisa, mientras la imagen usa una versión que corta el build.

## La solución

Copiar `pnpm-workspace.yaml` junto con los manifiestos y fijar la versión de pnpm.

### 1. Añade `pnpm-workspace.yaml` al primer `COPY`

```dockerfile
# Dockerfile
FROM node:22-slim AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build
```

Ese cambio arregló este paso en el despliegue de este sitio en Dokploy. En la prueba local, con el archivo presente, las tres versiones de pnpm terminaron con código 0.

### 2. Comprueba que `.dockerignore` no lo excluye

```bash
grep -n "pnpm-workspace" .dockerignore
```

No debería imprimir nada. Si el archivo está excluido, el `COPY` falla porque no lo encuentra.

### 3. Fija la versión de pnpm en `package.json`

```json
{
  "packageManager": "pnpm@11.1.3"
}
```

Con el campo, corepack usa esa versión en lugar de la última. Así la imagen usa el mismo pnpm que tu equipo y una versión nueva no puede romper el build sin que cambie nada en el repo. Esta parte no se probó dentro de Docker.

## Troubleshooting

### `Cannot find module '…\pnpm\12.23.0\bin\pnpm.cjs'`

Apareció en la prueba al ejecutar `corepack pnpm --version` sin `packageManager`, con el corepack 0.34.0 de Node 22.19. Corepack descargó pnpm 12.23.0, pero no encontró el archivo que esperaba para arrancarlo. Con `"packageManager": "pnpm@11.1.3"` en `package.json`, el mismo corepack arrancó pnpm 11.1.3 sin errores.

### Qué paquetes aprobar

Los que aparezcan en `Ignored build scripts`. Según la documentación de pnpm, `pnpm approve-builds` los lista y guarda tu elección en `pnpm-workspace.yaml` (no se ejecutó aquí). Después de aprobarlos, haz commit del archivo.

### Con npm el error es otro

Si la imagen usa `npm ci` y falla con `Missing: … from lock file`, la causa no tiene nada que ver con scripts aprobados. Está en [npm ci falla con Missing o Invalid from lock file](/blog/npm-ci-missing-invalid-lock-file/).

### La imagen se construye pero el formulario da 403

Ya es un problema de ejecución detrás del proxy, no de la instalación. Se explica en [Cross-site POST form submissions are forbidden en Astro](/blog/astro-cross-site-post-form-submissions-forbidden/).

### Límites de esta prueba

- Se probó en Windows con un proyecto mínimo (`esbuild` 0.25.12), sin ejecutar `docker build`. Lo único que viene del despliegue real es el arreglo del `COPY`.
- No se probó qué hace la imagen `node:22-slim` con corepack y pnpm 12.
