import { Github, Linkedin, Mail } from 'lucide-react';
import jaxWebsite from './assets/projects/jax-website.png';
import kanbanDev from './assets/projects/kanban-dev.png';
import esOferta from './assets/projects/es-oferta-de-verdad.png';

export const siteConfig = {
  title: "Raúl Vigil | Desarrollador Web Full Stack",
  description: "Raúl Vigil — Desarrollador Full Stack en El Salvador. Especialista en React, Next.js, Node.js y PHP. Disponible para proyectos freelance y remotos en Latam.",
  keywords: "desarrollador web, full stack, react, next.js, node.js, php, typescript, el salvador, freelance, portafolio, ingeniero sistemas",
  email: "rauleduardovigil@gmail.com",
  phone: "+503 75965375",
  twitter: "@raulvigil",
  socials: {
    github: "https://github.com/RaulVigil",
    linkedin: "https://www.linkedin.com/in/raulvigil/",
  }
};

export const blogConfig = {
  name: "Prompt & Patch",
  title: "Prompt & Patch | Blog técnico de Raúl Vigil",
  description: "Problemas reales de desarrollo web resueltos con código: Astro, React, Node.js, APIs y automatización. Sin relleno.",
  author: {
    name: "Raúl Vigil",
    url: "https://raulo.dev",
    bio: "Ingeniero en Sistemas y desarrollador Full Stack en El Salvador. Escribe sobre problemas que resuelve en producción: React, Astro, Node.js, PHP y automatización.",
  },
  // Google AdSense: completar cuando la cuenta esté aprobada.
  // Con `client` vacío no se carga ningún script ni se renderizan bloques de anuncios.
  adsense: {
    client: "ca-pub-6956020938693205",
    slots: {
      postEnd: "",
      listing: "",
    },
  },
};

export const navItems = [
  { label: "Inicio", href: "#inicio" },
  { label: "Sobre Mí", href: "#sobre-mi" },
  { label: "Tecnologías", href: "#tecnologias" },
  { label: "Proyectos", href: "#proyectos" },
  { label: "Experiencia", href: "#experiencia" },
  { label: "Servicios", href: "#servicios" },
  { label: "Contacto", href: "#contacto" },
  { label: "Blog", href: "/blog/" },
];

export const skills = {
  frontend: [
    "React", "Astro", "Angular", "TypeScript", "JavaScript", "Tailwind CSS", "HTML5 & CSS3"
  ],
  backend: [
    "Node.js", "PHP", "Laravel", "CodeIgniter", "RESTful APIs"
  ],
  databases: [
    "PostgreSQL", "MySQL", "MongoDB", "Firebase"
  ],
  tools: [
    "Git", "Docker", "VS Code", "Figma", "Performance Optimization"
  ],
  ecommerce_cms: [
    "WordPress", "WooCommerce", "Shopify", "Elementor", "ACF PRO"
  ]
};

