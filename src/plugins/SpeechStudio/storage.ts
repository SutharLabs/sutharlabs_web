import fs from 'fs';
import path from 'path';
import os from 'os';
import { ClonedVoiceProfile } from './types.js';
import { getScopedDb } from '../../services/scopedDatabase.js';
import { createPluginLogger } from '../common/pluginLogger.js';

const logger = createPluginLogger('speech-studio', 'storage');

export interface StoredClonedVoiceProfile extends ClonedVoiceProfile {
  userId?: string;
  audioSampleFile?: string;
}

/**
 * Resolves persistent storage directory for Speech Studio voice profiles and audio assets.
 */
export function getSpeechDataDirectory(): string {
  if (process.env.APP_DATA_DIR) {
    const custom = path.resolve(process.env.APP_DATA_DIR, 'speech');
    try {
      if (!fs.existsSync(custom)) fs.mkdirSync(custom, { recursive: true });
      return custom;
    } catch {}
  }

  const isServerless = Boolean(
    process.env.VERCEL ||
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    process.env.LAMBDA_TASK_ROOT ||
    (typeof process.cwd === 'function' && process.cwd().startsWith('/var/task'))
  );

  if (isServerless) {
    const tmpDir = path.join(os.tmpdir(), 'sutharlabs-speech');
    try {
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
      return tmpDir;
    } catch {
      return os.tmpdir();
    }
  }

  const localDir = path.join(process.cwd(), 'data', 'speech');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    return localDir;
  } catch {
    const fallbackTmp = path.join(os.tmpdir(), 'sutharlabs-speech');
    try {
      if (!fs.existsSync(fallbackTmp)) fs.mkdirSync(fallbackTmp, { recursive: true });
      return fallbackTmp;
    } catch {
      return os.tmpdir();
    }
  }
}

function getProfilesFilePath(): string {
  const dir = getSpeechDataDirectory();
  return path.join(dir, 'cloned_profiles.json');
}

function getSamplesDirectory(): string {
  const dir = getSpeechDataDirectory();
  const samplesDir = path.join(dir, 'samples');
  if (!fs.existsSync(samplesDir)) {
    try {
      fs.mkdirSync(samplesDir, { recursive: true });
    } catch {}
  }
  return samplesDir;
}

// In-memory cache synced with disk
let cachedProfiles: StoredClonedVoiceProfile[] | null = null;

function loadProfilesFromDisk(): StoredClonedVoiceProfile[] {
  const filePath = getProfilesFilePath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (err: any) {
    logger.warn('Error reading cloned_profiles.json from disk', { error: err?.message });
  }
  return [];
}

function writeProfilesToDisk(profiles: StoredClonedVoiceProfile[]): void {
  const filePath = getProfilesFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(profiles, null, 2), 'utf8');
  } catch (err: any) {
    logger.error('Error writing cloned_profiles.json to disk', err);
  }
}

/**
 * Retrieve all cloned voice profiles accessible to the user (sync version with disk fallback).
 */
export function getClonedVoiceProfiles(userId?: string): ClonedVoiceProfile[] {
  if (cachedProfiles === null) {
    cachedProfiles = loadProfilesFromDisk();
  }

  const samplesDir = getSamplesDirectory();

  const matched = !userId || userId.startsWith('ip:')
    ? cachedProfiles
    : cachedProfiles.filter(p => !p.userId || p.userId === userId || p.userId === 'workspace');

  return matched.map(p => {
    let audioUrl = p.sampleAudioDataUrl;
    if (!audioUrl && p.audioSampleFile) {
      const fullSamplePath = path.join(samplesDir, p.audioSampleFile);
      if (fs.existsSync(fullSamplePath)) {
        try {
          const buf = fs.readFileSync(fullSamplePath);
          const ext = path.extname(p.audioSampleFile).replace('.', '') || 'wav';
          audioUrl = `data:audio/${ext};base64,${buf.toString('base64')}`;
        } catch {}
      }
    }
    return {
      ...p,
      sampleAudioDataUrl: audioUrl
    };
  });
}

/**
 * Retrieve all cloned voice profiles accessible to the user with automatic PostgreSQL tenant sync.
 */
