# Contexto Maestro del Proyecto: Sección de Blog en raulo.dev ("Prompt & Patch")

## 1. Contexto General, Objetivo y Meta de Monetización
- **Proyecto Propietario:** Portafolio personal del desarrollador en `https://raulo.dev/` (Repositorio: `https://github.com/RaulVigil/astro-portafolio`).
- **Stack Tecnológico Existente:** Astro + React (Ya inicializado y abierto localmente en VS Code).
- **Nueva Iniciativa:** Integrar una sección de blog/artículos técnicos llamada **"Prompt & Patch"** dentro de `raulo.dev` (en la ruta `/blog`).
- **Meta Principal (Monetización y Tráfico):** 
  - La meta de este blog es generar **ingresos pasivos legítimos mediante anuncios (Google AdSense)** capitalizando el tráfico orgánico.
  - Para lograrlo, el sitio debe estar perfectamente optimizado para SEO técnico y velocidad de carga (por eso usamos Astro).
  - El tráfico provendrá de resolver problemas de desarrollo muy específicos y de la distribución orgánica del contenido en comunidades de ingenieros (como Reddit, Hacker News, LinkedIn, etc.), descartando por completo cualquier práctica de tráfico artificial o scripts de fraude que pongan en riesgo la cuenta de AdSense.

---

## 2. Identidad Visual y UI (Skill: Maquetador Frontend Pro)
Queremos evitar a toda costa la "estética genérica de IA" (degradados morados corporativos, tarjetas flotantes con sombras pesadas, layouts simétricos aburridos o ilustraciones robóticas). 

- **Estética:** Inspiración editorial / minimalista técnico (tipo terminal de comandos, tipografías limpias/monoespaciadas, excelente manejo del espacio en blanco y bordes sutiles).
- **Paleta de Colores (Dark Mode First):**
  - Fondo Principal: `#0a0a0c` (Negro espacial profundo).
  - Superficies / Tarjetas: `#16181d` con bordes sutiles en `#272a33`.
  - Texto Principal: `#f1f5f9` (Blanco suave).
  - Color de Acento: Ámbar técnico (`#f59e0b`) o Cian eléctrico (`#38bdf8`) para detalles, enlaces y botones clave.
- **Logo / Isotipo:** Un componente tipográfico minimalista que muestre `> prompt & patch` con un sutil acento de terminal.

---

## 3. Guía de Redacción Técnica (Skill: Tech Writer Anti-AI)
Para asegurar que los artículos aporten valor real, atraigan lectores y cumplan con los estándares de calidad que exige Google para AdSense:
1. **Cero Relleno Comercial:** Prohibido usar introducciones genéricas como *"En el vertiginoso mundo actual de la tecnología..."* o conclusiones vacías tipo *"La IA llegó para quedarse"*. Ir directo al grano desde la primera línea.
2. **Voz y Tono:** Escribir como un Ingeniero de Software Senior compartiendo un descubrimiento de trinchera o resolviendo un problema real de producción. Tono analítico, pragmático y honesto.
3. **Estructura Obligatoria por Artículo:**
   - **El Problema / Contexto:** El desafío técnico real a resolver.
   - **La Solución / Arquitectura:** Explicación paso a paso.
   - **Código Real:** Fragmentos de código funcionales con resaltado de sintaxis limpio.
   - **Troubleshooting:** Errores comunes, límites de APIs o problemas de rendimiento.

---

## 4. Estrategia SEO (Skill: SEO Technical Strategist)
Para posicionar orgánicamente y maximizar las impresiones de los bloques de anuncios:
1. **Enfoque Long-Tail:** Apuntar a intenciones de búsqueda técnica muy específica (ej. integración de APIs concretas, resolución de errores de código, flujos de automatización exactos) que atraigan programadores con alta intención de lectura.
2. **Metadatos Optimizados:** 
   - **Meta Título:** Máximo 60 caracteres, incluyendo la keyword principal y un gancho técnico.
   - **Meta Descripción:** Máximo 150 caracteres orientada a resolver el dolor técnico del lector.
3. **Estructura Técnica en Astro:** Uso estricto de *Astro Content Collections* (`src/content/blog/`) para manejar los posts en Markdown/MDX con un esquema de frontmatter robusto (`title`, `description`, `pubDate`, `tags`, `slug`).

---

## 5. Tareas Inmediatas para Claude Code
Por favor, analiza el repositorio actual abierto en VS Code y ejecuta lo siguiente:
1. Configurar **Astro Content Collections** para la sección del blog en la ruta `/blog`, preparada para albergar artículos orientados a SEO y monetización por anuncios.
2. Crear los componentes UI necesarios respetando la paleta de colores Dark Mode y el diseño minimalista técnico (sin estilos genéricos de IA).
3. Implementar el componente visual del logo tipográfico `> prompt & patch`.
4. Dejar creada la carpeta `.github/skills/` con estas directrices guardadas localmente para referencia del proyecto.