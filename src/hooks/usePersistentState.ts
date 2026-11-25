import { useEffect, useState } from 'react';

/**
 * React state hook synchronized with browser localStorage.
 */
export function usePersistentState<T>(
  storageKey: string,
  fallback: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // Ignore storage quota or private-mode write errors
    }
  }, [storageKey, value]);

  return [value, setValue];
}
