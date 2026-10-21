---
name: nuevo-articulo
description: Crea un artículo nuevo para el blog Prompt & Patch (raulo.dev/blog), a partir de material real del autor o investigando problemas reales en repositorios públicos (issues de GitHub, release notes), siempre reproduciéndolos antes de escribir. Verifica los datos técnicos, escribe el borrador con la estructura obligatoria, valida los metadatos SEO y lo deja en src/content/blog como borrador, con los pasos para publicarlo. Usar cuando el usuario quiera escribir, redactar, investigar o preparar un artículo o post nuevo para el blog.
---

# Nuevo artículo — Prompt & Patch

Antes de escribir una sola línea, lee completas:

- `.github/skills/tech-writer-anti-ai/SKILL.md`: voz, estructura obligatoria, frases prohibidas.
- `.github/skills/seo-technical-strategist/SKILL.md`: keyword long-tail, límites de metadatos.

## 1. Material real (sin esto no se escribe)

Hay dos modos. Si el usuario no dice cuál, pregúntale si tiene material propio o si quiere que investigues un tema.

### Modo A: material del autor

Si el usuario no lo dio al invocar la skill, pídelo en **un solo mensaje**:

1. **El síntoma exacto:** mensaje de error literal, comportamiento observable o cifra.
2. **Contexto:** stack, versiones y entorno (local, producción, hosting).
3. **La solución que funcionó:** código real, o qué archivos del repo la contienen.
4. **Lo que se intentó y falló**, y por qué.
5. **Errores secundarios o límites** encontrados en el camino; alimentan el Troubleshooting.

Si faltan el 1, el 3 o el 4, vuelve a pedirlos. **Nunca inventes** experiencias, cifras, benchmarks, versiones ni mensajes de error. El blog se monetiza con AdSense y vive de contenido original verificable.

### Modo B: investigación (sin material del autor)

El material sale de una **reproducción propia** de un problema real y público. Un resumen de lo que otros escribieron no sirve: eso es contenido sin valor propio, justo lo que Google trata como *scaled content abuse* y AdSense rechaza como "contenido de poco valor".

1. **Buscar candidatos con demanda real**, del stack del blog (Astro, React, Node.js, Tailwind, Vite, APIs, automatización):
   - Issues de GitHub cerrados con solución, de versiones recientes, con muchas reacciones, comentarios o duplicados. Por ejemplo, con la API pública (sin token: unas 10 búsquedas por minuto). Ajusta `created:` a los últimos 6–12 meses; sin ese filtro salen issues de versiones viejas:
     ```bash
     curl -s "https://api.github.com/search/issues?q=repo:withastro/astro+is:issue+is:closed+comments:>5+created:>2026-01-01&sort=reactions&per_page=10"
     ```
   - Guías de migración y release notes con *breaking changes* recientes.
   - Preguntas de Stack Overflow muy vistas, con respuestas desactualizadas.
2. **Presentar 3–5 candidatos** y **esperar a que el usuario elija**. Para cada uno: el problema, la fuente con enlace, la señal de demanda, la versión afectada y si ya existe buen contenido en español.
3. **Reproducir antes de escribir. Es obligatorio.**
   - Proyecto mínimo en un directorio temporal, **fuera del repo del blog**, con las versiones afectadas.
   - Provoca el error, captura el mensaje literal de tu propia ejecución, aplica la solución y verifica que funciona. Borra el directorio al terminar.
   - Si no se puede reproducir (cuenta de pago, hardware, servicio externo), descarta el tema o díselo claramente al usuario antes de seguir.
4. **Aportar algo que la fuente no tiene:** la reproducción mínima, la causa explicada, qué versiones afecta, alternativas o un troubleshooting más completo.
5. **Voz y fuentes:**
   - Sin primera persona sobre experiencias que no ocurrieron. Escribe "al reproducirlo con Astro 6.4…" o "en la prueba…".
   - Cita con enlace el issue, PR o documentación de origen.
   - No copies texto ni bloques largos de código de la fuente: escribe código propio y respeta las licencias (citas breves, con atribución).
6. **Ritmo:** calidad antes que volumen, de 1 a 3 artículos por semana. Nunca generar artículos en lote.

## 2. Verificar antes de redactar

- **Versiones:** si el código vive en este repo, compruébalas en `package.json` o `node_modules/<paquete>/package.json`.
- **APIs, opciones y mensajes de error:** contrástalos con la documentación oficial (Context7 si está disponible) o con el código fuente en `node_modules`.
- **Código:** si se puede ejecutar en local sin efectos externos (no enviar correos, no cobrar, no escribir en producción), ejecútalo.
- Lo que no se pueda verificar se presenta como observación del autor ("en este proyecto…"), nunca como regla general, o se omite.

