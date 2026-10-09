// Classifica os arquivos alterados e escreve um resumo legível + a mensagem de commit automática.
import { parse } from 'yaml';

/** Pastas que o comando pode publicar. Qualquer outra coisa exige --all. */
export const CONTENT_PREFIXES = ['src/content/', 'src/assets/', 'public/'];
export const isContentPath = (path) => CONTENT_PREFIXES.some((p) => path.startsWith(p));

const PAGE_NAMES = {
  'src/content/pages/home.yaml': 'página inicial',
  'src/content/pages/about.yaml': 'Quem Somos',
  'src/content/pages/values.yaml': 'Nossos Valores',
  'src/content/pages/services-index.yaml': 'lista de serviços',
  'src/content/pages/contact.yaml': 'Contato',
  'src/content/site/site.yaml': 'dados do site',
  'src/content/site/ui.yaml': 'rótulos do site',
  'src/content/site/emails.yaml': 'e-mails do formulário',
  'src/content/site/redirects.yaml': 'redirecionamentos',
};
const LEGAL_NAMES = {
  'politica-de-privacidade': 'Política de Privacidade',
  'politica-de-cookies': 'Política de Cookies',
  'termos-de-uso': 'Termos de Uso',
};

/** Nome amigável + tipo ('page' | 'service' | 'legal' | 'asset' | 'other') de um arquivo. */
export function describePath(path) {
  if (PAGE_NAMES[path]) return { name: PAGE_NAMES[path], kind: 'page' };
  let m = path.match(/^src\/content\/services\/([^/]+)\.md$/);
  if (m) return { name: `serviço ${m[1]}`, kind: 'service', slug: m[1] };
  m = path.match(/^src\/content\/legal\/([^/]+)\.md$/);
  if (m) return { name: LEGAL_NAMES[m[1]] ?? `página legal ${m[1]}`, kind: 'legal' };
  if (path.startsWith('src/assets/') || path.startsWith('public/')) return { name: `arquivo ${path.split('/').slice(-1)[0]}`, kind: 'asset' };
  return { name: path, kind: 'other' };
}

/** Caminhos (ex.: "hero.title", "faq[1].answer") cujos valores diferem entre dois objetos. */
export function diffPaths(before, after, prefix = '') {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  const isObj = (v) => v !== null && typeof v === 'object';
  if (!isObj(before) || !isObj(after) || Array.isArray(before) !== Array.isArray(after)) return [prefix || '(arquivo)'];
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].flatMap((k) => {
    const path = Array.isArray(before) ? `${prefix}[${k}]` : prefix ? `${prefix}.${k}` : k;
    return diffPaths(before[k], after[k], path);
  });
}

const splitFrontmatter = (text) => {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  return m ? { data: parse(m[1]) ?? {}, body: m[2].trim() } : { data: {}, body: text.trim() };
};

/** Resumo de UMA alteração. `before` = texto no HEAD (ou null), `after` = texto atual (ou null se apagado). */
export function summarizeChange(path, before, after) {
  const info = describePath(path);
  if (before === null) return { ...info, path, verb: 'novo', detail: 'arquivo novo' };
  if (after === null) return { ...info, path, verb: 'removido', detail: 'arquivo removido' };
  if (info.kind === 'asset') return { ...info, path, verb: 'alterado', detail: 'arquivo substituído' };
  try {
    let changed;
    if (path.endsWith('.yaml')) changed = diffPaths(parse(before), parse(after));
    else if (path.endsWith('.md')) {
      const a = splitFrontmatter(before);
      const b = splitFrontmatter(after);
      changed = diffPaths(a.data, b.data);
      if (a.body !== b.body) changed.push(info.kind === 'service' ? 'texto "Sobre este serviço"' : 'texto da página');
    } else changed = ['(conteúdo)'];
    const shown = changed.slice(0, 5).join(', ');
    const count = `${changed.length} ${changed.length === 1 ? 'campo' : 'campos'}`;
    return { ...info, path, verb: 'alterado', detail: `${count}: ${shown}${changed.length > 5 ? `, +${changed.length - 5}` : ''}` };
  } catch {
    return { ...info, path, verb: 'alterado', detail: 'conteúdo alterado' };
  }
}

/** Mensagem de commit automática: "content: atualiza página inicial, serviço x". */
export function commitMessage(items) {
  const by = (verb) => [...new Set(items.filter((i) => i.verb === verb).map((i) => i.name))];
  const parts = [
    ['adiciona', by('novo')],
    ['atualiza', by('alterado')],
    ['remove', by('removido')],
  ]
    .filter(([, names]) => names.length)
    .map(([verb, names]) => `${verb} ${names.length > 3 ? `${names.slice(0, 3).join(', ')} e mais ${names.length - 3}` : names.join(', ')}`);
  return `content: ${parts.join('; ') || 'atualiza conteúdo'}`;
}
