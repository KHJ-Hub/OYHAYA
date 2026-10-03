const CACHE='oyhaya-pos-v53';
const ASSETS=['./index.html','./manifest.webmanifest','./icon.svg','./exchange-check.js','./ui-cleanup.js','./partial-pos.js','./solver-v34.js','./input-ux.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('oyhaya-pos-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
async function fresh(req,fallback){const c=await caches.open(CACHE);try{const r=await fetch(req,{cache:'no-store'});if(r&&r.ok){await c.put(fallback||req,r.clone());return r}}catch(e){}return c.match(fallback||req,{ignoreSearch:true})}
function inject(r){if(!r)return r;return r.text().then(t=>{t=t.replace(/<script src="\.\/(solver-v34|exchange-check|ui-cleanup|partial-pos|exchange-fallback|input-ux)\.js[^>]*><\/script>/g,'');t=t.replace('</body>','<script src="./exchange-check.js?v=53"></script><script src="./ui-cleanup.js?v=53"></script><script src="./partial-pos.js?v=53"></script><script src="./solver-v34.js?v=53"></script><script src="./input-ux.js?v=53"></script></body>');const h=new Headers(r.headers);h.set('cache-control','no-store, no-cache, must-revalidate');return new Response(t,{status:r.status,statusText:r.statusText,headers:h})})}
self.addEventListener('fetch',e=>{
 if(e.request.method!=='GET')return;
 const u=new URL(e.request.url);
 if(u.origin!==location.origin)return;
 const scopePath=new URL(self.registration.scope).pathname;
 const rootPath=scopePath.endsWith('/')?scopePath:scopePath+'/';
 const relativePath=u.pathname.startsWith(rootPath)?u.pathname.slice(rootPath.length):null;
 if(relativePath===null)return;
 const page=u.pathname===rootPath||relativePath==='index.html';
 const posScripts=new Set(['exchange-check.js','ui-cleanup.js','partial-pos.js','solver-v34.js','input-ux.js']);
 if(page){const indexUrl=new URL('index.html',self.registration.scope);e.respondWith(fresh(new Request(indexUrl,{cache:'reload'}),indexUrl.href).then(inject));return}
 if(posScripts.has(relativePath)){e.respondWith(fresh(new Request(e.request.url,{cache:'reload'}),relativePath));return}
 if(relativePath==='manifest.webmanifest'||relativePath==='icon.svg'){e.respondWith(fresh(e.request));return}
});
