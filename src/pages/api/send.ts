export const prerender = false; // Ensures this route runs on the server
import type { APIRoute } from 'astro';
import { Resend } from 'resend';

// Use import.meta.env for Vite environment variables
const resend = new Resend(import.meta.env.RESEND_API_KEY || process.env.RESEND_API_KEY);

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

    const fromEmail = import.meta.env.RESEND_FROM_EMAIL || process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
    
    const { data: resendData, error } = await resend.emails.send({
      from: `Portafolio <${fromEmail}>`,
      to: ['rauleduardovigil@gmail.com'], // Debe ser el correo verificado en Resend (testing mode)
      subject: `Nuevo lead: ${type} - ${name}`,
      html: `
        <h2>Nuevo mensaje de contacto desde tu portafolio</h2>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Tipo de Proyecto:</strong> ${type}</p>
        <p><strong>Mensaje:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>
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
