import { familyOf, hexToLab } from './color.js';
import { FINISHES } from './shared.jsx';
import { newId } from './db.js';

// Excel en español guarda los CSV con ";" y en inglés con ",": se detecta solo.
function parse(text) {
  const t = text.replace(/^﻿/, '');
  const first = t.split(/\r?\n/)[0] || '';
  const sep = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ';' : ',';
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) {
      if (c === '"' && t[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === sep) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && t[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((x) => x.trim())) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim())) rows.push(row);
  return rows;
}

const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
const ALIASES = {
  brand: ['marca', 'brand'], name: ['nombre', 'name', 'tono'], number: ['numero', 'num', 'codigo', 'n', 'number'],
  finish: ['acabado', 'finish'], hex: ['hex', 'color'], coats: ['capas', 'coats'], notes: ['notas', 'notes']
};

export function csvToPolishes(text) {
  const rows = parse(text);
  if (rows.length < 2) throw new Error('El archivo no tiene filas');
  const head = rows[0].map(norm);
  const col = {};
  for (const [k, names] of Object.entries(ALIASES)) col[k] = head.findIndex((h) => names.includes(h));
  if (col.name < 0) throw new Error('Falta la columna "nombre"');
  const get = (r, k) => (col[k] >= 0 ? (r[col[k]] || '').trim() : '');
  const out = [];
  rows.slice(1).forEach((r, i) => {
    const name = get(r, 'name');
    if (!name) return;
    let hex = get(r, 'hex').toUpperCase();
    if (hex && !hex.startsWith('#')) hex = '#' + hex;
    const hasColor = /^#[0-9A-F]{6}$/.test(hex);
    if (!hasColor) hex = '#CCCCCC';
    const lab = hexToLab(hex);
    const f = get(r, 'finish');
    out.push({
      id: newId(), createdAt: Date.now() + i, demo: false,
      brand: get(r, 'brand'), name, number: get(r, 'number'),
      finish: FINISHES.find((x) => norm(x) === norm(f)) || 'Crema',
      coats: Math.min(3, Math.max(1, parseInt(get(r, 'coats'), 10) || 2)),
      notes: get(r, 'notes'), hex, lab, family: hasColor ? familyOf(lab) : 'Gris',
      calibrated: false, swatch: null, nail: null, sinColor: !hasColor
    });
  });
  return out;
}
