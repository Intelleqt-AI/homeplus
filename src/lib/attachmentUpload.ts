import type { PresignedUpload } from '@/lib/messaging';

/** Per-type caps mirrored from the backend (apps/messaging/attachments.py) —
 * client-side check is just fast UX feedback; the server enforces the real limit. */
export const ATTACHMENT_LIMITS: Record<string, number> = {
  'image/jpeg': 20 * 1024 * 1024,
  'image/png': 20 * 1024 * 1024,
  'image/gif': 20 * 1024 * 1024,
  'image/webp': 20 * 1024 * 1024,
  'image/heic': 20 * 1024 * 1024,
  'image/heif': 20 * 1024 * 1024,
  'video/mp4': 100 * 1024 * 1024,
  'video/quicktime': 100 * 1024 * 1024,
  'video/webm': 100 * 1024 * 1024,
  'application/pdf': 25 * 1024 * 1024,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 25 * 1024 * 1024,
  'application/msword': 25 * 1024 * 1024,
};

export function validateAttachmentClientSide(file: File): string | null {
  const max = ATTACHMENT_LIMITS[file.type];
  if (max === undefined) return 'Unsupported file type.';
  if (file.size > max) return `File too large. Max size for this file type is ${max / (1024 * 1024)}MB.`;
  return null;
}

/** Upload a file straight to storage using the instructions from
 * presignAttachment(), reporting 0-100 progress via XHR (fetch has no
 * upload-progress event). Resolves once the upload completes. */
export function uploadAttachment(
  file: File,
  presigned: PresignedUpload,
  onProgress?: (pct: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const { method, url, fields } = presigned.upload;

    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`Upload failed (${xhr.status}).`));
    };
    xhr.onerror = () => reject(new Error('Upload failed — check your connection.'));
    xhr.onabort = () => reject(new Error('Upload cancelled.'));

    if (method === 'POST' && fields) {
      // Presigned S3 POST — multipart form with the signed fields, file last.
      const form = new FormData();
      Object.entries(fields).forEach(([k, v]) => form.append(k, v));
      form.append('file', file);
      xhr.open('POST', url, true);
      xhr.send(form);
    } else {
      // Local-dev fallback (PUT of the raw file, see AttachmentDevUploadView).
      xhr.open('PUT', url, true);
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
      xhr.send(file);
    }
  });
}
