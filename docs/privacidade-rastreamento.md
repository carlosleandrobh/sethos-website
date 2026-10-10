# Privacidade, cookies e rastreamento

## O que o site faz
- **Nada de marketing é carregado antes do "Aceitar".** Sem JavaScript, ou com "Recusar", nenhuma ferramenta de terceiros roda.
- **Aceitar** ativa duas ferramentas (IDs em `src/content/site/site.yaml → tracking`):
  | Ferramenta | ID atual | Para quê |
  |---|---|---|
  | Meta Pixel (Facebook/Instagram) | `2270406940042061` | medir anúncios; evento `PageView` e `Lead` (contato enviado) |
  | Google Ads (gtag) | `AW-17031992209` | remarketing/medição do Google Ads; evento `generate_lead` |
- A escolha fica salva **no navegador** (`localStorage`, chave `sethos-consent`) por **12 meses**; depois a pessoa é consultada de novo.
- **"Configurações de Cookies"** (rodapé de todas as páginas) reabre o aviso mostrando a escolha atual. Trocar para
  *Recusar* apaga os cookies de rastreamento (`_fbp`, `_fbc`, `_gcl_*`, `_ga*`…) e recarrega a página para parar as ferramentas.
- **Sinal GPC** (Global Privacy Control) do navegador vale como "Recusar": sem aviso e sem rastreamento.
- *Aceitar* e *Recusar* têm o mesmo peso visual (orientação da ANPD). O texto do aviso fica em `ui.yaml → consent`.

## Como mudar
| Quero… | Faça |
|---|---|
| Trocar o ID do Pixel ou do Google Ads | `site.yaml → tracking` (aceita `""` para desligar) |
| Mudar o texto do aviso | `ui.yaml → consent` (e `footer.cookieSettings` para o link do rodapé) |
| Forçar nova consulta a todos os visitantes | aumentar `CONSENT_VERSION` em `src/lib/consent.ts` |
| Adicionar outra ferramenta | `src/lib/trackers.ts` + liberar a origem na CSP do `netlify.toml` (o teste `tests/netlify-config.test.ts` lista as permitidas) |

## O que veio do site antigo (e o que mudou)
No site antigo:
- O **Meta Pixel** carregava **sempre**, sem consentimento (e ainda havia uma imagem `noscript` do Pixel).
- O **GTM `GTM-TPK4FL5N`** carregava **sempre** no `<head>` e, de dentro do contêiner, injetava o banner **AdOpt**
  (`tag.goadopt.io`, código `8b6de49b-…`) e a tag **Google Ads `AW-17031992209`**.

No site novo o GTM **deixou de ser carregado**: o contêiner só tinha essas duas coisas (mais um "ouvinte de envio de
formulário" sem nenhuma tag ligada), e carregá-lo traria de volta um segundo banner (AdOpt) e exigiria afrouxar a CSP
(`unsafe-inline`/`unsafe-eval`). As duas ferramentas passaram a ser carregadas diretamente, depois do aceite.

### Ações suas (fora do código)
1. **Meta / Google Ads:** confirme, depois do deploy, que os eventos chegam (Gerenciador de Eventos da Meta → *Testar eventos*;
   Google Ads → *Ferramentas → Tags*), aceitando o aviso em uma janela anônima.
2. **AdOpt:** se for um serviço contratado, ele deixou de ser usado; avalie encerrar a assinatura (as páginas legais do
   site novo substituem as hospedadas lá).
3. **GTM:** o contêiner pode ser arquivado. Se quiser voltar a usá-lo no futuro, remova dele a tag HTML do AdOpt antes.

## Pontos de atenção na Política de Cookies (texto jurídico — decisão sua)
O texto atual foi mantido sem alterações, mas **descreve mais do que o site faz**:
- **5.1 cita o Google Analytics** e "cookies de performance e análise", mas **não há Google Analytics** instalado
  (nem no contêiner antigo). Opções: (a) adicionar o GA4 (preciso do ID `G-…`); (b) ajustar o texto jurídico.
- **6.2 promete categorias** com controle detalhado; hoje há **uma** categoria opcional (marketing).
- O link do rodapé e o banner **já usam o nome "Configurações de Cookies"** citado na política (6.2 e 10.1).

## Para quem mantém o código
- `src/lib/consent.ts` (regras, puras e testadas), `src/lib/trackers.ts` (carregadores sem script inline),
  `src/components/ConsentBanner.astro` (interface + orquestração).
- Eventos: o formulário dispara `document` → `sethos:lead`; só há reação se as ferramentas estiverem carregadas.
- Testes: `tests/consent.test.ts` e `tests/e2e/consent.spec.ts` (nenhuma chamada real: as origens de Google/Meta são interceptadas).
