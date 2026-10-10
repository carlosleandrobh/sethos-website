// `lastmod` real do sitemap: data do último commit que mexeu no arquivo de conteúdo de cada página.
// Se o histórico não estiver completo (clone raso) ou o git não existir, devolve null e a data é omitida:
// uma data falsa é pior do que nenhuma (o Google passa a desconfiar do sitemap inteiro).
import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';

const git = (args, cwd) => {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {
    return null;
  }
};

/** Arquivos de conteúdo que determinam o texto de uma página (caminho como "/servicos/x"). */
export function sourcesFor(pathname, cwd = process.cwd()) {
  const path = pathname.replace(/\/$/, '') || '/';
  const pages = 'src/content/pages';
  const fixed = {
    '/': [`${pages}/home.yaml`],
    '/quem-somos': [`${pages}/about.yaml`],
    '/nossos-valores': [`${pages}/values.yaml`],
    '/contato': [`${pages}/contact.yaml`],
  };
  if (fixed[path]) return fixed[path];
  if (path === '/servicos') {
    const services = readdirSync(`${cwd}/src/content/services`).filter((f) => f.endsWith('.md')).map((f) => `src/content/services/${f}`);
    return [`${pages}/services-index.yaml`, ...services];
  }
  const service = path.match(/^\/servicos\/([^/]+)$/);
  if (service) return [`src/content/services/${service[1]}.md`];
  const legal = path.match(/^\/([^/]+)$/);
  if (legal) return [`src/content/legal/${legal[1]}.md`];
  return [];
}

/** Data (AAAA-MM-DD) da última alteração, ou null se não for possível saber com segurança. */
export function lastModified(pathname, cwd = process.cwd()) {
  if (git(['rev-parse', '--is-shallow-repository'], cwd) !== 'false') return null;
  const files = sourcesFor(pathname, cwd);
  if (!files.length) return null;
  const iso = git(['log', '-1', '--format=%cI', '--', ...files], cwd);
  return iso ? iso.slice(0, 10) : null;
}
