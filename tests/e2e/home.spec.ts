import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { home } from '../content';

// Os textos esperados vêm de src/content/pages/home.yaml: editar o texto do site não quebra este teste.
test('home: hero, destaques, serviços e CTA final', async ({ page }, info) => {
  await page.goto('/');
  await expect(page.locator('h1')).toHaveCount(1);
  await expect(page.locator('h1')).toContainText(home.hero.title);
  await expect(page.getByRole('link', { name: home.hero.primaryCta }).first()).toBeVisible();
  await expect(page.locator('#servicos li')).toHaveCount(4);
  await expect(page.locator('#contato-resumo')).toContainText(home.contact.title);

  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
  expect(results.violations, JSON.stringify(results.violations.map((v) => [v.id, v.nodes.map((n) => n.target)]))).toEqual([]);
  await page.screenshot({ path: `test-results/home-${info.project.name}.png`, fullPage: true });
});

test('home: sem rolagem horizontal', async ({ page }) => {
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
});
