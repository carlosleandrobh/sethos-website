// Publica mudanças de conteúdo (YAML/Markdown) no GitHub, de onde o Netlify faz o deploy.
// Uso: npm run cms -- --help
import { runCms } from './lib/cms/run.mjs';

try {
  process.exitCode = await runCms({ argv: process.argv.slice(2) });
} catch (error) {
  console.error(`\nErro inesperado: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}
