/* ---------------------------------------------------------------------------
   PHOTOS ON THE DEVICE (Nidz 1.7).

   A photograph the person chooses — their animal, their profile — is reduced
   in the browser to a small JPEG and kept as a data URL in this browser's
   storage. Nothing is uploaded: there is no server. Reducing it matters twice
   over: localStorage holds a few megabytes for the whole app, and a phone
   photo is several on its own; and a smaller image carries less of what the
   person did not mean to share (EXIF location is dropped by re-encoding).
   ------------------------------------------------------------------------ */

export const PHOTO_MAX_EDGE = 640;
const ACCEPTED = /^image\/(jpeg|png|webp|heic|heif)$/;

export type PhotoResult = { ok: true; dataUrl: string } | { ok: false; reason: "type" | "read" };

export function isAcceptedImage(file: File): boolean {
  return ACCEPTED.test(file.type) || /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
}

/** Read, downscale to `PHOTO_MAX_EDGE` on the long side and re-encode. */
export async function photoToDataUrl(file: File, maxEdge = PHOTO_MAX_EDGE): Promise<PhotoResult> {
  if (!isAcceptedImage(file)) return { ok: false, reason: "type" };
  try {
    const url = URL.createObjectURL(file);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("decode"));
        img.src = url;
      });
      const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight));
      const width = Math.max(1, Math.round(image.naturalWidth * scale));
      const height = Math.max(1, Math.round(image.naturalHeight * scale));
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext("2d");
      if (!context) return { ok: false, reason: "read" };
      context.drawImage(image, 0, 0, width, height);
      return { ok: true, dataUrl: canvas.toDataURL("image/jpeg", 0.82) };
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch {
    return { ok: false, reason: "read" };
  }
}
