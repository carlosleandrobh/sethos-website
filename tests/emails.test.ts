import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import type { ContactInput } from '../src/lib/contact';
import { describeIssues } from '../src/lib/content';
import { companyEmail, visitorEmail } from '../src/lib/emails';
import { emailsSchema, type EmailsConfig } from '../src/lib/schemas';
import { fill } from '../src/lib/text';

// Os textos esperados vêm do próprio emails.yaml: editar o texto dos e-mails NÃO quebra estes testes.
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
const escaped = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

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
    expect(mail.subject).toBe(fill(templates.company.subject, { name: contact.name }));
  });
  it('mostra todos os campos, com o texto de "não informado" no telefone vazio', () => {
    const l = templates.company.labels;
    const pieces = [
      templates.company.heading, templates.company.messageHeading, templates.company.notInformed,
      l.name, l.email, l.phone, l.preference, l.bestTime,
      templates.preferenceLabels.whatsapp, templates.bestTimeLabels.morning,
    ];
    for (const piece of pieces) {
      expect(mail.html).toContain(escaped(piece));
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
    expect(m.text).toContain(`Fone: ${t.company.notInformed}`);
  });
  it('assunto não aceita quebra de linha (injeção de cabeçalho)', () => {
    const m = companyEmail(templates, { ...contact, name: 'Maria\r\nBcc: x@y.com' });
    expect(m.subject).not.toMatch(/[\r\n]/);
  });
});

describe('e-mail de confirmação ao visitante', () => {
  const mail = visitorEmail(templates, contact, site);
  const vars = { name: contact.name, email: contact.email, phone: site.phone, siteEmail: site.email };
  it('saúda pelo nome (escapado) e usa o assunto do YAML', () => {
    expect(mail.subject).toBe(fill(templates.visitor.subject, vars));
    expect(mail.html).toContain(escaped(fill(templates.visitor.greeting, vars)));
    expect(mail.text.startsWith(fill(templates.visitor.greeting, vars))).toBe(true);
  });
  it('preenche telefone e e-mail da SETHOS a partir do site.yaml, onde o YAML pedir', () => {
    const all = [...templates.visitor.paragraphs, ...templates.visitor.signature].join(' ');
    if (all.includes('{phone}')) expect(mail.text).toContain(site.phone);
    if (all.includes('{siteEmail}')) expect(mail.text).toContain(site.email);
    expect(mail.text).not.toMatch(/\{(name|phone|siteEmail|email)\}/); // nenhuma variável fica sem preencher
  });
  it('mostra todos os parágrafos e a assinatura do YAML', () => {
    for (const p of templates.visitor.paragraphs) expect(mail.text).toContain(fill(p, vars));
    for (const s of templates.visitor.signature) expect(mail.text).toContain(fill(s, vars));
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
