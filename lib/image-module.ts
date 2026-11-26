import { escapeHtmlText } from './sanitize';

const MAX_IMAGE_WIDTH = 1280;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export async function processLocalImageFile(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file (PNG, JPEG, WebP, or GIF).');
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

  if (file.type === 'image/gif') {
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
  const safeAlt = escapeHtmlText(altText.trim() || 'Article image');
  return `<figure><img src="${dataUrl}" alt="${safeAlt}" /><figcaption>${safeAlt}</figcaption></figure><p><br></p>`;
}
