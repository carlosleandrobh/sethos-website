// Núcleo da verificação "nenhum texto perdido": cada linha de texto visível do site antigo
// precisa existir na página nova correspondente, ou estar em approved-removals.json.

export const normalize = (s, { keepQuotes = false } = {}) =>
  (keepQuotes ? s : s.replace(/[‘’]/g, "'").replace(/[“”]/g, '"'))
    .normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

// Textos em atributos (alt, aria-label, title, placeholder) também são conteúdo.
const attributeTexts = (html) =>
  [...html.matchAll(/\s(?:alt|aria-label|title|placeholder)="([^"]+)"/g)].map((m) => m[1]).join(' ');

export const htmlToText = (html, options) =>
  normalize(
    (html.replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ') + ' ' + attributeTexts(html))
      .replace(/<[^>]+>/g, ' ')
      .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m])
      .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
      // Tags inline (links no meio da frase) deixam um espaço antes de pontuação: não é diferença visível.
      .replace(/ +([.,;:!?)])/g, '$1')
      .replace(/\( +/g, '('),
    options,
  );

export const legacyLines = (text) => [...new Set(text.split('\n').map(normalize).filter((l) => l.length > 1))];

/**
 * @param {{ legacyText: string, newText: string, ignore?: string[], approved?: string[] }} input
 * @returns {{ missing: string[], total: number }}
 */
export function findMissing({ legacyText, newText, ignore = [], approved = [] }) {
  const hay = normalize(newText);
  const skip = new Set([...ignore, ...approved].map(normalize));
  const lines = legacyLines(legacyText).filter((l) => !skip.has(l));
  return { missing: lines.filter((l) => !hay.includes(l)), total: lines.length };
}
