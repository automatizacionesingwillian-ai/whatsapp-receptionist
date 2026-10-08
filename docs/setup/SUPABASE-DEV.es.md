# Conectar Supabase en desarrollo (Windows / local)

Guía mínima para pasar de marketing estático a **dashboard con datos reales**.

## 1. Proyecto Supabase

Proyecto de desarrollo actual: **SENTRA AI** (`tkaayejekdpyimmmpbdi`, región `us-west-2`).
Schema aplicado el 2026-10-08 (22 tablas + RLS + RPCs).

1. Ve a **Project Settings → API** y confirma en `.env.local`:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL` = `https://tkaayejekdpyimmmpbdi.supabase.co`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** (solo servidor, nunca en el cliente) → `SUPABASE_SERVICE_ROLE_KEY`

`.env.local` no se commitea.

## 2. Auth (magic link)

En **Authentication → URL Configuration**:

| Campo | Valor local |
|--------|-------------|
| Site URL | `http://localhost:3000` |
| Redirect URLs | `http://localhost:3000/auth/callback` |

Opcional: desactiva “Confirm email” en **Providers → Email** si quieres iterar más rápido en dev (en producción conviene dejarlo activo).

Flujo esperado:

1. **Registro** (`/register`) → crea tenant + envía magic link.
2. Abres el enlace del correo → **`/auth/callback`** establece la sesión.
3. **Onboarding** → **Dashboard** con datos del tenant.

Login (`/login`) solo pide email y envía otro magic link (`/api/auth/magic-link`).

Si ves `email rate limit exceeded` en la consola de `npm run dev`, Supabase ha bloqueado temporalmente el envío de correo. En development la app hace fallback: en `/login` aparece un **recovery link** clicable (también se imprime en los logs del servidor). Ábrelo en el mismo navegador para completar el acceso.

## 3. Aplicar migraciones SQL

Desde la raíz del repo (Node 22 recomendado):

```powershell
npm ci
npx supabase login
npx supabase link --project-ref TU_PROJECT_REF
npx supabase db push
npm run db:lint
```

El **project ref** está en la URL del dashboard: `https://supabase.com/dashboard/project/<project-ref>`.

Si no tienes Supabase CLI: `npm install -g supabase` o usa el instalador desde [supabase.com/docs/guides/cli](https://supabase.com/docs/guides/cli).

## 4. Variables ya preparadas en `.env.local`

- `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL` → `http://localhost:3000`
- `INTERNAL_JOB_SECRET` → generado (cron/jobs internos en dev)
- `GOOGLE_OAUTH_STATE_SECRET` e `INTEGRATION_CREDENTIALS_ENCRYPTION_KEY` → generados (Calendar/WhatsApp cifrado cuando los configures)

**Upstash vacío:** el rate limit usa memoria en proceso (válido en local).

**Anthropic / Stripe / WhatsApp:** opcionales para ver el dashboard; necesarios para AI, billing y mensajes reales.

## 5. Arrancar la app

```powershell
npm run dev
```

Abre `http://localhost:3000`, regístrate con un email real (para recibir el magic link).

## 6. Comprobaciones rápidas

| Check | Esperado |
|--------|----------|
| `GET /api/health` | `200` (puede marcar dependencias opcionales como degraded) |
| Tras login, `/dashboard` | KPIs/conversaciones desde Postgres (vacío al inicio, no mock) |
| Supabase **Table Editor** | Tablas `tenants`, `users`, etc. tras registro |

## 7. Super admin (opcional)

El panel `/admin` exige `app_metadata.is_super_admin = true` en el usuario de Supabase Auth. Configúralo manualmente en el dashboard de Auth o vía script admin; no hay UI de bootstrap en el repo.

## 8. Node.js

El proyecto exige **Node `>=22 <23`**. Con Node 24 los tests pueden fallar en Windows; usa [nvm-windows](https://github.com/coreybutler/nvm-windows) o fnm para instalar Node 22 LTS.

## Solución de problemas

- **Magic link a 404:** falta `http://localhost:3000/auth/callback` en Redirect URLs de Supabase.
- **Dashboard 500 / “Supabase admin credentials”:** faltan URL o `SUPABASE_SERVICE_ROLE_KEY` en `.env.local` → reinicia `npm run dev`.
- **Registro falla:** migraciones no aplicadas → `npx supabase db push`.
- **No llega el email:** revisa spam; en dev puedes usar el **Auth logs** de Supabase o SMTP custom en Authentication settings.
