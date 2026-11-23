import { useRef, useState } from 'react';
import {
  REFERENCES, applyGains, applyGainsToCanvas, canvasToBlob, familyOf, gainsFromReference,
  hexToLab, loadImage, medianColor, rgbToHex, rgbToLab
} from './color.js';
import { newId, put } from './db.js';
import { FINISHES, Icon } from './shared.jsx';

export default function Form({ initial, brands = [], onDone, onCancel }) {
  const editing = !!initial;
  const [brand, setBrand] = useState(initial?.brand || '');
  const [name, setName] = useState(initial?.name || '');
  const [number, setNumber] = useState(initial?.number || '');
  const [finish, setFinish] = useState(initial?.finish || 'Crema');
  const [coats, setCoats] = useState(initial?.coats || 2);
  const [notes, setNotes] = useState(initial?.notes || '');
  const [hex, setHex] = useState(initial?.hex || '');
  const [calibrated, setCalibrated] = useState(initial?.calibrated || false);
  const [nail, setNail] = useState(initial?.nail || null);
  const [swatch, setSwatch] = useState(initial?.swatch || null);
  const [showCal, setShowCal] = useState(!editing);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  // Calibración
  const [refType, setRefType] = useState('blanco');
  const [pts, setPts] = useState({ ref: [], pol: null });
  const [before, setBefore] = useState(null);
  const [mode, setMode] = useState('ref');
  const canvasRef = useRef(null);
  const srcRef = useRef(null);
  const gainsRef = useRef(null);

  const recompute = (refPt, polPt, type = refType) => {
    const src = srcRef.current;
    if (!src || !polPt) return;
    const ctx = src.getContext('2d', { willReadFrequently: true });
    const r = Math.max(src.width, src.height) * 0.012;
    const raw = medianColor(ctx, polPt.x, polPt.y, r);
    setBefore(rgbToHex(raw));
    if (refPt && refPt.length) {
      const samples = refPt.map((q) => medianColor(ctx, q.x, q.y, r));
      const med = [0, 1, 2].map((i) => {
        const a = samples.map((v) => v[i]).sort((x, y) => x - y);
        return a[Math.floor(a.length / 2)];
      });
      const gains = gainsFromReference(med, REFERENCES[type].target);
      gainsRef.current = gains;
      setHex(rgbToHex(applyGains(raw, gains)));
      setCalibrated(true);
    } else {
      gainsRef.current = null;
      setHex(rgbToHex(raw));
      setCalibrated(false);
    }
  };

  const onPhoto = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const c = await loadImage(f);
    srcRef.current = c;
    const view = canvasRef.current;
    view.width = c.width;
    view.height = c.height;
    view.getContext('2d').drawImage(c, 0, 0);
    gainsRef.current = null;
    setPts({ ref: [], pol: null });
    setBefore(null);
    setMode('ref');
  };

  const onTap = (e) => {
    if (!srcRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pt = {
      x: ((e.clientX - rect.left) / rect.width) * srcRef.current.width,
      y: ((e.clientY - rect.top) / rect.height) * srcRef.current.height
    };
    if (mode === 'ref') {
      if (pts.ref.length >= 3) return;
      const next = { ...pts, ref: [...pts.ref, pt] };
      setPts(next);
      if (next.pol) recompute(next.ref, next.pol);
    } else {
      const next = { ...pts, pol: pt };
      setPts(next);
      recompute(next.ref, pt);
    }
  };

  const onNail = async (e) => {
    const f = e.target.files?.[0];
    if (f) setNail(await canvasToBlob(await loadImage(f), 1000, 0.88));
  };

  const save = async (e) => {
    e.preventDefault();
    if (!hex || !name.trim()) return;
    setSaving(true);
    setErr('');
    try {
    let swatchBlob = swatch;
    if (srcRef.current) {
      const tmp = document.createElement('canvas');
      tmp.width = srcRef.current.width;
      tmp.height = srcRef.current.height;
      tmp.getContext('2d').drawImage(srcRef.current, 0, 0);
      if (gainsRef.current) applyGainsToCanvas(tmp, gainsRef.current);
      swatchBlob = await canvasToBlob(tmp, 800, 0.9);
    }
    const lab = hexToLab(hex);
    await put({
      id: initial?.id || newId(),
      createdAt: initial?.createdAt || Date.now(),
      demo: false,
      brand: brand.trim(),
      name: name.trim(),
      number: number.trim(),
      finish,
      coats: Number(coats),
      notes: notes.trim(),
      hex,
      lab,
      family: familyOf(lab),
      calibrated,
      swatch: swatchBlob,
      nail,
      swatchPath: initial?.swatchPath || null,
      nailPath: initial?.nailPath || null
    });
    onDone();
    } catch (e2) {
      setErr(`No se pudo guardar: ${e2.message}`);
      setSaving(false);
    }
  };

  const step = mode === 'ref'
    ? (pts.ref.length === 0 ? 'Toca el papel o tarjeta (hasta 3 puntos)' : `Referencia: ${pts.ref.length}/3 puntos`)
    : !pts.pol ? 'Ahora toca el esmalte' : 'Listo. Toca otra vez para ajustar';

  return (
    <form className="screen form" onSubmit={save}>
      <header className="top">
        <button type="button" className="icon-btn" aria-label="Cerrar" onClick={onCancel}>{Icon.close}</button>
        <h1 className="mid">{editing ? 'Editar esmalte' : 'Nuevo esmalte 💅'}</h1>
        <span style={{ width: 44 }} />
      </header>

      {showCal ? (
        <section className="cal">
          <div className="seg" role="group" aria-label="Referencia">
            {Object.entries(REFERENCES).map(([k, v]) => (
              <button type="button" key={k} className={refType === k ? 'on' : ''}
                onClick={() => { setRefType(k); recompute(pts.ref, pts.pol, k); }}>{v.label}</button>
            ))}
          </div>
          <label className="file">
            <input type="file" accept="image/*" capture="environment" onChange={onPhoto} />
            <span>{srcRef.current ? 'Cambiar foto' : 'Hacer foto o elegir del escáner'}</span>
          </label>
          <p className="muted small">Pon el folio blanco o la tarjeta junto al esmalte, con luz de día, sin flash y sin sombras encima.</p>

          <div className="stage" style={{ display: srcRef.current ? 'block' : 'none' }}>
            <canvas ref={canvasRef} onClick={onTap} aria-label="Foto para calibrar" />
            {pts.ref.map((q, i) => <i key={i} className="pin ref" style={{ left: `${(q.x / (srcRef.current?.width || 1)) * 100}%`, top: `${(q.y / (srcRef.current?.height || 1)) * 100}%` }} />)}
            {pts.pol && <i className="pin pol" style={{ left: `${(pts.pol.x / (srcRef.current?.width || 1)) * 100}%`, top: `${(pts.pol.y / (srcRef.current?.height || 1)) * 100}%` }} />}
            <span className="hint">{step}</span>
          </div>

          {srcRef.current && (
            <div className="row" style={{ marginTop: 10 }}>
              {mode === 'ref' ? (
                <button type="button" className="ghost" disabled={pts.ref.length === 0} onClick={() => setMode('pol')}>Siguiente: tocar el esmalte</button>
              ) : (
                <button type="button" className="ghost" onClick={() => { setPts({ ref: [], pol: pts.pol }); gainsRef.current = null; setMode('ref'); }}>Repetir referencia</button>
              )}
            </div>
          )}

          {before && (
            <div className="ba">
              <div><span className="sw" style={{ background: before }} /><small>Antes</small></div>
              <div className="arrow">→</div>
              <div><span className="sw" style={{ background: hex }} /><small>{calibrated ? 'Calibrado' : 'Sin calibrar'}</small></div>
            </div>
          )}
        </section>
      ) : (
        <button type="button" className="ghost" onClick={() => setShowCal(true)}>Recalibrar con una foto nueva</button>
      )}

      <div className="colorrow">
        <label className="picker">
          <input type="color" value={hex || '#cccccc'} onChange={(e) => { setHex(e.target.value.toUpperCase()); setCalibrated(false); }} aria-label="Color" />
          <span>{hex || 'Sin color aún'}</span>
        </label>
        <span className="muted small">Puedes ajustarlo a mano</span>
      </div>

      <label className="field">Marca
        <input list="brands" value={brand} onChange={(e) => setBrand(e.target.value)} required placeholder="Essie, OPI, Kiko…" />
        <datalist id="brands">{brands.map((b) => <option key={b} value={b} />)}</datalist>
      </label>
      <div className="two">
        <label className="field">Nombre
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Cherry Bomb" />
        </label>
        <label className="field">Nº / código
          <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="1082" />
        </label>
      </div>

      <div className="field">Acabado
        <div className="pills wrap">
          {FINISHES.map((f) => (
            <button type="button" key={f} className={`pill ${finish === f ? 'on' : ''}`} onClick={() => setFinish(f)}>{f}</button>
          ))}
        </div>
      </div>

      <div className="field">Capas
        <div className="seg">
          {[1, 2, 3].map((n) => <button type="button" key={n} className={coats === n ? 'on' : ''} onClick={() => setCoats(n)}>{n}</button>)}
        </div>
      </div>

      <label className="field">Notas
        <textarea rows="2" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Opacidad, duración, dupes…" />
      </label>

      <label className="file">
        <input type="file" accept="image/*" onChange={onNail} />
        <span>{nail ? 'Foto en uña añadida · cambiar' : 'Añadir foto en uña (opcional)'}</span>
      </label>

      {err && <p role="alert" className="err">{err}</p>}
      <div className="sticky">
        <button className="primary" disabled={saving || !hex || !name.trim()}>{saving ? 'Guardando…' : 'Guardar mi esmalte'}</button>
      </div>
    </form>
  );
}
