# SEO e compartilhamento

Tudo abaixo é gerado **a partir dos arquivos de conteúdo**: editou o texto, o SEO acompanha no próximo build.

## O que existe em cada página

| Item | De onde vem | Observação |
|---|---|---|
| `<title>` | `seo.title` da página (YAML); serviços: título do serviço + sufixo; legais: título + sufixo | Sufixos em `ui.yaml` (`service.titleSuffix`, `legal.titleSuffix`) |
| `<meta name="description">` | `seo.description` (YAML); serviços: `metaDescription` | 70–200 caracteres (ideal 120–160) |
| `canonical` | endereço da página, sem `.html` e sem barra final | automático |
| **Open Graph / Twitter** (`og:*`, `twitter:*`) | título e descrição acima + imagem da página | prévia ao compartilhar no WhatsApp, LinkedIn, Facebook, X |
| **Imagem de compartilhamento** 1200×630 | gerada no build em `/og/<página>.png` com o título da página, o mascote e a marca | muda sozinha quando o título muda |
| **Dados estruturados** (JSON-LD) | `site.yaml` + conteúdo da página | home: organização e site; serviços: serviço + perguntas frequentes; todas: trilha de navegação |
| **sitemap** `/sitemap-index.xml` | todas as páginas indexáveis (sem a 404) | `lastmod` = data do último commit que mexeu no conteúdo da página |
| `robots.txt` | `public/robots.txt` | libera tudo e aponta para o sitemap |
| Redirecionamentos | `netlify.toml` + `src/content/site/redirects.yaml` | `/cms` → 410; `/index.html` e `/home` → `/`; serviço apagado → `/servicos` |

## Dados estruturados da organização (`site.yaml`)
O Google lê estes campos para o "cartão" da empresa: nome, razão social, CNPJ, telefone, e-mail, redes sociais e a
cidade (`address.locality` e `address.region`). **Não** é o endereço completo, de propósito.

## Como conferir depois de publicar
1. **Prévia de compartilhamento:** cole o endereço de uma página no WhatsApp ou em https://www.opengraph.xyz/ .
2. **Dados estruturados:** https://search.google.com/test/rich-results (cole o endereço da home e de um serviço).
3. **Sitemap:** no Google Search Console → Sitemaps → enviar `https://sethos.com.br/sitemap-index.xml`.
4. **Indexação:** Search Console → Inspeção de URL → "Solicitar indexação" para a home e para `/servicos`.

## Texto que vale revisar (decisão de conteúdo, não técnica)
Hoje **quatro páginas compartilham a mesma descrição** do Google (Quem Somos, Nossos Valores, Serviços e Contato —
é a mesma do site antigo e da home). Descrições diferentes por página rendem melhor nos resultados de busca.
Sugestões (aguardam sua aprovação; para aplicar, troque `seo.description` no YAML de cada página):

| Página (arquivo) | Descrição sugerida |
|---|---|
| Quem Somos (`about.yaml`) | Conheça a SETHOS: consultoria Totvs RM focada em Folha de Pagamento e Gestão de Pessoas, fundada em 2017 por especialistas com mais de 15 anos de ERP. |
| Nossos Valores (`values.yaml`) | Parceria, integridade, transparência e foco em resultados: os valores que guiam a SETHOS no atendimento a empresas que usam Totvs RM. |
| Serviços (`services-index.yaml`) | Sustentação, outsourcing técnico, dashboards, integrações, implantação, customizações, consultoria, treinamentos e banco de dados para Totvs RM RH. |
| Contato (`contact.yaml`) | Fale com a SETHOS por e-mail, WhatsApp ou telefone e receba uma proposta personalizada de consultoria Totvs RM RH. Atendimento em todo o Brasil. |

## Para quem mantém o código
- Cabeçalho único em `src/layouts/Base.astro` (props `title`, `description`, `noindex`, `jsonLd`).
- Construtores de JSON-LD puros em `src/lib/jsonld.ts`; ligação com os dados do site em `src/lib/seo.ts`.
- Imagem OG: `src/pages/og/[slug].png.ts` + `src/lib/og.ts` (satori + resvg, fonte Inter embutida; sem dependência de fontes do sistema).
- `lastmod`: `scripts/lib/lastmod.mjs`. Em clone raso do git (sem histórico) a data é **omitida** em vez de inventada.
- Testes: `tests/e2e/seo.spec.ts` (todas as rotas), `tests/seo.test.ts`, `tests/netlify-config.test.ts`.
