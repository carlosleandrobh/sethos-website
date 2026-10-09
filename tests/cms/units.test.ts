import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseArgs } from '../../scripts/lib/cms/args.mjs';
import { addRedirect, FIXED_ROUTES, readRedirects, redirectProblems, removeRedirect, renderRedirectsFile } from '../../scripts/lib/cms/redirects.mjs';
import { commitMessage, describePath, diffPaths, isContentPath, summarizeChange } from '../../scripts/lib/cms/summary.mjs';
import { githubBase } from '../../scripts/lib/cms/run.mjs';

describe('parseArgs', () => {
  it('lê opções curtas e longas', () => {
    expect(parseArgs(['-y', '-m', 'texto', '--dry-run']).options).toMatchObject({ yes: true, message: 'texto', dryRun: true });
    expect(parseArgs(['--preview', '--all', '--no-redirect', '--skip-e2e']).options).toMatchObject({ preview: true, all: true, noRedirect: true, skipE2e: true });
  });
  it('erros claros', () => {
    expect(parseArgs(['--xyz']).error).toContain('Opção desconhecida: --xyz');
    expect(parseArgs(['-m']).error).toContain('precisa de um texto');
    expect(parseArgs(['--undo', '--preview']).error).toContain('não podem ser usados juntos');
  });
});

describe('classificação de caminhos', () => {
  it.each([
    ['src/content/pages/home.yaml', true],
    ['src/content/services/x.md', true],
    ['src/assets/brand/mascot.png', true],
    ['public/favicon.png', true],
    ['src/components/Footer.astro', false],
    ['package.json', false],
    ['netlify.toml', false],
  ])('%s → conteúdo? %s', (path, expected) => expect(isContentPath(path)).toBe(expected));

  it('nomes amigáveis', () => {
    expect(describePath('src/content/pages/about.yaml').name).toBe('Quem Somos');
    expect(describePath('src/content/services/folha.md')).toMatchObject({ name: 'serviço folha', kind: 'service', slug: 'folha' });
    expect(describePath('src/content/legal/termos-de-uso.md').name).toBe('Termos de Uso');
    expect(describePath('src/assets/brand/mascot.png').kind).toBe('asset');
  });
});

describe('resumo das mudanças', () => {
  it('diffPaths aponta os campos alterados (objetos e listas)', () => {
    const a = { hero: { title: 'A', cta: 'X' }, faq: [{ q: '1' }, { q: '2' }] };
    const b = { hero: { title: 'B', cta: 'X' }, faq: [{ q: '1' }, { q: '3' }, { q: '4' }] };
    expect(diffPaths(a, b).sort()).toEqual(['faq[1].q', 'faq[2]', 'hero.title']);
    expect(diffPaths(a, a)).toEqual([]);
  });
  it('YAML: lista os campos', () => {
    const s = summarizeChange('src/content/pages/home.yaml', 'hero:\n  title: "A"\n  cta: "B"\n', 'hero:\n  title: "A2"\n  cta: "B2"\n');
    expect(s).toMatchObject({ verb: 'alterado', name: 'página inicial' });
    expect(s.detail).toBe('2 campos: hero.title, hero.cta');
  });
  it('Markdown: frontmatter e corpo', () => {
    const before = '---\ntitle: "A"\n---\n\nTexto.\n';
    const after = '---\ntitle: "A"\n---\n\nTexto novo.\n';
    expect(summarizeChange('src/content/services/x.md', before, after).detail).toContain('texto "Sobre este serviço"');
    expect(summarizeChange('src/content/legal/termos-de-uso.md', before, after).detail).toContain('texto da página');
  });
  it('arquivo novo, removido e imagem', () => {
    expect(summarizeChange('src/content/services/x.md', null, '---\n---\n').verb).toBe('novo');
    expect(summarizeChange('src/content/services/x.md', '---\n---\n', null).verb).toBe('removido');
    expect(summarizeChange('src/assets/brand/mascot.png', 'a', 'b').detail).toBe('arquivo substituído');
  });
  it('YAML inválido não derruba o resumo', () => {
    expect(summarizeChange('src/content/pages/home.yaml', 'a: 1', 'a: "sem fechar').detail).toBe('conteúdo alterado');
  });
  it('mensagem de commit automática', () => {
    const items = [
      { verb: 'alterado', name: 'página inicial' },
      { verb: 'novo', name: 'serviço folha' },
      { verb: 'removido', name: 'serviço velho' },
    ];
    expect(commitMessage(items)).toBe('content: adiciona serviço folha; atualiza página inicial; remove serviço velho');
    const many = ['a', 'b', 'c', 'd', 'e'].map((n) => ({ verb: 'alterado', name: n }));
    expect(commitMessage(many)).toBe('content: atualiza a, b, c e mais 2');
  });
});

