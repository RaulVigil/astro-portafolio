import React from 'react';
import { experience } from '../data';

export default function Experience() {
  return (
    <section className="py-stack-lg border-t border-border-subtle/50 animate-on-scroll" id="experiencia">
      <h2 className="text-headline-md font-headline-md text-primary mb-10 inline-flex items-center gap-2">
        <span className="material-symbols-outlined">work_history</span> Experiencia Profesional
      </h2>
      <div className="space-y-0 relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[19px] md:left-6 top-0 bottom-0 w-[2px] bg-border-subtle hidden md:block"></div>

        {experience.map((exp, index) => (
          <div key={index} className="relative flex flex-col md:flex-row gap-4 md:gap-8 pb-10 last:pb-0">
            {/* Timeline dot */}
            <div className="hidden md:flex shrink-0 w-12 justify-center relative z-10">
              <div className="w-3 h-3 rounded-full bg-primary mt-2 shadow-[0_0_10px_rgba(0,210,255,0.6)]"></div>
            </div>

            {/* Content */}
            <div className="glass-panel rounded-xl p-6 md:p-8 flex-1">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                <div>
                  <h3 className="text-body-lg font-headline-md text-text-primary">{exp.role}</h3>
                  <p className="text-label-md font-label-md text-primary mt-1">{exp.company}</p>
                </div>
                <span className="text-label-sm font-label-sm text-text-secondary bg-surface-container-high px-3 py-1 rounded-full whitespace-nowrap shrink-0">
                  {exp.period}
                </span>
              </div>
              <p className="text-body-md font-body-md text-text-secondary leading-relaxed mt-3">
                {exp.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
