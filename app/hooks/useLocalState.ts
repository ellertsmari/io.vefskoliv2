import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  getLocalItem,
  removeLocalItem,
  setLocalItem,
} from "../utils/clientActions";

/**
 * Hook to manage state synchronized with localStorage.
 *
 * @template T - The type of the value to be stored.
 * @param {string} key - The key under which the value is stored in localStorage.
 * @param {T} [defaultValue] - The default value to use if no value is found in localStorage.
 * @returns {[T | null, Dispatch<SetStateAction<T | null>>]} A stateful value and a function to update it.
 *
 * @example
 * const [value, setValue] = useLocalState<string>("myKey", "default");
 *
 * setValue("newValue");
 */
export function useLocalState<T>(
  key: string,
  defaultValue?: T
): [T | null, Dispatch<SetStateAction<T | null>>] {
  const [storedValue, setStoredValue] = useState<T | null>(() => {
    const item = getLocalItem(key);
    return item ? JSON.parse(item) : defaultValue ?? null;
  });

  useEffect(() => {
    if (storedValue === null) removeLocalItem(key);
    else setLocalItem(key, JSON.stringify(storedValue));
  }, [storedValue]);

  return [storedValue, setStoredValue];
}
