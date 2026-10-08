import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import type { z } from 'astro/zod';
import {
  aboutSchema,
  contactSchema,
  homeSchema,
  legalSchema,
  serviceSchema,
  servicesIndexSchema,
  valuesSchema,
} from './lib/schemas';

// As "réguas" (limites de tamanho, campos obrigatórios, formatos) ficam em src/lib/schemas.ts.
// Se um arquivo de conteúdo não passar, o build falha dizendo o arquivo, o campo e o que corrigir.

/** Serviços: um .md por serviço (corpo = "Sobre este serviço"). Copie um arquivo para criar outro serviço. */
const services = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/services' }),
  schema: serviceSchema,
});

/** Páginas legais: Markdown (frontmatter title/description + seções "## "). */
const legal = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/legal' }),
  schema: legalSchema,
});

/** Páginas com texto próprio: um .yaml por página em src/content/pages/. */
const page = <T extends z.ZodType>(file: string, schema: T) =>
  defineCollection({ loader: glob({ pattern: file, base: './src/content/pages' }), schema });

export const collections = {
  services,
  legal,
  home: page('home.yaml', homeSchema),
  about: page('about.yaml', aboutSchema),
  values: page('values.yaml', valuesSchema),
  servicesIndex: page('services-index.yaml', servicesIndexSchema),
  contact: page('contact.yaml', contactSchema),
};
