import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { site, ui } from '../content';

// Nenhuma chamada real a Google/Meta: as respostas são simuladas e as URLs pedidas são registradas.
const VENDOR = /googletagmanager\.com|connect\.facebook\.net|facebook\.com\/tr|googleadservices\.com|doubleclick\.net/;

async function trackRequests(page: Page) {
  const urls: string[] = [];
  await page.route(VENDOR, (route) => {
    urls.push(route.request().url());
    return route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* stub */' });
  });
  return urls;
}

const accept = (page: Page) => page.getByRole('button', { name: ui.consent.accept, exact: true });
const reject = (page: Page) => page.getByRole('button', { name: ui.consent.reject, exact: true });
const settingsLink = (page: Page) => page.getByRole('button', { name: ui.footer.cookieSettings });
const banner = (page: Page) => page.getByRole('dialog', { name: ui.consent.title });

test.describe('consentimento de cookies', () => {
  test('1ª visita: aviso visível, acessível e NENHUMA ferramenta de marketing carregada', async ({ page }, info) => {
    const urls = await trackRequests(page);
    await page.goto('/');
    await expect(banner(page)).toBeVisible();
    await expect(banner(page)).toContainText(ui.consent.text);
    await expect(accept(page)).toBeVisible();
    await expect(reject(page)).toBeVisible();
    await page.waitForTimeout(800);
    expect(urls, 'nada pode ser carregado antes do aceite').toEqual([]);
    await page.screenshot({ path: `test-results/consent-${info.project.name}.png` });
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations, JSON.stringify(results.violations.map((v) => [v.id, v.nodes.map((n) => n.target)]))).toEqual([]);
  });

  test('Aceitar: carrega Meta Pixel e Google Ads com os IDs do site.yaml, e lembra a escolha', async ({ page }) => {
    const urls = await trackRequests(page);
    await page.goto('/');
    await accept(page).click();
    await expect(banner(page)).toBeHidden();
    await expect.poll(() => urls.length).toBeGreaterThanOrEqual(2);
    expect(urls.some((u) => u.includes('connect.facebook.net') && u.includes('fbevents.js'))).toBe(true);
    expect(urls.some((u) => u.includes('googletagmanager.com/gtag/js') && u.includes(`id=${site.tracking.googleAdsId}`))).toBe(true);
    expect(await page.evaluate(() => typeof window.fbq)).toBe('function');

    // volta ao site: sem aviso e as ferramentas continuam ativas
    urls.length = 0;
    await page.reload();
    await expect(banner(page)).toBeHidden();
    await expect.poll(() => urls.length).toBeGreaterThanOrEqual(2);
  });

  test('Recusar: nada é carregado, nem nas visitas seguintes', async ({ page }) => {
    const urls = await trackRequests(page);
    await page.goto('/');
    await reject(page).click();
    await expect(banner(page)).toBeHidden();
    await page.goto('/quem-somos');
    await expect(banner(page)).toBeHidden();
    await page.waitForTimeout(600);
    expect(urls).toEqual([]);
    expect(await page.evaluate(() => typeof window.fbq)).toBe('undefined');
  });

  test('o link de cookies do rodapé reabre o aviso; trocar para Recusar desliga tudo', async ({ page }) => {
    const urls = await trackRequests(page);
    await page.goto('/');
    await accept(page).click();
    await expect.poll(() => urls.length).toBeGreaterThanOrEqual(2);

    await settingsLink(page).click();
    await expect(banner(page)).toBeVisible();
    await expect(banner(page)).toContainText(ui.consent.currentAccepted);

    urls.length = 0;
    await reject(page).click(); // a página recarrega para parar as ferramentas que já rodavam
    await page.waitForLoadState('load');
    await page.waitForTimeout(600);
    expect(urls).toEqual([]);
    expect(await page.evaluate(() => typeof window.fbq)).toBe('undefined');
    await settingsLink(page).click();
    await expect(banner(page)).toContainText(ui.consent.currentRejected);
  });

  test('sinal GPC do navegador: sem aviso, sem rastreamento, mesmo com "aceito" guardado', async ({ page }) => {
    const urls = await trackRequests(page);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'globalPrivacyControl', { value: true });
      localStorage.setItem('sethos-consent', JSON.stringify({ v: 1, marketing: true, at: new Date().toISOString() }));
    });
    await page.goto('/');
    await expect(banner(page)).toBeHidden();
    await page.waitForTimeout(600);
    expect(urls).toEqual([]);
    await settingsLink(page).click();
    await expect(banner(page)).toContainText(ui.consent.gpc);
  });

  test('escolha expirada (mais de 12 meses) volta a perguntar', async ({ page }) => {
    await trackRequests(page);
    await page.addInitScript(() => {
      const old = new Date(Date.now() - 400 * 24 * 3600 * 1000).toISOString();
      localStorage.setItem('sethos-consent', JSON.stringify({ v: 1, marketing: true, at: old }));
    });
    await page.goto('/');
    await expect(banner(page)).toBeVisible();
  });

  test('contato enviado: evento Lead só existe se houve consentimento', async ({ page }) => {
    await trackRequests(page);
    await page.route('**/api/contact', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
    const fill = async () => {
      await page.goto('/contato');
      await page.getByLabel(/Nome Completo/).fill('Maria Teste');
      await page.getByLabel(/E-mail Profissional/).fill('maria@empresa.com.br');
      await page.getByLabel(/Conte-nos sobre suas necessidades/).fill('Olá');
      await page.locator('#submit').click();
      await expect(page.locator('#form-success')).toBeVisible();
    };

    // com aceite
    await page.goto('/');
    await accept(page).click();
    await fill();
    const sent = await page.evaluate(() => (window.fbq as unknown as { queue: unknown[][] }).queue.some((a) => a[0] === 'track' && a[1] === 'Lead'));
    expect(sent).toBe(true);

    // sem aceite (outro contexto, sem localStorage)
    const other = await page.context().browser()!.newContext();
    const page2 = await other.newPage();
    await page2.route(VENDOR, (r) => r.fulfill({ status: 200, body: '' }));
    await page2.route('**/api/contact', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
    await page2.goto('/contato');
    await page2.getByLabel(/Nome Completo/).fill('Maria');
    await page2.getByLabel(/E-mail Profissional/).fill('maria@empresa.com.br');
    await page2.getByLabel(/Conte-nos sobre suas necessidades/).fill('Olá');
    await page2.locator('#submit').click();
    await expect(page2.locator('#form-success')).toBeVisible();
    expect(await page2.evaluate(() => typeof window.fbq)).toBe('undefined');
    await other.close();
  });
});
