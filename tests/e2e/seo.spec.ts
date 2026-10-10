import { expect, test } from '@playwright/test';
import { services, site } from '../content';

// Todas as páginas indexáveis; as rotas e textos vêm dos arquivos de conteúdo.
const routes = [
  '/',
  '/quem-somos',
  '/nossos-valores',
  '/servicos',
  '/contato',
  '/politica-de-privacidade',
  '/politica-de-cookies',
  '/termos-de-uso',
  ...services.map((s) => `/servicos/${s.slug}`),
];
const ogName = (route: string) => (route === '/' ? 'home' : route.slice(1).replace(/\//g, '-'));

for (const route of routes) {
  test(`SEO ${route}: canonical, Open Graph, Twitter e dados estruturados`, async ({ page, request }) => {
    await page.goto(route);
    const meta = (selector: string) => page.locator(selector).first().getAttribute('content');
    const title = await page.title();
    const description = await meta('meta[name="description"]');

    // canonical absoluto, sem .html e igual à rota
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    expect(canonical).toBe(`${site.url}${route === '/' ? '/' : route}`);

    // Open Graph / Twitter coerentes com título e descrição da página
    expect(await meta('meta[property="og:title"]')).toBe(title);
    expect(await meta('meta[property="og:description"]')).toBe(description);
    expect(await meta('meta[property="og:url"]')).toBe(canonical);
    expect(await meta('meta[property="og:type"]')).toBe('website');
    expect(await meta('meta[property="og:locale"]')).toBe('pt_BR');
    expect(await meta('meta[name="twitter:card"]')).toBe('summary_large_image');
    const image = await meta('meta[property="og:image"]');
    expect(image).toBe(`${site.url}/og/${ogName(route)}.png`);
    expect(await meta('meta[name="twitter:image"]')).toBe(image);

    // a imagem existe, é PNG e tem 1200×630
    const res = await request.get(new URL(image!).pathname);
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toBe('image/png');
    const png = await res.body();
    expect(png.subarray(1, 4).toString()).toBe('PNG');
    expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);

    // JSON-LD válido
    const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
    expect(blocks.length).toBeGreaterThan(0);
    const types = blocks.map((b) => JSON.parse(b)['@type']);
    if (route === '/') expect(types).toEqual(expect.arrayContaining(['ProfessionalService', 'WebSite']));
    else expect(types).toContain('BreadcrumbList');
    if (route.startsWith('/servicos/')) {
      expect(types).toEqual(expect.arrayContaining(['Service', 'FAQPage', 'BreadcrumbList']));
      const faq = JSON.parse(blocks[types.indexOf('FAQPage')]);
      const slug = route.split('/').pop();
      expect(faq.mainEntity).toHaveLength(services.find((s) => s.slug === slug)!.faq.length);
    }
  });
}

test('a organização carrega dados de contato do site.yaml', async ({ page }) => {
  await page.goto('/');
  const org = (await page.locator('script[type="application/ld+json"]').allTextContents()).map((t) => JSON.parse(t)).find((d) => d['@type'] === 'ProfessionalService');
  expect(org).toMatchObject({ name: site.name, url: site.url, email: site.email, telephone: site.phone.tel, taxID: site.cnpj });
  expect(org.address).toMatchObject({ addressLocality: site.address.locality, addressRegion: site.address.region, addressCountry: 'BR' });
  expect(org.sameAs).toEqual(site.social.map((s) => s.href));
});

test('404 não é indexada e não tem Open Graph', async ({ page }) => {
  await page.goto('/404');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('meta[property="og:title"]')).toHaveCount(0);
});

test('sitemap lista todas as páginas indexáveis, com datas válidas e sem a 404', async ({ request }) => {
  const index = await (await request.get('/sitemap-index.xml')).text();
  expect(index).toContain('sitemap-0.xml');
  const xml = await (await request.get('/sitemap-0.xml')).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  expect(locs.sort()).toEqual(routes.map((r) => `${site.url}${r === '/' ? '/' : r}`).sort());
  expect(locs.some((l) => l.includes('404'))).toBe(false);
  for (const m of xml.matchAll(/<lastmod>([^<]+)<\/lastmod>/g)) expect(Number.isNaN(Date.parse(m[1]))).toBe(false);
});

test('robots.txt libera o site e aponta para o sitemap', async ({ request }) => {
  const robots = await (await request.get('/robots.txt')).text();
  expect(robots).toContain('Allow: /');
  expect(robots).toContain(`Sitemap: ${site.url}/sitemap-index.xml`);
});
