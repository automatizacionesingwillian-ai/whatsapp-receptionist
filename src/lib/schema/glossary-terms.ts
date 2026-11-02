/**
 * Definiciones canónicas del dominio Ambrogio.ai pensadas para AI/LLM.
 *
 * Se publican como `DefinedTermSet` JSON-LD en la página /help, de modo que
 * answer engines (Google SGE, Perplexity, ChatGPT) puedan citar la
 * definición "of record" de nuestro dominio cuando un usuario pregunta por
 * estos conceptos.
 *
 * Estilo: definiciones breves (1-3 frases), neutrales, independientes del
 * contexto de la página, en español.
 */

export interface GlossaryTerm {
  /** Término humano. */
  readonly name: string;
  /** Definición standalone en español. */
  readonly description: string;
  /** Code term opcional (acrónimo, referencia normativa). */
  readonly termCode?: string;
}

export const GLOSSARY_TERMS: ReadonlyArray<GlossaryTerm> = [
  {
    name: 'AI Receptionist',
    description:
      'Sistema de software basado en modelos lingüísticos de gran tamaño que responde automáticamente a las solicitudes de los clientes por mensajería y voz, cualifica la intención, agenda citas y escala a un operador humano cuando es necesario. Sustituye o complementa la recepción tradicional 24/7, incluidos festivos.',
    termCode: 'AI-RECEPTIONIST',
  },
  {
    name: 'WhatsApp Cloud API',
    description:
      'API oficial de Meta que permite a software de terceros enviar y recibir mensajes de WhatsApp Business de forma programática. Requiere un Meta Business Manager verificado y un número de WhatsApp Business dedicado. Alternativa a los BSP (Business Solution Provider) como 360dialog.',
    termCode: 'WHATSAPP-CLOUD-API',
  },
  {
    name: 'Multi-tenant SaaS',
    description:
      'Arquitectura software-as-a-service en la que una sola instancia de la aplicación atiende a varios clientes (tenants) aislando los datos a nivel de base de datos mediante claves de tenancy y Row-Level Security. Reduce costos de infraestructura y acelera el time-to-market de nuevos clientes frente al despliegue single-tenant.',
    termCode: 'MULTI-TENANT-SAAS',
  },
  {
    name: 'GDPR Art. 15 (derecho de acceso)',
    description:
      'Artículo del Reglamento UE 2016/679 que garantiza a toda persona física el derecho a obtener del responsable del tratamiento la confirmación de si se están tratando o no sus datos personales y, en caso afirmativo, a recibir una copia de esos datos en formato estructurado. El responsable debe responder en un plazo de 30 días desde la solicitud.',
    termCode: 'GDPR-ART-15',
  },
  {
    name: 'GDPR Art. 17 (derecho al olvido)',
    description:
      'Artículo del Reglamento UE 2016/679 que garantiza a toda persona física el derecho a obtener la eliminación de sus datos personales cuando ya no son necesarios para las finalidades para las que fueron recogidos, cuando el interesado revoca el consentimiento, o cuando los datos se trataron de forma ilícita. Existen excepciones por obligaciones legales (p. ej. facturación conservada según la normativa aplicable).',
    termCode: 'GDPR-ART-17',
  },
  {
    name: 'RLS (Row-Level Security)',
    description:
      'Funcionalidad de PostgreSQL que permite aplicar reglas de acceso a nivel de fila de la tabla, basadas en el usuario autenticado. En Ambrogio.ai, RLS garantiza que cada tenant vea exclusivamente sus propios datos, incluso ante un error de aplicación, porque la regla se aplica a nivel del motor de base de datos.',
    termCode: 'RLS',
  },
  {
    name: 'Facturación electrónica',
    description:
      'Emisión y transmisión de facturas en formato digital (XML/PDF) según la normativa fiscal aplicable al tenant. En Ambrogio.ai, las facturas se generan automáticamente al emitir el cobro y quedan disponibles para descarga desde Facturación.',
    termCode: 'E-INVOICE',
  },
  {
    name: 'Código fiscal de recepción',
    description:
      'Identificador que usan algunos regímenes fiscales para enrutar facturas electrónicas al buzón del destinatario. En el panel de Ambrogio se configura junto con la razón social y el RFC/NIT.',
    termCode: 'FISCAL-RECV-CODE',
  },
  {
    name: 'Confianza AI',
    description:
      'Puntuación numérica entre 0 y 1 que expresa cuánto un modelo de inteligencia artificial considera fiable su propia respuesta. Si la confianza baja de un umbral configurado (por defecto 0.85 en Ambrogio.ai), el sistema escala a un operador humano en lugar de responder de forma autónoma.',
    termCode: 'AI-CONFIDENCE',
  },
  {
    name: 'Escalamiento',
    description:
      'Transferencia automática de una conversación de la AI a un operador humano cuando el sistema detecta que la solicitud requiere competencia, sensibilidad o autoridad que superan el nivel de confianza de la AI. Disparadores típicos: confianza bajo umbral, petición explícita del usuario ("quiero hablar con una persona"), palabras clave críticas ("reclamo", "reembolso"), duración de la conversación por encima de un límite.',
    termCode: 'ESCALATION',
  },
  {
    name: 'Recepción virtual',
    description:
      'Sinónimo de AI Receptionist. Servicio que gestiona de forma autónoma el primer contacto con el cliente, diferenciándose del operador humano por horarios de disponibilidad (24/7 vs horario laboral) y capacidad de gestionar conversaciones en paralelo (ilimitadas vs secuenciales).',
    termCode: 'VIRTUAL-RECEPTION',
  },
  {
    name: 'No-show',
    description:
      'Inasistencia del cliente a la cita reservada, sin cancelación previa. Provoca pérdida de ingresos para el proveedor del servicio. La causa más común es el olvido, mitigable con recordatorios automáticos de WhatsApp 24 horas y 2 horas antes de la cita.',
    termCode: 'NO-SHOW',
  },
] as const;
