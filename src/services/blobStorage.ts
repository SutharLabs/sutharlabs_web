import { put, del, list, head, PutBlobResult, ListBlobResult, HeadBlobResult } from "@vercel/blob";
import crypto from "crypto";

export interface BlobUploadOptions {
  access?: "public";
  addRandomSuffix?: boolean;
  contentType?: string;
  token?: string;
}

/**
 * Returns true if the Vercel Blob read/write token is present in the environment.
 */
export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Uploads a file buffer or string to Vercel Blob Storage.
 * Defaults to public access and reads process.env.BLOB_READ_WRITE_TOKEN.
 */
export async function uploadToBlob(
  pathname: string,
  body: string | Buffer | Blob | ArrayBuffer,
  options: BlobUploadOptions = {}
): Promise<PutBlobResult> {
  const token = options.token || process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("Vercel Blob Storage is not configured. BLOB_READ_WRITE_TOKEN is missing.");
  }

  const result = await put(pathname, body, {
    access: options.access || "public",
    addRandomSuffix: options.addRandomSuffix !== undefined ? options.addRandomSuffix : true,
    contentType: options.contentType,
    token
  });

  return result;
}

/**
 * Deletes one or multiple blobs from Vercel Blob Storage by URL.
 */
export async function deleteFromBlob(
  urlOrUrls: string | string[],
  options: { token?: string } = {}
): Promise<void> {
  const token = options.token || process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return;

  await del(urlOrUrls, { token });
}

/**
 * Lists blobs stored in the bucket with optional prefix and pagination.
 */
export async function listStoredBlobs(options: {
  prefix?: string;
  limit?: number;
  cursor?: string;
  token?: string;
} = {}): Promise<ListBlobResult> {
  const token = options.token || process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is missing.");
  }

  return await list({
    prefix: options.prefix,
    limit: options.limit,
    cursor: options.cursor,
    token
  });
}

/**
 * Fetches metadata for an existing blob.
 */
export async function getBlobMetadata(
  url: string,
  options: { token?: string } = {}
): Promise<HeadBlobResult | null> {
  const token = options.token || process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) return null;

  try {
    return await head(url, { token });
  } catch (err) {
    console.warn(`[Blob Storage] Failed to get metadata for ${url}:`, err);
    return null;
  }
}

/**
 * Saves arbitrary JSON state into Vercel Blob storage.
 */
export async function saveJsonBlob<T>(
  pathname: string,
  data: T,
  options: { addRandomSuffix?: boolean } = { addRandomSuffix: false }
): Promise<PutBlobResult | null> {
  if (!isBlobConfigured()) return null;

  try {
    const jsonString = JSON.stringify(data, null, 2);
    return await uploadToBlob(pathname, jsonString, {
      access: "public",
      addRandomSuffix: options.addRandomSuffix,
      contentType: "application/json"
    });
  } catch (err) {
    console.error(`[Blob Storage] Failed to save JSON blob to ${pathname}:`, err);
    return null;
  }
}

/**
 * Downloads and parses JSON state from a Vercel Blob public URL or searches by pathname prefix.
 */
export async function fetchJsonBlob<T>(pathnameOrUrl: string): Promise<T | null> {
  if (!isBlobConfigured()) return null;

  try {
    let fetchUrl = pathnameOrUrl;
    if (!pathnameOrUrl.startsWith("http://") && !pathnameOrUrl.startsWith("https://")) {
      const listing = await listStoredBlobs({ prefix: pathnameOrUrl, limit: 1 });
      if (!listing.blobs || listing.blobs.length === 0) {
        return null;
      }
      fetchUrl = listing.blobs[0].url;
    }

    const res = await fetch(fetchUrl);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[Blob Storage] Failed to load JSON blob from ${pathnameOrUrl}:`, err);
    return null;
  }
}

/**
 * Verifies a Vercel Blob webhook signature (Ed25519 asymmetric signature).
 */
export function verifyBlobWebhookSignature(
  payload: string | Buffer,
  signatureBase64: string,
  publicKeyPem?: string
): boolean {
  try {
    const pem = publicKeyPem || process.env.BLOB_WEBHOOK_PUBLIC_KEY;
    if (!pem || !signatureBase64) return false;
    const publicKey = crypto.createPublicKey(pem);
    const signature = Buffer.from(signatureBase64, "base64");
    const data = Buffer.isBuffer(payload) ? payload : Buffer.from(payload, "utf8");
    return crypto.verify(null, data, publicKey, signature);
  } catch (err) {
    console.warn("[Blob Webhook] Verification error:", err);
    return false;
  }
}

