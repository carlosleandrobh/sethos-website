// Carrega e valida os dados globais (site.yaml e ui.yaml) de forma síncrona, para uso em qualquer componente.
import { parse } from 'yaml';
import type { ZodType } from 'astro/zod';
import siteRaw from '../content/site/site.yaml?raw';
import uiRaw from '../content/site/ui.yaml?raw';
import { siteSchema, uiSchema, type Site, type Ui } from './schemas';

/** Converte os erros do Zod em mensagens em português que apontam o arquivo e o campo. */
export function describeIssues(file: string, issues: { path: PropertyKey[]; message: string }[]): string {
  const lines = issues.map((i) => {
    const field = i.path.length ? i.path.join(' › ') : '(arquivo inteiro)';
    const missing = /received undefined|Required|expected .* received undefined/i.test(i.message);
    return `  • ${field}: ${missing ? 'campo obrigatório ausente — não apague esta linha' : i.message}`;
  });
  return `Erro no arquivo ${file}:\n${lines.join('\n')}`;
}

export function parseYaml<T>(file: string, raw: string, schema: ZodType<T>): T {
  let data: unknown;
  try {
    data = parse(raw);
  } catch (error) {
    const e = error as { message?: string; linePos?: { line: number }[] };
    const line = e.linePos?.[0]?.line;
    throw new Error(`Erro de formatação em ${file}${line ? ` (linha ${line})` : ''}: ${e.message?.split('\n')[0]}\n  Dica: confira aspas, dois-pontos e o alinhamento (use espaços, nunca Tab).`, { cause: error });
  }
  const result = schema.safeParse(data);
  if (!result.success) throw new Error(describeIssues(file, result.error.issues));
  return result.data;
}

export const site: Site = parseYaml('src/content/site/site.yaml', siteRaw, siteSchema);
export const ui: Ui = parseYaml('src/content/site/ui.yaml', uiRaw, uiSchema);

/** Preenche {variavel} em um texto do ui.yaml. */
export const fill = (template: string, vars: Record<string, string | number>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? `{${key}}`));

export const whatsappUrl = (message: string = site.whatsappMessage) =>
  `https://wa.me/${site.phone.whatsapp}?text=${encodeURIComponent(message)}`;
