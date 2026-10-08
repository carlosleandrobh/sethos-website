// Envio do formulário de contato: valida, confere o Turnstile e envia via Resend.
// Variáveis (painel do Netlify): RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL, TURNSTILE_SECRET_KEY.
import type { Config, Context } from '@netlify/functions';
import { escapeHtml, parseContactBody, singleLine, validateContact, type ContactInput } from '../../src/lib/contact';

const MAX_BODY_BYTES = 10_000;
const PREFERENCE_LABEL = { email: 'E-mail', phone: 'Telefone', whatsapp: 'WhatsApp' } as const;
const TIME_LABEL = { morning: 'Manhã (8h às 12h)', afternoon: 'Tarde (13h às 18h)', businessHours: 'Horário comercial' } as const;

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

const row = (label: string, value: string) =>
  `<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top"><strong>${escapeHtml(label)}</strong></td><td style="padding:6px 0">${escapeHtml(value)}</td></tr>`;

function companyEmail(c: ContactInput) {
  const rows = [
    row('Nome', c.name),
    row('E-mail', c.email),
    row('Telefone', c.phone || 'Não informado'),
    row('Preferência de contato', PREFERENCE_LABEL[c.preference]),
    row('Melhor horário', c.bestTime ? TIME_LABEL[c.bestTime] : 'Não informado'),
  ].join('');
  const html = `<h2 style="font-family:Arial,sans-serif">Nova mensagem pelo site</h2><table style="font-family:Arial,sans-serif;font-size:15px">${rows}</table><h3 style="font-family:Arial,sans-serif">Mensagem</h3><p style="font-family:Arial,sans-serif;font-size:15px;white-space:pre-wrap">${escapeHtml(c.message)}</p>`;
  const text = `Nova mensagem pelo site\n\nNome: ${c.name}\nE-mail: ${c.email}\nTelefone: ${c.phone || 'Não informado'}\nPreferência: ${PREFERENCE_LABEL[c.preference]}\nMelhor horário: ${c.bestTime ? TIME_LABEL[c.bestTime] : 'Não informado'}\n\n${c.message}`;
  return { html, text };
}

function visitorEmail(c: ContactInput) {
  const html = `<div style="font-family:Arial,sans-serif;font-size:15px"><p>Olá, ${escapeHtml(c.name)}!</p><p>Recebemos sua mensagem e nossa equipe retornará em breve com uma proposta personalizada.</p><p>Se preferir, fale conosco pelo WhatsApp: (31) 97245-7451.</p><p>SETHOS Tecnologia da Informação<br>falecom@sethos.com.br</p></div>`;
  const text = `Olá, ${c.name}!\n\nRecebemos sua mensagem e nossa equipe retornará em breve com uma proposta personalizada.\nSe preferir, fale conosco pelo WhatsApp: (31) 97245-7451.\n\nSETHOS Tecnologia da Informação\nfalecom@sethos.com.br`;
  return { html, text };
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

  const company = companyEmail(contact);
  const sent = await sendEmail(RESEND_API_KEY, {
    from: CONTACT_FROM_EMAIL,
    to: [CONTACT_TO_EMAIL],
    reply_to: contact.email,
    subject: `Nova mensagem do site - ${singleLine(contact.name)}`.slice(0, 200),
    ...company,
  });
  if (!sent) return json(502, { error: 'delivery' });

  // A confirmação ao visitante é "melhor esforço": não derruba o envio se falhar.
  await sendEmail(RESEND_API_KEY, {
    from: CONTACT_FROM_EMAIL,
    to: [contact.email],
    reply_to: CONTACT_TO_EMAIL,
    subject: 'Recebemos sua mensagem - SETHOS',
    ...visitorEmail(contact),
  }).catch(() => false);

  return json(200, { ok: true });
};

export const config: Config = {
  path: '/api/contact',
  method: 'POST',
  rateLimit: { windowLimit: 5, windowSize: 60, aggregateBy: ['ip', 'domain'] },
};
