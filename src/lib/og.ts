// Imagem de compartilhamento (Open Graph, 1200×630) gerada no build a partir do título da página.
// Usa satori (HTML/CSS → SVG) + resvg (SVG → PNG) com a fonte Inter embutida: o resultado é igual em qualquer máquina.
import { Resvg } from '@resvg/resvg-js';
import { readFileSync } from 'node:fs';
import satori from 'satori';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const font = (weight: 400 | 700) => ({
  name: 'Inter',
  weight,
  style: 'normal' as const,
  data: readFileSync(`node_modules/@fontsource/inter/files/inter-latin-${weight}-normal.woff`),
});

let mascot: string | undefined;
const mascotDataUri = () => (mascot ??= `data:image/png;base64,${readFileSync('src/assets/brand/mascot-hero.png').toString('base64')}`);

type Node = { type: string; props: Record<string, unknown> };
const h = (type: string, props: Record<string, unknown>, ...children: (Node | string)[]): Node => ({
  type,
  props: children.length === 0 ? props : { ...props, children: children.length === 1 ? children[0] : children },
});

/** Tamanho da letra conforme o tamanho do título, para nunca estourar o cartão. */
const titleSize = (title: string) => (title.length > 70 ? 54 : title.length > 40 ? 64 : 76);

export async function renderOgImage({ title, brand, tagline }: { title: string; brand: string; tagline: string }): Promise<Buffer> {
  const tree = h(
    'div',
    { style: { display: 'flex', width: OG_WIDTH, height: OG_HEIGHT, background: '#ffffff', fontFamily: 'Inter' } },
    h('div', { style: { width: 28, height: OG_HEIGHT, background: '#E53935' } }),
    h(
      'div',
      { style: { display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1, padding: '64px 56px 56px 64px' } },
      h('div', { style: { display: 'flex', fontSize: 32, fontWeight: 700, color: '#C62828', letterSpacing: -0.5 } }, brand),
      h('div', { style: { display: 'flex', fontSize: titleSize(title), fontWeight: 700, color: '#333333', lineHeight: 1.08, letterSpacing: -2, maxWidth: 700 } }, title),
      h('div', { style: { display: 'flex', fontSize: 28, fontWeight: 400, color: '#555555' } }, tagline),
    ),
    h(
      'div',
      { style: { display: 'flex', alignItems: 'flex-end', justifyContent: 'center', width: 400, background: '#1F1F23' } },
      h('img', { src: mascotDataUri(), width: 330, height: 401, style: { marginBottom: 0 } }),
    ),
  );
  const svg = await satori(tree as never, { width: OG_WIDTH, height: OG_HEIGHT, fonts: [font(400), font(700)] });
  return new Resvg(svg, { fitTo: { mode: 'width', value: OG_WIDTH } }).render().asPng();
}
