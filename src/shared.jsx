import { useEffect, useId, useState } from 'react';

export const FINISHES = ['Crema', 'Jelly', 'Mate', 'Shimmer', 'Glitter', 'Holográfico', 'Cromado', 'Duocromo', 'Termocrómico'];
// Acabados en los que un color plano no representa el esmalte: se enseña la foto.
export const SPECIAL = ['Shimmer', 'Glitter', 'Holográfico', 'Cromado', 'Duocromo', 'Termocrómico'];

export function useObjectUrl(blob) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!blob) return setUrl(null);
    if (typeof blob === 'string') return setUrl(blob);
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

// Uña ovalada vista desde arriba (punta hacia arriba).
const NAIL = 'M50 2 C56 2 60 8 64 20 L80 74 C84 87 86 96 86 106 C86 123 70 133 50 133 C30 133 14 123 14 106 C14 96 16 87 20 74 L36 20 C40 8 44 2 50 2 Z';

export function Swatch({ p, className = '', big = false }) {
  const uid = useId().replace(/:/g, '');
  const url = useObjectUrl(p.swatch);
  const useImg = url && SPECIAL.includes(p.finish);
  return (
    <svg viewBox="-1 -1 102 136" className={`nail ${big ? 'big' : ''} ${className}`} role="img" aria-label={`Color ${p.hex}`}>
      <defs>
        <clipPath id={`c${uid}`}><path d={NAIL} /></clipPath>
        <linearGradient id={`s${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity=".16" />
          <stop offset=".55" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".14" />
        </linearGradient>
      </defs>
      <g clipPath={`url(#c${uid})`}>
        {useImg
          ? <image href={url} x="0" y="0" width="100" height="134" preserveAspectRatio="xMidYMid slice" />
          : <rect width="100" height="134" fill={p.hex} />}
        {!useImg && <rect width="100" height="134" fill={`url(#s${uid})`} />}
        {!useImg && (
          <>
            <path d="M25 104 C25 94 27 86 31 74 L42 36 C44 28 46 21 49 14 C47 44 43 80 41 112 C32 112 25 112 25 104 Z" fill="#fff" opacity=".34" />
            <ellipse cx="68" cy="108" rx="8" ry="13" fill="#fff" opacity=".12" transform="rotate(14 70 108)" />
          </>
        )}
      </g>
      <path d={NAIL} fill="none" stroke="rgba(0,0,0,.14)" strokeWidth="1" />
    </svg>
  );
}

export const Icon = {
  grid: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/></svg>
  ),
  palette: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M12 3a9 9 0 100 18c1.5 0 2-1 1.5-2s0-2.5 1.5-2.5H17a4 4 0 004-4A9 9 0 0012 3z"/><circle cx="8" cy="11" r="1"/><circle cx="12" cy="7.5" r="1"/><circle cx="16" cy="10" r="1"/></svg>
  ),
  plus: (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>
  ),
  back: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>
  ),
  search: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/></svg>
  ),
  gear: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/></svg>
  ),
  close: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
  )
};
