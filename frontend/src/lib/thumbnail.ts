/**
 * Generates a 160×90 JPEG data URL thumbnail from animation code + title.
 * Uses canvas — works entirely in the browser, no dependencies needed.
 */
export function createCodeThumbnail(code: string, title: string): string {
  if (typeof document === 'undefined') return '';

  const canvas = document.createElement('canvas');
  canvas.width = 160;
  canvas.height = 90;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Extract backgroundColor from code (e.g. backgroundColor: '#0a0a0a')
  const bgMatch = code.match(/backgroundColor\s*:\s*['"]([^'"]+)['"]/);
  const bg = bgMatch?.[1] ?? '#0d0d1a';

  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, 160, 90);

  // Gradient sheen
  const grad = ctx.createLinearGradient(0, 0, 160, 90);
  grad.addColorStop(0, 'rgba(59,130,246,0.18)');
  grad.addColorStop(1, 'rgba(0,243,255,0.08)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 160, 90);

  // App name
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = 'bold 13px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const label = title.length > 18 ? title.slice(0, 16) + '…' : title;
  ctx.fillText(label, 80, 42);

  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.font = '8px Inter, sans-serif';
  ctx.fillText('AI Generated', 80, 60);

  return canvas.toDataURL('image/jpeg', 0.7);
}

/**
 * Resize + center-crop a File to a 160×90 JPEG data URL.
 */
export async function createScreenshotThumbnail(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 90;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('no canvas')); return; }
      const targetAr = 16 / 9;
      const ar = img.width / img.height;
      let sx = 0, sy = 0, sw = img.width, sh = img.height;
      if (ar > targetAr) {
        sw = img.height * targetAr;
        sx = (img.width - sw) / 2;
      } else {
        sh = img.width / targetAr;
        sy = (img.height - sh) / 2;
      }
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, 160, 90);
      resolve(canvas.toDataURL('image/jpeg', 0.6));
    };
    img.onerror = reject;
    img.src = url;
  });
}
