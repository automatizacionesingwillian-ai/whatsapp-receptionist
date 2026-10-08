/**
 * Verticales dataset.
 * Estratto in modulo dedicato per mantenere la pagina <250 righe.
 */

export interface VerticalContent {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  serviceType: string;
  hero: {
    eyebrow: string;
    h1: string;
    body: string;
  };
  icon: string;
  pains: { title: string; body: string }[];
  scenarios: { title: string; body: string }[];
  metric: { value: string; label: string };
  relatedBlogSlug: string | null;
}

export const VERTICALS_DATA: Record<string, VerticalContent> = {
  dental: {
    slug: 'dental',
    title: 'Clínicas dentales',
    metaTitle: 'Recepción AI para clínicas dentales',
    metaDescription:
      'Recepción AI para clínicas dentales. Filtra urgencias, gestiona recordatorios y sabe cuándo hace falta el especialista.',
    serviceType: 'Recepción AI para clínicas dentales',
    hero: {
      eyebrow: 'Para clínicas dentales',
      h1: 'Nunca más pierdas una llamada de urgencia.',
      body: 'Ambrogio distingue si es dolor agudo o una limpieza de rutina, agenda citas, gestiona recordatorios semestrales y cada mañana te entrega la lista de prioridades.',
    },
    icon: '/assets/site-images/ambrogio/svg/06-vertical-dental.svg',
    pains: [
      {
        title: 'Recepción bajo presión',
        body: 'El equipo pasa la mitad del tiempo al teléfono. Ambrogio da el primer paso y libera a las personas para el valor humano.',
      },
      {
        title: 'Recordatorios que se olvidan',
        body: 'Higiene semestral, controles post-tratamiento, ortodoncia. Ambrogio lo recuerda todo y contacta en el momento correcto.',
      },
      {
        title: 'Urgencias fuera de horario',
        body: 'Dolor de noche. Festivos. Sábado por la tarde. Ambrogio responde, califica la urgencia y te avisa solo cuando hace falta.',
      },
    ],
    scenarios: [
      {
        title: 'Higiene semestral',
        body: '“Buenos días, le toca la limpieza a Ana.” Ambrogio lee la última visita, propone 3 horarios y confirma en Google Calendar.',
      },
      {
        title: 'Dolor dental agudo',
        body: '“Mucho dolor, lado derecho, desde esta mañana.” Ambrogio pregunta escala 1-10, califica y escala de inmediato si es >7.',
      },
      {
        title: 'Presupuesto de ortodoncia',
        body: '“¿Cuánto cuesta el aparato?” Ambrogio recopila datos previos, agenda visita de valoración con todo listo.',
      },
    ],
    metric: { value: '24/7', label: 'Responde y reserva también fuera de horario' },
    relatedBlogSlug: null,
  },
  beauty: {
    slug: 'beauty',
    title: 'Centros de estética y SPA',
    metaTitle: 'Recepción AI para centros de estética y SPA',
    metaDescription:
      'Recepción AI para centros de estética, peluquerías y SPA. Tratamientos, paquetes y tarjetas regalo.',
    serviceType: 'Recepción AI para centros de estética',
    hero: {
      eyebrow: 'Para centros de estética y SPA',
      h1: 'Cada tratamiento tiene su precio, su tiempo y su material. Ambrogio los conoce.',
      body: 'Manicura, pedicura, depilación, masajes, láser, facial. Ambrogio maneja tarifarios complejos, paquetes y tarjetas regalo. Y habla con el tono cálido de tu marca.',
    },
    icon: '/assets/site-images/ambrogio/svg/07-vertical-beauty.svg',
    pains: [
      {
        title: 'Tarifario complejo',
        body: 'Decenas de tratamientos con tiempos, materiales y especialistas. Ambrogio sabe quién hace qué y cuánto cuesta.',
      },
      {
        title: 'Paquetes y tarjetas regalo',
        body: '¿Vendes paquetes? ¿Tarjetas regalo? ¿Promos de temporada? Ambrogio conoce las condiciones y aplica las reglas correctas.',
      },
      {
        title: 'Inasistencias',
        body: 'Recordatorios por WhatsApp 24 h antes reducen los no-show hasta un 70 %. Ambrogio los envía automáticamente.',
      },
    ],
    scenarios: [
      {
        title: 'Paquete facial',
        body: '“Quiero empezar el paquete de limpieza profunda.” Ambrogio propone 4 horarios semanales por 4 semanas y gestiona la agenda.',
      },
      {
        title: 'Tarjeta regalo navideña',
        body: '“¿Puedo comprar una tarjeta de 80 €?” Ambrogio recopila datos, envía enlace de Stripe y genera un código único.',
      },
      {
        title: 'Promo de temporada',
        body: '“¿Sigue vigente la promo de bronceado?” Ambrogio revisa fechas y condiciones, y reserva.',
      },
    ],
    metric: { value: 'Auto', label: 'Recordatorio antes de cada cita' },
    relatedBlogSlug: null,
  },
  fitness: {
    slug: 'fitness',
    title: 'Gimnasios y entrenadores personales',
    metaTitle: 'Recepción AI para gimnasios y entrenadores',
    metaDescription:
      'Recepción AI para gimnasios, estudios de pilates y personal trainers. Clases, slots de PT y membresías.',
    serviceType: 'Recepción AI para gimnasios y PT',
    hero: {
      eyebrow: 'Para gimnasios y personal trainers',
      h1: 'Clases llenas. Menos bajas. Más tiempo para entrenar.',
      body: 'Ambrogio gestiona clases grupales, slots de entrenamiento personal, listas de espera y membresías. Envía los recordatorios que marcan la diferencia entre asistir o faltar.',
    },
    icon: '/assets/site-images/ambrogio/svg/08-vertical-fitness.svg',
    pains: [
      {
        title: 'Clases con cupo limitado',
        body: 'Pilates, yoga, spinning. Plazas limitadas, lista de espera dinámica, no-shows. Ambrogio lo coordina como un dispatcher.',
      },
      {
        title: 'Slots de PT',
        body: 'Cada entrenador tiene su calendario. Ambrogio respeta disponibilidad, evita solapes y propone alternativas.',
      },
      {
        title: 'Membresías por vencer',
        body: 'Ambrogio envía recordatorios de renovación antes del vencimiento. Las bajas bajan de forma medible.',
      },
    ],
    scenarios: [
      {
        title: 'Reserva de clase',
        body: '“¿Pilates el martes a las 19?” Ambrogio revisa cupo, confirma y manda recordatorio 2 h antes.',
      },
      {
        title: 'Lista de espera',
        body: '“¿Lleno? Avísame si se libera.” Ambrogio apunta en lista y contacta automáticamente si hay cancelación.',
      },
      {
        title: 'Slot recurrente de PT',
        body: '“Quiero los lunes a las 18 con Marco.” Ambrogio crea slots recurrentes en el Google Calendar de Marco.',
      },
    ],
    metric: { value: 'Live', label: 'Cupos y disponibilidad siempre actualizados' },
    relatedBlogSlug: null,
  },
  professional: {
    slug: 'professional',
    title: 'Negocios profesionales',
    metaTitle: 'Recepción AI para negocios profesionales',
    metaDescription:
      'Recepción AI para abogados, contadores y consultores. Califica leads y agenda reuniones.',
    serviceType: 'Recepción AI para negocios profesionales',
    hero: {
      eyebrow: 'Para negocios profesionales',
      h1: 'Solo reuniones que valen. Solo clientes adecuados.',
      body: 'Abogados, contadores, consultores. Ambrogio califica solicitudes, recopila el briefing previo y agenda solo reuniones con quien realmente está interesado.',
    },
    icon: '/assets/site-images/ambrogio/svg/09-vertical-professional-office.svg',
    pains: [
      {
        title: 'Leads sin calificar',
        body: 'Muchas llamadas, pocos clientes. Ambrogio pide de entrada la información clave y filtra antes de ocupar tu tiempo.',
      },
      {
        title: 'Sin briefing previo',
        body: 'Llegas a la reunión sin contexto del caso. Ambrogio recopila el contexto y te lo envía 30 min antes.',
      },
      {
        title: 'Confidencialidad',
        body: 'Los datos permanecen en la UE, enmascarados en logs y cifrados en reposo. DPA listo para cada cliente que lo pida.',
      },
    ],
    scenarios: [
      {
        title: 'Nuevo cliente — abogado',
        body: '“Tengo un problema laboral.” Ambrogio pregunta sector, urgencia, tipo de caso, primera audiencia y envía el briefing.',
      },
      {
        title: 'Contador — alta fiscal',
        body: '“Quiero abrir mi actividad.” Ambrogio pregunta tipo de negocio, régimen fiscal y agenda la llamada.',
      },
      {
        title: 'Consultor — renovación',
        body: '“Quiero hablar de la renovación.” Ambrogio identifica al cliente, recupera historial y fija reunión con contexto.',
      },
    ],
    metric: { value: 'Filtro', label: 'Califica la solicitud antes del contacto' },
    relatedBlogSlug: null,
  },
};

export const VERTICAL_SLUGS = Object.keys(VERTICALS_DATA) as ReadonlyArray<
  keyof typeof VERTICALS_DATA
>;
