// O "portão" antes de publicar: roda as verificações em ordem e para na primeira que falhar.
import { spawn } from 'node:child_process';

/** Mesmas etapas de `npm run validate`, separadas para mostrar qual falhou. */
export function defaultSteps({ skipE2e = false } = {}) {
  const steps = [
    { name: 'Formato dos arquivos e tipos', cmd: 'npm run check' },
    { name: 'Lint', cmd: 'npm run lint' },
    { name: 'Testes (esquemas, conteúdo, formulário)', cmd: 'npm test' },
    { name: 'Build do site', cmd: 'npm run build' },
  ];
  if (!skipE2e) steps.push({ name: 'Testes no navegador (18 páginas, acessibilidade, formulário)', cmd: 'npm run test:e2e' });
  return steps;
}

function runCommand(cmd, cwd) {
  return new Promise((resolve) => {
    const child = spawn(cmd, { cwd, shell: true, env: { ...process.env, FORCE_COLOR: '0', CI: '1' } });
    let output = '';
    child.stdout.on('data', (d) => (output += d));
    child.stderr.on('data', (d) => (output += d));
    child.on('error', (e) => resolve({ code: 1, output: String(e) }));
    child.on('close', (code) => resolve({ code: code ?? 1, output }));
  });
}

/**
 * @param {{name: string, cmd: string}[]} steps
 * @returns {Promise<{ ok: boolean, failed?: { name: string, tail: string } }>}
 */
export async function runSteps(steps, { cwd, log }) {
  for (const [i, step] of steps.entries()) {
    log(`  [${i + 1}/${steps.length}] ${step.name}...`);
    const started = Date.now();
    const { code, output } = await runCommand(step.cmd, cwd);
    if (code !== 0) {
      const tail = output.split('\n').filter((l) => l.trim()).slice(-40).join('\n');
      return { ok: false, failed: { name: step.name, tail } };
    }
    log(`      ✓ ok (${((Date.now() - started) / 1000).toFixed(1)} s)`);
  }
  return { ok: true };
}
