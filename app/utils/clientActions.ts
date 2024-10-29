"use client";
/**
 * Retrieves a value from local storage.
 * @param key - The key of the value to retrieve.
 * @returns The value associated with the key, or null if the key does not exist.
 */
export const getLocalItem = (key: string): string | null => {
  const localStorage = document.defaultView?.localStorage;
  if (!localStorage) return null;
  return localStorage.getItem(key);
};

/**
 * Sets a value in local storage.
 * @param key - The key under which the value is stored.
 * @param value - The value to store.
 * @returns The local storage object.
 */
export const setLocalItem = (key: string, value: string) => {
  const localStorage = document.defaultView?.localStorage;
  if (!localStorage) return null;
  localStorage.setItem(key, value);
  return localStorage;
};

/**
 * Remove a value from local storage.
 * @param key - The key of the value to remove.
 * @returns The local storage object.
 */
export const removeLocalItem = (key: string) => {
  const localStorage = document.defaultView?.localStorage;
  if (!localStorage) return null;
  localStorage.removeItem(key);
  return localStorage;
};
