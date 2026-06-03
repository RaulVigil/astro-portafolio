import React from "react";

const Contact = () => {
  return (
    <section className="py-[120px] px-[24px] bg-gradient-to-b from-surface to-surface-container-lowest" id="contact">
      <div className="max-w-[1200px] mx-auto">
        <div className="glass-card rounded-3xl p-10 md:p-20 text-center reveal-on-scroll">
          <h2 className="font-display-lg text-headline-lg md:text-display-lg mb-8">¿Listo para escalar tu próximo proyecto?</h2>
          <p className="text-on-surface-variant font-body-lg max-w-xl mx-auto mb-12">Estoy disponible para colaboraciones freelance o posiciones full-time en equipos de alto rendimiento.</p>
          
          <div className="flex flex-col md:flex-row justify-center gap-8 items-center mb-16">
            <a className="flex items-center gap-4 group" href="mailto:rauleduardovigil@gmail.com" aria-label="Enviar correo electrónico">
              <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center group-hover:bg-primary-container transition-colors">
                <span className="material-symbols-outlined group-hover:text-on-primary-container">mail</span>
              </div>
              <div className="text-left">
                <p className="text-label-caps text-on-surface-variant">Email</p>
                <p className="font-bold text-body-lg">rauleduardovigil@gmail.com</p>
              </div>
            </a>
            
            <div className="w-px h-12 bg-white/10 hidden md:block"></div>
            
            <a className="flex items-center gap-4 group" href="tel:+50375965375" aria-label="Llamar por teléfono">
              <div className="w-14 h-14 rounded-full bg-surface-container-high flex items-center justify-center group-hover:bg-primary-container transition-colors">
                <span className="material-symbols-outlined group-hover:text-on-primary-container">call</span>
              </div>
              <div className="text-left">
                <p className="text-label-caps text-on-surface-variant">Teléfono</p>
                <p className="font-bold text-body-lg">+503 75965375</p>
              </div>
            </a>
          </div>

          <div className="flex justify-center gap-6">
            <a className="w-12 h-12 border border-white/10 rounded-full flex items-center justify-center hover:bg-primary/10 transition-all text-on-surface" href="https://github.com/RaulVigil" target="_blank" rel="noopener noreferrer" aria-label="Visitar GitHub">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"></path></svg>
            </a>
            <a className="w-12 h-12 border border-white/10 rounded-full flex items-center justify-center hover:bg-primary/10 transition-all text-on-surface" href="https://www.linkedin.com/in/raulvigil/" target="_blank" rel="noopener noreferrer" aria-label="Visitar LinkedIn">
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"></path></svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Contact;
