import test from "node:test";
import assert from "node:assert/strict";
import { evaluate, example, initial, truthTable, operate, missions } from "../dist/src/model.js";
import { importCircuit, exportCircuit, decodeState, encodeState, emptyState, FILE_BYTES, STATE_BYTES } from "../dist/src/records.js";
import { createHistory } from "../dist/src/history.js";

test("edge: exact byte ceilings accept padded valid JSON and reject one additional byte", () => {
  for (const [text, limit, decode] of [
    [exportCircuit("difference", initial()), FILE_BYTES, importCircuit],
    [encodeState(emptyState()), STATE_BYTES, decodeState],
  ]) {
    const padded = text + " ".repeat(limit - Buffer.byteLength(text));
    assert.deepEqual(decode(padded), decode(text));
    assert.throws(() => decode(padded + " "));
  }
});

test("edge: zero-gate constants and direct outputs evaluate every row without invented gates", () => {
  for (const ref of ["0", "1", "A", "B"]) {
    const circuit = { gates: [], outputs: [ref] };
    for (const row of truthTable(circuit)) assert.equal(row.actual[0], ref === "0" ? 0 : ref === "1" ? 1 : row.inputs[ref]);
    assert.deepEqual(importCircuit(exportCircuit("difference", circuit)).circuit, circuit);
  }
});

test("edge: binary inputs reject empty, type and nonfinite values even for inactive NOT port", () => {
  for (const v of ["", null, false, "0", -0.001, 1.001, NaN, Infinity, -Infinity]) {
    assert.throws(() => evaluate(initial(), { A: v, B: 0 }), TypeError);
    assert.throws(() => operate("NOT", 0, v), TypeError);
  }
  assert.deepEqual(evaluate({ gates: [], outputs: ["1"] }, { A: 0, B: 1 }).outputs, [1]);
});

test("edge: gate ID renaming and added unused gates preserve independently checked arithmetic", () => {
  for (const key of ["adder3", "alu2", "comparator"]) {
    const c = example(key), before = structuredClone(c);
    const ids = new Map(c.gates.map((g, i) => [g.id, "G" + (99 - i)]));
    const renamed = { gates: c.gates.map(g => ({ ...g, id: ids.get(g.id), a: ids.get(g.a) ?? g.a, b: ids.get(g.b) ?? g.b })),
      outputs: c.outputs.map(r => ids.get(r) ?? r) };
    renamed.gates.push({ id: "G50", type: "AND", a: missions[key].inputs[0], b: "0" });
    assert.deepEqual(truthTable(renamed, key), truthTable(c, key));
    assert.deepEqual(c, before);
  }
});

test("edge: undo snapshots detach nested inputs and remain independent across mission histories", () => {
  const a = createHistory(), b = createHistory(), state = { circuit: initial(), inputs: { A: 0, B: 1 }, assisted: false };
  a.push(state); state.inputs.A = 1; state.circuit.gates[0].type = "XOR"; b.push(state);
  const restored = a.undo();
  assert.equal(restored.inputs.A, 0); assert.equal(restored.circuit.gates[0].type, "AND");
  restored.circuit.gates[0].type = "NOR";
  assert.equal(b.undo().circuit.gates[0].type, "XOR"); assert.equal(a.undo(), null);
});
