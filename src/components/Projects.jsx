import React from 'react';

export default function Projects() {
  return (
    <section className="py-stack-lg border-t border-border-subtle/50 animate-on-scroll" id="proyectos">
      <h2 className="text-headline-md font-headline-md text-primary mb-10 inline-flex items-center gap-2">
        <span className="material-symbols-outlined">folder_open</span> Proyectos Destacados
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Project 1 */}
        <div className="glass-panel rounded-xl overflow-hidden group">
          <div className="h-48 bg-surface-container-high relative overflow-hidden">
            <img src="https://res.cloudinary.com/djyulfuk6/image/upload/fl_preserve_transparency/v1772746522/vistaalvalle/Gemini_Generated_Image_qvqb16qvqb16qvqb_1_1_khygwg.jpg?_s=public-apps" alt="FinanceApp" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#161b22] to-transparent"></div>
          </div>
          <div className="p-6">
            <h3 className="text-body-lg font-headline-md text-text-primary mb-2">FinanceApp</h3>
            <p className="text-body-md font-body-md text-text-secondary mb-4 line-clamp-2">Aplicación financiera integral para gestión de gastos e ingresos con visualización de datos en tiempo real.</p>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-label-sm font-label-sm text-primary px-2 py-1 bg-primary/10 rounded">React</span>
              <span className="text-label-sm font-label-sm text-primary px-2 py-1 bg-primary/10 rounded">CI4</span>
              <span className="text-label-sm font-label-sm text-primary px-2 py-1 bg-primary/10 rounded">Tailwind</span>
              <span className="text-label-sm font-label-sm text-primary px-2 py-1 bg-primary/10 rounded">JWT</span>
            </div>
            <a href="https://financeapp.raulo.dev/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-label-md font-label-md text-surface-tint hover:text-primary transition-colors group-hover:translate-x-1 duration-300">
              Ver Demo <span className="material-symbols-outlined ml-1 text-[18px]">arrow_forward</span>
            </a>
          </div>
        </div>

        {/* Project 2 */}
        <div className="glass-panel rounded-xl overflow-hidden group">
          <div className="h-48 bg-surface-container-high relative overflow-hidden">
            <img src="https://res.cloudinary.com/djyulfuk6/image/upload/fl_preserve_transparency/v1772746176/vistaalvalle/sitio-veterinaria_raxygp.jpg?_s=public-apps" alt="Vet Admin" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500 filter grayscale group-hover:grayscale-0" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#161b22] to-transparent"></div>
          </div>
          <div className="p-6">
            <h3 className="text-body-lg font-headline-md text-text-primary mb-2">Sistema Administrativo Veterinaria</h3>
            <p className="text-body-md font-body-md text-text-secondary mb-4 line-clamp-2">Plataforma de gestión completa para clínicas veterinarias, control de citas, historial clínico y facturación.</p>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-label-sm font-label-sm text-secondary px-2 py-1 bg-secondary/10 rounded">CI4</span>
              <span className="text-label-sm font-label-sm text-secondary px-2 py-1 bg-secondary/10 rounded">Bootstrap</span>
              <span className="text-label-sm font-label-sm text-secondary px-2 py-1 bg-secondary/10 rounded">Firebase</span>
              <span className="text-label-sm font-label-sm text-secondary px-2 py-1 bg-secondary/10 rounded">JWT</span>
            </div>
            <a href="#" className="inline-flex items-center text-label-md font-label-md text-secondary hover:text-tertiary transition-colors group-hover:translate-x-1 duration-300">
              Ver Detalles <span className="material-symbols-outlined ml-1 text-[18px]">arrow_forward</span>
            </a>
          </div>
        </div>

        {/* Project 3 */}
        <div className="glass-panel rounded-xl overflow-hidden group">
          <div className="h-48 bg-surface-container-high relative overflow-hidden">
            <img src="/images/jax-website.png" alt="Real Estate" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#161b22] to-transparent"></div>
          </div>
          <div className="p-6">
            <h3 className="text-body-lg font-headline-md text-text-primary mb-2">Sitio Web Inmobiliaria JAX</h3>
            <p className="text-body-md font-body-md text-text-secondary mb-4 line-clamp-2">Solución inmobiliaria personalizada con búsqueda avanzada, galerías interactivas y gestión de propiedades dinámica.</p>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-label-sm font-label-sm text-surface-tint px-2 py-1 bg-surface-tint/10 rounded">WordPress</span>
              <span className="text-label-sm font-label-sm text-surface-tint px-2 py-1 bg-surface-tint/10 rounded">ACF PRO</span>
              <span className="text-label-sm font-label-sm text-surface-tint px-2 py-1 bg-surface-tint/10 rounded">Bootstrap</span>
            </div>
            <a href="https://residencialvistaalvalle.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-label-md font-label-md text-surface-tint hover:text-primary transition-colors group-hover:translate-x-1 duration-300">
              Visitar Web <span className="material-symbols-outlined ml-1 text-[18px]">arrow_forward</span>
            </a>
          </div>
        </div>

        {/* Project 4 — Kanvan Dev */}
        <div className="glass-panel rounded-xl overflow-hidden group">
          <div className="h-48 bg-surface-container-high relative overflow-hidden">
            <img src="/images/kanban-dev.png" alt="Kanvan Dev SaaS" className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#161b22] to-transparent"></div>
          </div>
          <div className="p-6">
            <h3 className="text-body-lg font-headline-md text-text-primary mb-2">Kanvan Dev – Plataforma</h3>
            <p className="text-body-md font-body-md text-text-secondary mb-4 line-clamp-2">Plataforma de gestión de proyectos con tableros drag & drop, vistas Gantt y control de accesos por suscripción. Server Actions y tipado end-to-end.</p>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-label-sm font-label-sm text-primary px-2 py-1 bg-primary/10 rounded">Next.js 16</span>
              <span className="text-label-sm font-label-sm text-primary px-2 py-1 bg-primary/10 rounded">TypeScript</span>
              <span className="text-label-sm font-label-sm text-primary px-2 py-1 bg-primary/10 rounded">Supabase</span>
              <span className="text-label-sm font-label-sm text-primary px-2 py-1 bg-primary/10 rounded">Prisma</span>
              <span className="text-label-sm font-label-sm text-primary px-2 py-1 bg-primary/10 rounded">PostgreSQL</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="https://kanvan-dev.vercel.app/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-label-md font-label-md text-surface-tint hover:text-primary transition-colors group-hover:translate-x-1 duration-300">
                Ver Demo <span className="material-symbols-outlined ml-1 text-[18px]">arrow_forward</span>
              </a>
              <a href="https://github.com/RaulVigil/kanvan-dev" target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-label-md font-label-md text-secondary hover:text-tertiary transition-colors group-hover:translate-x-1 duration-300">
                Ver Código <span className="material-symbols-outlined ml-1 text-[18px]">code</span>
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
