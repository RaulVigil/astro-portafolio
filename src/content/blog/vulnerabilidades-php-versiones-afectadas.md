---
title: "Vulnerabilidades de PHP 2026: versiones afectadas y parches"
description: "PHP2Shell y otras 27 fallas de 2026: la versión segura de cada rama, cómo comprobar el parche y qué código sigue expuesto tras actualizar."
slug: vulnerabilidades-php-versiones-afectadas
pubDate: 2026-10-24
tags: [php, seguridad, http]
draft: false
---

PHP lleva 29 advisories de seguridad publicados en 2026. Los dos últimos, del 21 de octubre, son ejecución remota de código sin autenticación con CVSS 9.2: CVE-2026-109618 y CVE-2026-109619, conocidos como PHP2Shell. Un tercero, CVE-2026-115560, todavía no tiene parche.

Si tu servidor corre una versión anterior a 8.2.35, 8.3.36, 8.4.27 u 8.5.12, le faltan esas correcciones. Y actualizar no lo cierra todo: el parche de las redirecciones HTTP deja pasar headers propios como `X-API-Key`, y las versiones del 21 de octubre traen regresiones que terminan procesos con código 137 o borran sesiones.

## El problema

Las advisories se publican en el [repositorio php/php-src](https://github.com/php/php-src/security/advisories). Cada versión de seguridad incluye las correcciones anteriores de su rama, así que hay una sola versión objetivo por rama:

| Rama | Versión con todos los parches (24/10/2026) | Soporte de seguridad hasta |
| --- | --- | --- |
| 8.2 | 8.2.35 | 31/12/2026 |
| 8.3 | 8.3.36 | 31/12/2027 |
| 8.4 | 8.4.27 | 31/12/2028 |
| 8.5 | 8.5.12 | 31/12/2029 |

PHP 8.1 y anteriores ya no reciben parches del proyecto, según la página de [versiones soportadas](https://www.php.net/supported-versions.php). Ubuntu y Debian sí portan las correcciones a sus paquetes (paso 1). A 8.2 le quedan dos meses de soporte: si vas a migrar, salta directo a 8.4 u 8.5.

Las 29 advisories, agrupadas por el código o la configuración que te expone:

| CVE | Severidad | Te afecta si… | Corregido en |
| --- | --- | --- | --- |
| [CVE-2026-109618](https://github.com/php/php-src/security/advisories/GHSA-w8hw-w9fx-j79w), [CVE-2026-109619](https://github.com/php/php-src/security/advisories/GHSA-6wmf-4rv5-p3rp) | Crítica | Sirves PHP en la web. El riesgo es mayor con mod_php, donde el ataque ocurre antes de que se ejecute tu código; el advisory también valida el RCE contra PHP-FPM | 8.2.35 · 8.3.36 · 8.4.27 · 8.5.12 |
| CVE-2026-115560 | Sin publicar | Cambias `session.serialize_handler` a `php` con `ini_set()` antes de `session_start()` y tienes activo el upload progress | Sin parche |
| [CVE-2026-91766](https://github.com/php/php-src/security/advisories/GHSA-fpwc-w8rq-cr92) | Media | Llamas APIs con `file_get_contents()` o `fopen()` y headers de credenciales (paso 4) | 8.2.34 · 8.3.35 · 8.4.26 · 8.5.11 |
| CVE-2026-93682 | Media | El mismo wrapper `http://` sigue una redirección con `Location` vacío | 8.2.34 · 8.3.35 · 8.4.26 · 8.5.11 |
| [CVE-2026-17543](https://github.com/php/php-src/security/advisories/GHSA-7qpv-r5mr-78m4) | Alta | Usas `pg_insert()`, `pg_update()`, `pg_select()` o `pg_delete()` con datos del usuario (paso 5) | 8.2.33 · 8.3.33 · 8.4.24 · 8.5.9 |
| CVE-2025-14179 | Alta | Usas PDO con Firebird (`pdo_firebird`) | 8.2.31 · 8.3.31 · 8.4.21 · 8.5.6 |
| CVE-2026-6722, CVE-2026-7261, CVE-2026-7262, CVE-2026-91765 | Alta y media | Expones un `SoapServer` | 8.2.34 · 8.3.35 · 8.4.26 · 8.5.11 |
| CVE-2025-14181 | Media | Un `SoapClient` habla con un servidor que no controlas o por HTTP sin TLS | 8.2.34 · 8.3.35 · 8.4.26 · 8.5.11 |
| CVE-2026-12184 | Alta | Pides URLs `https://` desde PHP-FPM: un certificado vencido o con otro nombre tira el proceso completo, con todos sus workers | 8.3.32 · 8.4.21 · 8.5.6 (el advisory no menciona 8.2) |
| CVE-2026-91769, CVE-2026-91767 | Media | Verificas certificados TLS con streams contra una CA privada o servidores de terceros | 8.2.34 · 8.3.35 · 8.4.26 · 8.5.11 |
| CVE-2026-91768, CVE-2026-6735 | Media | Usas `listen.allowed_clients` con IPv6 en PHP-FPM o expones su página de estado | 8.2.34 · 8.3.35 · 8.4.26 · 8.5.11 |
| [CVE-2026-17545](https://github.com/php/php-src/security/advisories/GHSA-9f67-6fw4-hpfp) | Media | PHP en Windows arma rutas con nombres que manda el cliente (paso 6) | 8.2.34 · 8.3.35 · 8.4.26 · 8.5.11 |
| CVE-2026-6103, CVE-2026-7260 | Media | Abres archivos TAR o phar que no controlas | 8.2.34 · 8.3.35 · 8.4.26 · 8.5.11 |
| CVE-2026-17544 | Alta | Pasas a `bccomp()` operandos o escala que vienen del usuario | 8.4.24 · 8.5.9 |
| CVE-2026-7263 | Alta | Llamas a `DOMNode::C14N()` con XML del usuario | 8.4.21 · 8.5.6 |
| Otras 8 | Baja y media | `urldecode()`, `mb_convert_encoding()`, `mb_ereg_search_init()`, `metaphone()`, filtros `convert.*`, `FILTER_SANITIZE_ENCODED`, `openssl_encrypt()` con AES-WRAP-PAD y `mysqlnd` contra un servidor no confiable | 8.2.34 · 8.3.35 · 8.4.26 · 8.5.11 |

Los dos advisories de PHP2Shell dicen lo mismo: la única corrección completa es actualizar. Tres cosas complican hacerlo bien:

- **`php -v` no siempre dice la verdad.** En Ubuntu 24.04, un servidor ya parcheado sigue mostrando PHP 8.3.6.
- **Una imagen de Docker construida antes del 21 de octubre conserva el PHP viejo** aunque el tag oficial ya apunte a la versión nueva.
- **La actualización trae regresiones propias.** Como pasó con [la regresión de Node 24.17 que rompió node-fetch](/blog/node-fetch-premature-close-node-24-17/), el parche de seguridad rompe código que antes funcionaba. Están en el Troubleshooting.

## La solución

Actualiza a la versión de la tabla, comprueba que la web la usa de verdad y, mientras no puedas actualizar, aplica las mitigaciones del advisory. Después revisa tres patrones de código que la actualización no resuelve del todo: credenciales en redirecciones, `pg_*` con datos del usuario y nombres de archivo en Windows.

Las pruebas de este artículo se hicieron con las imágenes oficiales `php:<versión>-cli` y `php:8.4.27-apache` de Docker, con `ubuntu:24.04` y con los binarios oficiales de PHP para Windows en Windows 11.

### 1. Comprueba qué PHP ejecuta tu web

`php -v` muestra la versión de la línea de comandos. Si el servidor tiene más de una versión instalada, esa no tiene por qué ser la que atiende la web. Sube este archivo, ábrelo en el navegador y bórralo al terminar:

```php
<?php
// public/version-php.php: bórralo en cuanto termines de revisar
header('Content-Type: text/plain; charset=utf-8');
echo 'PHP_VERSION: ', PHP_VERSION, "\n";
echo 'SAPI: ', PHP_SAPI, "\n";
echo 'php.ini: ', php_ini_loaded_file() ?: '(ninguno)', "\n";
echo 'session.upload_progress.enabled: ', var_export(ini_get('session.upload_progress.enabled'), true), "\n";
echo 'memory_limit: ', ini_get('memory_limit'), "\n";
```

Con la imagen `php:8.4.27-apache`:

```text
PHP_VERSION: 8.4.27
SAPI: apache2handler
php.ini: (ninguno)
session.upload_progress.enabled: '1'
memory_limit: 128M
```

`apache2handler` es mod_php, el caso de mayor riesgo para PHP2Shell. Con PHP-FPM aparece `fpm-fcgi`. El valor de `session.upload_progress.enabled` sirve para el paso 3.

**Ubuntu y Debian.** Los paquetes de la distribución aplican el parche sin cambiar el número de versión de PHP. En Ubuntu 24.04 con el paquete ya corregido:

```text
$ php -v | head -1
PHP 8.3.6 (cli) (built: Oct 19 2026 15:16:58) (NTS)
$ apt list --installed 2>/dev/null | grep php8.3-common
php8.3-common/noble-updates,noble-security,now 8.3.6-0ubuntu0.24.04.13 amd64 [installed,automatic]
```

Lo que importa es la versión del paquete. Compárala con la que el [tracker de Ubuntu](https://ubuntu.com/security/CVE-2026-109618) o el de [Debian](https://security-tracker.debian.org/tracker/CVE-2026-109618) marcan como corregida para CVE-2026-109618:

| Distribución | Paquete | Versión corregida |
| --- | --- | --- |
| Ubuntu 26.04 LTS | php8.5 | 8.5.4-0ubuntu1.5 |
| Ubuntu 24.04 LTS | php8.3 | 8.3.6-0ubuntu0.24.04.13 |
| Ubuntu 22.04 LTS | php8.1 | 8.1.2-1ubuntu2.28 |
| Debian 13 (trixie) | php8.4 | 8.4.27-1~deb13u1 |
| Debian 12 (bookworm) | php8.2 | 8.2.35-1~deb12u1 |

**Docker.** Los tags flotantes de la imagen oficial, como `php:8.4-apache`, `php:8.4-fpm-alpine` o `php:latest`, se actualizaron entre el 22 y el 24 de octubre. Una imagen tuya construida antes sigue con el PHP viejo. Pregúntale a la imagen, no al Dockerfile:

```bash
docker run --rm php:8.4-fpm-alpine php -v
```

```text
PHP 8.4.27 (cli) (built: Oct 21 2026 22:52:58) (NTS)
```

Con el nombre de tu imagen en lugar de `php:8.4-fpm-alpine`, el mismo comando muestra qué PHP quedó adentro.

### 2. Actualiza a la versión segura de tu rama

En Ubuntu y Debian, actualiza los paquetes y reinicia el servicio que ejecuta PHP. Los workers que ya estaban corriendo siguen con el código anterior hasta que se reinician:

```bash
sudo apt update && sudo apt upgrade
sudo systemctl restart php8.3-fpm   # o apache2, si usas mod_php
```

En Docker, fija el tag exacto para que el cambio de versión sea una decisión tuya, y reconstruye con `--pull` para no reutilizar una capa vieja:

```dockerfile
# Dockerfile
FROM php:8.4.27-apache
```

```bash
docker build --pull -t mi-app .
```

Si compilas PHP o usas 8.1 o anteriores sin un paquete de distribución detrás, no hay parche oficial. La salida es migrar de rama.

### 3. Aplica las mitigaciones mientras tanto

El advisory de CVE-2026-109619 propone desactivar el upload progress de sesiones y, si no usas esa función, dejarlo desactivado incluso después de actualizar. La misma configuración bloquea CVE-2026-115560, que aún no tiene parche, y en la prueba también evitó una de las regresiones de 8.4.27 (ver Troubleshooting).

Tiene que configurarse a nivel de servidor (`php.ini` o `conf.d`) y requiere reiniciar los workers. `.user.ini` no basta: según el advisory, se aplica después de la inicialización normal de la petición, y el upload progress se procesa antes, como muestra el [issue #24493](https://github.com/php/php-src/issues/24493).

En Ubuntu con PHP-FPM:

```ini
; /etc/php/8.3/fpm/conf.d/99-seguridad.ini
session.upload_progress.enabled=0
```

```bash
sudo systemctl restart php8.3-fpm
```

En Docker:

```dockerfile
# Dockerfile
FROM php:8.4.27-apache
RUN echo "session.upload_progress.enabled=0" > /usr/local/etc/php/conf.d/99-seguridad.ini
```

El script del paso 1 lo confirma:

```text
PHP_VERSION: 8.4.27
SAPI: apache2handler
php.ini: (ninguno)
session.upload_progress.enabled: '0'
memory_limit: 128M
```

Los advisories mencionan otras medidas, todas parciales:

- **PHP 8.5:** `fatal_error_backtraces=0` quita la pieza que usa el RCE confirmado de CVE-2026-109619.
- **CVE-2026-109618:** la mitigación principal de configuración es `memory_limit=-1`, y el propio advisory aclara que no es completa. Sin límite, un solo proceso puede consumir toda la RAM, así que necesita un límite de memoria del contenedor o del cgroup. El advisory desaconseja `RLIMIT_AS` y `RLIMIT_DATA`, porque activan justo el camino vulnerable.
- **Límites de entrada:** un `post_max_size` conservador, el tamaño de las peticiones limitado también en el servidor web, un `max_input_nesting_level` más bajo y peticiones `multipart/form-data` bloqueadas si la aplicación no recibe archivos.

### 4. No mandes credenciales con redirecciones automáticas

Por defecto, `file_get_contents()` sigue las redirecciones. Antes de 8.2.34, 8.3.35, 8.4.26 y 8.5.11, el wrapper `http://` reenviaba `Authorization`, `Cookie` y `Proxy-Authorization` aunque la redirección llevara a otro host, a otro puerto o de HTTPS a HTTP ([CVE-2026-91766](https://github.com/php/php-src/security/advisories/GHSA-fpwc-w8rq-cr92)). Un servidor que controle la redirección se queda con el token.

Para reproducirlo, este router responde un 302 en `/redirige` y, en cualquier otra ruta, devuelve las credenciales que recibió:

```php
<?php
// router.php: /redirige?a=<url> responde 302; /captura devuelve las credenciales que llegaron
$ruta = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($ruta === '/redirige') {
    header('Location: ' . $_GET['a'], true, 302);
    exit;
}
$h = array_change_key_case(getallheaders(), CASE_LOWER);
header('Content-Type: application/json');
echo json_encode([
    'authorization' => $h['authorization'] ?? null,
    'cookie' => $h['cookie'] ?? null,
    'x-api-key' => $h['x-api-key'] ?? null,
]);
```

El cliente llama a una API con tres credenciales y prueba tres destinos. Otro puerto ya cuenta como otro origen:

```php
<?php
// cliente.php: llama a una API con file_get_contents y credenciales en headers
$ctx = stream_context_create(['http' => ['header' => [
    'Authorization: Bearer token-secreto',
    'Cookie: sesion=abc123',
    'X-API-Key: clave-api-123',
]]]);
$casos = [
    'mismo origen'      => 'http://127.0.0.1:8001/redirige?a=/captura',
    'otro puerto'       => 'http://127.0.0.1:8001/redirige?a=http://127.0.0.1:8002/captura',
    'otro host'         => 'http://127.0.0.1:8001/redirige?a=http://localhost:8001/captura',
];
echo 'PHP ', PHP_VERSION, "\n";
foreach ($casos as $caso => $url) {
    printf("  %-13s %s\n", $caso, file_get_contents($url, false, $ctx));
}
```

```bash
php -S 0.0.0.0:8001 router.php &
php -S 0.0.0.0:8002 router.php &
php cliente.php
```

```text
PHP 8.4.25
  mismo origen  {"authorization":"Bearer token-secreto","cookie":"sesion=abc123","x-api-key":"clave-api-123"}
  otro puerto   {"authorization":"Bearer token-secreto","cookie":"sesion=abc123","x-api-key":"clave-api-123"}
  otro host     {"authorization":"Bearer token-secreto","cookie":"sesion=abc123","x-api-key":"clave-api-123"}
PHP 8.4.26
  mismo origen  {"authorization":"Bearer token-secreto","cookie":"sesion=abc123","x-api-key":"clave-api-123"}
  otro puerto   {"authorization":null,"cookie":null,"x-api-key":"clave-api-123"}
  otro host     {"authorization":null,"cookie":null,"x-api-key":"clave-api-123"}
```

El parche quita los tres headers que reconoce como credenciales. `X-API-Key` sigue llegando al otro origen, porque PHP no sabe que es una credencial. Con la misma redirección y los mismos headers, los demás clientes HTTP se comportan igual:

| Cliente | `Authorization` | `Cookie` | `X-API-Key` |
| --- | --- | --- | --- |
| `file_get_contents()` en PHP 8.4.25 | Se reenvía | Se reenvía | Se reenvía |
| `file_get_contents()` en PHP 8.4.26 | Se quita | Se quita | Se reenvía |
| cURL (libcurl 8.14.1) | Se quita | Se quita | Se reenvía |
| Guzzle 8.3.0 | Se quita | Se quita | Se reenvía |
| `Http` de Laravel (illuminate/http 13.38.0) | Se quita | Se quita | Se reenvía |

cURL, Guzzle y Laravel no pasan por el wrapper de PHP, así que dieron el mismo resultado en 8.4.25 y 8.4.26. Si tu API usa un header propio para la clave, ninguno lo protege.

La solución más simple es no seguir redirecciones en las llamadas que llevan credenciales. En Guzzle es `'allow_redirects' => false`, y en Laravel, `withoutRedirecting()`:

```php
<?php
// sin_redir.php: desactivar redirecciones en Guzzle y Laravel
require __DIR__ . '/vendor/autoload.php';
$url = 'http://127.0.0.1:8001/redirige?a=http://127.0.0.1:8002/captura';
$r = (new GuzzleHttp\Client())->get($url, ['headers' => ['X-API-Key' => 'clave-api-123'], 'allow_redirects' => false]);
printf("Guzzle allow_redirects=false: %d %s\n", $r->getStatusCode(), $r->getHeaderLine('Location'));
$r = (new Illuminate\Http\Client\Factory())->withHeaders(['X-API-Key' => 'clave-api-123'])->withoutRedirecting()->get($url);
printf("Laravel withoutRedirecting(): %d %s\n", $r->status(), $r->header('Location'));
```

```text
Guzzle allow_redirects=false: 302 http://127.0.0.1:8002/captura
Laravel withoutRedirecting(): 302 http://127.0.0.1:8002/captura
```

Dentro de una aplicación Laravel, lo mismo se escribe `Http::withHeaders([...])->withoutRedirecting()->get($url)`.

Si usas `file_get_contents()` y necesitas seguir redirecciones, hazlo a mano. Esta función deja de enviar todos los headers en cuanto la cadena sale del origen inicial, también en los saltos siguientes, y solo sigue redirecciones `http://` y `https://`:

```php
<?php
// src/Http/http_seguro.php

/**
 * GET con redirecciones manuales. En cuanto una redirección cambia de origen
 * (esquema, host o puerto), deja de enviar los headers recibidos, también en
 * los saltos siguientes. Solo sigue redirecciones http:// y https://.
 */
function get_seguro(string $url, array $headers, int $maxRedirecciones = 5): string
{
    $origenInicial = origen($url);
    $mismoOrigen = true;

    for ($i = 0; $i <= $maxRedirecciones; $i++) {
        $mismoOrigen = $mismoOrigen && origen($url) === $origenInicial;
        $enviar = $mismoOrigen ? $headers : [];

        $ctx = stream_context_create(['http' => [
            'header' => array_map(fn ($k, $v) => "$k: $v", array_keys($enviar), $enviar),
            'follow_location' => 0,
            'ignore_errors' => true,
        ]]);

        $fp = fopen($url, 'r', false, $ctx);
        if ($fp === false) {
            throw new RuntimeException("No se pudo abrir $url");
        }
        $cuerpo = stream_get_contents($fp);
        $respuesta = stream_get_meta_data($fp)['wrapper_data'];
        fclose($fp);

        $estado = (int) explode(' ', $respuesta[0])[1];
        if ($estado < 300 || $estado > 399) {
            return $cuerpo;
        }

        $location = null;
        foreach ($respuesta as $linea) {
            if (stripos($linea, 'Location:') === 0) {
                $location = trim(substr($linea, 9));
            }
        }
        if ($location === null) {
            throw new RuntimeException("Redirección $estado sin Location");
        }

        $siguiente = str_starts_with($location, '/') ? origen($url) . $location : $location;
        if (!in_array(parse_url($siguiente, PHP_URL_SCHEME), ['http', 'https'], true)) {
            throw new RuntimeException("Redirección no permitida: $location");
        }
        $url = $siguiente;
    }

    throw new RuntimeException('Demasiadas redirecciones');
}

function origen(string $url): string
{
    $p = parse_url($url);
    $esquema = strtolower($p['scheme'] ?? '');
    $puerto = $p['port'] ?? ($esquema === 'https' ? 443 : 80);

    return $esquema . '://' . strtolower($p['host'] ?? '') . ':' . $puerto;
}
```

Con los mismos servidores, más un caso que sale del origen y vuelve (`8001 → 8002 → 8001`) y otro que redirige a `file:///etc/passwd`:

```text
PHP 8.4.25
  mismo origen  {"authorization":"Bearer token-secreto","cookie":"sesion=abc123","x-api-key":"clave-api-123"}
  otro puerto   {"authorization":null,"cookie":null,"x-api-key":null}
  otro host     {"authorization":null,"cookie":null,"x-api-key":null}
  ida y vuelta  {"authorization":null,"cookie":null,"x-api-key":null}
  file://       RuntimeException: Redirección no permitida: file:///etc/passwd
```

En 8.4.27 la salida fue idéntica, así que la función también protege a quien todavía no puede actualizar. Tiene dos límites: solo hace `GET`, y rechaza un `Location` relativo que no empiece con `/`.

### 5. Usa consultas con parámetros en PostgreSQL

`pg_insert()`, `pg_update()`, `pg_select()` y `pg_delete()` escapan los valores dentro de una cadena `E'...'`. Desde PostgreSQL 9.1, `standard_conforming_strings` está activo por defecto y, con esa configuración, el escape no protege la barra invertida. Un valor con `\'` cierra la cadena ([CVE-2026-17543](https://github.com/php/php-src/security/advisories/GHSA-7qpv-r5mr-78m4)). `PGSQL_DML_STRING` devuelve el SQL generado en lugar de ejecutarlo, y sirve para verlo:

```php
<?php
// pg_select.php: búsqueda de usuarios por nombre con pg_select()
$db = pg_connect(getenv('PG_CONN'));
pg_query($db, 'DROP TABLE IF EXISTS usuarios');
pg_query($db, 'CREATE TABLE usuarios (id serial PRIMARY KEY, nombre text, email text)');
foreach (['ana' => 'ana@ejemplo.com', 'luis' => 'luis@ejemplo.com', 'marta' => 'marta@ejemplo.com'] as $n => $e) {
    pg_insert($db, 'usuarios', ['nombre' => $n, 'email' => $e]);
}

$nombre = $argv[1]; // en una app real, $_GET['nombre']

echo 'PHP ', PHP_VERSION, ' | standard_conforming_strings=', pg_parameter_status($db, 'standard_conforming_strings'), "\n";
echo 'SQL: ', pg_select($db, 'usuarios', ['nombre' => $nombre], PGSQL_DML_STRING), "\n";
$filas = pg_select($db, 'usuarios', ['nombre' => $nombre]);
echo 'pg_select: ', $filas === false ? 'false (' . pg_last_error($db) . ')' : count($filas) . ' filas', "\n";

$r = pg_query_params($db, 'SELECT * FROM usuarios WHERE nombre = $1', [$nombre]);
echo 'pg_query_params: ', pg_num_rows($r), " filas\n";
```

Contra PostgreSQL 17, con `PG_CONN` apuntando a una base de pruebas:

```bash
php pg_select.php "zzz\' OR 1=1 --"
```

```text
PHP 8.4.23 | standard_conforming_strings=on
SQL: SELECT * FROM "usuarios" WHERE "nombre"=E'zzz\'' OR 1=1 --';
pg_select: 3 filas
pg_query_params: 0 filas

PHP 8.4.24 | standard_conforming_strings=on
SQL: SELECT * FROM "usuarios" WHERE "nombre"='zzz\'' OR 1=1 --';
pg_select: 0 filas
pg_query_params: 0 filas
```

En 8.4.23, la `\` escapa la primera comilla, la segunda cierra la cadena y `OR 1=1` devuelve toda la tabla. Con `pg_delete()` y el mismo valor, el resultado es peor:

```php
<?php
// pg_delete.php: borrar un usuario por nombre con pg_delete()
$db = pg_connect(getenv('PG_CONN'));
pg_query($db, 'DROP TABLE IF EXISTS usuarios');
pg_query($db, 'CREATE TABLE usuarios (id serial PRIMARY KEY, nombre text)');
foreach (['ana', 'luis', 'marta'] as $n) {
    pg_insert($db, 'usuarios', ['nombre' => $n]);
}
pg_delete($db, 'usuarios', ['nombre' => $argv[1]]);
echo 'PHP ', PHP_VERSION, ': quedan ', pg_fetch_result(pg_query($db, 'SELECT count(*) FROM usuarios'), 0, 0), " de 3 filas\n";
```

```text
PHP 8.4.23: quedan 0 de 3 filas
PHP 8.4.24: quedan 3 de 3 filas
```

8.4.24 corrige el escape, y con `pg_query_params()` la consulta es segura en las dos versiones, porque el valor viaja separado del SQL. Actualiza y, en el código que recibe datos del usuario, cambia las funciones `pg_*` de conveniencia por `pg_query_params()` o por sentencias preparadas de PDO, que según [Red Hat](https://access.redhat.com/security/cve/CVE-2026-17543) no están afectadas.

### 6. En Windows, genera tú el nombre del archivo subido

En Windows, `CON`, `AUX`, `NUL`, `COM1` a `COM9` y `LPT1` a `LPT9` son nombres de dispositivo. Antes de 8.2.34, 8.3.35, 8.4.26 y 8.5.11, PHP no los rechazaba dentro de una ruta ([CVE-2026-17545](https://github.com/php/php-src/security/advisories/GHSA-9f67-6fw4-hpfp)), y el advisory describe peticiones bloqueadas que agotan los workers. Este es el patrón de upload que expone:

```php
<?php
// public/subir.php: el patrón inseguro típico, guardar con el nombre que manda el cliente
$destino = 'uploads/' . $_FILES['archivo']['name'];
$t = microtime(true);
$ok = move_uploaded_file($_FILES['archivo']['tmp_name'], $destino);
printf("%s -> %s en %.2fs %s\n", $destino, var_export($ok, true), microtime(true) - $t, error_get_last()['message'] ?? '');
```

```bash
php -S 127.0.0.1:8000
curl -F "archivo=@foto.txt;filename=CON" http://127.0.0.1:8000/subir.php
```

En la prueba, en Windows 11, el bloqueo no se reprodujo. Pasó otra cosa. Con PHP 8.5.10:

```text
uploads/foto.jpg -> true en 0.00s
uploads/CON -> true en 0.00s
uploads/AUX -> true en 0.00s
uploads/COM1 -> true en 0.00s
uploads/NUL -> true en 0.00s
```

`CON`, `AUX` y `COM1` quedaron en disco como archivos normales, que después no se pueden borrar de la forma habitual (último error del Troubleshooting). `NUL` no se guardó: el contenido se fue al dispositivo nulo y aun así `move_uploaded_file()` devolvió `true`. La aplicación cree que guardó un archivo que no existe.

Con 8.5.11, los cuatro nombres reservados fallan:

```text
Warning:  move_uploaded_file(uploads/CON): Failed to open stream: No such file or directory in <proyecto>\subir.php on line 5
```

Los nombres reservados con extensión, como `con.txt` o `COM1.png`, se guardaron como archivos normales en las dos versiones.

Actualizar evita el problema del dispositivo, pero lo correcto es que el nombre en disco nunca venga del cliente:

```php
<?php
// public/subir.php
$permitidas = ['jpg' => 'jpg', 'jpeg' => 'jpg', 'png' => 'png', 'pdf' => 'pdf'];

$original = $_FILES['archivo']['name'] ?? '';
$ext = strtolower(pathinfo($original, PATHINFO_EXTENSION));
if (!isset($permitidas[$ext])) {
    http_response_code(422);
    exit("Tipo de archivo no permitido: $ext\n");
}

// El nombre en disco lo genera el servidor; el original solo se guarda como dato
$nombre = bin2hex(random_bytes(16)) . '.' . $permitidas[$ext];
if (!move_uploaded_file($_FILES['archivo']['tmp_name'], __DIR__ . '/uploads/' . $nombre)) {
    http_response_code(500);
    exit("No se pudo guardar el archivo\n");
}

echo "Guardado como $nombre\n";
```

Con PHP 8.5.10, la versión vulnerable:

```text
CON       -> HTTP 422 Tipo de archivo no permitido:
CON.jpg   -> HTTP 200 Guardado como bf08b52f1fedb24178d35a4bc51a976f.jpg
AUX.png   -> HTTP 200 Guardado como bf4f1f6e487253ef13b1bd71a0237e72.png
foto.JPG  -> HTTP 200 Guardado como 116aecfa1ce4ade066c6f62a0fd65abb.jpg
```

La extensión indica qué tipo declara el cliente, no qué contiene el archivo. Si eso importa, valida también el contenido, por ejemplo con `finfo_file()`.

## Troubleshooting

### `Hard memory limit of 268435456 bytes exhausted` y el proceso sale con código 137

Después de actualizar, algunos errores de memoria dejan de ser un fatal normal:

```php
<?php
// sprintf.php: relleno enorme con sprintf() (php-src#24492)
register_shutdown_function(fn () => fwrite(STDERR, "shutdown ejecutado\n"));
sprintf('%400000000s', '');
```

```text
# php -d memory_limit=128M sprintf.php en 8.4.26 (código de salida 255)
Fatal error: Allowed memory size of 134217728 bytes exhausted (tried to allocate 503316512 bytes) in /app/sprintf.php on line 4
shutdown ejecutado

# en 8.4.27 (código de salida 137)
Hard memory limit of 268435456 bytes exhausted (tried to allocate 503320576 bytes) in /app/sprintf.php on line 4
```

El parche de PHP2Shell añade un límite duro de memoria, el doble de `memory_limit` por defecto según el [issue #24492](https://github.com/php/php-src/issues/24492). Algunas funciones todavía piden memoria de una forma que no admite fallar, y al cruzar ese límite PHP termina el proceso con `_exit(137)`. El issue menciona el relleno de `sprintf()`, `pack()`, `number_format()`, `bin2hex()`, `base64_encode()` y `urlencode()`, entre otras. En la prueba, 8.3.36 se comportó igual que 8.4.27.

Dos consecuencias prácticas. Las funciones de shutdown no se ejecutan, así que Sentry o el manejador de errores de Laravel no registran nada. Y el código 137 en Docker o Kubernetes parece un OOM kill del kernel, aunque aquí quien termina el proceso es PHP.

El issue sigue abierto. Mientras tanto, limita los tamaños que vienen del usuario antes de que lleguen a esas funciones (anchos de `sprintf()`, decimales de `number_format()`) y busca `Hard memory limit` en los logs. En la prueba, `-d memory_hard_limit_percent=1000` devolvió el fatal capturable, pero esa directiva no aparece en el `php.ini-production` de 8.4.27 y deja que un proceso use hasta diez veces `memory_limit`. No la uses como arreglo.

### `zend_mm_heap corrupted` con SimpleXML después de actualizar

```php
<?php
// simplexml.php: SimpleXMLElement dentro de un ciclo que recoge el GC (php-src#24488)
for ($i = 0; $i < 2; $i++) {
    $xml = new SimpleXMLElement('<a><b/></a>');
    get_object_vars($xml);
    $holder = new stdClass;
    $holder->xml = $xml;
    $holder->self = $holder;
    unset($xml, $holder);
    gc_collect_cycles();
    $junk[] = str_repeat('x', 100);
}
echo "done\n";
```

En 8.4.26 y 8.3.36 imprime `done`. En 8.4.27 el proceso muere con código 139 sin imprimir nada. Si se cambia `get_object_vars($xml)` por `json_decode(json_encode($xml), true)` o por `(array) $xml`, el error es otro:

```text
zend_mm_heap corrupted
```

El fallo aparece cuando se convierten las propiedades de un `SimpleXMLElement` en array y ese objeto queda dentro de un ciclo de referencias que recoge el garbage collector. Recorrerlo con `children()` o leer `(string) $xml->campo` no lo provoca. El [issue #24488](https://github.com/php/php-src/issues/24488) lo reporta también en 8.5.12. La corrección ([commit f963484](https://github.com/php/php-src/commit/f9634847258a8c3ed6c12bb79104eba60bb631ea)) ya está en la rama PHP-8.4, después de 8.4.27, y saldrá en la próxima versión. Hasta entonces, evita `json_encode()`, `(array)` y `get_object_vars()` sobre objetos SimpleXML que puedan quedar en un ciclo. No vuelvas a 8.4.26: tiene abierto PHP2Shell.

### `Failed to decode session object. Session has been destroyed` y usuarios deslogueados

```text
Warning:  PHP Request Startup: Failed to decode session object. Session has been destroyed in Unknown on line 0
```

En 8.4.27 y 8.5.12, el manejador de upload progress lee la sesión en un modo estricto antes de que arranque tu código. Si la sesión guarda un objeto con una propiedad llamada `__PHP_Incomplete_Class_Name`, `__PHP_Incomplete_Class_Serialized` o `__PHP_Incomplete_Enum_Case`, borra la sesión completa ([issue #24493](https://github.com/php/php-src/issues/24493)). Basta con guardar en sesión el `json_decode()` de un JSON que manda el cliente.

En la prueba, la sesión tenía `usuario` y `prefs`, con `prefs = json_decode('{"__PHP_Incomplete_Class_Name":"x"}')`. Después de un POST `multipart/form-data` con el campo `PHP_SESSION_UPLOAD_PROGRESS`, en 8.4.26 la sesión siguió intacta y en 8.4.27 quedó vacía. Con `session.upload_progress.enabled=0` (paso 3), 8.4.27 conservó la sesión.

### `php -v` dice 8.3.6 y el escáner marca el servidor como vulnerable

En Ubuntu 24.04 es normal: el parche llega como `8.3.6-0ubuntu0.24.04.13` sin cambiar la versión de PHP, y un escáner que solo compara el número de versión lo marca como vulnerable. Comprueba la versión del paquete (paso 1) y, si coincide con la corregida, documenta el falso positivo.

### `X-API-Key` sigue llegando al otro dominio después de actualizar

Es el comportamiento esperado del parche: 8.4.26 solo quita `Authorization`, `Cookie` y `Proxy-Authorization` (paso 4). cURL, Guzzle y Laravel tampoco quitan headers propios. Desactiva las redirecciones en las llamadas con credenciales o usa `get_seguro()`.

### En Windows no se puede borrar `uploads\CON`

Si la versión vulnerable ya guardó archivos con nombres reservados, después de actualizar PHP no puede borrarlos:

```text
unlink(<proyecto>/uploads/CON): Permission denied
```

En la prueba, `Remove-Item` de PowerShell respondió que la ruta no existía y `del` sin prefijo dio `El nombre de archivo, el nombre de directorio o la sintaxis de la etiqueta del volumen no son correctos.` Con el prefijo `\\?\`, que le indica a Windows que no interprete la ruta, `del` desde `cmd` sí los borra:

```bat
del "\\?\C:\ruta\al\proyecto\uploads\CON"
```

## Referencias

- [Advisories de seguridad de php/php-src](https://github.com/php/php-src/security/advisories): las 29 de 2026, con versiones afectadas y corregidas.
- [Noticias de php.net de 2026](https://www.php.net/archive/2026.php): la versión del 21 de octubre y el aviso del 23 de octubre sobre CVE-2026-115560.
- [Versiones soportadas de PHP](https://www.php.net/supported-versions.php).
- [Ubuntu: CVE-2026-109618](https://ubuntu.com/security/CVE-2026-109618) y [Debian: CVE-2026-109618](https://security-tracker.debian.org/tracker/CVE-2026-109618): versiones corregidas de los paquetes.
- Regresiones de 8.4.27 y 8.5.12: [#24488](https://github.com/php/php-src/issues/24488), [#24492](https://github.com/php/php-src/issues/24492) y [#24493](https://github.com/php/php-src/issues/24493).
