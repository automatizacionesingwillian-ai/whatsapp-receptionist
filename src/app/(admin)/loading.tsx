/**
 * Stato di caricamento del pannello cross-tenant.
 *
 * Le pagine admin eseguono probe di rete reali (health check dei provider) e
 * conteggi sul database: senza questo file la navigazione resta bloccata sulla
 * pagina precedente finché tutte le query non rispondono.
 */
export default function AdminLoading() {
  return (
    <div className="stack stack-8" role="status" aria-live="polite" aria-busy="true">
      <div className="stack stack-2">
        <span className="badge badge-warm">Cross-tenant</span>
        <h1 style={{ opacity: 0.5 }}>Cargando…</h1>
        <p className="muted">Consultando la base de datos y los proveedores externos.</p>
      </div>

      <div
        className="card"
        style={{
          display: 'grid',
          placeItems: 'center',
          minHeight: '240px',
          gap: 'var(--space-4)',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-full)',
            border: '3px solid var(--color-border)',
            borderTopColor: 'var(--color-accent)',
            animation: 'admin-spin var(--duration-slow) linear infinite',
          }}
        />
        <span className="muted" style={{ fontSize: 'var(--text-sm)' }}>
          Las mediciones se ejecutan en cada carga; no se leen de caché.
        </span>
      </div>

      <style>{`
        @keyframes admin-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
