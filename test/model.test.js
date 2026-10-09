import test from "node:test";import assert from "node:assert/strict";
import {operate,validate,evaluate,truthTable,testVectors,example,initial,missions,TYPES,LIMITS} from "../dist/src/model.js";
test("each gate computes all binary combinations",()=>{const expected={AND:[0,0,0,1],OR:[0,1,1,1],XOR:[0,1,1,0],NOT:[1,1,0,0],NAND:[1,1,1,0],NOR:[1,0,0,0],XNOR:[1,0,0,1]};for(const type of TYPES)assert.deepEqual([operate(type,0,0),operate(type,0,1),operate(type,1,0),operate(type,1,1)],expected[type]);});
test("all thirteen sample circuits exhaustively satisfy bounded missions",()=>{assert.equal(Object.keys(missions).length,13);for(const [key,m] of Object.entries(missions)){const c=example(key),rows=truthTable(c,key);assert.equal(rows.length,2**m.inputs.length);assert.ok(rows.every(r=>r.correct),key);assert.ok(rows.length<=LIMITS.rows);assert.ok(c.gates.length<=m.targetGates);assert.ok(m.gateLimit<=LIMITS.gates);assert.equal(new Set(rows.map(r=>JSON.stringify(r.inputs))).size,rows.length);assert.ok(rows.every(r=>r.expected.length===m.outputNames.length&&r.actual.every(v=>v===0||v===1)));}});
test("initial AND is not an XOR solution; no mutation from evaluation",()=>{const c=initial(),copy=structuredClone(c);assert.equal(truthTable(c).filter(r=>r.correct).length,1);assert.deepEqual(evaluate(c,{A:1,B:1}).outputs,[1]);assert.deepEqual(c,copy);});
test("cycles, forward refs, duplicate ids and oversized circuits reject",()=>{assert.throws(()=>validate({gates:[{id:"G1",type:"AND",a:"G1",b:"A"}],outputs:["G1"]}));assert.throws(()=>validate({gates:[{id:"G1",type:"AND",a:"G2",b:"A"},{id:"G2",type:"AND",a:"A",b:"B"}],outputs:["G1"]}));const c=example("difference");c.gates.push({...c.gates[0]});assert.throws(()=>validate(c));assert.throws(()=>validate({gates:Array.from({length:13},(_,i)=>({id:"G"+(i+1),type:"AND",a:"A",b:"B"})),outputs:["G13"]}));assert.throws(()=>operate("EVAL",1,0));assert.throws(()=>evaluate(initial(),{A:2,B:0}));});

