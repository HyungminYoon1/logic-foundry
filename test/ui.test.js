// Synthetic DOM contract checks only: this is not browser/layout evidence.
import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {missions,truthTable,initial,example} from "../dist/src/model.js";
import {exportCircuit,decodeState} from "../dist/src/records.js";
import {STATE_KEY} from "../dist/src/storage.js";
import {PROGRESS_KEY} from "../dist/src/progress.js";

class NodeStub {
  constructor(tag){this.tag=tag;this.children=[];this.attributes={};this.events={};this.style={};this.value="";this.checked=false;this.disabled=false;this.textContent="";}
  setAttribute(key,value){this.attributes[key]=String(value);}
  append(...nodes){this.children.push(...nodes);}
  replaceChildren(...nodes){this.children=[...nodes];}
  addEventListener(name,fn){this.events[name]=fn;}
  fire(name){if(!this.disabled)return this.events[name]?.({target:this});}
  focus(){document.activeElement=this;}
  querySelectorAll(selector){const found=[];const match=n=>selector.startsWith("[data-gate=")?n.attributes["data-gate"]===selector.match(/"(.*?)"/)[1]:selector.startsWith("[data-input=")?n.attributes["data-input"]===selector.match(/"(.*?)"/)[1]:n.tag===selector;const visit=n=>{for(const child of n.children){if(match(child))found.push(child);visit(child);}};visit(this);return found;}
  querySelector(selector){return this.querySelectorAll(selector)[0]??null;}
}
const html=await readFile(new URL("../dist/index.html",import.meta.url),"utf8"),nodes=new Map(),tools=new Map();
for(const [,tag,id]of html.matchAll(/<(\w+)\b[^>]*\bid="([^"]+)"/g))nodes.set("#"+id,new NodeStub(tag));
globalThis.document={activeElement:null,createElement:tag=>new NodeStub(tag),createElementNS:(_,tag)=>new NodeStub(tag),
  querySelector(selector){const [root,child]=selector.split(" "),node=nodes.get(root);assert.ok(node,"Missing HTML control: "+root);return child?node.querySelector(child):node;},
  modelContext:{registerTool(tool){tools.set(tool.name,tool);}}};
globalThis.window={addEventListener(){}};
const localData=new Map();
globalThis.localStorage={getItem:key=>localData.get(key)??null,setItem:(key,value)=>localData.set(key,value),removeItem:key=>localData.delete(key)};
await import("../dist/src/app.js");
const $=id=>nodes.get("#"+id),read=()=>tools.get("read_logic_state").execute(),load=key=>tools.get("load_logic_example").execute({mission:key});
const edit=input=>tools.get("change_logic_gate").execute(input);
const selectMission=key=>{$("mission").value=key;$("mission").fire("change");};

