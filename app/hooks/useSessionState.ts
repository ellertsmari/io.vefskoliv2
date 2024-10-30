import { Dispatch, SetStateAction, useEffect, useState } from "react";

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
): [T | null, Dispatch<SetStateAction<T | null>>] {
  const [storedValue, setStoredValue] = useState<T | null>(() => {
    console.log("useSessionState");
    const item = sessionStorage.getItem(key);
    console.log(item);
    if (item) {
      try {
        return deserialize(item);
      } catch (error) {
        console.warn(`Error parsing sessionStorage key "${key}":`, error);
        sessionStorage.removeItem(key); // Clean up invalid data
      }
    }
    return defaultValue ?? null;
  });

  useEffect(() => {
    if (storedValue === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, serialize(storedValue));
  }, [storedValue, key, serialize]);

  return [storedValue, setStoredValue];
}
