# Preservação de conteúdo (nenhum texto pode se perder)

## Fontes de texto do site antigo
| Fonte | Onde está | Situação |
|---|---|---|
| `site_content` (135 chaves) | Supabase → `legacy-content/site_content.json` | Exportado. 44 chaves são usadas no código; **o valor do banco vence o fallback do código** (16 diferem, p.ex. "Fundada em **2017**" no banco vs. 2018 no código). |
| Chaves órfãs (91) | mesmo export | Não aparecem mais em nenhuma página (versões antigas de textos de about/contact/home/services/values). Ficam arquivadas; **não são publicadas**. Ver `docs/content-audit.md`. |
| Fallbacks só no código (22) | `docs/content-audit.md` | Textos que nunca foram editados no banco (ex.: "15+", "anos de experiência", "Excelência Técnica"). Aparecem no site hoje → migrar. |
| Páginas de serviço (9) | Tabelas `services`, `service_*` do Supabase (**fora do export**) | A página só funciona com o banco. Cobertas pelo snapshot renderizado. |
| Texto fixo em componentes | Contato, rodapé, legais, resumos da home, 404 | Cobertos pelo snapshot renderizado. |

## Garantia: snapshot + verificação automática
1. `npm run content:snapshot` — Playwright abre as 17 URLs do site publicado (FAQs expandidos, rolagem completa) e salva em `legacy-content/snapshot/`: texto visível, títulos, meta, links, `alt`/`aria-label`, JSON-LD e screenshots desktop/mobile. **Feito em 2026-10-08, antes de excluir o Supabase.**
2. `npm run build && npm run content:verify` — para cada rota, toda linha de texto do snapshot precisa existir na página nova. Linhas que realmente devem sair (ex.: "Carregando...", textos do banner de cookies de terceiros) entram em `legacy-content/approved-removals.json` com motivo, por rota ou global (`"*"`).
3. A verificação é critério de aceite das tarefas T4–T9 e roda no CI.

## Limitações conhecidas (tratadas manualmente)
- Etapas 2 e 3 do formulário de contato não aparecem sem interação → serão conferidas contra o código antigo (`src/components/contact/steps/*`).
- Mensagens de validação/sucesso do formulário e a página 404 não estão no snapshot → conferidas contra o código.
- Conteúdo do `banner_carousel` (se houver banner ativo) não aparecia no hero do snapshot; conferir a tabela se quiser preservá-lo.
