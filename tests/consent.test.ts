import { describe, expect, it } from 'vitest';
import {
  CONSENT_MAX_AGE_MS,
  CONSENT_VERSION,
  consentState,
  gpcEnabled,
  parseConsent,
  serializeConsent,
  TRACKING_COOKIE_PATTERNS,
} from '../src/lib/consent';

const NOW = Date.parse('2026-10-10T12:00:00Z');

describe('parseConsent', () => {
  it('aceita uma escolha válida (ida e volta)', () => {
    const raw = serializeConsent(true, new Date(NOW - 1000));
    expect(parseConsent(raw, NOW)).toEqual({ marketing: true, at: new Date(NOW - 1000).toISOString() });
    expect(parseConsent(serializeConsent(false, new Date(NOW)), NOW)?.marketing).toBe(false);
  });
  it.each([
    ['vazio', null],
    ['texto solto', 'aceito'],
    ['JSON inválido', '{nope'],
    ['sem marketing', JSON.stringify({ v: CONSENT_VERSION, at: new Date(NOW).toISOString() })],
    ['marketing não é booleano', JSON.stringify({ v: CONSENT_VERSION, marketing: 'sim', at: new Date(NOW).toISOString() })],
    ['outra versão', JSON.stringify({ v: 999, marketing: true, at: new Date(NOW).toISOString() })],
    ['data inválida', JSON.stringify({ v: CONSENT_VERSION, marketing: true, at: 'ontem' })],
  ])('descarta %s', (_, raw) => expect(parseConsent(raw as string | null, NOW)).toBeNull());

  it('expira depois de 12 meses (consulta a pessoa de novo)', () => {
    const old = serializeConsent(true, new Date(NOW - CONSENT_MAX_AGE_MS - 1000));
    expect(parseConsent(old, NOW)).toBeNull();
    const fresh = serializeConsent(true, new Date(NOW - CONSENT_MAX_AGE_MS + 60_000));
    expect(parseConsent(fresh, NOW)?.marketing).toBe(true);
  });
  it('descarta data no futuro (relógio adulterado)', () => {
    expect(parseConsent(serializeConsent(true, new Date(NOW + 3_600_000)), NOW)).toBeNull();
  });
});

describe('consentState e GPC', () => {
  const yes = { marketing: true, at: '2026-10-10T00:00:00Z' };
  const no = { marketing: false, at: '2026-10-10T00:00:00Z' };
  it('sem escolha → indeciso (nada é carregado)', () => expect(consentState(null, false)).toBe('undecided'));
  it('aceito e recusado', () => {
    expect(consentState(yes, false)).toBe('accepted');
    expect(consentState(no, false)).toBe('rejected');
  });
  it('o sinal GPC do navegador vale como recusa, mesmo com "aceito" guardado', () => {
    expect(consentState(yes, true)).toBe('rejected');
    expect(consentState(null, true)).toBe('rejected');
  });
  it('gpcEnabled só é verdadeiro com o valor true', () => {
    expect(gpcEnabled({ globalPrivacyControl: true })).toBe(true);
    expect(gpcEnabled({ globalPrivacyControl: false })).toBe(false);
    expect(gpcEnabled({})).toBe(false);
    expect(gpcEnabled(undefined)).toBe(false);
  });
});

describe('cookies de rastreamento a apagar', () => {
  it.each(['_fbp', '_fbc', '_gcl_au', '_gcl_aw', '_ga', '_ga_ABC123', '_gid', 'IDE'])('%s é apagado', (name) => {
    expect(TRACKING_COOKIE_PATTERNS.some((re) => re.test(name))).toBe(true);
  });
  it.each(['sethos-consent', 'session', 'cf_clearance', '__cf_bm'])('%s é preservado', (name) => {
    expect(TRACKING_COOKIE_PATTERNS.some((re) => re.test(name))).toBe(false);
  });
});
