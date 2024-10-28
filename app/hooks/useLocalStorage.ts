import { Dispatch, SetStateAction, useEffect, useState } from "react";
import {
  getLocalItem,
  removeLocalItem,
  setLocalItem,
} from "../utils/clientActions";

export function useLocalStorage<T>(
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
