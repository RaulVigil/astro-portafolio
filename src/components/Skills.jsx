import React from 'react';

export default function Skills() {
  return (
    <section className="py-stack-lg border-t border-border-subtle/50 animate-on-scroll" id="tecnologias">
      <h2 className="text-headline-md font-headline-md text-primary mb-10 inline-flex items-center gap-2">
        <span className="material-symbols-outlined">terminal</span> Stack Tecnológico
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Frontend */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-label-md font-label-md text-secondary mb-4 uppercase tracking-wider border-b border-border-subtle pb-2">Frontend</h3>
          <div className="flex flex-wrap gap-2">
            <span className="tech-chip px-3 py-1 rounded-full text-label-sm font-label-sm text-text-secondary flex items-center gap-1 cursor-default"><span className="material-symbols-outlined text-[14px]">javascript</span> React</span>
            <span className="tech-chip px-3 py-1 rounded-full text-label-sm font-label-sm text-text-secondary flex items-center gap-1 cursor-default"><span className="material-symbols-outlined text-[14px]">javascript</span> Angular</span>
            <span className="tech-chip px-3 py-1 rounded-full text-label-sm font-label-sm text-text-secondary flex items-center gap-1 cursor-default"><span className="material-symbols-outlined text-[14px]">code</span> TypeScript</span>
            <span className="tech-chip px-3 py-1 rounded-full text-label-sm font-label-sm text-text-secondary flex items-center gap-1 cursor-default"><span className="material-symbols-outlined text-[14px]">css</span> Tailwind CSS</span>
            <span className="tech-chip px-3 py-1 rounded-full text-label-sm font-label-sm text-text-secondary flex items-center gap-1 cursor-default"><span className="material-symbols-outlined text-[14px]">html</span> HTML5/CSS3</span>
          </div>
        </div>
        {/* Backend */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-label-md font-label-md text-primary mb-4 uppercase tracking-wider border-b border-border-subtle pb-2">Backend & APIs</h3>
          <div className="flex flex-wrap gap-2">
            <span className="tech-chip px-3 py-1 rounded-full text-label-sm font-label-sm text-text-secondary flex items-center gap-1 cursor-default"><span className="material-symbols-outlined text-[14px]">terminal</span> Node.js</span>
            <span className="tech-chip px-3 py-1 rounded-full text-label-sm font-label-sm text-text-secondary flex items-center gap-1 cursor-default"><span className="material-symbols-outlined text-[14px]">data_object</span> Express</span>
            <span className="tech-chip px-3 py-1 rounded-full text-label-sm font-label-sm text-text-secondary flex items-center gap-1 cursor-default"><span className="material-symbols-outlined text-[14px]">php</span> PHP</span>
            <span className="tech-chip px-3 py-1 rounded-full text-label-sm font-label-sm text-text-secondary flex items-center gap-1 cursor-default"><span className="material-symbols-outlined text-[14px]">api</span> RESTful APIs</span>
            <span className="tech-chip px-3 py-1 rounded-full text-label-sm font-label-sm text-text-secondary flex items-center gap-1 cursor-default"><span className="material-symbols-outlined text-[14px]">security</span> JWT / OAuth</span>
          </div>
        </div>
        {/* Tools & DBs */}
        <div className="glass-panel rounded-xl p-6">
          <h3 className="text-label-md font-label-md text-surface-tint mb-4 uppercase tracking-wider border-b border-border-subtle pb-2">Databases & Tools</h3>
          <div className="flex flex-wrap gap-2">
            <span className="tech-chip px-3 py-1 rounded-full text-label-sm font-label-sm text-text-secondary flex items-center gap-1 cursor-default"><span className="material-symbols-outlined text-[14px]">database</span> MySQL</span>
            <span className="tech-chip px-3 py-1 rounded-full text-label-sm font-label-sm text-text-secondary flex items-center gap-1 cursor-default"><span className="material-symbols-outlined text-[14px]">storage</span> PostgreSQL</span>
            <span className="tech-chip px-3 py-1 rounded-full text-label-sm font-label-sm text-text-secondary flex items-center gap-1 cursor-default"><span className="material-symbols-outlined text-[14px]">data_usage</span> MongoDB</span>
            <span className="tech-chip px-3 py-1 rounded-full text-label-sm font-label-sm text-text-secondary flex items-center gap-1 cursor-default"><span className="material-symbols-outlined text-[14px]">cloud</span> Firebase</span>
            <span className="tech-chip px-3 py-1 rounded-full text-label-sm font-label-sm text-text-secondary flex items-center gap-1 cursor-default"><span className="material-symbols-outlined text-[14px]">commit</span> Git / GitHub</span>
          </div>
        </div>
      </div>
    </section>
  );
}
