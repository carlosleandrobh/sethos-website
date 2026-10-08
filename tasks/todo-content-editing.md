# Tarefas: edição e publicação de conteúdo

- [ ] **T-CE-0 Spike do YAML + teste de paridade**
  - Acceptance: coleção de teste em `.yaml` carregada pelo `glob` loader; script `scripts/render-text-snapshot.mjs` gera o texto renderizado de cada página do `dist/` e `tests/parity` o compara com `tests/fixtures/rendered-text/*.txt` (snapshot do estado atual).
  - Verify: `npm run build && npm test` — snapshot atual passa.
  - Files: scripts/render-text-snapshot.mjs, tests/parity.test.ts, tests/fixtures/rendered-text/*, (coleção de teste descartável)

- [ ] **T-CE-1 Globais em YAML**
  - Acceptance: `src/data/site.ts` e `ui.ts` viram `src/content/site/site.yaml` e `ui.yaml` (comentados) + coleção `site` validada; menu, rodapé, 404, aria-labels, alt, tooltip do WhatsApp e rótulos de serviço lidos desses arquivos; helper `src/lib/site.ts` expõe os dados tipados.
  - Verify: paridade de HTML idêntica; `astro check`; e2e.
  - Files: ~8 (site.yaml, ui.yaml, content.config.ts, lib/site.ts, Navbar, Footer, FloatingWhatsApp, 404)

- [ ] **T-CE-2 Páginas em YAML e legais em Markdown**
  - Acceptance: `home/about/values/services-index/contact` em `.yaml` comentado; `politica-*.json`/`termos` em `.md` (`##` por seção); páginas leem das novas coleções.
  - Verify: paridade de HTML idêntica; esquemas passam; e2e.
  - Files: ~10 (5 yaml, 3 md, content.config.ts, [legal].astro)

- [ ] **T-CE-3 Esquemas estritos + "sem texto solto"**
  - Acceptance: limites de tamanho (título SEO ≤ 70, descrição 70–170), URLs/slugs válidos, listas não vazias, mensagens de erro em português; teste que varre `src/**/*.astro` e falha se achar texto em português fora dos arquivos de conteúdo (exceções em lista documentada).
  - Verify: testes de esquema (casos válidos e inválidos); teste de varredura.
  - Files: content.config.ts, tests/schemas.test.ts, tests/no-loose-text.test.ts

- [ ] **T-CE-4 Comando `npm run cms`**
  - Acceptance: `scripts/cms.mjs` com `--dry-run`, resumo legível, confirmação, `--yes`, `-m`, `--preview`, `--undo`, `--all`; só adiciona caminhos de conteúdo; `git pull --rebase`; sem remoto → explica e para antes do push; remoção de serviço gera redirect em `redirects.yaml` (com aviso); `npm run validate` (= check + schemas + build + test + e2e smoke).
  - Verify: testes com repositório git temporário (não envia se validação falha; recusa fora do conteúdo; undo reverte só o último commit de conteúdo; dry-run não toca no git).
  - Files: scripts/cms.mjs, scripts/lib/cms/{git,summary,validate}.mjs, tests/cms/*.test.ts, package.json

- [ ] **T-CE-5 Guia, edição real e README**
  - Acceptance: `docs/EDITAR-CONTEUDO.md` (mapa de arquivos, 5 regras de YAML, receitas: trocar texto, trocar imagem, criar/remover serviço, editar contato, desfazer); teste automatizado que altera um texto de cada tipo, builda e confere o HTML; README e `tasks/todo.md` atualizados.
  - Verify: `npm run validate`; **CP-CE** com o usuário.
  - Files: docs/EDITAR-CONTEUDO.md, tests/edit-roundtrip.test.ts, README.md
