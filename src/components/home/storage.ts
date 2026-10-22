import { useCallback, useEffect, useState } from "react";

/** localStorage access that never throws (private windows, blocked storage) and never runs during SSR. */
export function readStored(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStored(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore: the choice just will not survive a reload */
  }
}

/**
 * useState that remembers its value in localStorage. The first render always uses `initial` (so server and client
 * markup match); the stored value is applied right after mount.
 */
export function useStoredState<T extends string>(key: string, initial: T, valid: (v: string) => v is T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    const raw = readStored(key);
    if (raw !== null && valid(raw)) setValue(raw);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback(
    (v: T) => {
      setValue(v);
      writeStored(key, v);
    },
    [key]
  );
  return [value, set];
}
