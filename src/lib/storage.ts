const RESET_PREFIXES = ["eventra-", "rk-ticketing-"];
const RESET_KEYS = ["theme"];

export function resetDemoData(): void {
  if (typeof window === "undefined") return;
  const keys: string[] = [];
  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);
    if (!key) continue;
    if (
      RESET_PREFIXES.some((prefix) => key.startsWith(prefix)) ||
      RESET_KEYS.includes(key)
    ) {
      keys.push(key);
    }
  }
  keys.forEach((key) => {
    localStorage.removeItem(key);
  });
  window.location.reload();
}

export const safeStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(name, value);
    } catch {
      // Storage can be unavailable in private mode; the UI still works in memory.
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(name);
    } catch {
      // Ignore storage failures.
    }
  },
};
