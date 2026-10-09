// Ambiente de teste do `npm run cms`: um "GitHub" local (repositório bare) + um clone de trabalho.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

export const git = (cwd: string, ...args: string[]) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_TERMINAL_PROMPT: '0' } }).trim();

export const write = (cwd: string, path: string, content: string) => {
  mkdirSync(dirname(join(cwd, path)), { recursive: true });
  writeFileSync(join(cwd, path), content);
};

export const HOME_YAML = 'seo:\n  title: "Título da home"\nhero:\n  title: "Soluções para o seu ERP"\n  cta: "Solicite um contato"\n';
export const SERVICE_MD = (title: string) => `---\ntitle: "${title}"\norder: 1\n---\n\nTexto sobre o serviço.\n`;

export interface Env {
  remote: string;
  work: string;
  other: string; // segundo clone, para simular outra pessoa publicando
  io: { out: (t: string) => void; err: (t: string) => void; ask: (q: string) => Promise<string | null>; logs: string[]; errors: string[]; setAnswer: (a: string | null) => void };
}

export function createEnv(): Env {
  const root = mkdtempSync(join(tmpdir(), 'cms-test-'));
  const remote = join(root, 'remote.git');
  const work = join(root, 'work');
  const other = join(root, 'other');
  execFileSync('git', ['init', '--bare', '--initial-branch=main', remote]);
  execFileSync('git', ['clone', remote, work], { stdio: 'ignore' });
  const config = (dir: string) => {
    git(dir, 'config', 'user.name', 'Teste');
    git(dir, 'config', 'user.email', 'teste@example.com');
    git(dir, 'config', 'core.autocrlf', 'false');
  };
  config(work);
  git(work, 'checkout', '-B', 'main');
  write(work, 'src/content/pages/home.yaml', HOME_YAML);
  write(work, 'src/content/services/consultoria-rh.md', SERVICE_MD('Consultoria'));
  write(work, 'src/content/services/treinamentos.md', SERVICE_MD('Treinamentos'));
  write(work, 'src/content/site/redirects.yaml', '# comentário que deve sobreviver\nredirects: []\n');
  write(work, 'src/components/Footer.astro', '<footer></footer>\n');
  git(work, 'add', '-A');
  git(work, 'commit', '-m', 'initial');
  git(work, 'push', '-u', 'origin', 'main');
  execFileSync('git', ['clone', remote, other], { stdio: 'ignore' });
  config(other);

  let answer: string | null = null;
  const logs: string[] = [];
  const errors: string[] = [];
  return {
    remote,
    work,
    other,
    io: {
      out: (t) => logs.push(t),
      err: (t) => errors.push(t),
      ask: async () => answer,
      logs,
      errors,
      setAnswer: (a) => (answer = a),
    },
  };
}

export const PASS = [] as { name: string; cmd: string }[];
export const FAIL = [{ name: 'Teste que falha', cmd: 'node -e "console.error(\'boom\'); process.exit(1)"' }];
export const remoteHead = (env: Env) => git(env.remote, 'rev-parse', 'main');
export const subjects = (cwd: string, n = 5) => git(cwd, 'log', `-n${n}`, '--format=%s').split('\n');
