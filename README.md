# SETHOS — site institucional (Astro)

Reconstrução do site da SETHOS (consultoria Totvs RM RH), saindo do Lovable. Mesma identidade, textos e URLs; HTML estático, sem CMS, sem banco.

## Leia nesta ordem
1. [`SPEC.md`](SPEC.md) — objetivo, decisões (D1–D12), stack, estrutura, princípios de UX, critérios de sucesso.
2. [`tasks/plan.md`](tasks/plan.md) — ordem de construção, riscos, checkpoints.
3. [`tasks/todo.md`](tasks/todo.md) — tarefas T0–T13 com critérios de aceite (veja o que já está feito).
4. [`docs/content-preservation.md`](docs/content-preservation.md) — como garantimos que nenhum texto se perde.
5. [`docs/content-audit.md`](docs/content-audit.md) — banco × código, chaves órfãs.

## Comandos
```
npm run dev              # servidor local
npm run build            # gera dist/
npm run check            # tipos (astro check)
npm run lint
npm test                 # Vitest
npm run content:verify   # após build: todo texto do site antigo existe no novo?
npm run content:snapshot # recaptura o site antigo (só enquanto ele estiver no ar)
```

## Pastas
- `legacy-content/` — referência do site antigo: `site_content.json` (export do Supabase), `snapshot/` (texto e screenshots das 17 páginas). Não é publicado.
- `scripts/` — snapshot e verificação de conteúdo.
- `src/` — site novo. `tests/` — testes unitários.

## Segredos
Nunca versionar `.env`. Variáveis em `.env.example`; valores reais ficam no painel do Netlify. O projeto antigo teve uma chave vazada no GitHub; este repositório começou sem aquele histórico.
