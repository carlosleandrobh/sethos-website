// Captura o texto de cada slide do carrossel da home do site antigo.
import { chromium } from '@playwright/test';
import { writeFileSync } from 'node:fs';

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(process.argv[2] ?? 'https://sethos.com.br', { waitUntil: 'networkidle', timeout: 60000 });
await page.waitForSelector('#inicio h1, #inicio h2', { timeout: 20000 });
const dots = await page.$$('#inicio button[aria-label*="slide" i]');
const slides = [];
for (let i = 0; i < dots.length; i++) {
  await dots[i].click();
  await page.waitForTimeout(1200);
  slides.push(await page.evaluate(() => {
    const sec = document.querySelector('#inicio');
    const img = sec.querySelector('img');
    const bg = [...sec.querySelectorAll('*')].map((e) => getComputedStyle(e).backgroundImage).find((b) => b && b.startsWith('url'));
    return { text: sec.innerText.replace(/\n{2,}/g, '\n').trim(), image: img?.src ?? bg ?? null, links: [...sec.querySelectorAll('a')].map((a) => `${a.textContent.trim()} -> ${a.getAttribute('href')}`) };
  }));
}
writeFileSync('legacy-content/snapshot/_hero-slides.json', JSON.stringify({ dots: dots.length, slides }, null, 2));
console.log(JSON.stringify({ dots: dots.length, slides }, null, 1));
await browser.close();
