# Tarefas: edição e publicação de conteúdo

- [x] **T-CE-0 Spike do YAML + teste de paridade** (feito: `scripts/parity.mjs` + `tests/fixtures/rendered-text/` (18 páginas, estrito em aspas); YAML lido pelo `glob` loader. Achou o bug do `canonical` com `.html`, já corrigido.)
  - Acceptance: coleção de teste em `.yaml` carregada pelo `glob` loader; script `scripts/render-text-snapshot.mjs` gera o texto renderizado de cada página do `dist/` e `tests/parity` o compara com `tests/fixtures/rendered-text/*.txt` (snapshot do estado atual).
  - Verify: `npm run build && npm test` — snapshot atual passa.
  - Files: scripts/render-text-snapshot.mjs, tests/parity.test.ts, tests/fixtures/rendered-text/*, (coleção de teste descartável)

- [x] **T-CE-1 Globais em YAML** (feito: `site.yaml`/`ui.yaml` + `src/lib/content.ts` + `schemas.ts`; `src/data/` removido; templates de WhatsApp/e-mail migrados; paridade idêntica)
  - Acceptance: `src/data/site.ts` e `ui.ts` viram `src/content/site/site.yaml` e `ui.yaml` (comentados) + coleção `site` validada; menu, rodapé, 404, aria-labels, alt, tooltip do WhatsApp e rótulos de serviço lidos desses arquivos; helper `src/lib/site.ts` expõe os dados tipados.
  - Verify: paridade de HTML idêntica; `astro check`; e2e.
  - Files: ~8 (site.yaml, ui.yaml, content.config.ts, lib/site.ts, Navbar, Footer, FloatingWhatsApp, 404)

- [x] **T-CE-2 Páginas em YAML e legais em Markdown** (feito: 5 páginas em `.yaml` comentado; 3 legais em `.md`; `smartypants` desligado; paridade idêntica; `content:verify` 17/17)
  - Acceptance: `home/about/values/services-index/contact` em `.yaml` comentado; `politica-*.json`/`termos` em `.md` (`##` por seção); páginas leem das novas coleções.
  - Verify: paridade de HTML idêntica; esquemas passam; e2e.
  - Files: ~10 (5 yaml, 3 md, content.config.ts, [legal].astro)

- [x] **T-CE-3 Esquemas estritos + "sem texto solto"** (feito: limites em `schemas.ts`, `tests/schemas.test.ts` (33 casos), `tests/no-loose-text.test.ts`; erros reais testados e documentados)
  - Acceptance: limites de tamanho (título SEO ≤ 70, descrição 70–170), URLs/slugs válidos, listas não vazias, mensagens de erro em português; teste que varre `src/**/*.astro` e falha se achar texto em português fora dos arquivos de conteúdo (exceções em lista documentada).
  - Verify: testes de esquema (casos válidos e inválidos); teste de varredura.
  - Files: content.config.ts, tests/schemas.test.ts, tests/no-loose-text.test.ts

- [x] **T-CE-4 Comando `npm run cms`** (feito: `scripts/cms.mjs` + `scripts/lib/cms/*`; `--dry-run`, `--preview`, `--undo`, `--all`, `--no-redirect`, `--skip-e2e`; redirecionamento automático ao apagar serviço (`redirects.yaml` → `public/_redirects`); 25 testes com repositórios git temporários; provado no projeto real com `--dry-run`)
  - Acceptance: `scripts/cms.mjs` com `--dry-run`, resumo legível, confirmação, `--yes`, `-m`, `--preview`, `--undo`, `--all`; só adiciona caminhos de conteúdo; `git pull --rebase`; sem remoto → explica e para antes do push; remoção de serviço gera redirect em `redirects.yaml` (com aviso); `npm run validate` (= check + schemas + build + test + e2e smoke).
  - Verify: testes com repositório git temporário (não envia se validação falha; recusa fora do conteúdo; undo reverte só o último commit de conteúdo; dry-run não toca no git).
  - Files: scripts/cms.mjs, scripts/lib/cms/{git,summary,validate}.mjs, tests/cms/*.test.ts, package.json

- [x] **T-CE-5 Guia, edição real e README** (feito: guia, ADR 0001, README e `tests/edit-roundtrip.test.ts` (10 casos). **Falta só o CP-CE: o usuário publicar uma edição real com `npm run cms`.**)
  - Acceptance: `docs/EDITAR-CONTEUDO.md` (mapa de arquivos, 5 regras de YAML, receitas: trocar texto, trocar imagem, criar/remover serviço, editar contato, desfazer); teste automatizado que altera um texto de cada tipo, builda e confere o HTML; README e `tasks/todo.md` atualizados.
  - Verify: `npm run validate`; **CP-CE** com o usuário.
  - Files: docs/EDITAR-CONTEUDO.md, tests/edit-roundtrip.test.ts, README.md

## Pendências levantadas durante a execução
- ~~**Corpo dos e-mails do formulário** ainda era texto em código.~~ **Resolvido (2026-10-08):** `src/content/site/emails.yaml` + `src/lib/emails.ts`; a função importa o JSON gerado no build; testes em `tests/emails.test.ts`; o teste de texto solto agora também varre `netlify/functions/*.mts`.
- **Imagens de compartilhamento (OG) por página** serão arquivos em `public/og/` referenciados no YAML (entram na T10).
- **Remoção de serviço:** hoje manual (`netlify.toml`); a T-CE-4 automatiza com `redirects.yaml`.
- `npm run parity` e `content:verify` são ferramentas de migração/refatoração; **saem do portão de publicação** quando o `npm run cms` existir (após uma edição intencional, `parity -- --update`).

## Achados da T-CE-4 (testando no projeto real)
- `.env` copiado de `.env.example` tem `PUBLIC_TURNSTILE_SITE_KEY=` **vazia** e derrubava o build → vazio agora conta como não definido (`src/lib/turnstile.ts`); em qualquer build do Netlify a chave real é obrigatória.
- Os testes e2e e de e-mail **escreviam texto do site à mão**: editar um texto reprovaria o portão → testes agora leem os arquivos de conteúdo (`tests/content.ts`) e `tests/no-copy-in-tests.test.ts` impede a regressão.
- Telefone/e-mail estavam **repetidos** em `contact.yaml` e nas 3 páginas legais → fonte única `site.yaml`; textos jurídicos usam `{email}`/`{phone}`; telefone escrito uma vez (links `tel:` e WhatsApp derivados). `tests/single-source.test.ts` impede a regressão.
