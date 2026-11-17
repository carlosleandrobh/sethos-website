# Tarefas: reconstrução SETHOS

Legenda: [ ] pendente · Verificação entre "Verify".

## Fase 0 — Pré-requisitos (usuário)
- [x] **T0a** Exportar `site_content` do Supabase (JSON/CSV) → `legacy-content/site_content.json`
  - Acceptance: arquivo com todas as chaves e valores atuais. Verify: contagem ≈ 66+ chaves.
- [ ] **T0b** Excluir o projeto Supabase antigo **depois** do export (T0a) e do snapshot do site (T4); revogar a chave vazada e outras chaves antigas.
- [ ] **T0c** Criar conta Resend, verificar o domínio `sethos.com.br` (SPF/DKIM no DNS), gerar API key; conta Netlify; repositório GitHub novo (privado) com 2FA.
- [x] **T0d (usar logos de lovable-uploads)** Fornecer logos originais (SVG/PNG alta) se existirem; senão usarei os de `public/lovable-uploads`.

## Fase 1 — Fundação
- [x] **T1 Scaffold Astro** (feito: Astro 7.3 + Tailwind 4.3 em vez de 5/3.4; build, check, lint, test verdes; commit inicial)
  - Acceptance: projeto em `C:\repository\sethos-website` (antes `sethos-astro`), git init, Astro 5 + Tailwind 3.4 + TS strict + Vitest + ESLint; `.env.example`, `.gitignore` com `.env`.
  - Verify: `npm run build && npm run check && npm test` verdes.
  - Files: package.json, astro.config.mjs, tailwind.config.ts, tsconfig.json, .gitignore (~5)
- [x] **T2 Tokens e layout base** (feito: tokens em `global.css`, Base/Navbar/Footer/FloatingWhatsApp, logos em `src/assets/brand`, favicon/apple-touch gerados; axe 0 violações desktop+mobile; teste de contraste). **Botões usam `#C62828` (não `#E53935`) porque branco sobre `#E53935` = 4,2:1**; `#E53935` fica em acentos, ícones, foco e texto grande. (aplicar princípios 4-A: menos gradientes/efeitos, CTA primário no menu)
  - Acceptance: `tokens.css` (brand `#E53935`, brand-dark `#C62828`, gray `#333`, light-gray `#aaa`, Inter self-hosted, raios, sombras); `Base.astro`, Navbar (menu mobile), Footer, FloatingWhatsApp, skip-link, `prefers-reduced-motion`; logos otimizados com nomes legíveis.
  - Verify: página de teste renderiza; axe sem violações; contraste de cada par texto/fundo ≥ 4.5 (ou ≥ 3 se grande) conferido por teste.
  - Files: ~8
- [x] **T3 Schemas de conteúdo (Zod)** (feito: `src/content.config.ts`, 7 coleções; `astro check` valida)
  - Acceptance: coleções `services` (title, shortDescription, fullDescription, benefits, features, cta, faq, related, keywords, metaDescription, icon), `pages`, `legal`.
  - Verify: `astro check` falha com campo faltando (teste).
  - Files: src/content/config.ts + 1 teste
- [x] **T4 Migração de conteúdo + snapshot de referência** (feito: 9 serviços, legais, home, quem-somos, valores, contato, serviços em `src/content/`; `npm run content:coverage` mostra o que falta; typo "confíavel" corrigido). `content:verify` fecha página a página em T5–T9.
  - Acceptance: 9 serviços, home, quem-somos, valores, contato, rodapé, legais em `src/content/`, com texto do banco prevalecendo sobre o fallback do código; diferenças banco×código listadas em `docs/content-diff.md`; screenshots do site atual em `legacy-content/screenshots/`.
  - Verify: `npm run content:verify` verde. **→ CP1**

