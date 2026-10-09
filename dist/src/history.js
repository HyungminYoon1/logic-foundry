// Page-memory editing history; cloning prevents aliasing between snapshots.
export const UNDO_LIMIT = 32;
export function createHistory() {
  const entries = [];
  return {
    get size() { return entries.length; },
    push(state) { entries.push(structuredClone(state)); if (entries.length > UNDO_LIMIT) entries.shift(); },
    undo() { return entries.length ? entries.pop() : null; }
  };
}
