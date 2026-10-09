import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { runCms } from '../../scripts/lib/cms/run.mjs';
import { createEnv, FAIL, git, HOME_YAML, PASS, remoteHead, subjects, SERVICE_MD, write, type Env } from './helpers';

let env: Env;
beforeEach(() => {
  env = createEnv();
});
const run = (argv: string[], steps = PASS) => runCms({ cwd: env.work, argv, io: env.io, steps });
const edit = () => write(env.work, 'src/content/pages/home.yaml', HOME_YAML.replace('Soluções para o seu ERP', 'Soluções novas para o seu ERP'));
const output = () => env.io.logs.join('\n');

describe('npm run cms — publicar', () => {
  it('sem mudanças: não faz nada', async () => {
    expect(await run(['--yes'])).toBe(0);
    expect(output()).toContain('Nada para publicar');
    expect(subjects(env.work, 1)).toEqual(['initial']);
  });

  it('publica: commit "content: …" só com o arquivo de conteúdo, enviado ao remoto', async () => {
    edit();
    expect(await run(['--yes'])).toBe(0);
    expect(subjects(env.work, 1)).toEqual(['content: atualiza página inicial']);
    expect(git(env.work, 'show', '--name-only', '--format=', 'HEAD')).toBe('src/content/pages/home.yaml');
    expect(remoteHead(env)).toBe(git(env.work, 'rev-parse', 'HEAD'));
    expect(output()).toContain('hero.title');
    expect(output()).toContain('Publicado');
  });

  it('usa a mensagem do usuário com o prefixo "content:"', async () => {
    edit();
    await run(['--yes', '-m', 'ajusta o título']);
    expect(subjects(env.work, 1)).toEqual(['content: ajusta o título']);
  });

  it('--dry-run valida e resume, mas não faz commit nem envia', async () => {
    edit();
    const before = remoteHead(env);
    expect(await run(['--dry-run'])).toBe(0);
    expect(output()).toContain('--dry-run');
    expect(subjects(env.work, 1)).toEqual(['initial']);
    expect(remoteHead(env)).toBe(before);
    expect(git(env.work, 'status', '--porcelain')).toContain('home.yaml'); // arquivo continua alterado
  });

  it('validação reprovada: NADA é commitado nem enviado', async () => {
    edit();
    const before = remoteHead(env);
    expect(await run(['--yes'], FAIL as never)).toBe(1);
    expect(env.io.errors.join('\n')).toContain('Falhou em: Teste que falha');
    expect(env.io.errors.join('\n')).toContain('boom');
    expect(subjects(env.work, 1)).toEqual(['initial']);
    expect(remoteHead(env)).toBe(before);
  });

  it('sem --yes e sem terminal: não publica', async () => {
    edit();
    env.io.setAnswer(null);
    expect(await run([])).toBe(0);
    expect(env.io.errors.join('\n')).toContain('--yes');
    expect(subjects(env.work, 1)).toEqual(['initial']);
  });

  it('responde "n" → cancela; responde "s" → publica', async () => {
    edit();
    env.io.setAnswer('n');
    await run([]);
    expect(subjects(env.work, 1)).toEqual(['initial']);
    env.io.setAnswer('s');
    await run([]);
    expect(subjects(env.work, 1)).toEqual(['content: atualiza página inicial']);
  });

  it('recusa alterações fora do conteúdo (a menos que use --all)', async () => {
    edit();
    write(env.work, 'src/components/Footer.astro', '<footer>mudou</footer>\n');
    expect(await run(['--yes'])).toBe(1);
    expect(env.io.errors.join('\n')).toContain('src/components/Footer.astro');
    expect(subjects(env.work, 1)).toEqual(['initial']);

    expect(await run(['--yes', '--all'])).toBe(0);
    expect(git(env.work, 'show', '--name-only', '--format=', 'HEAD').split('\n').sort()).toEqual(['src/components/Footer.astro', 'src/content/pages/home.yaml']);
  });

  it('arquivos novos fora do conteúdo são ignorados (não entram no commit)', async () => {
    edit();
    write(env.work, '.agents/skill.md', 'x');
    expect(await run(['--yes'])).toBe(0);
    expect(output()).toContain('ignorando 1 arquivo');
    expect(git(env.work, 'show', '--name-only', '--format=', 'HEAD')).toBe('src/content/pages/home.yaml');
    expect(git(env.work, 'status', '--porcelain')).toContain('.agents/');
  });

  it('só publica a partir da main', async () => {
    git(env.work, 'checkout', '-b', 'outra');
    edit();
    expect(await run(['--yes'])).toBe(1);
    expect(env.io.errors.join('\n')).toContain('git checkout main');
  });

  it('o GitHub tem novidades: sincroniza (rebase) e publica sem perder nada', async () => {
    write(env.other, 'src/content/services/treinamentos.md', SERVICE_MD('Treinamentos NOVO'));
    git(env.other, 'add', '-A');
    git(env.other, 'commit', '-m', 'content: outra pessoa');
    git(env.other, 'push', 'origin', 'main');
    edit();
    expect(await run(['--yes'])).toBe(0);
    expect(subjects(env.work, 3)).toEqual(['content: atualiza página inicial', 'content: outra pessoa', 'initial']);
    expect(remoteHead(env)).toBe(git(env.work, 'rev-parse', 'HEAD'));
  });

  it('sem remoto: cria o commit local e explica como configurar', async () => {
    git(env.work, 'remote', 'remove', 'origin');
    edit();
    expect(await run(['--yes'])).toBe(0);
    expect(subjects(env.work, 1)).toEqual(['content: atualiza página inicial']);
    expect(output()).toContain('git remote add origin');
  });

  it('--preview: envia para uma branch content/… e volta para a main', async () => {
    edit();
    const mainBefore = remoteHead(env);
    expect(await run(['--yes', '--preview'])).toBe(0);
    expect(git(env.work, 'rev-parse', '--abbrev-ref', 'HEAD')).toBe('main');
    expect(remoteHead(env)).toBe(mainBefore); // main do remoto intacta
    const branches = git(env.remote, 'branch', '--list', 'content/*');
    expect(branches).toMatch(/content\/\d{8}-\d{4}/);
    expect(output()).toContain('pré-visualização');
  });
});

