---
title: "astro:env is missing en el build de Docker: causa y arreglo"
description: "Astro falla con EnvInvalidVariables al construir la imagen aunque la variable está en Dokploy. Cuándo se lee cada variable y cómo pasarla."
slug: astro-env-is-missing-docker-build
pubDate: 2026-11-28
tags: [astro, docker, seguridad]
draft: true # programado
---

`pnpm build` funciona en tu equipo. Dentro del `docker build`, Astro se detiene así, aunque la variable esté configurada en la plataforma de despliegue:

```text
EnvInvalidVariables: The following environment variables defined in `env.schema` are invalid:
- SITE_KEY is missing
```

La variable sí existe, pero solo cuando el contenedor arranca, y Astro la necesitó antes: mientras se construía la imagen.

## El problema

Con [`astro:env`](https://docs.astro.build/en/guides/environment-variables/#type-safe-environment-variables) defines cada variable en `env.schema`, con un `context` (`client` o `server`) y un `access` (`public` o `secret`). Lo que decide cuándo se lee no es el tipo de variable, sino dónde la usas:

- En una **página prerenderizada**, el valor se lee durante `astro build`, porque es entonces cuando se genera el HTML.
- En una ruta con `prerender = false`, un secreto `server` se lee al atender la petición.

En local, `astro build` lee tu `.env`. En Docker, el `.dockerignore` normalmente excluye `.env`, y las variables de entorno que configuras en Dokploy u otra plataforma se inyectan al **ejecutar** el contenedor, no al construirlo. Durante el `RUN pnpm run build` no existen.

La prueba usa Astro 6.4.4 y `@astrojs/node` 10.1.3, con una página prerenderizada que pinta la clave pública de reCAPTCHA y un endpoint `POST` que lee un secreto:

| Caso | Variable en el build | Resultado |
| --- | --- | --- |
| `SITE_KEY` `server`/`secret`, usada en página prerenderizada | No | Build falla: `SITE_KEY is missing` |
| La misma, con la variable en el build | Sí | Build pasa; el valor queda en el HTML |
| `SITE_KEY` `client`/`public` | No | Build falla |
| `SITE_KEY` `client`/`public` | Sí | Build pasa |
| `SECRET_KEY` `server`/`secret`, solo en endpoint SSR | No | Build pasa |

Con `client`/`public` el mensaje cambia un poco, pero la causa es la misma:

```text
[EnvInvalidVariables] [astro-env-plugin] Could not load astro:env/client (imported by src/pages/index.astro): The following environment variables defined in `env.schema` are invalid:
- SITE_KEY is missing
```

La segunda fila importa: un `secret` usado en una página prerenderizada no se protege. En la prueba, `dist/client/index.html` contenía `data-sitekey="clave-de-build"`. Ese valor queda en un HTML público.

## La solución

Separar las variables por el momento en que se leen: las que acaban en el HTML se pasan al build y se declaran públicas. Los secretos reales se quedan para el runtime.

### 1. Declara como pública la variable que va al HTML

La clave de sitio de reCAPTCHA es pública por diseño: el navegador la necesita.

```js
// astro.config.mjs
import { defineConfig, envField } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  env: {
    schema: {
      SITE_KEY: envField.string({ context: 'client', access: 'public' }),
      SECRET_KEY: envField.string({ context: 'server', access: 'secret' }),
    },
  },
});
```

```astro
---
// src/components/Contact.astro
import { SITE_KEY } from 'astro:env/client';
---
<div class="g-recaptcha" data-sitekey={SITE_KEY}></div>
```

### 2. Pásala al build con `ARG`

```dockerfile
# Dockerfile (etapa de build)
COPY . .
ARG SITE_KEY
ENV SITE_KEY=${SITE_KEY}
RUN pnpm run build
```

```bash
docker build --build-arg SITE_KEY=tu-clave-publica -t mi-sitio .
```

En Dokploy, o en la plataforma que uses, la variable tiene que ir en la configuración de argumentos de build, no solo en las variables de entorno del contenedor. En este sitio, el arreglo combinó el cambio a `client`/`public` con este `ARG`.

### 3. Deja los secretos para el runtime

`SECRET_KEY` solo se usa en el endpoint con `prerender = false`, así que el build no la necesita. En la prueba, sin ella, el build pasó. Al llamar al endpoint, el servidor respondió `500` y registró el error en ese momento:

```text
[ERROR] EnvInvalidVariables: The following environment variables defined in `env.schema` are invalid:
- SECRET_KEY is missing
```

Con la variable definida al arrancar el contenedor, respondió `200`. Configúrala como variable de entorno del servicio y no la pases por `ARG`: según la [documentación de Docker](https://docs.docker.com/build/building/secrets/), los argumentos de build pueden quedar guardados en la imagen.

## Troubleshooting

### El build pasa pero el formulario da 500 en producción

Es la tercera situación: un secreto que solo existe en tu `.env` local. El error aparece en los logs del contenedor la primera vez que se llama al endpoint, no en el build. Añade la variable al servicio y reinícialo.

### El formulario responde 403, no 500

Ese ya no es un problema de variables. Es la comprobación de origen de Astro detrás del proxy: [Cross-site POST form submissions are forbidden en Astro](/blog/astro-cross-site-post-form-submissions-forbidden/).

### El build falla antes, en `pnpm install`

Si ves `ERR_PNPM_IGNORED_BUILDS`, falta copiar `pnpm-workspace.yaml` a la imagen: [ERR_PNPM_IGNORED_BUILDS en Docker](/blog/err-pnpm-ignored-builds-docker/).

### Quiero que la variable sea opcional en el build

`envField.string({ …, optional: true })` evita el error, pero la página se genera sin el valor. En un widget como reCAPTCHA eso solo cambia el error de sitio: el build pasa y el captcha falla en el navegador.

### Límites de esta prueba

- Se ejecutó `astro build` en Windows, quitando las variables del entorno para simular el build de Docker. No se construyó la imagen.
- No se verificó la interfaz de Dokploy para los argumentos de build.
