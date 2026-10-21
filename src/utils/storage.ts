/**
 * Safe Storage Utility for DualSync BT.
 * Guards against SecurityError, QuotaExceededError, and Incognito mode restrictions in mobile browsers.
 * Falls back to in-memory storage if window.localStorage is inaccessible.
 */

class SafeStorage {
  private memoryFallback: Map<string, string> = new Map();
  private isStorageAvailable: boolean;

  constructor() {
    this.isStorageAvailable = this.checkAvailability();
  }

  private checkAvailability(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const testKey = '__dualsync_storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  public getItem(key: string): string | null {
    if (this.isStorageAvailable) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return this.memoryFallback.get(key) || null;
      }
    }
    return this.memoryFallback.get(key) || null;
  }

  public setItem(key: string, value: string): void {
    if (this.isStorageAvailable) {
      try {
        window.localStorage.setItem(key, value);
        return;
      } catch {
        // quota exceeded or storage disabled
      }
    }
    this.memoryFallback.set(key, value);
  }

  public removeItem(key: string): void {
    if (this.isStorageAvailable) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
    this.memoryFallback.delete(key);
  }

  public clear(): void {
    if (this.isStorageAvailable) {
      try {
        window.localStorage.clear();
      } catch {
        // ignore
      }
    }
    this.memoryFallback.clear();
  }
}

export const safeStorage = new SafeStorage();
