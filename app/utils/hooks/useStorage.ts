"use client";

import { useState, useEffect, useCallback } from 'react';

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