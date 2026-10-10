// Esquemas ("réguas") do conteúdo. Se um arquivo YAML/Markdown não passar aqui, o build falha
// com uma mensagem em português dizendo o arquivo, o campo e o que corrigir.
import { z } from 'astro/zod';

export const text = z.string({ error: 'precisa ser um texto (coloque entre aspas)' }).trim().min(1, 'não pode ficar vazio');
export const internalPath = text.regex(/^\/[a-z0-9\-/]*$/, 'endereço interno: comece com / e use só letras minúsculas, números e hífen (ex.: /contato)');
export const externalUrl = text.regex(/^https?:\/\/\S+$/, 'endereço completo, começando com https://');
export const iconName = text.regex(/^[a-z0-9-]+(:[a-z0-9-]+)?$/, 'nome de ícone: letras minúsculas e hífen (ex.: users) ou com prefixo (ex.: simple-icons:linkedin)');

const link = z.object({ label: text, href: internalPath });

/** src/content/site/site.yaml */
export const siteSchema = z.object({
  name: text,
  legalName: text,
  cnpj: text.regex(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, 'formato: 00.000.000/0000-00'),
  url: externalUrl.refine((u) => !u.endsWith('/'), 'sem barra no final'),
  email: text.regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'e-mail inválido'),
  // O telefone é escrito UMA vez (como aparece no site); os formatos do link de ligar (tel) e do WhatsApp são derivados.
  phone: z
    .object({
      display: text.regex(/^\(\d{2}\) \d{4,5}-\d{4}$/, 'formato: (31) 97245-7451 — com DDD entre parênteses, espaço e hífen'),
    })
    .transform(({ display }) => {
      const digits = display.replace(/\D/g, '');
      return { display, tel: `+55${digits}`, whatsapp: `55${digits}` };
    }),
  address: z.object({ locality: text, region: text.length(2, 'sigla do estado com 2 letras (ex.: MG)') }),
  whatsappMessage: text.max(300, 'máximo de 300 caracteres'),
  whatsappMessageContactPage: text.max(300, 'máximo de 300 caracteres'),
  schedule: z.object({ url: externalUrl, serviceUrl: externalUrl }),
  social: z.array(z.object({ label: text, icon: iconName, href: externalUrl })),
  nav: z.array(link).min(2, 'precisa de pelo menos 2 itens').max(7, 'no máximo 7 itens (cabe no menu)'),
  legalNav: z.array(link).min(1),
  cta: link,
  footer: z.object({ description: text, disclaimer: text }),
  whatsappTooltip: z.object({ title: text, text, aria: text }),
});

/** src/content/site/ui.yaml */
export const uiSchema = z.object({
  skipLink: text,
  nav: z.object({ mainAria: text, homeAria: text, logoAlt: text, openMenu: text }),
  footer: z.object({
    logoAlt: text, followUs: text, followAria: text, quickLinks: text, quickLinksAria: text,
    contact: text, whatsapp: text, backToTop: text,
    copyright: text.refine((t) => t.includes('{year}') && t.includes('{legalName}') && t.includes('{cnpj}'), 'precisa manter {year}, {legalName} e {cnpj}'),
  }),
  whatsappFloat: z.object({ aria: text }),
  hero: z.object({ mascotAlt: text }),
  home: z.object({ highlightsAria: text, allServicesAria: text }),
  breadcrumb: z.object({ label: text, home: text, services: text, allServices: text }),
  service: z.object({
    about: text, benefits: text, features: text, faq: text, previous: text, next: text, navAria: text,
    interested: text, proposalPrefix: z.string().min(1), whatsapp: text, share: text, shareLinkedIn: text,
    shareEmail: text, copyLink: text, linkCopied: text,
    titleSuffix: z.string().min(1),
    shareEmailBody: text.refine((t) => t.includes('{description}') && t.includes('{url}'), 'precisa manter {description} e {url}'),
    whatsappTemplate: text.refine((t) => ['{title}', '{name}', '{email}', '{phone}', '{message}'].every((k) => t.includes(k)), 'precisa manter {title}, {name}, {email}, {phone} e {message}'),
    form: z.object({ name: text, email: text, phone: text, message: text }),
  }),
  legal: z.object({ indexAria: text, ctaTitle: text, ctaText: text, ctaPrimary: text, ctaSecondary: text, titleSuffix: z.string().min(1) }),
  contactPage: z.object({ channelsAria: text, honeypotLabel: text }),
  notFound: z.object({ title: text, description: text, code: text, heading: text, text, cta: text }),
});

