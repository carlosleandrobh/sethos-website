import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { readdirSync } from 'node:fs';

// Os serviços vêm dos arquivos em src/content/services/: criar ou apagar um .md muda esta lista sozinho.
const SERVICE_SLUGS = readdirSync('src/content/services')
  .filter((f) => f.endsWith('.md'))
  .map((f) => f.replace(/\.md$/, ''));

const routes = [
  '/quem-somos',
  '/nossos-valores',
  '/servicos',
  ...SERVICE_SLUGS.map((s) => `/servicos/${s}`),
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

test('serviço: FAQ abre, navegação anterior/próximo e formulário lateral gera link do WhatsApp', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { opened: string[] }).opened = [];
    window.open = (u) => {
      (window as unknown as { opened: string[] }).opened.push(String(u));
      return null;
    };
  });
  await page.goto('/servicos/consultoria-rh');
  const first = page.locator('main details').first();
  await first.locator('summary').click();
  await expect(first).toHaveAttribute('open', '');
  await expect(page.getByRole('link', { name: /Serviço Anterior/ })).toHaveAttribute('href', '/servicos/customizacoes-totvs');
  await expect(page.getByRole('link', { name: /Próximo Serviço/ })).toHaveAttribute('href', '/servicos/treinamentos-totvs');

  await page.getByPlaceholder('Seu nome completo').fill('Maria Teste');
  await page.getByPlaceholder('Seu melhor e-mail').fill('maria@empresa.com.br');
  await page.getByPlaceholder('Telefone para contato').fill('31999999999');
  await page.getByRole('button', { name: 'Conversar no WhatsApp' }).click();
  const url = (await page.evaluate(() => (window as unknown as { opened: string[] }).opened))[0];
  expect(url).toContain('wa.me/5531972457451');
  expect(decodeURIComponent(url)).toContain('Maria Teste');
});

test('serviço sem anterior (primeiro) não exibe link anterior', async ({ page }) => {
  await page.goto('/servicos/sustentacao-erp');
  await expect(page.getByRole('link', { name: /Serviço Anterior/ })).toHaveCount(0);
});
