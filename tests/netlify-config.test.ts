// Trava as decisões de segurança e de URLs do netlify.toml: se alguém afrouxar a CSP ou apagar um redirecionamento,
// o portão reprova. (O comportamento real foi verificado com `netlify dev`.)
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const toml = readFileSync('netlify.toml', 'utf8');
const csp = toml.match(/Content-Security-Policy\s*=\s*"([^"]+)"/)![1];
const redirects = [...toml.matchAll(/\[\[redirects\]\]\s+from\s*=\s*"([^"]+)"\s+to\s*=\s*"([^"]+)"\s+status\s*=\s*(\d+)/g)].map((m) => ({
  from: m[1],
  to: m[2],
  status: Number(m[3]),
}));

describe('netlify.toml — segurança', () => {
  it('CSP estrita: sem unsafe-eval nem unsafe-inline, só o Turnstile como terceiro', () => {
    expect(csp).not.toContain('unsafe-eval');
    expect(csp).not.toContain('unsafe-inline');
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    const origins = [...csp.matchAll(/https?:\/\/[^\s;]+/g)].map((m) => m[0]);
    expect(new Set(origins)).toEqual(new Set(['https://challenges.cloudflare.com']));
  });
  it.each(['Strict-Transport-Security', 'X-Content-Type-Options', 'X-Frame-Options', 'Referrer-Policy', 'Permissions-Policy'])(
    'cabeçalho %s',
    (header) => expect(toml).toContain(header),
  );
  it('libera só a chave PÚBLICA do Turnstile no secrets scanning (nunca os segredos)', () => {
    expect(toml).toMatch(/SECRETS_SCAN_OMIT_KEYS\s*=\s*"PUBLIC_TURNSTILE_SITE_KEY"/);
  });
});

describe('netlify.toml — redirecionamentos de URLs antigas', () => {
  const rule = (from: string) => redirects.find((r) => r.from === from);
  it('painel antigo /cms e subcaminhos saem do ar com 410 (Gone)', () => {
    expect(rule('/cms')?.status).toBe(410);
    expect(rule('/cms/*')?.status).toBe(410);
  });
  it('variações comuns apontam para a URL canônica com 301', () => {
    expect(rule('/index.html')).toMatchObject({ to: '/', status: 301 });
    expect(rule('/home')).toMatchObject({ to: '/', status: 301 });
    expect(rule('/servicos/')).toMatchObject({ to: '/servicos', status: 301 });
  });
  it('nenhum redirecionamento aponta para si mesmo', () => {
    for (const r of redirects) expect(r.from).not.toBe(r.to);
  });
});
