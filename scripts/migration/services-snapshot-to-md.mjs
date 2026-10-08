// Migração única: snapshot do site antigo -> src/content/services/*.md
// Depois de gerado, os .md são a fonte de verdade (edite-os, não rode de novo sem necessidade).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const NL = String.fromCharCode(10);
const snap = 'legacy-content/snapshot';
const out = 'src/content/services';
mkdirSync(out, { recursive: true });

// Ordem e ícones do site antigo (ordem dos cards em /servicos; ícones de src/data/services).
const services = [
  ['sustentacao-erp', 'wrench'],
  ['outsourcing-rh', 'briefcase'],
  ['dashboards-rh', 'line-chart'],
  ['integracao-sistemas', 'git-branch'],
  ['implantacao-totvs', 'server'],
  ['customizacoes-totvs', 'code'],
  ['consultoria-rh', 'users'],
  ['treinamentos-totvs', 'book-open'],
  ['bancodados-sql', 'database'],
];
// Meta description e palavras-chave: vieram do código antigo (src/data/services/*.tsx).
const seo = {
  'bancodados-sql': ['Administração especializada SQL Server para Totvs RM. Monitoramento 24/7, backup seguro e otimização de performance.', ['DBA SQL Server', 'administração banco dados', 'performance Totvs RM']],
  'consultoria-rh': ['Consultoria especializada em RH e Totvs RM Labore. Otimize processos, reduza erros e garanta conformidade legal completa.', ['consultoria RH', 'Totvs RM Labore', 'folha de pagamento']],
  'customizacoes-totvs': ['Desenvolvimento de customizações Totvs RM sob medida. Soluções personalizadas com integração perfeita e garantia inclusa.', ['customização Totvs RM', 'desenvolvimento ERP', 'personalização sistema']],
  'dashboards-rh': ['Dashboards e relatórios para RH com dados do Totvs RM. Business Intelligence para decisões estratégicas e KPIs em tempo real.', ['dashboards RH', 'relatórios Totvs RM', 'business intelligence']],
  'implantacao-totvs': ['Implantação Totvs RM com metodologia ágil. Migração segura, treinamento completo e suporte pós go-live garantido.', ['implantação Totvs RM', 'implementação ERP', 'migração sistema']],
  'integracao-sistemas': ['Integração de sistemas com Totvs RM. Conecte APIs, sincronize dados e elimine processos manuais com soluções robustas.', ['integração sistemas', 'API Totvs RM', 'sincronização dados']],
  'outsourcing-rh': ['Outsourcing especializado em gestão técnica Totvs RM. Sua equipe foca no RH, nós cuidamos da tecnologia com SLA garantido.', ['outsourcing RH', 'terceirização folha', 'gestão técnica Totvs RM']],
  'sustentacao-erp': ['Sustentação ERP Totvs RM com suporte 24/7, monitoramento proativo e SLA garantido. Mantenha seu sistema sempre funcionando perfeitamente.', ['sustentação ERP', 'suporte Totvs RM', 'manutenção sistema']],
  'treinamentos-totvs': ['Treinamentos Totvs RM personalizados. Capacite sua equipe com certificação oficial e aumente a produtividade em 80%.', ['treinamento Totvs RM', 'capacitação ERP', 'curso Totvs']],
};

const q = (s) => JSON.stringify(s); // string YAML válida (aspas duplas)
const list = (items, indent = '  ') => items.map((i) => `${indent}- ${q(i)}`).join(NL);
const between = (lines, from, to) => lines.slice(lines.indexOf(from) + 1, to ? lines.indexOf(to) : undefined);

services.forEach(([slug, icon], index) => {
  const d = JSON.parse(readFileSync(`${snap}/servicos__${slug}.json`, 'utf8'));
  const text = d.text.slice(0, d.text.indexOf('Rodap'));
  const lines = text.split(NL).map((l) => l.trim()).filter(Boolean);

  const iAbout = lines.indexOf('Sobre este serviço');
  const title = lines[iAbout - 2];
  const shortDescription = lines[iAbout - 1];
  const about = between(lines, 'Sobre este serviço', 'Principais Benefícios');
  const benefits = between(lines, 'Principais Benefícios', 'O que está incluso');
  const features = between(lines, 'O que está incluso', 'Perguntas Frequentes');
  const afterFaq = lines.slice(lines.indexOf('Perguntas Frequentes') + 1);
  const iEnd = afterFaq.findIndex((l) => l === 'Serviço Anterior' || l === 'Próximo Serviço');
  const faqLines = afterFaq.slice(0, iEnd);
  if (faqLines.length % 2) throw new Error(`${slug}: FAQ ímpar`);
  const faq = [];
  for (let i = 0; i < faqLines.length; i += 2) faq.push({ question: faqLines[i], answer: faqLines[i + 1] });

  const iBtn = lines.indexOf('Agendar uma Conversa');
  const cta = { title: lines[iBtn - 2], subtitle: lines[iBtn - 1], button: 'Agendar uma Conversa' };
  const prefix = 'Fale conosco e receba uma proposta personalizada para ';
  const proposal = lines[lines.indexOf('Interessado neste serviço?') + 1];
  if (!proposal.startsWith(prefix)) throw new Error(`${slug}: texto de proposta inesperado`);

  const md = [
    '---',
    `title: ${q(title)}`,
    `order: ${index + 1}`,
    `icon: ${q(icon)}`,
    `shortDescription: ${q(shortDescription)}`,
    'benefits:',
    list(benefits),
    'features:',
    list(features),
    'faq:',
    ...faq.flatMap((f) => [`  - question: ${q(f.question)}`, `    answer: ${q(f.answer)}`]),
    'cta:',
    `  title: ${q(cta.title)}`,
    `  subtitle: ${q(cta.subtitle)}`,
    `  button: ${q(cta.button)}`,
    `proposalTopic: ${q(proposal.slice(prefix.length))}`,
    `metaDescription: ${q(seo[slug][0])}`,
    'keywords:',
    list(seo[slug][1]),
    '---',
    '',
    about.join(NL + NL),
    '',
  ].join(NL);
  writeFileSync(`${out}/${slug}.md`, md);
  console.log(`${slug}: ${benefits.length} benefícios, ${features.length} itens, ${faq.length} FAQs`);
});