export async function getClonedVoiceProfilesAsync(userEmail?: string): Promise<ClonedVoiceProfile[]> {
  const span = logger.startSpan('storage.getClonedVoiceProfilesAsync', { userEmail });
  try {
    const memoryProfiles = getClonedVoiceProfiles(userEmail);

    if (userEmail && !userEmail.startsWith('ip:')) {
      try {
        const scopedDb = getScopedDb(userEmail);
        const dbVoices = await scopedDb.voices.list();

        for (const v of dbVoices) {
          const existing = memoryProfiles.find(p => p.name.toLowerCase() === v.name.toLowerCase() || p.id === v.id);
          if (!existing) {
            const hydrated: ClonedVoiceProfile = {
              id: v.id,
              name: v.name,
              description: `${v.name} custom replicated voice`,
              createdAt: v.createdAt.toISOString(),
              sampleDurationSec: 5,
              sampleAudioDataUrl: v.sampleAudioBase64 || '',
              verifiedAudioUrl: '',
              architecture: v.architecture,
              usageTag: 'Personal Replicated',
              referenceText: v.referenceText || '',
              language: v.language,
              languageLabel: v.accent || 'Studio',
              gender: (v.gender as any) || 'male',
              emotionTag: 'Warm & Natural',
              commercialUse: 'commercial_safe',
              commercialLabel: 'Commercial Safe (Self-Owned)'
            };
            memoryProfiles.push(hydrated);
            if (cachedProfiles && !cachedProfiles.some(cp => cp.id === v.id)) {
              cachedProfiles.push({ ...hydrated, userId: userEmail });
            }
          } else if (!existing.sampleAudioDataUrl && v.sampleAudioBase64) {
            existing.sampleAudioDataUrl = v.sampleAudioBase64;
          }
        }
      } catch (dbErr: any) {
        logger.warn('PostgreSQL voice sync fallback to local cache', { error: dbErr?.message });
      }
    }

    span.end({ count: memoryProfiles.length });
    return memoryProfiles;
  } catch (err: any) {
    span.fail(err);
    return getClonedVoiceProfiles(userEmail);
  }
}

/**
 * Persist a newly created or updated cloned voice profile to disk, memory, and PostgreSQL.
 */
export function saveClonedVoiceProfile(profile: ClonedVoiceProfile, userId?: string): ClonedVoiceProfile {
  if (cachedProfiles === null) {
    cachedProfiles = loadProfilesFromDisk();
  }

  const stored: StoredClonedVoiceProfile = {
    ...profile,
    userId: userId || 'workspace'
  };

  if (profile.sampleAudioDataUrl && profile.sampleAudioDataUrl.startsWith('data:audio/')) {
    try {
      const parts = profile.sampleAudioDataUrl.split(',');
      if (parts.length === 2) {
        const mimeMatch = parts[0].match(/data:audio\/([a-zA-Z0-9_-]+)/);
        const format = mimeMatch ? mimeMatch[1] : 'wav';
        const rawBuffer = Buffer.from(parts[1], 'base64');
        const filename = `${profile.id}.${format}`;
        const samplesDir = getSamplesDirectory();
        fs.writeFileSync(path.join(samplesDir, filename), rawBuffer);
        stored.audioSampleFile = filename;
      }
    } catch (saveAudioErr: any) {
      logger.warn('Could not persist audio sample file to disk', { error: saveAudioErr?.message });
    }
  }

  const existingIdx = cachedProfiles.findIndex(p => p.id === profile.id);
  if (existingIdx >= 0) {
    cachedProfiles[existingIdx] = stored;
  } else {
    cachedProfiles.unshift(stored);
  }

  writeProfilesToDisk(cachedProfiles);

  // Background non-blocking sync to PostgreSQL
  if (userId && !userId.startsWith('ip:')) {
    const scopedDb = getScopedDb(userId);
    scopedDb.voices.save({
      name: profile.name,
      gender: profile.gender,
      language: profile.language,
      accent: profile.languageLabel || 'Studio',
      architecture: profile.architecture,
      sampleAudioBase64: profile.sampleAudioDataUrl,
      referenceText: profile.referenceText,
      isPublic: false
    }).catch(err => {
      logger.warn('Asynchronous DB voice save queued error', { error: err?.message });
    });
  }

  return stored;
}

/**
 * Persist a newly created or updated cloned voice profile asynchronously with PostgreSQL confirmation.
 */
export async function saveClonedVoiceProfileAsync(profile: ClonedVoiceProfile, userEmail?: string): Promise<ClonedVoiceProfile> {
  const span = logger.startSpan('storage.saveClonedVoiceProfileAsync', { voiceId: profile.id, voiceName: profile.name, userEmail });
  const local = saveClonedVoiceProfile(profile, userEmail);

  if (userEmail && !userEmail.startsWith('ip:')) {
    try {
      const scopedDb = getScopedDb(userEmail);
      await scopedDb.voices.save({
        name: profile.name,
        gender: profile.gender,
        language: profile.language,
        accent: profile.languageLabel || 'Studio',
        architecture: profile.architecture,
        sampleAudioBase64: profile.sampleAudioDataUrl,
        referenceText: profile.referenceText,
        isPublic: false
      });
      span.end({ syncedToDb: true });
    } catch (dbErr: any) {
      span.fail(dbErr);
    }
  } else {
    span.end({ syncedToDb: false, reason: 'anonymous_or_guest' });
  }

  return local;
}

