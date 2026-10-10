// Decisão de consentimento de cookies (LGPD): o que foi escolhido, por quanto tempo vale e o que o navegador pede.
// Funções puras, sem acesso ao DOM: o armazenamento e a interface ficam em ConsentBanner.astro.

export const CONSENT_KEY = 'sethos-consent';
export const CONSENT_VERSION = 1;
/** Validade da escolha: depois disso a pessoa é consultada de novo (boa prática: 6 a 12 meses). */
export const CONSENT_MAX_AGE_MS = 365 * 24 * 60 * 60 * 1000;

export interface ConsentChoice {
  marketing: boolean;
  at: string;
}
export type ConsentState = 'accepted' | 'rejected' | 'undecided';

export function serializeConsent(marketing: boolean, now: Date): string {
  return JSON.stringify({ v: CONSENT_VERSION, marketing, at: now.toISOString() });
}

/** Lê a escolha guardada; devolve null se não existe, está corrompida, é de outra versão ou expirou. */
export function parseConsent(raw: string | null | undefined, now: number): ConsentChoice | null {
  if (!raw) return null;
  try {
    const data = JSON.parse(raw) as { v?: unknown; marketing?: unknown; at?: unknown };
    if (data.v !== CONSENT_VERSION || typeof data.marketing !== 'boolean' || typeof data.at !== 'string') return null;
    const when = Date.parse(data.at);
    if (Number.isNaN(when) || now - when > CONSENT_MAX_AGE_MS || when > now + 60_000) return null;
    return { marketing: data.marketing, at: data.at };
  } catch {
    return null;
  }
}

/** Sinal "Global Privacy Control" do navegador: equivale a recusar cookies de marketing. */
export const gpcEnabled = (nav: { globalPrivacyControl?: boolean } | undefined): boolean => nav?.globalPrivacyControl === true;

export function consentState(choice: ConsentChoice | null, gpc: boolean): ConsentState {
  if (gpc) return 'rejected';
  if (!choice) return 'undecided';
  return choice.marketing ? 'accepted' : 'rejected';
}

/** Cookies que as ferramentas de marketing criam; apagados quando a pessoa recusa depois de ter aceitado. */
export const TRACKING_COOKIE_PATTERNS = [/^_fbp$/, /^_fbc$/, /^_gcl_/, /^_ga/, /^_gid$/, /^IDE$/, /^test_cookie$/];
