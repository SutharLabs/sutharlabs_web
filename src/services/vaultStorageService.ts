import { VaultFileItem, VaultStatsResponse } from '../types';

/**
 * Service to interact with the Oracle Cloud Storage Vault (VM1: sutharlabs-db-store)
 * via backend proxy endpoints or direct authenticated requests.
 */

export async function fetchVaultStats(token?: string): Promise<VaultStatsResponse> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/vault/stats', { headers });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch vault stats (HTTP ${res.status})`);
  }
  return res.json();
}

export async function fetchVaultFiles(token?: string): Promise<VaultFileItem[]> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch('/api/vault/files', { headers });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch vault files (HTTP ${res.status})`);
  }
  const data = await res.json();
  return data.files || [];
}

export async function uploadVaultFile(
  file: File, 
  category: string = 'General', 
  token?: string,
  onProgress?: (percent: number) => void
): Promise<VaultFileItem> {
  // Files over 3.5 MB are split into 3.5 MB sovereign chunks to bypass edge gateway limits (Vercel 4.5MB ceiling)
  // Uploads are processed with 3x parallel streams for saturating mobile 5G bandwidth
  const CHUNK_SIZE = Math.floor(3.5 * 1024 * 1024); // 3.5 MB chunks
  if (file.size > CHUNK_SIZE) {
    return uploadChunkedFile(file, category, token, onProgress);
  }
  return uploadSingleFile(file, category, token, onProgress);
}

/**
 * Direct single-request upload for small files (<= 3.5 MB)
 */
async function uploadSingleFile(
  file: File,
  category: string = 'General',
  token?: string,
  onProgress?: (percent: number) => void
): Promise<VaultFileItem> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    xhr.open('POST', '/api/vault/upload', true);
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      let json: any = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        // Non-JSON response (e.g. gateway HTML error or edge 413)
      }

      if (xhr.status >= 200 && xhr.status < 300 && json && json.success) {
        resolve(json.file);
      } else if (xhr.status === 413) {
        reject(new Error('File exceeds gateway request payload limit (HTTP 413). Chunked streaming upload required.'));
      } else if (json && json.error) {
        reject(new Error(json.error));
      } else {
        const errorSummary = xhr.responseText ? xhr.responseText.slice(0, 150).trim() : `HTTP ${xhr.status}`;
        reject(new Error(`Upload failed (${xhr.status}): ${errorSummary}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during file upload to vault.'));
    xhr.ontimeout = () => reject(new Error('File upload to vault timed out.'));
    xhr.timeout = 180000; // 3 minutes timeout
    xhr.send(formData);
  });
}

/**
 * High-Speed Parallel Chunked Streaming Upload for large files (> 3.5 MB, up to 250 MB+)
 * Slices file into 3.5 MB parts and uploads 3 chunks concurrently to maximize 5G mobile bandwidth
 */
