# Spec: Edição e publicação de conteúdo por arquivos (`npm run cms`)

> Status: **implementada.** T-CE-0 a T-CE-5 concluídas (conteúdo em YAML/Markdown, esquemas, comando `npm run cms`, teste de ida-e-volta). Falta só o checkpoint CP-CE: o usuário publicar uma edição real.
> Origem: pedido de 2026-10-08 — "cada conteúdo do site deve poder ser atualizado depois". Referência de uso: fluxo `uv run cms` de outro projeto (editar YAML → comando → deploy, sem commit manual). Sem painel web e sem login (reforça a decisão D1 do `SPEC.md`).

## Avaliação do fluxo "editar arquivo → comando → deploy"

**Pontos fortes (por que serve aqui)**
- **Superfície de ataque zero:** sem painel, sem login, sem banco, sem senha para vazar. É o oposto do CMS antigo (que tinha uma senha padrão fraca de administrador).
- **Histórico e desfazer de graça:** cada publicação vira um commit; reverter é `git revert`.
- **Rápido e gratuito:** o Netlify já publica a cada push; não há serviço novo para pagar ou manter.
- **Combina com "simples":** o conteúdo vira texto puro que você já domina.

**Riscos e como o comando os neutraliza**
| Risco | Mitigação no comando |
|---|---|
| Um erro de digitação quebra o site no ar | **Portão de validação antes do push**: esquemas Zod (campo faltando/tipo errado), `astro check`, build completo, testes unitários e smoke e2e. Se algo falhar, **nada é enviado**. |
| YAML trai (`:`, `#`, aspas, `Sim`/`Não` virando booleano, indentação) | Textos longos em **Markdown** ou blocos `|`; esquema rejeita tipo errado; comentários no YAML explicam cada campo; guia com 5 regras de ouro. |
| "Sem commit" esconder o que foi publicado | O comando **mostra o resumo das mudanças e pede confirmação**, e cria o commit sozinho com mensagem descritiva (`content: atualiza home, serviço consultoria-rh`). |
| Commitar lixo por engano | Só adiciona os caminhos de conteúdo (`src/content/**`, `src/assets/**`, `public/**`); recusa se houver outras alterações pendentes (a menos que `--all`). Nunca usa `git add -A`. |
| Conflitos / push rejeitado | `git pull --rebase` antes; aborta com instrução clara se houver conflito. |
| Sem pré-visualização | `npm run dev` abre o site local com o texto novo; `npm run cms -- --preview` publica numa **branch** para ver o *deploy preview* do Netlify antes de ir ao ar. |
| Verificação contra o site antigo falhar depois de edições legítimas | `content:verify`/`coverage` são **ferramentas de migração**; saem do portão de publicação após o lançamento (ver Boundaries). |

**Onde é mais fraco que um painel:** pessoas sem perfil técnico, edição pelo celular e upload visual de imagens. Como você disse que prefere arquivos, é aceitável; se isso mudar, um painel Git-based (Decap) lê os mesmos arquivos, sem retrabalho.

**Python (`uv`) × Node:** o site é Node/Astro. Recomendo o comando **`npm run cms`** em Node: um runtime só, os mesmos esquemas Zod do site e nada novo para instalar. (Se quiser o nome idêntico ao de lá, dá para criar um atalho `uv run cms` que chama o Node, mas adiciona Python ao projeto só por isso — não recomendo.)

## Assumptions (corrija agora ou sigo com elas)
1. Você publica **da sua máquina Windows**, com o git já autenticado no GitHub (HTTPS/credential manager ou SSH).
2. Existirá um **repositório GitHub** (privado) ligado ao Netlify com deploy automático da `main`. *Hoje não há remoto configurado.*
3. Publicar direto na `main` é aceitável **desde que o portão de validação passe e você confirme**; `--preview` existe para quem quiser revisar antes.
4. Edição é feita por **uma ou poucas pessoas** (sem edição simultânea frequente).
5. O Astro lê **YAML** em coleções (documentado para o `glob` loader). *Confirmo com um teste na primeira tarefa.*
6. A conversão dos arquivos atuais para YAML/Markdown **não pode mudar nenhum texto renderizado**.

## Objective
Todo texto, rótulo, dado de contato, SEO e imagem do site fica em **arquivos YAML/Markdown legíveis e comentados**, e um único comando valida e publica as mudanças. Usuário: você (e quem você autorizar no GitHub). Sucesso = trocar uma frase no arquivo, rodar `npm run cms` e ver no ar em minutos, sem tocar em código, sem quebrar o site.

