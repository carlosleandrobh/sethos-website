# Spec: Reconstrução do site SETHOS (saída do Lovable)

> Status: **APROVADO (decisões D1, D2, D5–D8 respondidas em 2026-10-08)**. D3, D4, D9, D10 seguem a recomendação padrão até você dizer o contrário. Nenhum código novo foi escrito ainda.
> Base da análise: leitura do projeto atual em `C:\repository\sethos-website` (React + Vite + shadcn + Supabase, gerado no Lovable).

---

## 1. Diagnóstico do projeto atual

### 1.1 O que o site é hoje
Site institucional de consultoria Totvs RM (foco RH/Folha/Labore), Belo Horizonte/MG.

| Rota | Conteúdo |
|---|---|
| `/` | Hero (carrossel de banners), Quem Somos resumido, Serviços resumidos, Contato resumido, Footer |
| `/quem-somos` | História, equipe, missão, visão, 5 diferenciais |
| `/nossos-valores` | Valores e princípios |
| `/servicos` | Lista dos 9 serviços |
| `/servicos/:id` | 9 páginas: `consultoria-rh`, `implantacao-totvs`, `sustentacao-erp`, `outsourcing-rh`, `customizacoes-totvs`, `integracao-sistemas`, `dashboards-rh`, `treinamentos-totvs`, `bancodados-sql` (cada uma com descrição, benefícios, recursos, FAQ, CTA, relacionados, SEO) |
| `/contato` | Formulário multi-etapas + WhatsApp |
| `/politica-de-privacidade`, `/politica-de-cookies`, `/termos-de-uso` | Páginas legais |
| `/cms` | Painel administrativo (login próprio) |
| `*` | 404 |

Extras: botão flutuante de WhatsApp, GTM (`GTM-TPK4FL5N`), Meta Pixel, banner de cookies (goadopt), sitemap/robots, JSON-LD.

**Identidade visual a preservar:** vermelho `#e02e34` (hover `#c11e24`) **→ passa a `#E53935` / `#C62828` (D5)**, cinza `#333`/`#aaa`, fundo branco, tipografia Inter (Playfair Display carregada mas aparentemente quase sem uso), logo robô + wordmark "SETHOS Tecnologia da Informação", cantos arredondados, cards com sombra suave, gradientes cinza→branco com toques de azul, animações de fade/slide ao rolar.

### 1.2 Achado crítico: onde estão os textos
Os textos têm **duas fontes**: (a) tabela `site_content` no Supabase (≈66 chaves lidas via `useContentValue('chave', 'fallback')`) editada pelo CMS; (b) *fallbacks* no código e `src/data/services/*.tsx`. **O texto publicado hoje pode ser diferente do que está no código.** A única cópia fiel do texto atual é o site em produção + o banco. → **Primeiro passo obrigatório é exportar o conteúdo do banco** (ou raspar o site publicado) antes de desligar qualquer coisa.

### 1.3 Problemas encontrados

**Segurança (urgente, independe da reconstrução)**
1. `CMS_CORRECOES_APLICADAS.md` e `CORREÇÕES_CMS_APLICADAS.md` documentam um login de administrador com **senha padrão fraca** e o e-mail do admin; o `LoginForm` chegou a exibir as credenciais na tela de login. Uma migração redefine a senha para esse valor. Se o Supabase de produção ainda existe, **trocar/desativar essa conta agora.**
2. `.env` com URL/chave do Supabase dentro do projeto (a chave é "anon", mas o arquivo não deve ser versionado/compartilhado). O projeto **não é um repositório git** nesta pasta.
3. Autenticação do CMS reinventada (tabelas próprias de usuários, sessões, reset tokens, "hybrid auth", "bridge", "migration") ao lado do Supabase Auth — superfície de ataque grande para um site de 12 páginas.
4. Edge function `send-contact-email`: `verify_jwt = false`, CORS `*`, sem rate-limit/captcha, e **interpola dados do usuário direto no HTML do e-mail** (injeção de HTML/phishing via campo "nome/mensagem").
5. CSP com `unsafe-eval` e `unsafe-inline`; script de terceiros `cdn.gpteng.co` (Lovable) carregado em todas as páginas.

