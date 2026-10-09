// Dados de contato têm UMA fonte: src/content/site/site.yaml. Nenhum outro arquivo de conteúdo pode repeti-los à mão,
// senão trocar o telefone/e-mail num lugar deixaria o número antigo em outro (foi o que o teste de ida-e-volta achou).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { fillContactTokens, tokensIn, ALLOWED_LEGAL_TOKENS } from '../src/lib/legal';
import { site } from './content';

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = `${dir}/${n}`;
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

// site.yaml é a fonte; emails.yaml usa {phone}/{siteEmail}.
const files = walk('src/content').filter((f) => !f.endsWith('site/site.yaml'));
const values = [site.email, site.phone.display, site.phone.tel, site.phone.whatsapp];

describe('dados de contato: fonte única', () => {
  it.each(files)('%s não repete e-mail/telefone do site.yaml', (file) => {
    const text = readFileSync(file, 'utf8');
    const repeated = values.filter((v) => text.includes(v));
    expect(repeated, `use {email}/{phone} (textos jurídicos) ou deixe vir do site.yaml: ${file}`).toEqual([]);
  });

  it.each(files.filter((f) => f.includes('/legal/')))('%s só usa marcadores permitidos', (file) => {
    const unknown = tokensIn(readFileSync(file, 'utf8')).filter((t) => !ALLOWED_LEGAL_TOKENS.includes(t));
    expect(unknown, `marcadores permitidos: {email} e {phone} — ${file}`).toEqual([]);
  });
});

describe('fillContactTokens', () => {
  const data = { email: 'a@b.com', phone: '(11) 91234-5678' };
  it('{email} vira link mailto e {phone} vira o telefone', () => {
    expect(fillContactTokens('<p>E-mail: {email} | Tel: {phone}</p>', data)).toBe(
      '<p>E-mail: <a href="mailto:a@b.com">a@b.com</a> | Tel: (11) 91234-5678</p>',
    );
  });
  it('escapa HTML nos dados e preenche todas as ocorrências', () => {
    const r = fillContactTokens('{phone} {phone}', { email: 'x@y.com', phone: '<b>1</b>' });
    expect(r).toBe('&lt;b&gt;1&lt;/b&gt; &lt;b&gt;1&lt;/b&gt;');
  });
  it('não mexe em outros textos entre chaves', () => {
    expect(fillContactTokens('{outro}', data)).toBe('{outro}');
  });
});
