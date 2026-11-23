import { openDB } from 'idb';

const dbp = openDB('catalogo-esmaltes', 1, {
  upgrade(db) {
    db.createObjectStore('polishes', { keyPath: 'id' });
  }
});

export const newId = () => crypto.randomUUID();

export const getAll = async () => (await dbp).getAll('polishes');
export const put = async (p) => (await dbp).put('polishes', p);
export const remove = async (id) => (await dbp).delete('polishes', id);
export const clearDemo = async () => {
  const db = await dbp;
  const all = await db.getAll('polishes');
  await Promise.all(all.filter((p) => p.demo).map((p) => db.delete('polishes', p.id)));
};

const blobToDataUrl = (blob) =>
  new Promise((res) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.readAsDataURL(blob);
  });

const dataUrlToBlob = async (url) => (await fetch(url)).blob();

export async function exportBackup() {
  const all = await getAll();
  const items = await Promise.all(
    all.map(async (p) => ({
      ...p,
      swatch: p.swatch ? await blobToDataUrl(p.swatch) : null,
      nail: p.nail ? await blobToDataUrl(p.nail) : null
    }))
  );
  return new Blob([JSON.stringify({ app: 'catalogo-esmaltes', v: 1, items })], {
    type: 'application/json'
  });
}

export async function importBackup(file) {
  const data = JSON.parse(await file.text());
  if (data.app !== 'catalogo-esmaltes') throw new Error('Archivo no válido');
  for (const p of data.items) {
    await put({
      ...p,
      swatch: p.swatch ? await dataUrlToBlob(p.swatch) : null,
      nail: p.nail ? await dataUrlToBlob(p.nail) : null
    });
  }
  return data.items.length;
}
