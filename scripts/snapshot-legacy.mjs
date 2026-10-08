// Captura o texto renderizado do site antigo (referência de "nenhum conteúdo perdido").
// Uso: node scripts/snapshot-legacy.mjs [baseUrl]
import { chromium } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';

const base = process.argv[2] ?? 'https://sethos.com.br';
const slugs = ['consultoria-rh','implantacao-totvs','sustentacao-erp','outsourcing-rh','customizacoes-totvs','integracao-sistemas','dashboards-rh','treinamentos-totvs','bancodados-sql'];
const only = process.argv[3];
const routes = ['/', '/quem-somos', '/nossos-valores', '/servicos', '/contato', '/politica-de-privacidade', '/politica-de-cookies', '/termos-de-uso', ...slugs.map((s) => `/servicos/${s}`)].filter((r) => !only || r === only);
const out = 'legacy-content/snapshot';
mkdirSync(`${out}/screens`, { recursive: true });

const browser = await chromium.launch();
const summary = [];
for (const route of routes) {
  const name = route === '/' ? 'home' : route.slice(1).replace(/\//g, '__');
  for (const [label, width, height] of [['desktop', 1440, 900], ['mobile', 390, 844]]) {
    const page = await browser.newPage({ viewport: { width, height } });
    await page.goto(base + route, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForSelector('h1', { timeout: 20000 }).catch(() => {});
    // rolar para disparar seções lazy
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 300) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 400)); }
      window.scrollTo(0, 0);
    });
    await page.waitForTimeout(800);
    // abrir acordeões (FAQ) para capturar respostas
    for (const b of await page.$$('[aria-expanded="false"]')) await b.click({ timeout: 1000 }).catch(() => {});
    await page.waitForTimeout(400);
    // Acordeões de abertura única (páginas legais): abre um por vez e acumula as linhas reveladas.
    const extraLines = new Set();
    if (label === 'desktop') {
      const count = (await page.$$('[aria-expanded]')).length;
      for (let i = 0; i < count; i++) {
        const trigger = (await page.$$('[aria-expanded]'))[i];
        if (!trigger) break;
        if ((await trigger.getAttribute('aria-expanded')) === 'false') await trigger.click({ timeout: 1000 }).catch(() => {});
        await page.waitForTimeout(250);
        for (const line of (await page.evaluate(() => document.body.innerText)).split(String.fromCharCode(10))) if (line.trim()) extraLines.add(line);
      }
    }
    if (label === 'desktop') {
      const data = await page.evaluate(() => {
        const t = (s) => (s ?? '').replace(/\s+/g, ' ').trim();
        const attrs = [...document.querySelectorAll('[alt],[aria-label],[placeholder],[title]')].flatMap((e) => ['alt','aria-label','placeholder','title'].map((a) => e.getAttribute(a)).filter(Boolean)).map(t);
        return {
          title: document.title,
          description: document.querySelector('meta[name="description"]')?.content ?? null,
          canonical: document.querySelector('link[rel="canonical"]')?.href ?? null,
          ogImage: document.querySelector('meta[property="og:image"]')?.content ?? null,
          headings: [...document.querySelectorAll('h1,h2,h3,h4')].map((e) => `${e.tagName} ${t(e.textContent)}`),
          text: document.body.innerText,
          attrs: [...new Set(attrs)],
          links: [...new Set([...document.querySelectorAll('a[href]')].map((a) => `${t(a.textContent)} -> ${a.getAttribute('href')}`))],
          jsonld: [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent),
        };
      });
      const known = new Set(data.text.split(String.fromCharCode(10)).map((l) => l.trim()));
      const extra = [...extraLines].filter((l) => !known.has(l.trim()));
      if (extra.length) data.text += String.fromCharCode(10) + extra.join(String.fromCharCode(10));
      writeFileSync(`${out}/${name}.json`, JSON.stringify({ route, ...data }, null, 2));
      summary.push({ route, chars: data.text.length, h1: data.headings.find((h) => h.startsWith('H1')) });
    }
    await page.screenshot({ path: `${out}/screens/${name}.${label}.png`, fullPage: true });
    await page.close();
  }
}
await browser.close();
writeFileSync(`${out}/_summary.json`, JSON.stringify(summary, null, 2));
console.table(summary);