test("synthetic UI switches all mission input/output contracts and full truth tables",()=>{
  for(const [key,m]of Object.entries(missions)){
    const state=load(key);assert.equal(state.passed,state.total);assert.equal(state.total,2**m.inputs.length);
    assert.deepEqual(state.outputNames,m.outputNames);assert.equal($("inputSwitches").children.length,m.inputs.length);
    assert.equal($("outputEditor").children.length,m.outputs);assert.equal($("lamps").children.length,m.outputs);
    assert.equal($("truthBody").children.length,state.total);assert.equal($("vectorList").children.length,m.vectors.length);
    const selectors=$("outputEditor").querySelectorAll("select");selectors.forEach((s,i)=>assert.equal(s.attributes["aria-label"],m.outputNames[i]+" 출력 연결"));
    assert.ok($("missionIO").textContent);assert.ok($("truthOrder").textContent.includes(m.outputNames.join(" · ")));
  }
});
test("synthetic UI distinguishes assisted practice from direct verification and resumes drafts",()=>{
  load("difference");$("verify").fire("click");assert.equal(read().solved.length,0);
  $("reset").fire("click");edit({id:"G1",type:"XOR"});$("verify").fire("click");assert.deepEqual(read().solved,["difference"]);
  $("inputSwitches").children[0].fire("click");const before=read();
  selectMission("adder3");$("showHint").fire("click");assert.equal($("hintList").children.length,1);
  selectMission("difference");assert.deepEqual(read().circuit,before.circuit);assert.deepEqual(read().inputs,before.inputs);
  selectMission("adder3");assert.equal($("hintList").children.length,1);
  load("alu2");$("verify").fire("click");assert.deepEqual(read().solved,["difference"]);
});
test("synthetic UI applies counterexamples and vectors and filters failures",()=>{
  load("adder3");$("reset").fire("click");const state=read(),rows=truthTable(state.circuit,state.mission),first=rows.find(r=>!r.correct);
  $("counterexample").fire("click");assert.deepEqual(read().inputs,first.inputs);
  $("onlyFailures").checked=true;$("onlyFailures").fire("change");assert.equal($("truthBody").children.length,rows.filter(r=>!r.correct).length);
  $("vectorList").children[0].fire("click");assert.deepEqual(read().inputs,{A0:1,A1:1,A2:1,B0:0,B1:0,B2:0,Cin:1});
  load("adder3");assert.equal($("truthBody").children.length,0);assert.equal($("counterexample").disabled,true);
  $("onlyFailures").checked=false;$("onlyFailures").fire("change");
});
test("synthetic UI enforces NAND-only palette and gate budget and keeps rejected tools atomic",()=>{
  load("nandMux");$("reset").fire("click");assert.deepEqual($("gateType").children.map(n=>n.value||n.attributes.value),["NAND"]);
  for(let n=1;n<missions.nandMux.gateLimit;n++)$("addGate").fire("click");assert.equal($("addGate").disabled,true);assert.equal(read().circuit.gates.length,8);
  const before=read();
  for(const input of [{id:"G1",type:"XOR"},{id:"G1",a:"G1"},{id:"G1",a:"G2"},{id:"G1",b:"A"},{id:"G99",type:"NAND"}])assert.throws(()=>edit(input),TypeError);
  assert.throws(()=>load("constructor"),TypeError);assert.throws(()=>tools.get("change_logic_gate").execute({id:"G1",extra:"invalid"}),TypeError);assert.deepEqual(read(),before);
});
test("synthetic UI deletion repairs dependent wires and output references",()=>{
  load("difference");$("reset").fire("click");$("addGate").fire("click");edit({id:"G2",a:"G1"});
  const output=$("outputEditor").querySelector("select");output.value="G1";output.fire("change");
  $("gateList").querySelector('[data-gate="G1"]').fire("click");$("removeGate").fire("click");
  const state=read();assert.equal(state.circuit.gates[0].a,"0");assert.deepEqual(state.circuit.outputs,["0"]);
  $("removeGate").fire("click");assert.equal(read().circuit.gates.length,0);assert.equal($("gateType").disabled,true);
});

