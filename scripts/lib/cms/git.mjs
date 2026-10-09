// Camada fina sobre o git (síncrona, sempre com `cwd` explícito para ser testável em repositórios temporários).
import { spawnSync } from 'node:child_process';

export function git(cwd, args, { allowFail = false } = {}) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_TERMINAL_PROMPT: '0', LC_ALL: 'C' } });
  const out = { code: result.status ?? 1, stdout: (result.stdout ?? '').trimEnd(), stderr: (result.stderr ?? '').trimEnd() };
  if (out.code !== 0 && !allowFail) throw new Error(`git ${args.join(' ')} falhou:\n${out.stderr || out.stdout}`);
  return out;
}

export const isRepo = (cwd) => git(cwd, ['rev-parse', '--is-inside-work-tree'], { allowFail: true }).stdout === 'true';
export const currentBranch = (cwd) => git(cwd, ['rev-parse', '--abbrev-ref', 'HEAD']).stdout;
export const hasRemote = (cwd, name = 'origin') => git(cwd, ['remote', 'get-url', name], { allowFail: true }).code === 0;
export const remoteUrl = (cwd, name = 'origin') => git(cwd, ['remote', 'get-url', name]).stdout;

/** Alterações do working tree: [{ status: 'M'|'A'|'D'|'?', path }] (arquivos novos listados um a um). */
export function changes(cwd) {
  const { stdout } = git(cwd, ['status', '--porcelain=v1', '-uall', '--no-renames']);
  return stdout
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const xy = line.slice(0, 2);
      const path = line.slice(3).replace(/^"|"$/g, '');
      const status = xy === '??' ? '?' : xy.includes('D') ? 'D' : xy.includes('A') ? 'A' : 'M';
      return { status, path };
    });
}

/** Conteúdo de um arquivo no último commit (HEAD); null se não existir. */
export function showHead(cwd, path) {
  const r = git(cwd, ['show', `HEAD:${path}`], { allowFail: true });
  return r.code === 0 ? r.stdout : null;
}

/** Quantos commits o remoto tem a mais que a branch local (após `fetch`). */
export function behindCount(cwd, branch) {
  const r = git(cwd, ['rev-list', '--count', `HEAD..origin/${branch}`], { allowFail: true });
  return r.code === 0 ? Number(r.stdout) : 0;
}
