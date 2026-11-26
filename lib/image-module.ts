import { escapeHtmlText } from './sanitize';

const MAX_IMAGE_WIDTH = 1280;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_RASTER_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/avif',
]);
const SAFE_IMAGE_SRC_RE =
  /^(?:https:\/\/[^\s"'<>]+|data:image\/(?:png|jpeg|jpg|gif|webp|avif);base64,[A-Za-z0-9+/=]+)$/i;

export async function processLocalImageFile(file: File): Promise<string> {
  if (!ALLOWED_RASTER_TYPES.has(file.type.toLowerCase())) {
    throw new Error('Please choose a PNG, JPEG, WebP, GIF, or AVIF image file.');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('Image exceeds the 8 MB limit. Choose a smaller file.');
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Could not read the selected image.'));
      }
    };
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(file);
  });

  if (file.type === 'image/gif' || file.type === 'image/avif') {
    return dataUrl;
  }

  return new Promise<string>((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.width <= MAX_IMAGE_WIDTH) {
        resolve(dataUrl);
        return;
      }
      const scale = MAX_IMAGE_WIDTH / img.width;
      const canvas = document.createElement('canvas');
      canvas.width = MAX_IMAGE_WIDTH;
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const outputMime = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
      resolve(canvas.toDataURL(outputMime, 0.86));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

export function buildImageFigureHtml(dataUrl: string, altText: string): string {
  const trimmedSrc = dataUrl.trim();
  if (!SAFE_IMAGE_SRC_RE.test(trimmedSrc)) {
    throw new Error('Unsupported or unsafe image format.');
  }
  const safeSrc = escapeHtmlText(trimmedSrc);
  const safeAlt = escapeHtmlText(altText.trim() || 'Article image');
  return `<figure><img src="${safeSrc}" alt="${safeAlt}" /><figcaption>${safeAlt}</figcaption></figure><p><br></p>`;
}