## 3. Keyword y metadatos (confirmar con el usuario)

Lista lo que ya existe, leyendo **solo el frontmatter** (los artículos tienen ejemplos de YAML en el cuerpo):

```bash
for f in src/content/blog/[!_]*.md; do echo "== $f"; sed -n '2,/^---$/p' "$f" | grep -E '^(slug|tags|draft):'; done
```

Propón y **espera la confirmación del usuario** antes de escribir el cuerpo:

- **Keyword principal** long-tail: lo que el lector escribiría en Google.
- **`title`:** ≤ 60 caracteres, con la keyword al inicio. Es también el H1.
- **`description`:** ≤ 150 caracteres, con el dolor del lector y lo que se lleva.
- **`slug`:** kebab-case con la keyword, sin fechas. **No se puede cambiar después de publicar.**
- **`tags`:** de 1 a 5, en minúsculas, reutilizando los existentes.

Si hay búsqueda web disponible, revisa los 5 primeros resultados para la keyword y di qué aportaría este artículo que ellos no tienen.

## 4. Escribir

- Archivo: `src/content/blog/<slug>.md`, con nombre igual al slug, partiendo de `src/content/blog/_plantilla.md`.
- Frontmatter: `pubDate` con la fecha de hoy (`YYYY-MM-DD`) y **`draft: true`**.
- Estructura: síntoma en la primera línea → `## El problema` → `## La solución` (pasos como `### 1. …`) → `## Troubleshooting` (un `###` por error: mensaje literal → causa → arreglo).
- Código:
  - Siempre con el lenguaje en el fence.
  - Primera línea con un comentario de la ruta del archivo.
  - Salidas y errores en bloques `text`.
- Enlaces internos a 1–3 artículos relacionados, como `/blog/<slug>/` con barra final. Solo a artículos con `draft: false`, o que se publiquen al mismo tiempo; si no, el enlace da 404 en producción.

## 5. Validar

1. Cuenta caracteres de `title` y `description`. El esquema hace fallar el build si se pasan.
2. Busca frases prohibidas. No debe imprimir nada; si imprime algo, reescribe ese párrafo completo:
   ```bash
   grep -niE "vertiginoso|cambiante mundo|era digital|lleg[oó] para quedarse|el futuro es ahora|sin m[aá]s pre[aá]mbulos|manos a la obra|vamos a ello|es importante (destacar|mencionar)|cabe resaltar|papel crucial|desbloquear el potencial|sum[eé]rgete|siguiente nivel|en conclusi[oó]n|alguna vez te has preguntado" src/content/blog/<slug>.md
   ```
3. Haz un build de prueba **sin tocar el `dist/` del usuario**:
   ```bash
   pnpm astro build --outDir node_modules/.cache/pp-build-check && rm -rf node_modules/.cache/pp-build-check
   ```
   El `outDir` va dentro del proyecto: fuera de él, el prerender no encuentra `node_modules`.
4. Para la vista previa, el usuario abre `http://localhost:4321/blog/<slug>/` con `pnpm dev` (los borradores solo se ven en dev). Si tú inicias `pnpm dev` en segundo plano, al terminar **cierra también el proceso `node` de ese puerto**: en Windows, detener la tarea no siempre lo cierra.

## 6. Entregar

Resume en pocas líneas:

- El archivo creado, la keyword, el título, el slug y la description.
- Qué se verificó y cómo, y qué queda como afirmación del autor.
- Que el autor revise la voz antes de publicar: el artículo va firmado por él.

## Publicar (solo cuando el autor lo apruebe)

1. Cambiar a `draft: false` en el frontmatter.
2. `pnpm build`.
3. Comprimir **solo el contenido de `dist/client`**. Nunca `dist/server` ni la carpeta `dist` completa, que pueden contener código de servidor. Usar el `tar` de Windows: `Compress-Archive` de PowerShell 5.1 crea rutas con `\` que cPanel extrae mal.
   ```bash
   cd dist/client && /c/Windows/System32/tar.exe -a -c -f ../../raulo-deploy.zip * && cd ../..
   ```
4. En cPanel → `public_html`: subir el zip → **Extract** en `/public_html` → **borrar el zip**. No borrar `.htaccess`, `.well-known` ni `_astro` antes de extraer.
5. Google Search Console (propiedad de dominio `raulo.dev`) → **Inspección de URLs** → la URL nueva → **Solicitar indexación**, una sola vez. El RSS ya está enviado como sitemap, así que Google también la descubre solo.
6. Cuando el usuario lo pida, hacer commit del artículo con un mensaje como `feat(blog): publica "<título>"`.
