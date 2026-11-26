---
title: "Astro en Docker da 502 Bad Gateway: falta HOST=0.0.0.0"
description: "El contenedor de Astro arranca, el log dice listening y el proxy responde 502. El servidor de @astrojs/node escucha solo en localhost por defecto."
slug: astro-node-docker-502-bad-gateway-host
pubDate: 2026-11-29
tags: [astro, docker, node]
draft: true # programado
---

El contenedor está en verde y el log de Astro dice:

```text
[@astrojs/node] Server listening on http://localhost:4321
```

Aun así, Traefik, Nginx o el proxy de tu plataforma responde `502 Bad Gateway`. El servidor funciona, pero solo acepta conexiones desde dentro del propio contenedor.

## El problema

En modo `standalone`, `@astrojs/node` decide dónde escuchar con esta línea (versión 10.1.3):

```js
// node_modules/@astrojs/node/dist/standalone.js (extracto)
const host = process.env.HOST ?? hostOptions(options.host);
```

`options.host` sale de `server.host` en `astro.config.mjs`. Si no lo defines, vale `false`, y `hostOptions(false)` devuelve `"localhost"`. Dentro de un contenedor, `localhost` es la interfaz de loopback del contenedor. El proxy se conecta a la IP de la red de Docker, donde nadie escucha, y responde 502.

En la prueba, con Astro 6.4.4 y Node 22.19 en Windows, se arrancó `node dist/server/entry.mjs` con y sin `HOST`, y se probaron tres direcciones:

| `HOST` | Escucha en | `127.0.0.1` | `[::1]` | IP de la red local |
| --- | --- | --- | --- | --- |
| Sin definir | `[::1]:4398` | Falla | 200 | `Could not connect to server` |
| `0.0.0.0` | `0.0.0.0:4398` | 200 | Falla | 200 |

Sin `HOST`, el servidor ni siquiera respondió en `127.0.0.1`: `localhost` se resolvió a IPv6 (`::1`). Un healthcheck con `curl http://127.0.0.1:4321` también fallaría en ese caso. En Linux, la dirección depende de cómo resuelva `localhost` el `/etc/hosts` de la imagen. En la prueba no se ejecutó dentro de Docker.

El log ya lo avisa. Sin `HOST`, muestra una sola línea con `localhost`. Con `0.0.0.0`, muestra dos:

```text
[@astrojs/node] Server listening on
  local: http://localhost:4398
  network: http://192.168.1.61:4398
```

## La solución

Que el servidor escuche en todas las interfaces del contenedor.

### 1. Define `HOST` en el Dockerfile

```dockerfile
# Dockerfile (etapa final)
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=4321

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

EXPOSE 4321
CMD ["node", "./dist/server/entry.mjs"]
```

`HOST` se lee al arrancar, así que también puedes definirlo en las variables de entorno del servicio sin reconstruir la imagen. Este sitio lo define en el Dockerfile.

### 2. O fíjalo en la configuración de Astro

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  adapter: node({ mode: 'standalone' }),
  server: { host: true },
});
```

Según el código del adaptador, `host: true` se convierte en `"0.0.0.0"` y queda fijado en el build. La variable `HOST`, si existe, tiene prioridad. Esta variante no se ejecutó en la prueba.

### 3. Comprueba el puerto del proxy

El otro motivo habitual del 502 es un puerto distinto. `PORT` decide dónde escucha Astro (4321 por defecto) y el proxy tiene que apuntar a ese mismo puerto del contenedor. En Dokploy se indica al configurar el dominio del servicio.

## Troubleshooting

### Sigue el 502 con `HOST=0.0.0.0`

Revisa en los logs que la línea `network:` aparezca. Si aparece, el problema ya no es la dirección: revisa el puerto (paso 3) y que el contenedor esté en la misma red de Docker que el proxy.

### Con `0.0.0.0`, `[::1]` deja de responder

En la prueba, `0.0.0.0` solo aceptó IPv4. Si algo dentro del contenedor llama a `http://localhost:4321` y `localhost` se resuelve a `::1`, fallará. Usa `127.0.0.1` en los healthchecks.

### El sitio carga, pero el formulario da 403

El proxy ya llega al servidor. Ahora falla la comprobación de origen: [Cross-site POST form submissions are forbidden en Astro](/blog/astro-cross-site-post-form-submissions-forbidden/).

### El endpoint da 500 con `SECRET_KEY is missing`

El servidor arranca, pero falla al atender la petición. Es una variable de `astro:env` que falta en el runtime, no un problema de red: [astro:env is missing en el build de Docker](/blog/astro-env-is-missing-docker-build/).

### Límites de esta prueba

- Se probó el servidor `standalone` en Windows, fuera de Docker. Lo que se ve desde la IP de la red local representa lo que vería el proxy, pero no se midió un 502 real.
- `server.host: true` y el comportamiento de `localhost` en Linux salen del código fuente, no de la prueba.
