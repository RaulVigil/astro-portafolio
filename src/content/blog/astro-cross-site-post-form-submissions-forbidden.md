---
title: "Cross-site POST form submissions are forbidden en Astro"
description: "Astro responde 403 a tu formulario detrás de Traefik, Nginx o Cloudflare. Por qué pasa y cómo arreglarlo con allowedDomains sin apagar checkOrigin."
slug: astro-cross-site-post-form-submissions-forbidden
pubDate: 2026-11-26
tags: [astro, seguridad, http]
draft: false
---

En local el formulario funciona. Desplegado detrás de un proxy inverso (Traefik, Nginx, Cloudflare), el mismo `POST` devuelve `403` con un texto plano:

```text
Cross-site POST form submissions are forbidden
```

No es un bug: es la protección CSRF de Astro, que compara mal el origen porque no sabe que hay HTTPS delante. El arreglo rápido que circula, `checkOrigin: false`, quita el 403 y también la protección. Hay uno mejor.

## El problema

La prueba usa Astro 6.4.4, `@astrojs/node` 10.1.3 en modo `standalone` y Node 22.19, con un endpoint `POST` con `prerender = false`. El proxy se simula con `curl`, enviando las cabeceras que añade un proxy que termina TLS:

```bash
# simular-proxy.sh
curl -i -X POST http://127.0.0.1:4321/api/send \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -H 'Host: raulo.dev' \
  -H 'X-Forwarded-Proto: https' \
  -H 'X-Forwarded-Host: raulo.dev' \
  -H 'Origin: https://raulo.dev' \
  --data 'name=a'
```

Con la configuración por defecto la respuesta es `403 Cross-site POST form submissions are forbidden`, aunque el `Origin` sea el dominio propio.

La causa está en el middleware de [`checkOrigin`](https://docs.astro.build/en/reference/configuration-reference/#securitycheckorigin), activo por defecto. En `astro/dist/core/app/middlewares.js` la comparación es literal:

```js
// node_modules/astro/dist/core/app/middlewares.js (Astro 6.4.4, extracto)
const isSameOrigin = request.headers.get("origin") === url.origin;
```

El navegador envía `Origin: https://raulo.dev`. Pero el proxy habla con el contenedor de Node por HTTP, y Astro construye `url` con el protocolo de ese socket. Sin más configuración ignora `X-Forwarded-Proto` y `X-Forwarded-Host`, así que `url.origin` vale `http://raulo.dev`. Los dos textos no coinciden y Astro bloquea el envío.

Solo se bloquean peticiones que no son `GET`, `HEAD` ni `OPTIONS`, y solo si el `Content-Type` es de formulario (`application/x-www-form-urlencoded`, `multipart/form-data`, `text/plain`) o no hay `Content-Type`. Las páginas prerenderizadas no pasan por esta comprobación.

## La solución

Decirle a Astro en qué dominios puede confiar para leer las cabeceras `X-Forwarded-*`. Para eso existe [`security.allowedDomains`](https://docs.astro.build/en/reference/configuration-reference/#securityalloweddomains), disponible desde Astro 5.14.2.

### 1. Añade `allowedDomains` con tu dominio y `https`

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  site: 'https://raulo.dev',
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  security: {
    allowedDomains: [{ hostname: 'raulo.dev', protocol: 'https' }],
  },
});
```

Si sirves también `www` o subdominios, añádelos al array. Según la documentación, `*.raulo.dev` cubre un nivel de subdominio y `**.raulo.dev` cualquier profundidad (no se probó aquí).

### 2. Comprueba que el origen ya es `https`

En la prueba, el endpoint devuelve `url.origin` para ver qué entiende Astro. Esta tabla resume las cuatro configuraciones con las mismas peticiones:

| Petición | Por defecto | `checkOrigin: false` | `allowedDomains` |
| --- | --- | --- | --- |
| Directa, mismo origen | 200 | 200 | 200 |
| Proxy con `X-Forwarded-Proto: https` | **403** | 200 | 200 |
| Proxy con `X-Forwarded-Proto: http` | 403 | 200 | **403** |
| `Origin: https://evil.example` | 403 | **200** | 403 |

