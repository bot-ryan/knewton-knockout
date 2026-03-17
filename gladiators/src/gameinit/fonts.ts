// src/gameinit/Fonts.ts
type FontSpec = {
  family: string;
  path: string;                   // relative to site base, e.g. 'fonts/Greconian.ttf'
  descriptors?: FontFaceDescriptors;
  format?: 'woff2' | 'truetype' | 'opentype' | 'woff';
};

const cache = new Map<string, Promise<void>>();

function loadFont({ family, path, descriptors, format }: FontSpec): Promise<void> {
  if (cache.has(family)) return cache.get(family)!;

  const url = import.meta.env.BASE_URL + path;   // base-aware
  const src = format ? `url(${url}) format('${format}')` : `url(${url})`;

  console.log(`[FontLoader] Trying to load "${family}" from: ${url}`);

  const face = new FontFace(family, src, descriptors);

  const p = face.load()
    .then(f => {
      document.fonts.add(f);
      const ok = document.fonts.check(`16px ${family}`);
      console.log(`[FontLoader] Loaded "${family}" ✓ check=${ok}`);
      if (!ok) throw new Error(`document.fonts.check() failed for "${family}"`);
    })
    .catch(err => {
      console.error(`[FontLoader] Failed "${family}" from: ${url}`, err);
      throw err;
    });

  cache.set(family, p);
  return p;
}

export function loadGameFonts(): Promise<void[]> {
  return Promise.all([
    loadFont({ family: 'GreconianWeb', path: 'fonts/Greconian.ttf', format: 'truetype' }),
  ]);
}

export const Fonts = {
  Title: 'GreconianWeb',
};