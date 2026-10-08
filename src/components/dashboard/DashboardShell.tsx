import Link from 'next/link';
import type { ReactNode } from 'react';

import { DashboardSidebarNav } from '@/components/dashboard/DashboardSidebarNav';

export interface DashboardShellProps {
  children: ReactNode;
  tenantName?: string;
}

export function DashboardShell({
  children,
  tenantName = 'Tu negocio',
}: Readonly<DashboardShellProps>) {
  return (
    <div className="dashboard-shell">
      <aside className="sidebar" aria-label="Navegación del panel">
        <Link
          href="/dashboard"
          className="site-logo"
          style={{ fontSize: 'var(--text-base)', display: 'block' }}
        >
          Ambrogio<span style={{ color: 'var(--color-accent)' }}>.ai</span>
        </Link>

        <div
          className="surface-flat"
          style={{
            padding: 'var(--space-3) var(--space-4)',
            marginTop: 'var(--space-5)',
          }}
        >
          <p className="muted" style={{ fontSize: 'var(--text-xs)' }}>
            Negocio activo
          </p>
          <p
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 600,
              marginTop: '2px',
            }}
          >
            {tenantName}
          </p>
        </div>

        <DashboardSidebarNav />

        <div
          style={{
            position: 'absolute',
            bottom: 'var(--space-6)',
            left: 'var(--space-6)',
            right: 'var(--space-6)',
          }}
        >
          <Link href="/help" className="sidebar-link" style={{ fontSize: 'var(--text-xs)' }}>
            <span aria-hidden="true">?</span>
            Centro de ayuda
          </Link>
        </div>
      </aside>

      <main className="dashboard-main" id="main">
        {children}
      </main>
    </div>
  );
}
