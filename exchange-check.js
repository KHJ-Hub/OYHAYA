(()=>{
  const KEY='OYHAYA_EXCHANGE_CHECK_V3';
  const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){return{}}};
  const write=s=>localStorage.setItem(KEY,JSON.stringify(s));
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const makeKey=(p,type,text)=>`${p}|${type}|${text.trim()}`;
  const coinText=text=>{
    const m=String(text).match(/(500|100|50|10)원[^0-9]*(\d+)개/);
    if(!m)return text;
    const d=+m[1],bundle=d===500?40:50,total=d*bundle;
    if(d===100)return `5,000원 1장 → 100원 ${bundle}개 · 1묶음 ${total.toLocaleString()}원`;
    if(d===10)return `500원 1개 → 10원 ${bundle}개 · 1묶음 ${total.toLocaleString()}원`;
    if(d===500)return `20,000원 → 500원 ${bundle}개 · 1묶음 ${total.toLocaleString()}원`;
    return `2,500원 → 50원 ${bundle}개 · 1묶음 ${total.toLocaleString()}원`;
  };
  const style=document.createElement('style');
  style.textContent=`.exchangeChecks{display:grid;gap:8px;margin-top:9px}.exchangeCheck{display:flex;align-items:center;gap:10px;padding:10px;background:#fff;border:1px solid rgba(139,100,28,.18);border-radius:11px;cursor:pointer}.exchangeCheck input[type="checkbox"]{-webkit-appearance:checkbox!important;appearance:auto!important;display:block!important;visibility:visible!important;opacity:1!important;width:20px!important;height:20px!important;min-width:20px!important;margin:0!important;accent-color:#76a91e}.exchangeCheck span{line-height:1.4;flex:1}.exchangeCheck.done{opacity:.55;background:#f2f4ef}.exchangeCheck.done span{text-decoration:line-through}`;
  document.head.appendChild(style);
  function parseLines(box){const clone=box.cloneNode(true);clone.querySelectorAll('.exchangeChecks').forEach(x=>x.remove());const parts=clone.innerHTML.split(/<br\s*\/?\s*>/i).map(part=>{const d=document.createElement('div');d.innerHTML=part;return d.textContent.trim()}).filter(Boolean);return{title:parts[0]||'환전 필요',items:parts.slice(1)}}
  function enhance(box,p,type){if(!box||box.style.display==='none'||box.querySelector('.exchangeChecks'))return;let{title,items}=parseLines(box);if(!items.length)return;if(type==='coin')items=items.map(coinText);const state=read();box.innerHTML=`<b>${esc(title)}</b><div class="exchangeChecks">${items.map(text=>{const k=makeKey(p,type,text),checked=!!state[k];return `<label class="exchangeCheck${checked?' done':''}"><input type="checkbox" data-key="${encodeURIComponent(k)}" ${checked?'checked':''}><span>${esc(text)}</span></label>`}).join('')}</div>`;box.querySelectorAll('input[data-key]').forEach(cb=>cb.addEventListener('change',()=>{const state=read(),k=decodeURIComponent(cb.dataset.key);if(cb.checked)state[k]=true;else delete state[k];write(state);cb.closest('.exchangeCheck')?.classList.toggle('done',cb.checked)}))}
  function scan(){for(let p=1;p<=3;p++){enhance(document.getElementById('ex'+p),p,'bill');enhance(document.getElementById('coin'+p),p,'coin')}}
  setInterval(scan,250);new MutationObserver(scan).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['style']});document.addEventListener('click',e=>{const r=e.target.closest?.('[data-r]');if(r){const p=r.dataset.r,state=read();Object.keys(state).filter(k=>k.startsWith(p+'|')).forEach(k=>delete state[k]);write(state)}if(e.target?.id==='finish')setTimeout(()=>localStorage.removeItem(KEY),200)},true);scan();
})();