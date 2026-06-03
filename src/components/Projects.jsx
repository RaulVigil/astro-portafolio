import React from "react";

const Projects = () => {
  return (
    <section className="py-[120px] bg-surface-container-lowest/50 px-[24px]" id="projects">
      <div className="max-w-[1200px] mx-auto">
        <div className="text-center mb-20 reveal-on-scroll">
          <h2 className="font-headline-lg text-headline-lg mb-4">Proyectos Destacados</h2>
          <p className="text-on-surface-variant font-body-lg max-w-2xl mx-auto">Sistemas empresariales y plataformas digitales de alto rendimiento.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Project 1 */}
          <div className="group reveal-on-scroll">
            <div className="overflow-hidden rounded-2xl mb-6 aspect-video bg-surface-container-high border border-white/5 relative">
              <img 
                alt="Veterinaria Mi Mejor Amigo" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                src="https://res.cloudinary.com/djyulfuk6/image/upload/fl_preserve_transparency/v1772746176/vistaalvalle/sitio-veterinaria_raxygp.jpg?_s=public-apps"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-60"></div>
            </div>
            <h3 className="font-headline-md text-headline-md mb-3 text-primary-container">Veterinaria Mi Mejor Amigo</h3>
            <p className="text-on-surface-variant mb-6 font-body-md">Sistema integral de expedientes médicos con portal móvil de solo lectura para dueños de mascotas. Optimización de flujos administrativos.</p>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-code-sm font-code-sm text-secondary bg-secondary/10 px-2 py-0.5 rounded">React 19</span>
              <span className="text-code-sm font-code-sm text-secondary bg-secondary/10 px-2 py-0.5 rounded">CodeIgniter 4</span>
              <span className="text-code-sm font-code-sm text-secondary bg-secondary/10 px-2 py-0.5 rounded">JWT</span>
              <span className="text-code-sm font-code-sm text-secondary bg-secondary/10 px-2 py-0.5 rounded">Tailwind</span>
            </div>
          </div>

          {/* Project 2 */}
          <div className="group reveal-on-scroll" style={{ transitionDelay: '200ms' }}>
            <div className="overflow-hidden rounded-2xl mb-6 aspect-video bg-surface-container-high border border-white/5 relative">
              <img 
                alt="JAX International Investment" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                src="https://res.cloudinary.com/djyulfuk6/image/upload/fl_preserve_transparency/v1772745584/vistaalvalle/unnamed_3_mp3aee.jpg?_s=public-apps"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent opacity-60"></div>
            </div>
            <h3 className="font-headline-md text-headline-md mb-3 text-primary-container">JAX International Investment</h3>
            <p className="text-on-surface-variant mb-6 font-body-md">Plataforma inmobiliaria interactiva con mapa de lotificaciones en tiempo real y cotizaciones automatizadas para inversores globales.</p>
            <div className="flex flex-wrap gap-2 mb-6">
              <span className="text-code-sm font-code-sm text-secondary bg-secondary/10 px-2 py-0.5 rounded">WordPress</span>
              <span className="text-code-sm font-code-sm text-secondary bg-secondary/10 px-2 py-0.5 rounded">ACF PRO</span>
              <span className="text-code-sm font-code-sm text-secondary bg-secondary/10 px-2 py-0.5 rounded">Bootstrap</span>
            </div>
          </div>

          {/* Project 3 - Large/Centered */}
          <div className="md:col-span-2 group reveal-on-scroll">
            <div className="grid md:grid-cols-2 gap-8 items-center bg-surface-container p-8 rounded-3xl border border-white/5">
              <div className="overflow-hidden rounded-xl aspect-video relative order-2 md:order-1">
                <img 
                  alt="FinanceApp" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                  src="https://res.cloudinary.com/djyulfuk6/image/upload/fl_preserve_transparency/v1772746522/vistaalvalle/Gemini_Generated_Image_qvqb16qvqb16qvqb_1_1_khygwg.jpg?_s=public-apps"
                  loading="lazy"
                />
              </div>
              <div className="order-1 md:order-2">
                <h3 className="font-headline-md text-headline-md mb-4 text-primary-container">FinanceApp</h3>
                <p className="text-on-surface-variant mb-6 font-body-lg">Dashboard de finanzas personales con sincronización de saldos en tiempo real y reportes analíticos de consumo. Enfoque en UX fluida y seguridad de datos.</p>
                <div className="flex flex-wrap gap-2 mb-8">
                  <span className="text-code-sm font-code-sm text-secondary bg-secondary/10 px-3 py-1 rounded">React</span>
                  <span className="text-code-sm font-code-sm text-secondary bg-secondary/10 px-3 py-1 rounded">CodeIgniter 4</span>
                  <span className="text-code-sm font-code-sm text-secondary bg-secondary/10 px-3 py-1 rounded">MySQL</span>
                </div>
                <button className="flex items-center gap-2 text-primary-container font-bold hover:underline">
                  Explorar Caso de Estudio <span className="material-symbols-outlined">north_east</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Projects;
