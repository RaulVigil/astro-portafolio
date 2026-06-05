import React from 'react';
import photoUrl from '../assets/photo.png';

export default function About() {
  return (
    <section className="py-stack-lg border-t border-border-subtle/50 relative animate-on-scroll" id="sobre-mi">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter items-center">
        <div className="col-span-1 md:col-span-5">
          <h2 className="text-headline-md font-headline-md text-primary mb-6 inline-flex items-center gap-2">
            <span className="material-symbols-outlined">person</span> Sobre Mí
          </h2>
          <div className="glass-panel rounded-xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            <img src={photoUrl.src || photoUrl} alt="Raúl Vigil Workspace" className="w-full h-auto rounded-lg mb-6 opacity-80 filter grayscale hover:grayscale-0 transition-all duration-500 border border-border-subtle" />
            <p className="text-body-md font-body-md text-on-surface-variant">
              Con más de 3 años de experiencia en el desarrollo de software, me especializo en construir arquitecturas escalables y eficientes. Mi enfoque principal radica en la intersección entre interfaces de usuario impecables y backends robustos.
            </p>
          </div>
        </div>
        <div className="col-span-1 md:col-span-7 pl-0 md:pl-8 mt-8 md:mt-0">
          <div className="space-y-6">
            <div className="border-l-2 border-primary/30 pl-6 py-2 relative">
              <div className="absolute w-3 h-3 rounded-full bg-primary -left-[7px] top-4 shadow-[0_0_10px_rgba(0,210,255,0.6)]"></div>
              <h3 className="text-body-lg font-headline-md text-text-primary mb-2">Frontend Engineering</h3>
              <p className="text-body-md font-body-md text-text-secondary">Creación de interfaces reactivas y fluidas utilizando <strong>React</strong> y <strong>Angular</strong>. Obsesionado con el rendimiento, la accesibilidad y la experiencia del usuario a nivel de pixel.</p>
            </div>
            <div className="border-l-2 border-secondary/30 pl-6 py-2 relative">
              <div className="absolute w-3 h-3 rounded-full bg-secondary -left-[7px] top-4 shadow-[0_0_10px_rgba(208,188,255,0.6)]"></div>
              <h3 className="text-body-lg font-headline-md text-text-primary mb-2">Backend Architecture</h3>
              <p className="text-body-md font-body-md text-text-secondary">Diseño e implementación de APIs RESTful y microservicios con <strong>Node.js</strong> y frameworks modernos de <strong>PHP</strong>. Gestión de bases de datos relacionales y NoSQL.</p>
            </div>
            <div className="border-l-2 border-surface-tint/30 pl-6 py-2 relative">
              <div className="absolute w-3 h-3 rounded-full bg-surface-tint -left-[7px] top-4 shadow-[0_0_10px_rgba(71,214,255,0.6)]"></div>
              <h3 className="text-body-lg font-headline-md text-text-primary mb-2">Security & Performance</h3>
              <p className="text-body-md font-body-md text-text-secondary">Implementación de estándares de seguridad (JWT, OAuth), optimización de consultas y despliegues automatizados (CI/CD) para garantizar la integridad y velocidad de las aplicaciones.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
