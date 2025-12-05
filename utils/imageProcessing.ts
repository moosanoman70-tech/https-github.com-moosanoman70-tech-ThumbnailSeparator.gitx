import { BoundingBox } from "../types";

/**
 * Extracts a crop from the source image based on a normalized bounding box.
 * Returns a Data URL.
 */
export const cropLayer = (
  imageElement: HTMLImageElement,
  box: BoundingBox
): string => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) return "";

  const width = imageElement.naturalWidth;
  const height = imageElement.naturalHeight;

  // Calculate pixel coordinates
  const sx = box.xmin * width;
  const sy = box.ymin * height;
  const sw = (box.xmax - box.xmin) * width;
  const sh = (box.ymax - box.ymin) * height;

  // Add a small padding to ensure we capture edges, but clip to bounds
  const padding = 0; 

  canvas.width = sw;
  canvas.height = sh;

  ctx.drawImage(
    imageElement,
    sx - padding,
    sy - padding,
    sw + padding * 2,
    sh + padding * 2,
    0,
    0,
    sw,
    sh
  );

  return canvas.toDataURL("image/png");
};

/**
 * Utility to download data as a file
 */
export const downloadFile = (dataUrl: string, filename: string) => {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
