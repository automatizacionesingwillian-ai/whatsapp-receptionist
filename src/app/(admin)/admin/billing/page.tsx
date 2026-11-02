import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Billing · Admin',
  robots: { index: false, follow: false },
};

/*
 * Esta página publicaba KPI financieros inventados (MRR, ARR proyectado,
 * clientes de pago, churn, growth rate), un histórico MRR a seis meses y un
 * listado de facturas, todo hardcodeado y presentado como real. El markup
 * anterior permanece en el historial de git.
 *
 * No se sustituyó con datos reales porque las métricas de ingresos deben
 * leerse de Stripe, que es la fuente autoritativa: recalcularlas desde una
 * tabla local produciría un segundo número destinado a divergir del fiscal.
 */
export default function AdminBillingPage() {
  return (
    <div className="stack stack-6">
      <header className="stack stack-2">
        <span className="eyebrow">Admin</span>
        <h1>Billing</h1>
        <p className="muted">Métricas de ingresos y estado de las suscripciones.</p>
      </header>

      <div className="card card-padded stack stack-4">
        <h2 style={{ fontSize: 'var(--text-lg)' }}>Aún no conectado a datos reales</h2>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          Esta pantalla mostraba MRR, ARR, número de clientes de pago, churn e histórico a seis
          meses como si estuvieran medidos. Eran valores escritos a mano: se eliminaron.
        </p>
        <p style={{ color: 'var(--color-text-secondary)' }}>
          La fuente autoritativa de ingresos es el dashboard de Stripe, que es también el que
          concuerda con la contabilidad. Un segundo cálculo aquí sobre datos locales acabaría
          divergiendo, y entonces ninguno de los dos números sería fiable.
        </p>
        <div className="row" style={{ gap: 'var(--space-3)', flexWrap: 'wrap' }}>
          <a
            href="https://dashboard.stripe.com/"
            className="btn btn-primary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir el dashboard de Stripe
          </a>
        </div>
      </div>
    </div>
  );
}
