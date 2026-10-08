// Uso: node scripts/content-verify.mjs   (após `npm run build`)
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { findMissing, htmlToText } from './lib/verify.mjs';

const snap = 'legacy-content/snapshot';
const approved = existsSync('legacy-content/approved-removals.json')
  ? JSON.parse(readFileSync('legacy-content/approved-removals.json', 'utf8'))
  : { '*': [] };
let failed = 0;

for (const f of readdirSync(snap).filter((n) => n.endsWith('.json') && !n.startsWith('_'))) {
  const legacy = JSON.parse(readFileSync(`${snap}/${f}`, 'utf8'));
  const file = legacy.route === '/' ? 'index' : legacy.route.slice(1);
  const path = `dist/${file}.html`;
  if (!existsSync(path)) { console.log(`✗ ${legacy.route}: página não existe no build`); failed++; continue; }
  const { missing, total } = findMissing({
    legacyText: legacy.text + '\n' + legacy.attrs.join('\n'),
    newText: htmlToText(readFileSync(path, 'utf8')),
    ignore: approved['*'] ?? [],
    approved: approved[legacy.route] ?? [],
  });
  console.log(`${missing.length ? '✗' : '✓'} ${legacy.route}: ${total - missing.length}/${total} linhas`);
  missing.forEach((m) => console.log(`    faltando: ${m}`));
  failed += missing.length;
}
process.exit(failed ? 1 : 0);
