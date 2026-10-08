'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const SIDEBAR_ITEMS = [
  { href: '/dashboard', label: 'Resumen', icon: '◐' },
  { href: '/conversations', label: 'Conversaciones', icon: '✻' },
  { href: '/calendar', label: 'Calendario', icon: '◫' },
  { href: '/knowledge', label: 'Base de conocimiento', icon: '☰' },
  { href: '/settings', label: 'Configuración', icon: '⚙' },
  { href: '/billing', label: 'Facturación', icon: '€' },
] as const;

export function DashboardSidebarNav() {
  const pathname = usePathname() ?? '';

  return (
    <ul className="sidebar-nav">
      {SIDEBAR_ITEMS.map((item) => {
        const active = isSidebarItemActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={active ? 'sidebar-link sidebar-link-active' : 'sidebar-link'}
              aria-current={active ? 'page' : undefined}
            >
              <span aria-hidden="true" style={{ width: '1.25rem' }}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Marca activo el módulo y sus subrutas (`/settings/whatsapp` → Configuración). */
export function isSidebarItemActive(pathname: string, href: string): boolean {
  if (href === '/dashboard') {
    return pathname === '/dashboard' || pathname === '/dashboard/';
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}
