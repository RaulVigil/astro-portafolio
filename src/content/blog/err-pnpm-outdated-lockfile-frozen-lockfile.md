---
title: "ERR_PNPM_OUTDATED_LOCKFILE: pnpm-lock.yaml desactualizado"
description: "pnpm install --frozen-lockfile falla en Docker o en CI porque package.json cambió y el lockfile no. Cómo leer el error y arreglarlo."
slug: err-pnpm-outdated-lockfile-frozen-lockfile
pubDate: 2026-12-02
tags: [pnpm, docker, node]
draft: true # programado
---

En tu equipo `pnpm install` termina bien, pero el build de Docker o el pipeline de CI se detiene en la instalación:

```text
[ERR_PNPM_OUTDATED_LOCKFILE] Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date with <ROOT>\package.json
```

`package.json` cambió y `pnpm-lock.yaml` no. En local no pasa nada porque pnpm actualiza el lockfile al instalar; con `--frozen-lockfile` no puede hacerlo y se detiene.

## El problema

`--frozen-lockfile` le dice a pnpm que instale exactamente lo que dice el lockfile y que falle si este no corresponde con `package.json`. Es lo que quieres en una imagen o en CI: que el build instale lo mismo que probaste.

En la prueba, con pnpm 11.1.3, el proyecto tenía `ms` como dependencia y un lockfile al día. Se añadió `is-number` a `package.json` sin volver a instalar:

```text
[ERR_PNPM_OUTDATED_LOCKFILE] Cannot install with "frozen-lockfile" because pnpm-lock.yaml is not up to date with <ROOT>\package.json

Note that in CI environments this setting is true by default. If you still need to run install in such cases, use "pnpm install --no-frozen-lockfile"

  Failure reason:
  specifiers in the lockfile don't match specifiers in package.json:
* 1 dependencies were added: is-number@^7.0.0
```

El comando terminó con código `1`. Lo útil está en las últimas líneas, `Failure reason`, que dicen qué dependencia no coincide.

Lo que dice la segunda línea también se cumplió: con `CI=true` y sin `--frozen-lockfile`, `pnpm install` falló con el mismo motivo. Por eso el error puede aparecer en GitHub Actions aunque el workflow no use el flag.

Las causas habituales:

- Añadiste o cambiaste una dependencia editando `package.json` a mano y no ejecutaste `pnpm install`.
- Ejecutaste `pnpm install`, pero el commit solo incluyó `package.json`.
- Un merge o un rebase resolvió el conflicto en `package.json` y dejó el lockfile de la otra rama.

## La solución

### 1. Actualiza el lockfile en local y súbelo

```bash
pnpm install
git add package.json pnpm-lock.yaml
git commit -m "chore: actualiza pnpm-lock.yaml"
```

En la prueba, después de `pnpm install`, `pnpm install --frozen-lockfile` volvió a terminar con código `0`.

### 2. No quites `--frozen-lockfile` del Dockerfile

```dockerfile
# Dockerfile (etapa de build)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
```

`--no-frozen-lockfile` hace que el build pase, pero entonces la imagen resuelve las versiones por su cuenta y puede instalar algo distinto de lo que probaste. El error está avisando de un commit incompleto. Lo correcto es arreglar ese commit.

### 3. Usa la misma versión mayor de pnpm en local y en la imagen

Si la imagen usa corepack sin versión fija, descarga la última versión de pnpm, que puede ser de otra versión mayor que la tuya. Fíjala en `package.json` para que los dos lados usen la misma:

```json
{
  "packageManager": "pnpm@11.1.3"
}
```

## Troubleshooting

### `Headless installation requires a pnpm-lock.yaml file`

En la prueba, al quitar el lockfile, `pnpm install --frozen-lockfile` falló con ese mensaje y código `1`. En Docker significa que `pnpm-lock.yaml` no llegó a la imagen: falta en el `COPY` o está en `.dockerignore`.

### El lockfile está al día y el error sigue

Busca en `Failure reason` el paquete que no coincide. Si el proyecto es un workspace, revisa que copiaste a la imagen los `package.json` de todos los paquetes y `pnpm-workspace.yaml`. Si falta este último y alguna dependencia tiene scripts de instalación, el error puede ser otro: [ERR_PNPM_IGNORED_BUILDS en Docker](/blog/err-pnpm-ignored-builds-docker/).

### Lo mismo con npm

El equivalente en npm es `npm ci` con `Missing` o `Invalid` en el lockfile: [npm ci Missing e Invalid from lock file](/blog/npm-ci-missing-invalid-lock-file/).

### Límites de esta prueba

- Se ejecutó pnpm 11.1.3 en Windows, fuera de Docker y de CI. `CI=true` se puso a mano para simular un runner.
- No se probaron otras versiones mayores de pnpm. El paso 3 es una precaución, no un error reproducido.
