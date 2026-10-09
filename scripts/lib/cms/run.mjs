// Orquestra o `npm run cms`: sincroniza → resume → valida → confirma → commit → push (ou --undo / --preview / --dry-run).
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { HELP, parseArgs } from './args.mjs';
import { behindCount, changes, currentBranch, git, hasRemote, isRepo, remoteUrl, showHead } from './git.mjs';
import { addRedirect, REDIRECTS_FILE, removeRedirect } from './redirects.mjs';
import { commitMessage, isContentPath, summarizeChange } from './summary.mjs';
import { defaultSteps, runSteps } from './validate.mjs';

export function defaultIo() {
  return {
    out: (text) => console.log(text),
    err: (text) => console.error(text),
    /** Pergunta ao usuário; devolve null quando não há terminal interativo. */
    ask: async (question) => {
      if (!process.stdin.isTTY) return null;
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      try {
        return await rl.question(question);
      } finally {
        rl.close();
      }
    },
  };
}

const MAIN = 'main';
const stamp = () => new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12).replace(/^(\d{8})(\d{4})$/, '$1-$2');

/** https://github.com/dono/repo(.git) ou git@github.com:dono/repo(.git) → https://github.com/dono/repo */
export function githubBase(url) {
  const m = url.match(/github\.com[:/]([^/]+)\/([^/]+?)(?:\.git)?$/);
  return m ? `https://github.com/${m[1]}/${m[2]}` : null;
}

function push(cwd, branch, io, { setUpstream = false } = {}) {
  const args = ['push', ...(setUpstream ? ['-u'] : []), 'origin', branch];
  let r = git(cwd, args, { allowFail: true });
  if (r.code !== 0 && branch === MAIN) {
    io.out('  O GitHub tem novidades; sincronizando (git pull --rebase) e tentando de novo...');
    const pull = git(cwd, ['pull', '--rebase', '--autostash', 'origin', MAIN], { allowFail: true });
    if (pull.code !== 0) {
      git(cwd, ['rebase', '--abort'], { allowFail: true });
      io.err(`Não foi possível sincronizar automaticamente (conflito).\n${pull.stderr}\nO commit continua guardado localmente. Resolva com: git pull --rebase`);
      return false;
    }
    r = git(cwd, args, { allowFail: true });
  }
  if (r.code !== 0) {
    io.err(`O envio ao GitHub falhou:\n${r.stderr}\nO commit continua guardado localmente.`);
    return false;
  }
  return true;
}

function sync(cwd, io, { dryRun }) {
  if (!hasRemote(cwd)) return true;
  const fetch = git(cwd, ['fetch', 'origin'], { allowFail: true });
  if (fetch.code !== 0) {
    io.out(`  Aviso: não consegui consultar o GitHub (${fetch.stderr.split('\n')[0]}). Seguindo sem sincronizar.`);
    return true;
  }
  const behind = behindCount(cwd, MAIN);
  if (!behind) return true;
  if (dryRun) {
    io.out(`  Aviso: o GitHub tem ${behind} commit(s) novo(s) que você ainda não tem (--dry-run não sincroniza).`);
    return true;
  }
  io.out(`  O GitHub tem ${behind} commit(s) novo(s); sincronizando (git pull --rebase)...`);
  const pull = git(cwd, ['pull', '--rebase', '--autostash', 'origin', MAIN], { allowFail: true });
  if (pull.code !== 0) {
    git(cwd, ['rebase', '--abort'], { allowFail: true });
    io.err(`Não foi possível sincronizar com o GitHub:\n${pull.stderr}\nResolva com: git pull --rebase  (nada foi enviado)`);
    return false;
  }
  return true;
}

async function confirm(io, options, question) {
  if (options.yes) return true;
  const answer = await io.ask(question);
  if (answer === null) {
    io.err('Sem terminal interativo: use --yes para publicar sem perguntar. Nada foi enviado.');
    return false;
  }
  if (!/^\s*(s|sim|y|yes)\s*$/i.test(answer)) {
    io.out('Cancelado. Nada foi enviado.');
    return false;
  }
  return true;
}