**Performance e SEO**
6. SPA 100% client-side: o texto só aparece depois de JS + consulta ao Supabase. A home mostra um spinner "Carregando..." com atraso artificial de 150 ms antes de renderizar. Prejudica LCP e indexação — ruim para um site cujo objetivo é ser achado no Google ("consultoria Totvs RM BH").
7. Imagem do hero vem do Unsplash (hotlink); imagens nomeadas por UUID (`lovable-uploads/…`); fontes via `@import` CSS (bloqueante); ~15 arquivos CSS sobrepostos (`consolidated`, `gpu-optimizations`, `mobile-performance`, `whatsapp/*` com 9 arquivos só para um botão).
8. `sitemap.xml` com `lastmod` fixo de 2024; três tons de vermelho (`#e02e34`, `#c8231f`, `hsl(358 83% 47%)`) usados de forma inconsistente.

**Qualidade de código**
9. Duplicações: `Index` vs `IndexOptimized`; `NotFound` vs `Error404Page`; 3 `OptimizedImage`; `useHeroImage` vs `useHeroImageFixed`; 2 caches de conteúdo; 3 conjuntos de hooks de auth; 2 formulários de login/troca de senha; 2 pastas `seo`.
10. Código de depuração em produção (`ContentDebugger`, `ContentTester`, `ContentDebugPanel`); 543 chamadas `console.*`.
11. Código órfão: `components/ai/*` (captura de lead com IA e análise de imagem) só referenciam um ao outro; `jspdf`, `html2canvas`, `recharts`, ~25 pacotes Radix quase sem uso.
12. Testes: Jest está nas `dependencies` (não dev), não há script `test`, README fala em Vitest.
13. README é o texto padrão do Lovable.

**Conteúdo (decisão sua, não técnica)**
14. Afirmações numéricas sem comprovação visível, p.ex. "Redução de 60% no tempo de processamento da folha" — precisam de lastro ou suavização.
15. "Fundada em 2018" convive com "+15 anos de experiência" (entende-se: experiência dos fundadores) — vale deixar a frase inequívoca.

---

## 2. Avaliação: manter / melhorar / incluir / retirar

### Manter (idêntico ou quase)
- Identidade visual (cores, logo, Inter, estilo de cards e botões).
- **Todos os textos** (após export do banco) e **todas as URLs** atuais, incluindo os 9 slugs de serviço — preserva SEO.
- Estrutura das páginas e ordem das seções da home.
- Formulário de contato (etapas: dados pessoais → detalhes do projeto → preferência/horário), botão flutuante de WhatsApp, páginas legais, GTM/Meta Pixel.

### Melhorar
| Item | Hoje | Proposta |
|---|---|---|
| Renderização | SPA + busca no banco em runtime | HTML estático pré-renderizado (conteúdo no build) |
| Conteúdo | Banco + fallback no código | Arquivos versionados (Markdown/JSON) — fonte única |
| Hero | Spinner + imagem Unsplash | Renderiza de imediato; imagem própria otimizada (AVIF/WebP) ou só tipografia + ilustração do robô |
| Formulário | Edge function aberta | Função serverless com validação, honeypot/captcha (Turnstile), rate-limit, e-mail com HTML escapado |
| CSS | ~15 arquivos | Tailwind + um arquivo de tokens (cores/tipografia/raios) |
| SEO | Meta/JSON-LD espalhados, 2 pastas | Um componente de `<head>` por página; JSON-LD `LocalBusiness`/`Service`/`FAQPage`; sitemap gerado no build |
| Acessibilidade | Parcial | WCAG 2.1 AA: contraste do vermelho sobre branco, foco visível, `prefers-reduced-motion`, skip-link |
| Cookies/LGPD | goadopt + GTM carregando antes do consentimento | Scripts de marketing só após consentimento |
| Hospedagem | Configs de Netlify **e** Vercel **e** `_redirects` | Uma só (a definir) |

### Incluir (sugestões — você decide quais entram)
**Entram na v1 (D7):** redirecionamentos 301 das URLs antigas; imagem Open Graph por página (e `lastmod` real no sitemap); README/runbook de edição de conteúdo.

**Ficam para depois, sem compromisso:** prova social (logos/depoimentos/cases), FAQ agregada na home, certificações Totvs, blog.

