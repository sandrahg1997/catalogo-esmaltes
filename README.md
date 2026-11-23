# Catálogo de esmaltes

Web instalable en el móvil (PWA) para catalogar esmaltes con el color calibrado.

- Los datos se guardan en el propio navegador (IndexedDB). No hay cuentas ni servidor.
- Para un color fiel, la foto lleva una tarjeta gris 18 % (o un papel blanco) al lado del esmalte.
  Se toca la tarjeta y después el esmalte; la app corrige el balance de blancos y la exposición y calcula hex y Lab.
- Búsqueda por color y parecidos con distancia CIEDE2000 (ΔE < 3 se marca como posible dupe).
- Copia de seguridad: Ajustes → Descargar copia (JSON).

## Desarrollo

```bash
npm install
npm run dev      # servidor local
npm run build    # genera dist/
```

## Pendiente

- Sincronización con Supabase (opcional, al final).
- Lectura de la etiqueta del bote (OCR).
