import { z } from "zod";

// Constants and validation for stored images, shared by the browser upload
// path (utils/imageUploadClient), the server actions that persist the value,
// and the route that mints upload tokens (app/api/blob/upload).
//
// Students upload images straight from their computer: the browser downscales
// the file on a canvas, then sends it directly to Vercel Blob and stores only
// the resulting URL. Shared by every image field on the site (team hub images,
// return project pictures, …).
//
// This used to inline the compressed image as a base64 data URL inside the
// Mongo document. That worked at a handful of images, but group work asks
// every team for three, so the documents — and every list query and every RSC
// payload that touched them — grew by a cohort's worth of base64 each year,
// and none of it could ever be cached by a browser or a CDN.
//
// Values already stored as data URLs keep working: they still render, still
// validate, and are replaced by a blob URL the next time someone re-uploads.

export const IMAGE_MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
export const IMAGE_MAX_DIMENSION = 1600;
export const IMAGE_JPEG_QUALITY = 0.85;
/** Legacy bound: only data URLs stored before the move to Blob are this long. */
export const IMAGE_MAX_DATA_URL_LENGTH = 900_000;

export const IMAGE_ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

/** The route that mints client upload tokens (app/api/blob/upload). */
export const UPLOAD_ENDPOINT = "/api/blob/upload";

// A blob URL, a legacy http(s) URL from before uploads existed, or a legacy
// inline data URL. All three patterns are FULLY anchored and character-
// restricted: a stored image is interpolated into `<img src>` and, elsewhere,
// into `<a href>`, so the value must not contain quotes, parentheses, angle
// brackets, backslashes or whitespace that could break out of those contexts.
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

/** True for images this app put in blob storage (so it may delete them). */
export const isBlobImage = (value: string): boolean =>
  /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/[^\s"'()\\<>]+$/.test(
    value
  );
