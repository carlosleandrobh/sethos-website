# Como editar o conteúdo do site

Todo texto do site mora em arquivos simples (**YAML** e **Markdown**) dentro de `src/content/`.
Você edita o arquivo, confere no navegador e publica. **Nenhum código precisa ser tocado.**

> **`npm run cms`** valida, mostra o que mudou, pergunta e publica sozinho (commit + envio ao GitHub, de onde o
> Netlify faz o deploy). Você não precisa usar `git` para publicar texto.

---

## Em 1 minuto

```
1. Abra o arquivo (mapa abaixo) e altere o texto entre aspas.
2. npm run dev          → abre http://localhost:4321 com o texto novo (atualiza ao salvar)
3. npm run cms -- --dry-run   → só confere tudo (formato, tamanhos, build, testes, acessibilidade); não envia nada
4. npm run cms          → confere de novo, mostra o resumo, pergunta "Publicar? (s/N)" e publica
```

Se você errar algo, o site **não compila** e a mensagem diz o arquivo, o campo e como corrigir
(veja "Mensagens de erro" no fim). Nada vai ao ar quebrado.

---

## Publicar com `npm run cms`

```
npm run cms                                  valida e publica (pergunta antes)
npm run cms -- --dry-run                     só confere; não altera o git nem envia
npm run cms -- -m "atualiza prazos" --yes    publica com mensagem própria, sem perguntar
npm run cms -- --preview                     envia para uma branch (content/AAAAMMDD-HHMM) para revisar antes
npm run cms -- --undo                        desfaz o último envio de conteúdo
npm run cms -- --help                        lista todas as opções
```

O que ele faz, nesta ordem (e **para na primeira falha, sem enviar nada**):

1. Sincroniza com o GitHub (traz novidades de outras pessoas).
2. Lista o que mudou, em português: `página inicial — 1 campo: hero.title`.
3. **Valida**: formato dos arquivos, lint, testes, build do site e testes no navegador (acessibilidade, formulário).
4. Pergunta `Publicar na main? (s/N)`.
5. Faz o commit (`content: atualiza página inicial`) e envia para a `main`. O Netlify publica em 1 a 2 minutos.

Regras de segurança:
- **Só publica conteúdo**: `src/content/`, `src/assets/` e `public/`. Se houver alteração em outros arquivos
  (código), ele para e explica; use `--all` só se tiver certeza.
- Só funciona a partir da branch `main` (para revisar antes, use `--preview`).
- Arquivos novos fora do conteúdo (ex.: anotações) são ignorados, nunca entram no commit.
- Nunca usa `--force`. Se o GitHub tiver novidades, sincroniza com `git pull --rebase`; em caso de conflito,
  para e mostra como resolver.
- **Apagou um serviço?** O comando cria sozinho o redirecionamento 301 de `/servicos/<nome>` para `/servicos`
  (arquivo `src/content/site/redirects.yaml`); use `--no-redirect` para recusar. Recriou o serviço? Remove o redirecionamento.
- **Errou?** `npm run cms -- --undo` desfaz o último envio de conteúdo (cria um commit de desfazer e publica).
  Não desfaz duas vezes o mesmo envio.
- `--preview`: o Netlify cria um endereço de pré-visualização da branch. Revise, faça o *merge* no GitHub
  (o comando mostra o link) e depois rode `git pull`.

---

## Onde está cada texto

| Quero mudar… | Arquivo | Formato |
|---|---|---|
| Telefone, e-mail, WhatsApp, CNPJ, cidade (Google), redes sociais, itens do menu, texto do rodapé, balão do WhatsApp | `src/content/site/site.yaml` | YAML |
| **Texto dos e-mails** do formulário (aviso que chega à SETHOS e confirmação enviada à pessoa) | `src/content/site/emails.yaml` | YAML |
| Botões repetidos, textos para leitores de tela, página 404, rótulos das páginas de serviço, mensagem do WhatsApp dos serviços | `src/content/site/ui.yaml` | YAML |
| **Página inicial** (topo, destaques, resumo, faixa final, título do Google) | `src/content/pages/home.yaml` | YAML |
| **Quem Somos** | `src/content/pages/about.yaml` | YAML |
| **Nossos Valores** | `src/content/pages/values.yaml` | YAML |
| Topo da página **Serviços** (lista) | `src/content/pages/services-index.yaml` | YAML |
| **Contato** (canais, informações, formulário, mensagens de erro e de sucesso) | `src/content/pages/contact.yaml` | YAML |
| **Um serviço** (título, descrição, benefícios, FAQ, botão, texto "Sobre este serviço") | `src/content/services/<nome-do-servico>.md` | Markdown + YAML no topo |
| **Política de Privacidade / Cookies / Termos de Uso** | `src/content/legal/*.md` | Markdown |
| **Imagem de compartilhamento** (prévia no WhatsApp/LinkedIn) | gerada sozinha a partir do título da página (nada a editar) | automático |
| Logo e mascote | `src/assets/brand/` (troque o arquivo mantendo o mesmo nome) | imagem PNG |
| Textos de descrição das imagens (para acessibilidade) | `src/content/site/ui.yaml` | YAML |

