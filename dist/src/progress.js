import {deviceStorage} from "./storage.js";
export const PROGRESS_KEY = "web-lab-progress-v1";
export const APP_IDS = Object.freeze(["data-mirage", "echo-vault", "light-route", "logic-foundry", "neon-tactics",
  "orbit-courier", "packet-journey", "parcel-panic", "pixel-kitchen", "pocket-city", "route-race", "sense-lab",
  "swarm-garden", "think-forge", "traffic-lab"]);
const MAX_BYTES = 8192, ownId = "logic-foundry";
function exact(value, keys) {
  return value && typeof value === "object" && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value,k));
}
function validRecord(record) {
  return exact(record,["completed","total","updatedAt"]) && Number.isInteger(record.completed) &&
    Number.isInteger(record.total) && record.completed >= 0 && record.completed <= record.total && record.total <= 1000 &&
    typeof record.updatedAt === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(record.updatedAt) &&
    Number.isFinite(Date.parse(record.updatedAt)) && new Date(record.updatedAt).toISOString() === record.updatedAt;
}
function read(storage) {
  const text = storage.getItem(PROGRESS_KEY);
  if (text === null) return {version:1,apps:{}};
  if (text.length > MAX_BYTES || new TextEncoder().encode(text).length > MAX_BYTES) throw new TypeError("Summary too large");
  const value = JSON.parse(text);
  if (!exact(value,["version","apps"]) || value.version !== 1 || !value.apps || typeof value.apps !== "object" ||
      Array.isArray(value.apps) || Object.keys(value.apps).length > APP_IDS.length ||
      Object.entries(value.apps).some(([id,record]) => !APP_IDS.includes(id) || !validRecord(record)))
    throw new TypeError("Invalid summary");
  return value;
}
export function reportProgress(completed, total, storage = deviceStorage(), now = () => new Date().toISOString()) {
  if (!storage) return false;
  try {
    const record = {completed,total,updatedAt:now()};
    if (!validRecord(record)) return false;
    const value = read(storage);
    // Only an actual durable completion event invokes this helper.
    value.apps[ownId] = record;
    const text = JSON.stringify(value);
    if (new TextEncoder().encode(text).length > MAX_BYTES) return false;
    storage.setItem(PROGRESS_KEY,text); return true;
  } catch { return false; }
}
export function clearProgress(storage = deviceStorage()) {
  if (!storage) return false;
  try {
    const value = read(storage);
    if (!Object.hasOwn(value.apps,ownId)) return true;
    delete value.apps[ownId];
    storage.setItem(PROGRESS_KEY,JSON.stringify(value)); return true;
  } catch { return false; }
}
