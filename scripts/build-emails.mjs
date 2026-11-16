// Gera netlify/functions/emails.generated.json a partir de src/content/site/{emails,site}.yaml.
// A função do Netlify importa esse JSON (empacotado junto), sem ler arquivos em tempo de execução.
// Roda sozinho antes de `npm run build`, `npm run dev` e dos testes. NÃO edite o JSON: edite o YAML.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parse } from 'yaml';

const read = (file) => parse(readFileSync(`src/content/site/${file}`, 'utf8'));
const site = read('site.yaml');
// Nome de cada serviço (para o e-mail mostrar o "Serviço de interesse" escolhido no formulário).
const SERVICES = 'src/content/services';
const services = Object.fromEntries(
  readdirSync(SERVICES)
    .filter((f) => f.endsWith('.md'))
    .map((f) => [f.replace(/\.md$/, ''), parse(readFileSync(`${SERVICES}/${f}`, 'utf8').split(/^---\s*$/m)[1]).title]),
);
const output = {
  _aviso: 'Arquivo gerado por scripts/build-emails.mjs a partir de src/content/site/emails.yaml. Não edite.',
  emails: read('emails.yaml'),
  site: { email: site.email, phone: site.phone?.display },
  services,
};
writeFileSync('netlify/functions/emails.generated.json', JSON.stringify(output, null, 2) + '\n');
