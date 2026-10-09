/** Preenche {variavel} em um texto dos arquivos de conteúdo (ex.: "Olá, {name}!"). Variável desconhecida fica como está. */
export const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));
