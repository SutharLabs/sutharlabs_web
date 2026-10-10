/**
 * Pure Web Standards ZIP Archive Reader
 * Zero external dependencies. Uses browser-native DecompressionStream('deflate-raw')
 * to parse and decompress OOXML files (.docx, .pptx, .xlsx) and zip archives.
 */

export interface ZipEntry {
  name: string;
  compressedSize: number;
  uncompressedSize: number;
  compressionMethod: number; // 0 = stored, 8 = deflate
  dataOffset: number;
}

/**
 * Decompresses raw DEFLATE bytes using browser standard DecompressionStream
 */
export async function decompressDeflate(compressedData: Uint8Array): Promise<Uint8Array> {
  if (typeof DecompressionStream !== 'undefined') {
    try {
      const blob = new Blob([compressedData]);
      const ds = new DecompressionStream('deflate-raw');
      const decompressedStream = blob.stream().pipeThrough(ds);
      const buffer = await new Response(decompressedStream).arrayBuffer();
      return new Uint8Array(buffer);
    } catch {
      // If deflate-raw fails, try standard deflate header
      try {
        const ds2 = new DecompressionStream('deflate');
        const decompressedStream2 = new Blob([compressedData]).stream().pipeThrough(ds2);
        const buffer2 = await new Response(decompressedStream2).arrayBuffer();
        return new Uint8Array(buffer2);
      } catch (e) {
        console.warn('DecompressionStream failed:', e);
      }
    }
  }
  return compressedData;
}

/**
 * Unzips an ArrayBuffer into a Map of fileName -> Uint8Array
 */
export async function unzipArchive(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const result = new Map<string, Uint8Array>();
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // 1. Locate End of Central Directory Record (EOCD) by scanning backwards from end
  let eocdOffset = -1;
  const maxScan = Math.min(buffer.byteLength, 65557);
  for (let i = buffer.byteLength - 22; i >= buffer.byteLength - maxScan; i--) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }

  if (eocdOffset === -1) {
    // EOCD not found, try scanning local headers from start
    return parseViaLocalHeaders(buffer);
  }

  const totalEntries = view.getUint16(eocdOffset + 10, true);
  const centralDirOffset = view.getUint32(eocdOffset + 16, true);

  // 2. Iterate Central Directory entries
  let cdPtr = centralDirOffset;
  const decoder = new TextDecoder('utf-8');

  for (let idx = 0; idx < totalEntries && cdPtr < eocdOffset; idx++) {
    if (view.getUint32(cdPtr, true) !== 0x02014b50) break;

    const method = view.getUint16(cdPtr + 10, true);
    const compSize = view.getUint32(cdPtr + 20, true);
    const uncompSize = view.getUint32(cdPtr + 24, true);
    const nameLen = view.getUint16(cdPtr + 28, true);
    const extraLen = view.getUint16(cdPtr + 30, true);
    const commentLen = view.getUint16(cdPtr + 32, true);
    const localHeaderOffset = view.getUint32(cdPtr + 42, true);

    const nameBytes = bytes.subarray(cdPtr + 46, cdPtr + 46 + nameLen);
    const entryName = decoder.decode(nameBytes);

    cdPtr += 46 + nameLen + extraLen + commentLen;

    // Skip directories
    if (entryName.endsWith('/')) continue;

    // 3. Find data offset from local header
    if (localHeaderOffset + 30 > buffer.byteLength) continue;
    if (view.getUint32(localHeaderOffset, true) !== 0x04034b50) continue;

    const localNameLen = view.getUint16(localHeaderOffset + 26, true);
    const localExtraLen = view.getUint16(localHeaderOffset + 28, true);
    const dataStart = localHeaderOffset + 30 + localNameLen + localExtraLen;
    const rawCompressedData = bytes.subarray(dataStart, dataStart + compSize);

    if (method === 0) {
      // Uncompressed
      result.set(entryName, rawCompressedData);
    } else if (method === 8) {
      // Deflate
      const decompressed = await decompressDeflate(rawCompressedData);
      result.set(entryName, decompressed);
    }
  }

  return result;
}

/**
 * Fallback parser iterating local headers directly from start of buffer
 */
async function parseViaLocalHeaders(buffer: ArrayBuffer): Promise<Map<string, Uint8Array>> {
  const result = new Map<string, Uint8Array>();
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);
  const decoder = new TextDecoder('utf-8');
  let ptr = 0;

  while (ptr + 30 <= buffer.byteLength) {
    const sig = view.getUint32(ptr, true);
    if (sig !== 0x04034b50) break; // End of local files

    const method = view.getUint16(ptr + 8, true);
    const compSize = view.getUint32(ptr + 18, true);
    const nameLen = view.getUint16(ptr + 26, true);
    const extraLen = view.getUint16(ptr + 28, true);

    const nameBytes = bytes.subarray(ptr + 30, ptr + 30 + nameLen);
    const entryName = decoder.decode(nameBytes);

    const dataStart = ptr + 30 + nameLen + extraLen;
    if (compSize > 0 && dataStart + compSize <= buffer.byteLength && !entryName.endsWith('/')) {
      const rawData = bytes.subarray(dataStart, dataStart + compSize);
      if (method === 0) {
        result.set(entryName, rawData);
      } else if (method === 8) {
        const decompressed = await decompressDeflate(rawData);
        result.set(entryName, decompressed);
      }
    }

    ptr = dataStart + compSize;
  }

  return result;
}

/**
 * Utility to extract a UTF-8 text file from unzipped entries map
 */
export function getZipEntryAsText(entries: Map<string, Uint8Array>, path: string): string | null {
  const entry = entries.get(path);
  if (!entry) return null;
  return new TextDecoder('utf-8').decode(entry);
}
