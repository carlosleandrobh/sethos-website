// Uma imagem de compartilhamento por página: /og/home.png, /og/quem-somos.png, /og/servicos-consultoria-rh.png …
// O texto vem dos arquivos de conteúdo (título da página), então muda sozinho quando o texto é editado.
import { getCollection, getEntry } from 'astro:content';
import type { APIRoute, GetStaticPaths } from 'astro';
import { site, ui } from '../../lib/content';
import { renderOgImage } from '../../lib/og';

interface Props {
  title: string;
}

export const getStaticPaths = (async () => {
  const home = (await getEntry('home', 'home'))!.data;
  const about = (await getEntry('about', 'about'))!.data;
  const values = (await getEntry('values', 'values'))!.data;
  const servicesIndex = (await getEntry('servicesIndex', 'services-index'))!.data;
  const contact = (await getEntry('contact', 'contact'))!.data;
  const services = await getCollection('services');
  const legal = await getCollection('legal');

  const entries: { slug: string; title: string }[] = [
    { slug: 'home', title: home.hero.title },
    { slug: 'quem-somos', title: about.hero.title.join(' ') },
    { slug: 'nossos-valores', title: values.hero.title.join(' ') },
    { slug: 'servicos', title: servicesIndex.hero.title.join(' ') },
    { slug: 'contato', title: contact.hero.title.join(' ') },
    ...services.map((s) => ({ slug: `servicos-${s.id}`, title: s.data.title })),
    ...legal.map((l) => ({ slug: l.id, title: l.data.title })),
  ];
  return entries.map(({ slug, title }) => ({ params: { slug }, props: { title } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute<Props> = async ({ props }) => {
  const png = await renderOgImage({ title: props.title, brand: site.name, tagline: ui.nav.logoAlt });
  return new Response(new Uint8Array(png), { headers: { 'content-type': 'image/png' } });
};