Con `allowedDomains`, la petición a través del proxy responde así:

```text
200 ok https://raulo.dev
```

Funciona igual con `protocol: 'https'` y sin él, y también si el proxy no envía `X-Forwarded-Host` pero conserva el `Host` original, como hace Traefik por defecto.

### 3. Prueba contra el servidor real

```bash
# no ejecutado contra producción
curl -i -X POST https://raulo.dev/api/send \
  -H 'Origin: https://raulo.dev' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data ''
```

Si responde `403` con el texto `Cross-site POST…`, la comprobación de origen sigue fallando. Cualquier otra respuesta, como un `400` de tu propia validación, indica que la petición ya llegó a tu endpoint.

### Por qué no `checkOrigin: false`

Quita el 403, pero también la protección: en la tabla, con `checkOrigin: false`, un formulario enviado desde `https://evil.example` responde `200`. Cualquier sitio puede hacer que el navegador de tus visitantes envíe ese formulario. Un captcha en el formulario reduce el daño en un formulario de contacto, pero no en endpoints que cambian datos con la sesión del usuario.

La documentación ofrece `allowedDomains: [{}]` para confiar en cualquier dominio cuando hay un proxy de confianza con dominios dinámicos. Eso hace que Astro crea cualquier `X-Forwarded-Host`, así que úsalo solo si el proxy reescribe siempre esas cabeceras.

## Troubleshooting

### Sigue el 403 con `allowedDomains` configurado

Mira la fila `X-Forwarded-Proto: http` de la tabla: si el proxy le dice a Astro que la petición llegó por HTTP, el origen calculado es `http://raulo.dev` y sigue sin coincidir con el `https://` del navegador.

Pasa cuando hay dos saltos y el primero llega en HTTP al segundo. Por ejemplo, Cloudflare en modo [Flexible](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/flexible/) conecta con tu servidor por HTTP. Traefik, por defecto, no confía en las cabeceras `X-Forwarded-*` entrantes y pone las suyas según el entrypoint por el que entró la petición, según su [documentación de forwarded headers](https://doc.traefik.io/traefik/reference/install-configuration/entrypoints/#forwarded-headers). Este caso de dos saltos no se probó con Cloudflare ni Traefik reales; la prueba solo envió esa cabecera con `curl`.

Hay dos salidas: poner Cloudflare en modo Full (strict) para que el tráfico llegue por HTTPS al entrypoint seguro, o configurar en Traefik `forwardedHeaders.trustedIPs` con los rangos de Cloudflare para que respete el `X-Forwarded-Proto: https` original.

### Un `fetch` con JSON desde otro origen no da 403

En la prueba, un `POST` con `Content-Type: application/json` y `Origin: https://evil.example` respondió `200` incluso con la configuración por defecto. El middleware solo mira tipos de formulario. Para JSON entre orígenes, el navegador manda antes una petición `OPTIONS` (preflight de CORS) y, si tu endpoint no responde con cabeceras CORS, no envía el `POST`. Ese freno lo pone el navegador, no Astro: `curl` no lo respeta.

### `Astro.url` o `request.url` muestran `http://` en producción

Es la misma causa. Sin `allowedDomains`, Astro ignora `X-Forwarded-Proto` y `X-Forwarded-Host`, y cualquier enlace absoluto que construyas con `Astro.url` saldrá con `http://` o con el host interno. El paso 1 lo corrige.

### El despliegue en Docker ni siquiera llega a arrancar

Si el build de la imagen falla antes, en la instalación, con `Missing: … from lock file`, es otro problema: está en [npm ci falla con Missing o Invalid from lock file](/blog/npm-ci-missing-invalid-lock-file/).

### Límites de esta prueba

- El proxy se simuló con cabeceras de `curl` contra el servidor `standalone` de `@astrojs/node`; no se probó con Nginx, Traefik ni Cloudflare reales.
- Solo se probó Astro 6.4.4 con `@astrojs/node` 10.1.3. Otros adaptadores, como Vercel o Netlify, construyen la URL de otra forma.
- Los comodines de `allowedDomains` y `allowedDomains: [{}]` se citan de la documentación, sin probar.
