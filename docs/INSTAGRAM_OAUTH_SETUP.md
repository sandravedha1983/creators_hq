# Instagram Login configuration

CreatorsHQ uses Meta's **Instagram Login** product, not Facebook Login. The backend must use the Instagram App ID and Instagram App Secret shown in the Meta app's Instagram Login configuration.

## Meta

1. Add/configure the Instagram Login product for the Meta app.
2. Add this exact valid OAuth redirect URI to the Instagram Login settings:

   `https://creators-hq-lz3d.onrender.com/api/integrations/instagram/callback`

   If the Render service hostname changes, update the URI here and set `INSTAGRAM_REDIRECT_URI` to the identical new URL.
3. Request only the `instagram_business_basic` permission. The user must authorize an Instagram Professional account.
4. Configure the Instagram App ID and Instagram App Secret as Render environment variables. Do not put either in Meta's client-side settings or the Vercel project.

## Render backend

Set these server-only variables:

| Variable | Value |
| --- | --- |
| `INSTAGRAM_APP_ID` | Instagram Login App ID from Meta |
| `INSTAGRAM_APP_SECRET` | Instagram Login App Secret from Meta |
| `INSTAGRAM_REDIRECT_URI` | `https://creators-hq-lz3d.onrender.com/api/integrations/instagram/callback` |
| `INSTAGRAM_TOKEN_ENCRYPTION_KEY` | Random 32-byte key encoded as 64 hexadecimal characters |
| `FRONTEND_URL` | Canonical deployed Vercel site origin, without a path |
| `CORS_ALLOWED_ORIGINS` | Add any additional exact deployed frontend origins, comma-separated |

Generate the encryption key in a trusted local environment, for example with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Store it in Render's secret environment configuration only. Keep the same key across normal deploys; rotating it requires a planned token re-encryption or reconnection.

Run the new Supabase migration [`20261118000000_add_instagram_login_integrations.sql`](../supabase/migrations/20261118000000_add_instagram_login_integrations.sql) before enabling the flow.

## Vercel frontend

Set `VITE_API_URL` to the backend origin:

`https://creators-hq-lz3d.onrender.com`

Keep the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` configuration. Do not add Instagram credentials or the token encryption key to Vercel; only the backend handles Instagram OAuth tokens.

## Deployment notes

The callback URI is fixed by `INSTAGRAM_REDIRECT_URI`; the authorization-code exchange uses that exact configured URI. Production must use HTTPS. The backend sets a short-lived HttpOnly browser-binding cookie during connection initiation, so keep the frontend origin in the backend CORS allowlist and enable credentialed requests.

These settings document the deployment requirements only. The OAuth flow has not been tested against the live Meta app or real Instagram credentials.
