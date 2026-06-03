# Raúl Vigil - Portfolio Web 🚀

Portafolio personal diseñado bajo una identidad visual **"Deep Dark"** (alto contraste, moderna y minimalista) construido para el máximo rendimiento y un SEO impecable.

## 🛠️ Tecnologías Utilizadas

- **[Astro 5](https://astro.build/)** - Framework generador de sitios estáticos ultrarrápido (Island Architecture).
- **[React 19](https://react.dev/)** - Biblioteca para la interactividad y componentes complejos.
- **[Tailwind CSS v4](https://tailwindcss.com/)** - Estilos utilitarios rápidos y sistema de diseño vía `@theme`.
- **[Framer Motion](https://www.framer.com/motion/)** - Animaciones fluidas, complejas e interacciones premium.
- **[pnpm](https://pnpm.io/)** - Manejador de paquetes rápido y eficiente en disco.

## ✨ Características Principales

- **Diseño Premium:** Estilo Glassmorphism con degradados, blur (backdrop-filter) y tema oscuro ultra moderno.
- **Micro-interacciones:** Elementos revelados al hacer scroll (`IntersectionObserver`) y hovers dinámicos.
- **SEO Excelente (100/100 Lighthouse):**
  - Autogeneración de `sitemap-index.xml`.
  - JSON-LD Schema estructurado (Person).
  - Open Graph y Twitter Cards automáticos.
  - Atributos `aria-label` para plena accesibilidad.
  - Prioridad de carga (`fetchpriority`, `loading="lazy"` / `"eager"`) para Core Web Vitals.

## 📦 Instalación y Desarrollo Local

1. Clona este repositorio:
   ```bash
   git clone https://github.com/RaulVigil/astro-portafolio.git
   cd astro-portafolio
   ```

2. Instala las dependencias (se recomienda `pnpm`):
   ```bash
   pnpm install
   ```
   *(Si te lo pide, asegúrate de aprobar los scripts de construcción de pnpm para `esbuild` y `sharp` usando `pnpm approve-builds`)*.

3. Inicia el servidor de desarrollo:
   ```bash
   pnpm run dev
   ```
   El sitio estará disponible en `http://localhost:4321`.

## 🚀 Despliegue (Producción)

Genera la versión optimizada para producción:
```bash
pnpm run build
```
Esto creará una carpeta `dist/` con archivos estáticos (HTML/CSS/JS optimizados) listos para subir a cualquier servicio de hosting como **Vercel**, **Netlify** o **GitHub Pages**.

---
*© 2026 Raúl Vigil. Built for high-performance scale.*
