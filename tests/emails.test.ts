import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import type { ContactInput } from '../src/lib/contact';
import { companyEmail, visitorEmail } from '../src/lib/emails';
import { describeIssues } from '../src/lib/content';
import { emailsSchema, type EmailsConfig } from '../src/lib/schemas';

const templates = emailsSchema.parse(parse(readFileSync('src/content/site/emails.yaml', 'utf8')));
const site = { phone: '(31) 97245-7451', email: 'falecom@sethos.com.br' };
const contact: ContactInput = {
  name: 'Maria <b>Silva</b>',
  email: 'maria@empresa.com.br',
  phone: '',
  preference: 'whatsapp',
  bestTime: 'morning',
  message: 'Olá <script>alert(1)</script>\nPreciso de ajuda com a folha.',
};
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

describe('emails.yaml', () => {
  it('passa no esquema', () => {
    const r = emailsSchema.safeParse(parse(readFileSync('src/content/site/emails.yaml', 'utf8')));
    expect(r.success, r.success ? '' : describeIssues('emails.yaml', r.error.issues)).toBe(true);
  });
  it('exige {name} no assunto e na saudação', () => {
    const a = clone(templates) as EmailsConfig;
    a.company.subject = 'Nova mensagem';
    expect(emailsSchema.safeParse(a).success).toBe(false);
    const b = clone(templates) as EmailsConfig;
    b.visitor.greeting = 'Olá!';
    expect(emailsSchema.safeParse(b).success).toBe(false);
  });
});

describe('e-mail para a SETHOS', () => {
  const mail = companyEmail(templates, contact);
  it('usa o assunto do YAML com o nome preenchido', () => {
    expect(mail.subject).toBe('Nova mensagem do site - Maria <b>Silva</b>');
  });
  it('mostra todos os campos, com "Não informado" no telefone vazio', () => {
    for (const piece of ['Nome', 'E-mail', 'Telefone', 'Não informado', 'Preferência de contato', 'WhatsApp', 'Melhor horário', 'Manhã (8h às 12h)', 'Mensagem']) {
      expect(mail.html).toContain(piece);
      expect(mail.text).toContain(piece);
    }
  });
  it('escapa HTML do visitante (nome e mensagem)', () => {
    expect(mail.html).not.toContain('<script>');
    expect(mail.html).not.toContain('<b>Silva</b>');
    expect(mail.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
  it('troca de texto no YAML aparece no e-mail', () => {
    const t = clone(templates) as EmailsConfig;
    t.company.heading = 'Contato novo vindo do site';
    t.company.labels.phone = 'Fone';
    const m = companyEmail(t, contact);
    expect(m.html).toContain('Contato novo vindo do site');
    expect(m.text).toContain('Fone: Não informado');
  });
  it('assunto não aceita quebra de linha (injeção de cabeçalho)', () => {
    const m = companyEmail(templates, { ...contact, name: 'Maria\r\nBcc: x@y.com' });
    expect(m.subject).not.toMatch(/[\r\n]/);
  });
});

describe('e-mail de confirmação ao visitante', () => {
  const mail = visitorEmail(templates, contact, site);
  it('saúda pelo nome (escapado) e usa o assunto do YAML', () => {
    expect(mail.subject).toBe('Recebemos sua mensagem - SETHOS');
    expect(mail.html).toContain('Olá, Maria &lt;b&gt;Silva&lt;/b&gt;!');
    expect(mail.text.startsWith('Olá, Maria <b>Silva</b>!')).toBe(true);
  });
  it('preenche telefone e e-mail da SETHOS a partir do site.yaml', () => {
    expect(mail.text).toContain('WhatsApp: (31) 97245-7451.');
    expect(mail.text).toContain('falecom@sethos.com.br');
  });
  it('texto do YAML nunca vira HTML (um <b> digitado por quem edita é mostrado como texto)', () => {
    const t = clone(templates) as EmailsConfig;
    t.visitor.paragraphs = ['Veja <b>nosso</b> site & novidades.'];
    const m = visitorEmail(t, contact, site);
    expect(m.html).toContain('Veja &lt;b&gt;nosso&lt;/b&gt; site &amp; novidades.');
  });
  it('acrescentar um parágrafo no YAML o inclui no e-mail', () => {
    const t = clone(templates) as EmailsConfig;
    t.visitor.paragraphs.push('Atendimento de segunda a sexta, das 9h às 18h.');
    const m = visitorEmail(t, contact, site);
    expect(m.html).toContain('Atendimento de segunda a sexta');
    expect(m.text).toContain('Atendimento de segunda a sexta');
  });
});
