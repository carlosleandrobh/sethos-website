// Migração única: páginas legais do site antigo (arrays em TSX) -> src/content/legal/*.json
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const OLD = process.argv[2] ?? '../site-sethos/src/pages';
const out = 'src/content/legal';
mkdirSync(out, { recursive: true });

const pages = [
  ['politica-de-privacidade', 'PrivacyPolicyPage.tsx', 'privacySections'],
  ['politica-de-cookies', 'CookiePolicyPage.tsx', 'cookieSections'],
  ['termos-de-uso', 'TermsOfUsePage.tsx', 'termsSections'],
];

for (const [slug, file, varName] of pages) {
  const src = readFileSync(`${OLD}/${file}`, 'utf8');
  const start = src.indexOf(`const ${varName} = [`);
  const end = src.indexOf(`${String.fromCharCode(10)}];`, start);
  if (start < 0 || end < 0) throw new Error(`${file}: array não encontrado`);
  const literal = src.slice(src.indexOf('[', start), end + 2);
  const sections = new Function(`return ${literal}`)();
  const title = src.match(/title="([^"]+)"/)[1];
  const description = src.match(/description="([^"]+)"/)[1];
  const data = {
    title,
    description,
    sections: sections.map((s) => ({ id: s.id, title: s.title, content: [].concat(s.content) })),
  };
  writeFileSync(`${out}/${slug}.json`, JSON.stringify(data, null, 2) + String.fromCharCode(10));
  console.log(`${slug}: ${data.sections.length} seções, ${data.sections.reduce((n, s) => n + s.content.length, 0)} parágrafos`);
}
