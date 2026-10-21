import type { APIRoute } from 'astro';
import { blogConfig } from '../data';

// ads.txt declara qué vendedores pueden vender anuncios en raulo.dev.
// f08c47fec0942fa0 es el identificador fijo de Google en el estándar ads.txt de IAB.
export const GET: APIRoute = () => {
  const { client } = blogConfig.adsense;
  const body = client ? `google.com, ${client.replace(/^ca-/, '')}, DIRECT, f08c47fec0942fa0\n` : '';
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