export const projects = [
  {
    title: "Sitio Web Inmobiliaria JAX",
    description: "Sitio web para la constructora Jax Investment plant, enfocado en la construcción de residenciales en El Salvador.",
    tech: ["Wordpress", "Divi", "Woody Snippet", "Slick Slider", "Advanced Custom Fields"],
    github: "",
    link: "https://residencialvistaalvalle.com/",
    image: jaxWebsite.src,
  },
  {
    title: "Sistema veterinario",
    description: "Sistema para control de expedientes de mascotas, citas y recordatorios de vacunas. ",
    tech: ["Codeigniter", "Bootstrap", "Firebase", "Fontawesome"],
    github: "",
    link: "",
    image: "https://res.cloudinary.com/djyulfuk6/image/upload/f_auto,q_auto/fl_preserve_transparency/v1772746176/vistaalvalle/sitio-veterinaria_raxygp.jpg?_s=public-apps",
  },
  {
    title: "Ecommerce The Majes Shop",
    description: "Ecommerce para la venta de productos en línea.",
    tech: ["Elementor", "Wordpress", "Woocommerce", "Slick Slider"],
    github: "",
    link: "",
    image: "https://res.cloudinary.com/djyulfuk6/image/upload/f_auto,q_auto/fl_preserve_transparency/v1772746308/vistaalvalle/the-majes_iqe71d.jpg?_s=public-apps",
  },
  {
    title: "Finance App",
    description: "Aplicación para el control de finanzas personales.",
    tech: ["React", "Codeigniter", "JWT", "Mysql", "Tailwind CSS"],
    github: "https://github.com/RaulVigil/finance-app",
    link: "https://financeapp.raulo.dev/",
    image: "https://res.cloudinary.com/djyulfuk6/image/upload/f_auto,q_auto/fl_preserve_transparency/v1772746522/vistaalvalle/Gemini_Generated_Image_qvqb16qvqb16qvqb_1_1_khygwg.jpg?_s=public-apps",
  },
  {
    title: "Kanvan Dev – Plataforma SaaS de Colaboración",
    description: "Plataforma web de gestión de proyectos al estilo Trello con tableros drag & drop, vistas de línea de tiempo (Gantt) y control de accesos mediante planes de suscripción. Arquitectura backend con Server Actions y tipado estricto end-to-end.",
    tech: ["Next.js 16", "TypeScript", "Supabase", "Prisma ORM", "PostgreSQL", "Tailwind CSS"],
    github: "https://github.com/RaulVigil/kanvan-dev",
    link: "https://kanvan-dev.vercel.app/",
    image: kanbanDev.src,
  },
  {
    title: "¿Es oferta de verdad? – Historial de precios para Black Friday",
    description: "PWA que guarda a diario el precio de más de 5,000 productos de 12 tiendas de El Salvador y compara las ofertas de Black Friday contra la mediana de lo que costaban antes del 1 de noviembre, no contra el precio tachado. Captura en Python sin dependencias con GitHub Actions y sitio estático en Vercel, sin servidor ni base de datos.",
    tech: ["Python", "JavaScript", "PWA", "GitHub Actions", "Vercel"],
    github: "https://github.com/RaulVigil/es-oferta-de-verdad",
    link: "https://es-oferta-de-verdad.vercel.app/",
    image: esOferta.src,
  }
];

export const experience = [
  {
    company: "Web Informática S.A de C.V",
    role: "Desarrollador Web Full Stack",
    period: "Enero 2023 - Actual",
    description: "Desarrollo de requerimientos críticos para Startups (CleanTech) y paneles administrativos dinámicos con React.js, Angular y Codeigniter. Implementación de autenticación segura (JWT/OAuth 2.0) y optimización de plataformas E-commerce (WordPress/Shopify) mejorando el rendimiento y SEO."
  },
  {
    company: "Freelance (Proyectos Varios)",
    role: "Full Stack Developer",
    period: "2023 - 2024",
    description: "Diseño de soluciones integrales como un sistema de gestión veterinaria con Codeigniter y Firebase, y una plataforma inmobiliaria interactiva con mapas personalizados utilizando WordPress y ACF PRO. Gestión completa de despliegue, hosting y bases de datos."
  },
  {
    company: "CDMYPE",
    role: "Desarrollador Front-End (Servicio Social)",
    period: "Enero 2021 - Noviembre 2021",
    description: "Desarrollo de un sistema de inventario y facturación para una empresa de materiales de construcción utilizando Laravel. Enfoque en la creación de interfaces funcionales y gestión de flujo de datos de inventario."
  }
];

export const about = {
  title: "Sobre mí",
  paragraphs: [
    "Soy Ingeniero en Sistemas Informáticos y Desarrollador Full Stack con más de 3 años de experiencia en el diseño y desarrollo de aplicaciones robustas. Mi enfoque se centra en transformar requerimientos de negocio en experiencias digitales de alto rendimiento, combinando la lógica técnica con estándares de calidad.",
    "Me especializo en ecosistemas JavaScript como React y Angular, así como en PHP con Laravel y CodeIgniter. Tengo una sólida trayectoria creando soluciones que van desde paneles administrativos avanzados hasta plataformas de E-commerce y sistemas de gestión complejos."
  ],
  traits: ["Aprendizaje continuo", "Orientado a resultados", "Liderazgo", "Colaborativo"],
  quote: "Siempre aprendiendo. Siempre creando. [cite: 6]"
};
