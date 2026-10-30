---
title: "JavaScript heap out of memory tras actualizar a Node 24.19"
description: "Desde Node 24.19, for await deja vivos los sockets half-open: se acumulan en CLOSE_WAIT hasta el OOM. Sigue en 24.22.2. Causa y arreglo probado."
slug: javascript-heap-out-of-memory-node-24-19
pubDate: 2026-10-30
tags: [node, http, streams]
draft: false
---

Después de actualizar de Node 24.18.1 a 24.19.0 o posterior, un servidor que llevaba meses estable empieza a caerse cada pocas horas con este error:

```text
FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory
```

Según la versión y el sistema, V8 usa otras variantes del mensaje, como `Reached heap limit Allocation failed - JavaScript heap out of memory`. Volver a 24.18.1 lo arregla. Antes del crash hay otra pista: el número de conexiones en estado `CLOSE_WAIT` no deja de subir, aunque los clientes ya se desconectaron.

Una causa confirmada es un cambio en cómo `for await` cierra los sockets. En la 24.22.2, la última de la línea 24 al momento de escribir esto, sigue sin corregirse.

## El problema

Node 24.19.0 incluyó el cambio [stream: preserve half-open duplexes in async iteration (#64275)](https://github.com/nodejs/node/pull/64275). Hasta la 24.18.1, cuando un `for await` sobre un stream llegaba al final de los datos, Node destruía el stream. Desde la 24.19.0 ya no lo destruye si se cumplen estas condiciones:

```js
// lib/internal/streams/readable.js (Node 24.22.2, extracto)
const preserveHalfOpenDuplex =
  error === null &&
  stream.allowHalfOpen === true &&
  stream.writable === true &&
  stream.writableEnded !== true;
```

Traducido: el stream terminó sin error, admite conexiones half-open y su lado de escritura sigue abierto. Un socket TCP cumple las tres en cuanto el cliente cierra su lado y el servidor todavía no llamó a `end()`.

Los sockets con `allowHalfOpen: true` son más comunes de lo que parece:

- **Los que entrega `http.Server` en los eventos `'upgrade'` y `'connect'`.** El servidor HTTP crea su servidor TCP con `allowHalfOpen: true` ([`lib/_http_server.js`](https://github.com/nodejs/node/blob/v24.22.2/lib/_http_server.js#L648)). Es el patrón de los WebSockets hechos a mano, los túneles y los proxies.
- **Los de `net.createServer({ allowHalfOpen: true })`.** Sin esa opción, `net.createServer()` usa `false` y no se ve afectado.

Esto es lo que pasa en el servidor:

1. El cliente envía sus datos y cierra su lado de la conexión (FIN).
2. El FIN termina el `for await` como un final normal.
3. Node ya no destruye el socket, y el servidor, que no tiene nada más que escribir, tampoco lo cierra.
4. Nada vuelve a tocar ese socket: queda como handle activo de libuv y en `CLOSE_WAIT` para siempre.

Un handle activo es una raíz para el recolector de basura. Todo lo que alcanzan sus listeners queda retenido: el estado de la sesión, buffers, closures. Por eso el heap no muestra una fuga grande en un solo sitio, sino memoria repartida entre cientos o miles de sockets.

La causa la identificó [trevnorris en el issue #65110](https://github.com/nodejs/node/issues/65110), donde se juntaron los reportes de producción. La corrección, [#65986](https://github.com/nodejs/node/pull/65986), entró en Node 26.10.0. En la línea 24 no aparece ni en el changelog ni en el código de la 24.22.2.

### Reproducción

Un servidor con un handler `upgrade` que lee el socket con `for await` y guarda un estado por conexión. El cliente abre 300 conexiones, una tras otra, envía `hola` y cierra cada una del todo:

```js
// repro.mjs
import http from 'node:http';

const CONEXIONES = 300;
const server = http.createServer((req, res) => res.end('ok'));

server.on('upgrade', async (req, socket) => {
  socket.write('HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: echo\r\n\r\n');

  // Estado por conexión: el listener lo retiene mientras el socket viva.
  const sesion = { datos: Array.from({ length: 100_000 }, (_, i) => ({ i })) };
  socket.on('error', (err) => { sesion.error = err.code; });

  for await (const chunk of socket) {
    // procesar el mensaje
  }
});

function conectar(port) {
  return new Promise((resolve) => {
    const req = http.request({ host: '127.0.0.1', port, headers: { Connection: 'Upgrade', Upgrade: 'echo' } });
    req.on('upgrade', (res, socket) => {
      socket.end('hola');
      // El cliente cierra del todo en cuanto envía su FIN.
      socket.on('finish', () => {
        socket.destroy();
        resolve();
      });
    });
    req.end();
  });
}

server.listen(0, '127.0.0.1', async () => {
  for (let i = 0; i < CONEXIONES; i++) await conectar(server.address().port);

  setTimeout(() => {
    const vivos = process.getActiveResourcesInfo().filter((r) => r === 'TCPSocketWrap').length;
    console.log(`${process.version}: ${CONEXIONES} conexiones cerradas, sockets vivos en el servidor=${vivos}`);
    process.exit();
  }, 300);
});
```

En la 24.22.2 los 300 sockets siguen vivos aunque el cliente ya cerró todas las conexiones:

```text
v24.22.2: 300 conexiones cerradas, sockets vivos en el servidor=300
```

Se probó con los binarios oficiales en Windows 11 y en contenedores `node:<versión>` en Linux, con el mismo resultado. La última columna es la misma prueba con `node --max-old-space-size=128 repro.mjs`:

| Versión | Sockets vivos tras 300 conexiones | Con el heap limitado a 128 MB |
| --- | --- | --- |
| 24.18.1 | 0 | termina bien |
| 24.19.0 | 300 | `Ineffective mark-compacts near heap limit` |
| 24.22.2 | 300 | `Ineffective mark-compacts near heap limit` |
| 26.9.0 | 300 | `Reached heap limit` |
| 26.10.0 | 0 | termina bien |
| 26.13.0 | 0 | termina bien |

En la línea 26 el cambio entró en la 26.5.0, según el changelog, y se corrigió en la 26.10.0.

No todo el código que usa `for await` se ve afectado. En la 24.22.2, con el mismo cliente:

| Patrón | ¿El socket queda vivo? |
| --- | --- |
| `'upgrade'` + `for await (const chunk of socket)` | sí |
| `'upgrade'` + `text(socket)` de `node:stream/consumers` | sí |
| `net.createServer({ allowHalfOpen: true })` + `for await` | sí |
| `net.createServer()` + `for await` | no |
| Body de una petición HTTP: `for await (const chunk of req)` | no |

Las funciones de `node:stream/consumers` caen en el mismo problema porque, por dentro, `text()` y `blob()` recorren el stream con `for await`.

Las salidas obvias no sirven:

- **Subir `--max-old-space-size`:** el heap crece con cada conexión cerrada. Con 50 conexiones de la prueba, el heap quedó en unos 200 MB en la 24.22.2 y en unos 46 MB en la 24.18.1. Un límite mayor solo retrasa el crash.
- **`socket.iterator({ destroyOnReturn: true })`:** ya es el valor por defecto, y la condición nueva se evalúa aparte. En la 24.22.2 dejó los mismos sockets vivos.
- **Volver a 24.18.1:** funciona, pero te quedas sin los parches de seguridad que salieron después, como los de la 24.22.1. No es la primera vez que una versión menor de la línea 24 rompe código de red: en la 24.17 fue [node-fetch con `Premature close`](/blog/node-fetch-premature-close-node-24-17/) y en la 24.16, [extract-zip colgado](/blog/extract-zip-node-24-16-node-26/).

## La solución

Cierra tú el socket cuando termine el bucle. No depende de la versión de Node: el arreglo funcionó igual en las seis versiones de la tabla. Si puedes, además, pasa a Node 26.10 o superior.

### 1. Confirma que es este problema

En el servidor, cuenta las conexiones en `CLOSE_WAIT`:

```bash
ss -tn state close-wait | tail -n +2 | wc -l
```

En Windows, el equivalente es:

```powershell
netstat -ano -p tcp | findstr CLOSE_WAIT
```

En la prueba con 24.22.2, después de 20 conexiones cerradas por el cliente, `ss` mostró 20 en `CLOSE_WAIT`; con el arreglo del paso 2, ninguna. Si el número crece con el tráfico y nunca baja, es este problema o uno parecido.

Desde dentro del proceso, `process.getActiveResourcesInfo()` devuelve los handles activos. Importa este archivo al inicio del servidor para registrar cuántos sockets TCP siguen abiertos:

```js
// monitor-sockets.mjs
setInterval(() => {
  const sockets = process.getActiveResourcesInfo().filter((r) => r === 'TCPSocketWrap').length;
  console.log(`sockets TCP activos: ${sockets}`);
}, 60_000).unref();
```

La cuenta incluye las conexiones salientes (base de datos, APIs), así que lo que importa es la tendencia: si sube con cada conexión que se cierra y no vuelve a bajar, hay sockets que nadie destruye.

Para encontrar el código que los deja abiertos, busca los handlers de `upgrade` y `connect` y los servidores con `allowHalfOpen`:

```bash
grep -rnE "on\(['\"](upgrade|connect)['\"]|allowHalfOpen: *true" --include=*.js --include=*.mjs --include=*.ts src/
```

Revisa si alguno lee el socket con `for await`, con `node:stream/consumers` o pasándolo a una función que lo recorre.

### 2. Destruye el socket en un `finally`

```js
// repro.mjs, con el arreglo
server.on('upgrade', async (req, socket) => {
  socket.write('HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: echo\r\n\r\n');

  const sesion = { datos: Array.from({ length: 100_000 }, (_, i) => ({ i })) };
  socket.on('error', (err) => { sesion.error = err.code; });

  try {
    for await (const chunk of socket) {
      // procesar el mensaje
    }
  } finally {
    socket.destroy();
  }
});
```

El `finally` también cubre la salida por error o por `break`. Con este cambio, la reproducción terminó con 0 sockets vivos en todas las versiones, incluso con el heap limitado a 128 MB. Sirve igual si lees el socket con `await text(socket)` u otra función de `node:stream/consumers`: también se probó con `text(socket)`.

Si al terminar tienes algo que responder, `socket.end(respuesta)` en lugar de `destroy()` también funciona. Cierra el lado de escritura y, con los dos lados cerrados, Node libera el socket. En la prueba, con `socket.end()` también quedaron 0 sockets vivos.

### 3. Pasa a Node 26.10 o superior

Desde la 26.10.0, `for await` vuelve a destruir el socket al terminar. Node 26 es LTS (*Lithium*) desde la 26.13.0, publicada el 28 de octubre de 2026, así que ya es una opción para producción. Al migrar desde la 24, ten en cuenta [lo que advierte el changelog](https://github.com/nodejs/node/blob/main/doc/changelogs/CHANGELOG_V26.md#26.13.0): desde Node 25, los binarios oficiales para Linux enlazan con `libatomic`, que en algunas distribuciones hay que instalar aparte.

Aunque actualices, deja el `finally` del paso 2: no cuesta nada y te protege de `pipeline()`, que tiene el mismo síntoma en todas las versiones (ver Troubleshooting).

## Troubleshooting

### `FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory`

Es el mismo crash con otro mensaje de V8. En las pruebas, el mismo `repro.mjs` produjo tres variantes: `Ineffective mark-compacts near heap limit` en las versiones 24, `Reached heap limit` en la 26.9.0 y, en Linux con `--heapsnapshot-near-heap-limit`, esta:

```text
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
```

Para confirmar que lo que se acumula son sockets, arranca el proceso con `--heapsnapshot-near-heap-limit=1`. Node escribe un archivo `.heapsnapshot` en el directorio de trabajo justo antes de morir. En un contenedor `node:24.22.2`:

```text
Wrote snapshot to /app/Heap.20261030.161644.11.0.001.heapsnapshot
```

Ábrelo en Chrome DevTools → Memory → Load y busca `Socket` y `TCP` en la vista Summary. En la prueba, el snapshot tenía 36 objetos `Socket` y 35 `TCP`, en un servidor que no debería tener ninguna conexión abierta. El archivo pesó unos 316 MB con el heap limitado a 128 MB, así que deja espacio en disco.

### `AbortError: The operation was aborted` en cada conexión

Después de pasar a Node 26.10 o superior, o de volver a 24.18.1, el listener de `'error'` del socket recibe un error por conexión: `AbortError`, con código `ABORT_ERR` y el mensaje `The operation was aborted`. El iterador destruye el socket cuando su lado de escritura todavía está abierto, y en ese caso Node usa un `AbortError` como motivo.

No es un fallo nuevo: es el comportamiento anterior a la 24.19, que vuelve con la corrección. En la prueba, sin listener de `'error'`, el proceso no se cayó en ninguna versión. Si te llena los logs, fíltralo:

```js
// servidor.mjs
socket.on('error', (err) => {
  if (err.code === 'ABORT_ERR') return;
  console.error(err);
});
```

### `pipeline(socket, destino)` deja sockets en `CLOSE_WAIT`, incluso en 24.18.1

No es esta regresión. `pipeline()` no destruye el stream de origen cuando termina sin error: en [`lib/internal/streams/pipeline.js`](https://github.com/nodejs/node/blob/v24.22.2/lib/internal/streams/pipeline.js#L51-L69), el origen se da por terminado en cuanto acaba su lado de lectura. En la prueba, con el socket de `'upgrade'` como origen y un `Writable` como destino, quedaron 100 sockets vivos de 100 en 24.18.1, 24.22.2 y 26.13.0.

El arreglo es el mismo: `await pipeline(socket, destino)` dentro del `try` y `socket.destroy()` en el `finally`. Así quedaron 0 sockets vivos en las tres versiones.

### `bash: ss: command not found` dentro del contenedor

Las imágenes oficiales `node:24.22.2` y `node:26.13.0` no traen `ss`. En la prueba con `node:24.22.2` bastó con instalar `iproute2`:

```bash
apt-get update && apt-get install -y iproute2
```

Si no puedes instalar paquetes en el contenedor, usa el contador del paso 1.

### Mi código no lee sockets con `for await`

Puede hacerlo una dependencia: repite la búsqueda del paso 1 sobre `node_modules`. Si tampoco aparece, el heap snapshot te dirá si dominan los objetos `Socket`. Si no dominan, la causa es otra: el mecanismo de este artículo es el único confirmado en el issue, pero los reportes no prueban que sea el de todos.

## Referencias

- [nodejs/node#65110](https://github.com/nodejs/node/issues/65110): el issue con los reportes de producción y el análisis de la causa.
- [nodejs/node#64275](https://github.com/nodejs/node/pull/64275): el cambio que entró en Node 24.19.0.
- [nodejs/node#65986](https://github.com/nodejs/node/pull/65986): la corrección, incluida en Node 26.10.0.
- [nodejs/help#5165](https://github.com/nodejs/help/issues/5165): los primeros reportes del OOM tras pasar de 24.18.1 a 24.19.0.
