import type { APIRoute } from 'astro';
import { blogConfig } from '../data';
import { getPosts, postUrl } from '../lib/blog';

export const GET: APIRoute = async ({ site }) => {
  const posts = await getPosts();
  const siteUrl = site ? site.toString().replace(/\/$/, '') : 'https://raulo.dev';

  const lines = [
    `# ${blogConfig.name} — ${blogConfig.title}`,
    `> ${blogConfig.description}`,
    ``,
    `Autor: ${blogConfig.author.name} (Ingeniero en Sistemas & Full Stack Developer)`,
    `Sitio web: ${siteUrl}`,
    `GitHub: https://github.com/RaulVigil`,
    `LinkedIn: https://www.linkedin.com/in/raulvigil/`,
    ``,
    `## Artículos técnicos y soluciones`,
    ``,
  ];

  for (const post of posts) {
    const fullUrl = `${siteUrl}${postUrl(post)}`;
    lines.push(`- [${post.data.title}](${fullUrl}): ${post.data.description}`);
  }

  lines.push('');

  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};

