import crypto from 'crypto';

/**
 * SutharLabs Plugin Encryption & Packaging Security Module
 * 
 * Provides AES-256-GCM authenticated encryption for plugin archives.
 * Encrypted packages prevent raw source code exposure in downloaded archives,
 * while allowing runtime loading of both encrypted and unencoded raw zip files.
 */

// Magic 4-byte header identifying encrypted SutharLabs plugin packages ("SLPK")
export const SLPK_MAGIC = Buffer.from([0x53, 0x4C, 0x50, 0x4B]);
export const SLPK_VERSION = 0x01;

// Master default secret if not explicitly configured in environment
const DEFAULT_SYSTEM_SECRET = 'sutharlabs-plugin-vault-v1-k9f8a37b1c2e4d5f-2026';

function getEncryptionKey(secret?: string): Buffer {
  const pass = secret || process.env.PLUGIN_ENCRYPTION_SECRET || DEFAULT_SYSTEM_SECRET;
  // Derive 32-byte key via SHA-256
  return crypto.createHash('sha256').update(pass, 'utf-8').digest();
}

/**
 * Checks whether a buffer is an encrypted SutharLabs plugin package
 */
export function isEncryptedPluginPackage(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 33) return false; // 4 magic + 1 ver + 12 iv + 16 tag = 33 min
  return (
    buffer[0] === SLPK_MAGIC[0] &&
    buffer[1] === SLPK_MAGIC[1] &&
    buffer[2] === SLPK_MAGIC[2] &&
    buffer[3] === SLPK_MAGIC[3]
  );
}

/**
 * Checks whether a buffer is a standard unencoded ZIP archive (PK\x03\x04 or PK\x05\x06)
 */
export function isRawZipArchive(buffer: Buffer): boolean {
  if (!buffer || buffer.length < 4) return false;
  return buffer[0] === 0x50 && buffer[1] === 0x4B; // 'P', 'K'
}

/**
 * Encrypts a raw ZIP archive into a secured SutharLabs package (.zip)
 * 
 * Output layout:
 * [0..3]:   'SLPK' (Magic)
 * [4]:      0x01 (Version)
 * [5..16]:  12-byte IV (Nonce)
 * [17..32]: 16-byte Auth Tag (AES-GCM)
 * [33..]:   Encrypted Ciphertext
 */
export function encryptPluginPackage(rawBuffer: Buffer, secret?: string): Buffer {
  const key = getEncryptionKey(secret);
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(rawBuffer), cipher.final()]);
  const tag = cipher.getAuthTag();

  const version = Buffer.from([SLPK_VERSION]);

  return Buffer.concat([SLPK_MAGIC, version, iv, tag, encrypted]);
}

/**
 * Decrypts an encrypted SutharLabs plugin package back into its raw ZIP buffer
 */
export function decryptPluginPackage(encryptedBuffer: Buffer, secret?: string): Buffer {
  if (!isEncryptedPluginPackage(encryptedBuffer)) {
    throw new Error('Not an encrypted SutharLabs plugin package (missing SLPK header).');
  }

  const version = encryptedBuffer[4];
  if (version !== SLPK_VERSION) {
    throw new Error(`Unsupported package encryption version: ${version}`);
  }

  const iv = encryptedBuffer.subarray(5, 17);
  const tag = encryptedBuffer.subarray(17, 33);
  const ciphertext = encryptedBuffer.subarray(33);

  const key = getEncryptionKey(secret);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);

  try {
    const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
    return decrypted;
  } catch (err: any) {
    throw new Error('Failed to decrypt plugin package: corrupted archive or invalid authentication key.');
  }
}

/**
 * Universal loader: Accepts either an encrypted zip package or an unencoded raw zip.
 * Automatically decrypts if encrypted, or passes through if unencoded.
 */
export function resolvePluginArchiveBuffer(
  inputBuffer: Buffer,
  secret?: string
): { rawZipBuffer: Buffer; isEncrypted: boolean; format: 'encrypted_slpk' | 'raw_zip' | 'unknown' } {
  if (isEncryptedPluginPackage(inputBuffer)) {
    const rawZipBuffer = decryptPluginPackage(inputBuffer, secret);
    return {
      rawZipBuffer,
      isEncrypted: true,
      format: 'encrypted_slpk'
    };
  }

  if (isRawZipArchive(inputBuffer)) {
    return {
      rawZipBuffer: inputBuffer,
      isEncrypted: false,
      format: 'raw_zip'
    };
  }

  // Fallback / pass-through
  return {
    rawZipBuffer: inputBuffer,
    isEncrypted: false,
    format: 'unknown'
  };
}
