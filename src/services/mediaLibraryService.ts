/**
 * Media Library Service for DualSync BT.
 * Handles local user audio file imports (MP3, WAV, FLAC, M4A, OGG),
 * metadata extraction (Title, Artist, Album, Art),
 * in-memory demo sample tracks, and library persistence.
 */

import { AudioTrack } from '../types/audio';
import { parseAudioFile } from '../utils/id3Parser';
import { generateSyntheticDemoTrack } from '../utils/wavGenerator';
import { safeStorage } from '../utils/storage';

const STORAGE_KEY_TRACKS = 'dualsync_library_tracks_v1';
const STORAGE_KEY_RECENT = 'dualsync_recently_played_v1';

class MediaLibraryService {
  private tracks: AudioTrack[] = [];
  private recentlyPlayedIds: string[] = [];
  private demoTracksGenerated = false;

  constructor() {
    this.loadPersistedMetadata();
  }

  /**
   * Initializes built-in test tracks so the user can immediately test without needing files
   */
  public initDemoTracks(): AudioTrack[] {
    if (this.demoTracksGenerated && this.tracks.some(t => t.isDemo)) {
      return this.tracks;
    }

    try {
      const demo1 = generateSyntheticDemoTrack('DualSync Stereo Pulse', 120, 16, 'synth');
      const url1 = URL.createObjectURL(demo1.blob);

      const demo2 = generateSyntheticDemoTrack('Binaural Chill Groove', 95, 20, 'ambient');
      const url2 = URL.createObjectURL(demo2.blob);

      const demoTracks: AudioTrack[] = [
        {
          id: 'demo-stereo-pulse',
          title: 'Stereo Pulse (Demo)',
          artist: 'DualSync SoundLab',
          album: 'Acoustic Calibration Vol. 1',
          duration: demo1.duration,
          format: 'WAV',
          fileName: 'dualsync_stereo_pulse.wav',
          fileSize: demo1.blob.size,
          objectUrl: url1,
          dateAdded: Date.now() - 100000,
          isDemo: true,
        },
        {
          id: 'demo-ambient-groove',
          title: 'Ambient Horizon (Demo)',
          artist: 'DualSync SoundLab',
          album: 'Spatial Soundscape',
          duration: demo2.duration,
          format: 'WAV',
          fileName: 'ambient_horizon.wav',
          fileSize: demo2.blob.size,
          objectUrl: url2,
          dateAdded: Date.now() - 50000,
          isDemo: true,
        },
      ];

      // Add demo tracks if not already present
      for (const dt of demoTracks) {
        if (!this.tracks.some(t => t.id === dt.id)) {
          this.tracks.unshift(dt);
        }
      }

      this.demoTracksGenerated = true;
    } catch (err) {
      console.warn('Could not generate synthetic demo tracks:', err);
    }

    return this.tracks;
  }

  /**
   * Adds local audio files selected via input[type="file"]
   */
  public async addLocalFiles(fileList: FileList | File[]): Promise<AudioTrack[]> {
    const files = Array.from(fileList);
    const newTracks: AudioTrack[] = [];

    for (const file of files) {
      try {
        const metadata = await parseAudioFile(file);
        const objectUrl = URL.createObjectURL(file);
        
        // Estimate or read duration using audio element
        const duration = await this.readAudioDuration(objectUrl);

        const track: AudioTrack = {
          id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          title: metadata.title,
          artist: metadata.artist,
          album: metadata.album,
          duration,
          format: file.type.split('/')[1]?.toUpperCase() || file.name.split('.').pop()?.toUpperCase() || 'AUDIO',
          fileName: file.name,
          fileSize: file.size,
          objectUrl,
          artworkUrl: metadata.artworkUrl,
          dateAdded: Date.now(),
          file,
        };

        newTracks.push(track);
        this.tracks.unshift(track);
      } catch (err) {
        console.warn('Error processing audio file:', file.name, err);
      }
    }

    this.persistMetadata();
    return newTracks;
  }

  public getTracks(): AudioTrack[] {
    if (this.tracks.length === 0) {
      this.initDemoTracks();
    }
    return this.tracks;
  }

  public getTrackById(id: string): AudioTrack | undefined {
    return this.tracks.find(t => t.id === id);
  }

  public removeTrack(id: string): void {
    const track = this.tracks.find(t => t.id === id);
    if (track && track.objectUrl) {
      try {
        URL.revokeObjectURL(track.objectUrl);
      } catch {
        // ignore
      }
    }
    this.tracks = this.tracks.filter(t => t.id !== id);
    this.recentlyPlayedIds = this.recentlyPlayedIds.filter(recentId => recentId !== id);
    this.persistMetadata();
  }

  public markRecentlyPlayed(trackId: string): void {
    this.recentlyPlayedIds = [trackId, ...this.recentlyPlayedIds.filter(id => id !== trackId)].slice(0, 10);
    this.persistRecentlyPlayed();
  }

  public getRecentlyPlayedTracks(): AudioTrack[] {
    return this.recentlyPlayedIds
      .map(id => this.getTrackById(id))
      .filter((t): t is AudioTrack => !!t);
  }

  private async readAudioDuration(objectUrl: string): Promise<number> {
    return new Promise<number>((resolve) => {
      const audio = new Audio();
      audio.preload = 'metadata';
      audio.src = objectUrl;

      const cleanup = () => {
        audio.removeEventListener('loadedmetadata', onLoaded);
        audio.removeEventListener('error', onError);
      };

      const onLoaded = () => {
        cleanup();
        resolve(isFinite(audio.duration) ? audio.duration : 180);
      };

      const onError = () => {
        cleanup();
        resolve(180); // 3m fallback
      };

      audio.addEventListener('loadedmetadata', onLoaded);
      audio.addEventListener('error', onError);
      // Timeout guard
      setTimeout(() => {
        cleanup();
        resolve(180);
      }, 2000);
    });
  }

  private persistMetadata(): void {
    try {
      const toSave = this.tracks.map(t => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        album: t.album,
        duration: t.duration,
        format: t.format,
        fileName: t.fileName,
        fileSize: t.fileSize,
        dateAdded: t.dateAdded,
        isDemo: t.isDemo,
      }));
      safeStorage.setItem(STORAGE_KEY_TRACKS, JSON.stringify(toSave));
    } catch {
      // ignore
    }
  }

  private persistRecentlyPlayed(): void {
    try {
      safeStorage.setItem(STORAGE_KEY_RECENT, JSON.stringify(this.recentlyPlayedIds));
    } catch {
      // ignore
    }
  }

  private loadPersistedMetadata(): void {
    try {
      const savedRecent = safeStorage.getItem(STORAGE_KEY_RECENT);
      if (savedRecent) {
        this.recentlyPlayedIds = JSON.parse(savedRecent);
      }
    } catch {
      // ignore
    }
  }
}

export const mediaLibraryService = new MediaLibraryService();
