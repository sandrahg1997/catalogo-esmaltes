import { useMemo, useState } from 'react';
import { hexToLab, sortByNearest } from './color.js';
import { Swatch } from './shared.jsx';

export default function ByColor({ polishes, go }) {
  const [hex, setHex] = useState('#B3202F');
  const list = useMemo(() => sortByNearest(hexToLab(hex), polishes).slice(0, 18), [hex, polishes]);

  return (
    <div className="screen">
      <header className="top"><div><h1>Por color</h1><div className="muted small">Elige un color y te enseño los más parecidos</div></div></header>
      <label className="picker">
        <input type="color" value={hex} onChange={(e) => setHex(e.target.value.toUpperCase())} aria-label="Color a buscar" />
        <span>{hex.toUpperCase()}</span>
      </label>
      {polishes.length === 0 ? <p className="muted">Añade esmaltes para poder buscar.</p> : (
        <div className="grid">
          {list.map(({ it, de }) => (
            <button key={it.id} className="tile" onClick={() => go(`/esmalte/${it.id}`)}>
              <Swatch p={it} />
              <span className="tname">{it.name}</span>
              <span className="tbrand">{it.brand} · ΔE {de.toFixed(1)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
