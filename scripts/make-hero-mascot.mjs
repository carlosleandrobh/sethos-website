// Recorta o robô (sem o wordmark) do arte "mascot-wordmark-stacked" em resolução maior que mascot.png.
import sharp from 'sharp';

const top = await sharp('src/assets/brand/mascot-wordmark-stacked.png').extract({ left: 0, top: 0, width: 908, height: 690 }).png().toBuffer();
const info = await sharp(top).trim({ threshold: 5 }).png().toFile('src/assets/brand/mascot-hero.png');
console.log(info.width, info.height);
