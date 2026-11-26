---
title: "corepack: Cannot find matching keyid al instalar pnpm"
description: "corepack enable y luego pnpm falla con Cannot find matching keyid en Docker o CI. Qué versión de corepack lo causa y cómo actualizarla."
slug: corepack-cannot-find-matching-keyid
pubDate: 2026-12-03
tags: [pnpm, docker, node]
draft: true # programado
---

El `Dockerfile` ejecuta `corepack enable` y la primera llamada a `pnpm` se detiene con:

```text
Error: Cannot find matching keyid: {"signatures":[{"sig":"MEQCIBfxS9RKPsi46jxBHnsGYQ03mg8um110415vE6KRCzY8AiBvik66sYxJ/N…
```

La firma de pnpm es válida, pero la versión de corepack que trae tu imagen de Node no conoce la clave con que se firmó.

## El problema

Corepack descarga pnpm (o Yarn) desde el registro de npm y verifica su firma con una lista de claves públicas que lleva dentro. A principios de 2025, npm cambió sus claves de firma. Las versiones de corepack anteriores a la 0.31.0 no tienen la clave nueva y rechazan cualquier versión de pnpm publicada después del cambio. Es el issue [nodejs/corepack#612](https://github.com/nodejs/corepack/issues/612), con más de 60 comentarios.

En la prueba se usó `npx corepack@<versión> pnpm@<versión> --version` con un `COREPACK_HOME` vacío para no usar la caché:

| corepack | pnpm | Resultado |
| --- | --- | --- |
| 0.29.4 | 10.2.0 | `Cannot find matching keyid` |
| 0.29.4 | 9.15.0 | `9.15.0` |
| 0.30.0 | 10.0.0 | `10.0.0` |
| 0.31.0 | 10.2.0 | `10.2.0` |

Una corepack vieja funciona con versiones antiguas de pnpm y falla con las nuevas. Por eso el error aparece de golpe en una imagen que llevaba meses sin cambios: si `packageManager` no fija la versión, corepack intenta descargar la última versión de pnpm.

Según el [changelog de Node 22](https://github.com/nodejs/node/blob/main/doc/changelogs/CHANGELOG_V22.md), Node 22.13.0 incluía corepack 0.30.0 y Node 22.14.0 (febrero de 2025) pasó a la 0.31.0. Una imagen fijada a una versión anterior, como `node:22.12-slim`, sigue trayendo la corepack vieja.

## La solución

### 1. Actualiza la imagen de Node

Usa una etiqueta que reciba actualizaciones (`node:22-slim`) o fija una versión 22.14.0 o posterior. Para ver qué corepack trae tu imagen:

```bash
docker run --rm node:22-slim corepack --version
```

Node 22.19.0, el que usa este blog en local, trae la 0.34.0.

### 2. O actualiza corepack dentro del Dockerfile

Si no puedes cambiar la versión de Node, instala una corepack reciente antes de activarla:

```dockerfile
# Dockerfile (etapa de build)
FROM node:22.12-slim AS build
RUN npm install -g corepack@latest && corepack enable
```

### 3. Fija la versión de pnpm

```json
{
  "packageManager": "pnpm@11.1.3"
}
```

Esto no arregla una corepack vieja si la versión fijada se publicó después del cambio de claves. Sí evita que la imagen cambie de versión de pnpm sin que lo decidas.

## Troubleshooting

### `COREPACK_INTEGRITY_KEYS=0` lo arregla

En la prueba, con corepack 0.29.4 y esa variable, pnpm 10.2.0 se instaló sin error. La variable desactiva la verificación de firmas: el error desaparece porque corepack deja de comprobar lo que descarga. Úsala solo para salir del paso mientras actualizas la imagen.

### Funciona en local y falla en la imagen

Tu Node local trae otra versión de corepack. Compara `corepack --version` en tu equipo y dentro del contenedor.

### Después de arreglarlo, `pnpm install` falla con el lockfile

Si ahora corepack baja una versión mayor de pnpm distinta de la tuya, el siguiente error puede ser [ERR_PNPM_OUTDATED_LOCKFILE](/blog/err-pnpm-outdated-lockfile-frozen-lockfile/) o [ERR_PNPM_IGNORED_BUILDS](/blog/err-pnpm-ignored-builds-docker/).

### Límites de esta prueba

- Se ejecutó en Windows con Node 22.19 y las versiones de corepack descargadas con `npx`, no con la corepack que trae una imagen de Node antigua. No se construyó ninguna imagen.
- La correspondencia entre versiones de Node y de corepack sale del changelog de Node, no de la prueba.
