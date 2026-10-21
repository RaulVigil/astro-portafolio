import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const blog = defineCollection({
  // Los archivos que empiezan con "_" se ignoran (notas, ideas, plantillas).
  loader: glob({ base: './src/content/blog', pattern: '**/[^_]*.md' }),
  schema: z.object({
    // Se usa como <title> y H1. Más de 60 caracteres y Google lo trunca en la SERP.
    title: z.string().max(60),
    // Meta description: el dolor técnico que resuelve el artículo, en 150 caracteres.
    description: z.string().max(150),
    // El glob loader usa `slug` como id de la entrada → URL /blog/<slug>/.
    // Obligatorio para que renombrar o mover el archivo nunca rompa URLs indexadas.
    slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug en kebab-case: minúsculas, números y guiones'),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    tags: z.array(z.string().trim().toLowerCase()).min(1).max(5),
    // Los borradores solo se generan con `astro dev`.
    draft: z.boolean().default(false),
    // Ruta dentro de /public (1200×630). Si falta, se usa la imagen OG del sitio.
    ogImage: z.string().optional(),
  }),
});

export const collections = { blog };
