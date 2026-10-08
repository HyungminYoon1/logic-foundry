export const TYPES=Object.freeze(["AND","OR","XOR","NOT","NAND","NOR","XNOR"]);
export const missions=Object.freeze({
  difference:{name:"서로 다를 때 켜지는 램프",inputs:["A","B"],outputs:1,description:"A와 B가 다르면 출력이 1, 같으면 0이어야 합니다.",expected:({A,B})=>[A^B]},
  majority:{name:"세 명의 다수결",inputs:["A","B","C"],outputs:1,description:"A·B·C 중 두 개 이상이 1이면 출력이 1이어야 합니다.",expected:({A,B,C})=>[Number(A+B+C>=2)]},
  adder:{name:"1비트 덧셈기",inputs:["A","B"],outputs:2,description:"A+B를 계산하세요. 첫 출력은 합(SUM), 두 번째 출력은 자리 올림(CARRY)입니다.",expected:({A,B})=>[A^B,A&B]},
  access:{name:"입장 조건 만들기",inputs:["A","B","C"],outputs:1,description:"티켓 A가 있고, 정지 상태 B가 아니거나 관리자 C이면 입장(1)합니다.",expected:({A,B,C})=>[Number(Boolean(A&&(!B||C)))]}
});
export function operate(type,a,b=0) {
  if(!TYPES.includes(type)||![0,1].includes(a)||![0,1].includes(b)) throw new TypeError("Invalid gate");
  return {AND:a&b,OR:a|b,XOR:a^b,NOT:1-a,NAND:1-(a&b),NOR:1-(a|b),XNOR:1-(a^b)}[type];
}
export function validate(circuit,mission="difference") {
  const m=missions[mission];if(!m||!circuit||!Array.isArray(circuit.gates)||circuit.gates.length>12||!Array.isArray(circuit.outputs)||circuit.outputs.length!==m.outputs) throw new TypeError("Invalid circuit");
  const available=new Set([...m.inputs,"0","1"]);
  for(const g of circuit.gates) {
    if(!g||!/^G[1-9][0-9]?$/.test(g.id)||available.has(g.id)||!TYPES.includes(g.type)||!available.has(g.a)||(g.type!=="NOT"&&!available.has(g.b))) throw new TypeError("Invalid or cyclic connection");
    available.add(g.id);
  }
  if(circuit.outputs.some(ref=>!available.has(ref))) throw new TypeError("Invalid output");
  return circuit;
}
export function evaluate(circuit,inputs,mission="difference") {
  validate(circuit,mission);const values={"0":0,"1":1};
  for(const key of missions[mission].inputs){if(![0,1].includes(inputs[key]))throw new TypeError("Binary inputs required");values[key]=inputs[key];}
  for(const g of circuit.gates) values[g.id]=operate(g.type,values[g.a],g.type==="NOT"?0:values[g.b]);
  return {values,outputs:circuit.outputs.map(ref=>values[ref])};
}
export function truthTable(circuit,mission="difference") {
  const m=missions[mission];validate(circuit,mission);
  return Array.from({length:2**m.inputs.length},(_,i)=>{
    const inputs=Object.fromEntries(m.inputs.map((key,k)=>[key,(i>>(m.inputs.length-k-1))&1]));
    const actual=evaluate(circuit,inputs,mission).outputs,expected=m.expected(inputs);
    return {inputs,actual,expected,correct:actual.every((v,k)=>v===expected[k])};
  });
}
export function initial(mission="difference"){
  if(!missions[mission])throw new TypeError("Unknown mission");
  return {gates:[{id:"G1",type:"AND",a:"A",b:"B"}],outputs:missions[mission].outputs===2?["G1","G1"]:["G1"]};
}
export function example(mission){
  const g=(id,type,a,b="0")=>({id,type,a,b});
  const circuits={
    difference:{gates:[g("G1","XOR","A","B")],outputs:["G1"]},
    majority:{gates:[g("G1","AND","A","B"),g("G2","AND","A","C"),g("G3","AND","B","C"),g("G4","OR","G1","G2"),g("G5","OR","G4","G3")],outputs:["G5"]},
    adder:{gates:[g("G1","XOR","A","B"),g("G2","AND","A","B")],outputs:["G1","G2"]},
    access:{gates:[g("G1","NOT","B"),g("G2","OR","G1","C"),g("G3","AND","A","G2")],outputs:["G3"]}
  };
  if(!circuits[mission])throw new TypeError("Unknown mission");return structuredClone(circuits[mission]);
}
