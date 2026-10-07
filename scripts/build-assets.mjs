import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';

const src = (n) => `arial/LANDING PAGE ZOOM-0${n}.jpg`;
const grade = (img) => img.modulate({ saturation: 0.9, brightness: 0.97 });

const crops = [
  ['clubhouse', 4, [1650, 1050, 1300, 730], 1400],
  ['townhouse', 4, [1000, 330, 1500, 850], 1400],
  ['townhouse-front', 4, [560, 980, 1250, 700], 1200],
  ['sports', 3, [2450, 1120, 1100, 620], 1100],
  ['commercial', 3, [2180, 740, 640, 360], 640],
  ['park', 2, [0, 560, 980, 550], 980],
  ['villas', 2, [2560, 1720, 1000, 530], 1000],
  ['entrance', 1, [2900, 1620, 760, 430], 760],
];

// alpha mask that fades a zoom layer into the one beneath it
function featherMask(width, height, fraction = 0.035) {
  const f = Math.round(Math.min(width, height) * fraction);
  const ramp = (d) => {
    const t = Math.min(1, d / f);
    return t * t * (3 - 2 * t);
  };
  const mask = Buffer.alloc(width * height);
  for (let y = 0; y < height; y++) {
    const ry = ramp(Math.min(y, height - 1 - y));
    for (let x = 0; x < width; x++) mask[y * width + x] = Math.round(255 * ry * ramp(Math.min(x, width - 1 - x)));
  }
  return mask;
}

async function layer(n, width, out, encode) {
  let img = grade(sharp(src(n)));
  if (width) img = img.resize(width);
  if (n === 1) return encode(img).toFile(out);
  const { data, info } = await img.removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const rgba = sharp(data, { raw: info }).joinChannel(featherMask(info.width, info.height), {
    raw: { width: info.width, height: info.height, channels: 1 },
  });
  return encode(rgba).toFile(out);
}

await mkdir('public/aerial', { recursive: true });
await mkdir('public/media', { recursive: true });

for (const n of [1, 2, 3, 4]) {
  await layer(n, 0, `public/aerial/zoom-${n}.avif`, (i) => i.avif({ quality: 50, effort: 4 }));
  await layer(n, 2000, `public/aerial/zoom-${n}-md.webp`, (i) => i.webp({ quality: 78, alphaQuality: 80, effort: 5 }));
}
await grade(sharp(src(1))).resize(48).webp({ quality: 60 }).toFile('public/aerial/zoom-1-lq.webp');
await grade(sharp(src(1))).resize(1600).webp({ quality: 78 }).toFile('public/media/masterplan.webp');

for (const [name, n, [left, top, width, height], out] of crops) {
  await grade(sharp(src(n)).extract({ left, top, width, height }))
    .resize(out)
    .webp({ quality: 82, effort: 5 })
    .toFile(`public/media/${name}.webp`);
}
console.log('assets written');
