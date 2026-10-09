import { describe, expect, it } from 'vitest';
import { resolveTurnstileSiteKey, TURNSTILE_TEST_SITE_KEY } from '../src/lib/turnstile';

describe('resolveTurnstileSiteKey', () => {
  it('usa a chave configurada', () => {
    expect(resolveTurnstileSiteKey('0x4AAAAAAAreal', true)).toBe('0x4AAAAAAAreal');
    expect(resolveTurnstileSiteKey('  0x4AAAAAAAreal  ', false)).toBe('0x4AAAAAAAreal');
  });
  it('valor vazio (ex.: .env copiado do modelo) conta como não definido → chave de teste localmente', () => {
    expect(resolveTurnstileSiteKey('', false)).toBe(TURNSTILE_TEST_SITE_KEY);
    expect(resolveTurnstileSiteKey('   ', false)).toBe(TURNSTILE_TEST_SITE_KEY);
    expect(resolveTurnstileSiteKey(undefined, false)).toBe(TURNSTILE_TEST_SITE_KEY);
  });
  it('no Netlify a chave real é obrigatória (produção, preview ou branch)', () => {
    expect(() => resolveTurnstileSiteKey('', true)).toThrow(/não está definida no Netlify/);
    expect(() => resolveTurnstileSiteKey(undefined, true)).toThrow();
  });
});
