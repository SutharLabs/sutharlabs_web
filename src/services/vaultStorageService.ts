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
      try {
        const json = JSON.parse(xhr.responseText);
        if (xhr.status >= 200 && xhr.status < 300 && json.success) {
          resolve(json.file);
        } else {
          reject(new Error(json.error || `Upload failed with status ${xhr.status}`));
        }
      } catch (e: any) {
        reject(new Error(`Server returned invalid response: ${e.message}`));
      }
    };

    xhr.onerror = () => reject(new Error('Network error during file upload to vault.'));
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

