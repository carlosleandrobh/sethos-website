// Garante que o JSON dos e-mails exista antes dos testes (mesmo quando rodam via `npx vitest`).
import { execFileSync } from 'node:child_process';

export default function setup() {
  execFileSync(process.execPath, ['scripts/build-emails.mjs'], { stdio: 'inherit' });
}
