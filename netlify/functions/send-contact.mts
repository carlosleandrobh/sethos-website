// Envio do formulário de contato: valida, confere o Turnstile e envia via Resend.
// Variáveis (painel do Netlify): RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL, TURNSTILE_SECRET_KEY.
import type { Config, Context } from '@netlify/functions';
import { parseContactBody, validateContact } from '../../src/lib/contact';
import { companyEmail, visitorEmail } from '../../src/lib/emails';
import type { EmailsConfig } from '../../src/lib/schemas';
// Gerado no build a partir de src/content/site/emails.yaml (scripts/build-emails.mjs). Edite o YAML, não o JSON.
import generated from './emails.generated.json';

const MAX_BODY_BYTES = 10_000;
const templates = generated.emails as EmailsConfig;
const siteInfo = generated.site as { email: string; phone: string };

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });

const allowedOrigins = () =>
  new Set(
    [
      process.env.URL,
      process.env.DEPLOY_PRIME_URL,
      process.env.DEPLOY_URL,
      'https://sethos.com.br',
      'https://www.sethos.com.br',
      'http://localhost:8888',
      'http://localhost:4321',
    ].filter(Boolean),
  );

async function verifyTurnstile(token: string, ip: string | undefined, secret: string): Promise<boolean> {
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

async function sendEmail(apiKey: string, payload: Record<string, unknown>): Promise<boolean> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) console.error('Resend recusou o envio', res.status);
  return res.ok;
}

export default async (req: Request, context: Context): Promise<Response> => {
  if (req.method !== 'POST') return json(405, { error: 'method' });

  const origin = req.headers.get('origin');
  if (origin && !allowedOrigins().has(origin)) return json(403, { error: 'origin' });
  if (!(req.headers.get('content-type') ?? '').includes('application/json')) return json(415, { error: 'content-type' });

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) return json(413, { error: 'size' });

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return json(400, { error: 'json' });
  }

  // Honeypot: robôs preenchem o campo invisível. Responde "ok" sem enviar nada.
  if (typeof (parsed as { website?: unknown })?.website === 'string' && (parsed as { website: string }).website.trim() !== '') {
    return json(200, { ok: true });
  }

  const { RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL, TURNSTILE_SECRET_KEY } = process.env;
  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL || !CONTACT_FROM_EMAIL || !TURNSTILE_SECRET_KEY) {
    console.error('Configuração ausente: defina as variáveis de ambiente no Netlify');
    return json(500, { error: 'config' });
  }

  const token = (parsed as { turnstileToken?: unknown })?.turnstileToken;
  if (typeof token !== 'string' || !token || !(await verifyTurnstile(token, context.ip, TURNSTILE_SECRET_KEY))) {
    return json(400, { error: 'captcha' });
  }

  const contact = parseContactBody(parsed);
  if (!contact) return json(400, { error: 'invalid' });
  const { valid, errors } = validateContact(contact);
  if (!valid) return json(422, { error: 'validation', errors });

  const sent = await sendEmail(RESEND_API_KEY, {
    from: CONTACT_FROM_EMAIL,
    to: [CONTACT_TO_EMAIL],
    reply_to: contact.email,
    ...companyEmail(templates, contact),
  });
  if (!sent) return json(502, { error: 'delivery' });

  // A confirmação ao visitante é "melhor esforço": não derruba o envio se falhar.
  await sendEmail(RESEND_API_KEY, {
    from: CONTACT_FROM_EMAIL,
    to: [contact.email],
    reply_to: CONTACT_TO_EMAIL,
    ...visitorEmail(templates, contact, siteInfo),
  }).catch(() => false);

  return json(200, { ok: true });
};

export const config: Config = {
  path: '/api/contact',
  method: 'POST',
  rateLimit: { windowLimit: 5, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
