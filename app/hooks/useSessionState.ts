"use client";
import { useEffect, useState } from "react";

/**
 * Hook to manage state synchronized with session storage.
 *
 * @template T - The type of the value to be stored.
 * @param {string} key - The key under which the value is stored in session storage.
 * @param {T} [defaultValue] - The default value to use if no value is found in session storage.
 * @param {(value: T) => string} [serialize] - Optional custom serialization function.
 * @param {(value: string) => T} [deserialize] - Optional custom deserialization function.
 * @returns {[T | null, Dispatch<SetStateAction<T | null>>]} A stateful value and a function to update it.
 *
 * @example
 * const [value, setValue] = useSessionState<string>("myKey", "default");
 *
 * setValue("newValue");
 */
export function useSessionState<T>(
  key: string,
  defaultValue?: T,
  serialize: (value: T) => string = JSON.stringify,
  deserialize: (value: string) => T = JSON.parse
): [
  T | null,
  (value: T | null | ((prev: T | null) => T | null)) => void,
  boolean
] {
  const [storedValue, setStoredValue] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const setInitialValue = () => {
      const item = sessionStorage.getItem(key);
      if (item) {
        try {
          setStoredValue(deserialize(item));
          return;
        } catch (error) {
          console.warn(`Error parsing sessionStorage key "${key}":`, error);
          sessionStorage.removeItem(key); // Clean up invalid data
        }
      }

      if (defaultValue !== undefined) {
        try {
          serialize(defaultValue); // Check if default value can be serialized
          setStoredValue(defaultValue);
          return;
        } catch (error) {
          throw new Error("Default value cannot be serialized");
        }
      }
      setStoredValue(null);
    };

    setInitialValue();
    setLoading(false);
  }, []);

  const updateValue = (value: T | ((prev: T | null) => T | null) | null) => {
    // calculate new value
    let newValue: T | null | ((prev: T | null) => T | null);
    if (typeof value === "function") {
      const callback = value as (prev: T | null) => T | null;
      newValue = callback(storedValue);
    } else if (!value) newValue = null;
    else newValue = value;

    // update session storage
    if (!newValue) {
      sessionStorage.removeItem(key);
      setStoredValue(null);
    } else {
      try {
        sessionStorage.setItem(key, serialize(newValue as T));
        setStoredValue(newValue);
      } catch (error) {
        console.warn(
          `Aborting state update for "${key}": unable to serialise new value:`,
          error
        );
      }
    }
  };

  return [storedValue, updateValue, loading];
}
