import React from "react";

const Experience = () => {
  return (
    <section className="py-[120px] px-[24px]" id="experience">
      <div className="max-w-[800px] mx-auto">
        <div className="mb-16 reveal-on-scroll">
          <h2 className="font-headline-lg text-headline-lg mb-4">Experiencia Profesional</h2>
          <div className="w-20 h-1.5 bg-primary-container rounded-full"></div>
        </div>
        
        <div className="relative border-l-2 border-surface-container-highest ml-4">
          {/* Current Role */}
          <div className="mb-12 ml-8 relative reveal-on-scroll">
            <div className="absolute -left-[41px] top-0 w-5 h-5 bg-primary-container rounded-full timeline-pulse ring-4 ring-surface"></div>
            
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <h3 className="font-headline-md text-headline-md text-on-surface">Web Informática S.A. de C.V.</h3>
              <span className="px-4 py-1 bg-primary/10 text-primary-container text-label-caps rounded-full font-label-caps">ENE 2023 - ACTUALIDAD</span>
            </div>
            
            <h4 className="text-primary-container font-bold mb-4 font-body-lg">Full Stack Developer</h4>
            
            <ul className="space-y-4 text-on-surface-variant font-body-md">
              <li className="flex gap-3">
                <span className="material-symbols-outlined text-primary-container shrink-0">check_circle</span>
                Desarrollo de requerimientos críticos y paneles administrativos para la gestión de datos empresariales.
              </li>
              <li className="flex gap-3">
                <span className="material-symbols-outlined text-primary-container shrink-0">check_circle</span>
                Conectividad mediante APIs REST para la sincronización de servicios externos y aplicaciones móviles.
              </li>
              <li className="flex gap-3">
                <span className="material-symbols-outlined text-primary-container shrink-0">check_circle</span>
                Optimización de consultas SQL y arquitectura de bases de datos para sistemas de alta concurrencia.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Experience;
