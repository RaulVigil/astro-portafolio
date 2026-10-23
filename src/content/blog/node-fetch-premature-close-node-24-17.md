---
title: "node-fetch Premature close tras actualizar a Node 24.17"
description: "Node 24.17.0, 22.23.0 y 26.3.1 rompen node-fetch@2 con ERR_STREAM_PREMATURE_CLOSE. Qué respuestas fallan, por qué y a qué versión actualizar."
slug: node-fetch-premature-close-node-24-17
pubDate: 2026-10-23
tags: [node, http, node-fetch]
draft: false
---

Al actualizar Node a 24.17.0, 22.23.0 o 26.3.1, sin cambiar el código ni las dependencias, las peticiones hechas con `node-fetch@2` empiezan a fallar con este error:

```text
FetchError: Invalid response body while trying to fetch http://127.0.0.1:3000/token: Premature close
    at PassThrough.<anonymous> (<proyecto>\node_modules\node-fetch\lib\index.js:217:52)
    at PassThrough.emit (node:events:509:28)
    at emitErrorNT (node:internal/streams/destroy:170:8)
    at emitErrorCloseNT (node:internal/streams/destroy:129:3)
    at process.processTicksAndRejections (node:internal/process/task_queues:90:21) {
  type: 'system',
  errno: 'ERR_STREAM_PREMATURE_CLOSE',
  code: 'ERR_STREAM_PREMATURE_CLOSE'
}
```

El servidor responde completo y la red no corta nada. Es una regresión de Node, corregida en 22.23.1, 24.18.0 y 26.4.0. También aparece en librerías que usan `node-fetch@2` por dentro, como `gaxios@6`, la capa HTTP de `google-auth-library` y, a través de ella, de `@google-cloud/storage`.

## El problema