### Retirar
- **CMS inteiro** (`/cms`, auth própria, gestão de usuários, versões de conteúdo, realtime, painel de migração, debuggers) — ver Decisão D1.
- Supabase como dependência do site público (banner_carousel, site_content, realtime, tabelas de serviços).
- `components/ai/*` (AdvancedLeadCapture, ImageAnalysisPanel) e lógica de chatbot na edge function.
- `jspdf`, `html2canvas`, `recharts`, `react-day-picker`, `input-otp`, `vaul`, `cmdk`, `react-resizable-panels` e demais Radix não usados.
- Tudo do Lovable: `lovable-tagger`, script `cdn.gpteng.co`, README padrão, nomes UUID.
- Arquivos duplicados listados em 1.3-9 e os `.md` de "correções" (com credenciais).
- Tracking de WhatsApp em banco (`services/whatsapp/database.ts`) — manter só o link `wa.me` + evento GTM.
- Carrossel de banners dinâmico: o hero fica fixo (hoje, sem banners ativos, já é um slide único). *Confirmar em D3.*

---

## 3. Premissas (corrija agora ou eu sigo com elas)

1. Site continua em **português (pt-BR)**, sem multi-idioma.
2. Domínio `sethos.com.br` permanece o mesmo; as URLs atuais são mantidas.
3. Ninguém além de você/equipe editará o texto, e edições são raras (algumas por ano) → **não precisa de painel admin**.
4. O formulário continua enviando e-mail para a SETHOS (Postmark hoje) e confirmação ao visitante.
5. Vou reconstruir **em pasta/repositório novo**, deixando o projeto atual intocado como referência.
6. Navegadores modernos apenas (sem IE11 — o fallback `nomodule` atual é descartado).
7. Você tem acesso ao Supabase do projeto (para exportar `site_content`) **ou** aceita que eu extraia o texto do site publicado.

---

## 4. Especificação do novo projeto

### Objective
Reconstruir o site institucional da SETHOS com a mesma identidade, textos e estrutura de páginas, porém rápido, indexável, seguro e editável por arquivos — sem dependência do Lovable e sem backend permanente. Usuário-alvo: gestores de RH/TI/DP de empresas que usam (ou vão implantar) Totvs RM. Sucesso = o visitante entende a oferta em segundos, encontra o serviço e envia contato; o Google indexa todas as páginas.

### Tech Stack (proposta — ver D2)
- **Astro 7** (saída estática) + **Tailwind CSS 4** (tokens via `@theme` em CSS) (tokens migrados do `tailwind.config.ts` atual) + TypeScript.
- Ilhas interativas mínimas (menu mobile, formulário multi-etapas, FAQ accordion) em **Preact/React** só onde necessário, ou JS puro.
- Conteúdo: **Astro Content Collections** (Markdown/JSON + Zod) em `src/content/`.
- Formulário: **Netlify Function** + **Resend**; **Cloudflare Turnstile**.
- Testes: **Vitest** + Playwright (smoke e2e) + Lighthouse CI.
- Hospedagem: Netlify (D4).

### 4-A. Princípios de UX/UI (D12)
"Simples" aqui significa menos decoração, não menos conteúdo: a identidade (logo, `#E53935`, Inter, textos, estrutura) é mantida; o acabamento é modernizado.
1. **Um objetivo por página** e um CTA primário visível (“Solicite um contato”) no topo, no fim e fixo no menu.
2. **Hierarquia tipográfica clara:** escala modular, corpo ≥ 16px, linhas de 60–75 caracteres, muito espaço em branco.
3. **Menos efeitos:** sai o excesso de gradientes, blobs desfocados, `hover:scale` e animações de entrada em tudo. Fica um só padrão de movimento (fade/translate curto, ≤ 200ms), respeitando `prefers-reduced-motion`.
4. **Navegação previsível:** menu com 5 itens, estado ativo, breadcrumbs nos serviços, links “próximo/relacionado”, rodapé completo; menu mobile com alvos ≥ 44px.
5. **Formulário curto:** pedir o mínimo (nome, e-mail, telefone, mensagem) e o resto como campos opcionais; progressivo, com erros inline claros, sem perder dados ao errar. Substitui o assistente de 3 etapas se os testes de uso mostrarem atrito (confirmar na T8).
6. **Mobile-first**, toque e teclado completos, foco visível, contraste AA, sem layout shift.
7. **Agilidade:** HTML estático, zero JS por padrão, fontes self-hosted com `font-display: swap`, imagens AVIF/WebP com dimensões, prefetch de links ao passar o mouse.
8. **Segurança por padrão:** sem backend persistente nem painel; CSP estrita, headers de segurança, validação e escape no servidor, Turnstile + rate-limit, segredos só em variáveis de ambiente do Netlify, `npm audit` e Dependabot, 2FA no GitHub/Netlify/Resend.

