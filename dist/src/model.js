export const TYPES = Object.freeze(["AND", "OR", "XOR", "NOT", "NAND", "NOR", "XNOR"]);
export const LIMITS = Object.freeze({gates:24, inputs:7, outputs:4, rows:128});
const word = (input, prefix, count) => Array.from({length:count}, (_, i) => input[prefix+i] * 2**i).reduce((a,b) => a+b, 0);
const bits = (value, count) => Array.from({length:count}, (_, i) => (value >> i) & 1);
function mission(data) {
  if(data.inputs.length>LIMITS.inputs||data.outputNames.length>LIMITS.outputs||data.gateLimit>LIMITS.gates||
    data.inputs.length<2||data.outputNames.length<1||2**data.inputs.length>LIMITS.rows||
    new Set(data.inputs).size!==data.inputs.length||data.vectors.some(v=>v[1].length!==data.inputs.length||v[1].some(b=>![0,1].includes(b)))) throw new TypeError("Mission exceeds bounded schema");
  return Object.freeze({...data, outputs:data.outputNames.length,
    inputs:Object.freeze(data.inputs), outputNames:Object.freeze(data.outputNames),
    allowedTypes:Object.freeze(data.allowedTypes ?? [...TYPES]), hints:Object.freeze(data.hints),
    vectors:Object.freeze(data.vectors.map(v => Object.freeze({label:v[0], bits:Object.freeze(v[1])}))) });
}
export const missions = Object.freeze({
  difference:mission({name:"서로 다를 때 켜지는 램프",level:"입문",inputs:["A","B"],outputNames:["DIFF"],gateLimit:12,targetGates:1,
    description:"A와 B가 다르면 DIFF=1, 같으면 0입니다.",io:"A, B: 두 스위치 · DIFF: 서로 다른지 표시",
    expected:({A,B})=>[A^B], hints:["같은 입력 00·11에서 꺼지고, 01·10에서 켜져야 합니다.","두 입력의 차이를 검사하는 게이트를 찾아보세요."],
    vectors:[["서로 같음",[1,1]],["서로 다름",[0,1]]]}),
  adder:mission({name:"반가산기: 합과 자리 올림",level:"입문",inputs:["A","B"],outputNames:["SUM","CARRY"],gateLimit:12,targetGates:2,
    description:"A+B를 두 비트로 나타내세요. SUM은 낮은 비트, CARRY는 높은 비트입니다.",io:"A, B: 1비트 수 · 출력 순서 SUM, CARRY (낮은 비트 먼저)",
    expected:({A,B})=>bits(A+B,2), hints:["1+1=10입니다. 합과 자리 올림은 서로 다른 조건입니다.","SUM은 서로 다를 때 1, CARRY는 둘 다 1일 때 1입니다."],
    vectors:[["자리 올림",[1,1]],["합만 켜짐",[1,0]]]}),
  majority:mission({name:"세 명의 다수결",level:"기초",inputs:["A","B","C"],outputNames:["VOTE"],gateLimit:12,targetGates:5,
    description:"A·B·C 중 두 개 이상이 1이면 VOTE=1입니다.",io:"A, B, C: 찬성표 · VOTE: 과반수 승인",
    expected:({A,B,C})=>[Number(A+B+C>=2)], hints:["두 명이 찬성하는 모든 쌍을 찾으세요.","AB, AC, BC 중 한 쌍이라도 성립하면 승인입니다. 세 명 모두 찬성도 포함됩니다."],
    vectors:[["한 표는 부족",[0,1,0]],["비인접 두 표",[1,0,1]]]}),
  access:mission({name:"입장 조건 만들기",level:"기초",inputs:["A","B","C"],outputNames:["ALLOW"],gateLimit:12,targetGates:3,
    description:"티켓 A가 있고, 정지 B가 아니거나 관리자 C이면 ALLOW=1입니다. 관리자도 티켓은 필요합니다.",io:"A: 티켓 · B: 정지 · C: 관리자 · ALLOW: 입장",
    expected:({A,B,C})=>[Number(Boolean(A&&(!B||C)))], hints:["관리자 예외는 정지 상태만 우회합니다. 티켓 조건은 남습니다.","먼저 NOT B와 C를 OR로 묶고, 그 결과에 티켓 조건을 적용하세요."],
    vectors:[["관리자도 티켓 필요",[0,1,1]],["정지 우회",[1,1,1]]]}),
  fullAdder:mission({name:"전가산기: 이전 자리의 올림",level:"중급",inputs:["A","B","Cin"],outputNames:["SUM","Cout"],gateLimit:12,targetGates:5,
    description:"A+B+Cin을 계산하세요. 3개의 입력이 모두 1이어도 SUM과 Cout이 모두 1이어야 합니다.",io:"Cin: 이전 자리의 올림 · SUM: 현재 자리 · Cout: 다음 자리로 올림",
    expected:({A,B,Cin})=>bits(A+B+Cin,2), hints:["먼저 A+B의 합 P와 올림을 구한 뒤 P+Cin을 계산하세요.","SUM=P XOR Cin. Cout=(A AND B) OR (P AND Cin)입니다."],
    vectors:[["입력 올림만 있음",[0,0,1]],["합이 3",[1,1,1]]]}),
  adder3:mission({name:"3비트 리플 가산기",level:"고급",inputs:["A0","A1","A2","B0","B1","B2","Cin"],outputNames:["S0","S1","S2","Cout"],gateLimit:24,targetGates:15,
    description:"0~7인 두 수와 Cin을 더하세요. 낮은 자리부터 올림을 전달해 0~15의 결과를 만드세요.",io:"A=A0+2A1+4A2, B=B0+2B1+4B2 · 결과=S0+2S1+4S2+8Cout · 출력은 낮은 비트 먼저",
    expected:i=>bits(word(i,"A",3)+word(i,"B",3)+i.Cin,4), hints:["전가산기를 세 번 이어 보세요. 첫 자리의 Cin만 외부 입력입니다.","각 자리의 Cout을 다음 자리의 Cin에 연결하세요. 7+0+1은 세 자리를 모두 통과하는 올림입니다.","자리마다 XOR 2개, AND 2개, OR 1개면 충분합니다. 맨 마지막 올림은 네 번째 출력입니다."],
    vectors:[["세 자리 올림 전파: 7+0+1",[1,1,1,0,0,0,1]],["최댓값: 7+7+1",[1,1,1,1,1,1,1]],["혼합 자리: 2+5",[0,1,0,1,0,1,0]]]}),
  alu2:mission({name:"2비트 가감산 유닛",level:"고급",inputs:["A0","A1","B0","B1","M"],outputNames:["R0","R1","FLAG"],gateLimit:24,targetGates:13,
    description:"M=0이면 A+B, M=1이면 A−B입니다. 결과는 4로 나눈 나머지(0~3). FLAG는 덧셈의 올림 또는 뺄셈의 빌림입니다.",io:"A=A0+2A1, B=B0+2B1 · M: 0 덧셈 / 1 뺄셈 · R0+2R1: 결과 · FLAG: 덧셈 A+B≥4 / 뺄셈 A<B",
    expected:i=>{const a=word(i,"A",2),b=word(i,"B",2),v=i.M?a-b:a+b;return [...bits((v+4)%4,2),Number(i.M?a<b:v>=4)];},
    hints:["뺄셈은 A + NOT B + 1로 바꿀 수 있습니다. M을 두 B 비트에 XOR하면 모드를 선택할 수 있습니다.","첫 자리 Cin=M으로 두세요. 마지막 Cout은 뺄셈에서 '빌림 없음'을 뜻합니다.","FLAG=Cout XOR M이면 덧셈 올림과 뺄셈 빌림을 한 출력으로 나타냅니다."],
    vectors:[["빌림: 0−1",[0,0,1,0,1]],["같은 수: 3−3",[1,1,1,1,1]],["올림: 3+2",[1,1,0,1,0]]]}),
  parity:mission({name:"4비트 전송 패리티 검사",level:"중급",inputs:["D0","D1","D2","D3","P"],outputNames:["TXP","ERROR"],gateLimit:12,targetGates:4,
    description:"TXP는 데이터와 합쳐 1의 개수가 짝수가 되는 패리티 비트입니다. 수신 패리티 P가 TXP와 다르면 ERROR=1입니다.",io:"D0~D3: 데이터 · P: 수신 패리티 · TXP: 생성할 짝수 패리티 · ERROR: 패리티 불일치 (짝수 개 오류는 검출 못함)",
    expected:({D0,D1,D2,D3,P})=>{const p=D0^D1^D2^D3;return [p,p^P];},
    hints:["XOR는 1의 개수가 홀수일 때 1입니다. 네 데이터 비트를 차례로 결합하세요.","생성한 TXP와 수신 P를 비교하세요. 패리티가 일치해도 오류가 없다는 보장은 아닙니다."],
    vectors:[["홀수 데이터·정상 패리티",[1,0,0,0,1]],["패리티 불일치",[1,0,0,0,0]],["두 1은 짝수",[1,1,0,0,0]]]}),
  decoder:mission({name:"주소 디코더 + 활성 신호",level:"중급",inputs:["A0","A1","EN"],outputNames:["Y0","Y1","Y2","Y3"],gateLimit:16,targetGates:10,
    description:"EN=1이면 주소 A0+2A1에 해당하는 출력 하나만 켜세요. EN=0이면 모든 출력이 꺼집니다.",io:"A0: 주소 낮은 비트 · A1: 높은 비트 · EN: 활성 · Y0~Y3: 주소별 선택선",
    expected:({A0,A1,EN})=>Array.from({length:4},(_,i)=>Number(Boolean(EN&&i===A0+2*A1))),
    hints:["00, 01, 10, 11 각각을 감지하는 조건을 만드세요. 주소는 A1A0 순서입니다.","NOT A0와 NOT A1을 공유하고, 각 주소 조건에 EN을 AND로 결합하세요."],
    vectors:[["비활성 주소 3",[1,1,0]],["주소 1: Y1만",[1,0,1]],["주소 2: Y2만",[0,1,1]]]}),
  mux4:mission({name:"4채널 데이터 선택기",level:"고급",inputs:["D0","D1","D2","D3","S0","S1"],outputNames:["OUT"],gateLimit:20,targetGates:11,
    description:"선택 번호 S0+2S1의 데이터만 OUT으로 보내세요. 선택되지 않은 데이터가 바뀌어도 OUT은 그대로여야 합니다.",io:"D0~D3: 데이터 채널 · S0: 선택 낮은 비트 · S1: 높은 비트 · OUT: 선택 데이터",
    expected:i=>[i["D"+(i.S0+2*i.S1)]], hints:["채널 둘씩 S0으로 고른 뒤 두 결과 중 하나를 S1으로 고를 수 있습니다.","또는 각 선택 주소를 감지해 해당 데이터와 AND한 뒤 네 결과를 OR하세요.","두 단계 선택기를 만들 때 NOT S0를 공유하면 게이트를 줄일 수 있습니다."],
    vectors:[["채널 2만 1",[0,0,1,0,0,1]],["선택 채널 1만 0",[1,0,1,1,1,0]],["채널 3 선택",[0,1,0,1,1,1]]]}),
  comparator:mission({name:"2비트 크기 비교기",level:"고급",inputs:["A0","A1","B0","B1"],outputNames:["GT","EQ","LT"],gateLimit:20,targetGates:10,
    description:"A와 B를 비교해 GT(A>B), EQ(A=B), LT(A<B) 중 정확히 하나만 켜세요.",io:"A=A0+2A1, B=B0+2B1 · GT, EQ, LT: 부호 없는 크기 비교",
    expected:i=>{const a=word(i,"A",2),b=word(i,"B",2);return [Number(a>b),Number(a===b),Number(a<b)];},
    hints:["높은 비트가 다르면 낮은 비트는 크기 비교에 영향을 주지 않습니다.","GT=(A1 AND NOT B1) OR ((A1 XNOR B1) AND A0 AND NOT B0). EQ는 두 자리 모두 같아야 합니다.","GT도 EQ도 아니라면 LT입니다. 이 관계를 이용해 중복 게이트를 줄이세요."],
    vectors:[["높은 자리 우선: 2>1",[0,1,1,0]],["같은 수: 3=3",[1,1,1,1]],["낮은 자리 차이: 2<3",[0,1,1,1]]]}),
  priority:mission({name:"4요청 우선순위 중재기",level:"고급",inputs:["R0","R1","R2","R3"],outputNames:["GRANT0","GRANT1","GRANT2","GRANT3"],gateLimit:16,targetGates:8,
    description:"요청 중 가장 높은 번호 하나만 승인하세요. 우선순위는 R3>R2>R1>R0. 요청이 없으면 모두 0입니다.",io:"R0~R3: 동시 요청 · GRANT0~GRANT3: 승인선",
    expected:i=>{const winner=[3,2,1,0].find(k=>i["R"+k]===1);return Array.from({length:4},(_,k)=>Number(k===winner));},
    hints:["GRANT3는 R3를 바로 전달할 수 있습니다. 나머지는 더 높은 요청이 모두 없을 때만 승인됩니다.","GRANT2=R2 AND NOT R3. GRANT1은 R2 또는 R3가 있으면 꺼지고, GRANT0은 R1·R2·R3 중 하나라도 있으면 꺼집니다."],
    vectors:[["모두 요청: GRANT3만",[1,1,1,1]],["낮은 요청 억제",[1,0,1,0]],["요청 없음",[0,0,0,0]]]}),
  nandMux:mission({name:"NAND만으로 만드는 선택기",level:"제약 도전",inputs:["D0","D1","S"],outputNames:["OUT"],gateLimit:8,targetGates:4,allowedTypes:["NAND"],
    description:"S=0이면 D0, S=1이면 D1을 전달하세요. 사용할 수 있는 게이트는 NAND뿐입니다.",io:"D0, D1: 데이터 · S: 선택 · OUT: 선택 데이터 · NAND만 허용",
    expected:({D0,D1,S})=>[S?D1:D0], hints:["NAND의 두 입력에 같은 신호를 연결하면 NOT이 됩니다.","드모르간 법칙으로 (D0 AND NOT S) OR (D1 AND S)를 NAND 세 개와 NOT S 생성기로 바꿀 수 있습니다."],
    vectors:[["선택되지 않은 1 억제",[0,1,0]],["채널 1 전달",[0,1,1]]]}),
});
function getMission(key) {
  if (!Object.hasOwn(missions,key)) throw new TypeError("Unknown mission");
  return missions[key];
}
export function operate(type,a,b=0) {
  if (!TYPES.includes(type)||![0,1].includes(a)||![0,1].includes(b)) throw new TypeError("Invalid gate");
  return {AND:a&b,OR:a|b,XOR:a^b,NOT:1-a,NAND:1-(a&b),NOR:1-(a|b),XNOR:1-(a^b)}[type];
}
export function validate(circuit,key="difference") {
  const m=getMission(key);
  if (!circuit||!Array.isArray(circuit.gates)||circuit.gates.length>Math.min(m.gateLimit,LIMITS.gates)||
      !Array.isArray(circuit.outputs)||circuit.outputs.length!==m.outputs) throw new TypeError("Invalid circuit or gate limit");
  const available=new Set([...m.inputs,"0","1"]);
  for (const g of circuit.gates) {
    // Even the inactive NOT port must contain a valid earlier reference.
    if (!g||typeof g.id!=="string"||!/^G[1-9][0-9]?$/.test(g.id)||available.has(g.id)||
        !m.allowedTypes.includes(g.type)||!available.has(g.a)||!available.has(g.b)) throw new TypeError("Invalid, forward or cyclic connection");
    available.add(g.id);
  }
  for (const ref of circuit.outputs) if (!available.has(ref)) throw new TypeError("Invalid output connection");
  return circuit;
}
function run(circuit,inputs,m) {
  const values={"0":0,"1":1,...inputs};
  for (const g of circuit.gates) values[g.id]=operate(g.type,values[g.a],g.type==="NOT"?0:values[g.b]);
  return {values,outputs:circuit.outputs.map(ref=>values[ref])};
}
export function evaluate(circuit,inputs,key="difference") {
  const m=getMission(key);validate(circuit,key);
  if (!inputs||typeof inputs!=="object"||Array.isArray(inputs)||Object.keys(inputs).length!==m.inputs.length||
      m.inputs.some(k=>!Object.hasOwn(inputs,k)||![0,1].includes(inputs[k]))) throw new TypeError("Exactly the mission's binary inputs required");
  return run(circuit,inputs,m);
}
export function truthTable(circuit,key="difference") {
  const m=getMission(key);validate(circuit,key);
  return Array.from({length:2**m.inputs.length},(_,i)=>{
    const inputs=Object.fromEntries(m.inputs.map((name,k)=>[name,(i>>(m.inputs.length-k-1))&1]));
    const actual=run(circuit,inputs,m).outputs,expected=m.expected(inputs);
    return {inputs,actual,expected,correct:actual.every((v,k)=>v===expected[k])};
  });
}
export function testVectors(circuit,key="difference") {
  const m=getMission(key);validate(circuit,key);
  return m.vectors.map(v=>{
    const inputs=Object.fromEntries(m.inputs.map((name,i)=>[name,v.bits[i]]));
    const actual=run(circuit,inputs,m).outputs,expected=m.expected(inputs);
    return {label:v.label,inputs,actual,expected,correct:actual.every((value,i)=>value===expected[i])};
  });
}
export function initial(key="difference") {
  const m=getMission(key);
  return {gates:[{id:"G1",type:m.allowedTypes[0],a:m.inputs[0],b:m.inputs[1]}],outputs:m.outputNames.map(()=>"G1")};
}
export function example(key) {
  getMission(key);
  const gates=[];
  const gate=(type,a,b="0")=>{const id="G"+(gates.length+1);gates.push({id,type,a,b});return id;};
  const full=(a,b,c)=>{const p=gate("XOR",a,b),s=gate("XOR",p,c),ab=gate("AND",a,b),pc=gate("AND",p,c);return [s,gate("OR",ab,pc)];};
  const mux=(a,b,s,ns)=>gate("OR",gate("AND",a,ns),gate("AND",b,s));
  let outputs;
  switch (key) {
    case "difference": outputs=[gate("XOR","A","B")];break;
    case "adder": outputs=[gate("XOR","A","B"),gate("AND","A","B")];break;
    case "majority": {const ab=gate("AND","A","B"),ac=gate("AND","A","C"),bc=gate("AND","B","C");outputs=[gate("OR",gate("OR",ab,ac),bc)];break;}
    case "access": outputs=[gate("AND","A",gate("OR",gate("NOT","B"),"C"))];break;
    case "fullAdder": outputs=full("A","B","Cin");break;
    case "adder3": {let carry="Cin";outputs=[];for(let i=0;i<3;i++){const [s,c]=full("A"+i,"B"+i,carry);outputs.push(s);carry=c;}outputs.push(carry);break;}
    case "alu2": {const b0=gate("XOR","B0","M"),b1=gate("XOR","B1","M"),[s0,c0]=full("A0",b0,"M"),[s1,c1]=full("A1",b1,c0);outputs=[s0,s1,gate("XOR",c1,"M")];break;}
    case "parity": {const p=gate("XOR",gate("XOR","D0","D1"),gate("XOR","D2","D3"));outputs=[p,gate("XOR",p,"P")];break;}
    case "decoder": {const n0=gate("NOT","A0"),n1=gate("NOT","A1");outputs=Array.from({length:4},(_,i)=>gate("AND",gate("AND",i&1?"A0":n0,i&2?"A1":n1),"EN"));break;}
    case "mux4": {const n0=gate("NOT","S0"),n1=gate("NOT","S1"),lo=mux("D0","D1","S0",n0),hi=mux("D2","D3","S0",n0);outputs=[mux(lo,hi,"S1",n1)];break;}
    case "comparator": {const e0=gate("XNOR","A0","B0"),e1=gate("XNOR","A1","B1"),hi=gate("AND","A1",gate("NOT","B1")),lo=gate("AND","A0",gate("NOT","B0")),gt=gate("OR",hi,gate("AND",e1,lo)),eq=gate("AND",e0,e1);outputs=[gt,eq,gate("NOR",gt,eq)];break;}
    case "priority": {const g2=gate("AND","R2",gate("NOT","R3")),high=gate("OR","R2","R3"),g1=gate("AND","R1",gate("NOT",high)),g0=gate("AND","R0",gate("NOT",gate("OR","R1",high)));outputs=[g0,g1,g2,"R3"];break;}
    case "nandMux": {const ns=gate("NAND","S","S"),lo=gate("NAND","D0",ns),hi=gate("NAND","D1","S");outputs=[gate("NAND",lo,hi)];break;}
  }
  return validate({gates,outputs},key);
}
