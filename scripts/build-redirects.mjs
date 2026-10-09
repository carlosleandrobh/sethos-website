// Gera public/_redirects (Netlify) a partir de src/content/site/redirects.yaml.
// Roda sozinho antes de `npm run build` e `npm run dev`. NÃO edite o arquivo gerado: edite o YAML.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { FIXED_ROUTES, readRedirects, redirectProblems, REDIRECTS_FILE, renderRedirectsFile } from './lib/cms/redirects.mjs';

const root = process.cwd();
const items = existsSync(`${root}/${REDIRECTS_FILE}`) ? readRedirects(readFileSync(`${root}/${REDIRECTS_FILE}`, 'utf8')) : [];
const serviceRoutes = readdirSync(`${root}/src/content/services`)
  .filter((f) => f.endsWith('.md'))
  .map((f) => `/servicos/${f.replace(/\.md$/, '')}`);

const problems = redirectProblems(items, [...FIXED_ROUTES, ...serviceRoutes]);
if (problems.length) {
  console.error(`Erro em ${REDIRECTS_FILE}:\n${problems.map((p) => `  • ${p}`).join('\n')}`);
  process.exit(1);
}
writeFileSync(`${root}/public/_redirects`, renderRedirectsFile(items));
