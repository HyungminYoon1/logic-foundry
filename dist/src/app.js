import {missions,TYPES,initial,example,evaluate,truthTable,testVectors,validate} from "./model.js";
import {expose,tool} from "./ui.js";
import {FILE_BYTES,copyDraft,exportCircuit,importCircuit,recordCompletion} from "./records.js";
import {createHistory} from "./history.js";
import {readState,writeState,eraseState} from "./storage.js";
import {reportProgress,clearProgress} from "./progress.js";
const $=s=>document.querySelector(s),NS="http://www.w3.org/2000/svg";
let mission="difference",circuit=initial(),selected="G1",inputs={A:0,B:1},hintCount=0,assisted=false;
const drafts=new Map(),solved=new Set(Object.keys(readState().state.achievements)),missionKeys=Object.keys(missions),histories=new Map();
function history(){if(!histories.has(mission))histories.set(mission,createHistory());return histories.get(mission);}
function snapshot(){return {circuit:structuredClone(circuit),inputs:{...inputs},hintCount,assisted};}
function restore(next){circuit=structuredClone(next.circuit);inputs={...next.inputs};hintCount=next.hintCount;assisted=next.assisted;if(!circuit.gates.some(g=>g.id===selected))selected=circuit.gates[0]?.id??null;}
function install(key,next){copyDraft(next,key);if(key!==mission)changeMission(key);history().push(snapshot());restore(next);render();}
const meanings={AND:"두 입력이 모두 1일 때만 1입니다.",OR:"한 입력이라도 1이면 1입니다.",XOR:"두 입력이 서로 다를 때만 1입니다.",NOT:"입력의 0과 1을 뒤집습니다.",NAND:"AND의 결과를 뒤집습니다.",NOR:"OR의 결과를 뒤집습니다.",XNOR:"두 입력이 같을 때만 1입니다."};
function el(tag,text,attrs={}){const node=document.createElement(tag);if(text!==undefined)node.textContent=text;for(const [k,v]of Object.entries(attrs))node.setAttribute(k,v);return node;}
function svg(tag,attrs,text){const node=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))node.setAttribute(k,v);if(text!==undefined)node.textContent=text;$("#circuit").append(node);return node;}
function options(select,refs,value){select.replaceChildren(...refs.map(ref=>el("option",ref,{value:ref})));select.value=value;}
function summary(){const rows=truthTable(circuit,mission),m=missions[mission];return {mission,circuit:structuredClone(circuit),inputs:{...inputs},outputNames:[...m.outputNames],outputs:evaluate(circuit,inputs,mission).outputs,passed:rows.filter(r=>r.correct).length,total:rows.length,gateLimit:m.gateLimit,exampleLoaded:assisted,solved:[...solved]};}
function changeMission(key,withExample=false){
  if(!Object.hasOwn(missions,key))throw new TypeError("Unknown mission");
  if(withExample){changeMission(key);const state=commit(example(key),{assisted:true,hintCount:0,inputs:Object.fromEntries(missions[key].inputs.map(k=>[k,0]))});$("#status").textContent="예시 회로 · 연습";return state;}
  if(key===mission)return summary();
  const saved=drafts.get(key),next=saved?.circuit??initial(key);
  validate(next,key);
  drafts.set(mission,{circuit:structuredClone(circuit),inputs:{...inputs},selected,hintCount,assisted});
  mission=key;circuit=structuredClone(next);selected=saved?.selected??"G1";
  inputs={...saved?.inputs??Object.fromEntries(missions[key].inputs.map(k=>[k,0]))};
  hintCount=saved?.hintCount??0;assisted=Boolean(saved?.assisted);
  render();$("#status").textContent="과제를 변경했습니다.";
  return summary();
}
function applyInputs(next){inputs={...next};render();$("#status").textContent="입력을 적용했습니다.";}
function selectGate(id){selected=id;render();$("#gateList").querySelector('[data-gate="'+id+'"]')?.focus();}
function verifyMission(){
  const s=summary(),m=missions[mission];
  if(s.passed!==s.total){const first=truthTable(circuit,mission).find(r=>!r.correct);$("#status").textContent=s.passed+" / "+s.total+" 통과. 첫 반례: "+m.inputs.map(k=>k+"="+first.inputs[k]).join(", ")+". 목표 "+first.expected.join(" · ")+", 현재 "+first.actual.join(" · ")+". '첫 반례 적용'으로 신호를 추적하세요.";return;}
  let saved=false,badge=true;
  if(!assisted){
    const stored=readState();
    if(stored.ok){const next=recordCompletion(stored.state,mission,snapshot());saved=writeState(next);if(saved){solved.clear();Object.keys(next.achievements).forEach(k=>solved.add(k));badge=reportProgress(solved.size,missionKeys.length);}}
  }
  render();$("#status").textContent=s.total+"개 조합 통과 · "+(assisted?"연습 완료":saved?"직접 해결 저장":"직접 해결 · 저장 불가")+(circuit.gates.length<=m.targetGates?" · 간결화 목표 달성":" · 간결화 목표 ≤ "+m.targetGates+"개")+(!badge?" · 갤러리 요약 저장 불가":"");
}
function commit(next,metadata={}){validate(next,mission);if(JSON.stringify(circuit)!==JSON.stringify(next)||Object.keys(metadata).length){history().push(snapshot());restore({...snapshot(),...metadata,circuit:next});}render();const state=summary();$("#status").textContent=state.passed+" / "+state.total+" 조합 통과";return state;}
function updateGate(id,change){const next=structuredClone(circuit),gate=next.gates.find(g=>g.id===id);if(!gate)throw new TypeError("Unknown gate");Object.assign(gate,change);return commit(next);}
function render(){
  const m=missions[mission],live=evaluate(circuit,inputs,mission),rows=truthTable(circuit,mission),passed=rows.filter(r=>r.correct).length;
  $("#mission").replaceChildren(...missionKeys.map((key,i)=>el("option",String(i+1).padStart(2,"0")+" · "+missions[key].level+" · "+missions[key].name+(solved.has(key)?" ✓":""),{value:key})));$("#mission").value=mission;
  $("#missionName").textContent=m.name;$("#missionDescription").textContent=m.description;$("#missionIO").textContent=m.io;$("#score").textContent=passed+" / "+rows.length;
  $("#progress").textContent="저장된 직접 해결 "+solved.size+" / "+missionKeys.length;
  $("#gateBudget").textContent=circuit.gates.length+" / "+m.gateLimit+"개 게이트 · 목표 ≤ "+m.targetGates+"개 · "+(assisted?"연습":"직접 도전");
  $("#undo").disabled=history().size===0;$("#undo").textContent="편집 되돌리기 ("+history().size+")";
  $("#nextMission").disabled=mission===missionKeys.at(-1);
  $("#inputSwitches").replaceChildren(...m.inputs.map(key=>{const b=el("button",key+"  "+inputs[key],{"aria-label":"입력 "+key,"aria-pressed":String(inputs[key]===1),"data-input":key});b.addEventListener("click",()=>{inputs[key]^=1;render();$("#inputSwitches").querySelector('[data-input="'+key+'"]')?.focus();});return b;}));
  $("#gateList").replaceChildren(...circuit.gates.map(g=>{const b=el("button",g.id+" "+g.type,{"aria-pressed":String(selected===g.id),"aria-label":g.id+" 게이트 선택","data-gate":g.id});b.addEventListener("click",()=>selectGate(g.id));return b;}));
  const gate=circuit.gates.find(g=>g.id===selected),index=circuit.gates.findIndex(g=>g.id===selected);
  $("#selectedGate").textContent=gate?gate.id+" 편집":"게이트 없음";
  options($("#gateType"),m.allowedTypes,gate?.type??m.allowedTypes[0]);const refs=[...m.inputs,"0","1",...circuit.gates.slice(0,Math.max(0,index)).map(g=>g.id)];
  options($("#sourceA"),refs,gate?.a??m.inputs[0]);options($("#sourceB"),refs,gate?.b??m.inputs[1]);
  $("#gateType").disabled=!gate;$("#sourceA").disabled=!gate;$("#sourceB").disabled=!gate||gate.type==="NOT";$("#removeGate").disabled=!gate;$("#addGate").disabled=circuit.gates.length>=m.gateLimit;$("#gateMeaning").textContent=gate?meanings[gate.type]:"게이트를 추가하거나 입력을 출력에 직접 연결할 수 있습니다.";
  $("#wiringRule").textContent="입력·상수·앞쪽 게이트만 연결 가능 · "+m.allowedTypes.join(" · ");
  $("#sourceLinks").replaceChildren(...(gate?[...new Set(gate.type==="NOT"?[gate.a]:[gate.a,gate.b])].map(ref=>{const b=el("button",ref+" = "+live.values[ref],{"aria-label":ref+" 신호 선택"});b.disabled=!circuit.gates.some(g=>g.id===ref)&&!m.inputs.includes(ref);b.addEventListener("click",()=>{if(m.inputs.includes(ref))$("#inputSwitches").querySelector('[data-input="'+ref+'"]')?.focus();else selectGate(ref);});return b;}):[]));
  $("#outputEditor").replaceChildren(...circuit.outputs.map((value,i)=>{const label=el("label",m.outputNames[i]+" 출력"),select=el("select",undefined,{"aria-label":m.outputNames[i]+" 출력 연결"});options(select,[...m.inputs,"0","1",...circuit.gates.map(g=>g.id)],value);select.addEventListener("change",()=>{const next=structuredClone(circuit);next.outputs[i]=select.value;commit(next);$("#outputEditor").querySelectorAll("select")[i]?.focus();});label.append(select);return label;}));
  $("#lamps").replaceChildren(...live.outputs.map((v,i)=>{const div=el("div",undefined,{class:"lamp"+(v?" on":"")});div.append(el("i"),el("span",m.outputNames[i]),el("b",String(v)));return div;}));
  $("#truthOrder").textContent="출력 순서: "+m.outputNames.join(" · ")+" · 전체 "+rows.length+"개 조합";
  $("#truthHead").replaceChildren(el("tr"));$("#truthHead tr").append(...[...m.inputs,"목표","현재","검증"].map(t=>el("th",t,{scope:"col"})));
  const visibleRows=$("#onlyFailures").checked?rows.filter(r=>!r.correct):rows;
  $("#truthBody").replaceChildren(...visibleRows.map(r=>{const row=el("tr",undefined,{class:r.correct?"pass":"fail"});row.append(...[...m.inputs.map(k=>r.inputs[k]),r.expected.join(" · "),r.actual.join(" · "),r.correct?"통과":"불일치"].map(v=>el("td",String(v))));return row;}));
  $("#tableSummary").textContent=visibleRows.length+"개 행 표시 · 불일치 "+(rows.length-passed)+"개";$("#counterexample").disabled=passed===rows.length;
  $("#vectorList").replaceChildren(...testVectors(circuit,mission).map(v=>{const b=el("button",undefined,{class:"vector","aria-label":v.label+" 입력 적용"});b.append(el("strong",v.label),el("span",m.inputs.map(k=>k+"="+v.inputs[k]).join(" ")),el("span","목표 "+v.expected.join(" · ")+" / 현재 "+v.actual.join(" · ")+" · "+(v.correct?"통과":"불일치")));b.addEventListener("click",()=>applyInputs(v.inputs));return b;}));
  $("#hintList").replaceChildren(...m.hints.slice(0,hintCount).map(h=>el("li",h)));$("#showHint").disabled=hintCount>=m.hints.length;$("#showHint").textContent=hintCount>=m.hints.length?"힌트 "+hintCount+" / "+m.hints.length:"다음 힌트 ("+hintCount+" / "+m.hints.length+")";
  draw(live.values);
}
function draw(values){
  $("#circuit").replaceChildren();
  const m=missions[mission],positions=new Map(),depths=new Map([...m.inputs,"0","1"].map(key=>[key,0]));
  for(const g of circuit.gates) depths.set(g.id,1+Math.max(depths.get(g.a),g.type==="NOT"?0:depths.get(g.b)));
  const maxDepth=Math.max(1,...depths.values()),columns=new Map();
  for(const g of circuit.gates){const depth=depths.get(g.id);if(!columns.has(depth))columns.set(depth,[]);columns.get(depth).push(g);}
  const width=Math.max(520,350+maxDepth*140),height=Math.max(360,m.inputs.length*60+70,m.outputs*92+70,Math.max(1,...[...columns.values()].map(c=>c.length))*76+70);
  $("#circuit").setAttribute("viewBox","0 0 "+width+" "+height);
  $("#circuit").style.minWidth=(width>600?width*.7:0)+"px";$("#circuit").style.height=Math.max(260,height*.7)+"px";
  const sourceRefs=[...m.inputs,...["0","1"].filter(ref=>circuit.gates.some(g=>g.a===ref||g.b===ref)||circuit.outputs.includes(ref))];
  sourceRefs.forEach((ref,i)=>positions.set(ref,{x:60,y:55+i*(height-110)/Math.max(1,sourceRefs.length-1)}));
  for(const [depth,gates]of columns)gates.forEach((g,i)=>positions.set(g.id,{x:170+(depth-1)*140,y:height/2+(i-(gates.length-1)/2)*76}));
  const line=(ref,to,offset=0,target="출력")=>{const p=positions.get(ref);if(!p)return;const wire=svg("path",{d:`M${p.x+35} ${p.y} C${(p.x+to.x)/2} ${p.y},${(p.x+to.x)/2} ${to.y+offset},${to.x-40} ${to.y+offset}`,fill:"none",stroke:values[ref]?"#b8ee85":"#496053","stroke-width":values[ref]?3:2});const title=document.createElementNS(NS,"title");title.textContent=ref+" → "+target+" = "+values[ref];wire.append(title);};
  for(const g of circuit.gates){const p=positions.get(g.id);line(g.a,p,g.type==="NOT"?0:-10,g.id+" 첫 입력");if(g.type!=="NOT")line(g.b,p,10,g.id+" 두 번째 입력");}
  circuit.outputs.forEach((ref,i)=>line(ref,{x:width-85,y:height/2+(i-(m.outputs-1)/2)*92},0,m.outputNames[i]));
  for(const ref of sourceRefs){const p=positions.get(ref);svg("circle",{cx:p.x,cy:p.y,r:22,fill:values[ref]?"#b8ee85":"#233d2c",stroke:"#75977c"});svg("text",{x:p.x,y:p.y+6,"text-anchor":"middle",fill:values[ref]?"#172b1c":"#c5d8ca","font-size":18},ref);}
  for(const g of circuit.gates){const p=positions.get(g.id);const node=svg("rect",{x:p.x-40,y:p.y-25,width:80,height:50,rx:8,fill:"#203927",stroke:g.id===selected?"#e4b56b":values[g.id]?"#b8ee85":"#698171","stroke-width":g.id===selected?3:1,role:"button",tabindex:0,"aria-label":g.id+" "+g.type+" 게이트 편집","aria-pressed":String(g.id===selected)});node.addEventListener("click",()=>selectGate(g.id));node.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();selectGate(g.id);}});svg("text",{x:p.x,y:p.y+6,"text-anchor":"middle",fill:"#d4e5d7","font-size":18,"font-weight":700,class:"node-label"},g.type);svg("text",{x:p.x,y:p.y+42,"text-anchor":"middle",fill:"#97b19c","font-size":15,class:"node-label"},g.id+" = "+values[g.id]);}
  circuit.outputs.forEach((ref,i)=>{const y=height/2+(i-(m.outputs-1)/2)*92;svg("circle",{cx:width-85,cy:y,r:23,fill:values[ref]?"#b8ee85":"#203927",stroke:"#75977c"});svg("text",{x:width-85,y:y+6,"text-anchor":"middle",fill:values[ref]?"#172b1c":"#c5d8ca","font-size":18},String(values[ref]));svg("text",{x:width-85,y:y-35,"text-anchor":"middle",fill:"#b3c9b7","font-size":14},m.outputNames[i]);});
}
$("#mission").addEventListener("change",e=>changeMission(e.target.value));
for(const [id,key]of [["gateType","type"],["sourceA","a"],["sourceB","b"]])$("#"+id).addEventListener("change",e=>updateGate(selected,{[key]:e.target.value}));
$("#addGate").addEventListener("click",()=>{const used=new Set(circuit.gates.map(g=>g.id));let i=1;while(used.has("G"+i))i++;const next=structuredClone(circuit),m=missions[mission];next.gates.push({id:"G"+i,type:m.allowedTypes[0],a:m.inputs[0],b:m.inputs[1]});commit(next);selectGate("G"+i);});
$("#removeGate").addEventListener("click",()=>{const next=structuredClone(circuit),removed=selected;next.gates=next.gates.filter(g=>g.id!==removed);for(const g of next.gates){if(g.a===removed)g.a="0";if(g.b===removed)g.b="0";}next.outputs=next.outputs.map(v=>v===removed?"0":v);commit(next);$("#status").textContent="게이트를 삭제했습니다. 해당 연결은 상수 0으로 바뀝니다.";});
$("#reset").addEventListener("click",()=>{commit(initial(mission),{hintCount:0,assisted:false});selected="G1";render();$("#status").textContent="초기 회로 · 직접 도전";});
$("#example").addEventListener("click",()=>{commit(example(mission),{assisted:true});selected="G1";render();$("#status").textContent="예시 회로 · 연습";});
$("#undo").addEventListener("click",()=>{const previous=history().undo();if(previous){restore(previous);render();$("#status").textContent="편집을 되돌렸습니다.";}});
$("#saveLocal").addEventListener("click",()=>{const stored=readState();if(stored.ok){stored.state.drafts[mission]=copyDraft(snapshot(),mission);if(writeState(stored.state)){$("#status").textContent="이 과제의 회로를 기기에 저장했습니다.";return;}}$("#status").textContent="저장 불가 · 브라우저 저장 설정이나 저장 데이터를 확인하세요.";});
$("#loadLocal").addEventListener("click",()=>{const stored=readState();if(!stored.ok){$("#status").textContent="저장 데이터를 읽을 수 없습니다.";return;}const saved=stored.state.drafts[mission];if(!saved){$("#status").textContent="이 과제의 저장 회로가 없습니다.";return;}install(mission,saved);$("#status").textContent="저장 회로를 불러왔습니다.";});
$("#eraseLocal").addEventListener("click",()=>{const erased=eraseState();if(erased)solved.clear();const cleared=clearProgress();render();$("#status").textContent=erased&&cleared?"저장 회로·완료 기록·갤러리 요약을 삭제했습니다.":"삭제 미완료 · 브라우저 저장 설정을 확인하세요.";});
$("#exportCircuit").addEventListener("click",()=>{const text=exportCircuit(mission,circuit),url=URL.createObjectURL(new Blob([text],{type:"application/json"})),a=el("a",undefined,{href:url,download:"logic-foundry-"+mission+".json"});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$("#status").textContent="회로 JSON을 내보냈습니다.";});
$("#importCircuit").addEventListener("change",async e=>{const file=e.target.files?.[0];if(!file)return;try{if(e.target.files.length!==1||file.size>FILE_BYTES)throw new TypeError("File limit");const loaded=importCircuit(await file.text());install(loaded.mission,{circuit:loaded.circuit,inputs:Object.fromEntries(missions[loaded.mission].inputs.map(k=>[k,0])),hintCount:0,assisted:true});$("#status").textContent="가져온 회로 · 연습";}catch{$("#status").textContent="가져오기 실패 · JSON 형식·과제·배선·16 KiB 제한을 확인하세요.";}finally{e.target.value="";}});
$("#verify").addEventListener("click",verifyMission);
$("#showHint").addEventListener("click",()=>{hintCount=Math.min(hintCount+1,missions[mission].hints.length);render();});
$("#onlyFailures").addEventListener("change",render);
$("#counterexample").addEventListener("click",()=>{const row=truthTable(circuit,mission).find(r=>!r.correct);if(row)applyInputs(row.inputs);});
$("#nextMission").addEventListener("click",()=>{const next=missionKeys[missionKeys.indexOf(mission)+1];if(next)changeMission(next);});
render();
expose([
  tool("read_logic_state","Read this circuit, binary inputs and exhaustive verification counts.",{},()=>summary(),true),
  tool("change_logic_gate","Change an existing gate through the page's bounded acyclic gate editor.",{id:{type:"string"},type:{type:"string",enum:TYPES},a:{type:"string"},b:{type:"string"}},input=>{const {id,...change}=input;return updateGate(id,change);}),
  tool("load_logic_example","Load a mission example from the visible challenge catalog. Counts as assisted practice, not an independent solve.",{mission:{type:"string",enum:missionKeys}},input=>changeMission(input.mission,true))
]);
