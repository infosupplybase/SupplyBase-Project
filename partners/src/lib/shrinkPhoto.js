/**
 * Makes a phone-camera photo small enough to send comfortably.
 *
 * A photo straight off a phone camera is 3–8 MB, and the apply form sends
 * three of them in one request. That is slow on mobile data and larger than
 * a proxy in front of the API may accept (nginx refuses anything over 1 MB
 * unless told otherwise, and the browser then only sees a failed request).
 * An ID card is perfectly readable at 1400 px on its longest side, so the
 * photo is redrawn at that size as a JPEG of a few hundred KB.
 *
 * Anything that goes wrong (an old browser, a format the browser cannot
 * draw) returns the original file untouched; the form's own checks and the
 * API still decide whether that file is acceptable.
 */

const MAX_SIDE = 1400;
const TARGET_BYTES = 300 * 1024;
const QUALITIES = [0.85, 0.75, 0.65, 0.5];

const toBlob = (canvas, quality) =>
  new Promise((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', quality);
  });

export default async function shrinkPhoto(file) {
  if (!file || typeof createImageBitmap !== 'function') return file;

  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file;
  }

  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size <= TARGET_BYTES) return file;

    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const context = canvas.getContext('2d');
    if (!context) return file;
    // JPEG has no transparency: a see-through PNG would otherwise turn black.
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

    let blob = null;
    for (const quality of QUALITIES) {
      blob = await toBlob(canvas, quality);
      if (!blob || blob.size <= TARGET_BYTES) break;
    }
    if (!blob || blob.size >= file.size) return file;

    const name = `${(file.name || 'photo').replace(/\.[^.]*$/, '')}.jpg`;
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
  } catch {
    return file;
  } finally {
    bitmap.close?.();
  }
}
