import { useState } from 'react';
import { clearDemo, exportBackup, getAllLocal, importBackup, newId, put, uploadLocalToCloud } from './db.js';
import { supabase } from './cloud.js';
import { familyOf, hexToLab } from './color.js';
import { Icon } from './shared.jsx';

const DEMO = [
  ['Essie', 'Cherry Bomb', '#B3202F', 'Crema'], ['Essie', 'Ballet Slippers', '#E9C3BA', 'Crema'],
  ['OPI', 'Vampy', '#5E1224', 'Crema'], ['Zoya', 'Midnight', '#1C2A4A', 'Crema'],
  ['Kiko', 'Sage Advice', '#8AA08A', 'Crema'], ['Catrice', 'Lavender Haze', '#B9A3D6', 'Jelly'],
  ['OPI', 'Coral Reef', '#F0735F', 'Crema'], ['Essie', 'Golden Hour', '#C9962B', 'Shimmer'],
  ['OPI', 'Negro Mate', '#17151A', 'Mate'], ['Kiko', 'Rouge Noir', '#A8222F', 'Crema'],
  ['Zoya', 'Poppy', '#C8342E', 'Crema'], ['Catrice', 'Nude Beige', '#D2AA94', 'Crema']
];

export default function Settings({ go, reload, count, session }) {
  const [msg, setMsg] = useState('');

  const doExport = async () => {
    const blob = await exportBackup();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `esmaltes-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg('Copia descargada.');
  };
  const doImport = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try { setMsg(`Importados ${await importBackup(f)} esmaltes.`); await reload(); } catch (err) { setMsg(`Error: ${err.message}`); }
  };
  const doDemo = async () => {
    for (const [brand, name, hex, finish] of DEMO) {
      const lab = hexToLab(hex);
      await put({ id: newId(), createdAt: Date.now(), demo: true, brand, name, number: '', finish, coats: 2, notes: '', hex, lab, family: familyOf(lab), calibrated: true, swatch: null, nail: null });
    }
    await reload();
    setMsg('Ejemplos cargados.');
  };

  return (
    <div className="screen">
      <header className="top">
        <button className="icon-btn" aria-label="Volver" onClick={() => go('/')}>{Icon.back}</button>
        <h1 className="mid">Ajustes</h1>
        <span style={{ width: 44 }} />
      </header>

      {supabase && session && (
        <section className="card block">
          <h2>Cuenta</h2>
          <p className="muted small">Sesión iniciada como {session.user.email}. Tus esmaltes ({count}) y fotos están guardados en la nube.</p>
          <button className="ghost" onClick={async () => {
            try {
              const local = await getAllLocal();
              if (!local.length) return setMsg('No hay esmaltes guardados en este móvil.');
              setMsg(`Subidos ${await uploadLocalToCloud()} esmaltes a la nube.`);
              await reload();
            } catch (err) { setMsg(`Error: ${err.message}`); }
          }}>Subir los esmaltes guardados en este móvil</button>
          <button className="ghost" onClick={() => supabase.auth.signOut()}>Cerrar sesión</button>
        </section>
      )}

      <section className="card block">
        <h2>Copia de seguridad</h2>
        <p className="muted small">{supabase && session ? `Tus esmaltes (${count}) ya están en la nube. La copia es un extra.` : `Los esmaltes (${count}) se guardan solo en este móvil. Descarga una copia de vez en cuando, sobre todo antes de limpiar el navegador o cambiar de móvil.`}</p>
        <button className="primary" onClick={doExport}>Descargar copia</button>
        <label className="file"><input type="file" accept="application/json" onChange={doImport} /><span>Restaurar desde una copia</span></label>
      </section>

      <section className="card block">
        <h2>Ejemplos</h2>
        <p className="muted small">Carga 12 esmaltes inventados para probar la galería. Se pueden borrar de golpe.</p>
        <div className="row">
          <button className="ghost" onClick={doDemo}>Cargar ejemplos</button>
          <button className="ghost" onClick={async () => { await clearDemo(); await reload(); setMsg('Ejemplos borrados.'); }}>Borrar ejemplos</button>
        </div>
      </section>

      <section className="card block">
        <h2>Consejos para un color fiel</h2>
        <ul className="muted small">
          <li>Luz de día junto a una ventana, sin sol directo y sin flash.</li>
          <li>La tarjeta gris en el mismo plano y con la misma luz que el esmalte.</li>
          <li>Siempre el mismo sitio y la misma hora para todo el catálogo.</li>
          <li>Glitter y holográficos: la foto es lo que vale, el color es solo orientativo.</li>
        </ul>
      </section>
      {msg && <p role="status" className="toast">{msg}</p>}
    </div>
  );
}
