import { useMemo, useState } from 'react';
import { FAMILIES, rainbowKey } from './color.js';
import { FINISHES, Icon, Swatch } from './shared.jsx';

const SORTS = {
  reciente: (a, b) => b.createdAt - a.createdAt,
  tono: (a, b) => rainbowKey(a.lab) - rainbowKey(b.lab),
  marca: (a, b) => a.brand.localeCompare(b.brand) || a.name.localeCompare(b.name)
};

export default function Gallery({ polishes, go }) {
  const [q, setQ] = useState('');
  const [brand, setBrand] = useState('');
  const [finish, setFinish] = useState('');
  const [family, setFamily] = useState('');
  const [sort, setSort] = useState('reciente');

  const brands = useMemo(() => [...new Set(polishes.map((p) => p.brand).filter(Boolean))].sort(), [polishes]);
  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return polishes
      .filter((p) => (!brand || p.brand === brand) && (!finish || p.finish === finish) && (!family || p.family === family))
      .filter((p) => !s || `${p.brand} ${p.name} ${p.number || ''}`.toLowerCase().includes(s))
      .sort(SORTS[sort]);
  }, [polishes, q, brand, finish, family, sort]);

  return (
    <div className="screen">
      <header className="top">
        <div>
          <div className="muted small">✨ {polishes.length} esmaltes · {brands.length} marcas</div>
          <h1>Mis esmaltes</h1>
        </div>
        <button className="icon-btn" aria-label="Ajustes" onClick={() => go('/ajustes')}>{Icon.gear}</button>
      </header>

      <label className="search">
        {Icon.search}
        <input aria-label="Buscar esmalte" placeholder="¿Qué esmalte buscas?" value={q} onChange={(e) => setQ(e.target.value)} />
      </label>

      <div className="pills">
        <select aria-label="Marca" value={brand} onChange={(e) => setBrand(e.target.value)} className={brand ? 'on' : ''}>
          <option value="">Marca</option>
          {brands.map((b) => <option key={b}>{b}</option>)}
        </select>
        <select aria-label="Acabado" value={finish} onChange={(e) => setFinish(e.target.value)} className={finish ? 'on' : ''}>
          <option value="">Acabado</option>
          {FINISHES.map((f) => <option key={f}>{f}</option>)}
        </select>
        <select aria-label="Ordenar" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="reciente">Recientes</option>
          <option value="tono">Por tono</option>
          <option value="marca">Por marca</option>
        </select>
      </div>

      <div className="dots" role="group" aria-label="Familias de color">
        {FAMILIES.map((f) => (
          <button key={f.name} aria-label={f.name} aria-pressed={family === f.name} title={f.name}
            className={`dot ${family === f.name ? 'on' : ''}`} style={{ background: f.hex }}
            onClick={() => setFamily(family === f.name ? '' : f.name)} />
        ))}
      </div>

      {polishes.length === 0 ? (
        <div className="empty">
          <div className="bigemoji" aria-hidden="true">💅</div>
          <p><b>¡Empieza tu colección!</b><br /><span className="muted">Añade tu primer esmalte y verás aquí su color.</span></p>
          <button className="primary" onClick={() => go('/anadir')}>Añadir mi primer esmalte</button>
          <button className="ghost" onClick={() => go('/ajustes')}>Probar con ejemplos</button>
        </div>
      ) : (
        <div className="grid">
          {shown.map((p) => (
            <button key={p.id} className="tile" style={{ '--c': p.hex }} onClick={() => go(`/esmalte/${p.id}`)}>
              <Swatch p={p} />
              <span className="tname">{p.name}</span>
              <span className="tbrand">{p.brand}</span>
              {p.number ? <span className="tnum">nº {p.number}</span> : null}
            </button>
          ))}
          {shown.length === 0 && (
            <div className="empty" style={{ gridColumn: '1 / -1', padding: '30px 0' }}>
              <div className="bigemoji" aria-hidden="true">🔍</div>
              <p className="muted">No encuentro nada con esos filtros.</p>
              <button className="ghost" onClick={() => { setQ(''); setBrand(''); setFinish(''); setFamily(''); }}>Quitar filtros</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
