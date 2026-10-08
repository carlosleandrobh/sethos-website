// Migração única (T-CE-2): páginas legais JSON -> Markdown editável. Mantido só como registro histórico.
import { readFileSync, writeFileSync, unlinkSync, readdirSync } from 'node:fs';

const dir = 'src/content/legal';
const NL = String.fromCharCode(10);
const BS = String.fromCharCode(92);
const q = (s) => JSON.stringify(s);

// "3.1 Dados Fornecidos: texto" -> rótulo em negrito; escapa _ e * (nomes de cookies como _ga).
const escapeMd = (s) => s.split('_').join(BS + '_').split('*').join(BS + '*');
const asMarkdown = (paragraph) => {
  const m = paragraph.match(/^(\d+(?:\.\d+)+ [^:]{1,90}:)\s+([\s\S]*)$/);
  return m ? `**${escapeMd(m[1])}** ${escapeMd(m[2])}` : escapeMd(paragraph);
};

for (const file of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const data = JSON.parse(readFileSync(`${dir}/${file}`, 'utf8'));
  const out = [
    '---',
    `title: ${q(data.title)}`,
    `description: ${q(data.description)}`,
    '---',
    '',
    '<!--',
    '  COMO EDITAR ESTA PÁGINA',
    '  - Cada seção começa com "## " (o título aparece no índice lateral automaticamente).',
    '  - Separe parágrafos com UMA LINHA EM BRANCO.',
    '  - Para negrito use **assim**. Para um sublinhado _ ou asterisco * literal, escreva \\_ e \\*.',
    '  - Para adicionar uma seção, copie um bloco "## título + parágrafos".',
    '-->',
    '',
  ];
  for (const s of data.sections) {
    out.push(`## ${s.title}`, '');
    for (const p of s.content) out.push(asMarkdown(p), '');
  }
  writeFileSync(`${dir}/${file.replace('.json', '.md')}`, out.join(NL));
  unlinkSync(`${dir}/${file}`);
  console.log(`${file} -> ${file.replace('.json', '.md')}`);
}
