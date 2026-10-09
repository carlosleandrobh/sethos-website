# Plano: reconstrução do site SETHOS (Astro)

Fonte: `SPEC.md` (aprovado). Novo projeto em `C:\repository\sethos-website` (repo git novo; antes `sethos-astro`); o projeto antigo do Lovable ficou em `C:\repository\site-sethos`, somente referência.

## Ordem de construção
```
T0 Pré-requisitos (usuário) ─┐
T1 Scaffold ─ T2 Tokens/layout ─ T3 Schema de conteúdo ─ T4 Migração de conteúdo
                                                              │
        ┌─────────────────────────────────────────────────────┤
        T5 Home   T6 Institucionais   T7 Serviços   T9 Legais (paralelizáveis após T4)
                                          │
                                T8 Contato + função serverless
                                          │
              T10 SEO/OG/redirects ─ T11 Consentimento/tracking ─ T12 Testes+a11y+Lighthouse
                                                                          │
                                                               T13 Docs + cutover
```
Caminho crítico: T1→T2→T3→T4→T7→T10→T12→T13. T8 só depende de T2.

## Riscos e mitigação
| Risco | Mitigação |
|---|---|
| Texto do banco difere do código | T0/T4 partem do export do `site_content`; `content:verify` compara com snapshot do site publicado |
| Perda de ranking no cutover | Slugs idênticos, 301 para qualquer URL divergente, sitemap enviado ao Search Console |
| `#E53935` reprova contraste em texto pequeno | Token `brand-dark #C62828` para texto/links; só usar `#E53935` em fundos de botão com texto ≥ 18,66px bold e elementos gráficos (T2 valida com axe) |
| Domínio sem SPF/DKIM do Resend → e-mails no spam | Verificar domínio em T0c e testar entrega (Gmail/Outlook) na T8 |
| Visual divergir do original | Screenshots do site atual (1440/768/390) em T4 como referência de aprovação |
| Remoção do CMS surpreender quem edita | Runbook em T13 |

## Checkpoints (revisão humana)
- **CP1** após T4: tokens, layout e conteúdo migrado aprovados.
- **CP2** após T8: todas as páginas + formulário em preview.
- **CP3** após T12: métricas e paridade; decisão de cutover.

## Notas
- Supabase novo não é usado na v1 (D11). Repositório novo sem histórico do antigo (chave vazada).
- Redesign = acabamento mais limpo, mesma identidade (SPEC 4-A). CP1 inclui aprovar essa direção visual.