Node 22.23.0, 24.17.0 y 26.3.1 salieron el 17 de junio de 2026 con el parche de CVE-2026-48931, un caso de *response queue poisoning* en `http.Agent`. Con `keepAlive`, el socket que vuelve al pool se queda sin parser HTTP. Si el servidor escribía algo en ese intervalo, Node lo leía como la respuesta de la siguiente petición. El parche ([commit 0a22d40180](https://github.com/nodejs/node/commit/0a22d40180)) añade a cada socket libre un listener de `data`, `freeSocketDataGuard`, que destruye el socket si llegan datos que nadie pidió.

`node-fetch@2` tiene su propia heurística para detectar respuestas chunked truncadas. En la versión 2.7.0, la función `fixResponseChunkedTransferBadEnding()` espera el evento `close` de la respuesta y comprueba `socket.listenerCount('data') > 0`. Si el socket todavía tiene un listener de `data`, asume que el cuerpo no terminó y lanza `Premature close`. Antes del parche, un socket libre no tenía ninguno. Desde 24.17.0 tiene `freeSocketDataGuard`.

Al instrumentar el agente y la respuesta en la prueba, con una respuesta gzip, el orden de eventos fue el mismo en las dos versiones. Lo que cambia es lo que encuentra `node-fetch` en el `close`:

```text
# Node 24.17.0
  respuesta 'end': listeners('data') del socket = []
  socket vuelve al pool
  respuesta 'close': listeners('data') del socket = [freeSocketDataGuard]
  fetch() resuelto
  FetchError: Invalid response body while trying to fetch http://127.0.0.1:63535/: Premature close

# Node 24.18.0
  respuesta 'end': listeners('data') del socket = []
  socket vuelve al pool
  respuesta 'close': listeners('data') del socket = []
  fetch() resuelto
  OK, 200000 bytes
```

No hace falta configurar un agente para caer en esto. En Node 24, `http.globalAgent.keepAlive` vale `true`, y en la prueba `node-fetch@2` sin la opción `agent` falló en 10 de 10 peticiones.

Tampoco falla cualquier respuesta. La comprobación de `node-fetch` solo se aplica a respuestas con `Transfer-Encoding: chunked` y sin `Content-Length`: con `Content-Length`, las 10 peticiones pasaron. Entre las chunked, el error solo llega a tu código si el cuerpo todavía no terminó de fluir cuando `node-fetch` lo destruye. Con Node 24.17.0, un agente con `keepAlive` y 10 peticiones por caso:

| Respuesta chunked del servidor | `compress: true` (por defecto) | `compress: false` |
| --- | --- | --- |
| Texto de 100 bytes | 0/10 | 0/10 |
| Texto sin comprimir de 200 KB | 10/10 | 10/10 |
| gzip de un texto de 100 bytes | 0/10 | 0/10 |
| gzip de 200 KB muy comprimible | 0/10 | 2/10 |
| gzip de 400 KB casi incompresible | 0/10 | 10/10 |

Con 24.18.0 pasaron todas. El patrón: falla cuando la respuesta es pequeña o cuando `node-fetch` tiene que descomprimirla. Es justo lo que devuelve un endpoint de tokens o una API JSON. Por eso los reportes del [issue nodejs/node#63989](https://github.com/nodejs/node/issues/63989) vienen de `google-auth-library`, `@google-cloud/storage`, Firebase CLI y Atlassian Forge CLI. En la prueba, `gaxios` 6.7.1 con su configuración por defecto falló igual contra un servidor local:

```text
Invalid response body while trying to fetch http://127.0.0.1:60278/token: Premature close
```

Las salidas obvias no sirven:

- **Volver a 24.16.0 funciona,** pero quita el parche de CVE-2026-48931.
- **`compress: false` no evita el error** con respuestas pequeñas, como muestra la tabla.
- **Reintentar no ayuda.** En la prueba, el fallo fue sistemático en casi todos los casos, y en el issue se reporta que los 3 reintentos de `gaxios` se agotan.

## La solución

Actualiza Node a una versión que incluya el [PR #64004](https://github.com/nodejs/node/pull/64004): 22.23.1, 24.18.0, 26.4.0 o posterior. El arreglo conserva la protección del CVE, pero vigila el socket libre con el hook interno `onread` de su handle en lugar de un listener público de `data`. `listenerCount('data')` vuelve a dar 0 y `node-fetch@2` deja de ver un corte que no existe.

### 1. Reproduce el error con tu versión de Node

Este script levanta un servidor que devuelve un JSON pequeño sin `Content-Length`, el caso que falla siempre, y lo pide con `node-fetch@2`:

```js
// token.mjs
import http from 'node:http';
import fetch from 'node-fetch'; // 2.7.0

// Respuesta JSON pequeña sin Content-Length: Node la envía con Transfer-Encoding: chunked
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ access_token: 'token-de-prueba', expires_in: 3599 }));
});

server.listen(3000, '127.0.0.1', async () => {
  try {
    const res = await fetch('http://127.0.0.1:3000/token');
    console.log(process.version, await res.json());
  } finally {
    server.close();
  }
});
```

```bash
npm install node-fetch@2.7.0
node token.mjs
```

En una versión afectada sale el `FetchError` del principio. En una corregida:

```text
v24.18.0 { access_token: 'token-de-prueba', expires_in: 3599 }
```

En la prueba, cada versión de Node se instaló en su propia carpeta con `npm install node@<versión>`, sin tocar la del sistema. Resultado del script en Windows 11:

| Línea | Sin el bug | Con el bug | Con el arreglo |
| --- | --- | --- | --- |
| Node 22 | 22.22.3 | 22.23.0 | 22.23.1, 22.23.4 |
| Node 24 | 24.16.0 | 24.17.0 | 24.18.0, 24.22.1 |
| Node 26 | 26.3.0 | 26.3.1 | 26.4.0, 26.12.1 |

### 2. Actualiza Node y fija la versión exacta

Pasa a 22.23.1, 24.18.0, 26.4.0 o cualquier versión posterior de su línea. Comprueba la versión con `node -v` en el lugar donde corre el proceso: dentro del contenedor, en el runner de CI o en la plataforma de hosting, no en tu máquina.

Si despliegas con Docker, revisa el tag de la imagen. En el issue hay reportes de `node:24-slim` y `node:lts-slim` que resolvieron a 24.17.0, y de `node:22-alpine` que resolvió a 22.23.0. Con un tag flotante, la versión de Node depende del día en que se construyó la imagen. Un tag exacto, como `node:24.18.0-slim`, hace que el cambio de versión sea una decisión tuya.

### 3. Si no puedes actualizar todavía, saca a node-fetch@2 del camino

Primero, averigua quién trae `node-fetch@2`. Con pnpm:

```bash
pnpm why node-fetch
```

```text
node-fetch@2.7.0
└─┬ gaxios@6.7.1
  └── mi-api@1.0.0 (dependencies)

Found 1 version of node-fetch
```

Con npm, el equivalente es `npm ls node-fetch`.

Si `node-fetch@2` está en tu propio código, cámbialo por el `fetch` global de Node, que usa undici y no tiene esa heurística:

```js
// src/lib/token.mjs
export async function getToken(url) {
  const res = await fetch(url, { method: 'POST' }); // fetch global de Node (undici)
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

Las opciones propias de `node-fetch@2`, como `agent`, `compress`, `timeout` o `size`, no existen en el `fetch` global. Para el timeout se usa `signal: AbortSignal.timeout(ms)`. Además, `res.body` deja de ser un stream de Node: es un `ReadableStream` web. `node-fetch@3` tampoco falló en la prueba, pero solo se puede importar como ESM.

Si `node-fetch@2` llega a través de `gaxios@6`, la opción `fetchImplementation` lo reemplaza:

```js
// src/lib/token.mjs
import { request } from 'gaxios';

export async function getToken(url) {
  const res = await request({ url, method: 'POST', fetchImplementation: globalThis.fetch });
  return res.data;
}
```

En la prueba con `gaxios` directamente, sobre servidores locales, la configuración por defecto falló en 10 de 10 peticiones y con `fetchImplementation` pasaron todas, también por HTTPS. La prueba no cubrió cómo pasar esa opción a `google-auth-library` o `@google-cloud/storage`, porque eso requiere credenciales reales de Google Cloud. Para esas librerías, la salida limpia es el paso 2.

Si no puedes tocar la librería pero sí el agente, `keepAlive: false` también evita el error, porque el socket nunca vuelve al pool:

```js
// src/lib/token.mjs
import https from 'node:https';
import fetch from 'node-fetch';

const agent = new https.Agent({ keepAlive: false });

export async function getToken(url) {
  const res = await fetch(url, { method: 'POST', agent });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}
```

El costo es una conexión TCP y un handshake TLS nuevos en cada petición. Úsalo como parche temporal.

### 4. Impide arrancar en una versión afectada

Si un tag flotante o un cambio en la plataforma puede volver a meter una de estas versiones, que el proceso lo diga al arrancar en lugar de fallar en la primera petición:

```js
// src/check-node.mjs
// Versiones con la regresión de http.Agent que rompe node-fetch@2 (nodejs/node#63989)
const AFECTADAS = new Set(['v22.23.0', 'v24.17.0', 'v26.3.1']);

if (AFECTADAS.has(process.version)) {
  console.error(
    `Node ${process.version} rompe node-fetch@2 con "Premature close". ` +
      'Actualiza a 22.23.1, 24.18.0, 26.4.0 o superior.'
  );
  process.exit(1);
}
```

```json
{
  "scripts": {
    "start": "node src/check-node.mjs && node src/server.mjs"
  }
}
```

Con 24.17.0, el script imprime el aviso y termina con código 1, así que `server.mjs` no arranca. Con 24.18.0 no imprime nada y sale con 0.

## Troubleshooting

### `compress: false` no quita el `Premature close`

`compress: false` hace que `node-fetch` no envíe `Accept-Encoding: gzip`, así que el servidor puede responder sin comprimir. Pero las respuestas chunked pequeñas fallan con o sin compresión (primera fila de la tabla). Y si el servidor manda gzip aunque no se lo pidan, el error sigue: en la prueba, con un servidor que siempre respondía gzip, `compress: false` siguió devolviendo `Premature close`. Actualiza Node (paso 2).

### `Invalid response body while trying to fetch https://iamcredentials.googleapis.com/...:signBlob: Premature close`

Es la forma en que el error aparece en `@google-cloud/storage` al firmar URLs, según los reportes del issue: `@google-cloud/storage` → `google-auth-library` → `gaxios@6` → `node-fetch@2.7.0`. Los mismos reportes mencionan las peticiones de token de cuentas de servicio (`oauth2/v4/token`). Las dos respuestas son JSON pequeños, como el del script del paso 1. La solución es la misma: Node 24.18.0 o posterior.

### En local funciona y en el servidor falla

Casi siempre es otra versión de Node: tu máquina tiene 24.16.0 o 24.18.0 y la imagen se reconstruyó con 24.17.0. Revisa `node -v` dentro del entorno que falla y el tag de la imagen base (paso 2).

### Volver a 24.16.0 lo arregla

Sí, y es lo que hicieron varios equipos en junio, pero se pierde el parche de CVE-2026-48931. Las notas de la versión 24.17.0 lo clasifican como de severidad baja. Aun así, 24.18.0 resuelve el bug y conserva el parche, así que no hay motivo para quedarse en 24.16.0.

### Unos endpoints fallan y otros no

Depende de la forma de la respuesta. Las que traen `Content-Length` no pasan por la comprobación de `node-fetch`. Las chunked grandes y sin comprimir pasaron en la prueba. Las chunked pequeñas, y las que `node-fetch` descomprime, fallaron. Un mismo cliente puede descargar archivos grandes sin problema y fallar al pedir un token.

### `keepAlive: false` también lo arregla

Sí: el socket se cierra después de cada respuesta y nunca entra al pool, así que nunca recibe `freeSocketDataGuard`. En la prueba pasó 10 de 10 peticiones en 24.17.0. El costo es abrir una conexión por petición. Sirve como parche mientras actualizas Node, no como solución permanente.

## Referencias

- [nodejs/node#63989](https://github.com/nodejs/node/issues/63989): el reporte original y los casos de Google Cloud, Firebase y Forge.
- [nodejs/node#64004](https://github.com/nodejs/node/pull/64004): el arreglo, publicado en 22.23.1, 24.18.0 y 26.4.0.
- [Node.js v24.17.0](https://github.com/nodejs/node/releases/tag/v24.17.0) y [v24.18.0](https://github.com/nodejs/node/releases/tag/v24.18.0): notas de las versiones.
- [Código de node-fetch 2.x](https://github.com/node-fetch/node-fetch/blob/2.x/src/index.js): `fixResponseChunkedTransferBadEnding()`.
- [gaxios](https://github.com/googleapis/gaxios): la opción `fetchImplementation`.
