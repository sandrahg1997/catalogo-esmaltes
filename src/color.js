// Utilidades de color: sRGB <-> Lab, distancia CIEDE2000, calibración con tarjeta de referencia.

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

export const s2l = (c) => {
  c /= 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};
export const l2s = (l) => {
  l = clamp(l);
  const c = l <= 0.0031308 ? l * 12.92 : 1.055 * l ** (1 / 2.4) - 0.055;
  return Math.round(clamp(c) * 255);
};

export const rgbToHex = ([r, g, b]) =>
  '#' + [r, g, b].map((v) => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('').toUpperCase();

export const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};

export function rgbToLab(rgb) {
  const [r, g, b] = rgb.map(s2l);
  const x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047;
  const y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b;
  const z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
  const [fx, fy, fz] = [f(x), f(y), f(z)];
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export const hexToLab = (hex) => rgbToLab(hexToRgb(hex));

// CIEDE2000
export function deltaE(lab1, lab2) {
  const [L1, a1, b1] = lab1;
  const [L2, a2, b2] = lab2;
  const rad = Math.PI / 180;
  const C1 = Math.hypot(a1, b1);
  const C2 = Math.hypot(a2, b2);
  const Cm = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1;
  const a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1);
  const C2p = Math.hypot(a2p, b2);
  const hp = (b, a) => {
    if (b === 0 && a === 0) return 0;
    const h = Math.atan2(b, a) / rad;
    return h < 0 ? h + 360 : h;
  };
  const h1p = hp(b1, a1p);
  const h2p = hp(b2, a2p);
  const dLp = L2 - L1;
  const dCp = C2p - C1p;
  let dhp = 0;
  if (C1p * C2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(C1p * C2p) * Math.sin((dhp * rad) / 2);
  const Lpm = (L1 + L2) / 2;
  const Cpm = (C1p + C2p) / 2;
  let hpm = h1p + h2p;
  if (C1p * C2p !== 0) {
    if (Math.abs(h1p - h2p) > 180) hpm += h1p + h2p < 360 ? 360 : -360;
    hpm /= 2;
  }
  const T =
    1 - 0.17 * Math.cos((hpm - 30) * rad) + 0.24 * Math.cos(2 * hpm * rad) +
    0.32 * Math.cos((3 * hpm + 6) * rad) - 0.2 * Math.cos((4 * hpm - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hpm - 275) / 25) ** 2));
  const Rc = 2 * Math.sqrt(Cpm ** 7 / (Cpm ** 7 + 25 ** 7));
  const Sl = 1 + (0.015 * (Lpm - 50) ** 2) / Math.sqrt(20 + (Lpm - 50) ** 2);
  const Sc = 1 + 0.045 * Cpm;
  const Sh = 1 + 0.015 * Cpm * T;
  const Rt = -Math.sin(2 * dTheta * rad) * Rc;
  return Math.sqrt(
    (dLp / Sl) ** 2 + (dCp / Sc) ** 2 + (dHp / Sh) ** 2 + Rt * (dCp / Sc) * (dHp / Sh)
  );
}

export function lchOf(lab) {
  const [L, a, b] = lab;
  const C = Math.hypot(a, b);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { L, C, h };
}

export const FAMILIES = [
  { name: 'Rojo', hex: '#B3202F' },
  { name: 'Rosa', hex: '#E58FB0' },
  { name: 'Coral', hex: '#F0735F' },
  { name: 'Naranja', hex: '#E98A2E' },
  { name: 'Amarillo', hex: '#D9B22B' },
  { name: 'Verde', hex: '#4E8F5B' },
  { name: 'Azul', hex: '#2F5BA8' },
  { name: 'Morado', hex: '#7B4FA3' },
  { name: 'Marrón', hex: '#7A4B33' },
  { name: 'Nude', hex: '#D9B1A3' },
  { name: 'Gris', hex: '#8E8F8C' },
  { name: 'Negro', hex: '#17151A' },
  { name: 'Blanco', hex: '#F4F1EC' }
];

