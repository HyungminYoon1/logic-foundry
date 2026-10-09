import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {missions,initial,example,truthTable,LIMITS} from "../dist/src/model.js";
import {FILE_BYTES,STATE_BYTES,exportCircuit,importCircuit,copyDraft,emptyState,decodeState,encodeState,recordCompletion} from "../dist/src/records.js";
import {createHistory,UNDO_LIMIT} from "../dist/src/history.js";
import {STATE_KEY,readState,writeState,eraseState} from "../dist/src/storage.js";
import {PROGRESS_KEY,APP_IDS,reportProgress,clearProgress} from "../dist/src/progress.js";

function memory() {
  const values=new Map();
  return {values,getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
}
const draft=(key,circuit=initial(key),assisted=false)=>({circuit,inputs:Object.fromEntries(missions[key].inputs.map(k=>[k,0])),hintCount:0,assisted});
const time="2026-10-09T00:00:00.000Z";
const record={completed:2,total:13,updatedAt:time};

test("13 unchanged mission solutions round-trip with exact all-combination results",()=>{
  assert.equal(Object.keys(missions).length,13);assert.equal(LIMITS.gates,24);
  for(const key of Object.keys(missions)){
    const c=example(key),before=structuredClone(c),text=exportCircuit(key,c),loaded=importCircuit(text);
    assert.ok(new TextEncoder().encode(text).length<=FILE_BYTES);
    assert.deepEqual(loaded,{mission:key,circuit:c});
    assert.ok(truthTable(loaded.circuit,key).every(r=>r.correct));assert.deepEqual(c,before);
    loaded.circuit.gates[0].a="0";assert.deepEqual(c,before);
  }
});
test("import rejects unknown schemas, solved flags, versions and prototype mission names",()=>{
  const good=JSON.parse(exportCircuit("difference",initial()));
  for(const value of [null,[],{}, {...good,version:2},{...good,solved:true},{...good,assisted:false},
    ...["constructor","__proto__","missing"].map(mission=>({...good,mission})),
    {...good,circuit:{...good.circuit,solved:true}},
    {...good,circuit:{gates:[{...good.circuit.gates[0],private:"value"}],outputs:["G1"]}}])
    assert.throws(()=>importCircuit(JSON.stringify(value)));
  assert.throws(()=>importCircuit('{"version":1}broken'));
});
test("import rejects self/forward/cyclic/dangling and foreign input references atomically",()=>{
  const serialize=circuit=>JSON.stringify({version:1,mission:"difference",circuit});
  for(const circuit of [
    {gates:[{id:"G1",type:"AND",a:"G1",b:"A"}],outputs:["G1"]},
    {gates:[{id:"G1",type:"AND",a:"G2",b:"A"},{id:"G2",type:"OR",a:"G1",b:"B"}],outputs:["G2"]},
    {gates:[{id:"G1",type:"AND",a:"G2",b:"A"},{id:"G2",type:"OR",a:"A",b:"B"}],outputs:["G2"]},
    {gates:[{id:"G1",type:"AND",a:"Cin",b:"A"}],outputs:["G1"]},
    {gates:[{id:"G1",type:"NOT",a:"A",b:"G99"}],outputs:["G1"]},
    {gates:[],outputs:["G99"]}, {gates:[],outputs:["A","B"]}])assert.throws(()=>importCircuit(serialize(circuit)));
  const nand=initial("nandMux");nand.gates[0].type="XOR";
  assert.throws(()=>importCircuit(JSON.stringify({version:1,mission:"nandMux",circuit:nand})));
});
test("import checks UTF8 bytes and exact gate ceilings before evaluation",()=>{
  assert.throws(()=>importCircuit(" ".repeat(FILE_BYTES+1)));
  const text=exportCircuit("difference",initial());
  // Korean whitespace-looking payload is still oversized in UTF-8, before JSON parsing.
  assert.throws(()=>importCircuit('"'+"가".repeat(FILE_BYTES/2)+'"'));
  assert.throws(()=>importCircuit(text+" ".repeat(FILE_BYTES)));
  for(const [key,m] of Object.entries(missions)){
    const gates=Array.from({length:m.gateLimit},(_,i)=>({id:"G"+(i+1),type:m.allowedTypes[0],a:m.inputs[0],b:"0"}));
    const c={gates,outputs:m.outputNames.map(()=>gates.at(-1).id)};
    importCircuit(exportCircuit(key,c));
    gates.push({id:"G"+(m.gateLimit+1),type:m.allowedTypes[0],a:m.inputs[0],b:"0"});
    assert.throws(()=>importCircuit(JSON.stringify({version:1,mission:key,circuit:c})));
  }
});
test("durable achievements require independent executable correct circuits, not flags",()=>{
  let state=emptyState();
  assert.throws(()=>recordCompletion(state,"difference",draft("difference")));
  assert.throws(()=>recordCompletion(state,"difference",draft("difference",example("difference"),true)));
  // Construct the legal solution by editing the initial gate, not injecting a score.
  const c=initial();c.gates[0].type="XOR";
  state=recordCompletion(state,"difference",draft("difference",c));
  assert.deepEqual(Object.keys(decodeState(encodeState(state)).achievements),["difference"]);
  const bad=structuredClone(state);bad.achievements.difference.gates[0].type="AND";
  assert.throws(()=>decodeState(JSON.stringify(bad)));
  assert.throws(()=>decodeState(JSON.stringify({...state,solved:["adder3"]})));
  assert.throws(()=>decodeState(JSON.stringify({...state,achievements:{difference:true}})));
  assert.deepEqual(Object.keys(recordCompletion(state,"difference",draft("difference",c)).achievements),["difference"]);
});
test("drafts preserve assistance and exact inputs and bound every saved field",()=>{
  const value=emptyState();for(const key of Object.keys(missions))value.drafts[key]=draft(key,example(key),true);
  assert.deepEqual(decodeState(encodeState(value)),value);
  assert.ok(encodeState(value).length<STATE_BYTES);
  for(const bad of [{...draft("difference"),hintCount:99},{...draft("difference"),assisted:0},
    {...draft("difference"),inputs:{A:0,B:0,C:0}}, {...draft("difference"),inputs:{A:1,B:true}},
    {...draft("difference"),inputs:Object.create({A:0,B:0})}])assert.throws(()=>copyDraft(bad,"difference"));
  assert.throws(()=>decodeState(" ".repeat(STATE_BYTES+1)));
  assert.throws(()=>decodeState(JSON.stringify({...value,drafts:{constructor:draft("difference")}})));
});
test("editing history retains only 32 detached snapshots including practice provenance",()=>{
  const history=createHistory(),state=draft("difference");
  assert.equal(history.undo(),null);
  for(let i=0;i<40;i++){state.circuit.gates[0].type=i%2?"XOR":"AND";state.assisted=i>=20;state.inputs.A=i%2;history.push(state);}
  state.circuit.gates[0].type="NOR";
  assert.equal(history.size,UNDO_LIMIT);
  for(let i=39;i>=8;i--){const restored=history.undo();assert.equal(restored.circuit.gates[0].type,i%2?"XOR":"AND");assert.equal(restored.assisted,i>=20);}
  assert.equal(history.undo(),null);assert.equal(history.size,0);
});
test("local storage roundtrip, corrupt/denied/quota behavior and erase are scoped",()=>{
  const storage=memory(),state=emptyState();state.drafts.difference=draft("difference");
  storage.setItem("other-private-key","keep");
  assert.ok(writeState(state,storage));assert.deepEqual(readState(storage),{ok:true,state});
  storage.setItem(STATE_KEY,'{"version":99}');const before=storage.getItem(STATE_KEY);
  assert.equal(readState(storage).ok,false);assert.equal(storage.getItem(STATE_KEY),before);
  const denied={getItem(){throw Error();},setItem(){throw Error();},removeItem(){throw Error();}};
  assert.equal(readState(denied).ok,false);assert.equal(writeState(state,denied),false);assert.equal(eraseState(denied),false);
  assert.equal(readState(null).ok,false);assert.equal(writeState(state,null),false);
  assert.equal(eraseState(storage),true);assert.equal(storage.getItem(STATE_KEY),null);assert.equal(storage.getItem("other-private-key"),"keep");
});
test("summary uses 15 IDs, preserves other apps, contains no payload, clears only own record",()=>{
  const storage=memory();assert.equal(APP_IDS.length,15);assert.equal(new Set(APP_IDS).size,15);
  storage.setItem(PROGRESS_KEY,JSON.stringify({version:1,apps:{"neon-tactics":record}}));
  assert.ok(reportProgress(1,13,storage,()=>time));
  const value=JSON.parse(storage.getItem(PROGRESS_KEY));assert.deepEqual(value.apps["neon-tactics"],record);
  assert.deepEqual(value.apps["logic-foundry"],{completed:1,total:13,updatedAt:time});
  assert.deepEqual(Object.keys(value.apps["logic-foundry"]),["completed","total","updatedAt"]);
  assert.ok(clearProgress(storage));assert.deepEqual(JSON.parse(storage.getItem(PROGRESS_KEY)),{version:1,apps:{"neon-tactics":record}});
  assert.ok(clearProgress(storage));
});
test("summary rejects invalid bounds, records, unknown IDs and oversize without overwriting",()=>{
  const storage=memory();
  for(const [completed,total]of [[-1,13],[14,13],[1.5,13],[1,1001],[0,-1],[NaN,13]])assert.equal(reportProgress(completed,total,storage,()=>time),false);
  for(const bad of ["bad"," ".repeat(8193),JSON.stringify({version:2,apps:{}}),
    JSON.stringify({version:1,apps:{unknown:record}}), JSON.stringify({version:1,apps:{"neon-tactics":{...record,actions:[]}}}),
    JSON.stringify({version:1,apps:{"neon-tactics":{...record,updatedAt:"2026-02-30T00:00:00.000Z"}}}),
    JSON.stringify({version:1,apps:{"neon-tactics":{...record,completed:14}}})]){
    storage.setItem(PROGRESS_KEY,bad);assert.equal(reportProgress(1,13,storage,()=>time),false);
    assert.equal(clearProgress(storage),false);assert.equal(storage.getItem(PROGRESS_KEY),bad);
  }
  assert.equal(reportProgress(1,13,null,()=>time),false);
  assert.equal(reportProgress(1,13,memory(),()=>"fake-date"),false);
  const denied={getItem(){throw Error();}};assert.equal(reportProgress(1,13,denied,()=>time),false);assert.equal(clearProgress(denied),false);
});
test("pure modules have no browser storage, DOM, clock or network dependency",async()=>{
  for(const name of ["model","records","history"]){
    const source=await readFile(new URL("../dist/src/"+name+".js",import.meta.url),"utf8");
    assert.doesNotMatch(source,/\b(?:document|window|localStorage|fetch|XMLHttpRequest|WebSocket|Date)\b/);
    assert.doesNotMatch(source,/from\s+["'][^"']*(?:storage|progress|app|ui)\.js["']/);
  }
});
