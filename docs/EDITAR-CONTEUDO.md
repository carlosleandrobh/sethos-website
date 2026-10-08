# Como editar o conteúdo do site

Todo texto do site mora em arquivos simples (**YAML** e **Markdown**) dentro de `src/content/`.
Você edita o arquivo, confere no navegador e publica. **Nenhum código precisa ser tocado.**

> Estado atual: edição, pré-visualização e validação funcionam hoje. O comando que publica sozinho
> (`npm run cms`) é a próxima tarefa (T-CE-4); enquanto isso, publique com `git add`, `git commit` e `git push`.

---

## Em 1 minuto

```
1. Abra o arquivo (mapa abaixo) e altere o texto entre aspas.
2. npm run dev          → abre http://localhost:4321 com o texto novo (atualiza ao salvar)
3. npm run validate     → confere tudo: formato, tamanhos, build, testes e acessibilidade
4. Publicar             → (hoje) git add . && git commit -m "content: ..." && git push
                          (em breve) npm run cms
```

Se você errar algo, o site **não compila** e a mensagem diz o arquivo, o campo e como corrigir
(veja "Mensagens de erro" no fim). Nada vai ao ar quebrado.

---

## Onde está cada texto

| Quero mudar… | Arquivo | Formato |
|---|---|---|
| Telefone, e-mail, WhatsApp, CNPJ, redes sociais, itens do menu, texto do rodapé, balão do WhatsApp | `src/content/site/site.yaml` | YAML |
| Botões repetidos, textos para leitores de tela, página 404, rótulos das páginas de serviço, mensagem do WhatsApp dos serviços | `src/content/site/ui.yaml` | YAML |
| **Página inicial** (topo, destaques, resumo, faixa final, título do Google) | `src/content/pages/home.yaml` | YAML |
| **Quem Somos** | `src/content/pages/about.yaml` | YAML |
| **Nossos Valores** | `src/content/pages/values.yaml` | YAML |
| Topo da página **Serviços** (lista) | `src/content/pages/services-index.yaml` | YAML |
| **Contato** (canais, informações, formulário, mensagens de erro e de sucesso) | `src/content/pages/contact.yaml` | YAML |
| **Um serviço** (título, descrição, benefícios, FAQ, botão, texto "Sobre este serviço") | `src/content/services/<nome-do-servico>.md` | Markdown + YAML no topo |
| **Política de Privacidade / Cookies / Termos de Uso** | `src/content/legal/*.md` | Markdown |
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
Atenção ao formato do telefone (o teste avisa se errar):
```yaml
phone:
  display: "(31) 97245-7451"   # como aparece escrito
  tel: "+5531972457451"        # + país + DDD + número, sem espaços
  whatsapp: "5531972457451"    # só números
```

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
Apague o arquivo `.md` do serviço. **Cuidado:** o endereço antigo passa a dar "página não encontrada".
Para mandar quem chegar nele para a lista de serviços, acrescente em `netlify.toml`:
```toml
[[redirects]]
  from = "/servicos/nome-do-servico"
  to = "/servicos"
  status = 301
```
(Na T-CE-4 o comando `npm run cms` fará isso por você.)

### Editar uma página legal
`src/content/legal/*.md`: cada seção começa com `## `. Parágrafos separados por linha em branco.
**Negrito:** `**assim**`. Para mostrar um `_` ou `*` literal, escreva `\_` e `\*`.
Aspas e travessões **não** são trocados automaticamente (o texto fica exatamente como digitado).

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
- **Corpo dos e-mails** enviados pelo formulário (aviso à SETHOS e confirmação ao visitante):
  `netlify/functions/send-contact.mts`. *Pendente: decidir se também vão para YAML.*
- **Estrutura das páginas** (a ordem das seções): arquivos `.astro` em `src/pages/` e `src/components/`.
  Há um teste (`tests/no-loose-text.test.ts`) que **falha se alguém escrever texto em português
  direto num componente** — assim todo texto continua editável pelos arquivos acima.

---

## Para quem mantém o código

- `npm run validate` = tipos (`astro check`) + lint + testes (esquemas, conteúdo, formulário) + build + e2e (17 páginas, acessibilidade).
- `npm run parity` compara o texto renderizado de cada página com o snapshot de `tests/fixtures/rendered-text/`.
  Serve para provar que uma **refatoração** não mudou nenhum texto. Depois de uma edição **intencional** de texto:
  `npm run build && npm run parity -- --update` (e commite o snapshot).
- As "réguas" (limites e formatos) estão em `src/lib/schemas.ts`; a leitura de `site.yaml`/`ui.yaml` em `src/lib/content.ts`.
- Decisões e histórico: `SPEC-content-editing.md`, `docs/adr/0001-conteudo-em-arquivos.md`.