Cada arquivo YAML começa com um **cabeçalho explicando o que ele controla**, e cada campo tem um
comentário (`# …`) com dicas e limites. Leia-os: eles são o manual.

---

## Receitas

### Trocar um texto
Abra o arquivo da página, ache o texto, altere **só o que está entre aspas**. Salve.

### Mudou o telefone, e-mail ou WhatsApp
`src/content/site/site.yaml` — altere **uma vez**; menu, rodapé, página de contato e serviços acompanham.
Escreva o telefone **uma única vez**, como aparece no site; os links de ligar e do WhatsApp (código +55)
são gerados sozinhos. O formato é conferido (`(DDD) 99999-9999`):
```yaml
phone:
  display: "(31) 97245-7451"
```
O telefone e o e-mail também aparecem dentro das páginas legais, mas ali são marcadores `{phone}` e `{email}`
preenchidos com estes dados — **não é preciso mexer nelas**. Há um teste que falha se alguém digitar o número
à mão em outro arquivo de conteúdo.

### Adicionar ou remover uma rede social
Em `site.yaml`, na lista `social:`, copie ou apague um bloco de 3 linhas
(`label`, `icon`, `href`). Os nomes de ícones: https://icon-sets.iconify.design/simple-icons/

### Mudar o menu
Em `site.yaml`, lista `nav:`. A ordem do arquivo é a ordem na tela. O `href` começa com `/`.
(Para um item novo funcionar, a página precisa existir.)

### Editar um serviço
Abra `src/content/services/<servico>.md`. O topo (entre `---` e `---`) tem título, benefícios, FAQ e
botão; **abaixo dos `---` está o texto "Sobre este serviço"** (escreva normalmente, separando
parágrafos com uma linha em branco). O campo `order:` define a posição na lista (1 = primeiro).

### Criar um serviço novo
1. Copie um arquivo de `src/content/services/` e dê um nome **em minúsculas, sem acento, com hífen**
   (ex.: `folha-de-pagamento.md`). **O nome do arquivo vira o endereço**: `/servicos/folha-de-pagamento`.
2. Troque todos os textos e escolha um `order:` que ninguém use.
3. `icon:` é o nome de um ícone de https://lucide.dev/icons (ex.: `wrench`).
4. Salve. O serviço aparece sozinho na lista, em "anterior/próximo" e no mapa do site (sitemap).

### Remover um serviço
Apague o arquivo `.md` do serviço e rode `npm run cms`. O endereço antigo (`/servicos/<nome>`) passaria a dar
"página não encontrada"; por isso o comando **cria sozinho um redirecionamento 301 para `/servicos`**
(`src/content/site/redirects.yaml`) e avisa no resumo. Para recusar: `npm run cms -- --no-redirect`.
Se publicar sem usar o comando, acrescente à mão em `redirects.yaml`:
```yaml
redirects:
  - from: "/servicos/nome-do-servico"
    to: "/servicos"
```

### Editar uma página legal
`src/content/legal/*.md`: cada seção começa com `## `. Parágrafos separados por linha em branco.
**Negrito:** `**assim**`. Para mostrar um `_` ou `*` literal, escreva `\_` e `\*`.
Aspas e travessões **não** são trocados automaticamente (o texto fica exatamente como digitado).
`{email}` e `{phone}` dentro do texto são preenchidos com o e-mail e o telefone de `site.yaml` (não digite o número).

### Mudar o texto dos e-mails do formulário
`src/content/site/emails.yaml` tem duas partes: `company` (o aviso que chega para a SETHOS) e `visitor`
(a confirmação que a pessoa recebe). Escreva **texto puro** (HTML não funciona: aparece literalmente) e
**não mexa no que está entre `{ }`**: `{name}`, `{phone}` e `{siteEmail}` são preenchidos sozinhos.
Para acrescentar um parágrafo à confirmação, copie uma linha `- "…"` em `visitor.paragraphs`.
O texto novo vale a partir do próximo deploy (o `npm run build` regenera os e-mails sozinho).

### Trocar logo ou mascote
Substitua o arquivo em `src/assets/brand/` **mantendo o mesmo nome** (ex.: `mascot-hero.png`).
Prefira PNG com fundo transparente. O texto alternativo fica em `ui.yaml`.

---

## 5 regras de ouro do YAML

1. **Textos entre aspas duplas.** `title: "Quem Somos"`. Sem aspas, um `:` ou `#` no meio do texto
   quebra tudo, e palavras como `Sim`, `Não`, `on` e `2024` viram "verdadeiro/falso" ou número.
