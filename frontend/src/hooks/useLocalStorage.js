import { useEffect, useState } from "react";

function getStorage() {
  return globalThis?.localStorage ?? null;
}

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = getStorage()?.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      getStorage()?.setItem(key, JSON.stringify(storedValue));
    } catch {
      // Ignore storage write failures and keep the app usable.
    }
  }, [key, storedValue]);

  const clearStoredValue = () => {
    setStoredValue(initialValue);
  };

  return [storedValue, setStoredValue, clearStoredValue];
}
