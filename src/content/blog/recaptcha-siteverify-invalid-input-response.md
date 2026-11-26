---
title: "reCAPTCHA siteverify invalid-input-response: qué significa"
description: "siteverify devuelve invalid-input-response aunque falle el secreto, y las claves de prueba aprueban todo. Cómo verificar reCAPTCHA v2 en Node."
slug: recaptcha-siteverify-invalid-input-response
pubDate: 2026-11-30
tags: [seguridad, http, node]
draft: true # programado
---

Tu endpoint llama a `https://www.google.com/recaptcha/api/siteverify` y recibe esto, con HTTP 200:

```json
{
  "success": false,
  "error-codes": ["invalid-input-response"]
}
```

La [documentación](https://developers.google.com/recaptcha/docs/verify) también lista `missing-input-secret` e `invalid-input-secret`. En las pruebas de este artículo no apareció ninguno de los dos: con un token inválido, Google responde `invalid-input-response` pase lo que pase con el secreto.

## El problema

Estas peticiones se enviaron a `siteverify` el 26 de noviembre de 2026, todas con un token inventado:

| Petición | `error-codes` |
| --- | --- |
| Secreto inventado, `form-urlencoded` | `invalid-input-response` |
| Secreto vacío (`secret=`) | `invalid-input-response` |
| Secreto con el texto `undefined` | `invalid-input-response` |
| Sin campo `secret` | `invalid-input-response` |
| Cuerpo vacío | `invalid-input-response` |
| Cuerpo en JSON en lugar de formulario | `invalid-input-response` |

Por eso no sirve depurar con tokens falsos: un `SECRET_KEY` vacío, mal copiado o enviado como `undefined` produce el mismo error que un token caducado. Para saber si el secreto está bien hace falta un token real del widget, y cada uno vale una sola verificación durante dos minutos, según la documentación.

El otro extremo engaña igual. Las [claves de prueba de Google](https://developers.google.com/recaptcha/docs/faq) aprobaron todo, incluso una petición sin token:

```json
{
  "success": true,
  "challenge_ts": "2026-11-26T21:11:12Z",
  "hostname": "testkey.google.com"
}
```

Si dejas esas claves en producción, cualquier petición pasa la verificación.

## La solución

Verificar con el formato correcto, comprobar lo que Google no comprueba por ti y registrar los códigos de error.

### 1. Envía el secreto y el token como formulario

```ts
// src/lib/recaptcha.ts
import { SECRET_KEY } from 'astro:env/server';

const EXPECTED_HOSTNAME = 'raulo.dev';

export async function verifyRecaptcha(token: string | undefined, remoteip?: string) {
  if (!token) return { ok: false, reason: 'sin-token' };

  const body = new URLSearchParams({ secret: SECRET_KEY, response: token });
  if (remoteip) body.set('remoteip', remoteip);

  const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
  const data = await res.json();

  if (!data.success) {
    console.warn('reCAPTCHA rechazado:', data['error-codes']);
    return { ok: false, reason: 'rechazado' };
  }
  if (data.hostname !== EXPECTED_HOSTNAME) {
    console.warn('reCAPTCHA de otro hostname:', data.hostname);
    return { ok: false, reason: 'hostname' };
  }
  return { ok: true };
}
```

Este módulo no se ejecutó con un token real. Las respuestas de `siteverify` que maneja son las de la tabla de arriba.

### 2. Rechaza la petición si falta el token

El `if (!token)` no es redundante: con las claves de prueba, Google aprueba una petición sin token, así que en desarrollo nunca verías el fallo.

### 3. Comprueba el `hostname`

La respuesta incluye el dominio donde se resolvió el captcha. Compararlo hace que las claves de prueba (`testkey.google.com`) se rechacen en producción. También te protege si desactivas la verificación de dominios en la consola de reCAPTCHA, que es cuando [Google pide comprobarlo](https://developers.google.com/recaptcha/docs/domain_validation) en tu servidor.

### 4. Haz que falte el secreto falle en voz alta

Con `astro:env` y `SECRET_KEY` declarado como `envField.string({ context: 'server', access: 'secret' })`, el endpoint falla con `SECRET_KEY is missing` en lugar de enviar un secreto vacío a Google y recibir otro `invalid-input-response`. Se explica en [astro:env is missing en el build de Docker](/blog/astro-env-is-missing-docker-build/).

## Troubleshooting

### `Error 411 (Length Required)` en lugar de JSON

Apareció con `curl -X POST` y los parámetros en la URL, sin cuerpo: Google devolvió una página HTML de error y un `res.json()` fallaría al leerla. Con `fetch` de Node 22.19, un `POST` sin cuerpo recibió `200` con JSON, así que en Node solo pasa si construyes la petición a mano. Envía los datos en el cuerpo, como en el paso 1.

### `timeout-or-duplicate`

Según la documentación, el token ya se verificó o pasaron más de dos minutos. Ocurre si reintentas el envío con el mismo token. Después de cada respuesta, llama a `grecaptcha.reset()` en el navegador para obtener uno nuevo.

### El endpoint ni siquiera llega a verificar: 403

Si la respuesta es `Cross-site POST form submissions are forbidden`, Astro bloqueó el formulario antes de tu código: [Cross-site POST form submissions are forbidden en Astro](/blog/astro-cross-site-post-form-submissions-forbidden/).

### Límites de esta prueba

- Todas las peticiones usaron tokens inventados o las claves de prueba públicas. No se probó un token real con un secreto incorrecto, que es el caso en el que debería aparecer `invalid-input-secret`.
- El comportamiento de `siteverify` puede cambiar: es el observado el 26 de noviembre de 2026.
