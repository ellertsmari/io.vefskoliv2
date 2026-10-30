"use client";
import { upload } from "@vercel/blob/client";
import {
  IMAGE_JPEG_QUALITY,
  IMAGE_MAX_DIMENSION,
  IMAGE_MAX_UPLOAD_BYTES,
  UPLOAD_ENDPOINT,
} from "./imageUpload";

// The browser half of image upload: downscale on a canvas, then send the bytes
// straight to Vercel Blob and hand back the URL to store. See ./imageUpload for
// the shared constants and the validation the server applies to what comes back.

/** Downscale a picked image on a canvas. Browser only. */
const compressImage = (file: File): Promise<Blob> =>
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
      canvas.toBlob(
        (blob) =>
          blob ? resolve(blob) : reject(new Error("Could not encode the image")),
        "image/jpeg",
        IMAGE_JPEG_QUALITY
      );
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read the image"));
    };
    image.src = objectUrl;
  });

export type ProcessedImage =
  | { ok: true; url: string }
  | { ok: false; error: string };

/**
 * Validate, compress and upload a picked file, returning the stored URL or a
 * human-readable reason it could not be. Browser only.
 *
 * `prefix` groups uploads in the store by what they belong to ("team-photo",
 * "return-picture"), which makes the store browsable and lets an operator find
 * everything of one kind. The filename itself gets a random suffix server-side,
 * so URLs are unguessable and a replacement never collides with what it
 * replaced.
 */
export async function processImageFile(
  file: File,
  prefix = "image"
): Promise<ProcessedImage> {
  if (file.size > IMAGE_MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      error: `That file is too big — images can be up to ${IMAGE_MAX_UPLOAD_BYTES / (1024 * 1024)} MB`,
    };
  }

  // A GIF goes up untouched: drawing it on a canvas would keep only the first
  // frame and turn an animation into a still. It is not downscaled, so the
  // size limit above is the only bound on it.
  const isGif = file.type === "image/gif";

  let body: Blob;
  if (isGif) {
    body = file;
  } else {
    try {
      body = await compressImage(file);
    } catch {
      return { ok: false, error: "Could not read that image file" };
    }
  }

  try {
    const result = await upload(
      `${prefix}/${Date.now()}.${isGif ? "gif" : "jpg"}`,
      body,
      {
        access: "public",
        contentType: isGif ? "image/gif" : "image/jpeg",
        handleUploadUrl: UPLOAD_ENDPOINT,
      }
    );
    return { ok: true, url: result.url };
  } catch (error) {
    // Most likely causes: the session expired, or the Blob store is not
    // configured / over its limit. Either way the student can retry.
    return {
      ok: false,
      error:
        error instanceof Error && error.message
          ? `Upload failed — ${error.message}`
          : "Upload failed — please try again",
    };
  }
}
