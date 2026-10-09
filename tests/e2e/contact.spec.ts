import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { contact, optionLabel } from '../content';

// Rótulos, mensagens de erro e textos esperados vêm de src/content/pages/contact.yaml.
const f = contact.form;

test('contato: acessível e sem overflow', async ({ page }, info) => {
  await page.goto('/contato');
  await expect(page.locator('h1')).toHaveCount(1);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).exclude('.cf-turnstile').analyze();
  expect(results.violations, JSON.stringify(results.violations.map((v) => [v.id, v.nodes.map((n) => n.target)]))).toEqual([]);
  await page.screenshot({ path: `test-results/contato-${info.project.name}.png`, fullPage: true });
});

test('contato: valida campos obrigatórios com as mensagens do arquivo de conteúdo', async ({ page }) => {
  await page.goto('/contato');
  await page.getByRole('button', { name: f.submit }).click();
  await expect(page.locator('#err-name')).toHaveText(f.errors.name);
  await expect(page.locator('#err-email')).toHaveText(f.errors.email);
  await expect(page.locator('#err-message')).toHaveText(f.errors.message);
  await expect(page.locator('#form-error')).toHaveText(f.failure.incomplete);

  await page.getByLabel(f.fields.email.label).fill('maria@');
  await page.getByRole('radio', { name: optionLabel('whatsapp') }).check();
  await expect(page.locator('#best-time')).toBeVisible();
  await page.getByRole('button', { name: f.submit }).click();
  await expect(page.locator('#err-email')).toHaveText(f.errors.emailInvalid);
  await expect(page.locator('#err-phone')).toHaveText(f.errors.phone);
});

test('contato: máscara de telefone, contador e envio com sucesso (função simulada)', async ({ page }) => {
  let payload: Record<string, unknown> | undefined;
  await page.route('**/api/contact', async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.goto('/contato');
  await page.getByLabel(f.fields.name.label).fill('Maria Teste');
  await page.getByLabel(f.fields.email.label).fill('maria@empresa.com.br');
  await page.getByLabel(f.fields.phone.label).fill('31972457451');
  await expect(page.getByLabel(f.fields.phone.label)).toHaveValue('(31) 97245-7451');
  const message = 'Preciso de ajuda com a folha.';
  await page.getByLabel(f.fields.message.label).fill(message);
  await expect(page.locator('#char-count')).toContainText(`${message.length}/2000`);
  await page.getByRole('button', { name: f.submit }).click();

  await expect(page.locator('#form-success')).toBeVisible();
  await expect(page.locator('#form-success')).toContainText(f.success.title);
  await expect(page.locator('#success-email')).toHaveText('maria@empresa.com.br');
  expect(payload).toMatchObject({ name: 'Maria Teste', preference: 'email', phone: '(31) 97245-7451' });
});

test('contato: falha do servidor mostra mensagem e mantém os dados', async ({ page }) => {
  await page.route('**/api/contact', (route) => route.fulfill({ status: 502, contentType: 'application/json', body: '{"error":"delivery"}' }));
  await page.goto('/contato');
  await page.getByLabel(f.fields.name.label).fill('Maria Teste');
  await page.getByLabel(f.fields.email.label).fill('maria@empresa.com.br');
  await page.getByLabel(f.fields.message.label).fill('Olá');
  await page.getByRole('button', { name: f.submit }).click();
  await expect(page.locator('#form-error')).toHaveText(f.failure.generic);
  await expect(page.getByLabel(f.fields.name.label)).toHaveValue('Maria Teste');
  await expect(page.getByRole('button', { name: f.submit })).toBeEnabled();
});
