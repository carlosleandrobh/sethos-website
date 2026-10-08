import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import handler from '../netlify/functions/send-contact.mts';

const ctx = { ip: '203.0.113.9' } as Parameters<typeof handler>[1];
const valid = {
  name: 'Maria <b>Silva</b>',
  email: 'maria@empresa.com.br',
  phone: '(31) 97245-7451',
  preference: 'whatsapp',
  bestTime: 'morning',
  message: 'Olá <script>alert(1)</script>\nPreciso de ajuda.',
  website: '',
  turnstileToken: 'token-ok',
};

const request = (body: unknown, init: RequestInit = {}) =>
  new Request('https://sethos.com.br/api/contact', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'https://sethos.com.br' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
    ...init,
  });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  process.env.RESEND_API_KEY = 're_test';
  process.env.CONTACT_TO_EMAIL = 'falecom@sethos.com.br';
  process.env.CONTACT_FROM_EMAIL = 'SETHOS <contato@sethos.com.br>';
  process.env.TURNSTILE_SECRET_KEY = 'secret';
  fetchMock = vi.fn(async (url: string) =>
    String(url).includes('turnstile')
      ? new Response(JSON.stringify({ success: true }))
      : new Response(JSON.stringify({ id: 'x' }), { status: 200 }),
  );
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const resendCalls = () => fetchMock.mock.calls.filter(([u]) => String(u).includes('resend.com'));

describe('send-contact', () => {
  it('rejeita método diferente de POST', async () => {
    expect((await handler(new Request('https://sethos.com.br/api/contact'), ctx)).status).toBe(405);
  });
  it('rejeita origem não permitida', async () => {
    const res = await handler(request(valid, { headers: { 'content-type': 'application/json', origin: 'https://evil.example' } }), ctx);
    expect(res.status).toBe(403);
  });
  it('rejeita JSON inválido e corpo grande', async () => {
    expect((await handler(request('{nope'), ctx)).status).toBe(400);
    expect((await handler(request({ ...valid, message: 'a'.repeat(20000) }), ctx)).status).toBe(413);
  });
  it('honeypot preenchido: responde ok mas não envia nada', async () => {
    const res = await handler(request({ ...valid, website: 'http://spam.example' }), ctx);
    expect(res.status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('captcha ausente ou reprovado -> 400', async () => {
    expect((await handler(request({ ...valid, turnstileToken: '' }), ctx)).status).toBe(400);
    fetchMock.mockResolvedValueOnce(new Response(JSON.stringify({ success: false })));
    expect((await handler(request(valid), ctx)).status).toBe(400);
    expect(resendCalls()).toHaveLength(0);
  });
  it('validação -> 422 com códigos de erro', async () => {
    const res = await handler(request({ ...valid, email: 'x', message: '' }), ctx);
    expect(res.status).toBe(422);
    expect(((await res.json()) as { errors: Record<string, string> }).errors).toEqual({ email: 'emailInvalid', message: 'message' });
  });
  it('sem variáveis de ambiente -> 500', async () => {
    delete process.env.RESEND_API_KEY;
    expect((await handler(request(valid), ctx)).status).toBe(500);
  });
  it('sucesso: envia e-mail à empresa (HTML escapado) e confirmação ao visitante', async () => {
    const res = await handler(request(valid), ctx);
    expect(res.status).toBe(200);
    const calls = resendCalls().map(([, init]) => JSON.parse((init as RequestInit).body as string));
    expect(calls).toHaveLength(2);
    expect(calls[0].to).toEqual(['falecom@sethos.com.br']);
    expect(calls[0].reply_to).toBe('maria@empresa.com.br');
    expect(calls[0].html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(calls[0].html).not.toContain('<script>');
    expect(calls[1].to).toEqual(['maria@empresa.com.br']);
  });
  it('falha da confirmação não derruba o envio; falha da empresa -> 502', async () => {
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true })))
      .mockResolvedValueOnce(new Response('{}', { status: 200 }))
      .mockResolvedValueOnce(new Response('{}', { status: 500 }));
    expect((await handler(request(valid), ctx)).status).toBe(200);
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ success: true })))
      .mockResolvedValueOnce(new Response('{}', { status: 500 }));
    expect((await handler(request(valid), ctx)).status).toBe(502);
  });
});
