import { useEffect, useId, useState } from 'react';

export const FINISHES = ['Crema', 'Jelly', 'Mate', 'Shimmer', 'Glitter', 'Holográfico', 'Cromado', 'Duocromo', 'Termocrómico'];
// Acabados en los que un color plano no representa el esmalte: se enseña la foto.
export const SPECIAL = ['Shimmer', 'Glitter', 'Holográfico', 'Cromado', 'Duocromo', 'Termocrómico'];

export function useObjectUrl(blob) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    if (!blob) return setUrl(null);
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [blob]);
  return url;
}

// Uña ovalada vista desde arriba (punta hacia arriba).
const NAIL = 'M10 54 C10 22 28 4 50 4 C72 4 90 22 90 54 L90 102 C90 120 72 130 50 130 C28 130 10 120 10 102 Z';

export function Swatch({ p, className = '', big = false }) {
  const uid = useId().replace(/:/g, '');
  const url = useObjectUrl(p.swatch);
  const useImg = url && SPECIAL.includes(p.finish);
  return (
    <svg viewBox="0 0 100 134" className={`nail ${big ? 'big' : ''} ${className}`} role="img" aria-label={`Color ${p.hex}`}>
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
        {!useImg && <path d="M24 46 C25 26 35 14 46 11 C37 24 35 52 35 96 C28 94 24 74 24 46 Z" fill="#fff" opacity=".32" />}
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