export function familyOf(lab) {
  const { L, C, h } = lchOf(lab);
  if (L < 18 && C < 22) return 'Negro';
  if (L > 90 && C < 12) return 'Blanco';
  if (C < 9) return 'Gris';
  if (L > 62 && C >= 8 && C < 32 && h >= 20 && h < 80) return 'Nude';
  if (h < 20 || h >= 340) return L >= 68 ? 'Rosa' : 'Rojo';
  if (h < 45) {
    if (L < 48 && C < 40) return 'Marrón';
    return L >= 58 ? 'Coral' : L < 48 ? 'Rojo' : 'Naranja';
  }
  if (h < 75) return L < 52 ? 'Marrón' : h < 62 ? 'Naranja' : 'Amarillo';
  if (h < 98) return 'Amarillo';
  if (h < 190) return 'Verde';
  if (h < 270) return 'Azul';
  if (h < 320) return 'Morado';
  return L >= 60 ? 'Rosa' : 'Morado';
}

// Clave para ordenar "como un arcoíris": cromáticos por tono; grises y negros al final por luminosidad.
export function rainbowKey(lab) {
  const { L, C, h } = lchOf(lab);
  if (C < 9) return 1000 + (100 - L);
  return (h + 20) % 360;
}

export const sortByNearest = (target, items) =>
  items
    .map((it) => ({ it, de: deltaE(target, it.lab) }))
    .sort((a, b) => a.de - b.de);

// --- Imagen y calibración ---

export function medianColor(ctx, cx, cy, radius) {
  const r = Math.max(2, Math.round(radius));
  const x = Math.max(0, Math.round(cx - r));
  const y = Math.max(0, Math.round(cy - r));
  const size = r * 2;
  const w = Math.min(size, ctx.canvas.width - x);
  const h = Math.min(size, ctx.canvas.height - y);
  const d = ctx.getImageData(x, y, w, h).data;
  const ch = [[], [], []];
  for (let i = 0; i < d.length; i += 4) {
    ch[0].push(d[i]);
    ch[1].push(d[i + 1]);
    ch[2].push(d[i + 2]);
  }
  return ch.map((a) => {
    a.sort((p, q) => p - q);
    return a[Math.floor(a.length / 2)];
  });
}

// Tarjeta gris 18% → luminancia lineal 0.18. Papel blanco liso → ~0.85 (menos preciso).
export const REFERENCES = {
  gris: { label: 'Tarjeta gris 18 %', target: 0.18 },
  blanco: { label: 'Papel blanco', target: 0.85 }
};

// Ganancia por canal: deja la referencia neutra y con la exposición esperada.
export function gainsFromReference(refRgb, target) {
  return refRgb.map((v) => target / Math.max(s2l(v), 0.002));
}

export function applyGains(rgb, gains) {
  return rgb.map((v, i) => l2s(s2l(v) * gains[i]));
}

export function applyGainsToCanvas(canvas, gains) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const lut = gains.map((g) => Uint8ClampedArray.from({ length: 256 }, (_, v) => l2s(s2l(v) * g)));
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    d[i] = lut[0][d[i]];
    d[i + 1] = lut[1][d[i + 1]];
    d[i + 2] = lut[2][d[i + 2]];
  }
  ctx.putImageData(img, 0, 0);
}

export async function loadImage(file, maxSide = 1600) {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const k = Math.min(1, maxSide / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * k);
  canvas.height = Math.round(bmp.height * k);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
  bmp.close?.();
  return canvas;
}

export function canvasToBlob(canvas, maxSide = 800, quality = 0.9) {
  const k = Math.min(1, maxSide / Math.max(canvas.width, canvas.height));
  const out = document.createElement('canvas');
  out.width = Math.round(canvas.width * k);
  out.height = Math.round(canvas.height * k);
  out.getContext('2d').drawImage(canvas, 0, 0, out.width, out.height);
  return new Promise((res) => out.toBlob(res, 'image/jpeg', quality));
}
