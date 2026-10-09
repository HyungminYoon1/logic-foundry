// Pure, bounded codecs. No DOM, clock, storage or network access.
import {missions, validate, evaluate, truthTable} from "./model.js";

export const FILE_BYTES = 16 * 1024;
export const STATE_BYTES = 128 * 1024;
export const campaign = Object.freeze(Object.keys(missions));
const bytes = text => new TextEncoder().encode(text).length;
function exact(value, keys) {
  if (!value || typeof value !== "object" || Array.isArray(value) ||
      ![Object.prototype, null].includes(Object.getPrototypeOf(value)) ||
      Object.keys(value).length !== keys.length || keys.some(k => !Object.hasOwn(value, k)))
    throw new TypeError("잘못된 데이터 형식입니다.");
}
function missionKey(key) {
  if (!campaign.includes(key)) throw new TypeError("없는 과제입니다.");
}
export function copyCircuit(value, key) {
  missionKey(key); exact(value, ["gates", "outputs"]);
  validate(value, key);
  const gates = value.gates.map(g => {
    exact(g, ["id", "type", "a", "b"]);
    return {id:g.id, type:g.type, a:g.a, b:g.b};
  });
  return {gates, outputs:[...value.outputs]};
}
function parse(text, limit) {
  if (typeof text !== "string" || text.length > limit || bytes(text) > limit)
    throw new TypeError("데이터 크기 제한을 초과했습니다.");
  try { return JSON.parse(text); } catch { throw new TypeError("JSON 형식을 확인하세요."); }
}
export function exportCircuit(key, circuit) {
  const text = JSON.stringify({version:1, mission:key, circuit:copyCircuit(circuit,key)}, null, 2);
  if (bytes(text) > FILE_BYTES) throw new TypeError("회로 크기 제한을 초과했습니다.");
  return text;
}
export function importCircuit(text) {
  const value = parse(text, FILE_BYTES);
  exact(value, ["version", "mission", "circuit"]);
  if (value.version !== 1) throw new TypeError("지원하지 않는 회로 버전입니다.");
  return {mission:value.mission, circuit:copyCircuit(value.circuit,value.mission)};
}
export function copyDraft(value, key) {
  exact(value, ["circuit", "inputs", "hintCount", "assisted"]);
  const circuit = copyCircuit(value.circuit,key);
  exact(value.inputs, missions[key].inputs); evaluate(circuit,value.inputs,key);
  if (!Number.isInteger(value.hintCount) || value.hintCount < 0 || value.hintCount > missions[key].hints.length ||
      typeof value.assisted !== "boolean") throw new TypeError("잘못된 초안입니다.");
  return {circuit, inputs:{...value.inputs}, hintCount:value.hintCount, assisted:value.assisted};
}
export function emptyState() { return {version:1, drafts:{}, achievements:{}}; }
export function validateState(value) {
  exact(value, ["version", "drafts", "achievements"]);
  if (value.version !== 1) throw new TypeError("지원하지 않는 저장 버전입니다.");
  const result = emptyState();
  for (const group of ["drafts", "achievements"]) {
    const entries = value[group];
    if (!entries || typeof entries !== "object" || Array.isArray(entries) ||
        ![Object.prototype,null].includes(Object.getPrototypeOf(entries)) || Object.keys(entries).length > campaign.length)
      throw new TypeError("잘못된 저장 목록입니다.");
    for (const key of Object.keys(entries)) {
      missionKey(key);
      if (group === "drafts") result.drafts[key] = copyDraft(entries[key],key);
      else {
        const circuit = copyCircuit(entries[key],key);
        if (!truthTable(circuit,key).every(row => row.correct)) throw new TypeError("완료 회로가 검증을 통과하지 못했습니다.");
        result.achievements[key] = circuit;
      }
    }
  }
  return result;
}
export function decodeState(text) { return validateState(parse(text, STATE_BYTES)); }
export function encodeState(value) {
  const text = JSON.stringify(validateState(value));
  if (bytes(text) > STATE_BYTES) throw new TypeError("저장 크기 제한을 초과했습니다.");
  return text;
}
export function recordCompletion(value, key, draft) {
  const next = validateState(value), checked = copyDraft(draft,key);
  if (checked.assisted || !truthTable(checked.circuit,key).every(row => row.correct))
    throw new TypeError("직접 해결한 회로만 기록할 수 있습니다.");
  next.achievements[key] = checked.circuit;
  return next;
}
