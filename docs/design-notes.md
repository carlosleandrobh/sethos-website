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

## Revisão 2026-11-16: "carvão + vermelho pontual"
Avaliação completa e plano em 5 PRs aprovados pelo usuário (faixa CTA carvão, lateral do serviço com 3 botões, faixa de credenciais na home).
- **Superfícies:** branco, `surface` e carvão `#1F1F23` (`.section-dark`). Vermelho cheio deixa de ser superfície; fica em botões, links, filete (`.accent-rule`) e acentos grandes.
- **Botão sobre carvão:** `.btn-on-dark` usa `#E53935` com texto ≥ 19 px bold (contraste de texto grande, coberto em `tests/contrast.test.ts`).
- **Raios:** só `rounded-control` (10 px) e `rounded-card` (16 px).
- **Navegação:** logotipo sem o subtítulo ilegível, links em `ink`, item ativo com filete vermelho de 2 px, cabeçalho compacto ao rolar.
- **Movimento:** transição nativa entre páginas (`@view-transition`), só sem `prefers-reduced-motion`.

### Como ficou (PRs #4–#8)
- **Home:** faixa de números (2017 · total de serviços · BH) no lugar dos 3 destaques; "15+" só no cartão do mascote, em `#E53935`.
- **Cards de serviço** (`ServiceCard`): card inteiro clicável (link estático com `::after` sobre o card), seta no canto, foco do teclado contorna o card (`has-[a:focus-visible]`). O mesmo padrão vale para os canais de `/contato` e para anterior/próximo.
- **Página de serviço:** lateral só com ações (WhatsApp já com o nome do serviço, formulário de contato); cartão "Agendar" em carvão.
- **Contato:** formulário logo após o topo; canais depois.
- **WhatsApp flutuante:** some (com `inert`) enquanto o rodapé está visível.
- **Rodapé:** "Links rápidos" e "Serviços" recolhíveis no celular (abertos sem JS e no desktop).
- **Títulos de seção:** `.accent-rule` (filete curto `#E53935`) acima do `h2`; `PageHero` com filete antes do rótulo.
- **Cuidado:** dentro de `.section-dark` e do rodapé, todo título precisa de cor explícita (`text-white`), senão herda `ink` do `@layer base`; links usam branco com sublinhado `brand`, nunca `brand-dark` (contraste).
