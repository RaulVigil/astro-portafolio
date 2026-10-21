export const prerender = false; // Ensures this route runs on the server
import type { APIRoute } from 'astro';
import { Resend } from 'resend';
import { RESEND_API_KEY, RESEND_FROM_EMAIL } from 'astro:env/server';

// Secrets from astro:env are read at runtime; import.meta.env would be inlined into dist/server.
const resend = new Resend(RESEND_API_KEY);

// Form input goes into the email HTML: escape it so nobody can inject links or markup.
const htmlEscapes: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => htmlEscapes[char]);

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.formData();
    const name = data.get('name')?.toString();
    const email = data.get('email')?.toString();
    const type = data.get('project-type')?.toString();
    const message = data.get('message')?.toString();

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Faltan campos obligatorios" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const fromEmail = RESEND_FROM_EMAIL || "onboarding@resend.dev";
    
    const { data: resendData, error } = await resend.emails.send({
      from: `Portafolio <${fromEmail}>`,
      to: ['rauleduardovigil@gmail.com'], // Debe ser el correo verificado en Resend (testing mode)
      subject: `Nuevo lead: ${type} - ${name}`,
      html: `
        <h2>Nuevo mensaje de contacto desde tu portafolio</h2>
        <p><strong>Nombre:</strong> ${escapeHtml(name)}</p>
        <p><strong>Email:</strong> ${escapeHtml(email)}</p>
        <p><strong>Tipo de Proyecto:</strong> ${escapeHtml(type ?? '')}</p>
        <p><strong>Mensaje:</strong><br/>${escapeHtml(message).replace(/\r?\n/g, '<br/>')}</p>
      `,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
}