describe('redirecionamentos', () => {
  const base = '# comentário\nredirects: []\n';
  it('acrescenta sem apagar comentários e não duplica', () => {
    const once = addRedirect(base, '/servicos/x');
    expect(once).toContain('# comentário');
    expect(readRedirects(once)).toEqual([{ from: '/servicos/x', to: '/servicos' }]);
    expect(addRedirect(once, '/servicos/x')).toBe(once);
    const twice = addRedirect(once, '/servicos/y');
    expect(readRedirects(twice).map((r: { from: string }) => r.from)).toEqual(['/servicos/x', '/servicos/y']);
  });
  it('remove e volta para a lista vazia', () => {
    const one = addRedirect(base, '/servicos/x');
    expect(removeRedirect(one, '/servicos/x')).toContain('redirects: []');
    const two = addRedirect(one, '/servicos/y');
    expect(readRedirects(removeRedirect(two, '/servicos/x'))).toEqual([{ from: '/servicos/y', to: '/servicos' }]);
  });
  it('detecta problemas', () => {
    expect(redirectProblems([{ from: '/servicos/x', to: '/servicos' }], FIXED_ROUTES)).toEqual([]);
    expect(redirectProblems([{ from: '/contato', to: '/servicos' }], FIXED_ROUTES)[0]).toContain('ainda existe');
    expect(redirectProblems([{ from: '/a', to: '/a' }], [])[0]).toContain('si mesmo');
    expect(redirectProblems([{ from: '/a', to: '/b' }, { from: '/a', to: '/c' }], [])[0]).toContain('mais de uma vez');
    expect(redirectProblems([{ from: 'a', to: '/b' }], [])[0]).toContain('começar com /');
  });
  it('gera o arquivo _redirects do Netlify', () => {
    expect(renderRedirectsFile([{ from: '/servicos/x', to: '/servicos' }])).toContain('/servicos/x  /servicos  301\n');
    expect(renderRedirectsFile([])).not.toContain('301');
  });
});

describe('scripts/build-redirects.mjs', () => {
  const script = join(process.cwd(), 'scripts/build-redirects.mjs');
  const project = (yaml: string, services: string[]) => {
    const dir = mkdtempSync(join(tmpdir(), 'redirects-'));
    mkdirSync(join(dir, 'src/content/site'), { recursive: true });
    mkdirSync(join(dir, 'src/content/services'), { recursive: true });
    mkdirSync(join(dir, 'public'), { recursive: true });
    writeFileSync(join(dir, 'src/content/site/redirects.yaml'), yaml);
    for (const s of services) writeFileSync(join(dir, `src/content/services/${s}.md`), '---\n---\n');
    return dir;
  };
  const run = (dir: string) => {
    try {
      execFileSync(process.execPath, [script], { cwd: dir, stdio: 'pipe' });
      return { ok: true, error: '' };
    } catch (e) {
      return { ok: false, error: String((e as { stderr?: Buffer }).stderr ?? '') };
    }
  };
  it('gera public/_redirects', () => {
    const dir = project('redirects:\n  - from: "/servicos/velho"\n    to: "/servicos"\n', ['novo']);
    expect(run(dir).ok).toBe(true);
    expect(readFileSync(join(dir, 'public/_redirects'), 'utf8')).toContain('/servicos/velho  /servicos  301');
  });
  it('falha (e diz por quê) se o redirecionamento aponta de uma página que ainda existe', () => {
    const dir = project('redirects:\n  - from: "/servicos/novo"\n    to: "/servicos"\n', ['novo']);
    const r = run(dir);
    expect(r.ok).toBe(false);
    expect(r.error).toContain('ainda existe');
  });
});

describe('githubBase', () => {
  it.each([
    ['https://github.com/carlosleandrobh/sethos-website.git', 'https://github.com/carlosleandrobh/sethos-website'],
    ['git@github.com:carlosleandrobh/sethos-website.git', 'https://github.com/carlosleandrobh/sethos-website'],
    ['https://github.com/a/b', 'https://github.com/a/b'],
    ['/tmp/remote.git', null],
  ])('%s', (url, expected) => expect(githubBase(url)).toBe(expected));
});
