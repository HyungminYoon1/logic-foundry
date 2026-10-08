import {missions,TYPES,initial,example,evaluate,truthTable,validate} from "./model.js";
import {expose,tool} from "./ui.js";
const $=s=>document.querySelector(s),NS="http://www.w3.org/2000/svg";
let mission="difference",circuit=initial(),selected="G1",inputs={A:0,B:1,C:0};
const meanings={AND:"두 입력이 모두 1일 때만 1입니다.",OR:"한 입력이라도 1이면 1입니다.",XOR:"두 입력이 서로 다를 때만 1입니다.",NOT:"입력의 0과 1을 뒤집습니다.",NAND:"AND의 결과를 뒤집습니다.",NOR:"OR의 결과를 뒤집습니다.",XNOR:"두 입력이 같을 때만 1입니다."};
function el(tag,text,attrs={}){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;for(const [k,v]of Object.entries(attrs))node.setAttribute(k,v);return node;}
function svg(tag,attrs,text){const node=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))node.setAttribute(k,v);if(text!==undefined)node.textContent=text;$("#circuit").append(node);return node;}
function options(select,refs,value){select.replaceChildren(...refs.map(ref=>el("option",ref,{value:ref})));select.value=value;}
function summary(){const rows=truthTable(circuit,mission);return {mission,circuit:structuredClone(circuit),inputs:{...inputs},outputs:evaluate(circuit,inputs,mission).outputs,passed:rows.filter(r=>r.correct).length,total:rows.length};}
function commit(next){validate(next,mission);circuit=next;if(!circuit.gates.some(g=>g.id===selected))selected=circuit.gates[0]?.id??null;render();const state=summary();$("#status").textContent=state.total+"개 입력 조합 중 "+state.passed+"개 통과. 진리표에서 결과를 확인하세요.";return state;}
function updateGate(id,change){const next=structuredClone(circuit),gate=next.gates.find(g=>g.id===id);if(!gate)throw new TypeError("Unknown gate");Object.assign(gate,change);return commit(next);}
function render(){
  const m=missions[mission],live=evaluate(circuit,inputs,mission),rows=truthTable(circuit,mission),passed=rows.filter(r=>r.correct).length;
  $("#mission").value=mission;$("#missionName").textContent=m.name;$("#missionDescription").textContent=m.description;$("#score").textContent=passed+" / "+rows.length;
  $("#inputSwitches").replaceChildren(...m.inputs.map(key=>{const b=el("button",key+"  "+inputs[key],{"aria-label":"입력 "+key,"aria-pressed":String(inputs[key]===1)});b.addEventListener("click",()=>{inputs[key]^=1;render();});return b;}));
  $("#gateList").replaceChildren(...circuit.gates.map(g=>{const b=el("button",g.id+" "+g.type,{"aria-pressed":String(selected===g.id),"aria-label":g.id+" 게이트 선택"});b.addEventListener("click",()=>{selected=g.id;render();});return b;}));
  const gate=circuit.gates.find(g=>g.id===selected),index=circuit.gates.findIndex(g=>g.id===selected);
  options($("#gateType"),TYPES,gate?.type??"AND");const refs=[...m.inputs,"0","1",...circuit.gates.slice(0,Math.max(0,index)).map(g=>g.id)];
  options($("#sourceA"),refs,gate?.a??"A");options($("#sourceB"),refs,gate?.b??"B");
  $("#gateType").disabled=!gate;$("#sourceA").disabled=!gate;$("#sourceB").disabled=!gate||gate.type==="NOT";$("#removeGate").disabled=!gate;$("#addGate").disabled=circuit.gates.length>=12;$("#gateMeaning").textContent=gate?meanings[gate.type]:"게이트를 추가하거나 입력을 출력에 직접 연결할 수 있습니다.";
  $("#outputEditor").replaceChildren(...circuit.outputs.map((value,i)=>{const label=el("label",m.outputs===2?(i===0?"SUM 출력":"CARRY 출력"):"최종 출력");const select=el("select",undefined,{"aria-label":m.outputs===2?(i===0?"SUM 출력 연결":"CARRY 출력 연결"):"최종 출력 연결"});options(select,[...m.inputs,"0","1",...circuit.gates.map(g=>g.id)],value);select.addEventListener("change",()=>{const next=structuredClone(circuit);next.outputs[i]=select.value;commit(next);});label.append(select);return label;}));
  $("#lamps").replaceChildren(...live.outputs.map((v,i)=>{const div=el("div",undefined,{class:"lamp"+(v?" on":"")});div.append(el("i"),el("span",m.outputs===2?(i===0?"SUM":"CARRY"):"OUTPUT"),el("b",String(v)));return div;}));
  $("#truthHead").replaceChildren(el("tr"));$("#truthHead tr").append(...[...m.inputs,"목표","현재","검증"].map(t=>el("th",t,{scope:"col"})));
  $("#truthBody").replaceChildren(...rows.map(r=>{const row=el("tr",undefined,{class:r.correct?"pass":"fail"});row.append(...[...m.inputs.map(k=>r.inputs[k]),r.expected.join(" · "),r.actual.join(" · "),r.correct?"통과":"불일치"].map(v=>el("td",String(v))));return row;}));
  draw(live.values);
}
function draw(values){
  $("#circuit").replaceChildren();
  const m=missions[mission],positions=new Map(),depths=new Map([...m.inputs,"0","1"].map(key=>[key,0]));
  for(const g of circuit.gates) depths.set(g.id,1+Math.max(depths.get(g.a),g.type==="NOT"?0:depths.get(g.b)));
  const maxDepth=Math.max(1,...depths.values()),columns=new Map();
  for(const g of circuit.gates){const depth=depths.get(g.id);if(!columns.has(depth))columns.set(depth,[]);columns.get(depth).push(g);}
  const width=Math.max(450,310+maxDepth*140),height=Math.max(360,Math.max(1,...[...columns.values()].map(c=>c.length))*76+50);
  $("#circuit").setAttribute("viewBox","0 0 "+width+" "+height);
  $("#circuit").style.minWidth=(width>600?width*.7:0)+"px";$("#circuit").style.height=Math.max(260,height*.7)+"px";
  const sourceRefs=[...m.inputs,...["0","1"].filter(ref=>circuit.gates.some(g=>g.a===ref||g.b===ref)||circuit.outputs.includes(ref))];
  sourceRefs.forEach((ref,i)=>positions.set(ref,{x:60,y:55+i*(height-110)/Math.max(1,sourceRefs.length-1)}));
  for(const [depth,gates]of columns)gates.forEach((g,i)=>positions.set(g.id,{x:170+(depth-1)*140,y:height/2+(i-(gates.length-1)/2)*76}));
  const line=(ref,to,offset=0)=>{const p=positions.get(ref);if(!p)return;svg("path",{d:`M${p.x+35} ${p.y} C${(p.x+to.x)/2} ${p.y},${(p.x+to.x)/2} ${to.y+offset},${to.x-40} ${to.y+offset}`,fill:"none",stroke:values[ref]?"#b8ee85":"#496053","stroke-width":values[ref]?3:2});};
  for(const g of circuit.gates){const p=positions.get(g.id);line(g.a,p,g.type==="NOT"?0:-10);if(g.type!=="NOT")line(g.b,p,10);}
  circuit.outputs.forEach((ref,i)=>line(ref,{x:width-70,y:height/2+(i-(m.outputs-1)/2)*92}));
  for(const ref of sourceRefs){const p=positions.get(ref);svg("circle",{cx:p.x,cy:p.y,r:22,fill:values[ref]?"#b8ee85":"#233d2c",stroke:"#75977c"});svg("text",{x:p.x,y:p.y+6,"text-anchor":"middle",fill:values[ref]?"#172b1c":"#c5d8ca","font-size":18},ref);}
  for(const g of circuit.gates){const p=positions.get(g.id);svg("rect",{x:p.x-40,y:p.y-25,width:80,height:50,rx:8,fill:"#203927",stroke:g.id===selected?"#e4b56b":values[g.id]?"#b8ee85":"#698171","stroke-width":g.id===selected?3:1});svg("text",{x:p.x,y:p.y+6,"text-anchor":"middle",fill:"#d4e5d7","font-size":18,"font-weight":700},g.type);svg("text",{x:p.x,y:p.y+42,"text-anchor":"middle",fill:"#97b19c","font-size":15},g.id);}
  circuit.outputs.forEach((ref,i)=>{const y=height/2+(i-(m.outputs-1)/2)*92;svg("circle",{cx:width-70,cy:y,r:23,fill:values[ref]?"#b8ee85":"#203927",stroke:"#75977c"});svg("text",{x:width-70,y:y+6,"text-anchor":"middle",fill:values[ref]?"#172b1c":"#c5d8ca","font-size":18},String(values[ref]));});
}
$("#mission").addEventListener("change",e=>{mission=e.target.value;circuit=initial(mission);selected="G1";render();$("#status").textContent="새 도전 과제로 변경했습니다. 연결을 바꿔 모든 조합을 통과시켜 보세요.";});
for(const [id,key]of [["gateType","type"],["sourceA","a"],["sourceB","b"]])$("#"+id).addEventListener("change",e=>updateGate(selected,{[key]:e.target.value}));
$("#addGate").addEventListener("click",()=>{const used=new Set(circuit.gates.map(g=>g.id));let i=1;while(used.has("G"+i))i++;const next=structuredClone(circuit);selected="G"+i;next.gates.push({id:selected,type:"AND",a:"A",b:"B"});commit(next);});
$("#removeGate").addEventListener("click",()=>{const next=structuredClone(circuit),removed=selected;next.gates=next.gates.filter(g=>g.id!==removed);for(const g of next.gates){if(g.a===removed)g.a="0";if(g.b===removed)g.b="0";}next.outputs=next.outputs.map(v=>v===removed?"0":v);commit(next);$("#status").textContent="게이트를 삭제했습니다. 해당 연결은 상수 0으로 바뀝니다.";});
$("#reset").addEventListener("click",()=>{selected="G1";commit(initial(mission));$("#status").textContent="초기 AND 회로로 되돌렸습니다.";});
$("#example").addEventListener("click",()=>{selected="G1";commit(example(mission));$("#status").textContent="정답 예시를 불러왔습니다. 입력을 바꾸고 연결을 따라가 보세요.";});
$("#verify").addEventListener("click",()=>{const s=summary();$("#status").textContent=s.passed===s.total?"모든 "+s.total+"개 입력 조합을 통과했습니다! 다른 방법으로도 만들 수 있을까요?":s.total+"개 조합 중 "+s.passed+"개 통과. 불일치 행의 입력과 출력 값을 비교해 보세요.";});
render();
expose([
  tool("read_logic_state","Read this circuit, binary inputs and exhaustive verification counts.",{},()=>summary(),true),
  tool("change_logic_gate","Change an existing gate through the page's bounded acyclic gate editor.",{id:{type:"string"},type:{type:"string",enum:TYPES},a:{type:"string"},b:{type:"string"}},input=>{const {id,...change}=input;return updateGate(id,change);}),
  tool("load_logic_example","Load one of the same four example circuits available in the page.",{mission:{type:"string",enum:Object.keys(missions)}},input=>{if(!missions[input.mission])throw new TypeError("Unknown mission");mission=input.mission;selected="G1";return commit(example(mission));})
]);
