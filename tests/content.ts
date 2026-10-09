// Conteúdo do site lido dos arquivos YAML/Markdown, para os testes compararem com o que está nos arquivos
// e não com textos escritos à mão: assim editar um texto NÃO quebra os testes.
import { readdirSync, readFileSync } from 'node:fs';
import { parse } from 'yaml';
import { siteSchema, type EmailsConfig, type Site, type Ui } from '../src/lib/schemas';

const yaml = <T>(path: string) => parse(readFileSync(path, 'utf8')) as T;

export const site: Site = siteSchema.parse(yaml('src/content/site/site.yaml')); // com o telefone derivado (tel/whatsapp)
export const ui = yaml<Ui>('src/content/site/ui.yaml');
export const emails = yaml<EmailsConfig>('src/content/site/emails.yaml');

export interface HomeContent {
  hero: { title: string; primaryCta: string; secondaryCta: string };
  contact: { title: string };
}
export const home = yaml<HomeContent>('src/content/pages/home.yaml');

export interface ContactContent {
  form: {
    fields: {
      name: { label: string };
      email: { label: string };
      phone: { label: string };
      preference: { options: { value: string; label: string }[] };
      message: { label: string };
    };
    submit: string;
    errors: Record<'name' | 'email' | 'emailInvalid' | 'phone' | 'message', string>;
    failure: { generic: string; incomplete: string };
    success: { title: string };
  };
}
export const contact = yaml<ContactContent>('src/content/pages/contact.yaml');

/** Serviços na ordem de exibição (campo `order`). */
export const services = readdirSync('src/content/services')
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const front = readFileSync(`src/content/services/${f}`, 'utf8').split(/^---\s*$/m)[1];
    const data = parse(front) as { title: string; order: number; faq: { question: string }[] };
    return { slug: f.replace(/\.md$/, ''), ...data };
  })
  .sort((a, b) => a.order - b.order);

export const optionLabel = (value: string) => contact.form.fields.preference.options.find((o) => o.value === value)!.label;