export type Site = z.infer<typeof siteSchema>;
export type Ui = z.infer<typeof uiSchema>;

// ---------------------------------------------------------------------------------------------
//  Coleções de conteúdo (páginas, serviços, legais). Usadas por src/content.config.ts e pelos testes.
// ---------------------------------------------------------------------------------------------
const title = text.max(90, 'máximo de 90 caracteres');
const button = text.max(40, 'texto de botão: máximo de 40 caracteres');
const lead = text.max(320, 'máximo de 320 caracteres');
const paragraph = text.max(1500, 'máximo de 1500 caracteres por parágrafo');
const line = text.max(160, 'máximo de 160 caracteres');

export const seo = z.object({
  title: text.max(70, 'título do Google: máximo de 70 caracteres (o restante é cortado)'),
  description: text.min(70, 'descrição do Google: mínimo de 70 caracteres').max(200, 'descrição do Google: máximo de 200 caracteres'),
});
const hero = z.object({
  eyebrow: text.max(40, 'máximo de 40 caracteres'),
  title: z.array(text.max(40, 'cada linha do título: máximo de 40 caracteres')).min(1).max(3, 'no máximo 3 linhas'),
  lead,
});
const titledText = z.object({ title, text: paragraph });

export const homeSchema = z.object({
  seo,
  hero: z.object({
    eyebrow: text.max(40),
    title,
    subtitle: lead,
    primaryCta: button,
    secondaryCta: button,
    chips: z.array(z.object({ label: text.max(30, 'máximo de 30 caracteres'), icon: iconName })).length(4, 'precisa ter exatamente 4 etiquetas'),
  }),
  highlights: z.array(titledText.extend({ cta: button, href: internalPath })).length(3, 'precisa ter exatamente 3 destaques'),
  about: z.object({ title, text: paragraph, cta: button }),
  services: z.object({ title, subtitle: lead, cta: button }),
  contact: z.object({ title, text: lead, cta: button }),
});

export const aboutSchema = z.object({
  seo,
  hero,
  story: z.object({ title, paragraphs: z.array(paragraph).min(1).max(6), cta: button }),
  mission: titledText,
  vision: titledText,
  differentials: z.object({ title, items: z.array(line).min(1).max(10) }),
  valuesLink: z.object({ label: text.max(60), href: internalPath }),
});

export const valuesSchema = z.object({ seo, hero, items: z.array(titledText).min(1).max(12) });

export const servicesIndexSchema = z.object({ seo, hero, cardCta: button });

const choice = (codes: readonly [string, ...string[]]) =>
  z.array(z.object({ value: z.enum(codes, { error: `código inválido — use um destes: ${codes.join(', ')} (não altere o "value")` }), label: text.max(40) })).length(codes.length, `precisa ter exatamente ${codes.length} opções`);

