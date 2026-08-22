(()=>{
  const style=document.createElement('style');
  style.textContent=`
    .header .muted,.header .saved,.foot{display:none!important}
    .header{padding-bottom:4px}.header h1{font-size:23px}
    .hero{padding:15px 16px}.heroTop{align-items:center}.hero .muted{display:none}
    .rules{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:5px;max-width:210px;line-height:1.2}
    .rules br{display:none}.rules b,.rules .rule50{display:inline-flex;align-items:center;padding:5px 7px;border-radius:999px;background:#eef6e5;color:#557f14;font-size:10px;white-space:nowrap}
    .divider{margin:12px 0}.grand{font-size:22px}.all{margin-top:10px}
    .panel>.card:first-child>.muted{display:none}.sectionTitle{margin-bottom:7px}
    .panel>.card:nth-child(2)>.sectionTitle{display:none}
    .metrics{margin-top:0}.metric:first-child{display:none}.metrics{grid-template-columns:1fr}.metric{padding:14px}.metric span{font-size:11px}.metric b{font-size:24px}
    .quick{display:none!important}
    .notice.warn{background:#fff9ed}.exchangeCheckList{margin-top:8px}
    .verify{padding:10px 12px}.verifyGrid{display:flex;flex-wrap:wrap;gap:5px}.check{padding:6px 8px;font-size:11px;border-radius:999px}
    .notice.ok{padding:8px 11px;font-size:12px}
    .details{margin-top:8px}
    @media(max-width:390px){.heroTop{align-items:flex-start}.rules{max-width:175px}.rules b,.rules .rule50{font-size:9px;padding:4px 6px}}
  `;
  document.head.appendChild(style);
  const rules=document.querySelector('.rules');
  if(rules){rules.innerHTML='<b>5천원 ≥ 5</b><b>천원 ≥ 15</b><span class="rule50">5만원 0</span>'}
  const grandLabel=document.querySelector('.hero .divider')?.nextElementSibling;
  if(grandLabel) grandLabel.textContent='3대 송금대상액';
  const all=document.getElementById('all'); if(all) all.textContent='3대 한 번에 계산';
  for(let p=1;p<=3;p++){
    const title=document.querySelector(`[data-panel="${p}"] .sectionTitle`); if(title) title.textContent=`POS ${p}`;
    const calc=document.querySelector(`[data-c="${p}"]`); if(calc) calc.textContent='83,000원 계산';
    const send=document.getElementById('send'+p)?.previousElementSibling; if(send) send.textContent='송금대상액';
  }
  function rename(){
    for(let p=1;p<=3;p++){
      const ex=document.getElementById('ex'+p),coin=document.getElementById('coin'+p);
      if(ex&&ex.style.display!=='none'){const b=ex.querySelector('b');if(b)b.textContent='해야 할 일 · 지폐 환전'}
      if(coin&&coin.style.display!=='none'){const b=coin.querySelector('b');if(b)b.textContent='해야 할 일 · 동전 환전'}
      const v=document.getElementById('verify'+p);if(v&&v.style.display!=='none'){const b=v.querySelector(':scope > b');if(b)b.textContent='준비금 ✓'}
      const st=document.getElementById('st'+p);if(st&&st.classList.contains('ok'))st.style.display='none';else if(st)st.style.display='block';
    }
  }
  new MutationObserver(()=>requestAnimationFrame(rename)).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['style','class']});
  rename();
})();