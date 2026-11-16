# Lançamento (cutover) e checklist pós-publicação

O site novo já está em produção em `https://sethos.com.br`. O primeiro envio do formulário registrado no Resend é de
**23/10/2026**, então o site está no ar desde essa data, no máximo. Este arquivo registra o que foi conferido em
produção e o que ainda depende de alguém com acesso às contas (Google, Cloudflare, Microsoft 365/Locaweb, Supabase).

## Como o tráfego chega
```
visitante → Cloudflare (DNS e proxy; nameservers *.ns.cloudflare.com) → Netlify (site estático + função /api/contact)
formulário → função do Netlify → Resend → e-mail para a SETHOS e confirmação para o visitante
```

## Conferido em produção (16/11/2026)
| Item | Resultado |
|---|---|
| 17 páginas indexáveis | todas respondem 200 |
| `www.sethos.com.br` e `http://` | 301 para `https://sethos.com.br/` |
| Barra final (`/quem-somos/`, `/servicos/`), `/index.html`, `/home` | 301 para o endereço canônico |
| `/cms` e `/cms/*` (painel antigo) | 410 (removido de vez) |
| Página inexistente | 404 com a página própria |
| `robots.txt` | libera tudo e aponta para `sitemap-index.xml` |
| Sitemap | `sitemap-index.xml` → `sitemap-0.xml` com as 17 páginas (sem a 404) |
| Canonical e imagem Open Graph | presentes; `/og/home.png` responde 200 |
| Cabeçalhos de segurança | CSP, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` e HSTS presentes |
| Função do formulário | no ar e configurada (sem captcha válido responde `captcha`, não erro de configuração) |
| Envio real | aviso e confirmação saem pelo Resend com status "entregue" |

URLs antigas sem equivalente: `/og-image.png` (imagem de compartilhamento antiga) passa a redirecionar para
`/og/home.png`. Um arquivo `/lovable-uploads/…png` continua dando 404, o que é aceitável: era um arquivo do
Lovable, não uma página.

## Pendências (precisam de acesso às contas)
- [ ] **Google Search Console:** a verificação do domínio já existe no DNS (`google-site-verification`). Na propriedade
      `sethos.com.br`: *Sitemaps* → enviar `https://sethos.com.br/sitemap-index.xml`; *Inspeção de URL* → pedir
      indexação da home e de `/servicos`. Depois de cerca de 1 semana, conferir em *Páginas* se as 17 foram indexadas
      e se não há erros de 404 vindos de endereços antigos (se houver, acrescentar o 301 no `netlify.toml`).
- [ ] **E-mail do formulário não chega na caixa `falecom@`:** o Resend entrega, mas a mensagem some no provedor de
      destino. O DNS do domínio tem **dois registros SPF**, **dois DMARC** (`p=none` e `p=reject`) e servidores de
      entrada do Microsoft 365 e da Locaweb ao mesmo tempo. Corrigir: um SPF só (incluindo o provedor real das caixas),
      um DMARC só e MX apenas do provedor onde as caixas ficam. Paliativo: usar um remetente diferente do destinatário
      (`CONTACT_FROM_EMAIL`, por exemplo `site@sethos.com.br`, no painel do Netlify) e fazer novo deploy.
- [ ] **PageSpeed Insights em produção:** rodar em `https://sethos.com.br` (celular) para confirmar os números do
      Lighthouse local (T12). Se o LCP da home passar de 2,0 s, investigar a imagem do mascote do topo.
- [ ] **HSTS:** a Cloudflare responde com `max-age=15552000` (6 meses) e sem `preload`, sobrepondo o valor do
      `netlify.toml` (2 anos, com `preload`). Só ajustar na Cloudflare (SSL/TLS → Edge Certificates → HSTS) se quiser
      cadastrar o domínio na lista de *preload* dos navegadores; para o site funcionar, o valor atual basta.
- [ ] **Projeto antigo (30 dias):** manter `C:\repository\site-sethos` e o Lovable como referência até **22/11/2026**.
      Depois disso, e só depois do export já feito (T0a), excluir o projeto Supabase antigo e revogar as chaves
      antigas (T0b em `tasks/todo.md`).

## Se precisar voltar atrás
O Netlify guarda todos os deploys: *Deploys* → escolher um deploy anterior → *Publish deploy* (volta em segundos,
sem mexer no DNS). Para desfazer só uma mudança de conteúdo: `npm run cms -- --undo`.