async function undoFlow({ cwd, options, io, steps }) {
  const dirty = changes(cwd).filter((c) => c.status !== '?');
  if (dirty.length) {
    io.err(`Há alterações não publicadas (${dirty.map((c) => c.path).join(', ')}). Publique-as com "npm run cms" ou descarte-as antes de desfazer.`);
    return 1;
  }
  if (!sync(cwd, io, { dryRun: options.dryRun })) return 1;

  const log = git(cwd, ['log', '-n', '60', '--format=%H%x09%s%x09%ad', '--date=format:%d/%m/%Y %H:%M']).stdout.split('\n').filter(Boolean).map((l) => l.split('\t'));
  const alreadyReverted = (sha) => git(cwd, ['log', '-n', '1', '--format=%H', `--grep=This reverts commit ${sha}`], { allowFail: true }).stdout !== '';
  const target = log.find(([sha, subject]) => /^content:/.test(subject) && !/^content: desfaz/.test(subject) && !alreadyReverted(sha));
  if (!target) {
    io.err('Não encontrei nenhuma publicação de conteúdo para desfazer (commits que começam com "content:").');
    return 1;
  }
  const [sha, subject, date] = target;
  const files = git(cwd, ['show', '--name-only', '--format=', sha]).stdout.split('\n').filter(Boolean);
  const outside = files.filter((f) => !isContentPath(f));
  if (outside.length && !options.all) {
    io.err(`Esse commit também mexeu em arquivos que não são de conteúdo (${outside.join(', ')}). Para desfazê-lo mesmo assim use --all.`);
    return 1;
  }
  io.out(`Último envio de conteúdo: ${sha.slice(0, 7)} — ${subject} (${date})\n${files.map((f) => `  • ${f}`).join('\n')}`);
  if (options.dryRun) {
    io.out('\n✔ --dry-run: nada foi alterado.');
    return 0;
  }
  if (!(await confirm(io, options, '\nDesfazer este envio e publicar? (s/N) '))) return options.yes ? 1 : 0;

  const revert = git(cwd, ['revert', '--no-commit', sha], { allowFail: true });
  if (revert.code !== 0) {
    git(cwd, ['revert', '--abort'], { allowFail: true });
    git(cwd, ['reset', '--hard', 'HEAD'], { allowFail: true });
    io.err(`Não foi possível desfazer automaticamente (conflito com mudanças posteriores):\n${revert.stderr}`);
    return 1;
  }
  io.out('\nValidando o site sem essa alteração...');
  const result = await runSteps(steps, { cwd, log: io.out });
  if (!result.ok) {
    git(cwd, ['reset', '--hard', 'HEAD'], { allowFail: true });
    io.err(`\n✗ Falhou em: ${result.failed.name}\n${result.failed.tail}\n\nO desfazer foi cancelado e o site continua como estava.`);
    return 1;
  }
  const message = `content: desfaz «${subject.replace(/^content:\s*/, '')}»\n\nThis reverts commit ${sha}.`;
  git(cwd, ['commit', '-m', message]);
  if (hasRemote(cwd)) {
    if (!push(cwd, MAIN, io)) return 1;
    io.out('\n✔ Desfeito e enviado ao GitHub. O Netlify publica em 1–2 minutos.');
  } else io.out('\n✔ Desfeito (commit local). Sem remoto configurado, nada foi enviado.');
  return 0;
}

/**
 * @param {{ cwd?: string, argv?: string[], io?: ReturnType<typeof defaultIo>, steps?: {name: string, cmd: string}[] }} params
 * @returns {Promise<number>} código de saída
 */
