// Uso: node scripts/content-coverage.mjs
// Garante, ANTES de existirem as páginas, que todo texto do site antigo está em algum arquivo de conteúdo
// (src/content, src/data). Complementa `content:verify`, que confere o HTML final de cada página.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { findMissing, normalize } from './lib/verify.mjs';

const NL = String.fromCharCode(10);
const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = `${dir}/${n}`;
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const files = [...walk('src/content'), ...walk('src/data'), ...walk('src/components'), ...walk('src/layouts')];
const corpus = files.map((f) => readFileSync(f, 'utf8')).join(NL);
// Os JSON usam \uXXXX/aspas escapadas; normaliza lendo strings reais quando possível.
const jsonStrings = files
  .filter((f) => f.endsWith('.json'))
  .flatMap((f) => {
    const out = [];
    JSON.parse(readFileSync(f, 'utf8'), (_, v) => (typeof v === 'string' && out.push(v), v));
    return out;
  });
const haystack = normalize([corpus, ...jsonStrings].join(NL));

const snap = 'legacy-content/snapshot';
const approved = existsSync('legacy-content/approved-removals.json')
  ? JSON.parse(readFileSync('legacy-content/approved-removals.json', 'utf8'))
  : { '*': [] };
const heroFile = `${snap}/_hero-slides.json`;
let failed = 0;

for (const f of readdirSync(snap).filter((n) => n.endsWith('.json') && !n.startsWith('_'))) {
  const legacy = JSON.parse(readFileSync(`${snap}/${f}`, 'utf8'));
  const hero =
    legacy.route === '/' && existsSync(heroFile)
      ? JSON.parse(readFileSync(heroFile, 'utf8')).slides.map((s) => s.text).join(NL)
      : '';
  const { missing, total } = findMissing({
    legacyText: [legacy.text, legacy.attrs.join(NL), hero].join(NL),
    newText: haystack,
    ignore: approved['*'] ?? [],
    approved: approved[legacy.route] ?? [],
  });
  console.log(`${missing.length ? '✗' : '✓'} ${legacy.route}: ${total - missing.length}/${total} linhas`);
  missing.forEach((m) => console.log(`    faltando: ${m.slice(0, 160)}`));
  failed += missing.length;
}
process.exit(failed ? 1 : 0);