### Commands
```
Install:  npm ci
Dev:      npm run dev
Build:    npm run build
Preview:  npm run preview
Lint:     npm run lint
Types:    npm run check          # astro check
Test:     npm test               # vitest run
E2E:      npm run test:e2e       # playwright test
Perf:     npm run lhci           # lighthouse-ci contra o preview
Content:  npm run content:verify # compara textos migrados vs. snapshot do site antigo
```

### Project Structure
```
src/pages/                 → rotas (index, quem-somos, nossos-valores, servicos/[slug], contato, legais, 404)
src/layouts/               → Base.astro (head/SEO), Page.astro
src/components/            → Navbar, Footer, Hero, ServiceCard, FAQ, ContactForm, WhatsAppFab…
src/content/services/      → 1 arquivo por serviço (frontmatter + corpo)
src/content/pages/         → textos de home, quem-somos, valores, contato, rodapé
src/content/legal/         → privacidade, cookies, termos
src/styles/                → tokens.css + global.css (único)
public/                    → logos, favicon, og-images, robots.txt
functions/                 → send-contact (serverless)
tests/  e2e/               → unitários e Playwright
docs/                      → ADRs, runbook de edição de conteúdo
legacy-content/            → export do banco + snapshot HTML do site antigo (referência, não publicado)
```

### Code Style
Componentes pequenos, conteúdo fora do JSX, tokens em vez de hex soltos:
```astro
---
// src/components/ServiceCard.astro
import type { CollectionEntry } from 'astro:content';
interface Props { service: CollectionEntry<'services'> }
const { service } = Astro.props;
---
<a href={`/servicos/${service.slug}`}
   class="group block rounded-2xl bg-white p-6 shadow-md transition hover:shadow-xl focus-visible:ring-2 focus-visible:ring-sethos-red">
  <h3 class="text-xl font-semibold text-sethos-gray">{service.data.title}</h3>
  <p class="mt-2 text-sethos-gray/80">{service.data.shortDescription}</p>
</a>
```
Convenções: nomes de arquivos em PascalCase (componentes) e kebab-case (conteúdo/rotas); sem `console.*` em produção; sem cores hex fora de `tokens.css`; um único vermelho de marca (`#E53935`, escuro `#C62828` para texto pequeno).

### Testing Strategy
- **Unit (Vitest):** validação do formulário, sanitização/escape do e-mail, formatação de telefone, schemas de conteúdo.
- **Conteúdo:** `content:verify` falha se algum texto do snapshot antigo não existir no novo (ou não estiver numa lista de "alterações aprovadas").
- **E2E (Playwright):** cada rota retorna 200 e tem `<h1>` único, `<title>` e `meta description`; navegação; envio do formulário (função mockada); WhatsApp link; menu mobile.
- **Acessibilidade:** axe em todas as rotas (0 violações sérias/críticas).
- **Performance:** Lighthouse CI nas rotas `/`, `/servicos`, `/servicos/consultoria-rh`, `/contato`.

### Boundaries
- **Always:** preservar textos e slugs; rodar lint+check+test antes de concluir cada tarefa; escapar toda entrada do usuário; manter segredos fora do repositório (`.env` no `.gitignore`, `.env.example` versionado).
- **Ask first:** alterar qualquer texto de marketing ou número (ex.: "60%"); adicionar dependência; trocar provedor de e-mail/hospedagem; incluir itens da seção "Incluir"; mudar uma URL existente.
- **Never:** commitar credenciais ou `.env`; copiar o CMS/auth antigo; carregar scripts de terceiros sem consentimento (marketing) ; remover teste que falha sem aprovação; apagar o projeto antigo antes do site novo estar no ar e validado.

