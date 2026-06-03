import React from "react";

const Skills = () => {
  return (
    <section className="py-[120px] px-[24px]" id="skills">
      <div className="max-w-[1200px] mx-auto">
        <div className="mb-16 reveal-on-scroll">
          <h2 className="font-headline-lg text-headline-lg mb-4">Technical Stack</h2>
          <div className="w-20 h-1.5 bg-primary-container rounded-full"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Frontend */}
          <div className="glass-card p-8 rounded-xl glow-hover reveal-on-scroll">
            <span className="material-symbols-outlined text-primary-container mb-4 text-4xl">code</span>
            <h3 className="font-headline-md text-headline-md mb-6">Frontend</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-body-md rounded border border-white/5">React JS</span>
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-body-md rounded border border-white/5">JavaScript</span>
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-body-md rounded border border-white/5">TypeScript</span>
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-body-md rounded border border-white/5">Tailwind CSS</span>
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-body-md rounded border border-white/5">Angular</span>
            </div>
          </div>
          {/* Backend */}
          <div className="glass-card p-8 rounded-xl glow-hover reveal-on-scroll" style={{ transitionDelay: '100ms' }}>
            <span className="material-symbols-outlined text-primary-container mb-4 text-4xl">terminal</span>
            <h3 className="font-headline-md text-headline-md mb-6">Backend</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-body-md rounded border border-white/5">CodeIgniter 4</span>
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-body-md rounded border border-white/5">Laravel</span>
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-body-md rounded border border-white/5">Node.js</span>
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-body-md rounded border border-white/5">RESTful APIs</span>
            </div>
          </div>
          {/* DB & Tools */}
          <div className="glass-card p-8 rounded-xl glow-hover reveal-on-scroll" style={{ transitionDelay: '200ms' }}>
            <span className="material-symbols-outlined text-primary-container mb-4 text-4xl">database</span>
            <h3 className="font-headline-md text-headline-md mb-6">Database & Tools</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-body-md rounded border border-white/5">MySQL</span>
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-body-md rounded border border-white/5">SQL Server</span>
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-body-md rounded border border-white/5">MongoDB</span>
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-body-md rounded border border-white/5">GIT/GitHub</span>
            </div>
          </div>
          {/* Architecture */}
          <div className="glass-card p-8 rounded-xl glow-hover reveal-on-scroll" style={{ transitionDelay: '300ms' }}>
            <span className="material-symbols-outlined text-primary-container mb-4 text-4xl">architecture</span>
            <h3 className="font-headline-md text-headline-md mb-6">Architecture</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-body-md rounded border border-white/5">JWT</span>
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-body-md rounded border border-white/5">Google OAuth 2.0</span>
            </div>
          </div>
          {/* CMS/Ecommerce */}
          <div className="glass-card p-8 rounded-xl glow-hover reveal-on-scroll lg:col-span-2" style={{ transitionDelay: '400ms' }}>
            <span className="material-symbols-outlined text-primary-container mb-4 text-4xl">shopping_cart</span>
            <h3 className="font-headline-md text-headline-md mb-6">E-commerce & CMS</h3>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-body-md rounded border border-white/5">WordPress</span>
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-body-md rounded border border-white/5">ACF PRO</span>
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-body-md rounded border border-white/5">WooCommerce</span>
              <span className="px-3 py-1 bg-surface-container-high text-on-surface-variant text-body-md rounded border border-white/5">Shopify</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Skills;
