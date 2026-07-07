import { z } from "zod";

// Students upload images straight from their computer: the browser downscales
// the file on a canvas and the result is stored inline as a JPEG data URL —
// no file server needed. Shared by every image field on the site (team hub
// images, return project pictures, …).
//
// The stored size is bounded: IMAGE_MAX_DATA_URL_LENGTH (~650 KB of binary)
// keeps documents far below Mongo's 16 MB limit, and the server-action
// `bodySizeLimit` in next.config.mjs is sized to carry a submission's worth
// of images.

export const IMAGE_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const IMAGE_MAX_DIMENSION = 1600;
export const IMAGE_JPEG_QUALITY = 0.85;
export const IMAGE_MAX_DATA_URL_LENGTH = 900_000;

// An uploaded data URL, or a plain http(s) URL from before uploads existed.
// Both patterns are FULLY anchored and character-restricted: a stored image is
// interpolated into a CSS `url("…")` on the public showcase and into `<a href>`
// elsewhere, so the value must not contain quotes, parentheses, angle brackets,
// backslashes or whitespace that could break out of those contexts.
export const isStoredImage = (value: string): boolean =>
  /^https?:\/\/[^\s"'()\\<>]+$/.test(value) ||
  /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(value);

/** Zod field for a stored image; empty string means "no image". */
export const optionalStoredImageSchema = z
  .string()
  .max(IMAGE_MAX_DATA_URL_LENGTH, { message: "Image is too large" })
  .refine((value) => value === "" || isStoredImage(value), {
    message: "Must be an uploaded image",
  });

/** Downscale a picked image on a canvas and return it as a JPEG data URL. Browser only. */
const compressImageToDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const scale = Math.min(
        1,
        IMAGE_MAX_DIMENSION / Math.max(image.width, image.height)
      );
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("Canvas is not available"));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", IMAGE_JPEG_QUALITY));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read the image"));
    };
    image.src = objectUrl;
  });

export type ProcessedImage =
  | { ok: true; dataUrl: string }
  | { ok: false; error: string };

/**
 * Validate and compress a picked file into a storable data URL, with a
 * human-readable error when it can't be. Browser only.
 */
export async function processImageFile(file: File): Promise<ProcessedImage> {
  if (file.size > IMAGE_MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `That file is too big — images can be up to ${IMAGE_MAX_UPLOAD_BYTES / (1024 * 1024)} MB`,
    };
  }
  try {
    const dataUrl = await compressImageToDataUrl(file);
    if (dataUrl.length > IMAGE_MAX_DATA_URL_LENGTH) {
      return {
        ok: false,
        error:
          "That image is too large even after scaling down — try a smaller one",
      };
    }
    return { ok: true, dataUrl };
  } catch {
    return { ok: false, error: "Could not read that image file" };
  }
}