### Mapa: onde cada conteúdo mora (alvo)
| Conteúdo | Arquivo | Formato |
|---|---|---|
| Menu, dados de contato, redes sociais, mensagem de WhatsApp, rodapé, CNPJ | `src/content/site/site.yaml` | YAML |
| Texto dos e-mails do formulário (aviso à SETHOS e confirmação ao visitante) | `src/content/site/emails.yaml` | YAML (gera `netlify/functions/emails.generated.json` no build) |
| Rótulos fixos (botões, "Saiba mais", `aria-label`, 404, textos de serviço) | `src/content/site/ui.yaml` | YAML |
| Home, Quem Somos, Valores, Serviços (índice), Contato (incl. formulário e SEO de cada página) | `src/content/pages/*.yaml` | YAML |
| 9 serviços (benefícios, FAQ, CTA, SEO) + texto "Sobre este serviço" | `src/content/services/*.md` | Markdown + frontmatter YAML |
| Privacidade, Cookies, Termos | `src/content/legal/*.md` | Markdown (`##` por seção) |
| Logos, mascote, imagens de compartilhamento | `src/assets/brand/`, `public/og/` | arquivos + caminho no YAML |
| **Novo serviço** | copiar um `.md` de `services/` | aparece sozinho no menu, lista e sitemap |
| **Remover serviço** | apagar o `.md` | o sitemap e os links se ajustam; redirect 301 opcional |

## Tech Stack
Astro 7 (Content Layer, `glob` loader com YAML/Markdown) · Zod (`astro/zod`) · Node 22 · `simple-git` **ou** `git` via `child_process` (decidir na T-CE-3; preferir o `git` do sistema, sem dependência nova) · `yaml` (somente para o linter do comando, se o loader não bastar). Nenhum serviço novo.

## Commands
```
Editar localmente:   npm run dev                       # pré-visualiza em http://localhost:4321
Validar (sem enviar): npm run cms -- --dry-run
Publicar:             npm run cms                       # valida → resume → confirma → commit → push
Publicar com texto:   npm run cms -- -m "atualiza prazos da implantação"
Pré-visualizar no Netlify (branch): npm run cms -- --preview
Pular a pergunta:     npm run cms -- --yes
Incluir outros arquivos alterados: npm run cms -- --all
Portão de validação (usado pelo cms e pelo CI): npm run validate   # check + schemas + build + test + e2e smoke
```

## Fluxo do `npm run cms`
```
1. git: está na main? sem conflito? `git pull --rebase`
2. Lista só mudanças de conteúdo (resumo legível: "home.yaml: 2 textos; services/consultoria-rh.md: 1 FAQ")
3. Se houver mudanças fora das pastas de conteúdo → para e explica (use --all)
4. npm run validate (esquemas Zod, astro check, build, testes) → falhou? mostra o arquivo e a linha e NÃO envia
5. Pergunta "Publicar? (s/N)" (pulável com --yes)
6. git add <só conteúdo> → commit "content: …" → push
7. Mostra o link do deploy do Netlify e como desfazer (`npm run cms -- --undo` = git revert do último commit de conteúdo)
```

## Project Structure
```
src/content/site/       → site.yaml, ui.yaml (dados globais e rótulos)
src/content/pages/      → home.yaml, about.yaml, values.yaml, services-index.yaml, contact.yaml
src/content/services/   → 1 .md por serviço
src/content/legal/      → 3 .md
src/content.config.ts   → coleções + esquemas Zod (a "régua" que valida tudo)
scripts/cms.mjs         → o comando (validação, resumo, commit, push, --undo)
scripts/lib/cms/*.mjs   → git, resumo de diff, formatação das mensagens
docs/EDITAR-CONTEUDO.md → guia em português: mapa acima + 5 regras de YAML + exemplos
tests/cms/*.test.ts     → testes do comando (repo git temporário)
```

## Code Style
Arquivo de conteúdo **comentado para quem edita**, com o limite de cada campo:
```yaml
# src/content/pages/home.yaml  — textos da página inicial
seo:
  title: "Consultoria Totvs RM RH | SETHOS Tecnologia da Informação"   # aparece na aba e no Google (até ~60 caracteres)
  description: >-                                                       # resumo no Google (120–160 caracteres)
    Consultoria Especializada Totvs RM RH em Belo Horizonte/MG e todo Brasil.
hero:
  title: "Soluções inteligentes para potencializar seu ERP Totvs RM RH"
  # Dica: textos com dois-pontos (:) ou # precisam estar entre aspas.
```
Convenções: aspas duplas em todo texto; `>-` para parágrafos longos; Markdown para texto corrido; chaves em inglês (`title`), valores em português; nada de lógica nos arquivos.