### Success Criteria
1. **Paridade de conteúdo:** 100% dos textos do snapshot antigo presentes (verificado por `content:verify`); 9 serviços com benefícios, recursos, FAQ, CTA e relacionados.
2. **Paridade de rotas:** todas as 16 URLs do sitemap atual respondem 200 (exceto `/cms`, que passa a 404/410 intencional).
3. **Paridade visual:** revisão lado a lado (desktop 1440, tablet 768, mobile 390) de home, serviço e contato aprovada por você.
4. **Lighthouse (mobile, 4G simulado):** Performance ≥ 95, Acessibilidade ≥ 95, Best Practices ≥ 95, SEO = 100; LCP < 2,0 s; CLS < 0,1; TBT < 200 ms.
5. **HTML renderizado sem JS** contém o `<h1>`, textos principais e links internos de cada página.
6. **Formulário:** entrega e-mail à SETHOS e confirmação ao visitante; rejeita HTML/script no corpo; limita abuso (rate-limit + Turnstile); funciona sem expor chave no cliente.
7. **Sem dependências do Lovable ou do Supabase**; `npm audit --omit=dev` sem vulnerabilidades altas/críticas.
8. **CSP** sem `unsafe-eval`; GTM/Pixel só após consentimento.
9. README descreve como editar um texto, adicionar um serviço e publicar, em < 1 página.

---

## 5. Decisões

| # | Decisão | Status |
|---|---|---|
| D1 | CMS | **Removido.** Edição via arquivos no repositório. |
| D2 | Stack | **Astro** estático + Tailwind. |
| D3 | Hero | **Revisada (2026-10-08):** o site antigo tem carrossel de 4 slides. Novo: hero único, grande e chamativo (mascote + título com destaque em `#E53935` + 2 CTAs), e as outras 3 mensagens viram 3 cards de destaque logo abaixo. Nenhum texto dos slides se perde. |
| D4 | Hospedagem / e-mail | Netlify (testado com `netlify dev`: redirects, 404, 410, headers) + **Resend** (Postmark descartado: sem conta). Domínio `sethos.com.br` precisa de SPF/DKIM do Resend. |
| D5 | Vermelho oficial | **`#E53935`**. Contraste com branco = 4,2:1: passa só para texto grande/negrito (≥ 24px, ou ≥ 18,66px bold) e componentes de UI. Para texto pequeno e links usa-se o tom escuro **`#C62828`** (≈ 5,6:1), também como hover dos botões. Detalhes na tarefa T2. |
| D6 | Dados antigos | Você exporta `site_content` (JSON/CSV) para `legacy-content/`; eu também faço um snapshot do site publicado para conferência. |
| D7 | Inclusões v1 | **Somente:** redirecionamentos 301 das URLs antigas e imagens Open Graph por página. Prova social, FAQ da home e blog ficam fora da v1. |
| D8 | Números ("60%", "15+ anos") | **Mantidos** como estão. |
| D9 | Repositório | Git novo (padrão assumido); projeto antigo preservado como referência. |
| D10 | Supabase antigo | Será **excluído** (secret key vazou no GitHub). **Exportar `site_content` ANTES de excluir.** Revogar/rotacionar também qualquer outra chave do projeto antigo (Postmark etc.). O repositório novo começa **sem histórico** do antigo. |
| D11 | Supabase novo | **Não usado na v1** (site estático, sem banco). Só entra se você quiser guardar os contatos recebidos; nesse caso, será uma tabela só de leads, escrita pela função serverless, com chave *secret* apenas no servidor. |
| D12 | Princípios de design | Moderno e simples: ver seção 4-A. |

---

## 6. Próximas fases (só após aprovação)
- **Plano** (`tasks/plan.md`): ordem de construção — tokens/layout → conteúdo migrado → páginas → formulário → SEO/consentimento → testes/Lighthouse → DNS/cutover.
- **Tarefas** (`tasks/todo.md`): fatias verticais pequenas, cada uma com critério de aceite e verificação.
- **Cutover:** subir em URL de preview, comparar com produção, trocar DNS, manter o projeto antigo por 30 dias.
