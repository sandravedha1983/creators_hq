# Gemini AI configuration

CreatorsHQ makes AI requests from the authenticated Express backend only. The
backend uses Google's `@google/genai` SDK and the `gemini-3.5-flash-lite` model.
The existing AI Studio generation, growth-suggestions, chat, fallback, history,
and plan-usage behavior remains in place.

## Local development

Set `GEMINI_API_KEY` in `backend/.env` (use `backend/.env.example` as a template).
Do not add this key to `frontend/.env`, `admin/.env`, browser code, or any
`VITE_`/`NEXT_PUBLIC_` variable. The key must never be committed.

## Render backend

In the Render dashboard, open the CreatorsHQ backend web service, then **Environment**:

1. Add `GEMINI_API_KEY` with the API key from Google AI Studio.
2. Save the environment change and allow Render to restart/redeploy the backend.
3. Keep the key out of build logs and frontend configuration.

If the key is missing or invalid, AI routes continue to return the established
fallback content with a warning; the warning is visible in the AI Studio and
chat UI. Quota, network, timeout, and invalid-response failures are similarly
reported without logging prompts, responses, or credentials.

## Vercel frontend

Do **not** configure `GEMINI_API_KEY` in Vercel. Configure only the backend URL
as `VITE_API_URL` for the frontend deployment, pointing it at the Render API
origin (for example, `https://creators-hq-lz3d.onrender.com`). The browser calls
the Render API, and the Gemini key remains on the backend.

No Supabase schema or migration change is needed; new generation history rows
record the Gemini model name from the backend.
