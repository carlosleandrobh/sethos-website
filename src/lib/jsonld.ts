// Dados estruturados (schema.org) para o Google: organização, serviços, perguntas frequentes e trilha de navegação.
// Funções puras: recebem os dados dos arquivos de conteúdo e devolvem objetos JSON-LD.

export interface OrgInput {
  name: string;
  legalName: string;
  url: string;
  email: string;
  telephone: string;
  cnpj: string;
  locality: string;
  region: string;
  sameAs: string[];
  description: string;
}

const abs = (base: string, path: string) => new URL(path, base).href;

export const orgId = (siteUrl: string) => `${siteUrl}/#organization`;

/** Organização (empresa de serviços profissionais, atende todo o Brasil a partir de uma cidade). */
export function organization(o: OrgInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': orgId(o.url),
    name: o.name,
    legalName: o.legalName,
    url: o.url,
    logo: abs(o.url, '/icon-512.png'),
    image: abs(o.url, '/og/home.png'),
    description: o.description,
    email: o.email,
    telephone: o.telephone,
    taxID: o.cnpj,
    address: { '@type': 'PostalAddress', addressLocality: o.locality, addressRegion: o.region, addressCountry: 'BR' },
    areaServed: { '@type': 'Country', name: 'Brasil' },
    sameAs: o.sameAs,
  };
}

export function website(o: Pick<OrgInput, 'name' | 'url'>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${o.url}/#website`,
    url: o.url,
    name: o.name,
    inLanguage: 'pt-BR',
    publisher: { '@id': orgId(o.url) },
  };
}

export interface ServiceInput {
  siteUrl: string;
  slug: string;
  name: string;
  description: string;
  keywords: string[];
}

export function service(s: ServiceInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${abs(s.siteUrl, `/servicos/${s.slug}`)}#service`,
    name: s.name,
    description: s.description,
    url: abs(s.siteUrl, `/servicos/${s.slug}`),
    serviceType: s.keywords[0] ?? s.name,
    keywords: s.keywords.join(', '),
    areaServed: { '@type': 'Country', name: 'Brasil' },
    provider: { '@id': orgId(s.siteUrl) },
  };
}

export function faqPage(faq: { question: string; answer: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({ '@type': 'Question', name: f.question, acceptedAnswer: { '@type': 'Answer', text: f.answer } })),
  };
}

/** Trilha de navegação: o último item é a página atual (sem `item` obrigatório, mas incluímos o endereço). */
export function breadcrumbs(siteUrl: string, trail: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map((t, i) => ({ '@type': 'ListItem', position: i + 1, name: t.name, item: abs(siteUrl, t.path) })),
  };
}

/** Serializa para dentro de <script type="application/ld+json">, sem permitir fechar a tag por engano. */
export const toScript = (data: object) => JSON.stringify(data).replace(/</g, '\\u003c');