async function uploadChunkedFile(
  file: File,
  category: string = 'General',
  token?: string,
  onProgress?: (percent: number) => void
): Promise<VaultFileItem> {
  const CHUNK_SIZE = Math.floor(3.5 * 1024 * 1024); // 3.5 MB chunks
  const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
  const uploadId = `vault_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  // Track loaded bytes across all parallel streams to yield a smooth aggregate progress bar
  const loadedBytes = new Array(totalChunks).fill(0);
  const updateAggregateProgress = () => {
    if (onProgress) {
      const totalLoaded = loadedBytes.reduce((acc, curr) => acc + curr, 0);
      const overallPercent = Math.min(98, Math.round((totalLoaded / file.size) * 100));
      onProgress(overallPercent);
    }
  };

  // Work queue of chunk indices
  const queue: number[] = Array.from({ length: totalChunks }, (_, i) => i);
  const CONCURRENCY = Math.min(3, totalChunks);

  const worker = async () => {
    while (queue.length > 0) {
      const chunkIndex = queue.shift();
      if (chunkIndex === undefined) break;

      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunkBlob = file.slice(start, end);
      const chunkTotalBytes = end - start;

      let attempt = 0;
      const maxAttempts = 3;
      let success = false;
      let lastError: any = null;

      while (attempt < maxAttempts && !success) {
        attempt++;
        try {
          await uploadSingleChunk({
            uploadId,
            chunkIndex,
            totalChunks,
            chunkBlob,
            fileName: file.name,
            fileType: file.type || 'application/octet-stream',
            totalSize: file.size,
            category,
            token,
            onChunkProgress: (bytesInChunk) => {
              loadedBytes[chunkIndex] = Math.min(bytesInChunk, chunkTotalBytes);
              updateAggregateProgress();
            }
          });
          loadedBytes[chunkIndex] = chunkTotalBytes;
          updateAggregateProgress();
          success = true;
        } catch (err: any) {
          lastError = err;
          console.warn(`[Vault Chunk Upload] Chunk ${chunkIndex + 1}/${totalChunks} attempt ${attempt} failed:`, err.message);
          if (attempt < maxAttempts) {
            await new Promise((r) => setTimeout(r, 600 * attempt));
          }
        }
      }

      if (!success) {
        throw new Error(`Failed to upload chunk ${chunkIndex + 1} of ${totalChunks}: ${lastError?.message || 'Network error'}`);
      }
    }
  };

  // Launch parallel workers
  const workers = Array.from({ length: CONCURRENCY }, () => worker());
  await Promise.all(workers);

  // All parallel slices arrived! Now trigger server assembly
  onProgress?.(99);
  const finalFile = await completeChunkedUpload({
    uploadId,
    totalChunks,
    fileName: file.name,
    fileType: file.type || 'application/octet-stream',
    totalSize: file.size,
    category,
    token
  });

  onProgress?.(100);
  return finalFile;
}

/**
 * Triggers server-side assembly of all uploaded chunks
 */
async function completeChunkedUpload(params: {
  uploadId: string;
  totalChunks: number;
  fileName: string;
  fileType: string;
  totalSize: number;
  category: string;
  token?: string;
}): Promise<VaultFileItem> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (params.token) headers['Authorization'] = `Bearer ${params.token}`;

  const res = await fetch('/api/vault/complete-chunk-upload', {
    method: 'POST',
    headers,
    body: JSON.stringify(params)
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) {
    throw new Error(data.error || `Failed to assemble uploaded file (HTTP ${res.status})`);
  }
  return data.file;
}

/**
 * Uploads an individual chunk to /api/vault/upload-chunk
 */
function uploadSingleChunk(params: {
  uploadId: string;
  chunkIndex: number;
  totalChunks: number;
  chunkBlob: Blob;
  fileName: string;
  fileType: string;
  totalSize: number;
  category: string;
  token?: string;
  onChunkProgress?: (bytesLoaded: number) => void;
}): Promise<{ success: boolean; file?: VaultFileItem; [key: string]: any }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('chunk', params.chunkBlob, params.fileName);
    formData.append('uploadId', params.uploadId);
    formData.append('chunkIndex', String(params.chunkIndex));
    formData.append('totalChunks', String(params.totalChunks));
    formData.append('fileName', params.fileName);
    formData.append('fileType', params.fileType);
    formData.append('totalSize', String(params.totalSize));
    formData.append('category', params.category);

    xhr.open('POST', '/api/vault/upload-chunk', true);
    if (params.token) {
      xhr.setRequestHeader('Authorization', `Bearer ${params.token}`);
    }

    if (xhr.upload && params.onChunkProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          params.onChunkProgress?.(event.loaded);
        }
      };
    }

    xhr.onload = () => {
      let json: any = null;
      try {
        json = JSON.parse(xhr.responseText);
      } catch {
        // Non-JSON response
      }

      if (xhr.status >= 200 && xhr.status < 300 && json && json.success) {
        resolve(json);
      } else if (xhr.status === 413) {
        reject(new Error(`Chunk ${params.chunkIndex + 1} exceeded gateway payload size.`));
      } else if (json && json.error) {
        reject(new Error(json.error));
      } else {
        const errorSummary = xhr.responseText ? xhr.responseText.slice(0, 150).trim() : `HTTP ${xhr.status}`;
        reject(new Error(`Chunk ${params.chunkIndex + 1} upload failed (${xhr.status}): ${errorSummary}`));
      }
    };

    xhr.onerror = () => reject(new Error(`Network error during chunk ${params.chunkIndex + 1} upload.`));
    xhr.ontimeout = () => reject(new Error(`Chunk ${params.chunkIndex + 1} upload timed out.`));
    xhr.timeout = 90000; // 90 seconds timeout per chunk
    xhr.send(formData);
  });
}

export async function deleteVaultFile(id: string, token?: string): Promise<void> {
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`/api/vault/files/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to delete file (HTTP ${res.status})`);
  }
}

export function getVaultDownloadUrl(id: string, token?: string): string {
  const query = token ? `?token=${encodeURIComponent(token)}` : '';
  return `/api/vault/download/${encodeURIComponent(id)}${query}`;
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

