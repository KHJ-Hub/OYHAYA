(()=>{
 const hasInput=p=>[50000,10000,5000,1000,500,100,50,10].some(d=>{const n=parseInt(document.getElementById(`n${p}_${d}`)?.value||0,10);return n>0});
 const selected=()=>[1,2,3].filter(hasInput);
 function install(){
  const old=document.getElementById('all'); if(!old||old.dataset.partial==='1')return; old.dataset.partial='1'; old.textContent='입력한 POS 계산';
  old.addEventListener('click',e=>{e.stopImmediatePropagation();const ps=selected();if(!ps.length){grand.textContent='-';grandStatus.textContent='POS 1개 이상 입력해 주세요.';summary.classList.remove('show');finish.classList.remove('show');return}const r=ps.map(p=>({p,x:calc(p)}));if(r.every(o=>o.x.ok)){const sum=r.reduce((s,o)=>s+o.x.send,0),cash=r.reduce((s,o)=>s+o.x.total,0),reserve=ps.length*83000;grand.textContent=F(sum);grandStatus.textContent=`POS ${ps.join(' · POS ')} · ${ps.length}대 계산 완료`;summary.classList.add('show');summaryBody.innerHTML=`<div class="metrics"><div class="metric"><span>총 송금대상액</span><b>${F(sum)}</b></div><div class="metric"><span>총 준비금</span><b>${F(reserve)}</b></div></div>`+r.map(o=>`<div class="result"><b>POS ${o.p}</b><span class="right">송금 <b>${F(o.x.send)}</b>${o.x.ex?`<br><span class="muted">지폐환전 ${o.x.ex}건</span>`:''}${o.x.coins?`<br><span class="muted">동전환전 ${o.x.coins}건</span>`:''}</span></div>`).join('');finish.classList.add('show')}else{grand.textContent='계산 불가';grandStatus.textContent='입력한 POS 중 조건을 맞출 수 없는 POS가 있어요.';summary.classList.remove('show');finish.classList.remove('show')}},true);
 }
 install();
})();