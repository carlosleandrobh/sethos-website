import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { services, site, ui } from '../content';

// As rotas e os textos esperados vêm dos arquivos de conteúdo: criar, apagar ou editar um serviço/texto
// NÃO quebra estes testes.
const routes = [
  '/quem-somos',
  '/nossos-valores',
  '/servicos',
  ...services.map((s) => `/servicos/${s.slug}`),
  '/politica-de-privacidade',
  '/politica-de-cookies',
  '/termos-de-uso',
];

for (const route of routes) {
  test(`página ${route}: h1 único, meta, sem overflow e sem violações axe`, async ({ page }) => {
    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator('h1')).toHaveCount(1);
    expect(await page.title()).toMatch(/\S{3,}/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.{50,}/);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations, JSON.stringify(results.violations.map((v) => [v.id, v.nodes.map((n) => n.target)]))).toEqual([]);
  });
}

// Usa um serviço do meio da lista (tem anterior e próximo), seja qual for.
const middle = services[Math.min(1, services.length - 1)];
const index = services.indexOf(middle);

test('serviço: FAQ abre, navegação anterior/próximo e formulário lateral gera link do WhatsApp', async ({ page }) => {
  test.skip(services.length < 3, 'precisa de pelo menos 3 serviços');
  await page.addInitScript(() => {
    (window as unknown as { opened: string[] }).opened = [];
    window.open = (u) => {
      (window as unknown as { opened: string[] }).opened.push(String(u));
      return null;
    };
  });
  await page.goto(`/servicos/${middle.slug}`);
  const first = page.locator('main details').first();
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('open', '');
  await expect(page.getByRole('link', { name: new RegExp(ui.service.previous) })).toHaveAttribute('href', `/servicos/${services[index - 1].slug}`);
  await expect(page.getByRole('link', { name: new RegExp(ui.service.next) })).toHaveAttribute('href', `/servicos/${services[index + 1].slug}`);

  await page.getByPlaceholder(ui.service.form.name).fill('Maria Teste');
  await page.getByPlaceholder(ui.service.form.email).fill('maria@empresa.com.br');
  await page.getByPlaceholder(ui.service.form.phone).fill('31999999999');
  await page.getByRole('button', { name: ui.service.whatsapp }).click();
  const url = (await page.evaluate(() => (window as unknown as { opened: string[] }).opened))[0];
  expect(url).toContain(`wa.me/${site.phone.whatsapp}`);
  expect(decodeURIComponent(url)).toContain('Maria Teste');
});

test('o primeiro serviço não exibe "anterior"', async ({ page }) => {
  await page.goto(`/servicos/${services[0].slug}`);
  await expect(page.getByRole('link', { name: new RegExp(ui.service.previous) })).toHaveCount(0);
});
