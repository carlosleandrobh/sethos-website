// Uso: node scripts/content-verify.mjs   (após `npm run build`)
// Cada linha de texto do site antigo (snapshot) precisa existir na página nova,
// ou estar em legacy-content/approved-removals.json com motivo.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { findMissing, htmlToText } from './lib/verify.mjs';

const snap = 'legacy-content/snapshot';
const NL = String.fromCharCode(10);
const approved = existsSync('legacy-content/approved-removals.json')
  ? JSON.parse(readFileSync('legacy-content/approved-removals.json', 'utf8'))
  : { '*': [] };
const heroFile = `${snap}/_hero-slides.json`;
let failed = 0;

for (const f of readdirSync(snap).filter((n) => n.endsWith('.json') && !n.startsWith('_'))) {
  const legacy = JSON.parse(readFileSync(`${snap}/${f}`, 'utf8'));
  const file = legacy.route === '/' ? 'index' : legacy.route.slice(1);
  const path = `dist/${file}.html`;
  if (!existsSync(path)) {
    console.log(`✗ ${legacy.route}: página não existe no build`);
    failed++;
    continue;
  }
  // Os 4 slides do carrossel da home só aparecem um por vez no snapshot principal.
  const heroText =
    legacy.route === '/' && existsSync(heroFile)
      ? JSON.parse(readFileSync(heroFile, 'utf8'))
          .slides.map((s) => s.text)
          .join(NL)
      : '';
  const { missing, total } = findMissing({
    legacyText: [legacy.text, legacy.attrs.join(NL), heroText].join(NL),
    newText: htmlToText(readFileSync(path, 'utf8')),
    ignore: approved['*'] ?? [],
    approved: approved[legacy.route] ?? [],
  });
  console.log(`${missing.length ? '✗' : '✓'} ${legacy.route}: ${total - missing.length}/${total} linhas`);
  missing.forEach((m) => console.log(`    faltando: ${m}`));
  failed += missing.length;
}
process.exit(failed ? 1 : 0);