test("synthetic UI saves drafts, durable independent completion and only minimal gallery progress",()=>{
  $("eraseLocal").fire("click");selectMission("difference");$("reset").fire("click");
  assert.equal(Object.hasOwn(JSON.parse(localData.get(PROGRESS_KEY)).apps,"logic-foundry"),false);
  const emptySummary=localData.get(PROGRESS_KEY);$("showHint").fire("click");assert.equal(localData.get(PROGRESS_KEY),emptySummary);
  edit({id:"G1",type:"XOR"});$("saveLocal").fire("click");
  assert.equal(localData.get(PROGRESS_KEY),emptySummary);edit({id:"G1",type:"NOR"});$("loadLocal").fire("click");
  assert.equal(read().circuit.gates[0].type,"XOR");assert.equal(read().exampleLoaded,false);
  $("verify").fire("click");assert.deepEqual(read().solved,["difference"]);
  assert.deepEqual(Object.keys(decodeState(localData.get(STATE_KEY)).achievements),["difference"]);
  const record=JSON.parse(localData.get(PROGRESS_KEY)).apps["logic-foundry"];
  assert.equal(record.completed,1);assert.equal(record.total,13);
  assert.deepEqual(Object.keys(record),["completed","total","updatedAt"]);
  const before=localData.get(PROGRESS_KEY);load("adder3");$("verify").fire("click");assert.equal(localData.get(PROGRESS_KEY),before);
});
test("synthetic UI undo restores gate deletions, output wires and assisted state",()=>{
  selectMission("adder");$("reset").fire("click");edit({id:"G1",type:"XOR"});
  const before=read();$("example").fire("click");assert.equal(read().exampleLoaded,true);
  $("undo").fire("click");assert.deepEqual(read().circuit,before.circuit);assert.equal(read().exampleLoaded,false);
  $("addGate").fire("click");edit({id:"G2",a:"G1"});
  const output=$("outputEditor").querySelector("select");output.value="G2";output.fire("change");const wired=read().circuit;
  $("gateList").querySelector('[data-gate="G1"]').fire("click");$("removeGate").fire("click");
  $("undo").fire("click");assert.deepEqual(read().circuit,wired);
  $("reset").fire("click");$("undo").fire("click");assert.deepEqual(read().circuit,wired);
});
test("synthetic UI file import is atomic, rejects forged solved flags and keeps valid imports assisted",async()=>{
  selectMission("difference");$("reset").fire("click");const input=$("importCircuit"),before=read();
  const invalid=[{version:1,mission:"difference",circuit:example("difference"),solved:true},
    {version:1,mission:"difference",circuit:{gates:[{id:"G1",type:"XOR",a:"G1",b:"B"}],outputs:["G1"]}}];
  for(const payload of invalid){input.files=[{size:100,text:async()=>JSON.stringify(payload)}];await input.fire("change");assert.deepEqual(read(),before);}
  let readFile=false;input.files=[{size:16385,text:async()=>{readFile=true;return "";}}];await input.fire("change");assert.equal(readFile,false);assert.deepEqual(read(),before);
  input.files=[{size:500,text:async()=>exportCircuit("adder",example("adder"))}];await input.fire("change");
  assert.equal(read().mission,"adder");assert.equal(read().exampleLoaded,true);assert.equal(read().passed,4);
  const summary=localData.get(PROGRESS_KEY);$("verify").fire("click");assert.equal(localData.get(PROGRESS_KEY),summary);
  $("saveLocal").fire("click");$("reset").fire("click");$("loadLocal").fire("click");assert.equal(read().exampleLoaded,true);
});
test("synthetic UI corrupt storage and quota failures do not claim a durable achievement",()=>{
  selectMission("fullAdder");$("reset").fire("click");
  // The visible editor builds a legal five-gate full adder, then verifies all eight rows.
  const gates=example("fullAdder").gates;
  edit(gates[0]);for(const gate of gates.slice(1)){$("addGate").fire("click");edit(gate);}
  const outputs=$("outputEditor").querySelectorAll("select");outputs[0].value="G2";outputs[0].fire("change");
  const updated=$("outputEditor").querySelectorAll("select");updated[1].value="G5";updated[1].fire("change");
  const before=read(),summary=localData.get(PROGRESS_KEY),stored=localData.get(STATE_KEY);
  localData.set(STATE_KEY,"corrupt");$("verify").fire("click");assert.deepEqual(read().solved,before.solved);assert.equal(localData.get(PROGRESS_KEY),summary);
  localData.set(STATE_KEY,stored);const original=globalThis.localStorage.setItem;
  globalThis.localStorage.setItem=()=>{throw Error("Quota");};$("verify").fire("click");globalThis.localStorage.setItem=original;
  assert.deepEqual(read().solved,before.solved);assert.ok($("status").textContent.includes("저장 불가"));
  $("verify").fire("click");assert.ok(read().solved.includes("fullAdder"));assert.equal(read().passed,8);
});
test("synthetic UI erase keeps other app summary and private data, and removes loadable drafts",()=>{
  const aggregate=JSON.parse(localData.get(PROGRESS_KEY));aggregate.apps["neon-tactics"]={completed:1,total:5,updatedAt:"2026-10-09T00:00:00.000Z"};
  localData.set(PROGRESS_KEY,JSON.stringify(aggregate));localData.set("neon-private","keep");
  $("eraseLocal").fire("click");assert.equal(localData.has(STATE_KEY),false);assert.deepEqual(read().solved,[]);
  assert.deepEqual(Object.keys(JSON.parse(localData.get(PROGRESS_KEY)).apps),["neon-tactics"]);
  assert.equal(localData.get("neon-private"),"keep");$("loadLocal").fire("click");assert.ok($("status").textContent.includes("없습니다"));
});

