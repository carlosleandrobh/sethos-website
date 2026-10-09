/** Preenche os marcadores dos textos jurídicos com os dados de contato de site.yaml (fonte única). */
const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export interface ContactData {
  email: string;
  phone: string;
}

/** `{email}` vira um link mailto; `{phone}` vira o telefone escrito. Outros textos entre chaves ficam como estão. */
export function fillContactTokens(html: string, { email, phone }: ContactData): string {
  return html
    .replace(/\{email\}/g, `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`)
    .replace(/\{phone\}/g, escapeHtml(phone));
}

/** Marcadores `{...}` encontrados em um texto (para validar que só existem os permitidos). */
export const tokensIn = (text: string): string[] => [...new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))];
export const ALLOWED_LEGAL_TOKENS = ['email', 'phone'];
