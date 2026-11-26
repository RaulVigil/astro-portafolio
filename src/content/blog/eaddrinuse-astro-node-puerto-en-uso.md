---
title: "EADDRINUSE en Astro: el puerto 4321 ya está en uso"
description: "El servidor de @astrojs/node choca con un puerto ocupado, registra el error y termina con código 0. Cómo encontrar el proceso y evitarlo."
slug: eaddrinuse-astro-node-puerto-en-uso
pubDate: 2026-12-04
tags: [astro, node, docker]
draft: true # programado
---

Arrancas el servidor de producción de Astro y, en lugar de la línea `Server listening on`, ves:

```text
[ERROR] [@astrojs/node] Unhandled rejection while rendering undefined
Error: listen EADDRINUSE: address already in use 0.0.0.0:4455
```

Otro proceso ya escucha en ese puerto. Lo raro es cómo termina: el servidor registra el error y sale con código `0`, como si hubiera terminado bien.

## El problema

En la prueba, con Astro 6.4.4 y `@astrojs/node` 10.1.3 en modo `standalone`, se arrancaron dos veces `node dist/server/entry.mjs` con `PORT=4455` y `HOST=0.0.0.0`. El segundo registró este error:

```text
Error: listen EADDRINUSE: address already in use 0.0.0.0:4455
    at Server.setupListenHandle [as _listen2] (node:net:1940:16)
    ...
{
  code: 'EADDRINUSE',
  errno: -4091,
  syscall: 'listen',
  address: '0.0.0.0',
  port: 4455
}
```

Luego terminó solo, con código de salida `0`.

El código del adaptador explica las dos rarezas:

- En `dist/standalone.js`, el error de `listen` rechaza una promesa que nadie captura.
- En `dist/serve-app.js`, el adaptador registra un manejador de `unhandledRejection` que escribe `Unhandled rejection while rendering ${requestUrl}`. Como no hay ninguna petición en curso, la URL es `undefined`.

Al haber un manejador, Node no trata el rechazo como un error fatal. El servidor nunca llegó a escuchar, así que no queda nada pendiente y el proceso termina con `0`.

Ese `0` importa en Docker: la política de reinicio `on-failure` solo reinicia contenedores que salen con un código distinto de cero, según la [documentación de Docker](https://docs.docker.com/engine/containers/start-containers-automatically/). Un contenedor que choca con el puerto se queda parado sin que salte esa política.

`astro dev` se comporta distinto. Con el servidor de producción escuchando en `localhost:4455`, `astro dev --port 4455` mostró esto:

```text
[vite] Port 4455 is in use, trying another one...
┃ Local    http://localhost:4456/
```

## La solución

### 1. Encuentra qué proceso usa el puerto

En Windows:

```powershell
netstat -ano | findstr :4321
taskkill /F /PID <pid>
```

El PID es la última columna de la línea `LISTENING`. Si es un `node`, suele ser un servidor de una ejecución anterior que sigue vivo. En la prueba, así se encontró y se cerró el primer servidor.

En Linux o macOS, `lsof -i :4321` muestra el proceso. En la prueba no se ejecutó.

### 2. Elige otro puerto con `PORT`

```bash
PORT=4322 node ./dist/server/entry.mjs
```

En Docker, el puerto interno rara vez choca, porque cada contenedor tiene su propia red. Lo que sí puede chocar es el puerto publicado en el host (`-p 4321:4321`). En ese caso el error lo da Docker al arrancar el contenedor, no Astro, y se arregla cambiando solo el lado del host: `-p 8080:4321`. Esto no se probó.

### 3. Si un script depende del servidor, comprueba que arrancó

Como el código de salida es `0`, un script que arranca el servidor y sigue no se entera del fallo. Comprueba que el puerto responde antes de continuar:

```bash
node ./dist/server/entry.mjs &
sleep 2
curl -sf http://127.0.0.1:4321/ > /dev/null || { echo "El servidor no arrancó"; exit 1; }
```

## Troubleshooting

### `astro dev` arranca en el mismo puerto que otro servidor

En la prueba, con el servidor de producción en `0.0.0.0:4455` (solo IPv4), `astro dev --port 4455` no detectó el conflicto y mostró `Local http://localhost:4455/`. En Windows, `localhost` se resolvió a `::1` (IPv6), que es otra dirección: los dos procesos escuchaban en el puerto 4455, uno en IPv4 y otro en IPv6. Si abres `localhost` en el navegador, puede responder un proceso u otro. Revisa `netstat` si ves contenido inesperado.

### El contenedor arranca, pero el proxy da 502

Ese no es un puerto ocupado, sino un servidor que escucha solo en `localhost` dentro del contenedor: [Astro en Docker da 502 Bad Gateway](/blog/astro-node-docker-502-bad-gateway-host/).

### Límites de esta prueba

- Se ejecutó en Windows con Node 22.19, fuera de Docker. El comportamiento de las políticas de reinicio sale de la documentación de Docker, no de la prueba.
- El código de salida `0` se observó con `@astrojs/node` 10.1.3. Otras versiones del adaptador pueden manejar el error de otra forma.
