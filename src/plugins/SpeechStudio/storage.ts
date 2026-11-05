import fs from 'fs';
import path from 'path';
import os from 'os';
import { ClonedVoiceProfile } from './types.js';

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
  } catch (err) {
    console.warn('[SpeechStudio Storage] Error reading cloned_profiles.json:', err);
  }
  return [];
}

function writeProfilesToDisk(profiles: StoredClonedVoiceProfile[]): void {
  const filePath = getProfilesFilePath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(profiles, null, 2), 'utf8');
  } catch (err) {
    console.error('[SpeechStudio Storage] Error writing cloned_profiles.json:', err);
  }
}

/**
 * Retrieve all cloned voice profiles accessible to the user.
 * If userId is provided, returns user's profiles plus workspace/shared profiles.
 */
export function getClonedVoiceProfiles(userId?: string): ClonedVoiceProfile[] {
  if (cachedProfiles === null) {
    cachedProfiles = loadProfilesFromDisk();
  }

  const samplesDir = getSamplesDirectory();

  // If no userId provided or admin/guest mode, return all profiles
  const matched = !userId || userId.startsWith('ip:')
    ? cachedProfiles
    : cachedProfiles.filter(p => !p.userId || p.userId === userId || p.userId === 'workspace');

  // Hydrate sampleAudioDataUrl from audio file if missing
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
 * Persist a newly created or updated cloned voice profile to disk and in-memory cache.
 */
export function saveClonedVoiceProfile(profile: ClonedVoiceProfile, userId?: string): ClonedVoiceProfile {
  if (cachedProfiles === null) {
    cachedProfiles = loadProfilesFromDisk();
  }

  const stored: StoredClonedVoiceProfile = {
    ...profile,
    userId: userId || 'workspace'
  };

  // If sampleAudioDataUrl is provided as base64 data URL, extract and persist raw audio file
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
    } catch (saveAudioErr) {
      console.warn('[SpeechStudio Storage] Could not persist audio sample file:', saveAudioErr);
    }
  }

  const existingIdx = cachedProfiles.findIndex(p => p.id === profile.id);
  if (existingIdx >= 0) {
    cachedProfiles[existingIdx] = stored;
  } else {
    cachedProfiles.unshift(stored);
  }

  writeProfilesToDisk(cachedProfiles);
  return stored;
}

/**
 * Delete a cloned voice profile and remove any associated audio sample file.
 */
export function deleteClonedVoiceProfile(profileId: string, userId?: string): boolean {
  if (cachedProfiles === null) {
    cachedProfiles = loadProfilesFromDisk();
  }

  const profile = cachedProfiles.find(p => p.id === profileId);
  if (!profile) return false;

  // Authorization check
  if (userId && !userId.startsWith('ip:') && profile.userId && profile.userId !== userId && profile.userId !== 'workspace') {
    return false;
  }

  // Remove audio sample file from disk
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
  if (!profile || !profile.audioSampleFile) return null;

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

  return null;
}
