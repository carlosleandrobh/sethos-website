import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { site, ui } from '../content';

// Textos e dados esperados vêm de src/content/site/*.yaml.
test('layout base: landmarks, navegação e sem violações axe', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: ui.nav.mainAria })).toBeVisible();
  await expect(page.getByRole('link', { name: ui.whatsappFloat.aria })).toHaveAttribute('href', new RegExp(`wa\\.me/${site.phone.whatsapp}`));
  await expect(page.getByRole('contentinfo')).toContainText(`CNPJ: ${site.cnpj}`);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations, JSON.stringify(results.violations.map((v) => [v.id, v.nodes.map((n) => n.target)]))).toEqual([]);
  await page.screenshot({ path: `test-results/layout-${info.project.name}.png`, fullPage: true });
});

test('menu mobile abre e mostra os itens do menu', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile');
  await page.goto('/');
  await page.getByLabel(ui.nav.openMenu).click();
  for (const item of site.nav) await expect(page.getByRole('link', { name: item.label, exact: true }).first()).toBeVisible();
});
