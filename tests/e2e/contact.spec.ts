import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('contato: acessível e sem overflow', async ({ page }, info) => {
  await page.goto('/contato');
  await expect(page.locator('h1')).toHaveCount(1);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  expect(overflow).toBe(false);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).exclude('.cf-turnstile').analyze();
  expect(results.violations, JSON.stringify(results.violations.map((v) => [v.id, v.nodes.map((n) => n.target)]))).toEqual([]);
  await page.screenshot({ path: `test-results/contato-${info.project.name}.png`, fullPage: true });
});

test('contato: valida campos obrigatórios com mensagens do site antigo', async ({ page }) => {
  await page.goto('/contato');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.locator('#err-name')).toHaveText('Nome é obrigatório');
  await expect(page.locator('#err-email')).toHaveText('E-mail é obrigatório');
  await expect(page.locator('#err-message')).toHaveText('Mensagem é obrigatória');
  await expect(page.locator('#form-error')).toHaveText('Verifique os campos destacados');

  await page.getByLabel('E-mail Profissional *').fill('maria@');
  await page.getByRole('radio', { name: 'WhatsApp' }).check();
  await expect(page.locator('#best-time')).toBeVisible();
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.locator('#err-email')).toHaveText('E-mail inválido');
  await expect(page.locator('#err-phone')).toHaveText('Telefone é obrigatório');
});

test('contato: máscara de telefone, contador e envio com sucesso (função simulada)', async ({ page }) => {
  let payload: Record<string, unknown> | undefined;
  await page.route('**/api/contact', async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await page.goto('/contato');
  await page.getByLabel('Nome Completo *').fill('Maria Teste');
  await page.getByLabel('E-mail Profissional *').fill('maria@empresa.com.br');
  await page.getByLabel('Telefone/WhatsApp').fill('31972457451');
  await expect(page.getByLabel('Telefone/WhatsApp')).toHaveValue('(31) 97245-7451');
  await page.getByLabel('Conte-nos sobre suas necessidades *').fill('Preciso de ajuda com a folha.');
  await expect(page.locator('#char-count')).toHaveText('29/2000 caracteres');
  await page.getByRole('button', { name: 'Enviar' }).click();

  await expect(page.locator('#form-success')).toBeVisible();
  await expect(page.locator('#form-success')).toContainText('Mensagem Enviada com Sucesso!');
  await expect(page.locator('#success-email')).toHaveText('maria@empresa.com.br');
  expect(payload).toMatchObject({ name: 'Maria Teste', preference: 'email', phone: '(31) 97245-7451' });
});

test('contato: falha do servidor mostra mensagem e mantém os dados', async ({ page }) => {
  await page.route('**/api/contact', (route) => route.fulfill({ status: 502, contentType: 'application/json', body: '{"error":"delivery"}' }));
  await page.goto('/contato');
  await page.getByLabel('Nome Completo *').fill('Maria Teste');
  await page.getByLabel('E-mail Profissional *').fill('maria@empresa.com.br');
  await page.getByLabel('Conte-nos sobre suas necessidades *').fill('Olá');
  await page.getByRole('button', { name: 'Enviar' }).click();
  await expect(page.locator('#form-error')).toContainText('Não foi possível enviar');
  await expect(page.getByLabel('Nome Completo *')).toHaveValue('Maria Teste');
  await expect(page.getByRole('button', { name: 'Enviar' })).toBeEnabled();
});
