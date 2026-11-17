import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { contactFormHref } from '../../src/lib/url';
import { home, services, site, ui } from '../content';

// Navegação e chamadas para ação. Textos esperados vêm dos arquivos de conteúdo (tests/content.ts).
const servicesNav = site.nav.find((item) => item.href === '/servicos')!;
const contactNav = site.nav.find((item) => item.href === '/contato')!;
const mainNav = (page: Page) => page.getByRole('navigation', { name: ui.nav.mainAria });

test.describe('submenu de Serviços', () => {
  test('desktop: abre ao passar o mouse e pelo teclado; Esc fecha', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop');
    await page.goto('/');
    const first = mainNav(page).getByRole('link', { name: services[0].title, exact: true });
    await expect(first).toBeHidden();

    await mainNav(page).getByRole('link', { name: servicesNav.label, exact: true }).hover();
    for (const s of services) {
      await expect(mainNav(page).getByRole('link', { name: s.title, exact: true })).toHaveAttribute('href', `/servicos/${s.slug}`);
    }
    await expect(first).toBeVisible();
    await expect(mainNav(page).getByRole('link', { name: ui.breadcrumb.allServices })).toHaveAttribute('href', '/servicos');
    await page.screenshot({ path: 'test-results/submenu-desktop.png' });
    const results = await new AxeBuilder({ page }).include('header').withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze();
    expect(results.violations, JSON.stringify(results.violations.map((v) => [v.id, v.nodes.map((n) => n.target)]))).toEqual([]);

    // teclado: foco no item abre; Tab entra no submenu; Esc esconde
    await page.mouse.move(0, 600);
    await expect(first).toBeHidden();
    await mainNav(page).getByRole('link', { name: servicesNav.label, exact: true }).focus();
    await expect(first).toBeVisible();
    await page.keyboard.press('Tab');
    await expect(first).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(first).toBeHidden();
  });

  test('celular: "Serviços" expande a lista dentro do menu', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile');
    await page.goto('/');
    await page.getByLabel(ui.nav.openMenu).click();
    const menu = page.locator('#mobile-menu');
    await expect(menu.getByRole('link', { name: services[0].title, exact: true })).toBeHidden();
    await menu.getByText(servicesNav.label, { exact: true }).click();
    for (const s of services) await expect(menu.getByRole('link', { name: s.title, exact: true })).toBeVisible();
    await expect(menu.getByRole('link', { name: ui.breadcrumb.allServices })).toHaveAttribute('href', '/servicos');
    await page.screenshot({ path: 'test-results/submenu-mobile.png' });
  });

  test('celular: numa página de serviço a lista já vem aberta e marca o serviço atual', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile');
    const s = services[1];
    await page.goto(`/servicos/${s.slug}`);
    await page.getByLabel(ui.nav.openMenu).click();
    await expect(page.locator('#mobile-menu').getByRole('link', { name: s.title, exact: true })).toHaveAttribute('aria-current', 'page');
  });
});

test('rodapé lista todos os serviços', async ({ page }) => {
  await page.goto('/');
  const footer = page.getByRole('contentinfo');
  for (const s of services) {
    await expect(footer.getByRole('link', { name: s.title, exact: true })).toHaveAttribute('href', `/servicos/${s.slug}`);
  }
});

for (const route of ['/servicos', '/quem-somos', '/nossos-valores']) {
  test(`${route} termina com a chamada para contato`, async ({ page }) => {
    await page.goto(route);
    const band = page.getByRole('region', { name: home.contact.title });
    await expect(band).toBeVisible();
    await expect(band.getByRole('link', { name: home.contact.cta })).toHaveAttribute('href', '/contato');
  });
}

test('404 oferece atalhos para Serviços e Contato', async ({ page }) => {
  await page.goto('/pagina-que-nao-existe');
  const main = page.getByRole('main');
  await expect(main.getByRole('link', { name: ui.notFound.cta })).toHaveAttribute('href', '/');
  await expect(main.getByRole('link', { name: servicesNav.label, exact: true })).toHaveAttribute('href', '/servicos');
  await expect(main.getByRole('link', { name: contactNav.label, exact: true })).toHaveAttribute('href', '/contato');
});

