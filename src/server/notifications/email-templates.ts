/**
 * Email templates for transactional emails.
 *
 * Each template returns { subject, text, html } and accepts strongly-typed params.
 * Stylesheet inlined for max client compatibility.
 *
 * Mailer is wired separately (Resend integration TODO). These templates are
 * the rendering layer only.
 */

const BRAND_TEAL = '#0d766e';
const BRAND_BG = '#f8faf8';
const BRAND_TEXT = '#16211c';
const BRAND_MUTED = '#5e6b64';

interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

function wrapHtml(title: string, body: string, ctaUrl?: string, ctaLabel?: string): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND_BG};font-family:Inter,system-ui,-apple-system,sans-serif;color:${BRAND_TEXT};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND_BG};padding:40px 16px;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #dfe7e2;border-radius:12px;overflow:hidden;">
      <tr><td style="padding:32px 40px 16px;">
        <div style="font-size:18px;font-weight:700;letter-spacing:-0.02em;">
          Ambrogio<span style="color:${BRAND_TEAL};">.ai</span>
        </div>
      </td></tr>
      <tr><td style="padding:0 40px 32px;font-size:15px;line-height:1.6;">
        ${body}
        ${ctaUrl && ctaLabel ? `<p style="margin:32px 0 0;"><a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;background:${BRAND_TEAL};color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">${ctaLabel}</a></p>` : ''}
      </td></tr>
      <tr><td style="padding:24px 40px;border-top:1px solid #dfe7e2;color:${BRAND_MUTED};font-size:12px;">
        Ambrogio.ai — Reception AI para PyMEs · Hosted EU · GDPR ready<br/>
        Para cualquier consulta: <a href="mailto:hello@ambrogio.ai" style="color:${BRAND_TEAL};">hello@ambrogio.ai</a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export interface MagicLinkParams {
  email: string;
  link: string;
  expiresInMinutes: number;
}

export function magicLinkEmail(params: MagicLinkParams): EmailContent {
  return {
    subject: 'Tu enlace de acceso a Ambrogio.ai',
    text: `Hola,

aquí tienes tu enlace de acceso a Ambrogio.ai. Caduca en ${params.expiresInMinutes} minutos.

${params.link}

Si no solicitaste este enlace, ignora este correo: nadie puede acceder sin recibirlo.

Ambrogio.ai`,
    html: wrapHtml(
      'Tu enlace de acceso',
      `<p>Hola,</p>
       <p>aquí tienes tu enlace de acceso a Ambrogio.ai. Caduca en <strong>${params.expiresInMinutes} minutos</strong>.</p>
       <p style="color:${BRAND_MUTED};font-size:13px;">Si no solicitaste este enlace, ignora este correo: nadie puede acceder sin recibirlo.</p>`,
      params.link,
      'Iniciar sesión en Ambrogio.ai',
    ),
  };
}

export interface WelcomeParams {
  email: string;
  businessName: string;
  onboardingUrl: string;
}

export function welcomeEmail(params: WelcomeParams): EmailContent {
  return {
    subject: `¡Bienvenido a Ambrogio.ai, ${params.businessName}!`,
    text: `Hola,

¡bienvenido a Ambrogio.ai! Estamos preparando tu recepción AI para ${params.businessName}.

Continúa la configuración aquí: ${params.onboardingUrl}

En 24 horas Ambrogio estará operativo. Si necesitas ayuda, escribe a hello@ambrogio.ai.

Ambrogio.ai`,
    html: wrapHtml(
      'Bienvenido a Ambrogio.ai',
      `<p>Hola,</p>
       <p>¡bienvenido! Estamos preparando tu recepción AI para <strong>${params.businessName}</strong>.</p>
       <p>En 24 horas Ambrogio estará operativo. Bastan unos minutos de configuración para empezar:</p>
       <ul style="padding-left:20px;line-height:1.8;">
         <li>Conecta el número de WhatsApp Business</li>
         <li>Autoriza Google Calendar</li>
         <li>Carga el listado de servicios</li>
       </ul>`,
      params.onboardingUrl,
      'Continuar la configuración',
    ),
  };
}

