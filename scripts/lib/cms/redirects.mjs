// Redirecionamentos 301 de serviços removidos: texto do YAML (preserva comentários) e arquivo _redirects do Netlify.
import { parse } from 'yaml';

export const REDIRECTS_FILE = 'src/content/site/redirects.yaml';

/** Rotas fixas do site (as de serviço vêm dos arquivos em src/content/services/). */
export const FIXED_ROUTES = ['/', '/quem-somos', '/nossos-valores', '/servicos', '/contato', '/politica-de-privacidade', '/politica-de-cookies', '/termos-de-uso'];

export function readRedirects(yamlText) {
  const data = parse(yamlText) ?? {};
  return Array.isArray(data.redirects) ? data.redirects : [];
}

/** Acrescenta um redirecionamento ao texto do YAML sem apagar os comentários. Não duplica. */
export function addRedirect(yamlText, from, to = '/servicos') {
  if (readRedirects(yamlText).some((r) => r.from === from)) return yamlText;
  const item = `  - from: "${from}"\n    to: "${to}"\n`;
  if (/^redirects:\s*\[\]\s*$/m.test(yamlText)) return yamlText.replace(/^redirects:\s*\[\]\s*$/m, `redirects:\n${item.trimEnd()}`);
  return `${yamlText.replace(/\s*$/, '\n')}${item}`;
}

/** Remove um redirecionamento (usado quando o serviço volta a existir). */
export function removeRedirect(yamlText, from) {
  const lines = yamlText.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(`from: "${from}"`) && lines[i].trim().startsWith('- from')) {
      i += 1; // pula a linha "to:"
      continue;
    }
    out.push(lines[i]);
  }
  const text = out.join('\n');
  return readRedirects(text).length ? text : text.replace(/^redirects:\s*$/m, 'redirects: []');
}

/** Erros (em português) que impedem o uso da lista; vazio = tudo certo. */
export function redirectProblems(items, existingRoutes) {
  const problems = [];
  const seen = new Set();
  for (const r of items) {
    if (typeof r?.from !== 'string' || typeof r?.to !== 'string' || !r.from.startsWith('/') || !r.to.startsWith('/')) {
      problems.push(`redirecionamento inválido (${JSON.stringify(r)}): "from" e "to" precisam começar com /`);
      continue;
    }
    if (r.from === r.to) problems.push(`"${r.from}" redireciona para si mesmo`);
    if (seen.has(r.from)) problems.push(`"${r.from}" aparece mais de uma vez`);
    seen.add(r.from);
    if (existingRoutes.includes(r.from)) problems.push(`"${r.from}" é uma página que ainda existe: apague este redirecionamento ou a página`);
  }
  return problems;
}

/** Conteúdo do arquivo _redirects (formato do Netlify). */
export function renderRedirectsFile(items) {
  const header = '# Gerado por scripts/build-redirects.mjs a partir de src/content/site/redirects.yaml. Não edite.\n';
  return header + items.map((r) => `${r.from}  ${r.to}  301`).join('\n') + (items.length ? '\n' : '');
}
