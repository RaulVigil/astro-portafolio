import React, { useState, useEffect } from 'react';

const codeTokens = [
  { text: 'const', color: 'text-[#c678dd]' },
  { text: ' ', color: '' },
  { text: 'developer', color: 'text-[#e5c07b]' },
  { text: ' = {\n  ', color: 'text-[#abb2bf]' },
  { text: 'name', color: 'text-[#e06c75]' },
  { text: ': ', color: 'text-[#abb2bf]' },
  { text: "'Raúl Vigil'", color: 'text-[#98c379]' },
  { text: ',\n  ', color: 'text-[#abb2bf]' },
  { text: 'role', color: 'text-[#e06c75]' },
  { text: ': ', color: 'text-[#abb2bf]' },
  { text: "'Full Stack Web Developer'", color: 'text-[#98c379]' },
  { text: ',\n  ', color: 'text-[#abb2bf]' },
  { text: 'focus', color: 'text-[#e06c75]' },
  { text: ': [\n    ', color: 'text-[#abb2bf]' },
  { text: "'Performance'", color: 'text-[#98c379]' },
  { text: ',\n    ', color: 'text-[#abb2bf]' },
  { text: "'Security'", color: 'text-[#98c379]' },
  { text: ',\n    ', color: 'text-[#abb2bf]' },
  { text: "'Scalability'", color: 'text-[#98c379]' },
  { text: '\n  ],\n  ', color: 'text-[#abb2bf]' },
  { text: 'status', color: 'text-[#e06c75]' },
  { text: ': ', color: 'text-[#abb2bf]' },
  { text: "'Available for hire'", color: 'text-[#98c379]' },
  { text: '\n};\n\n', color: 'text-[#abb2bf]' },
  { text: 'developer', color: 'text-[#e5c07b]' },
  { text: '.', color: 'text-[#abb2bf]' },
  { text: 'init', color: 'text-[#61afef]' },
  { text: '();', color: 'text-[#abb2bf]' }
];

const TypewriterIDE = () => {
  const [charIndex, setCharIndex] = useState(0);
  const totalChars = codeTokens.reduce((acc, token) => acc + token.text.length, 0);

  useEffect(() => {
    if (charIndex < totalChars) {
      const timeout = setTimeout(() => {
        setCharIndex(prev => prev + 1);
      }, Math.random() * 40 + 20); // Random typing speed between 20ms and 60ms
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setCharIndex(0); // Restart typing animation after a delay
      }, 6000);
      return () => clearTimeout(timeout);
    }
  }, [charIndex, totalChars]);

  let currentCount = 0;
  const renderedTokens = [];

  for (let i = 0; i < codeTokens.length; i++) {
    const token = codeTokens[i];
    if (currentCount + token.text.length <= charIndex) {
      renderedTokens.push(<span key={i} className={token.color}>{token.text}</span>);
      currentCount += token.text.length;
    } else {
      const remaining = charIndex - currentCount;
      if (remaining > 0) {
        renderedTokens.push(<span key={i} className={token.color}>{token.text.substring(0, remaining)}</span>);
      }
      break;
    }
  }

  return (
    <div className="text-sm lg:text-base leading-relaxed whitespace-pre font-label-md tracking-wide h-[420px] w-[400px] flex flex-col justify-start">
      <div>
        {renderedTokens}
        <span className="inline-block w-[10px] h-[18px] bg-[#61afef] animate-pulse ml-[4px] align-middle shadow-[0_0_8px_#61afef]"></span>
      </div>
    </div>
  );
};

export default function Hero() {
  return (
    <section className="min-h-[819px] flex flex-col xl:flex-row justify-between items-center py-stack-lg relative gap-12" id="inicio">
      <div className="flex-1 w-full max-w-4xl relative z-10">
        <h1 className="text-3xl md:text-7xl lg:text-8xl font-extrabold text-text-primary mb-6 relative z-10 fade-in-up tracking-tight">
          Raúl Vigil <span className="text-surface-tint opacity-50 hidden md:inline">|</span> <br className="block" />Desarrollador Web Full Stack
        </h1>
        <p className="text-xl md:text-2xl text-on-surface-variant mb-10 max-w-3xl relative z-10 fade-in-up delay-100 leading-relaxed">
          Transformo requerimientos de negocio en aplicaciones web robustas, seguras y de alto rendimiento. Especializado en React, Node.js y ecosistemas PHP modernos.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 relative z-10 fade-in-up delay-200">
          <a href="#proyectos" className="btn-primary px-8 py-4 rounded font-label-md text-label-md font-bold inline-flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">code</span> Ver Proyectos
          </a>
          <a href="#contacto" className="btn-secondary px-8 py-4 rounded font-label-md text-label-md inline-flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">mail</span> Contratar Freelance
          </a>
        </div>
      </div>

      {/* Abstract decorative code element */}
      <div className="hidden xl:block shrink-0 opacity-60 pointer-events-none fade-in-up delay-300">
        <TypewriterIDE />
      </div>
    </section>
  );
}
