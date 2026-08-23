(()=>{
 const DS=[50000,10000,5000,1000,500,100,50,10];
 const hasInput=p=>DS.some(d=>{const n=parseInt(document.getElementById(`n${p}_${d}`)?.value||0,10);return n>0});
 const selected=()=>[1,2,3].filter(hasInput);
 const selectedDone=()=>selected().filter(p=>state[p]?.ok);
 function install(){
  const oldAll=document.getElementById('all');
  if(oldAll&&!oldAll.dataset.partial3){
   const all=oldAll.cloneNode(true);
   all.dataset.partial3='1';
   all.textContent='입력한 POS 계산';
   oldAll.replaceWith(all);
   all.addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();
    const ps=selected();
    if(!ps.length){grand.textContent='-';grandStatus.textContent='POS 1개 이상 입력해 주세요.';summary.classList.remove('show');finish.classList.remove('show');return}
    const solver=window.OYHAYA_SOLVE_POS;
    if(typeof solver!=='function'){grand.textContent='-';grandStatus.textContent='계산기 로딩 중이에요. 잠시 후 다시 눌러 주세요.';return}
    const results=ps.map(p=>({p,ok:solver(p)}));
    const bad=results.filter(x=>!x.ok);
    if(bad.length){grand.textContent='계산 불가';grandStatus.textContent=`POS ${bad.map(x=>x.p).join(', ')} 조건을 확인해 주세요.`;summary.classList.remove('show');finish.classList.remove('show');return}
    const rows=ps.map(p=>({p,x:state[p]}));
    const sum=rows.reduce((s,o)=>s+(o.x?.send||0),0),reserve=ps.length*83000;
    grand.textContent=F(sum);grandStatus.textContent=`POS ${ps.join(' · POS ')} · ${ps.length}대 계산 완료`;
    summary.classList.add('show');
    summaryBody.innerHTML=`<div class="metrics"><div class="metric"><span>총 송금대상액</span><b>${F(sum)}</b></div><div class="metric"><span>총 준비금</span><b>${F(reserve)}</b></div></div>`+rows.map(o=>`<div class="result"><b>POS ${o.p}</b><span class="right">송금 <b>${F(o.x.send)}</b>${o.x.ex?`<br><span class="muted">지폐환전 ${o.x.ex}건</span>`:''}${o.x.coins?`<br><span class="muted">동전환전 ${o.x.coins}건</span>`:''}</span></div>`).join('');
    finish.classList.add('show');
   });
  }
  const oldFinish=document.getElementById('finish');
  if(oldFinish&&!oldFinish.dataset.partial3){
   const btn=oldFinish.cloneNode(true);
   btn.dataset.partial3='1';
   oldFinish.replaceWith(btn);
   window.finish=btn;
   btn.addEventListener('click',e=>{
    e.preventDefault();e.stopPropagation();
    const ps=selected(),done=selectedDone();
    if(!ps.length){grandStatus.textContent='POS 1개 이상 입력해 주세요.';return}
    if(done.length!==ps.length){grandStatus.textContent='입력한 POS를 먼저 계산해 주세요.';return}
    btn.textContent=`POS ${done.join(' · POS ')} 마감 완료 ✓`;
    btn.disabled=true;
    grandStatus.textContent=`POS ${done.join(' · POS ')} · ${done.length}대 마감 완료`;
   });
  }
 }
 install();new MutationObserver(install).observe(document.body,{subtree:true,childList:true});
})();