## Fase 2 — Páginas (fatias verticais)
- [x] **T5 Home** (feito: hero novo + destaques + quem somos + serviços + CTA; home 53/59 no verify, o resto é aprovado como removido; falta só revisão visual do usuário) **Home** — hero (**ver decisão D3 revisada: o site antigo tem carrossel de 4 slides**), Quem Somos resumido, Serviços resumidos, Contato resumido; animações de entrada leves.
  - Verify: HTML sem JS contém h1 e textos; paridade visual 1440/390.
- [x] **T6 Quem Somos e Nossos Valores**
  - Verify: textos conferidos; e2e 200 + h1 único.
- [x] **T7 Serviços** — `/servicos` e `/servicos/[slug]` (9), breadcrumbs, FAQ accordion acessível, relacionados, CTA, JSON-LD `Service`+`FAQPage`.
  - Verify: 9 slugs idênticos aos atuais; axe limpo; e2e.
- [x] **T9 Páginas legais** (privacidade, cookies, termos) — texto idêntico.
  - Verify: e2e 200 + conferência de texto.
- [x] **T8 Contato + envio** (feito: formulário simples em tela única como no site antigo; função `netlify/functions/send-contact.mts` com Turnstile, honeypot, rate limit, escape HTML, Resend; 39 testes unitários + e2e. **Falta só configurar as chaves no Netlify/Resend/Turnstile**. **Correção pós-publicação (2026-10-24, commit `15be602`):** em produção o formulário não enviava nem mostrava mensagem porque a CSP bloqueava o script embutido no HTML (o mesmo valia para banner de cookies e menu mobile); `assetsInlineLimit: 0` no `astro.config.mjs` gera os scripts como arquivos em `/_astro/`; envio e confirmação ao visitante validados em produção; ver D14 no SPEC.md)
  - Acceptance: formulário multi-etapas (dados → projeto → preferência/horário), validação cliente+servidor, máscara de telefone, Turnstile, honeypot, rate-limit; função `send-contact` com HTML escapado, e-mail à SETHOS + confirmação ao visitante; botão WhatsApp com mensagem pré-preenchida.
  - Verify: testes unitários (validação, escape de `<script>`), e2e com função mockada; envio real em preview. **→ CP2**
  - Files: ~6 (ContactForm, steps, validation, functions/send-contact, teste, página)

## Fase 3 — Qualidade e publicação
- [x] **T10 SEO, OG e redirects** (feito: tags Open Graph/Twitter, imagem OG 1200×630 por página gerada no build (satori+resvg, Inter embutida), JSON-LD (organização, site, serviço, FAQ, trilha), sitemap com `lastmod` real do git, sufixos de título movidos para `ui.yaml`, `netlify.toml` travado por teste; 21 testes e2e de SEO; ver `docs/seo.md`. Pendente de aprovação: descrições únicas do Google para 4 páginas)
  - Acceptance: componente de `<head>` único; título/description por página; imagem OG 1200×630 por página (gerada no build); canonical; JSON-LD `Organization/LocalBusiness`; sitemap gerado com `lastmod` real; robots.txt; `_redirects`/netlify.toml com 301 de URLs antigas (inclui `/cms` → 410 ou 404, `/lovable-uploads/*` mapeados se indexados).
  - Verify: teste percorre todas as rotas validando meta/OG; lista de redirects testada.
- [x] **T11 Consentimento e tracking** (feito: aviso próprio com Aceitar/Recusar de mesmo peso, link "Configurações de Cookies" no rodapé, GPC, validade de 12 meses; Meta Pixel `2270406940042061` e Google Ads `AW-17031992209` só após o aceite; GTM/AdOpt aposentados; CSP estrita com lista fechada de terceiros; 7 testes e2e + 26 unitários; ver `docs/privacidade-rastreamento.md`. **Pendente: decisão sobre o texto da Política de Cookies (cita Google Analytics inexistente).**) — banner de cookies LGPD; GTM `GTM-TPK4FL5N` e Meta Pixel só após aceite; CSP sem `unsafe-eval`; headers de segurança.
  - Verify: e2e confirma 0 requests de terceiros antes do aceite.