export interface BookingConfirmationParams {
  customerName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  studioName: string;
  studioAddress: string;
}

export function bookingConfirmationEmail(params: BookingConfirmationParams): EmailContent {
  return {
    subject: `Cita confirmada — ${params.appointmentDate} a las ${params.appointmentTime}`,
    text: `Hola ${params.customerName},

tu cita está confirmada.

Servicio: ${params.serviceName}
Fecha: ${params.appointmentDate}
Hora: ${params.appointmentTime}

Estudio: ${params.studioName}
${params.studioAddress}

¡Te esperamos!

Ambrogio.ai para ${params.studioName}`,
    html: wrapHtml(
      'Cita confirmada',
      `<p>Hola ${params.customerName},</p>
       <p>tu cita está <strong>confirmada</strong>.</p>
       <table cellpadding="8" cellspacing="0" style="margin:16px 0;border-collapse:collapse;font-size:14px;">
         <tr><td style="color:${BRAND_MUTED};">Servicio:</td><td><strong>${params.serviceName}</strong></td></tr>
         <tr><td style="color:${BRAND_MUTED};">Fecha:</td><td><strong>${params.appointmentDate}</strong></td></tr>
         <tr><td style="color:${BRAND_MUTED};">Hora:</td><td><strong>${params.appointmentTime}</strong></td></tr>
         <tr><td style="color:${BRAND_MUTED};">Estudio:</td><td>${params.studioName}<br/><span style="color:${BRAND_MUTED};font-size:13px;">${params.studioAddress}</span></td></tr>
       </table>
       <p>¡Te esperamos!</p>`,
    ),
  };
}

export interface InvoiceReadyParams {
  invoiceNumber: string;
  amount: string;
  pdfUrl: string;
  customerName: string;
  period: string;
}

export function invoiceReadyEmail(params: InvoiceReadyParams): EmailContent {
  return {
    subject: `Factura ${params.invoiceNumber} — Ambrogio.ai`,
    text: `Hola ${params.customerName},

tu factura del periodo ${params.period} ya está disponible.

Número: ${params.invoiceNumber}
Importe: ${params.amount}

Descargar PDF: ${params.pdfUrl}

La factura electrónica se envió al sistema de facturación correspondiente.

Ambrogio.ai`,
    html: wrapHtml(
      'Factura disponible',
      `<p>Hola ${params.customerName},</p>
       <p>tu factura del periodo <strong>${params.period}</strong> ya está disponible.</p>
       <table cellpadding="8" cellspacing="0" style="margin:16px 0;font-size:14px;">
         <tr><td style="color:${BRAND_MUTED};">Número:</td><td><strong>${params.invoiceNumber}</strong></td></tr>
         <tr><td style="color:${BRAND_MUTED};">Importe:</td><td><strong>${params.amount}</strong></td></tr>
       </table>
       <p style="color:${BRAND_MUTED};font-size:13px;">La factura electrónica se envió al sistema de facturación correspondiente.</p>`,
      params.pdfUrl,
      'Descargar PDF de la factura',
    ),
  };
}

export interface GdprExportReadyParams {
  customerEmail: string;
  downloadUrl: string;
  expiresInHours: number;
}

export function gdprExportReadyEmail(params: GdprExportReadyParams): EmailContent {
  return {
    subject: 'Tu exportación de datos GDPR está lista',
    text: `Hola,

la exportación de tus datos personales está lista.

Descárgala aquí: ${params.downloadUrl}

El enlace caduca en ${params.expiresInHours} horas. Después deberás solicitar una nueva exportación.

Ambrogio.ai · Privacidad: privacy@ambrogio.ai`,
    html: wrapHtml(
      'Exportación de datos GDPR lista',
      `<p>Hola,</p>
       <p>la exportación de tus datos personales (Art. 15 GDPR) está lista.</p>
       <p style="color:${BRAND_MUTED};font-size:13px;">El enlace caduca en <strong>${params.expiresInHours} horas</strong> por motivos de seguridad.</p>`,
      params.downloadUrl,
      'Descargar exportación',
    ),
  };
}
