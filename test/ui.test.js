// Synthetic DOM contract checks only: this is not browser/layout evidence.
import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import {missions,truthTable} from "../dist/src/model.js";

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
