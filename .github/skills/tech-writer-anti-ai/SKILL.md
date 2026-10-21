---
name: tech-writer-anti-ai
description: Guía de redacción técnica para los artículos de Prompt & Patch en src/content/blog. Usar al escribir, editar o revisar un artículo. Voz de ingeniero senior, cero relleno, estructura obligatoria (problema, solución, código real, troubleshooting) y contenido original que cumpla los estándares de calidad de Google y AdSense.
---

# Tech Writer Anti-AI — Prompt & Patch

El lector llegó desde Google con un error en la terminal o una integración que no funciona.
Cada párrafo tiene que acercarlo a la solución. Si una frase se puede borrar sin perder
información, se borra.

## Reglas

1. **La primera línea es el síntoma.** Un mensaje de error literal, un comportamiento observable
   o una cifra. Nada de contexto histórico.
2. **Voz de ingeniero senior:** analítica, pragmática, honesta. Primera persona solo para
   experiencias reales del autor; nunca inventar anécdotas, métricas ni benchmarks.
3. **Precisión verificable:** versiones exactas (`Astro 6.4`, `Node 22`), nombres reales de APIs,
   mensajes de error copiados tal cual. Si algo no se probó, no se afirma.
4. **Admitir lo que falló.** Los intentos descartados y los límites conocidos son parte del valor.
5. **Español neutro y técnico.** Los términos de código no se traducen (`loader`, `build`, `slug`).

## Frases prohibidas

Si aparecen, se reescribe el párrafo completo, no solo la frase:

- "En el vertiginoso/cambiante mundo de la tecnología…", "En la era digital…"
- "La IA llegó para quedarse", "El futuro es ahora"
- "Sin más preámbulos", "¡Manos a la obra!", "¡Vamos a ello!"
- "Es importante destacar/mencionar que…", "Cabe resaltar que…"
- "juega un papel crucial", "desbloquear el potencial", "sumérgete en", "llevar al siguiente nivel"
- "En conclusión…" seguido de un resumen de lo que ya se dijo
- Preguntas retóricas como apertura ("¿Alguna vez te has preguntado…?")

## Estructura obligatoria

Plantilla lista para copiar: `src/content/blog/_plantilla.md`.

```md
(1–3 líneas: síntoma exacto y qué resuelve el artículo)

## El problema
Qué se rompe, en qué versión, bajo qué condiciones. Por qué la solución obvia no sirve.

## La solución
Enfoque en una o dos frases, luego pasos numerados como H3 ("### 1. …").
Cada paso con su código.

## Troubleshooting
Un H3 por error o límite: mensaje literal → causa → arreglo.
```

Opcionales al final, solo si aportan: una tabla comparativa, referencias a documentación oficial.

## Código

- Funcional y probado. Nada de pseudo-código presentado como real.
- Siempre con lenguaje en el fence (` ```ts `, ` ```astro `, ` ```bash `, ` ```text ` para salidas).
- Primera línea: comentario con la ruta del archivo (`// src/lib/blog.ts`).
- Mínimo pero completo: imports incluidos, sin `...` en partes que el lector necesita copiar.
- Salidas de terminal y errores en bloques ` ```text `, copiados literalmente.
- Secretos y claves siempre como variables de entorno de ejemplo.

## Checklist antes de quitar `draft: true`

- [ ] La primera línea describe el síntoma, sin introducción.
- [ ] Están las cuatro partes: problema, solución, código, troubleshooting.
- [ ] Todo el código se ejecutó en la versión indicada.
- [ ] Ninguna frase de la lista prohibida.
- [ ] Cada afirmación técnica es verificable (docs, código fuente o prueba propia).
- [ ] Al menos un enlace interno a otro artículo relacionado, si existe.
- [ ] Metadatos revisados con la skill `seo-technical-strategist`.
