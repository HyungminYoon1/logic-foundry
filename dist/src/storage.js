import {decodeState, encodeState, emptyState} from "./records.js";
export const STATE_KEY = "logic-foundry-state-v1";
export function deviceStorage() { try { return globalThis.localStorage ?? null; } catch { return null; } }
export function readState(storage = deviceStorage()) {
  if (!storage) return {ok:false, state:emptyState()};
  try {
    const text = storage.getItem(STATE_KEY);
    return {ok:true, state:text === null ? emptyState() : decodeState(text)};
  } catch { return {ok:false, state:emptyState()}; }
}
export function writeState(state, storage = deviceStorage()) {
  if (!storage) return false;
  try { storage.setItem(STATE_KEY, encodeState(state)); return true; } catch { return false; }
}
export function eraseState(storage = deviceStorage()) {
  if (!storage) return false;
  try { storage.removeItem(STATE_KEY); return true; } catch { return false; }
}
