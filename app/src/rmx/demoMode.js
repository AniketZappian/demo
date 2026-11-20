import { useSyncExternalStore } from 'react';

export const DEMO_MODES = ['normal', 'slow', 'empty', 'error'];

let mode = 'normal';
const listeners = new Set();

export function getDemoMode() {
  return mode;
}

export function setDemoMode(next) {
  if (!DEMO_MODES.includes(next) || next === mode) return;
  mode = next;
  listeners.forEach((fn) => fn());
}

export function subscribeDemoMode(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useDemoMode() {
  const current = useSyncExternalStore(subscribeDemoMode, getDemoMode, getDemoMode);
  return [current, setDemoMode];
}
