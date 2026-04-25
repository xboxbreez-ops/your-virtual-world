import { useEffect, useState } from "react";

const KEY = "bloxworld:settings:v1";

export type Settings = {
  sensitivity: number;     // 0.2 .. 3.0 (mouse + right-stick multiplier)
  invertY: boolean;
  padDeadzone: number;     // 0.05 .. 0.4
};

const DEFAULTS: Settings = { sensitivity: 1, invertY: false, padDeadzone: 0.15 };

const read = (): Settings => {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch { return DEFAULTS; }
};

const listeners = new Set<(s: Settings) => void>();
let current: Settings = read();

const write = (s: Settings) => {
  current = s;
  try { window.localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* noop */ }
  listeners.forEach((l) => l(s));
};

export const getSettings = () => current;
export const setSettings = (patch: Partial<Settings>) => write({ ...current, ...patch });

export function useSettings(): [Settings, (patch: Partial<Settings>) => void] {
  const [s, setS] = useState<Settings>(current);
  useEffect(() => {
    const l = (next: Settings) => setS(next);
    listeners.add(l);
    return () => { listeners.delete(l); };
  }, []);
  return [s, setSettings];
}
