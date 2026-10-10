// Ponte entre os dados do site (site.yaml/ui.yaml) e os construtores de dados estruturados (jsonld.ts).
import { site, ui } from './content';
import { breadcrumbs, organization, service, faqPage, website } from './jsonld';

export const orgJsonLd = (description: string) =>
  organization({
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    email: site.email,
    telephone: site.phone.tel,
    cnpj: site.cnpj,
    locality: site.address.locality,
    region: site.address.region,
    sameAs: site.social.map((s) => s.href),
    description,
  });

export const websiteJsonLd = () => website({ name: site.name, url: site.url });

/** Trilha "Início › … › página atual". */
export const crumbsJsonLd = (trail: { name: string; path: string }[]) =>
  breadcrumbs(site.url, [{ name: ui.breadcrumb.home, path: '/' }, ...trail]);

export const serviceJsonLd = (s: { slug: string; title: string; description: string; keywords: string[]; faq: { question: string; answer: string }[] }) => [
  service({ siteUrl: site.url, slug: s.slug, name: s.title, description: s.description, keywords: s.keywords }),
  faqPage(s.faq),
];
