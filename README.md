# SETHOS — site institucional (Astro)

Site da SETHOS (consultoria Totvs RM RH), reconstruído fora do Lovable: mesma identidade, textos e URLs;
HTML estático, sem CMS, sem banco. **Todo texto é editável por arquivos YAML/Markdown.**

## Quero editar um texto → [`docs/EDITAR-CONTEUDO.md`](docs/EDITAR-CONTEUDO.md)
Mapa de onde está cada texto, receitas (trocar telefone, criar/remover serviço…), regras do YAML e
mensagens de erro. Tudo em `src/content/`.

## Leia nesta ordem (quem mantém o projeto)
1. [`SPEC.md`](SPEC.md) — objetivo, decisões (D1–D12), stack, princípios de UX, critérios de sucesso.
2. [`SPEC-content-editing.md`](SPEC-content-editing.md) — edição e publicação por arquivos (`npm run cms`).
3. [`tasks/plan.md`](tasks/plan.md) e [`tasks/todo.md`](tasks/todo.md) — plano e tarefas do site (T0–T13).
4. [`tasks/plan-content-editing.md`](tasks/plan-content-editing.md) e [`tasks/todo-content-editing.md`](tasks/todo-content-editing.md) — plano e tarefas da edição de conteúdo.
5. [`docs/adr/0001-conteudo-em-arquivos.md`](docs/adr/0001-conteudo-em-arquivos.md) — por que arquivos e não painel; achados da migração.
6. [`docs/design-notes.md`](docs/design-notes.md) — direção visual (passada com a skill frontend-design).
7. [`docs/content-preservation.md`](docs/content-preservation.md) e [`docs/content-audit.md`](docs/content-audit.md) — como garantimos que nenhum texto do site antigo se perdeu.

## Comandos
```
npm run dev              # servidor local com recarga (http://localhost:4321)
npm run build            # gera dist/
npm run check            # tipos (astro check)
npm run lint
npm test                 # unitários: esquemas, conteúdo, formulário, texto solto em componentes
npm run test:e2e         # Playwright: 18 páginas, acessibilidade (axe), formulário
npm run validate         # tudo acima, na ordem — o "portão" antes de publicar
npm run parity           # texto renderizado igual ao snapshot? (prova de refatoração; -- --update grava novo)
npm run content:verify   # (migração) todo texto do site antigo existe no novo? (rode após o build)
npm run content:snapshot # (migração) recaptura o site antigo, se ainda estiver no ar
```

## Pastas
```
src/content/site/       site.yaml (dados globais), ui.yaml (rótulos), emails.yaml (e-mails do formulário)  ← EDITAR
src/content/pages/      home, about, values, services-index, contact (.yaml)  ← EDITAR
src/content/services/   1 .md por serviço                                     ← EDITAR
src/content/legal/      privacidade, cookies, termos (.md)                    ← EDITAR
src/assets/brand/       logos e mascote
src/lib/                schemas.ts (réguas), content.ts (leitura/validação), contact.ts, emails.ts, text.ts, url.ts
src/pages, components, layouts   estrutura das páginas (sem texto em português: há teste)
netlify/functions/      send-contact.mts (formulário → Resend, com Turnstile); emails.generated.json é gerado (não editar)
tests/                  unitários; tests/e2e (Playwright); tests/fixtures/rendered-text (snapshot)
legacy-content/         referência do site antigo (export do Supabase, snapshot, screenshots) — não publicado
scripts/                snapshot, verificação, paridade; scripts/migration = migrações únicas (histórico)
docs/                   guia de edição, ADRs, notas de design e de preservação de conteúdo
```

## Segredos
Nunca versionar `.env`. O arquivo `.env.example` é só o **modelo** (nomes das variáveis, sem valores) e fica no git;
para rodar localmente, **copie** `.env.example` para `.env` (ignorado pelo git) e preencha. Em produção, os valores
reais ficam no painel do Netlify (Site configuration → Environment variables).
O projeto antigo teve uma chave vazada no GitHub; este repositório começou sem aquele histórico.
