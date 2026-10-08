// Garante que NENHUM texto em português fique escrito dentro de componentes/páginas (.astro):
// todo texto visível precisa morar em src/content/ (YAML/Markdown), onde pode ser editado sem mexer em código.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = `${dir}/${n}`;
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const files = [...walk('src/components'), ...walk('src/layouts'), ...walk('src/pages')].filter((f) => f.endsWith('.astro'));
const LETTERS = /[A-Za-zÀ-ÿ]{2,}/;
const ACCENTED = /[À-ÿ]/;

/** Trechos de texto "soltos" encontrados em um arquivo .astro. */
export function looseText(source: string): string[] {
  const found: string[] = [];
  // 1) Marcação: tira frontmatter, <script> e <style>; olha texto entre tags e atributos de texto visível.
  const markup = source
    .replace(/^---[\s\S]*?---/, '')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  for (const m of markup.matchAll(/>([^<>{}]+)</g)) {
    const t = m[1].trim();
    if (LETTERS.test(t)) found.push(`texto: "${t}"`);
  }
  for (const m of markup.matchAll(/\s(alt|aria-label|title|placeholder|label)="([^"{}]*)"/g)) {
    if (LETTERS.test(m[2])) found.push(`${m[1]}="${m[2]}"`);
  }
  // 2) Código (frontmatter e scripts): textos com acento dentro de strings = provável texto em português.
  const code = [...(source.match(/^---([\s\S]*?)---/)?.[1] ?? '').split(/\r?\n/), ...[...source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)].flatMap((s) => s[1].split(/\r?\n/))]
    .map((l) => l.replace(/\/\/.*$/, '').replace(/\/\*[\s\S]*?\*\//g, ''))
    .join('\n');
  // Mensagens de erro para quem faz o deploy (não são conteúdo do site).
  const visibleCode = code
    .split('\n')
    .filter((l) => !l.includes('throw new Error'))
    .join('\n');
  for (const m of visibleCode.matchAll(/(['"`])((?:\\.|(?!\1)[^\\])*)\1/g)) {
    if (ACCENTED.test(m[2]) || /Olá|Nome:|Saiba mais/.test(m[2])) found.push(`string: "${m[2].slice(0, 70)}"`);
  }
  return found;
}

describe('texto solto em componentes', () => {
  it('detector funciona (exemplos)', () => {
    expect(looseText('<p>Olá mundo</p>')).toHaveLength(1);
    expect(looseText('<img alt="Logo da empresa">')).toHaveLength(1);
    expect(looseText('---\nconst a = "Gostaria de saber";\n---\n<p>{a}</p>').length).toBe(0); // sem acento: ok
    expect(looseText('---\nconst a = "Atenção";\n---\n<p>{a}</p>')).toHaveLength(1);
    expect(looseText('<p>{ui.title}</p><img alt={ui.alt}>')).toHaveLength(0);
    expect(looseText('<span aria-hidden="true">•</span> {x}')).toHaveLength(0);
  });

  it.each(files)('%s não tem texto fixo em português', (file) => {
    expect(looseText(readFileSync(file, 'utf8')), `mova estes textos para src/content/ (YAML/Markdown): ${file}`).toEqual([]);
  });
});
