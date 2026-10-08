// Lógica do formulário de contato, compartilhada entre o navegador e a função do Netlify.
// Regras e mensagens vêm do site antigo (formValidation.ts).

export const MAX_MESSAGE = 2000;
export const PREFERENCES = ['email', 'phone', 'whatsapp'] as const;
export const BEST_TIMES = ['morning', 'afternoon', 'businessHours'] as const;

export type Preference = (typeof PREFERENCES)[number];
export type BestTime = (typeof BEST_TIMES)[number];

export interface ContactInput {
  name: string;
  email: string;
  phone: string;
  preference: Preference;
  bestTime?: BestTime;
  message: string;
}

export type ContactErrors = Partial<Record<'name' | 'email' | 'phone' | 'message', keyof typeof ERRORS>>;

export const ERRORS = {
  name: 'name',
  email: 'email',
  emailInvalid: 'emailInvalid',
  phone: 'phone',
  phoneInvalid: 'phoneInvalid',
  message: 'message',
} as const;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const digits = (value: string) => value.replace(/\D/g, '');

/** Retorna os códigos de erro por campo (o texto vem de contact.json). */
export function validateContact(input: ContactInput): { valid: boolean; errors: ContactErrors } {
  const errors: ContactErrors = {};
  if (!input.name.trim()) errors.name = 'name';
  if (!input.email.trim()) errors.email = 'email';
  else if (!EMAIL.test(input.email.trim()) || input.email.length > 254) errors.email = 'emailInvalid';
  if (input.preference === 'phone' || input.preference === 'whatsapp') {
    if (!input.phone.trim()) errors.phone = 'phone';
    else if (digits(input.phone).length < 10 || digits(input.phone).length > 13) errors.phone = 'phoneInvalid';
  }
  if (!input.message.trim()) errors.message = 'message';
  return { valid: Object.keys(errors).length === 0, errors };
}

/** Máscara brasileira: (31) 97245-7451 ou (31) 3245-7451. */
export function formatPhone(value: string): string {
  const d = digits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Remove quebras de linha e caracteres de controle (evita injeção de cabeçalho em e-mail). */
// eslint-disable-next-line no-control-regex -- remover caracteres de controle é o objetivo
export const singleLine = (value: string) => value.replace(/[\u0000-\u001F\u007F]+/g, ' ').trim();

/** Normaliza e limita o corpo recebido; devolve null se o formato for inválido. */
export function parseContactBody(body: unknown): ContactInput | null {
  if (typeof body !== 'object' || body === null) return null;
  const b = body as Record<string, unknown>;
  const str = (v: unknown, max: number) => (typeof v === 'string' ? v.slice(0, max) : '');
  const preference = PREFERENCES.find((p) => p === b.preference);
  if (!preference) return null;
  const bestTime = BEST_TIMES.find((t) => t === b.bestTime);
  return {
    name: singleLine(str(b.name, 120)),
    email: singleLine(str(b.email, 254)),
    phone: singleLine(str(b.phone, 25)),
    preference,
    bestTime,
    message: str(b.message, MAX_MESSAGE).replace(/\r\n/g, '\n'),
  };
}