export const contactSchema = z.object({
  seo,
  hero,
  channels: z
    .array(
      z
        .object({
          id: z.enum(['email', 'whatsapp', 'phone', 'schedule'], { error: 'não altere o "id" dos canais' }),
          title: text.max(50),
          note: line,
          // E-mail e telefone vêm de site.yaml; só o canal "schedule" precisa de texto próprio.
          value: line.optional(),
        })
        .refine((c) => c.id !== 'schedule' || !!c.value, 'o canal "schedule" precisa de um texto (value)'),
    )
    .length(4, 'precisa ter exatamente 4 canais'),
  info: z.array(z.object({ title: text.max(50), value: line, note: line })).length(3, 'precisa ter exatamente 3 informações'),
  intro: titledText,
  guarantees: z.object({ title, items: z.array(z.object({ title: text.max(60), text: line })).min(1).max(8) }),
  form: z.object({
    title,
    subtitle: line,
    groups: z.object({ personal: text.max(50), preferences: text.max(50), project: text.max(50) }),
    fields: z.object({
      name: z.object({ label: text.max(50), placeholder: text.max(80) }),
      email: z.object({ label: text.max(50), placeholder: text.max(80) }),
      phone: z.object({ label: text.max(50), placeholder: text.max(80) }),
      preference: z.object({ label: text.max(50), options: choice(['email', 'phone', 'whatsapp']) }),
      bestTime: z.object({ label: text.max(50), options: choice(['morning', 'afternoon', 'businessHours']) }),
      message: z.object({
        label: text.max(60),
        placeholder: text.max(200),
        counter: text.max(30),
        hint: line,
        suggestionsTitle: text.max(60),
        suggestions: z.array(line).min(1).max(8),
      }),
    }),
    submit: button,
    sending: button,
    errors: z.object({ name: line, email: line, emailInvalid: line, phone: line, phoneInvalid: line, message: line }),
    failure: z.object({ network: lead, generic: lead, incomplete: lead }),
    success: z.object({ title, text: lead, confirmation: line }),
    security: z.object({ title: line, text: lead }),
  }),
});

export const serviceSchema = z.object({
  title: text.max(80, 'título do serviço: máximo de 80 caracteres'),
  order: z.number({ error: 'precisa ser um número (1 aparece primeiro)' }).int().positive(),
  icon: iconName,
  shortDescription: text.max(200, 'descrição curta: máximo de 200 caracteres'),
  benefits: z.array(text.max(120, 'cada benefício: máximo de 120 caracteres')).min(1).max(10),
  features: z.array(text.max(120, 'cada item: máximo de 120 caracteres')).min(1).max(10),
  faq: z.array(z.object({ question: text.max(160), answer: text.max(700, 'resposta: máximo de 700 caracteres') })).min(1).max(10),
  cta: z.object({ title: text.max(80), subtitle: text.max(180), button }),
  proposalTopic: text.max(120),
  metaDescription: text.min(50, 'mínimo de 50 caracteres').max(200, 'máximo de 200 caracteres'),
  keywords: z.array(text.max(60)).max(12),
});

export const legalSchema = z.object({ title: text.max(80), description: text.max(300) });

/** src/content/site/emails.yaml — textos dos e-mails enviados pelo formulário de contato. */
const withVars = (vars: string[]) => (t: string) => vars.every((v) => t.includes(`{${v}}`));
export const emailsSchema = z.object({
  company: z.object({
    subject: text.max(120).refine(withVars(['name']), 'o assunto precisa conter {name}'),
    heading: text.max(120),
    messageHeading: text.max(60),
    notInformed: text.max(40),
    labels: z.object({ name: text.max(40), email: text.max(40), phone: text.max(40), preference: text.max(60), bestTime: text.max(60) }),
  }),
  preferenceLabels: z.object({ email: text.max(40), phone: text.max(40), whatsapp: text.max(40) }),
  bestTimeLabels: z.object({ morning: text.max(60), afternoon: text.max(60), businessHours: text.max(60) }),
  visitor: z.object({
    subject: text.max(120),
    greeting: text.max(120).refine(withVars(['name']), 'a saudação precisa conter {name}'),
    paragraphs: z.array(text.max(600, 'cada parágrafo: máximo de 600 caracteres')).min(1).max(8),
    signature: z.array(text.max(120)).min(1).max(6),
  }),
});
export type EmailsConfig = z.infer<typeof emailsSchema>;

/** src/content/site/redirects.yaml — endereços antigos que passam a apontar para outra página (301). */
export const redirectsSchema = z.object({
  redirects: z.array(z.object({ from: internalPath, to: internalPath })),
});