const asNumber = output => output.reduce((total,bit,i)=>total+bit*2**i,0);
test("three-bit addition equals arithmetic for all 128 combinations including carry propagation",()=>{
  for(const row of truthTable(example("adder3"),"adder3")){
    const i=row.inputs,a=i.A0+2*i.A1+4*i.A2,b=i.B0+2*i.B1+4*i.B2;
    assert.equal(asNumber(row.actual),a+b+i.Cin);assert.equal(asNumber(row.expected),a+b+i.Cin);
  }
  assert.deepEqual(evaluate(example("adder3"),{A0:1,A1:1,A2:1,B0:0,B1:0,B2:0,Cin:1},"adder3").outputs,[0,0,0,1]);
});
test("full adder includes carry input rather than behaving as half adder",()=>{
  for(const row of truthTable(example("fullAdder"),"fullAdder"))assert.equal(asNumber(row.actual),Object.values(row.inputs).reduce((a,b)=>a+b,0));
  const c=example("fullAdder");c.gates[1].b="0";assert.ok(truthTable(c,"fullAdder").some(r=>!r.correct));
});
test("two-bit ALU preserves modular result and distinguishes borrow from carry",()=>{
  for(const row of truthTable(example("alu2"),"alu2")){
    const i=row.inputs,a=i.A0+2*i.A1,b=i.B0+2*i.B1,result=i.M?a-b:a+b;
    assert.equal(asNumber(row.actual.slice(0,2)),((result%4)+4)%4);
    assert.equal(row.actual[2],Number(i.M?a<b:a+b>3));
    assert.deepEqual(row.expected,row.actual);
  }
});
test("parity generation balances ones; checker detects single flips and misses even flips",()=>{
  const c=example("parity");
  for(const row of truthTable(c,"parity")){
    const i=row.inputs,ones=i.D0+i.D1+i.D2+i.D3;
    assert.equal((ones+row.actual[0])%2,0);assert.equal(row.actual[1],(ones+i.P)%2);
    const good={...i,P:row.actual[0]};assert.equal(evaluate(c,good,"parity").outputs[1],0);
    for(const bit of missions.parity.inputs)assert.equal(evaluate(c,{...good,[bit]:1-good[bit]},"parity").outputs[1],1);
    assert.equal(evaluate(c,{...good,D0:1-good.D0,D1:1-good.D1},"parity").outputs[1],0);
  }
});
test("decoder is one-hot only when enabled, with low-bit address order",()=>{
  for(const {inputs:i,actual,expected} of truthTable(example("decoder"),"decoder")){
    assert.equal(actual.reduce((a,b)=>a+b,0),i.EN);
    assert.equal(actual[i.A0+2*i.A1],i.EN);assert.deepEqual(expected,actual);
  }
});
test("mux ignores all unselected channels over every data and selector combination",()=>{
  const c=example("mux4");
  for(const {inputs:i,actual,expected} of truthTable(c,"mux4")){
    const channel=i.S0+2*i.S1;assert.deepEqual(actual,[i["D"+channel]]);assert.deepEqual(expected,actual);
    for(let n=0;n<4;n++)if(n!==channel)assert.deepEqual(evaluate(c,{...i,["D"+n]:1-i["D"+n]},"mux4").outputs,actual);
  }
});
test("comparator is mutually exclusive and swapping operands swaps GT/LT",()=>{
  const c=example("comparator");
  for(const {inputs:i,actual,expected} of truthTable(c,"comparator")){
    const a=i.A0+2*i.A1,b=i.B0+2*i.B1;
    assert.equal(actual.reduce((x,y)=>x+y,0),1);assert.deepEqual(actual,[Number(a>b),Number(a===b),Number(a<b)]);assert.deepEqual(expected,actual);
    assert.deepEqual(evaluate(c,{A0:i.B0,A1:i.B1,B0:i.A0,B1:i.A1},"comparator").outputs,[actual[2],actual[1],actual[0]]);
  }
});
test("priority arbitration grants only the highest active request",()=>{
  for(const {inputs:i,actual,expected} of truthTable(example("priority"),"priority")){
    const requests=missions.priority.inputs.map(k=>i[k]),winner=requests.lastIndexOf(1);
    assert.equal(actual.reduce((a,b)=>a+b,0),Number(winner>=0));
    actual.forEach((v,k)=>{assert.equal(v,Number(k===winner));assert.ok(v<=requests[k]);});assert.deepEqual(expected,actual);
  }
});
test("all directed vectors are valid exhaustive-table rows; evaluation never mutates",()=>{
  for(const [key,m] of Object.entries(missions)){
    const c=example(key),before=structuredClone(c),rows=truthTable(c,key),vectors=testVectors(c,key);
    assert.ok(vectors.length>=2);
    for(const v of vectors){assert.ok(v.correct);assert.deepEqual(rows.find(r=>JSON.stringify(r.inputs)===JSON.stringify(v.inputs)).expected,v.expected);assert.equal(Object.keys(v.inputs).length,m.inputs.length);}
    assert.deepEqual(c,before);assert.notEqual(example(key),c);validate(initial(key),key);assert.ok(truthTable(initial(key),key).some(r=>!r.correct));
  }
});
test("bad references, output arity, sparse arrays, foreign inputs and gate restrictions reject",()=>{
  const invalid=[null,{}, {gates:[],outputs:["C"]}, {gates:[],outputs:[]}, {gates:[],outputs:["A","B"]},
    {gates:[],outputs:Array(1)}, {gates:Array(1),outputs:["A"]},
    ...["G0","G100","A","__proto__",1].map(id=>({gates:[{id,type:"AND",a:"A",b:"B"}],outputs:["A"]})),
    {gates:[{id:"G1",type:"NOT",a:"A",b:"G1"}],outputs:["G1"]},
    {gates:[{id:"G1",type:"NOT",a:"G2",b:"0"},{id:"G2",type:"NOT",a:"G1",b:"0"}],outputs:["G1"]}];
  for(const c of invalid)assert.throws(()=>validate(c),TypeError);
  for(const key of ["missing","constructor","__proto__","toString"]){assert.throws(()=>initial(key),TypeError);assert.throws(()=>example(key),TypeError);assert.throws(()=>truthTable(initial(),key),TypeError);}
  for(const inputs of [null,[],{}, {A:1}, {A:1,B:0,C:0}, {A:true,B:0}, {A:"1",B:0}, {A:NaN,B:0}, Object.create({A:0,B:0})])assert.throws(()=>evaluate(initial(),inputs),TypeError);
  const nand=initial("nandMux");nand.gates[0].type="XOR";assert.throws(()=>validate(nand,"nandMux"),TypeError);
  const foreign=initial("adder3");foreign.gates[0].a="A";assert.throws(()=>validate(foreign,"adder3"),TypeError);
});
test("mission gate ceilings permit the exact bound but reject the next gate",()=>{
  for(const [key,m] of Object.entries(missions)){
    const gates=Array.from({length:m.gateLimit},(_,i)=>({id:"G"+(i+1),type:m.allowedTypes[0],a:i?"G"+i:m.inputs[0],b:"0"}));
    const c={gates,outputs:m.outputNames.map(()=>gates.at(-1).id)};validate(c,key);assert.equal(truthTable(c,key).length,2**m.inputs.length);
    c.gates.push({id:"G"+(m.gateLimit+1),type:m.allowedTypes[0],a:m.inputs[0],b:"0"});assert.throws(()=>validate(c,key),TypeError);
  }
});
test("a two-input function cannot solve a mission that depends on a third input",()=>{
  const key="nandMux",m=missions[key],sources=[...m.inputs,"0","1"];
  // Enumerate every zero/one-gate wiring, including constants and direct outputs.
  for(const ref of sources)assert.ok(truthTable({gates:[],outputs:[ref]},key).some(r=>!r.correct));
  for(const a of sources)for(const b of sources)for(const ref of [...sources,"G1"]){
    const c={gates:[{id:"G1",type:"NAND",a,b}],outputs:[ref]};assert.ok(truthTable(c,key).some(r=>!r.correct));
  }
  assert.ok(truthTable(example(key),key).every(r=>r.correct));
});
test("missing carry and swapped output wiring produce actionable counterexamples",()=>{
  const c=example("adder3");c.gates.find(g=>g.id==="G7").b="0";
  const failures=truthTable(c,"adder3").filter(r=>!r.correct);assert.ok(failures.length>0);assert.ok(failures.some(r=>r.inputs.A0===1&&r.inputs.B0===1));
  const d=example("decoder");[d.outputs[1],d.outputs[2]]=[d.outputs[2],d.outputs[1]];assert.equal(truthTable(d,"decoder").filter(r=>!r.correct).length,2);
});
