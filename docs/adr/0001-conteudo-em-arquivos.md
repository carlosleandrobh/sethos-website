# ADR 0001 — Conteúdo em arquivos YAML/Markdown, sem painel de edição

- **Status:** aceita (2026-10-08)
- **Contexto:** o site antigo guardava textos num banco (Supabase) editado por um CMS próprio, com login
  caseiro (com senha padrão fraca). Ao reconstruir, o pedido foi: manter todo conteúdo editável depois, sem painel
  web e sem login; o responsável se sente confortável editando YAML/Markdown (como no fluxo `uv run cms`
  de outro projeto: editar arquivo → comando → deploy).

## Decisão
1. **Todo texto visível** fica em `src/content/` (YAML para páginas e dados globais, Markdown para textos
   longos). Componentes não contêm texto em português (teste automático impede).
2. **Validação por esquema (Zod)** com limites e mensagens em português (`src/lib/schemas.ts`):
   o build falha, apontando arquivo e campo, antes de qualquer coisa ir ao ar.
3. **Publicação por comando** (`npm run cms`, tarefa T-CE-4): valida → resume → confirma → commit → push na
   `main` → Netlify publica. Sem painel, sem login, sem banco.
4. **Rede de segurança contra perda de texto** durante refatorações: `npm run parity` (snapshot do texto
   renderizado das 18 páginas, estrito até em aspas).

## Alternativas descartadas
| Alternativa | Por que não |
|---|---|
| Painel web (Decap/Tina) | Usuário não quer; adiciona login, OAuth e superfície de ataque. Os mesmos arquivos continuariam servindo se um dia mudar de ideia. |
| Manter o CMS com Supabase | Origem da chave vazada; auth caseira; banco para manter por ~66 textos. |
| `uv run cms` (Python) | Dois runtimes no projeto só para o comando; a validação reutiliza os esquemas Zod do site. |
| JSON | Sem comentários e com aspas obrigatórias em tudo; ruim para quem edita à mão. |

## Consequências
- (+) Superfície de ataque mínima; histórico e "desfazer" pelo git; custo zero.
- (+) Editar = abrir um arquivo comentado; erros são pegos antes de publicar.
- (−) Sem pré-visualização no navegador do próprio painel (usa-se `npm run dev`); sem edição pelo celular;
  imagens são trocadas como arquivos.
- (−) YAML tem pegadinhas (aspas, dois-pontos, indentação): mitigadas por esquemas estritos, comentários
  nos arquivos e `docs/EDITAR-CONTEUDO.md`.

## Achados durante a migração (registro)
- **`canonical` errado em todas as páginas** (`/x.html` em vez de `/x`): o `build.format: 'file'` expõe
  `.html` em `Astro.url`. Corrigido em `src/lib/url.ts` (+ teste). Teria gerado conteúdo duplicado no Google.
- **Markdown trocava aspas retas por curvas** (`'SETHOS'` → ‘SETHOS’) nas páginas legais por causa do
  processador padrão do Astro 7. Desligado com `satteri({ features: { smartPunctuation: false } })`;
  a paridade agora diferencia aspas retas e curvas.
- **Autolink do Markdown** transforma e-mails e URLs das páginas legais em links (texto idêntico; ganho de usabilidade).
- **Typo "confíavel"** corrigido para "confiável" (aprovado pelo usuário).
