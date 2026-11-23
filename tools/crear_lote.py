#!/usr/bin/env python3
"""Genera un archivo de importación para la app (Ajustes → Restaurar desde una copia)
a partir de fotos de esmaltes con una referencia blanca (folio) en la misma foto.

Uso:  python3 tools/crear_lote.py especificacion.json salida.json

especificacion.json:
{
  "target": 0.85,                      # luminancia lineal esperada de la referencia (folio blanco; tarjeta gris 18 %: 0.18)
  "items": [
    {
      "brand": "essence", "name": "Frozen Mint", "number": "76",
      "finish": "Crema",               # Crema, Jelly, Mate, Shimmer, Glitter, Holográfico, Cromado, Duocromo, Termocrómico
      "coats": 2, "notes": "",
      "family": "Verde",               # opcional; si falta se calcula
      "samples": [                     # una o más fotos de este esmalte
        {"photo": "/ruta/foto.jpg",
         "ref":   [[x, y], [x, y], [x, y]],   # 1-3 puntos del folio/fondo blanco, cerca del esmalte
         "polish": [x, y],                      # punto sobre el esmalte (zona plana, sin reflejos ni texto)
         "crop": [x0, y0, x1, y1]}              # recorte del swatch para la ficha (solo el de la primera muestra se guarda)
      ]
    }
  ]
}
El color final es la media de las muestras, ya calibradas.
"""
import base64, io, json, math, statistics as st, sys, time, uuid
from PIL import Image

def s2l(c):
    c /= 255
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def l2s(l):
    l = min(1, max(0, l))
    c = l * 12.92 if l <= 0.0031308 else 1.055 * l ** (1 / 2.4) - 0.055
    return round(c * 255)

def lab(rgb):
    r, g, b = [s2l(v) for v in rgb]
    x = (0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047
    y = 0.2126729 * r + 0.7151522 * g + 0.072175 * b
    z = (0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883
    f = lambda t: t ** (1 / 3) if t > 216 / 24389 else (24389 / 27 * t + 16) / 116
    fx, fy, fz = f(x), f(y), f(z)
    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]

def family(L, a, b):
    C = math.hypot(a, b)
    h = math.degrees(math.atan2(b, a)) % 360
    if L < 18 and C < 22: return 'Negro'
    if L > 90 and C < 12: return 'Blanco'
    if C < 9: return 'Gris'
    if L > 62 and 8 <= C < 32 and 20 <= h < 80: return 'Nude'
    if h < 20 or h >= 340: return 'Rosa' if L >= 68 else 'Rojo'
    if h < 45:
        if L < 48 and C < 40: return 'Marrón'
        return 'Coral' if L >= 58 else ('Rojo' if L < 48 else 'Naranja')
    if h < 75: return 'Marrón' if L < 52 else ('Naranja' if h < 62 else 'Amarillo')
    if h < 98: return 'Amarillo'
    if h < 190: return 'Verde'
    if h < 270: return 'Azul'
    if h < 320: return 'Morado'
    return 'Rosa' if L >= 60 else 'Morado'

def median_color(im, x, y, r=12):
    px = [im.getpixel((xx, yy))[:3] for xx in range(int(x - r), int(x + r)) for yy in range(int(y - r), int(y + r))]
    return [int(st.median(c[i] for c in px)) for i in range(3)]

def gains_for(im, refs, target):
    samples = [median_color(im, *p) for p in refs]
    med = [sorted(v[i] for v in samples)[len(samples) // 2] for i in range(3)]
    return [target / max(s2l(v), 0.002) for v in med]

def hexs(c): return '#%02X%02X%02X' % tuple(c)

def swatch_data_url(im, box, gains):
    crop = im.crop(tuple(box))
    lut = [[l2s(s2l(v) * g) for v in range(256)] for g in gains]
    r, g, b = crop.split()
    crop = Image.merge('RGB', (r.point(lut[0]), g.point(lut[1]), b.point(lut[2])))
    crop.thumbnail((500, 500))
    buf = io.BytesIO(); crop.save(buf, 'JPEG', quality=90)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()

def main(spec_path, out_path):
    spec = json.load(open(spec_path))
    target = spec.get('target', 0.85)
    now = int(time.time() * 1000)
    items = []
    for i, it in enumerate(spec['items']):
        cals, swatch = [], None
        for j, s in enumerate(it['samples']):
            im = Image.open(s['photo']).convert('RGB')
            g = gains_for(im, s['ref'], target)
            raw = median_color(im, *s['polish'])
            cals.append([l2s(s2l(v) * gg) for v, gg in zip(raw, g)])
            if j == 0 and s.get('crop'):
                swatch = swatch_data_url(im, s['crop'], g)
        rgb = [round(sum(c[k] for c in cals) / len(cals)) for k in range(3)]
        L = lab(rgb)
        items.append(dict(
            id=str(uuid.uuid4()), createdAt=now + i, demo=False, brand=it.get('brand', ''), name=it['name'],
            number=str(it.get('number', '')), finish=it.get('finish', 'Crema'), coats=it.get('coats', 2),
            notes=it.get('notes', ''), hex=hexs(rgb), lab=L, family=it.get('family') or family(*L),
            calibrated=True, swatch=swatch, nail=None))
        print(f"{it.get('brand','')} {it['name']}: {hexs(rgb)}")
    json.dump(dict(app='catalogo-esmaltes', v=1, items=items), open(out_path, 'w'))
    print('->', out_path)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
