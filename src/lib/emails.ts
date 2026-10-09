// Monta os e-mails do formulário a partir dos textos de src/content/site/emails.yaml.
// Funções puras (sem leitura de arquivo): rodam na função do Netlify e nos testes.
import { escapeHtml, singleLine, type ContactInput } from './contact';
import type { EmailsConfig } from './schemas';
import { fill } from './text';

export interface SiteInfo {
  /** Telefone como aparece escrito no site, ex.: (31) 97245-7451. */
  phone: string;
  email: string;
}
export interface Email {
  subject: string;
  html: string;
  text: string;
}

const FONT = 'font-family:Arial,sans-serif';
// O texto vem de um arquivo editável: SEMPRE é escapado (nunca interpretado como HTML).
const p = (value: string, extra = '') => `<p style="${FONT};font-size:15px;${extra}">${escapeHtml(value)}</p>`;

/** Aviso que chega para a SETHOS. */
export function companyEmail(t: EmailsConfig, c: ContactInput): Email {
  const l = t.company.labels;
  const none = t.company.notInformed;
  const fields: [string, string][] = [
    [l.name, c.name],
    [l.email, c.email],
    [l.phone, c.phone || none],
    [l.preference, t.preferenceLabels[c.preference]],
    [l.bestTime, c.bestTime ? t.bestTimeLabels[c.bestTime] : none],
  ];
  const rows = fields
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 12px 6px 0;color:#555;vertical-align:top"><strong>${escapeHtml(label)}</strong></td><td style="padding:6px 0">${escapeHtml(value)}</td></tr>`,
    )
    .join('');
  const html =
    `<h2 style="${FONT}">${escapeHtml(t.company.heading)}</h2>` +
    `<table style="${FONT};font-size:15px">${rows}</table>` +
    `<h3 style="${FONT}">${escapeHtml(t.company.messageHeading)}</h3>` +
    p(c.message, 'white-space:pre-wrap');
  const text = [t.company.heading, '', ...fields.map(([label, value]) => `${label}: ${value}`), '', `${t.company.messageHeading}:`, c.message].join('\n');
  return { subject: singleLine(fill(t.company.subject, { name: singleLine(c.name) })).slice(0, 200), html, text };
}

/** Confirmação enviada a quem preencheu o formulário. */
export function visitorEmail(t: EmailsConfig, c: ContactInput, site: SiteInfo): Email {
  const vars = { name: singleLine(c.name), email: c.email, phone: site.phone, siteEmail: site.email };
  const greeting = fill(t.visitor.greeting, vars);
  const paragraphs = t.visitor.paragraphs.map((x) => fill(x, vars));
  const signature = t.visitor.signature.map((x) => fill(x, vars));
  const html =
    `<div style="${FONT};font-size:15px">${p(greeting)}${paragraphs.map((x) => p(x)).join('')}` +
    `<p style="${FONT};font-size:15px">${signature.map(escapeHtml).join('<br>')}</p></div>`;
  const text = [greeting, '', ...paragraphs, '', ...signature].join('\n');
  return { subject: singleLine(fill(t.visitor.subject, vars)).slice(0, 200), html, text };
}
