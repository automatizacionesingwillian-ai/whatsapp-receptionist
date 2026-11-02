import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Configuración · Ambrogio.ai',
};

interface SettingsLink {
  readonly href: string;
  readonly label: string;
  /**
   * `false` finché la pagina non esiste davvero nel router.
   *
   * L'elenco è nato come mappa del prodotto finito: quattordici voci su
   * quindici puntavano a rotte mai create, quindi a un 404. Una voce marcata
   * "In arrivo" dice la stessa cosa senza far sbattere l'utente contro un
   * errore. Quando la pagina viene creata, si alza questo flag.
   */
  readonly available: boolean;
}

interface SettingsGroup {
  readonly title: string;
  readonly description: string;
  readonly links: readonly SettingsLink[];
}

const SETTINGS_GROUPS: readonly SettingsGroup[] = [
  {
    title: 'Negocio',
    description: 'Nombre, sector, idioma, zona horaria.',
    links: [
      { href: '/settings/profile', label: 'Perfil del negocio', available: false },
      { href: '/settings/business-hours', label: 'Horarios de apertura', available: true },
      { href: '/settings/services', label: 'Servicios y tarifario', available: true },
      { href: '/settings/team', label: 'Equipo y operadores', available: false },
    ],
  },
  {
    title: 'Integraciones',
    description: 'Conecta los canales de comunicación y las herramientas que ya usas.',
    links: [
      { href: '/settings/whatsapp', label: 'WhatsApp Business', available: true },
      { href: '/settings/calendar', label: 'Google Calendar', available: false },
      { href: '/settings/voice', label: 'Voz ElevenLabs', available: false },
      { href: '/settings/webhooks', label: 'Webhooks personalizados', available: false },
    ],
  },
  {
    title: 'AI',
    description: 'Personalidad, prompts, base de conocimiento.',
    links: [
      { href: '/settings/ai', label: 'Personalidad del asistente', available: true },
      { href: '/settings/knowledge', label: 'Base de conocimiento', available: false },
      { href: '/settings/escalation', label: 'Reglas de escalamiento', available: false },
    ],
  },
  {
    title: 'Cuenta y seguridad',
    description: 'Plan, facturación, privacidad, GDPR.',
    links: [
      { href: '/billing', label: 'Plan y facturación', available: true },
      { href: '/settings/security', label: 'Seguridad', available: false },
      {
        href: '/settings/data-export',
        label: 'Exportar tus datos (GDPR art. 15)',
        available: false,
      },
      { href: '/settings/danger-zone', label: 'Eliminar cuenta', available: false },
    ],
  },
];

const ROW_STYLE = {
  padding: 'var(--space-3) var(--space-4)',
  borderRadius: 'var(--radius-md)',
  background: 'var(--color-surface-sunken)',
  fontSize: 'var(--text-sm)',
  fontWeight: 500,
} as const;

export default function SettingsPage() {
  return (
    <>
      <div className="dashboard-header">
        <div className="stack stack-2">
          <span className="eyebrow">Configuración</span>
          <h1>Configura tu negocio</h1>
          <p className="muted">
            Todo lo que tiene que ver con Ambrogio: cómo habla, cómo reserva, cómo te notifica. Las
            opciones marcadas «Próximamente» aún no están activas.
          </p>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        {SETTINGS_GROUPS.map((group) => (
          <section key={group.title} className="card stack stack-4">
            <div className="stack stack-2">
              <h2 style={{ fontSize: 'var(--text-xl)' }}>{group.title}</h2>
              <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
                {group.description}
              </p>
            </div>
            <ul style={{ listStyle: 'none', padding: 0 }} className="stack stack-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  {link.available ? (
                    <Link
                      href={link.href}
                      className="row-between"
                      style={{
                        ...ROW_STYLE,
                        transition: 'background var(--duration-normal) var(--ease-out)',
                      }}
                    >
                      <span>{link.label}</span>
                      <span aria-hidden="true">→</span>
                    </Link>
                  ) : (
                    <div className="row-between" style={{ ...ROW_STYLE, opacity: 0.65 }}>
                      <span className="muted">{link.label}</span>
                      <span className="badge badge-neutral">Próximamente</span>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </>
  );
}
