/**
 * Cloudflare Worker: formulario de contacto de raulo.dev.
 *
 * En producción el sitio es estático (Namecheap) y no puede ejecutar src/pages/api/send.ts.
 * Este Worker atiende la misma ruta y responde igual, así que el formulario no cambia.
 *
 * Despliegue (dashboard de Cloudflare):
 *   - Ruta:     raulo.dev/api/send  (zona raulo.dev)
 *   - Secreto:  RESEND_API_KEY
 *   - Variable: RESEND_FROM_EMAIL   (opcional; sin ella se usa onboarding@resend.dev)
 */

const TO = ['rauleduardovigil@gmail.com'];
const GENERIC_ERROR = 'Ocurrió un error al enviar el mensaje. Escríbeme a rauleduardovigil@gmail.com.';

const htmlEscapes = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => htmlEscapes[char]);

const json = (body, status) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return json({ error: 'Método no permitido' }, 405);
    }

    let data;
    try {
      data = await request.formData();
    } catch {
      return json({ error: 'Faltan campos obligatorios' }, 400);
    }

    const name = data.get('name')?.toString().trim();
    const email = data.get('email')?.toString().trim();
    const type = data.get('project-type')?.toString() ?? '';
    const message = data.get('message')?.toString().trim();

    if (!name || !email || !message) {
      return json({ error: 'Faltan campos obligatorios' }, 400);
    }

    const fromEmail = env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
          // Sin User-Agent, la API de Resend responde 403 (error 1010).
          'User-Agent': 'raulo-contact-worker/1.0',
        },
        body: JSON.stringify({
          from: `Portafolio <${fromEmail}>`,
          to: TO,
          reply_to: email,
          subject: `Nuevo lead: ${type} - ${name}`,
          html: `
            <h2>Nuevo mensaje de contacto desde tu portafolio</h2>
            <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <p><strong>Tipo de Proyecto:</strong> ${escapeHtml(type)}</p>
            <p><strong>Mensaje:</strong><br/>${escapeHtml(message).replace(/\r?\n/g, '<br/>')}</p>
          `,
        }),
      });

      if (!res.ok) {
        // El detalle queda en los logs del Worker; al visitante no le sirve.
        console.error('Resend', res.status, await res.text());
        return json({ error: GENERIC_ERROR }, 500);
      }

      return json({ success: true }, 200);
    } catch (error) {
      console.error('Worker', error);
      return json({ error: GENERIC_ERROR }, 500);
    }
  },
};
