import { useMemo, useState } from 'react';
import { deltaE } from './color.js';
import { remove } from './db.js';
import { Icon, Swatch, useObjectUrl } from './shared.jsx';
import Form from './Form.jsx';

export default function Detail({ id, polishes, go, reload }) {
  const p = polishes.find((x) => x.id === id);
  const [edit, setEdit] = useState(false);
  const swatchUrl = useObjectUrl(p?.swatch);
  const nailUrl = useObjectUrl(p?.nail);
  const similar = useMemo(
    () => p ? polishes.filter((x) => x.id !== p.id).map((x) => ({ x, de: deltaE(p.lab, x.lab) })).sort((a, b) => a.de - b.de).slice(0, 6) : [],
    [p, polishes]
  );
  if (!p) return <div className="screen"><button className="icon-btn" onClick={() => go('/')} aria-label="Volver">{Icon.back}</button><p>No encontrado.</p></div>;

  if (edit) {
    return <Form initial={p} brands={[...new Set(polishes.map((x) => x.brand).filter(Boolean))].sort()} onDone={async () => { setEdit(false); await reload(); }} onCancel={() => setEdit(false)} />;
  }

  return (
    <div className="screen detail">
      <div className="hero" style={{ '--c': p.hex }}>
        <button className="icon-btn floating" aria-label="Volver" onClick={() => go('/')}>{Icon.back}</button>
        <Swatch p={p} big />
        <span className="chip-light">{p.calibrated ? 'Color calibrado' : 'Color sin calibrar'}</span>
      </div>
      <div className="body">
        <div className="muted small">{p.brand}{p.number ? ` · nº ${p.number}` : ''}</div>
        <h1>{p.name}</h1>
        <div className="chips">
          <span className="chip">{p.family}</span>
          <span className="chip">{p.finish}</span>
          {p.coats ? <span className="chip">{p.coats} capa{p.coats > 1 ? 's' : ''}</span> : null}
          {!p.calibrated && <span className="chip warn">Sin calibrar</span>}
        </div>
        <div className="stats">
          <div className="card"><div className="muted small">Color (hex)</div><b>{p.hex}</b></div>
          <div className="card"><div className="muted small">Lab</div><b>{p.lab.map((v) => Math.round(v)).join(' · ')}</b></div>
        </div>

        {(swatchUrl || nailUrl) && (
          <>
            <h2>Fotos</h2>
            <div className="photos">
              {swatchUrl && <figure><img src={swatchUrl} alt="Swatch" /><figcaption>Swatch</figcaption></figure>}
              {nailUrl && <figure><img src={nailUrl} alt="En uña" /><figcaption>En uña</figcaption></figure>}
            </div>
          </>
        )}

        {p.notes && <><h2>Notas</h2><p>{p.notes}</p></>}

        {similar.length > 0 && (
          <>
            <h2>Parecidos en tu colección</h2>
            <div className="similar">
              {similar.map(({ x, de }) => (
                <button key={x.id} onClick={() => go(`/esmalte/${x.id}`)} className="sim">
                  <Swatch p={x} className="mini" />
                  <span className="tname">{x.name}</span>
                  <span className="tbrand">ΔE {de.toFixed(1)}{de < 3 ? ' · dupe' : ''}</span>
                </button>
              ))}
            </div>
          </>
        )}

        <div className="row">
          <button className="ghost" onClick={() => setEdit(true)}>Editar</button>
          <button className="danger" onClick={async () => { if (confirm(`¿Borrar "${p.name}"?`)) { await remove(p.id); await reload(); go('/'); } }}>Borrar</button>
        </div>
      </div>
    </div>
  );
}
