// Garante que (1) todo o conteúdo real do site passa nas "réguas" e (2) erros de edição são pegos com mensagem clara.
import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';
import { describeIssues, parseYaml } from '../src/lib/content';
import {
  aboutSchema,
  contactSchema,
  emailsSchema,
  homeSchema,
  legalSchema,
  serviceSchema,
  servicesIndexSchema,
  siteSchema,
  uiSchema,
  valuesSchema,
} from '../src/lib/schemas';

const read = (path: string) => readFileSync(path, 'utf8');
const yamlFile = (path: string) => parse(read(path)) as Record<string, unknown>;
const frontmatter = (path: string) => parse(read(path).split(/^---\s*$/m)[1]) as Record<string, unknown>;
const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v));

describe('conteúdo real passa nos esquemas', () => {
  it.each([
    ['site.yaml', siteSchema],
    ['ui.yaml', uiSchema],
    ['emails.yaml', emailsSchema],
  ] as const)('src/content/site/%s', (file, schema) => {
    expect(schema.safeParse(yamlFile(`src/content/site/${file}`)).success).toBe(true);
  });

  it.each([
    ['home.yaml', homeSchema],
    ['about.yaml', aboutSchema],
    ['values.yaml', valuesSchema],
    ['services-index.yaml', servicesIndexSchema],
    ['contact.yaml', contactSchema],
  ] as const)('src/content/pages/%s', (file, schema) => {
    const result = schema.safeParse(yamlFile(`src/content/pages/${file}`));
    expect(result.success, result.success ? '' : describeIssues(file, result.error.issues)).toBe(true);
  });

  const services = readdirSync('src/content/services').filter((f) => f.endsWith('.md'));
  it.each(services)('serviço %s', (file) => {
    const result = serviceSchema.safeParse(frontmatter(`src/content/services/${file}`));
    expect(result.success, result.success ? '' : describeIssues(file, result.error.issues)).toBe(true);
  });

  it('serviços: ordem única e nomes de arquivo válidos como endereço', () => {
    const orders = services.map((f) => frontmatter(`src/content/services/${f}`).order);
    expect(new Set(orders).size, 'dois serviços com o mesmo "order"').toBe(orders.length);
    for (const f of services) expect(f, 'nome do arquivo = endereço: só minúsculas, números e hífen').toMatch(/^[a-z0-9-]+\.md$/);
  });

  it.each(readdirSync('src/content/legal').filter((f) => f.endsWith('.md')))('página legal %s', (file) => {
    expect(legalSchema.safeParse(frontmatter(`src/content/legal/${file}`)).success).toBe(true);
    expect(read(`src/content/legal/${file}`), 'precisa ter ao menos uma seção "## "').toMatch(/^## /m);
  });
});

describe('erros de edição são pegos', () => {
  const home = yamlFile('src/content/pages/home.yaml');
  const issuesOf = (schema: typeof homeSchema, data: unknown) => {
    const r = schema.safeParse(data);
    return r.success ? [] : r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`);
  };

  it('campo apagado', () => {
    const broken = clone(home) as { hero: Record<string, unknown> };
    delete broken.hero.title;
    expect(issuesOf(homeSchema, broken).join('\n')).toContain('hero.title');
  });
  it('texto virou número ou lista (esqueceu as aspas)', () => {
    const broken = clone(home) as { hero: Record<string, unknown> };
    broken.hero.subtitle = 2024;
    expect(issuesOf(homeSchema, broken).join('\n')).toContain('precisa ser um texto');
  });
  it('texto vazio', () => {
    const broken = clone(home) as { about: Record<string, unknown> };
    broken.about.cta = '   ';
    expect(issuesOf(homeSchema, broken).join('\n')).toContain('não pode ficar vazio');
  });
  it('título do Google longo demais', () => {
    const broken = clone(home) as { seo: Record<string, unknown> };
    broken.seo.title = 'x'.repeat(90);
    expect(issuesOf(homeSchema, broken).join('\n')).toContain('máximo de 70');
  });
  it('endereço interno inválido', () => {
    const broken = clone(home) as { highlights: { href: string }[] };
    broken.highlights[0].href = 'quem-somos';
    expect(issuesOf(homeSchema, broken).join('\n')).toContain('comece com /');
  });
  it('quantidade errada de itens', () => {
    const broken = clone(home) as { highlights: unknown[] };
    broken.highlights.pop();
    expect(issuesOf(homeSchema, broken).join('\n')).toContain('exatamente 3');
  });
  it('código do formulário alterado', () => {
    const contact = clone(yamlFile('src/content/pages/contact.yaml')) as { form: { fields: { preference: { options: { value: string }[] } } } };
    contact.form.fields.preference.options[0].value = 'e-mail';
    const r = contactSchema.safeParse(contact);
    expect(r.success).toBe(false);
  });
  it('dados do site inválidos: telefone, e-mail e CNPJ', () => {
    const site = clone(yamlFile('src/content/site/site.yaml')) as { email: string; cnpj: string; phone: { tel: string } };
    site.email = 'falecom@';
    site.cnpj = '123';
    site.phone.tel = '(31) 97245-7451';
    const r = siteSchema.safeParse(site);
    const msg = r.success ? '' : r.error.issues.map((i) => i.message).join('\n');
    expect(msg).toContain('e-mail inválido');
    expect(msg).toContain('00.000.000/0000-00');
    expect(msg).toContain('sem espaços');
  });
  it('ui.yaml: não pode apagar as variáveis {year}', () => {
    const ui = clone(yamlFile('src/content/site/ui.yaml')) as { footer: { copyright: string } };
    ui.footer.copyright = '© todos os direitos reservados';
    expect(uiSchema.safeParse(ui).success).toBe(false);
  });
});

describe('mensagens em português', () => {
  it('YAML malformado aponta o arquivo e a linha', () => {
    expect(() => parseYaml('home.yaml', 'seo:\n  title: "sem fechar\nhero: 1', siteSchema)).toThrow(/Erro de formatação em home\.yaml \(linha \d+\)/);
  });
  it('YAML com Tab dá dica de indentação', () => {
    expect(() => parseYaml('home.yaml', 'a:\n\tb: 1', siteSchema)).toThrow(/Dica/);
  });
  it('campo ausente: mensagem diz "não apague esta linha"', () => {
    expect(() => parseYaml('site.yaml', 'name: "SETHOS"', siteSchema)).toThrow(/obrigatório ausente — não apague esta linha/);
  });
  it('valor errado: aponta o campo com › e a explicação', () => {
    const site = clone(yamlFile('src/content/site/site.yaml')) as { phone: { tel: string } };
    site.phone.tel = 'abc';
    const text = (() => {
      try {
        parseYaml('site.yaml', JSON.stringify(site), siteSchema);
        return '';
      } catch (e) {
        return (e as Error).message;
      }
    })();
    expect(text).toContain('Erro no arquivo site.yaml');
    expect(text).toContain('phone › tel');
  });
});