export async function runCms({ cwd = process.cwd(), argv = [], io = defaultIo(), steps } = {}) {
  const { options, error } = parseArgs(argv);
  if (error) {
    io.err(error);
    return 2;
  }
  if (options.help) {
    io.out(HELP);
    return 0;
  }
  if (!isRepo(cwd)) {
    io.err('Esta pasta não é um repositório git.');
    return 1;
  }
  const branch = currentBranch(cwd);
  if (branch !== MAIN) {
    io.err(`Você está na branch "${branch}". O comando publica a partir da main: git checkout ${MAIN}`);
    return 1;
  }
  const validation = steps ?? defaultSteps({ skipE2e: options.skipE2e });
  if (options.undo) return undoFlow({ cwd, options, io, steps: validation });

  io.out('Sincronizando com o GitHub...');
  if (!sync(cwd, io, { dryRun: options.dryRun })) return 1;

  // 1) O que mudou?
  const all = changes(cwd);
  const contentChanges = all.filter((c) => isContentPath(c.path));
  const trackedOutside = all.filter((c) => !isContentPath(c.path) && c.status !== '?');
  const untrackedOutside = all.filter((c) => !isContentPath(c.path) && c.status === '?');
  if (trackedOutside.length && !options.all) {
    io.err(
      `Há alterações fora das pastas de conteúdo (src/content, src/assets, public):\n${trackedOutside.map((c) => `  • ${c.path}`).join('\n')}\n` +
        'Este comando só publica conteúdo. Commite essas mudanças à parte (git add / git commit) ou use --all para incluí-las.',
    );
    return 1;
  }
  const files = options.all ? [...contentChanges, ...trackedOutside] : contentChanges;
  if (!files.length) {
    io.out('Nada para publicar: não há alterações de conteúdo.');
    return 0;
  }

  const read = (path) => (existsSync(`${cwd}/${path}`) ? readFileSync(`${cwd}/${path}`, 'utf8') : null);
  const items = files.map((c) => summarizeChange(c.path, c.status === '?' || c.status === 'A' ? showHead(cwd, c.path) : showHead(cwd, c.path), c.status === 'D' ? null : read(c.path)));
  const paths = new Set(files.map((c) => c.path));

  // 2) Serviço apagado → redirecionamento; serviço recriado → remove o redirecionamento antigo.
  const notes = [];
  if (!options.noRedirect) {
    let text = read(REDIRECTS_FILE);
    const original = text;
    if (text !== null) {
      for (const item of items.filter((i) => i.kind === 'service')) {
        const from = `/servicos/${item.slug}`;
        if (item.verb === 'removido') {
          if (options.dryRun) notes.push(`criaria o redirecionamento ${from} → /servicos`);
          else {
            text = addRedirect(text, from);
            notes.push(`redirecionamento criado: ${from} → /servicos`);
          }
        } else if (item.verb === 'novo' && text.includes(`from: "${from}"`)) {
          if (!options.dryRun) text = removeRedirect(text, from);
          notes.push(`redirecionamento antigo de ${from} removido (o serviço voltou a existir)`);
        }
      }
      if (!options.dryRun && text !== original) {
        writeFileSync(`${cwd}/${REDIRECTS_FILE}`, text);
        if (!paths.has(REDIRECTS_FILE)) {
          paths.add(REDIRECTS_FILE);
          items.push(summarizeChange(REDIRECTS_FILE, original, text));
          files.push({ status: 'M', path: REDIRECTS_FILE });
        }
      }
    }
  }

  const message = options.message ? `content: ${options.message.replace(/^content:\s*/, '')}` : commitMessage(items);
  io.out(`\nMudanças a publicar (${items.length} ${items.length === 1 ? 'arquivo' : 'arquivos'}):`);
  for (const i of items) io.out(`  • ${i.name} — ${i.detail}`);
  for (const n of notes) io.out(`  ↪ ${n}`);
  if (untrackedOutside.length) io.out(`  (ignorando ${untrackedOutside.length} arquivo(s) novo(s) fora do conteúdo, que não fazem parte desta publicação)`);
  io.out(`\nMensagem do commit: ${message}`);

  // 3) Portão de validação
  io.out('\nValidando antes de publicar...');
  const result = await runSteps(validation, { cwd, log: io.out });
  if (!result.ok) {
    io.err(`\n✗ Falhou em: ${result.failed.name}\n${result.failed.tail}\n\nNada foi enviado. Corrija o que está acima e rode "npm run cms" de novo.`);
    return 1;
  }
  io.out('\n✔ Validação concluída.');
  if (options.dryRun) {
    io.out('✔ --dry-run: tudo certo para publicar. Nada foi alterado no git nem enviado.');
    return 0;
  }

  // 4) Confirmação, commit e envio
  const where = options.preview ? 'em uma branch de pré-visualização' : 'na main (vai ao ar)';
  if (!(await confirm(io, options, `\nPublicar ${where}? (s/N) `))) return options.yes ? 1 : 0;

  const target = options.preview ? `content/${stamp()}` : MAIN;
  if (options.preview) git(cwd, ['checkout', '-b', target]);
  git(cwd, ['add', '--', ...files.map((f) => f.path)]);
  const staged = git(cwd, ['diff', '--cached', '--name-only']).stdout;
  if (!staged) {
    io.out('Nada para commitar.');
    if (options.preview) git(cwd, ['checkout', MAIN]);
    return 0;
  }
  git(cwd, ['commit', '-m', message]);
  const sha = git(cwd, ['rev-parse', '--short', 'HEAD']).stdout;

  if (!hasRemote(cwd)) {
    io.out(`\n✔ Commit ${sha} criado localmente. Falta configurar o GitHub: git remote add origin <endereço do repositório>`);
    return 0;
  }
  if (!push(cwd, target, io, { setUpstream: options.preview })) return 1;
  const base = githubBase(remoteUrl(cwd));
  if (options.preview) {
    git(cwd, ['checkout', MAIN]);
    io.out(`\n✔ Enviado para a branch ${target} (commit ${sha}). O Netlify cria um deploy de pré-visualização.${base ? `\n  Abra para revisar e fazer o merge: ${base}/pull/new/${target}` : ''}\n  Depois do merge no GitHub, rode: git pull`);
  } else {
    io.out(`\n✔ Publicado (commit ${sha}). O Netlify publica em 1–2 minutos.${base ? `\n  Commit: ${base}/commit/${git(cwd, ['rev-parse', 'HEAD']).stdout}` : ''}\n  Para desfazer: npm run cms -- --undo`);
  }
  return 0;
}
