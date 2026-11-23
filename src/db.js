import { openDB } from 'idb';
import { supabase } from './cloud.js';

// --- Local (IndexedDB) ---
const dbp = openDB('catalogo-esmaltes', 1, {
  upgrade(db) {
    db.createObjectStore('polishes', { keyPath: 'id' });
  }
});

export const newId = () => crypto.randomUUID();

let cloud = false;
export const setCloudMode = (on) => { cloud = !!(on && supabase); };

export const getAllLocal = async () => (await dbp).getAll('polishes');
const putLocal = async (p) => (await dbp).put('polishes', p);
const removeLocal = async (id) => (await dbp).delete('polishes', id);

// --- Nube (Supabase) ---
const BUCKET = 'fotos';
const SIGN_SECONDS = 60 * 60 * 24 * 7;

const rowToPolish = (r, urls) => ({
  id: r.id, brand: r.brand, name: r.name, number: r.number, finish: r.finish, coats: r.coats,
  notes: r.notes, hex: r.hex, lab: r.lab, family: r.family, calibrated: r.calibrated, demo: r.demo,
  createdAt: Date.parse(r.created_at),
  swatchPath: r.swatch_path, nailPath: r.nail_path,
  swatch: r.swatch_path ? urls[r.swatch_path] || null : null,
  nail: r.nail_path ? urls[r.nail_path] || null : null
});

async function getAllCloud() {
  const { data, error } = await supabase.from('polishes').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  const paths = data.flatMap((r) => [r.swatch_path, r.nail_path]).filter(Boolean);
  const urls = {};
  if (paths.length) {
    const { data: signed, error: e2 } = await supabase.storage.from(BUCKET).createSignedUrls(paths, SIGN_SECONDS);
    if (e2) throw e2;
    signed.forEach((s) => { if (s.signedUrl) urls[s.path] = s.signedUrl; });
  }
  return data.map((r) => rowToPolish(r, urls));
}

async function uploadPhoto(uid, id, kind, blob) {
  const path = `${uid}/${id}-${kind}-${Date.now()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
  if (error) throw error;
  return path;
}

async function putCloud(p) {
  const { data: u } = await supabase.auth.getUser();
  const uid = u.user.id;
  let swatchPath = p.swatchPath || null;
  let nailPath = p.nailPath || null;
  const old = [];
  if (p.swatch instanceof Blob) { if (swatchPath) old.push(swatchPath); swatchPath = await uploadPhoto(uid, p.id, 'swatch', p.swatch); }
  else if (!p.swatch) { if (swatchPath) old.push(swatchPath); swatchPath = null; }
  if (p.nail instanceof Blob) { if (nailPath) old.push(nailPath); nailPath = await uploadPhoto(uid, p.id, 'nail', p.nail); }
  else if (!p.nail) { if (nailPath) old.push(nailPath); nailPath = null; }
  const { error } = await supabase.from('polishes').upsert({
    id: p.id, user_id: uid, brand: p.brand, name: p.name, number: p.number || '', finish: p.finish,
    coats: p.coats, notes: p.notes || '', hex: p.hex, lab: p.lab, family: p.family,
    calibrated: !!p.calibrated, demo: !!p.demo, swatch_path: swatchPath, nail_path: nailPath,
    created_at: new Date(p.createdAt || Date.now()).toISOString()
  });
  if (error) throw error;
  if (old.length) await supabase.storage.from(BUCKET).remove(old);
}

async function removeCloud(id) {
  const { data } = await supabase.from('polishes').select('swatch_path,nail_path').eq('id', id).maybeSingle();
  const { error } = await supabase.from('polishes').delete().eq('id', id);
  if (error) throw error;
  const paths = [data?.swatch_path, data?.nail_path].filter(Boolean);
  if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
}

// --- API común ---
export const getAll = () => (cloud ? getAllCloud() : getAllLocal());
export const put = (p) => (cloud ? putCloud(p) : putLocal(p));
export const remove = (id) => (cloud ? removeCloud(id) : removeLocal(id));
export const clearDemo = async () => {
  const all = await getAll();
  await Promise.all(all.filter((p) => p.demo).map((p) => remove(p.id)));
};

// Sube a la nube lo que haya guardado en este móvil.
export async function uploadLocalToCloud() {
  if (!cloud) throw new Error('Inicia sesión primero');
  const local = await getAllLocal();
  for (const p of local) await putCloud({ ...p, swatchPath: null, nailPath: null });
  return local.length;
}

// --- Copia de seguridad ---
const blobToDataUrl = (blob) =>
  new Promise((res) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.readAsDataURL(blob);
  });
const dataUrlToBlob = async (url) => (await fetch(url)).blob();
const toBlob = async (v) => (!v ? null : v instanceof Blob ? v : (await fetch(v)).blob());

export async function exportBackup() {
  const all = await getAll();
  const items = await Promise.all(
    all.map(async (p) => {
      const swatch = await toBlob(p.swatch);
      const nail = await toBlob(p.nail);
      const { swatchPath, nailPath, ...rest } = p;
      return { ...rest, swatch: swatch ? await blobToDataUrl(swatch) : null, nail: nail ? await blobToDataUrl(nail) : null };
    })
  );
  return new Blob([JSON.stringify({ app: 'catalogo-esmaltes', v: 1, items })], { type: 'application/json' });
}

export async function importBackup(file) {
  const data = JSON.parse(await file.text());
  if (data.app !== 'catalogo-esmaltes') throw new Error('Archivo no válido');
  for (const p of data.items) {
    await put({
      ...p,
      swatchPath: null,
      nailPath: null,
      swatch: p.swatch ? await dataUrlToBlob(p.swatch) : null,
      nail: p.nail ? await dataUrlToBlob(p.nail) : null
    });
  }
  return data.items.length;
}
