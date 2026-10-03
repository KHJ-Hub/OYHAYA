const CACHE='oyhaya-pos-app-v1';
const ASSETS=['./index.html','./manifest.webmanifest','./icon.svg','./exchange-check.js','./ui-cleanup.js','./partial-pos.js','./solver-v34.js','./input-ux.js'];
self.addEventListener('install',event=>event.waitUntil(
  caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())
));
self.addEventListener('activate',event=>event.waitUntil(
  caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('oyhaya-pos-app-')&&key!==CACHE).map(key=>caches.delete(key))))
    .then(()=>self.clients.claim())
));
async function fresh(request){
  const cache=await caches.open(CACHE);
  try{
    const response=await fetch(request,{cache:'no-store'});
    if(response.ok){await cache.put(request,response.clone());return response}
  }catch(error){}
  return await cache.match(request,{ignoreSearch:true})||new Response('POS is unavailable offline.',{status:503});
}
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url),scope=new URL(self.registration.scope);
  if(url.origin!==scope.origin||!url.pathname.startsWith(scope.pathname))return;
  const relativePath=url.pathname.slice(scope.pathname.length);
  if(relativePath===''||relativePath==='index.html'){
    event.respondWith(fresh(new Request(new URL('index.html',scope).href)));
  }else if(ASSETS.some(asset=>asset.slice(2)===relativePath)){
    event.respondWith(fresh(event.request));
  }
});