describe('npm run cms — serviço apagado/criado', () => {
  it('apagar um serviço cria o redirecionamento 301 para /servicos e preserva os comentários', async () => {
    unlinkSync(join(env.work, 'src/content/services/treinamentos.md'));
    expect(await run(['--yes'])).toBe(0);
    const yaml = readFileSync(join(env.work, 'src/content/site/redirects.yaml'), 'utf8');
    expect(yaml).toContain('# comentário que deve sobreviver');
    expect(yaml).toContain('from: "/servicos/treinamentos"');
    expect(yaml).toContain('to: "/servicos"');
    expect(git(env.work, 'show', '--name-only', '--format=', 'HEAD').split('\n').sort()).toEqual(['src/content/services/treinamentos.md', 'src/content/site/redirects.yaml']);
    expect(subjects(env.work, 1)).toEqual(['content: atualiza redirecionamentos; remove serviço treinamentos']);
  });

  it('--no-redirect: apaga sem criar redirecionamento', async () => {
    unlinkSync(join(env.work, 'src/content/services/treinamentos.md'));
    await run(['--yes', '--no-redirect']);
    expect(readFileSync(join(env.work, 'src/content/site/redirects.yaml'), 'utf8')).toContain('redirects: []');
  });

  it('--dry-run só avisa que criaria o redirecionamento', async () => {
    unlinkSync(join(env.work, 'src/content/services/treinamentos.md'));
    await run(['--dry-run']);
    expect(output()).toContain('criaria o redirecionamento /servicos/treinamentos');
    expect(readFileSync(join(env.work, 'src/content/site/redirects.yaml'), 'utf8')).toContain('redirects: []');
  });

  it('serviço novo é publicado e aparece no resumo', async () => {
    write(env.work, 'src/content/services/folha.md', SERVICE_MD('Folha'));
    await run(['--yes']);
    expect(subjects(env.work, 1)).toEqual(['content: adiciona serviço folha']);
    expect(existsSync(join(env.work, 'src/content/services/folha.md'))).toBe(true);
  });

  it('recriar um serviço apagado remove o redirecionamento antigo', async () => {
    unlinkSync(join(env.work, 'src/content/services/treinamentos.md'));
    await run(['--yes']);
    write(env.work, 'src/content/services/treinamentos.md', SERVICE_MD('Treinamentos de volta'));
    await run(['--yes']);
    expect(readFileSync(join(env.work, 'src/content/site/redirects.yaml'), 'utf8')).toContain('redirects: []');
  });
});

