// Prova de ponta a ponta de que TODO tipo de conteúdo é editável: numa CÓPIA do projeto, altera um texto de cada tipo
// de arquivo (página, dados globais, rótulos, e-mails, serviço, página legal, serviço novo, serviço removido),
// roda o build de verdade e confere que o resultado mudou. O projeto real não é tocado.
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, symlinkSync, unlinkSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, sep } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { addRedirect } from '../scripts/lib/cms/redirects.mjs';

const root = process.cwd();
const work = mkdtempSync(join(tmpdir(), 'roundtrip-'));
const read = (path: string) => readFileSync(join(work, path), 'utf8');
const edit = (path: string, from: string, to: string) => {
  const text = read(path);
  expect(text, `texto "${from}" não encontrado em ${path}`).toContain(from);
  writeFileSync(join(work, path), text.replace(from, to));
};

beforeAll(() => {
  const skip = ['node_modules', 'dist', '.git', '.astro', 'test-results', 'legacy-content', 'tests', 'docs', '.agents', '.claude'].map((d) => `${sep}${d}`);
  cpSync(root, work, { recursive: true, filter: (src) => !skip.some((d) => src.endsWith(d) || src.includes(`${d}${sep}`)) });
  symlinkSync(join(root, 'node_modules'), join(work, 'node_modules'), 'junction');

  // --- edições: um texto de cada tipo de arquivo ---------------------------------------------------------------
  edit('src/content/pages/home.yaml', 'Soluções inteligentes para potencializar seu ERP Totvs RM RH', 'TEXTO-NOVO-HOME para potencializar seu ERP');
  edit('src/content/pages/about.yaml', 'Nossa Missão', 'TEXTO-NOVO-MISSAO');
  edit('src/content/pages/contact.yaml', 'Conte-nos Sobre Sua Necessidade', 'TEXTO-NOVO-CONTATO');
  edit('src/content/site/site.yaml', '(31) 97245-7451', '(11) 91234-5678');
  edit('src/content/site/ui.yaml', 'Siga-nos nas redes', 'TEXTO-NOVO-RODAPE');
  edit('src/content/site/emails.yaml', 'Recebemos sua mensagem e nossa equipe', 'TEXTO-NOVO-EMAIL e nossa equipe');
  edit('src/content/services/consultoria-rh.md', 'Otimização de rotinas de RH', 'TEXTO-NOVO-BENEFICIO');
  edit('src/content/services/consultoria-rh.md', 'Nossa consultoria em RH é especializada', 'TEXTO-NOVO-SOBRE é especializada');
  edit('src/content/legal/termos-de-uso.md', '## 1. INTRODUÇÃO E ACEITAÇÃO DOS TERMOS', '## 1. TEXTO-NOVO-LEGAL');

  // serviço novo (copia um existente com outro nome e título)
  writeFileSync(join(work, 'src/content/services/servico-de-teste.md'), read('src/content/services/treinamentos-totvs.md').replace('Treinamentos sob Demanda', 'TITULO-SERVICO-NOVO').replace('order: 8', 'order: 99'));
  // serviço removido + redirecionamento (o que o `npm run cms` faria)
  unlinkSync(join(work, 'src/content/services/bancodados-sql.md'));
  writeFileSync(join(work, 'src/content/site/redirects.yaml'), addRedirect(read('src/content/site/redirects.yaml'), '/servicos/bancodados-sql'));

  const build = spawnSync('npm run build', { cwd: work, shell: true, encoding: 'utf8' });
  if (build.status !== 0) throw new Error(`build da cópia falhou:\n${build.stdout}\n${build.stderr}`);
}, 180_000);

afterAll(() => rmSync(work, { recursive: true, force: true }));

describe('editar cada tipo de arquivo muda o site publicado', () => {
  it('página em YAML (home) → título do hero', () => expect(read('dist/index.html')).toContain('TEXTO-NOVO-HOME'));
  it('página em YAML (quem somos) → missão', () => expect(read('dist/quem-somos.html')).toContain('TEXTO-NOVO-MISSAO'));
  it('página em YAML (contato) → título do formulário', () => expect(read('dist/contato.html')).toContain('TEXTO-NOVO-CONTATO'));
  it('dados globais (site.yaml) → telefone novo em toda parte, e o antigo some', () => {
    for (const page of ['dist/index.html', 'dist/contato.html', 'dist/servicos/consultoria-rh.html']) {
      expect(read(page)).toContain('(11) 91234-5678');
      expect(read(page)).not.toContain('(31) 97245-7451');
    }
    // os links de ligar e do WhatsApp são derivados do mesmo telefone
    expect(read('dist/index.html')).toContain('tel:+5511912345678');
    expect(read('dist/index.html')).toContain('wa.me/5511912345678');
    expect(read('dist/index.html')).not.toContain('5531972457451');
  });
  it('rótulos (ui.yaml) → rodapé', () => expect(read('dist/index.html')).toContain('TEXTO-NOVO-RODAPE'));
  it('e-mails (emails.yaml) → JSON usado pela função do Netlify', () => {
    expect(read('netlify/functions/emails.generated.json')).toContain('TEXTO-NOVO-EMAIL');
  });
  it('serviço (.md) → benefício e texto "Sobre este serviço"', () => {
    const html = read('dist/servicos/consultoria-rh.html');
    expect(html).toContain('TEXTO-NOVO-BENEFICIO');
    expect(html).toContain('TEXTO-NOVO-SOBRE');
  });
  it('página legal (.md) → título da seção e índice lateral', () => {
    const html = read('dist/termos-de-uso.html');
    expect(html.match(/TEXTO-NOVO-LEGAL/g)!.length).toBeGreaterThanOrEqual(2); // seção + índice
  });
  it('serviço NOVO → página própria, na lista, no anterior/próximo e no sitemap', () => {
    expect(existsSync(join(work, 'dist/servicos/servico-de-teste.html'))).toBe(true);
    expect(read('dist/servicos/servico-de-teste.html')).toContain('TITULO-SERVICO-NOVO');
    expect(read('dist/servicos.html')).toContain('TITULO-SERVICO-NOVO');
    expect(read('dist/sitemap-0.xml')).toContain('/servicos/servico-de-teste');
  });
  it('serviço REMOVIDO → some do site e ganha redirecionamento 301 para /servicos', () => {
    expect(existsSync(join(work, 'dist/servicos/bancodados-sql.html'))).toBe(false);
    expect(read('dist/servicos.html')).not.toContain('/servicos/bancodados-sql');
    expect(read('dist/sitemap-0.xml')).not.toContain('/servicos/bancodados-sql');
    expect(read('dist/_redirects')).toContain('/servicos/bancodados-sql  /servicos  301');
  });
});
