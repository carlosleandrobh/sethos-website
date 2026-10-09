// Os testes não podem conter textos do site escritos à mão: se alguém editar o texto nos arquivos de conteúdo,
// o portão de publicação (npm run cms) reprovaria por causa do teste, não de um erro de verdade.
// Use os dados de tests/content.ts (lidos dos arquivos YAML/Markdown) em vez de literais.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { parse } from 'yaml';

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((n) => {
    const p = `${dir}/${n}`;
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const strings = (value: unknown): string[] =>
  typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : [];

const copy = new Set<string>();
for (const file of [...walk('src/content/site'), ...walk('src/content/pages')].filter((f) => f.endsWith('.yaml'))) {
  for (const s of strings(parse(readFileSync(file, 'utf8')))) copy.add(s.trim());
}
for (const file of walk('src/content/services').filter((f) => f.endsWith('.md'))) {
  for (const s of strings(parse(readFileSync(file, 'utf8').split(/^---\s*$/m)[1]))) copy.add(s.trim());
}
// Só textos "de verdade" (frases): ignora códigos, endereços, nomes de ícone e valores curtos.
const sentences = [...copy].filter((s) => s.length >= 18 && /\s/.test(s) && !s.startsWith('http') && !s.startsWith('{'));

const testFiles = [...walk('tests/e2e'), 'tests/emails.test.ts', 'tests/send-contact.test.ts'].filter((f) => f.endsWith('.ts'));

describe('testes não escrevem texto do site à mão', () => {
  it.each(testFiles)('%s', (file) => {
    const source = readFileSync(file, 'utf8');
    const found = sentences.filter((s) => source.includes(`'${s}'`) || source.includes(`"${s}"`) || source.includes(`\`${s}\``));
    expect(found, `use tests/content.ts em vez de escrever o texto em ${file}`).toEqual([]);
  });

  it('o detector enxerga um texto real do site (sanidade)', () => {
    expect(sentences.length).toBeGreaterThan(50);
    expect(`it('${sentences[0]}')`.includes(`'${sentences[0]}'`)).toBe(true);
  });
});