2. **Recuo com ESPAÇOS, nunca Tab.** Mantenha o alinhamento dos blocos exatamente como está.
3. **Listas começam com `- `** (hífen e espaço). Para acrescentar um item, copie uma linha ou um bloco.
4. **Não apague nem renomeie as chaves à esquerda** (`title:`, `href:`…). Só altere o valor.
   Ao apagar uma chave obrigatória o build avisa qual faltou.
5. **Parágrafos longos:** use `>-` e escreva o texto nas linhas seguintes, recuado
   (as quebras de linha viram espaço):
   ```yaml
   text: >-
     Primeira linha do parágrafo
     continua aqui, e é tudo um parágrafo só.
   ```

`#` no início ou depois de um espaço começa um **comentário** (ignorado pelo site).

---

## Limites (o site recusa se passar)

| Campo | Limite |
|---|---|
| Título do Google (`seo.title`) | até 70 caracteres (ideal 60) |
| Descrição do Google (`seo.description`) | de 70 a 200 caracteres (ideal 120–160) |
| Texto de botão | até 40 caracteres |
| Cada linha do título grande | até 40 caracteres, no máximo 3 linhas |
| Benefícios / itens "incluso" de um serviço | até 120 caracteres cada, de 1 a 10 itens |
| FAQ: pergunta / resposta | 160 / 700 caracteres, de 1 a 10 perguntas |
| Descrição curta de um serviço | até 200 caracteres |
| Endereços internos (`href`) | começam com `/`, só minúsculas, números e hífen |
| Endereços externos | começam com `https://` |
| Itens fixos | home: 3 destaques e 4 etiquetas; contato: 4 canais e 3 informações |

---

## Mensagens de erro (exemplos reais)

**Texto longo demais ou campo faltando** (`npm run build` ou `npm run dev`):
```
home → home data does not match collection schema.
  seo.title: título do Google: máximo de 70 caracteres (o restante é cortado)
  hero.subtitle: precisa ser um texto (coloque entre aspas)
```
→ encurte o título; o `subtitle` ficou sem aspas ou foi apagado.

**Formato do telefone:**
```
Erro no arquivo src/content/site/site.yaml:
  • phone › tel: formato: + código do país + DDD + número, sem espaços (ex.: +5531972457451)
```

**Aspas sem fechar:**
```
pages\about.yaml failed to parse: Missing closing "quote at line 19
  lead: "Desde 2017, somos especialistas
```
→ falta a aspa final na linha 19.

Dica: se não achar o erro, desfaça a última alteração do arquivo com `git checkout -- <arquivo>`.

---

## O que NÃO está nos arquivos de conteúdo

- **Cores, fontes e espaçamentos:** `src/styles/global.css` (bloco `@theme`).
- **Quem recebe e quem envia os e-mails** do formulário (endereços): variáveis do Netlify, não ficam em arquivo
  (veja `.env.example`). O **texto** dos e-mails fica em `src/content/site/emails.yaml`.
- **Estrutura das páginas** (a ordem das seções): arquivos `.astro` em `src/pages/` e `src/components/`.
  Há um teste (`tests/no-loose-text.test.ts`) que **falha se alguém escrever texto em português
  direto num componente** — assim todo texto continua editável pelos arquivos acima.

---

## Para quem mantém o código

- `npm run validate` = tipos (`astro check`) + lint + testes (esquemas, conteúdo, formulário, comando `cms`) + build + e2e (18 páginas, acessibilidade).
  É exatamente o portão que o `npm run cms` roda antes de publicar.
- **Os testes não escrevem texto do site à mão**: leem os arquivos de conteúdo (`tests/content.ts`). Por isso editar um
  texto não quebra o portão. `tests/no-copy-in-tests.test.ts` falha se alguém colar um texto do site num teste.
- `tests/edit-roundtrip.test.ts` copia o projeto, edita um texto de **cada tipo** de arquivo (página, dados globais, rótulos,
  e-mails, serviço, página legal), cria e remove um serviço, faz o build de verdade e confere o resultado.
- Implementação do comando: `scripts/cms.mjs` + `scripts/lib/cms/*` (testes em `tests/cms/`, com repositórios git temporários).
- `npm run parity` compara o texto renderizado de cada página com o snapshot de `tests/fixtures/rendered-text/`.
  Serve para provar que uma **refatoração** não mudou nenhum texto. Depois de uma edição **intencional** de texto:
  `npm run build && npm run parity -- --update` (e commite o snapshot).
- Os e-mails são montados por `src/lib/emails.ts` (funções puras, testadas). O `npm run build`/`dev`/`test` rodam
  `scripts/build-emails.mjs`, que gera `netlify/functions/emails.generated.json` (ignorado pelo git) a partir do
  `emails.yaml`; a função do Netlify importa esse JSON. **Nunca edite o JSON: edite o YAML.**
- As "réguas" (limites e formatos) estão em `src/lib/schemas.ts`; a leitura de `site.yaml`/`ui.yaml` em `src/lib/content.ts`.
- Decisões e histórico: `SPEC-content-editing.md`, `docs/adr/0001-conteudo-em-arquivos.md`.