- [x] **T5b Navegação e CTAs (D15)** (feito 2026-11-16: `CtaBand`, submenu de Serviços, serviços no rodapé, 404 com atalhos, CTAs no topo do serviço, evento `Contact`; `tests/e2e/navigation.spec.ts` + `tests/trackers.test.ts`)
- [x] **T5c Navegação e CTAs, 2º grupo (D16)** (feito 2026-11-16: rótulo "Saiba Mais", "Nossos Valores" só no rodapé (`footerNav`), etiquetas do hero como links, campo "Serviço de interesse" (formulário + e-mail), lateral do serviço simplificada, atalho para o formulário em `/contato`; testes unitários e e2e novos)
- [x] **T12 Testes, acessibilidade, performance** (feito 2026-11-16: Playwright + axe em todas as rotas, incluindo a 404; `npm run lhci` (Lighthouse CI mobile, 3 execuções, 5 páginas) com as metas do SPEC em `lighthouserc.json`: performance 99–100, acessibilidade 100, boas práticas 100, SEO 100, LCP 1,4–1,9 s, CLS 0, TBT < 50 ms; `npm audit --omit=dev` sem alta/crítica (resta 1 moderada no `satori`, só no build). Correções achadas pelo Lighthouse: mascote do menu com `srcset` 1x/2x/3x e títulos `h2` nos cards de `/servicos`. **Observações:** a medição é local, contra o preview; o antivírus Kaspersky da máquina injeta um script nas páginas HTTP locais, por isso `lighthouserc.json` bloqueia `*kaspersky-labs.com*` e pula a auditoria `is-on-https` (em produção o HTTPS é do Netlify); o LCP da home (1,9 s) fica perto do limite de 2,0 s)
  - Acceptance: Playwright + axe em todas as rotas; Lighthouse CI mobile ≥ 95/95/95/100; LCP < 2,0 s; CLS < 0,1; `npm audit --omit=dev` sem alta/crítica. **→ CP3**
- [x] **T13 Docs e cutover** (feito 2026-11-16: README, guia de edição (criar/remover serviço, publicar) e ADR 0001 "sem CMS" já existiam; `docs/cutover.md` registra a conferência de produção (17 páginas 200, `www`/`http`/barra final em 301, `/cms` 410, sitemap, robots, canonical, OG, cabeçalhos, função do formulário) e as pendências que dependem de contas: Search Console, DNS de e-mail, PageSpeed em produção, HSTS na Cloudflare e projeto antigo até 22/11/2026. Novo 301: `/og-image.png` → `/og/home.png`)
  - Acceptance: README (editar texto, adicionar serviço, publicar), ADR da decisão "sem CMS"; deploy preview; checklist de DNS; envio do sitemap ao Search Console; projeto antigo mantido 30 dias.
  - Verify: checklist de lançamento executado; comparação preview×produção aprovada.

## Fase 4 — Refinamento visual (plano aprovado em 2026-11-16, ver `docs/design-notes.md`)
- [x] **UI-1 Fundamentos + navbar + faixa CTA** (`.btn-on-dark`, `.section-dark`, `.accent-rule`, view transitions, cabeçalho compacto, `CtaBand` carvão)
- [x] **UI-2 Home + lista de serviços** (faixa de números "2017 · onde nossa história começa", "9 · serviços especializados" (contado da coleção), "BH · Atendimento em todo o Brasil", aprovada em 2026-11-17; o "15+" fica só no cartão do mascote; os 3 destaques saíram e estão em `approved-removals.json`; cards de serviço inteiros clicáveis com seta; grade 3×3 em `/servicos`)
- [ ] **UI-3 Página de serviço** (lateral com 3 botões, sem cartão vermelho no meio, benefícios × inclusos lado a lado)
- [ ] **UI-4 Contato + celular/flutuantes** (formulário mais alto, Turnstile com altura reservada, WhatsApp flutuante sem cobrir conteúdo)
- [ ] **UI-5 Rodapé + páginas secundárias + docs**
