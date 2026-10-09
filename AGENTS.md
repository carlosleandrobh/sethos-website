## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## Contexto do projeto SETHOS
- Fonte de verdade: `SPEC.md`, `tasks/plan.md`, `tasks/todo.md`. Atualize-os quando decisões mudarem.
- Não alterar textos nem slugs sem aprovação; `npm run content:verify` deve passar.
- Cores: `#E53935` (marca, só texto grande/botões) e `#C62828` (texto pequeno/hover). E-mail via Resend; hospedagem Netlify; sem Supabase na v1.
- O projeto antigo (Lovable) está em `C:\repository\site-sethos`, somente referência.
- Todo texto do site mora em `src/content/` (YAML/Markdown); componentes não podem ter texto em português (`tests/no-loose-text.test.ts`). Guia: `docs/EDITAR-CONTEUDO.md`.
