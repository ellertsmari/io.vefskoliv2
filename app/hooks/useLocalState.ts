"use client";
import { set } from "mongoose";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  getLocalItem,
  removeLocalItem,
  setLocalItem,
} from "utils/interactWithLocalStorage";

/**
 * Hook to manage state synchronized with localStorage.
 *
 * @template T - The type of the value to be stored.
 * @param {string} key - The key under which the value is stored in localStorage.
 * @param {T} [defaultValue] - The default value to use if no value is found in localStorage.
 * @param {(value: T) => string} [serialize] - Optional custom serialization function.
 * @param {(value: string) => T} [deserialize] - Optional custom deserialization function.
 * @returns {[T | null, Dispatch<SetStateAction<T | null>>]} A stateful value and a function to update it.
 *
 * @example
 * const [value, setValue] = useLocalState<string>("myKey", "default");
 *
 * setValue("newValue");
 */
export function useLocalState<T>(
  key: string,
  defaultValue?: T,
  serialize: (value: T) => string = JSON.stringify,
  deserialize: (value: string) => T = JSON.parse
): [T | null, Dispatch<SetStateAction<T | null>>] {
  const [storedValue, setStoredValue] = useState<T | null>(null);
  const [rendering, setRendering] = useState(true);

  // for updating the value in the session storage
  useEffect(() => {
    if (rendering) return;
    const item = localStorage?.getItem(key);
    if (localStorage && item !== storedValue) {
      if (storedValue === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, serialize(storedValue));
      }
    }
  }, [storedValue, key, serialize]);

  // for setting initial value
  useEffect(() => {
    if (!localStorage) return;
    const item = localStorage?.getItem(key);

    setRendering(false);
    if (item && item !== storedValue) {
      try {
        setStoredValue(deserialize(item));
        return;
      } catch (error) {
        console.warn(`Error parsing localStorage key "${key}":`, error);
        localStorage.removeItem(key); // Clean up invalid data
      }
    }

    if (defaultValue !== undefined) setStoredValue(defaultValue);
  }, [key, deserialize]);

  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key) {
        setStoredValue(event.newValue ? deserialize(event.newValue) : null);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [key, deserialize]);

  return [storedValue, setStoredValue];
}
