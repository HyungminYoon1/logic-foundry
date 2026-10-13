const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs/promises');
const primaryFlow=async(page,outDir) => {
  const failures=[], checks=[];
  page.on('pageerror',e=>failures.push(e.message));
  await page.reload();
  const ok=(value,label)=>{if(!value)throw Error(label);checks.push(label);};
  const text=id=>page.locator(id).innerText();
  const width=async label=>ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),label);
  await page.setViewportSize({width:1440,height:1000});
  await page.locator('#verify').click();
  ok((await text('#status')).includes('첫 반례'),'initial circuit fails with counterexample');
  await page.locator('#counterexample').click();
  await page.locator('#gateType').selectOption('XOR');
  await page.locator('#verify').click();
  ok((await text('#status')).includes('직접 해결 저장'),'UI XOR independently saved');
  await page.locator('#saveLocal').click();
  await page.getByText('반례·신호 추적 과제',{exact:true}).click();
  await page.screenshot({path:outDir+'/desktop-xor.png',fullPage:true});
  await page.locator('#vectorList button').first().click();
  await page.locator('#reset').click();
  ok(await page.locator('[data-input="A"]').getAttribute('aria-pressed')==='false'&&await page.locator('[data-input="B"]').getAttribute('aria-pressed')==='true','reset authored inputs');
  await page.locator('#undo').click();
  ok(await page.locator('#gateType').inputValue()==='XOR','undo reset restores prior circuit');
  await page.locator('#loadLocal').click();
  const before=await page.locator('#score').innerText();
  await page.locator('#importCircuit').setInputFiles({name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"version":1,"mission":"difference","circuit":{"gates":[],"outputs":["0"]},"solved":true}')});
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('가져오기 실패'));
  ok((await text('#status')).includes('가져오기 실패')&&(await text('#score'))===before,'invalid JSON import atomic');
  await page.evaluate(()=>{window.qaRemove=Storage.prototype.removeItem;Storage.prototype.removeItem=function(k){if(k==='logic-foundry-state-v1')throw Error('QA blocked');return window.qaRemove.call(this,k);};window.qaSummary=localStorage.getItem('web-lab-progress-v1');});
  try{
    await page.locator('#eraseLocal').click();
    ok((await text('#status')).includes('삭제 미완료'),'blocked private erase reports failure');
    ok(await page.evaluate(()=>localStorage.getItem('web-lab-progress-v1')===window.qaSummary&&localStorage.getItem('logic-foundry-state-v1')!==null),'blocked erase preserves completion and aggregate');
  }finally{await page.evaluate(()=>{Storage.prototype.removeItem=window.qaRemove;delete window.qaRemove;delete window.qaSummary;});}
  const missions=['difference','adder','majority','access','fullAdder','adder3','alu2','parity','decoder','mux4','comparator','priority','nandMux'];
  for(const key of missions){
    await page.locator('#mission').selectOption(key);
    await page.locator('#example').click();await page.locator('#verify').click();
    const score=await text('#score'),[passed,total]=score.split('/').map(Number);
    ok(passed===total,key+' exhaustive UI example');
    ok((await text('#investigation')).length>35,key+' investigation visible');
    await page.locator('#inputSwitches button').first().click();await page.locator('#reset').click();
    const actual=await page.locator('#inputSwitches button').evaluateAll(nodes=>nodes.map(n=>[n.dataset.input,n.getAttribute('aria-pressed')]));
    ok(actual.every(([k,v])=>v===(key==='difference'&&k==='B'?'true':'false')),key+' deterministic reset');
  }
  await page.locator('#mission').selectOption('parity');await page.locator('#example').click();
  await page.locator('[data-input="D0"]').click();
  ok((await page.locator('#lamps .lamp').nth(1).innerText()).endsWith('1'),'parity single flip detected');
  await page.locator('[data-input="D1"]').click();
  ok((await page.locator('#lamps .lamp').nth(1).innerText()).endsWith('0'),'parity even flip counterexample');
  await page.locator('#mission').selectOption('adder3');await page.locator('#example').click();
  await page.locator('#vectorList button').first().click();
  ok((await text('#score'))==='128 / 128','adder3 exhaustive 128 rows');
  ok((await page.locator('#lamps .lamp b').allTextContents()).join('')==='0001','7+0+1 carry trace');
  await page.locator('#onlyFailures').check();
  for(const size of [{width:1440,height:1000},{width:390,height:844},{width:320,height:780}]){
    await page.setViewportSize(size);await width('no overflow '+size.width);
    await page.screenshot({path:outDir+'/adder3-'+size.width+'.png',fullPage:true});
  }
  ok(failures.length===0,'no observed page errors');
  return {checks:checks.length,failures,selectors:['#reset','#inputSwitches','#eraseLocal','#investigation'],screenshots:['desktop-xor.png','adder3-1440.png','adder3-390.png','adder3-320.png']};
};
async function audit(page,outDir){
  await fs.mkdir(outDir,{recursive:true});
  const additions=[];
  const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
  const logs=[];page.on('console',message=>{if(['warning','error'].includes(message.type()))logs.push(message.type()+': '+message.text());});
  for(const width of [1440,390,320]){
    await page.setViewportSize({width,height:width===1440?1000:844});
    await page.evaluate(()=>scrollTo(0,0));
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'startup horizontal fit '+width);
    await page.screenshot({path:outDir+'/startup-'+width+'.png'});
  }
  await page.setViewportSize({width:1440,height:1000});

  const imported={version:1,mission:'difference',circuit:{gates:[{id:'G1',type:'XOR',a:'A',b:'B'}],outputs:['G1']}};
  await page.evaluate(()=>{window.edgeFileText=File.prototype.text;File.prototype.text=function(){if(this.name==='slow.json')return new Promise(resolve=>window.edgeResolve=resolve);return window.edgeFileText.call(this);};});
  await page.locator('#importCircuit').setInputFiles({name:'slow.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(imported))});
  await page.waitForFunction(()=>typeof window.edgeResolve==='function');
  await page.locator('#reset').click();
  await page.evaluate(text=>window.edgeResolve(text),JSON.stringify(imported));
  await page.waitForTimeout(50);
  assert.equal(await page.locator('#gateType').inputValue(),'AND','late file fixture cannot undo reset');
  assert.match(await page.locator('#status').innerText(),/초기 회로/);
  await page.evaluate(()=>{File.prototype.text=window.edgeFileText;delete window.edgeFileText;delete window.edgeResolve;});
  await page.locator('#importCircuit').setInputFiles({name:'oversize.json',mimeType:'application/json',buffer:Buffer.alloc(16385,32)});
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('가져오기 실패'));
  assert.equal(await page.locator('#gateType').inputValue(),'AND','oversized import retains current editor');
  await page.locator('#gateType').selectOption('XOR');
  const download=page.waitForEvent('download');await page.locator('#exportCircuit').click();
  const file=await download;await file.saveAs(outDir+'/roundtrip.json');
  await page.locator('#reset').click();await page.locator('#importCircuit').setInputFiles(outDir+'/roundtrip.json');
  await page.waitForFunction(()=>document.querySelector('#status').textContent.includes('가져온 회로'));
  assert.equal(await page.locator('#gateType').inputValue(),'XOR');
  await page.locator('#verify').click();assert.match(await page.locator('#status').innerText(),/연습 완료/);
  await page.locator('#reset').click();
  additions.push('delayed File.text fixture vs real reset, oversize import, actual download/import practice');

  const primary=await primaryFlow(page,outDir);

  
  const privateKey='logic-foundry-state-v1';
  const durableBefore=await page.evaluate(k=>localStorage.getItem(k),privateKey);
  const summaryBefore=await page.evaluate(()=>localStorage.getItem('web-lab-progress-v1'));
  await page.evaluate(k=>{window.edgeSet=Storage.prototype.setItem;Storage.prototype.setItem=function(key,value){if(key===k)throw new DOMException('fixture quota','QuotaExceededError');return window.edgeSet.call(this,key,value);};},privateKey);
  try{

  await page.locator('#mission').selectOption('difference');await page.locator('#reset').click();
  await page.locator('#gateType').selectOption('XOR');await page.locator('#verify').click();
  assert.match(await page.locator('#status').textContent(),/저장 불가/);

    assert.equal(await page.evaluate(k=>localStorage.getItem(k),privateKey),durableBefore,'quota preserves durable private data');
    assert.equal(await page.evaluate(()=>localStorage.getItem('web-lab-progress-v1')),summaryBefore,'quota does not publish');
  }finally{await page.evaluate(()=>{Storage.prototype.setItem=window.edgeSet;delete window.edgeSet;});}
  const peer={completed:2,total:9,updatedAt:'2026-10-13T00:00:00.000Z'};
  await page.evaluate(entry=>{
    const raw=localStorage.getItem('web-lab-progress-v1');
    const value=raw?JSON.parse(raw):{version:1,apps:{}};
    value.apps['echo-vault']=entry;
    localStorage.setItem('web-lab-progress-v1',JSON.stringify(value));
    localStorage.setItem('edge-peer-private','keep');
  },peer);
  
  await page.locator('#eraseLocal').click();
  assert.equal(await page.evaluate(()=>localStorage.getItem('edge-peer-private')),'keep','own erase retains peer private key');
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('web-lab-progress-v1')).apps['echo-vault']),peer,'own erase retains peer aggregate');
  assert.equal(await page.evaluate(k=>localStorage.getItem(k),privateKey),null,'own erase removes own private key');
  additions.push('Storage.setItem quota fixture, readback preservation, actual own erase retaining peer fixture');

  for(const width of [1440,390,320]){
    await page.setViewportSize({width,height:width===1440?1000:844});
    await page.locator('#circuit').scrollIntoViewIfNeeded();
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'final horizontal fit '+width);
    await page.screenshot({path:outDir+'/final-viewport-'+width+'.png'});
  }
  assert.deepEqual(logs,[],'observed console errors/warnings');
  assert.deepEqual(pageErrors,[],'all-flow page errors');
  const report={primary,additions,logs,pageErrors,fixtureBoundary:'Synthetic IME/detached event/File.text timing are failure injections; normal controls use Playwright input. Headless Chrome viewport emulation is not a physical phone.'};
  await fs.writeFile(outDir+'/browser-report.json',JSON.stringify(report,null,2),'utf8');
  return report;
}
module.exports=audit;
if(require.main===module)(async()=>{
  const url=process.argv[2],target=new URL(url);if(target.protocol!=='http:'||target.hostname!=='127.0.0.1'||!target.port)throw Error('Supply own loopback URL');
  const {chromium}=require(process.env.PLAYWRIGHT_MODULE_PATH||path.resolve(__dirname,'../../output/playwright/implement-20261012/node_modules/playwright'));
  const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--mute-audio']});
  const context=await browser.newContext({viewport:{width:1440,height:1000},acceptDownloads:true});
  try{const page=await context.newPage();await page.goto(url);const result=await audit(page,path.resolve(__dirname,'../tmp/output/playwright/edge-20261013'));console.log(JSON.stringify(result,null,2));}
  finally{await context.close();await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});

