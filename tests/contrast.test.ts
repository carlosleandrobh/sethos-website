import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');
const color = (name: string): string => {
  const match = css.match(new RegExp(`--color-${name}:[ ]*(#[0-9a-fA-F]{6})`));
  if (!match) throw new Error(`token --color-${name} não encontrado`);
  return match[1];
};

const lum = (hex: string) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: string, b: string) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const WHITE = '#ffffff';
const hex = (v: string) => (v.startsWith('#') ? v : color(v));

describe('contraste WCAG AA', () => {
  it('cor oficial da marca é #E53935', () => expect(color('brand').toLowerCase()).toBe('#e53935'));

  it.each([
    ['ink', WHITE, 4.5],
    ['ink-soft', WHITE, 4.5],
    ['muted', WHITE, 4.5],
    ['brand-dark', WHITE, 4.5],
    ['brand-darker', WHITE, 4.5],
    ['brand-dark', 'brand-tint', 4.5],
    ['footer-text', 'footer', 4.5],
    [WHITE, 'brand-dark', 4.5], // texto de botão
    [WHITE, 'footer', 4.5],
    ['brand', WHITE, 3], // #E53935: só texto grande (>=24px ou >=18,66px bold) e elementos gráficos
    [WHITE, 'whatsapp', 3], // ícone
  ])('%s sobre %s >= %s:1', (fg, bg, min) => {
    expect(ratio(hex(fg as string), hex(bg as string))).toBeGreaterThanOrEqual(min as number);
  });

  it('documenta que #E53935 NÃO serve para texto pequeno sobre branco', () => {
    expect(ratio(color('brand'), WHITE)).toBeLessThan(4.5);
  });
});
