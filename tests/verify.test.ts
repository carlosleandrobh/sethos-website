import { describe, expect, it } from 'vitest';
// @ts-expect-error módulo .mjs sem tipos
import { findMissing, htmlToText } from '../scripts/lib/verify.mjs';

describe('content verify', () => {
  const html = '<h1>Quem  Somos</h1><p>Fundada em 2017 &amp; crescendo</p><script>x()</script>';
  it('ignora espaços, entidades e scripts', () => {
    const r = findMissing({ legacyText: 'Quem Somos\nFundada em 2017 & crescendo', newText: htmlToText(html) });
    expect(r.missing).toEqual([]);
  });
  it('detecta texto perdido', () => {
    const r = findMissing({ legacyText: 'Quem Somos\nSuporte contínuo', newText: htmlToText(html) });
    expect(r.missing).toEqual(['Suporte contínuo']);
  });
  it('respeita remoções aprovadas', () => {
    const r = findMissing({ legacyText: 'Quem Somos\nSuporte contínuo', newText: htmlToText(html), approved: ['Suporte contínuo'] });
    expect(r.missing).toEqual([]);
  });
});
