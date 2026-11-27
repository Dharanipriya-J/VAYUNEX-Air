import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';

export type StorageKind = 'local' | 'session';

interface PersistentStateOptions<T> {
  /** Which Web Storage area to use. Defaults to `localStorage`. */
  storage?: StorageKind;
  /** Optional runtime guard; stored values failing it are discarded. */
  validate?: (value: unknown) => value is T;
}

function getStorage(kind: StorageKind): Storage | null {
  try {
    return kind === 'session' ? window.sessionStorage : window.localStorage;
  } catch {
    return null;
  }
}

function readStoredValue<T>(key: string, fallback: T, options: PersistentStateOptions<T>): T {
  const storage = getStorage(options.storage ?? 'local');
  if (!storage) return fallback;
  try {
    const raw = storage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    if (options.validate && !options.validate(parsed)) return fallback;
    return parsed as T;
  } catch {
    return fallback;
  }
}

/**
 * React state hook synchronized with Web Storage. Values are read once on
 * mount, validated when a guard is supplied, and written back on change.
 * Storage errors (private mode, quota) are tolerated silently.
 */
export function usePersistentState<T>(
  storageKey: string,
  fallback: T,
  options: PersistentStateOptions<T> = {}
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => readStoredValue(storageKey, fallback, options));
  const storageKind = options.storage ?? 'local';

  useEffect(() => {
    const storage = getStorage(storageKind);
    if (!storage) return;
    try {
      storage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Ignore quota or private-mode write errors.
    }
  }, [storageKey, storageKind, value]);

  return [value, setValue];
}
