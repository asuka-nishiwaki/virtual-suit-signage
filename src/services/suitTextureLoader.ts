const textureCache = new Map<string, Promise<HTMLCanvasElement>>();

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.replace('#', ''), 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

/** 黒背景を透過化し、必要ならスーツ色にティント */
function processSuitSheet(img: HTMLImageElement, tintHex?: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    if (r < 32 && g < 32 && b < 32) {
      data[i + 3] = 0;
    }
  }
  ctx.putImageData(imageData, 0, 0);

  if (tintHex) {
    const tint = hexToRgb(tintHex);
    const tinted = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const td = tinted.data;
    for (let i = 0; i < td.length; i += 4) {
      if (td[i + 3] === 0) continue;
      const lum = (td[i] * 0.299 + td[i + 1] * 0.587 + td[i + 2] * 0.114) / 255;
      td[i] = Math.round(tint.r * lum);
      td[i + 1] = Math.round(tint.g * lum);
      td[i + 2] = Math.round(tint.b * lum);
    }
    ctx.putImageData(tinted, 0, 0);
  }

  return canvas;
}

export async function loadSuitTexture(
  sheetUrl: string,
  tintHex?: string | null
): Promise<HTMLCanvasElement> {
  const cacheKey = `${sheetUrl}|${tintHex ?? 'none'}`;
  const cached = textureCache.get(cacheKey);
  if (cached) return cached;

  const promise = loadImage(sheetUrl).then((img) => processSuitSheet(img, tintHex ?? undefined));
  textureCache.set(cacheKey, promise);
  return promise;
}

export function clearSuitTextureCache(): void {
  textureCache.clear();
}
