import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const seo = z.object({ title: z.string().min(10), description: z.string().min(50) });
const link = z.object({ label: z.string(), href: z.string().startsWith('/') });
const hero = z.object({
  eyebrow: z.string(),
  title: z.array(z.string()).min(1), // uma linha por item (quebras de linha do título)
  lead: z.string(),
});
const titledText = z.object({ title: z.string(), text: z.string() });

/** Serviços: um .md por serviço (corpo = "Sobre este serviço"). */
const services = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/services' }),
  schema: z.object({
    title: z.string(),
    order: z.number().int().positive(),
    icon: z.string(),
    shortDescription: z.string(),
    benefits: z.array(z.string()).min(1),
    features: z.array(z.string()).min(1),
    faq: z.array(z.object({ question: z.string(), answer: z.string() })).min(1),
    cta: z.object({ title: z.string(), subtitle: z.string(), button: z.string() }),
    proposalTopic: z.string(),
    metaDescription: z.string().min(50).max(200),
    keywords: z.array(z.string()),
  }),
});

/** Páginas legais: seções com parágrafos. */
const legal = defineCollection({
  loader: glob({ pattern: '*.json', base: './src/content/legal' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    sections: z.array(z.object({ id: z.string(), title: z.string(), content: z.array(z.string()).min(1) })).min(1),
  }),
});

const page = <T extends z.ZodType>(file: string, schema: T) =>
  defineCollection({ loader: glob({ pattern: file, base: './src/content/pages' }), schema });

const home = page(
  'home.json',
  z.object({
    seo,
    hero: z.object({
      eyebrow: z.string(),
      title: z.string(),
      subtitle: z.string(),
      primaryCta: z.string(),
      secondaryCta: z.string(),
      chips: z.array(z.object({ label: z.string(), icon: z.string() })).length(4),
    }),
    highlights: z.array(titledText.extend({ cta: z.string(), href: z.string().startsWith('/') })).length(3),
    about: z.object({ title: z.string(), text: z.string(), cta: z.string() }),
    services: z.object({ title: z.string(), subtitle: z.string(), cta: z.string() }),
    contact: z.object({ title: z.string(), text: z.string(), cta: z.string() }),
  }),
);

const about = page(
  'about.json',
  z.object({
    seo,
    hero,
    story: z.object({ title: z.string(), paragraphs: z.array(z.string()).min(1), cta: z.string() }),
    mission: titledText,
    vision: titledText,
    differentials: z.object({ title: z.string(), items: z.array(z.string()).min(1) }),
    valuesLink: link,
  }),
);

const values = page('values.json', z.object({ seo, hero, items: z.array(z.object({ title: z.string(), text: z.string() })).min(1) }));

const servicesIndex = page(
  'services-index.json',
  z.object({ seo, hero, cardCta: z.string() }),
);

const contact = page(
  'contact.json',
  z.object({
    seo,
    hero,
    channels: z.array(z.object({ id: z.string(), title: z.string(), note: z.string(), value: z.string() })).length(4),
    info: z.array(z.object({ title: z.string(), value: z.string(), note: z.string() })).length(3),
    intro: titledText,
    guarantees: z.object({ title: z.string(), items: z.array(titledText) }),
    form: z.object({
      title: z.string(),
      subtitle: z.string(),
      groups: z.object({ personal: z.string(), preferences: z.string(), project: z.string() }),
      fields: z.object({
        name: z.object({ label: z.string(), placeholder: z.string() }),
        email: z.object({ label: z.string(), placeholder: z.string() }),
        phone: z.object({ label: z.string(), placeholder: z.string() }),
        preference: z.object({ label: z.string(), options: z.array(z.object({ value: z.string(), label: z.string() })) }),
        bestTime: z.object({ label: z.string(), options: z.array(z.object({ value: z.string(), label: z.string() })) }),
        message: z.object({ label: z.string(), placeholder: z.string(), counter: z.string(), hint: z.string(), suggestionsTitle: z.string(), suggestions: z.array(z.string()) }),
      }),
      submit: z.string(),
      sending: z.string(),
      errors: z.object({ name: z.string(), email: z.string(), emailInvalid: z.string(), phone: z.string(), phoneInvalid: z.string(), message: z.string() }),
      success: z.object({ title: z.string(), text: z.string(), confirmation: z.string() }),
      security: z.object({ title: z.string(), text: z.string() }),
    }),
  }),
);

export const collections = { services, legal, home, about, values, servicesIndex, contact };
