// Retained at the old URL so installed root-scope workers can migrate safely.
self.addEventListener('install',event=>event.waitUntil(self.skipWaiting()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  const scope=new URL(self.registration.scope);
  const rootPath=scope.pathname;
  const keys=await caches.keys();
  // The new /pos/ worker uses oyhaya-pos-app-* and is deliberately excluded.
  await Promise.all(keys.filter(key=>key.startsWith('oyhaya-pos-v')||key.startsWith('pos-ready-v')).map(key=>caches.delete(key)));
  await self.clients.claim();
  const windows=await self.clients.matchAll({type:'window'});
  await self.registration.unregister();
  // Reload previously controlled tabs at their own URLs, including Beauty Device.
  await Promise.all(windows.filter(client=>{
    const url=new URL(client.url);
    return url.origin===scope.origin&&url.pathname.startsWith(rootPath);
  }).map(client=>client.navigate(client.url).catch(()=>{})));
})()));
// No fetch handler: the retired root worker never serves POS fallbacks.
