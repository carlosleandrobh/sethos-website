import { describe, expect, it } from 'vitest';
import { escapeHtml, formatPhone, parseContactBody, singleLine, validateContact, type ContactInput } from '../src/lib/contact';

const base: ContactInput = {
  name: 'Maria',
  email: 'maria@empresa.com.br',
  phone: '',
  preference: 'email',
  message: 'Preciso de ajuda com a folha.',
};

describe('validateContact', () => {
  it('aceita e-mail como preferência sem telefone', () => {
    expect(validateContact(base).valid).toBe(true);
  });
  it('exige nome, e-mail e mensagem', () => {
    const r = validateContact({ ...base, name: ' ', email: '', message: '' });
    expect(r.errors).toEqual({ name: 'name', email: 'email', message: 'message' });
  });
  it('rejeita e-mail inválido', () => {
    expect(validateContact({ ...base, email: 'maria@' }).errors.email).toBe('emailInvalid');
  });
  it('exige telefone quando a preferência é telefone ou WhatsApp', () => {
    expect(validateContact({ ...base, preference: 'whatsapp' }).errors.phone).toBe('phone');
    expect(validateContact({ ...base, preference: 'phone', phone: '123' }).errors.phone).toBe('phoneInvalid');
    expect(validateContact({ ...base, preference: 'phone', phone: '(31) 97245-7451' }).valid).toBe(true);
  });
});

describe('formatPhone', () => {
  it.each([
    ['3', '(3'],
    ['31972', '(31) 972'],
    ['3132457451', '(31) 3245-7451'],
    ['31972457451', '(31) 97245-7451'],
    ['3197245745199', '(31) 97245-7451'],
  ])('%s -> %s', (input, expected) => expect(formatPhone(input)).toBe(expected));
});

describe('segurança', () => {
  it('escapa HTML e script', () => {
    expect(escapeHtml('<script>alert("x")</script> & \'a\'')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;a&#39;',
    );
  });
  it('remove quebras de linha (injeção de cabeçalho)', () => {
    expect(singleLine('Maria\r\nBcc: alguem@x.com')).toBe('Maria Bcc: alguem@x.com');
  });
  it('parseContactBody limita tamanhos e rejeita formato inválido', () => {
    expect(parseContactBody(null)).toBeNull();
    expect(parseContactBody({ ...base, preference: 'pombo' })).toBeNull();
    const parsed = parseContactBody({ ...base, message: 'a'.repeat(5000), name: 'x'.repeat(500) })!;
    expect(parsed.message).toHaveLength(2000);
    expect(parsed.name).toHaveLength(120);
  });
});
