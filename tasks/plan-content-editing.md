# Plano: edição e publicação de conteúdo por arquivos

Fonte: `SPEC-content-editing.md`. Executar **antes da T10 (SEO)** do plano principal.

## Ordem
```
T-CE-0 Teste do loader YAML (spike, 15 min)
   │
T-CE-1 Globais → YAML (site.yaml, ui.yaml) ─┐
T-CE-2 Páginas JSON → YAML; legais → MD ────┤  (paridade de HTML a cada passo)
T-CE-3 Esquemas com limites + teste "sem texto solto" ─┘
   │
T-CE-4 Comando `npm run cms` (+ validate, dry-run, undo, preview, redirects) 
   │
T-CE-5 Guia, testes de edição real, README   → CP-CE (você edita uma frase de verdade)
```
Caminho crítico: 0 → 1 → 2 → 3 → 4 → 5. As tarefas 1 e 2 não dependem uma da outra (mas ambas usam o teste de paridade criado na T-CE-0).

## Riscos
| Risco | Mitigação |
|---|---|
| Conversão alterar algum texto | Teste de paridade: snapshot do texto renderizado das 17 páginas **antes**, comparado **depois** de cada passo |
| Loader do Astro não ler YAML como esperado | Spike T-CE-0; fallback: manter JSON só onde necessário e usar Markdown/YAML via `file()` |
| YAML com pegadinhas (booleanos, dois-pontos) | Esquemas Zod estritos (`z.string()` rejeita `true`/número) + guia + comentários |
| Push sem remoto configurado | Comando detecta e explica; funciona local até o repositório existir |
| Comando commitar arquivo indevido | Lista de caminhos permitidos, recusa fora dela, testes com repositório git temporário |
| `content:verify` falhar após edições legítimas | Sai do portão de publicação; vira ferramenta sob demanda |

## Checkpoint
**CP-CE:** você altera uma frase em cada tipo de arquivo (página, serviço, legal, global) e roda `npm run cms -- --dry-run`; depois, com o remoto criado, publica de verdade.
