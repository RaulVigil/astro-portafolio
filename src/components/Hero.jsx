import React, { useEffect, useRef } from "react";
import photoUrl from "../assets/photo.png";

const Hero = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    let width, height, particles;
    let animationFrameId;

    function init() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      particles = [];
      for (let i = 0; i < 60; i++) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: Math.random() * 2 + 1,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#00f2ff';
      ctx.strokeStyle = 'rgba(0, 242, 255, 0.1)';
      
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Connect lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      animationFrameId = requestAnimationFrame(draw);
    }

    window.addEventListener('resize', init);
    init();
    draw();

    return () => {
      window.removeEventListener('resize', init);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-24 overflow-hidden px-[24px]" id="hero">
      <canvas ref={canvasRef} id="hero-canvas" className="absolute top-0 left-0 w-full h-full z-0 opacity-40 pointer-events-none" />
      
      <div className="max-w-[1200px] mx-auto w-full relative z-10 grid md:grid-cols-2 gap-12 items-center">
        <div className="reveal-on-scroll active">
          <div className="inline-block px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-label-caps font-label-caps mb-6">
            DISPONIBLE PARA NUEVOS PROYECTOS
          </div>
          <h1 className="font-display-lg text-display-lg mb-6 leading-tight">
            Raúl Vigil — <span className="text-primary-container">Ingeniero en Sistemas</span> & Full Stack
          </h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl mb-10">
            +3 años transformando requerimientos de negocio en aplicaciones web robustas y escalables. Especialista en ecosistemas JavaScript (React) y PHP (CodeIgniter, Laravel).
          </p>
          <div className="flex flex-wrap gap-4">
            <a 
              className="bg-primary-container text-on-primary-container px-8 py-4 rounded-lg font-bold flex items-center gap-2 transition-all hover:scale-[1.02] hover:shadow-[0_0_20px_rgba(0,242,255,0.3)]" 
              href="#projects"
            >
              Ver Proyectos
              <span className="material-symbols-outlined">arrow_forward</span>
            </a>
            <a 
              className="border border-outline px-8 py-4 rounded-lg font-bold text-on-surface hover:bg-surface-container-high transition-colors" 
              href="#contact"
            >
              Contactar
            </a>
          </div>
        </div>
        
        <div className="hidden md:block relative reveal-on-scroll active delay-200">
          <div className="aspect-square relative flex items-center justify-center">
            <div className="absolute inset-0 bg-primary/10 rounded-full blur-[100px]"></div>
            <img 
              alt="Raúl Vigil" 
              className="relative z-10 w-full h-full object-cover rounded-3xl border border-white/10 grayscale hover:grayscale-0 transition-all duration-700" 
              src={photoUrl.src || photoUrl}
              fetchpriority="high"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