test("synthetic UI signal links select upstream gates or focus actual input switches",()=>{
  selectMission("difference");$("reset").fire("click");
  $("sourceLinks").children[0].fire("click");assert.equal(document.activeElement.attributes["data-input"],"A");
  $("addGate").fire("click");edit({id:"G2",a:"G1"});$("sourceLinks").children[0].fire("click");assert.equal($("selectedGate").textContent,"G1 편집");
});
test("synthetic UI has at most 32 undo entries per mission and tool examples obey the same provenance",()=>{
  selectMission("difference");$("reset").fire("click");
  for(let i=0;i<40;i++)edit({id:"G1",type:i%2?"AND":"XOR"});
  assert.equal($("undo").textContent,"편집 되돌리기 (32)");
  const c=read().circuit;load("difference");assert.equal(read().exampleLoaded,true);$("undo").fire("click");
  assert.deepEqual(read().circuit,c);assert.equal(read().exampleLoaded,false);
  for(let i=0;i<32;i++)$("undo").fire("click");assert.equal($("undo").disabled,true);
});
test("synthetic UI reload revalidates durable circuits without writing progress on initial view",async()=>{
  selectMission("difference");$("reset").fire("click");edit({id:"G1",type:"XOR"});$("saveLocal").fire("click");$("verify").fire("click");
  const before=localData.get(PROGRESS_KEY);
  await import("../dist/src/app.js?reload-valid");assert.deepEqual(read().solved,["difference"]);assert.equal(localData.get(PROGRESS_KEY),before);
  assert.deepEqual(read().circuit,initial());
  const state=JSON.parse(localData.get(STATE_KEY));state.achievements.difference.gates[0].type="AND";
  localData.set(STATE_KEY,JSON.stringify(state));await import("../dist/src/app.js?reload-corrupt");
  assert.deepEqual(read().solved,[]);assert.equal(localData.get(PROGRESS_KEY),before);
});

test("reset restores the same circuit and input switches after vectors and manual changes",()=>{
  for(const key of Object.keys(missions)){
    selectMission(key);$("reset").fire("click");
    const baseline=read();
    $("vectorList").children[0].fire("click");
    $("inputSwitches").children[0].fire("click");
    $("reset").fire("click");
    assert.deepEqual(read().inputs,baseline.inputs);
    assert.deepEqual(read().circuit,initial(key));
    const resetState=read();$("reset").fire("click");assert.deepEqual(read(),resetState);
  }
});

test("failed private erase preserves the durable completion and its gallery summary",()=>{
  localData.delete(STATE_KEY);
  selectMission("difference");$("reset").fire("click");edit({id:"G1",type:"XOR"});$("verify").fire("click");
  const before=localData.get(STATE_KEY),summary=localData.get(PROGRESS_KEY),solved=read().solved;
  const remove=globalThis.localStorage.removeItem;
  globalThis.localStorage.removeItem=key=>{if(key===STATE_KEY)throw Error("blocked");remove(key);};
  try{$("eraseLocal").fire("click");}finally{globalThis.localStorage.removeItem=remove;}
  assert.equal(localData.get(STATE_KEY),before);
  assert.equal(localData.get(PROGRESS_KEY),summary);
  assert.deepEqual(read().solved,solved);
  assert.match($("status").textContent,/삭제 미완료/);
});