describe('npm run cms --undo', () => {
  it('desfaz o último envio de conteúdo e publica o desfazer', async () => {
    edit();
    await run(['--yes']);
    expect(await run(['--undo', '--yes'])).toBe(0);
    expect(readFileSync(join(env.work, 'src/content/pages/home.yaml'), 'utf8')).toBe(HOME_YAML);
    expect(subjects(env.work, 1)[0]).toMatch(/^content: desfaz «atualiza página inicial»/);
    expect(remoteHead(env)).toBe(git(env.work, 'rev-parse', 'HEAD'));
  });

  it('não desfaz duas vezes o mesmo envio', async () => {
    edit();
    await run(['--yes']);
    await run(['--undo', '--yes']);
    env.io.errors.length = 0;
    expect(await run(['--undo', '--yes'])).toBe(1);
    expect(env.io.errors.join('\n')).toContain('Não encontrei nenhuma publicação de conteúdo');
  });

  it('desfaz só o último envio de conteúdo (os anteriores ficam)', async () => {
    edit();
    await run(['--yes']);
    write(env.work, 'src/content/services/treinamentos.md', SERVICE_MD('Treinamentos 2'));
    await run(['--yes']);
    await run(['--undo', '--yes']);
    expect(readFileSync(join(env.work, 'src/content/pages/home.yaml'), 'utf8')).toContain('Soluções novas');
    expect(readFileSync(join(env.work, 'src/content/services/treinamentos.md'), 'utf8')).toContain('"Treinamentos"');
  });

  it('--dry-run mostra o que seria desfeito sem alterar nada', async () => {
    edit();
    await run(['--yes']);
    const head = git(env.work, 'rev-parse', 'HEAD');
    expect(await run(['--undo', '--dry-run'])).toBe(0);
    expect(output()).toContain('Último envio de conteúdo');
    expect(git(env.work, 'rev-parse', 'HEAD')).toBe(head);
  });

  it('recusa desfazer com alterações pendentes', async () => {
    edit();
    await run(['--yes']);
    edit();
    write(env.work, 'src/content/pages/home.yaml', HOME_YAML.replace('Título da home', 'Outro'));
    expect(await run(['--undo', '--yes'])).toBe(1);
    expect(env.io.errors.join('\n')).toContain('alterações não publicadas');
  });

  it('se o site não validar sem a alteração, cancela e mantém tudo como estava', async () => {
    edit();
    await run(['--yes']);
    const head = git(env.work, 'rev-parse', 'HEAD');
    expect(await run(['--undo', '--yes'], FAIL as never)).toBe(1);
    expect(git(env.work, 'rev-parse', 'HEAD')).toBe(head);
    expect(git(env.work, 'status', '--porcelain')).toBe('');
  });
});

describe('argumentos', () => {
  it('opção desconhecida e --help', async () => {
    expect(await run(['--nada'])).toBe(2);
    expect(env.io.errors.join('\n')).toContain('Opção desconhecida');
    expect(await run(['--help'])).toBe(0);
    expect(output()).toContain('npm run cms');
  });
});
