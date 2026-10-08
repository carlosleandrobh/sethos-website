// Paridade de texto renderizado: compara o texto de cada página do build (dist/) com o snapshot guardado em
// tests/fixtures/rendered-text/. Serve para provar que uma refatoração de conteúdo NÃO mudou nenhum texto.
//
//   npm run parity            compara (falha se algo mudou)
//   npm run parity -- --update  grava o novo snapshot (use só quando a mudança de texto for intencional)
import { mkdirSync, readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { htmlToText } from './lib/verify.mjs';

const NL = String.fromCharCode(10);
const DIST = 'dist';
const FIXTURES = 'tests/fixtures/rendered-text';
const update = process.argv.includes('--update');

const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    const p = `${dir}/${n}`;
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

// Espaço antes de pontuação (ou depois de "(") é artefato de tags inline (ex.: </a>.), não diferença visível.
const tidy = (text) => text.replace(/ +([.,;:!?)])/g, '$1').replace(/\( +/g, '(');

const pick = (html, re) => (html.match(re) ?? [])[1] ?? '';

/** Texto estável de uma página: título, meta description, canonical e todo o texto visível (+ atributos). */
function snapshotOf(html) {
  const head = [
    `TITLE: ${pick(html, /<title>([^<]*)<\/title>/)}`,
    `DESCRIPTION: ${pick(html, /<meta name="description" content="([^"]*)"/)}`,
    `CANONICAL: ${pick(html, /<link rel="canonical" href="([^"]*)"/)}`,
    `ROBOTS: ${pick(html, /<meta name="robots" content="([^"]*)"/)}`,
  ];
  const body = htmlToText(html.replace(/<head>[\s\S]*?<\/head>/, ' '), { keepQuotes: true }) // aspas curvas x retas contam como diferença
    .replace(/© \d{4}/g, '© ANO') // o ano muda sozinho todo janeiro
    // uma frase por linha facilita ler o diff quando algo muda
    .replace(/([.!?]) (?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/g, `$1${NL}`);
  return head.join(NL) + NL + '---' + NL + body + NL;
}

const pages = walk(DIST).filter((f) => f.endsWith('.html'));
if (!pages.length) {
  console.error('dist/ vazio: rode `npm run build` antes.');
  process.exit(2);
}

mkdirSync(FIXTURES, { recursive: true });
const name = (file) => file.slice(DIST.length + 1).replace(/\.html$/, '').replace(/\//g, '__') + '.txt';

let changed = 0;
const current = new Set();
for (const file of pages) {
  const target = `${FIXTURES}/${name(file)}`;
  current.add(name(file));
  const text = snapshotOf(readFileSync(file, 'utf8'));
  if (update) {
    writeFileSync(target, text);
    continue;
  }
  if (!existsSync(target)) {
    console.log(`✗ ${name(file)}: página nova sem snapshot`);
    changed++;
    continue;
  }
  const expected = tidy(readFileSync(target, 'utf8'));
  const actual = tidy(text);
  if (expected === actual) continue;
  changed++;
  const a = expected.split(NL);
  const b = actual.split(NL);
  console.log(`✗ ${name(file)}: texto mudou`);
  const only = (x, y) => x.filter((l) => !y.includes(l)).slice(0, 4);
  only(a, b).forEach((l) => console.log(`    - ${l.slice(0, 140)}`));
  only(b, a).forEach((l) => console.log(`    + ${l.slice(0, 140)}`));
}
for (const f of readdirSync(FIXTURES)) {
  if (!current.has(f)) {
    console.log(`✗ ${f}: snapshot sem página correspondente`);
    changed++;
  }
}

if (update) console.log(`Snapshot atualizado: ${pages.length} páginas em ${FIXTURES}/`);
else if (changed) process.exit(1);
else console.log(`✓ Paridade OK: ${pages.length} páginas com o mesmo texto do snapshot`);
