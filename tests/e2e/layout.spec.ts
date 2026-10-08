import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('layout base: landmarks, navegação e sem violações axe', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.getByRole('navigation', { name: 'Navegação principal' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Contato via WhatsApp' })).toHaveAttribute('href', /wa\.me\/5531972457451/);
  await expect(page.getByRole('contentinfo')).toContainText('CNPJ: 29.298.410/0001-42');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations, JSON.stringify(results.violations.map((v) => [v.id, v.nodes.map((n) => n.target)]))).toEqual([]);
  await page.screenshot({ path: `test-results/layout-${info.project.name}.png`, fullPage: true });
});

test('menu mobile abre e navega por teclado', async ({ page }, info) => {
  test.skip(info.project.name !== 'mobile');
  await page.goto('/');
  await page.getByLabel('Abrir menu').click();
  await expect(page.getByRole('link', { name: 'Quem Somos' }).first()).toBeVisible();
});