/**
 * Delete a cloned voice profile and remove from disk, memory, and PostgreSQL.
 */
export function deleteClonedVoiceProfile(profileId: string, userId?: string): boolean {
  if (cachedProfiles === null) {
    cachedProfiles = loadProfilesFromDisk();
  }

  const profile = cachedProfiles.find(p => p.id === profileId);
  if (!profile) return false;

  if (userId && !userId.startsWith('ip:') && profile.userId && profile.userId !== userId && profile.userId !== 'workspace') {
    return false;
  }

  if (profile.audioSampleFile) {
    try {
      const samplesDir = getSamplesDirectory();
      const samplePath = path.join(samplesDir, profile.audioSampleFile);
      if (fs.existsSync(samplePath)) {
        fs.unlinkSync(samplePath);
      }
    } catch {}
  }

  cachedProfiles = cachedProfiles.filter(p => p.id !== profileId);
  writeProfilesToDisk(cachedProfiles);

  if (userId && !userId.startsWith('ip:')) {
    const scopedDb = getScopedDb(userId);
    scopedDb.voices.delete(profileId).catch(err => {
      logger.warn('Asynchronous DB voice deletion error', { error: err?.message });
    });
  }

  return true;
}

/**
 * Stream or retrieve a raw audio sample by voice ID.
 */
export function getClonedAudioSample(profileId: string): { buffer: Buffer; mimeType: string } | null {
  if (cachedProfiles === null) {
    cachedProfiles = loadProfilesFromDisk();
  }

  const profile = cachedProfiles.find(p => p.id === profileId);
  if (!profile) return null;

  if (profile.audioSampleFile) {
    try {
      const samplesDir = getSamplesDirectory();
      const filePath = path.join(samplesDir, profile.audioSampleFile);
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath);
        const ext = path.extname(profile.audioSampleFile).toLowerCase();
        const mimeType = ext === '.mp3' ? 'audio/mpeg' : ext === '.ogg' ? 'audio/ogg' : 'audio/wav';
        return { buffer, mimeType };
      }
    } catch {}
  }

  if (profile.sampleAudioDataUrl && profile.sampleAudioDataUrl.startsWith('data:audio/')) {
    try {
      const parts = profile.sampleAudioDataUrl.split(',');
      if (parts.length === 2) {
        const mimeMatch = parts[0].match(/data:(audio\/[a-zA-Z0-9_-]+)/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'audio/wav';
        const buffer = Buffer.from(parts[1], 'base64');
        return { buffer, mimeType };
      }
    } catch {}
  }

  return null;
}

/**
 * Retrieve a specific cloned voice profile by ID or name (checks memory and PostgreSQL).
 */
export async function getClonedVoiceProfileAsync(profileIdOrName: string, userEmail?: string): Promise<StoredClonedVoiceProfile | null> {
  const local = getClonedVoiceProfile(profileIdOrName);
  if (local && local.sampleAudioDataUrl) return local;

  if (userEmail && !userEmail.startsWith('ip:')) {
    try {
      const scopedDb = getScopedDb(userEmail);
      const dbVoice = await scopedDb.voices.get(profileIdOrName);
      if (dbVoice) {
        return {
          id: dbVoice.id,
          name: dbVoice.name,
          description: `${dbVoice.name} custom replicated voice`,
          createdAt: dbVoice.createdAt.toISOString(),
          sampleDurationSec: 5,
          sampleAudioDataUrl: dbVoice.sampleAudioBase64 || '',
          verifiedAudioUrl: '',
          architecture: dbVoice.architecture,
          usageTag: 'Personal Replicated',
          referenceText: dbVoice.referenceText || '',
          language: dbVoice.language,
          languageLabel: dbVoice.accent || 'Studio',
          gender: (dbVoice.gender as any) || 'male',
          emotionTag: 'Warm & Natural',
          commercialUse: 'commercial_safe',
          commercialLabel: 'Commercial Safe (Self-Owned)',
          userId: dbVoice.userEmail
        };
      }
    } catch (err: any) {
      logger.warn('Error fetching voice from PostgreSQL', { error: err?.message });
    }
  }

  return local;
}

export function getClonedVoiceProfile(profileId: string): StoredClonedVoiceProfile | null {
  if (cachedProfiles === null) {
    cachedProfiles = loadProfilesFromDisk();
  }
  return cachedProfiles.find(p => p.id === profileId || p.name.toLowerCase() === profileId.toLowerCase()) || null;
}
