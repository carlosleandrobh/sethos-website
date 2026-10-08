// Gera favicon e apple-touch-icon a partir do mascote (rodar só quando o logo mudar).
import sharp from 'sharp';
const src = 'src/assets/brand/mascot-sethos.png';
const icon = (size, bg) =>
  sharp(src).resize(size, size, { fit: 'contain', background: bg ?? { r: 0, g: 0, b: 0, alpha: 0 } });
await icon(512).png().toFile('public/icon-512.png');
await icon(192).png().toFile('public/icon-192.png');
await icon(48).png().toFile('public/favicon.png');
await icon(180, { r: 255, g: 255, b: 255, alpha: 1 }).png().toFile('public/apple-touch-icon.png');
