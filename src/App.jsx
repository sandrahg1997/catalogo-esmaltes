import { useCallback, useEffect, useState } from 'react';
import { getAll } from './db.js';
import { Icon } from './shared.jsx';
import Gallery from './Gallery.jsx';
import Detail from './Detail.jsx';
import Form from './Form.jsx';
import ByColor from './ByColor.jsx';
import Settings from './Settings.jsx';

// En la versión de demostración (artifact) la ruta vive en memoria, sin tocar el hash de la URL.
const MEMORY_ROUTE = import.meta.env.VITE_MEMORY_ROUTE === '1';

const useRoute = () => {
  const [mem, setMem] = useState('/');
  const read = () => location.hash.replace(/^#/, '') || '/';
  const [route, setRoute] = useState(read);
  useEffect(() => {
    const f = () => { setRoute(read()); window.scrollTo(0, 0); };
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);
  if (MEMORY_ROUTE) return [mem, (r) => { setMem(r); window.scrollTo(0, 0); }];
  return [route, (r) => { location.hash = r; }];
};

export default function App() {
  const [route, go] = useRoute();
  const [polishes, setPolishes] = useState([]);
  const [ready, setReady] = useState(false);
  const reload = useCallback(async () => { setPolishes(await getAll()); setReady(true); }, []);
  useEffect(() => { reload(); }, [reload]);

  if (!ready) return null;
  const brands = [...new Set(polishes.map((p) => p.brand).filter(Boolean))].sort();
  const full = route.startsWith('/esmalte/') || route === '/anadir' || route === '/ajustes';
  const isColor = route === '/color';

  let view;
  if (route === '/anadir') view = <Form brands={brands} onDone={async () => { await reload(); go('/'); }} onCancel={() => go('/')} />;
  else if (route.startsWith('/esmalte/')) view = <Detail id={route.split('/')[2]} polishes={polishes} go={go} reload={reload} />;
  else if (route === '/ajustes') view = <Settings go={go} reload={reload} count={polishes.length} />;
  else if (isColor) view = <ByColor polishes={polishes} go={go} />;
  else view = <Gallery polishes={polishes} go={go} />;

  return (
    <>
      {view}
      {!full && (
        <nav className="tabbar">
          <button className={!isColor ? 'on' : ''} onClick={() => go('/')}>{Icon.grid}Galería</button>
          <button className="fab" aria-label="Añadir esmalte" onClick={() => go('/anadir')}>{Icon.plus}</button>
          <button className={isColor ? 'on' : ''} onClick={() => go('/color')}>{Icon.palette}Por color</button>
        </nav>
      )}
    </>
  );
}
