/** Vercel serverless request body limit (~4.5 MB). Use direct-to-R2 above this. */
export const VERCEL_DIRECT_UPLOAD_MAX_BYTES = 4 * 1024 * 1024;

/** Hard cap for attachment uploads (direct or presigned). */
export const MAX_ATTACHMENT_BYTES = 50 * 1024 * 1024;

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
