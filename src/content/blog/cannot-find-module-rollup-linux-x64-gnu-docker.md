---
title: "Cannot find module @rollup/rollup-linux-x64-gnu en Docker"
description: "El build de Vite o Astro funciona en Windows y falla dentro de la imagen. Rollup busca un binario de otra plataforma. Causas y arreglo."
slug: cannot-find-module-rollup-linux-x64-gnu-docker
pubDate: 2026-12-01
tags: [docker, vite, npm]
draft: true # programado
---

El build funciona en tu equipo, pero dentro de `docker build` Vite (o Astro, que usa Vite) se detiene con:

```text
Error: Cannot find module @rollup/rollup-linux-x64-gnu. npm has a bug related to optional dependencies (https://github.com/npm/cli/issues/4828). Please try `npm i` again after removing both package-lock.json and node_modules directory.
```

Rollup busca el binario nativo de Linux y en ese `node_modules` no está. Lo normal es que ese `node_modules` venga de Windows o de macOS.

## El problema

Desde la versión 4, Rollup usa un binario nativo y publica uno por plataforma como dependencia opcional: `@rollup/rollup-win32-x64-msvc`, `@rollup/rollup-linux-x64-gnu`, `@rollup/rollup-linux-x64-musl`, etc. El gestor de paquetes instala solo el de la plataforma donde corre `install`. Al cargarse, `rollup/dist/native.js` elige el nombre según `process.platform`, `process.arch` y, en Linux, si la libc es glibc (`gnu`) o musl.

En la prueba, `npm i rollup@4` en Windows instaló la 4.68.8 con dos binarios:

```text
rollup-win32-x64-gnu
rollup-win32-x64-msvc
```

Al borrar `@rollup/rollup-win32-x64-msvc` y cargar Rollup, salió el mismo error con el nombre de Windows:

```text
Error: Cannot find module @rollup/rollup-win32-x64-msvc. npm has a bug related to optional dependencies (https://github.com/npm/cli/issues/4828). Please try `npm i` again after removing both package-lock.json and node_modules directory.
```

Dentro de una imagen `node:22-slim` (Debian, glibc, x64), el nombre que busca es `@rollup/rollup-linux-x64-gnu`. Con una imagen Alpine sería `@rollup/rollup-linux-x64-musl`.

El mensaje culpa a npm, pero en Docker suele haber otra causa. Hay dos:

1. **Un `node_modules` de Windows dentro de la imagen.** Si el `Dockerfile` hace `COPY . .` y no hay `.dockerignore`, tu carpeta local sobrescribe la que instaló el contenedor. Esa carpeta trae los binarios `win32` y ninguno de Linux.
2. **Un `package-lock.json` incompleto.** Es el bug que cita el mensaje, [npm/cli#4828](https://github.com/npm/cli/issues/4828): al regenerar el lockfile con `node_modules` ya presente, npm podía dejar fuera las dependencias opcionales de otras plataformas. El issue se cerró en abril de 2025, pero un lockfile generado antes puede seguir así en tu repo.

## La solución

### 1. Excluye `node_modules` del contexto de build

```text
# .dockerignore
node_modules
dist
.env
.git
```

Con esto, `COPY . .` no pisa lo que instaló la imagen. También acelera el build, porque Docker deja de enviar `node_modules` como contexto.

### 2. Instala dentro de la imagen, antes de copiar el código

```dockerfile
# Dockerfile (etapa de build)
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build
```

`npm ci` corre en Linux e instala el binario de Linux. Con pnpm es igual, con `pnpm install --frozen-lockfile` y copiando también `pnpm-lock.yaml` y `pnpm-workspace.yaml`.

### 3. Si el lockfile es el problema, regenéralo

Si con `.dockerignore` el error sigue, busca en el lockfile el binario que falta:

```bash
grep -c "rollup-linux-x64-gnu" package-lock.json
```

Si devuelve `0`, borra `package-lock.json` y `node_modules`, ejecuta `npm install` con un npm actual y haz commit del lockfile nuevo. Es lo que propone el propio mensaje de Rollup.

## Troubleshooting

### `Cannot find module @rollup/rollup-linux-x64-musl`

Usas una imagen Alpine. Si el lockfile se generó con una versión de npm afectada por el bug, puede faltar justo la variante `musl`. Regenera el lockfile (paso 3) o cambia a `node:22-slim`.

### `npm ci` falla antes, con `Missing` o `Invalid` en el lockfile

Es otro problema: `package.json` y `package-lock.json` no coinciden. Está en [npm ci Missing e Invalid from lock file](/blog/npm-ci-missing-invalid-lock-file/).

### Con pnpm falla en `install` con `ERR_PNPM_IGNORED_BUILDS`

No falta el binario: pnpm se niega a ejecutar scripts de instalación no aprobados. Está en [ERR_PNPM_IGNORED_BUILDS en Docker](/blog/err-pnpm-ignored-builds-docker/).

### Límites de esta prueba

- Se ejecutó en Windows, con npm y Rollup 4.68.8, borrando a mano el binario de la plataforma. No se construyó ninguna imagen de Docker.
- Los nombres de Linux (`gnu` y `musl`) salen de `rollup/dist/native.js`, no de una ejecución en Linux.
