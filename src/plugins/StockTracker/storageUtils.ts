import fs from "fs";
import path from "path";
import os from "os";
import { isBlobConfigured, saveJsonBlob, fetchJsonBlob } from "../../services/blobStorage.js";

// In-memory fallback map for environments where filesystem writes are completely restricted
const memoryCache = new Map<string, any>();

/**
 * Resolves a safe writable data directory across local development, Docker,
 * AWS Lambda, Vercel Serverless, and cloud container environments.
 */
export function getWritableDataDirectory(): string {
  // 1. Explicit environment override
  if (process.env.APP_DATA_DIR) {
    const custom = path.resolve(process.env.APP_DATA_DIR);
    try {
      if (!fs.existsSync(custom)) fs.mkdirSync(custom, { recursive: true });
      return custom;
    } catch {}
  }

  // 2. Serverless detection (Vercel, AWS Lambda, or /var/task read-only bundle)
  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    (typeof process.cwd === "function" && process.cwd().startsWith("/var/task"))
  );

  if (isServerless) {
    const tmpDir = path.join(os.tmpdir(), "sutharlabs-data");
    try {
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      return tmpDir;
    } catch {
      return os.tmpdir();
    }
  }

  // 3. Standard local project data directory
  const localDir = path.join(process.cwd(), "data");
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    // Verify write permissions
    const testFile = path.join(localDir, `.write_test_${Date.now()}`);
    fs.writeFileSync(testFile, "ok");
    fs.unlinkSync(testFile);
    return localDir;
  } catch {
    // Read-only filesystem detected, fallback to /tmp
    const fallbackTmp = path.join(os.tmpdir(), "sutharlabs-data");
    try {
      if (!fs.existsSync(fallbackTmp)) fs.mkdirSync(fallbackTmp, { recursive: true });
      return fallbackTmp;
    } catch {
      return os.tmpdir();
    }
  }
}

/**
 * Resolves the path to a data file in the writable directory.
 * If the file does not exist yet in writable storage, seeds it from the bundled project directory if present.
 */
export function resolveDataFilePath(fileName: string): string {
  const writableDir = getWritableDataDirectory();
  const targetPath = path.join(writableDir, fileName);

  if (!fs.existsSync(targetPath)) {
    const bundledPath = path.join(process.cwd(), "data", fileName);
    if (fs.existsSync(bundledPath)) {
      try {
        const seedContent = fs.readFileSync(bundledPath, "utf8");
        fs.writeFileSync(targetPath, seedContent, "utf8");
      } catch {
        // Non-fatal, readJsonData will fall back to bundledPath if write fails
      }
    }
  }

  return targetPath;
}

/**
 * Safely reads a JSON file with bundled data directory fallback and memory cache.
 */
export function readJsonData<T>(fileName: string, fallbackDefault: T): T {
  // Check memory cache first if present
  if (memoryCache.has(fileName)) {
    return memoryCache.get(fileName) as T;
  }

  const writablePath = resolveDataFilePath(fileName);
  try {
    if (fs.existsSync(writablePath)) {
      const data = JSON.parse(fs.readFileSync(writablePath, "utf8"));
      memoryCache.set(fileName, data);
      return data;
    }
  } catch (err) {
    console.warn(`[Storage] Failed reading ${writablePath}:`, err);
  }

  // Fallback check in bundled project data directory
  try {
    const bundledPath = path.join(process.cwd(), "data", fileName);
    if (fs.existsSync(bundledPath)) {
      const data = JSON.parse(fs.readFileSync(bundledPath, "utf8"));
      memoryCache.set(fileName, data);
      return data;
    }
  } catch {}

  memoryCache.set(fileName, fallbackDefault);
  return fallbackDefault;
}

/**
 * Safely writes a JSON file, catching and recovering from any EROFS or filesystem permissions errors.
 */
export function writeJsonData<T>(fileName: string, data: T): void {
  // Always update memory cache so subsequent reads within process reflect current state
  memoryCache.set(fileName, data);

  // Sync to Vercel Blob cloud storage asynchronously when configured
  if (isBlobConfigured()) {
    saveJsonBlob(`stock-analyzer/${fileName}`, data).catch((blobErr) => {
      console.warn(`[Storage] Background Vercel Blob sync failed for ${fileName}:`, blobErr);
    });
  }

  const targetPath = resolveDataFilePath(fileName);
  try {
    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(targetPath, JSON.stringify(data, null, 2), "utf8");
    return;
  } catch (err) {
    console.warn(`[Storage] Primary write failed for ${targetPath}:`, err);
  }

  // Secondary fallback: write directly to os.tmpdir()
  try {
    const tmpPath = path.join(os.tmpdir(), fileName);
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), "utf8");
  } catch (tmpErr) {
    console.warn(`[Storage] Secondary /tmp write failed for ${fileName}, relying on memory cache:`, tmpErr);
  }
}

/**
 * Loads a JSON file directly from Vercel Blob cloud storage if not found in local cache.
 */
export async function syncFromBlob<T>(fileName: string): Promise<T | null> {
  if (!isBlobConfigured()) return null;

  try {
    const blobData = await fetchJsonBlob<T>(`stock-analyzer/${fileName}`);
    if (blobData) {
      memoryCache.set(fileName, blobData);
      try {
        const targetPath = resolveDataFilePath(fileName);
        const dir = path.dirname(targetPath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(targetPath, JSON.stringify(blobData, null, 2), "utf8");
      } catch {}
      return blobData;
    }
  } catch (err) {
    console.warn(`[Storage] Failed to sync ${fileName} from Vercel Blob:`, err);
  }
  return null;
}

/**
 * Safely removes a JSON file from writable directory and memory cache.
 */
export function deleteJsonData(fileName: string): void {
  memoryCache.delete(fileName);
  try {
    const targetPath = resolveDataFilePath(fileName);
    if (fs.existsSync(targetPath)) {
      fs.unlinkSync(targetPath);
    }
  } catch (err) {
    console.warn(`[Storage] Failed deleting ${fileName}:`, err);
  }
}
