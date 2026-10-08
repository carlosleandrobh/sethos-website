# Notas de design (passada com a skill `frontend-design`, 2026-10-08)

Briefing que vence a skill: manter logo, mascote, Inter, `#E53935`, textos e estrutura; moderno e simples.

## Plano aprovado e aplicado na home
- **Cor:** branco, tinta `#333`, carvão `#1F1F23` (igual ao rodapé), `#E53935` (só grande/ícones), `#C62828` (botões/links/CTA final).
- **Tipo:** Inter só. Títulos peso 800, tracking -0,035em, escala fluida `clamp()`; corpo 400 com linhas <= ~70 caracteres. Sem caixa alta em rótulos, sem palavra colorida no título.
- **Layout:** alinhado à esquerda, grade de 12 colunas. Sem cards idênticos com sombra: destaques em 3 colunas com filetes; serviços em linhas com filete superior.
- **Movimento:** uma única entrada (hero, 0,6 s, uma vez). `prefers-reduced-motion` respeitado. Sem hover:scale.
- **Elemento memorável:** placa carvão com o mascote "estourando" o topo e o número de credencial "15+" (conteúdo real do slide antigo).

## O que saiu por parecer "padrão gerado"
Palavra do título em vermelho · pílula de rótulo acima do título · chips flutuantes em volta do mascote · cards com sombra em tudo · painel vermelho arredondado no CTA · setas em todo botão.

## Regras para as próximas páginas
Reaproveitar `ServiceCard` (linha com filete), botões `.btn-primary/.btn-outline`, títulos `h2` grandes à esquerda, CTA final em faixa cheia `bg-brand-dark`.