## Testing Strategy
- **Unitário (Vitest):** esquemas (campo faltando/tipo errado/limite de caracteres); formatação do resumo de diff; geração da mensagem de commit.
- **Comando (Vitest + repositório git temporário):** não envia quando a validação falha; recusa arquivos fora do conteúdo; confirma antes; faz rebase; `--dry-run` não toca no git; `--undo` reverte só o último commit de conteúdo.
- **Paridade da conversão:** teste que compara o **texto renderizado de cada página antes e depois** de migrar os arquivos atuais para YAML/Markdown (deve ser idêntico).
- **E2E smoke:** as 17 rotas continuam 200, h1 único, axe sem violações (já existe).
- **Edição de verdade:** teste que altera um texto no YAML, builda e confere que o HTML mudou — para cada tipo de arquivo (página, serviço, legal, global).

## Boundaries
- **Always:** validar antes de enviar; mostrar o resumo e pedir confirmação; adicionar só caminhos de conteúdo; mensagens de erro em português apontando arquivo/linha; manter `docs/EDITAR-CONTEUDO.md` atualizado.
- **Ask first:** publicar direto na `main` por padrão; adicionar dependência (ex.: `simple-git`); mudar regras de redirect ao remover serviço; qualquer mudança no esquema que torne campos obrigatórios.
- **Never:** `git push --force`; `git add -A`; enviar quando a validação falha; guardar token/senha em arquivo; commitar `.env`; apagar histórico.
- **Pós-lançamento:** `content:verify` e `content:coverage` saem do portão (eram para a migração); passam a rodar só sob demanda.

## Success Criteria
1. Trocar uma frase em **cada tipo de arquivo** (página, serviço, legal, global) e rodar `npm run cms` publica a mudança, sem edição de código, em ≤ 3 minutos até o deploy ficar verde.
2. **Nenhum texto visível** do site fica preso em componente: um teste varre os `.astro` e falha se encontrar texto em português fora dos arquivos de conteúdo (exceções documentadas).
3. Erro proposital (campo apagado, YAML malformado, link quebrado) **bloqueia o envio** e mostra arquivo, linha e correção sugerida.
4. A conversão para YAML/Markdown mantém o HTML renderizado das 17 páginas **idêntico** ao atual (teste de paridade).
5. Adicionar um serviço = copiar um `.md`; ele aparece na lista, no menu de serviços, no "anterior/próximo", no sitemap e no JSON-LD sem mexer em código.
6. `npm run cms -- --undo` desfaz o último envio e o site volta ao estado anterior.
7. `docs/EDITAR-CONTEUDO.md` permite a alguém novo editar e publicar sem ajuda (testado por você com uma edição real).

## Plano resumido (detalhar após aprovação)
- **T-CE-1** Migrar `site.ts` e `ui.ts` para `site.yaml`/`ui.yaml` + coleção `site`; remover textos fixos dos `.astro` (menu, rodapé, 404, `aria-label`, alt). *Verifica: paridade de HTML.*
- **T-CE-2** Converter páginas JSON → YAML comentado e legais JSON → Markdown. *Verifica: paridade + esquemas.*
- **T-CE-3** Esquemas com limites e mensagens claras (`min/max`, URLs, slugs); teste "sem texto solto em componente".
- **T-CE-4** `scripts/cms.mjs` (`--dry-run`, resumo, confirmação, commit, push, `--preview`, `--undo`) + `npm run validate`.
- **T-CE-5** `docs/EDITAR-CONTEUDO.md`, teste de edição real em cada tipo de arquivo, README.
- **Pré-requisito (você):** criar o repositório no GitHub, conectar ao Netlify e configurar o remoto (`git remote add origin …`).
- **Ordem no projeto:** executar **antes** da T10 (SEO), porque a T10 também lê dos mesmos arquivos de conteúdo.

## Decisões (2026-10-08)
1. **Repositório GitHub:** será criado pelo usuário, que passará o endereço. Até lá o comando funciona em modo local (`--dry-run`, validação e commit local); o push fica bloqueado com mensagem clara se não houver remoto.
2. **Publicação padrão:** **direto na `main`**, com portão de validação e confirmação. `--preview` (branch) continua opcional.
3. **Imagens:** **sim**, entram no mesmo comando (arquivo na pasta + caminho no YAML).
4. **Remover serviço:** ao apagar um `.md` de serviço, o comando oferece criar um **redirect 301 de `/servicos/<slug>` para `/servicos`** (a lista de serviços). *Padrão adotado: sim; o usuário pode recusar a qualquer momento.* O redirect entra em `src/content/site/redirects.yaml` e é gerado no `netlify.toml` no build.
5. **Comando:** `npm run cms` (Node). Sem `uv`.

## Open Questions
- Endereço do repositório GitHub (pendente do usuário; não bloqueia as tarefas T-CE-1 a T-CE-3).
- Confirmar o padrão do item 4 (redirect automático ao remover serviço).
