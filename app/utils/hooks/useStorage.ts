"use client";

import { useState, useEffect, useCallback, useRef } from "react";

type Serializer<T> = (value: T) => string;
type Deserializer<T> = (value: string) => T;

interface StorageHookOptions<T> {
  serializer?: Serializer<T>;
  deserializer?: Deserializer<T>;
}

/**
 * Custom hook for localStorage that mimics react-session-hooks useLocalState
 */
export function useLocalState<T>(
  key: string,
  defaultValue: T,
  serializer?: Serializer<T>
): [T, (value: T) => void, boolean] {
  const [state, setState] = useState<T>(defaultValue);
  const [loading, setLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
        const item = window.localStorage.getItem(key);
        if (item !== null) {
          if (serializer) {
            // If serializer is provided, assume it's for converting back from string
            setState(JSON.parse(item));
          } else {
            setState(JSON.parse(item));
          }
        }
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
    } finally {
      setLoading(false);
    }
  }, [key, serializer]);

  const setValue = useCallback((value: T) => {
    try {
      setState(value);
      if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
        if (serializer) {
          window.localStorage.setItem(key, serializer(value));
        } else {
          window.localStorage.setItem(key, JSON.stringify(value));
        }
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, serializer]);

  return [state, setValue, loading];
}

/**
 * Custom hook for sessionStorage that mimics react-session-hooks useSessionState
 */
export function useSessionState<T>(
  key: string,
  defaultValue?: T
): [T | undefined, (value: T) => void, boolean] {
  const [state, setState] = useState<T | undefined>(defaultValue);
  const [loading, setLoading] = useState(true);

  // Initialize from sessionStorage
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage && typeof window.sessionStorage.getItem === 'function') {
        const item = window.sessionStorage.getItem(key);
        if (item !== null) {
          setState(JSON.parse(item));
        }
      }
    } catch (error) {
      console.error(`Error reading sessionStorage key "${key}":`, error);
    } finally {
      setLoading(false);
    }
  }, [key]);

  const setValue = useCallback((value: T) => {
    try {
      setState(value);
      if (typeof window !== 'undefined' && window.sessionStorage && typeof window.sessionStorage.setItem === 'function') {
        window.sessionStorage.setItem(key, JSON.stringify(value));
      }
    } catch (error) {
      console.error(`Error setting sessionStorage key "${key}":`, error);
    }
  }, [key]);

  return [state, setValue, loading];
}
// ── Form drafts ─────────────────────────────────────────────────────────────

const DRAFT_PREFIX = "draft:";

type FormDraft<T> = {
  /** True after a saved draft has been put back into the form. */
  restored: boolean;
  /** Forget the draft, e.g. after a successful save. */
  clear: () => void;
  /** Forget the draft and put the form back to how it started. */
  discard: () => void;
};

/**
 * Keep a form's unsaved values in localStorage so a reload, a crash, or a
 * closed tab does not lose what a student typed.
 *
 * Works alongside the form's own state rather than replacing it: pass the
 * current values as one object and a `restore` callback that writes a saved
 * draft back into state. The draft is written whenever the values change
 * and removed again when they match how the form started, so untouched
 * forms leave nothing behind. Pass `null` as the key to switch it off.
 *
 * Call `clear()` once the values have been saved for real, or the next visit
 * would restore an outdated draft over fresh server data.
 */
export function useFormDraft<T extends object>(
  key: string | null,
  value: T,
  restore: (saved: T) => void
): FormDraft<T> {
  const storageKey = key === null ? null : `${DRAFT_PREFIX}${key}`;
  const [restored, setRestored] = useState(false);
  // The values the form opened with; a draft equal to these is not a draft.
  const initialJson = useRef(JSON.stringify(value));
  const initialValue = useRef(value);
  // Nothing is written until the first read has happened, or the initial
  // values would overwrite the draft before it could be restored.
  const ready = useRef(false);
  const restoreRef = useRef(restore);
  restoreRef.current = restore;

  useEffect(() => {
    ready.current = false;
    setRestored(false);
    if (storageKey === null) return;
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved !== null && saved !== initialJson.current) {
        restoreRef.current(JSON.parse(saved) as T);
        setRestored(true);
      }
    } catch (error) {
      console.error(`Error reading draft "${storageKey}":`, error);
    }
    ready.current = true;
  }, [storageKey]);

  const json = JSON.stringify(value);
  useEffect(() => {
    if (storageKey === null || !ready.current) return;
    try {
      if (json === initialJson.current) {
        window.localStorage.removeItem(storageKey);
      } else {
        window.localStorage.setItem(storageKey, json);
      }
    } catch (error) {
      console.error(`Error saving draft "${storageKey}":`, error);
    }
  }, [storageKey, json]);

  const clear = useCallback(() => {
    setRestored(false);
    if (storageKey === null) return;
    try {
      window.localStorage.removeItem(storageKey);
    } catch (error) {
      console.error(`Error clearing draft "${storageKey}":`, error);
    }
    // What is saved now is the new starting point.
    initialJson.current = JSON.stringify(value);
    initialValue.current = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, json]);

  const discard = useCallback(() => {
    restoreRef.current(initialValue.current);
    setRestored(false);
    if (storageKey === null) return;
    try {
      window.localStorage.removeItem(storageKey);
    } catch (error) {
      console.error(`Error clearing draft "${storageKey}":`, error);
    }
  }, [storageKey]);

  return { restored, clear, discard };
}
