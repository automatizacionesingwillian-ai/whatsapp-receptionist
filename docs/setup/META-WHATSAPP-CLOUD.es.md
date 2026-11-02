# Meta WhatsApp Cloud API — setup (es-419)

Ambrogio usa **una sola Meta App** para conectar **varios negocios**. Cada tenant guarda su `phone_number_id` (+ token y WABA opcional). No se usa 360dialog.

App de referencia del proyecto: [Meta App dashboard](https://developers.facebook.com/apps/3610463502463141/dashboard/?business_id=4334292173483892).

## 1. Producto WhatsApp en la app

1. Abre tu app en [developers.facebook.com/apps](https://developers.facebook.com/apps/).
2. Añade el producto **WhatsApp** → **API Setup**.
3. Anota:
   - **Phone number ID**
   - **WhatsApp Business Account ID** (WABA)
   - **Temporary / permanent access token** (preferible System User permanente)

## 2. Variables de entorno (servidor Ambrogio)

```bash
WHATSAPP_API_URL="https://graph.facebook.com/v21.0"
WHATSAPP_APP_SECRET="<App Secret de Settings → Basic>"
WHATSAPP_WEBHOOK_VERIFY_TOKEN="<elige un string largo y secreto>"
# Opcional para un solo número de prueba sin UI de tenant:
WHATSAPP_API_KEY="<access token permanente>"
WHATSAPP_PHONE_NUMBER_ID="<phone-number-id>"
WHATSAPP_WABA_ID="<waba-id>"
```

En multi-tenant, cada negocio pega token / IDs en **Configuración → WhatsApp**. El env global solo sirve de fallback de desarrollo.

## 3. Webhook (callback único)

Callback URL pública:

```text
https://<tu-dominio>/api/webhook/whatsapp
```

En Meta → WhatsApp → Configuration → Webhook:

| Campo | Valor |
|---|---|
| Callback URL | la URL de arriba |
| Verify token | el mismo que `WHATSAPP_WEBHOOK_VERIFY_TOKEN` |
| Campos a suscribir | `messages`, `message_template_status_update` (opcional) |

Verificación GET: Ambrogio responde el `hub.challenge` si el token coincide.  
POST: valida `X-Hub-Signature-256` con `WHATSAPP_APP_SECRET`.

## 4. Conectar un negocio en Ambrogio

1. Entra a `/settings/whatsapp`.
2. Completa Phone number ID, WABA ID (recomendado) y Access token.
3. Guarda. Los mensajes entrantes con ese `phone_number_id` se enrutan a ese tenant.

## 5. Plantillas en español

1. En Meta Business Suite / WhatsApp Manager → Plantillas de mensajes.
2. Crea/aprueba en español (`es` o `es_MX`) al menos:
   - `appointment_confirmation`
   - `appointment_reminder_24h`
   - `appointment_reminder_1h`
   - `appointment_cancellation`
3. El código ya usa `languageCode: es`. Sin aprobación en Meta, los envíos de plantilla fallan.

## 6. Costos

- Sin canone BSP (360dialog).
- Solo tarifas de conversación de Meta según país/categoría.
- Una app Meta → N WABA / números (manual al inicio; Embedded Signup después).

## 7. Checklist rápido

- [ ] WhatsApp product activo en la app
- [ ] App Secret en `WHATSAPP_APP_SECRET`
- [ ] Webhook verificado (GET 200 con challenge)
- [ ] Suscripción a `messages`
- [ ] Token permanente (no el de 24h de prueba)
- [ ] Tenant conectado en `/settings/whatsapp`
- [ ] Plantillas ES aprobadas (cuando salgas de la ventana 24h)