test.describe('página de serviço', () => {
  const s = services[1];

  test('celular: botões de contato logo abaixo do título', async ({ page }, info) => {
    test.skip(info.project.name !== 'mobile');
    await page.goto(`/servicos/${s.slug}`);
    const header = page.locator('[data-service-header-cta]');
    await expect(header.getByRole('link', { name: site.cta.label })).toHaveAttribute('href', contactFormHref(s.slug));
    await expect(header.getByRole('link', { name: ui.service.whatsapp })).toHaveAttribute('href', new RegExp(`wa\\.me/${site.phone.whatsapp}`));
    await expect(header).toBeInViewport();
  });

  test('desktop: a lateral já está visível, sem botões repetidos no topo', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop');
    await page.goto(`/servicos/${s.slug}`);
    await expect(page.locator('[data-service-header-cta]')).toBeHidden();
  });

  test('a chamada final vem antes da navegação anterior/próximo', async ({ page }) => {
    await page.goto(`/servicos/${s.slug}`);
    const order = await page.evaluate((navAria) => {
      const cta = document.getElementById('cta')!;
      const nav = document.querySelector(`nav[aria-label="${navAria}"]`)!;
      return cta.compareDocumentPosition(nav) & Node.DOCUMENT_POSITION_FOLLOWING;
    }, ui.service.navAria);
    expect(order).toBeTruthy();
  });
});

test('clique em canal de contato gera evento Contact só com consentimento', async ({ page }) => {
  await page.route(/googletagmanager\.com|connect\.facebook\.net/, (r) => r.fulfill({ status: 200, contentType: 'application/javascript', body: '' }));
  // Os cliques não saem da página (sem abrir WhatsApp/telefone de verdade); o evento ainda chega ao document.
  const neutralize = () =>
    page.evaluate(() => document.addEventListener('click', (e) => (e.target as Element).closest('[data-contact]') && e.preventDefault(), true));
  const contacts = () =>
    page.evaluate(() =>
      ((window.fbq as unknown as { queue?: unknown[][] })?.queue ?? []).filter((a) => a[0] === 'track' && a[1] === 'Contact').map((a) => a[2]),
    );

  await page.goto('/');
  await page.getByRole('button', { name: ui.consent.reject, exact: true }).click();
  await neutralize();
  await page.getByRole('contentinfo').locator('[data-contact="phone"]').click();
  expect(await page.evaluate(() => typeof window.fbq)).toBe('undefined');

  await page.getByRole('button', { name: ui.footer.cookieSettings }).click();
  await page.getByRole('button', { name: ui.consent.accept, exact: true }).click();
  await expect.poll(() => page.evaluate(() => typeof window.fbq)).toBe('function');
  await page.getByRole('contentinfo').locator('[data-contact="phone"]').click();
  await page.getByRole('contentinfo').locator('[data-contact="whatsapp"]').click();
  expect(await contacts()).toEqual([{ channel: 'phone' }, { channel: 'whatsapp' }]);
});

test('home: as etiquetas do hero levam às páginas indicadas no conteúdo', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('section[aria-labelledby="hero-title"]');
  for (const chip of home.hero.chips) {
    if (chip.href) await expect(hero.getByRole('link', { name: chip.label, exact: true })).toHaveAttribute('href', chip.href);
    else await expect(hero.getByRole('link', { name: chip.label, exact: true })).toHaveCount(0);
  }
});

test('itens só do rodapé não aparecem no menu do topo', async ({ page }, info) => {
  await page.goto('/');
  if (info.project.name === 'mobile') await page.getByLabel(ui.nav.openMenu).click();
  const top = new Set(site.nav.map((item) => item.href));
  for (const item of site.footerNav) {
    await expect(page.getByRole('contentinfo').getByRole('link', { name: item.label, exact: true }).first()).toHaveAttribute('href', item.href);
    if (!top.has(item.href)) await expect(mainNav(page).getByRole('link', { name: item.label, exact: true })).toHaveCount(0);
  }
});

test('lateral do serviço: link para o formulário com o serviço e WhatsApp com o nome do serviço', async ({ page }) => {
  const s = services[1];
  await page.goto(`/servicos/${s.slug}`);
  const aside = page.getByRole('complementary');
  await expect(aside.getByRole('link', { name: site.cta.label })).toHaveAttribute('href', contactFormHref(s.slug));
  const href = await aside.getByRole('link', { name: ui.service.whatsapp }).getAttribute('href');
  expect(href).toContain(`wa.me/${site.phone.whatsapp}`);
  expect(new URL(href!).searchParams.get('text')).toContain(s.title);
  // sem formulário na lateral: as ações são só links
  await expect(aside.locator('form')).toHaveCount(0);
});
