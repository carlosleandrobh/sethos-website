// Núcleo da verificação "nenhum texto perdido": cada linha de texto visível do site antigo
// precisa existir na página nova correspondente, ou estar em approved-removals.json.

export const normalize = (s) =>
  s
    .normalize('NFC')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const ENTITIES = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&nbsp;': ' ' };

export const htmlToText = (html) =>
  normalize(
    html
      .replace(/<(script|style|noscript)[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&(?:amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m])
      .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))),
  );

export const legacyLines = (text) => [...new Set(text.split('\n').map(normalize).filter((l) => l.length > 1))];

/** @returns {{missing: string[], total: number}} */
export function findMissing({ legacyText, newText, ignore = [], approved = [] }) {
  const hay = normalize(newText);
  const skip = new Set([...ignore, ...approved].map(normalize));
  const lines = legacyLines(legacyText).filter((l) => !skip.has(l));
  return { missing: lines.filter((l) => !hay.includes(l)), total: lines.length };
}
