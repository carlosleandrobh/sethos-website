// Leitura dos argumentos do `npm run cms`.
export const HELP = `
Publica mudanças de conteúdo: valida → resume → confirma → commit → push na main (o Netlify publica sozinho).

Uso:  npm run cms -- [opções]

Opções:
  -m, --message "texto"   mensagem do commit (padrão: automática, ex.: "content: atualiza página inicial")
  -y, --yes               não pergunta antes de publicar
      --dry-run           só valida e mostra o resumo; NÃO altera o git nem envia nada
      --preview           envia para uma branch (content/AAAAMMDD-HHMM) em vez da main, para revisar antes
      --undo              desfaz o último envio de conteúdo (git revert) e publica o desfazer
      --all               inclui também outros arquivos alterados (fora de src/content, src/assets, public)
      --no-redirect       ao apagar um serviço, NÃO criar o redirecionamento para /servicos
      --skip-e2e          pula os testes de navegador (mais rápido; não recomendado)
  -h, --help              mostra esta ajuda

Exemplos:
  npm run cms                                  valida e publica (pergunta antes)
  npm run cms -- --dry-run                     só confere, não envia
  npm run cms -- -m "atualiza prazos" --yes    publica com mensagem própria, sem perguntar
  npm run cms -- --undo                        desfaz a última publicação de conteúdo
`;

const FLAGS = {
  '-m': 'message',
  '--message': 'message',
  '-y': 'yes',
  '--yes': 'yes',
  '--dry-run': 'dryRun',
  '--preview': 'preview',
  '--undo': 'undo',
  '--all': 'all',
  '--no-redirect': 'noRedirect',
  '--skip-e2e': 'skipE2e',
  '-h': 'help',
  '--help': 'help',
};

/** @returns {{ options: Record<string, any>, error?: string }} */
export function parseArgs(argv) {
  const options = { message: undefined, yes: false, dryRun: false, preview: false, undo: false, all: false, noRedirect: false, skipE2e: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const key = FLAGS[argv[i]];
    if (!key) return { options, error: `Opção desconhecida: ${argv[i]}. Use --help para ver as opções.` };
    if (key === 'message') {
      const value = argv[++i];
      if (!value || value.startsWith('-')) return { options, error: 'A opção -m/--message precisa de um texto. Ex.: -m "atualiza prazos"' };
      options.message = value;
    } else options[key] = true;
  }
  if (options.undo && options.preview) return { options, error: '--undo e --preview não podem ser usados juntos.' };
  return { options };
}
