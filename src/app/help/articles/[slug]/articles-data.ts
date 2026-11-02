/**
 * Dataset de artículos de ayuda.
 * Extraído a un módulo dedicado para mantener la página <250 líneas.
 *
 * Convenciones:
 * - slug: idéntico al filename URL, kebab-case puro
 * - description: 110-160 caracteres, optimizada para meta description SEO
 * - body: contenido completo del artículo; soporta \n para párrafos
 * - related: slugs de artículos relacionados (deduplicados por el motor de render)
 */

export interface HelpArticle {
  slug: string;
  title: string;
  body: string;
  description: string;
  category: string;
  related: ReadonlyArray<string>;
}

export const ARTICLES: Record<string, HelpArticle> = {
  'come-collegare-il-numero-whatsapp-business': {
    slug: 'come-collegare-il-numero-whatsapp-business',
    title: 'Cómo conectar el número de WhatsApp Business',
    description:
      'Setup de WhatsApp Cloud API en 3 pasos: login Meta Business, selección de número, verificación del webhook. Tiempo medio 10 minutos.',
    body: `Necesitas una cuenta Meta Business Manager activa y un número verificado. Desde el panel de Ambrogio ve a Configuración → WhatsApp y sigue los 3 pasos:\n\n1. Login Meta Business — autoriza el acceso a tu cuenta.\n2. Selecciona el número de WhatsApp Business a conectar.\n3. Verifica el webhook: Ambrogio envía un mensaje de prueba, lo recibes en tu teléfono y confirmas.\n\nTiempo medio: 10 minutos si ya tienes Business Manager. Si no, el setup de Meta puede tomar 1-3 días de verificación de documentos.`,
    category: 'Setup',
    related: ['come-autorizzare-google-calendar', 'caricare-il-listino-servizi'],
  },
  'come-autorizzare-google-calendar': {
    slug: 'come-autorizzare-google-calendar',
    title: 'Cómo autorizar Google Calendar',
    description:
      'Conecta el calendario en 2 minutos vía OAuth. Ambrogio solo lee disponibilidad y crea sus eventos; no toca eventos privados.',
    body: `Ve a Configuración → Calendario → Conectar Google Calendar. Se abre un popup OAuth de Google: inicia sesión con la cuenta que gestiona las citas del estudio y acepta los permisos.\n\nAmbrogio solo pide: leer disponibilidad, crear eventos, modificar/cancelar los eventos creados por Ambrogio. No lee los eventos privados preexistentes.\n\nSi tienes varios calendarios, puedes elegir cuál usar para las reservas de Ambrogio.`,
    category: 'Setup',
    related: ['come-collegare-il-numero-whatsapp-business', 'configurare-gli-orari-di-apertura'],
  },
  'caricare-il-listino-servizi': {
    slug: 'caricare-il-listino-servizi',
    title: 'Cargar el tarifario de servicios',
    description:
      'Agrega servicios con nombre, duración, precio y operador preferido. Importación CSV disponible. Cuanto más específicos, mejor entiende Ambrogio.',
    body: `En Configuración → Servicios puedes agregar cada servicio con: nombre, duración en minutos, precio, operador preferido (opcional).\n\nTambién puedes importar un CSV. Descarga la plantilla, complétala y súbela. Ambrogio leerá los nombres de los servicios y los usará en las conversaciones.\n\nCuanto más específicos sean los nombres (ej. "Limpieza dental" vs "Higiene"), mejor entenderá Ambrogio las solicitudes de tus clientes.`,
    category: 'Setup',
    related: ['configurare-gli-orari-di-apertura', 'come-ambrogio-prenota-appuntamenti'],
  },
  'configurare-gli-orari-di-apertura': {
    slug: 'configurare-gli-orari-di-apertura',
    title: 'Configurar horarios de apertura',
    description:
      'Define horarios por día con hasta 3 franjas. Festivos locales gestionados automáticamente.',
    body: `En Configuración → Horarios defines por cada día de la semana: hora de apertura, cierre y pausa para comer. Puedes tener hasta 3 franjas horarias por día.\n\nAmbrogio respeta automáticamente: festivos locales, días de cierre extraordinario y horarios especiales (ej. sábado reducido).\n\nPara festividades personalizadas ve a Configuración → Calendario especial.`,
    category: 'Setup',
    related: ['caricare-il-listino-servizi', 'come-ambrogio-prenota-appuntamenti'],
  },
  'come-funziona-il-filtro-ai': {
    slug: 'come-funziona-il-filtro-ai',
    title: 'Cómo funciona el filtro AI',
    description:
      'Tres filtros secuenciales: clasificación de intent, validación de seguridad, routing. Umbral de confianza ajustable.',
    body: `Cada mensaje entrante pasa por 3 filtros: clasificación de intent (reserva, info, urgencia, spam), validación de seguridad (sin PII no solicitada) y routing (la AI responde directamente o escala a un humano).\n\nEl umbral de escalación es ajustable en Configuración → AI → Confianza mínima. Por defecto: 0.85.`,
    category: 'AI',
    related: ['quando-interviene-un-umano', 'risposte-rapide-preconfezionate'],
  },
  'quando-interviene-un-umano': {
    slug: 'quando-interviene-un-umano',
    title: 'Cuándo interviene un humano',
    description:
      'Escalación por confianza baja, solicitud explícita, urgencia o palabras clave críticas. Notificación push + email.',
    body: `Ambrogio te escala cuando: la confianza de la AI está bajo el umbral, hay una solicitud explícita ("quiero hablar con una persona"), se declara urgencia, la conversación lleva abierta más de 24 h, o aparecen palabras clave críticas (ej. "reclamo", "reembolso").\n\nLas escalaciones llegan por notificación push y por email. Tiempo medio de intervención objetivo: 4 horas laborables.`,
    category: 'AI',
    related: ['come-funziona-il-filtro-ai', 'gestire-vocali-e-media'],
  },
  'gestire-vocali-e-media': {
    slug: 'gestire-vocali-e-media',
    title: 'Gestionar audios y multimedia',
    description:
      'Transcripción automática de notas de voz con ElevenLabs Speech-to-Text. Audio original conservado 90 días.',
    body: `Ambrogio transcribe automáticamente los mensajes de voz de WhatsApp (ElevenLabs Speech-to-Text). La transcripción está disponible en el detalle de la conversación y el audio original se conserva 90 días.\n\nPara las respuestas de voz salientes (Professional+), Ambrogio usa ElevenLabs Text-to-Speech con una voz en español LATAM coherente con la marca.`,
    category: 'AI',
    related: ['come-funziona-il-filtro-ai', 'quando-interviene-un-umano'],
  },
  'risposte-rapide-preconfezionate': {
    slug: 'risposte-rapide-preconfezionate',
    title: 'Respuestas rápidas predefinidas',
    description:
      'Base de conocimiento con FAQ estándar. Formato: una FAQ por línea con separador "::". Ambrogio las usa al detectar el intent.',
    body: `En Configuración → Base de conocimiento puedes cargar respuestas estándar para FAQ comunes: "¿abren el sábado?", "¿aceptan tarjetas?", "¿dónde están?". Ambrogio las usa cuando detecta el intent correspondiente.\n\nFormato: una FAQ por línea, separador "::". Ejemplo: "¿Abren el sábado? :: Sí, de 9 a 13."`,
    category: 'AI',
    related: ['come-funziona-il-filtro-ai', 'caricare-il-listino-servizi'],
  },
  'come-ambrogio-prenota-appuntamenti': {
    slug: 'come-ambrogio-prenota-appuntamenti',
    title: 'Cómo Ambrogio reserva citas',
    description:
      '5 pasos: identifica servicio, revisa disponibilidad, propone 3 horarios, confirma, crea evento. Notificación push inmediata.',
    body: `Cuando un cliente pide una cita, Ambrogio: (1) identifica el servicio solicitado, (2) revisa disponibilidad en Google Calendar, (3) propone 3 horarios, (4) confirma al seleccionar, (5) crea el evento.\n\nEl evento incluye: nombre del cliente, teléfono, servicio y notas opcionales. Te llega una notificación push inmediata.`,
    category: 'Booking',
    related: ['gestire-conflitti-calendario', 'reminder-automatici'],
  },
  'gestire-conflitti-calendario': {
    slug: 'gestire-conflitti-calendario',
    title: 'Gestionar conflictos de calendario',
    description:
      'Sin solapamientos. Sync cada 60 segundos. Race condition: el primero que confirma gana; el segundo recibe alternativas.',
    body: `Ambrogio nunca solapa dos citas. Si un cliente reserva un horario ya ocupado (race condition poco frecuente), el primero que confirma gana — el segundo recibe "lo sentimos, ese horario acaba de tomarse, ¿te propongo otros 3?".\n\nPara cambios manuales en el calendario, Ambrogio se sincroniza cada 60 segundos.`,
    category: 'Booking',
    related: ['come-ambrogio-prenota-appuntamenti', 'gestire-le-disdette'],
  },
  'reminder-automatici': {
    slug: 'reminder-automatici',
    title: 'Recordatorios automáticos',
    description:
      'Recordatorio 24 h y 2 h antes (configurable). El cliente confirma con un clic, reprograma o cancela. Recordatorio por servicio.',
    body: `Ambrogio envía recordatorios automáticos 24 h y 2 h antes de la cita (configurable). El cliente puede confirmar con un clic, reprogramar o cancelar.\n\nRecordatorio configurable por servicio: algunas visitas requieren preparación (ej. ecografía → recordatorio 48 h antes con instrucciones).`,
    category: 'Booking',
    related: ['come-ambrogio-prenota-appuntamenti', 'gestire-le-disdette'],
  },
  'gestire-le-disdette': {
    slug: 'gestire-le-disdette',
    title: 'Gestionar cancelaciones',
    description:
      'Cancelación por WhatsApp → confirmación, borrado del evento y, si aplica, nuevo horario propuesto. Política de cancelación personalizable.',
    body: `¿El cliente cancela por WhatsApp? Ambrogio: (1) pide confirmación, (2) cancela el evento de Google Calendar, (3) opcionalmente ofrece un nuevo horario, (4) te notifica.\n\nPolítica de cancelación personalizable: "cancelación libre dentro de 24 h", "penalización después de 24 h", "tarifa completa si no-show".`,
    category: 'Booking',
    related: ['gestire-conflitti-calendario', 'reminder-automatici'],
  },
  'cambiare-piano': {
    slug: 'cambiare-piano',
    title: 'Cambiar de plan',
    description:
      'Upgrade inmediato con facturación diferencial; downgrade desde el ciclo siguiente. Sin lock-in.',
    body: `En Configuración → Facturación → Cambiar plan. El upgrade es inmediato (la diferencia se factura en el ciclo actual). El downgrade aplica desde el ciclo siguiente para mantener coherencia de facturación.\n\nSin lock-in: puedes volver al plan anterior cuando quieras.`,
    category: 'Account',
    related: ['scaricare-fatture-elettroniche-sdi', 'aggiornare-dati-piva'],
  },
  'scaricare-fatture-elettroniche-sdi': {
    slug: 'scaricare-fatture-elettroniche-sdi',
    title: 'Descargar facturas electrónicas',
    description:
      'Facturas en PDF legible + XML fiscal + referencia Stripe. Emisión electrónica automática al generar la factura.',
    body: `En Facturación → Facturas encuentras todas las facturas emitidas. Cada una incluye: PDF legible, XML fiscal y referencia al pago de Stripe.\n\nLa emisión electrónica ocurre automáticamente al generar la factura. El estado de la transmisión se ve bajo cada factura.`,
    category: 'Account',
    related: ['cambiare-piano', 'aggiornare-dati-piva'],
  },
  'aggiornare-dati-piva': {
    slug: 'aggiornare-dati-piva',
    title: 'Actualizar datos fiscales',
    description:
      'Modifica razón social, RFC/NIT, código de facturación electrónica. Los cambios aplican a facturas futuras.',
    body: `En Configuración → Datos de facturación puedes modificar razón social, RFC/NIT, código de facturación electrónica, dirección e identificación fiscal.\n\nLos cambios se aplican a las facturas futuras. Las facturas ya emitidas no se modifican por coherencia fiscal.`,
    category: 'Account',
    related: ['cambiare-piano', 'scaricare-fatture-elettroniche-sdi'],
  },
  'esportare-i-miei-dati-gdpr': {
    slug: 'esportare-i-miei-dati-gdpr',
    title: 'Exportar mis datos (GDPR art. 15)',
    description:
      'Export ZIP con JSON + CSV: cuenta, conversaciones, citas, facturación, audit log. Email en un máximo de 24 horas.',
    body: `En Configuración → Seguridad → Exportar datos inicias la solicitud de exportación. Recibirás un email con un enlace seguro en un máximo de 24 horas.\n\nLa exportación contiene: datos de la cuenta, conversaciones, citas, facturación y audit log de tus acciones. Formato: ZIP con JSON estructurado + CSV.`,
    category: 'Account',
    related: ['cancellare-account', 'aggiornare-dati-piva'],
  },
  'cancellare-account': {
    slug: 'cancellare-account',
    title: 'Eliminar cuenta',
    description:
      'Eliminación con periodo de gracia de 30 días. Las facturas se conservan el tiempo exigido por la normativa fiscal aplicable.',
    body: `En Configuración → Seguridad → Eliminar cuenta. Deberás escribir "ELIMINAR DEFINITIVAMENTE" como confirmación.\n\nEntra en vigor un periodo de gracia de 30 días: en ese lapso puedes anular la solicitud. Después de los 30 días, todos tus datos se eliminan de forma definitiva (excepto las facturas, conservadas el tiempo exigido por la normativa fiscal aplicable).`,
    category: 'Account',
    related: ['esportare-i-miei-dati-gdpr', 'cambiare-piano'],
  },
};
