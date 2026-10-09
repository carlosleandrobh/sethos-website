/** Chave de teste da Cloudflare: o desafio sempre é aprovado. Só vale fora do Netlify. */
export const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';

/**
 * Escolhe a "site key" pública do Turnstile para o build.
 * - Valor vazio ou só espaços conta como NÃO definido (um .env copiado de .env.example vem com `CHAVE=` vazia).
 * - Em qualquer build do Netlify (produção, deploy preview, branch) a chave real é obrigatória: com a chave de teste,
 *   o servidor (que usa a chave secreta real) recusaria todos os envios do formulário.
 * - Local (npm run dev/build/test): cai na chave de teste para não travar o desenvolvimento.
 */
export function resolveTurnstileSiteKey(configured: string | undefined, onNetlify: boolean): string {
  const key = configured?.trim();
  if (key) return key;
  if (onNetlify) {
    throw new Error('PUBLIC_TURNSTILE_SITE_KEY não está definida no Netlify (Site configuration → Environment variables, em todos os contextos de deploy).');
  }
  return TURNSTILE_TEST_SITE_KEY;
}
