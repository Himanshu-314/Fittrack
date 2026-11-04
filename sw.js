/* FITTRACK 12 service worker - offline-first app shell.
   Bump CACHE whenever you change any cached file so phones fetch the update. */
const CACHE="fittrack12-cache-v4";
const FILES=["./","./index.html","./app.js","./nutrition.js","./foods.js","./manifest.webmanifest","./icon.svg",
"./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png",
"./assets/bench-press.jpg","./assets/incline-press.jpg","./assets/pec-deck.jpg","./assets/triceps-pushdown.jpg","./assets/overhead-extension.jpg","./assets/shoulder-press.jpg","./assets/squat.jpg","./assets/lat-pulldown.jpg","./assets/row.jpg","./assets/leg-work.jpg","./assets/recovery.jpg",
"./assets/exercises/lat-pulldown.jpg","./assets/exercises/chest-supported-row.jpg","./assets/exercises/seated-cable-row.jpg","./assets/exercises/incline-dumbbell-curl.jpg","./assets/exercises/cable-biceps-curl.jpg","./assets/exercises/seated-dumbbell-shoulder-press.jpg","./assets/exercises/dumbbell-lateral-raises.jpg","./assets/exercises/reverse-pec-deck.jpg","./assets/exercises/ez-bar-curl.jpg","./assets/exercises/hammer-curl.jpg","./assets/exercises/squats.jpg","./assets/exercises/leg-press.jpg","./assets/exercises/leg-extension.jpg","./assets/exercises/leg-curl.jpg","./assets/exercises/standing-calf-raises.jpg","./assets/exercises/hanging-knee-raises.jpg","./assets/exercises/plank.jpg","./assets/exercises/incline-chest-press-machine.jpg","./assets/exercises/flat-dumbbell-press.jpg","./assets/exercises/cable-chest-fly.jpg","./assets/exercises/romanian-deadlift.jpg","./assets/exercises/bulgarian-split-squat.jpg","./assets/exercises/lying-leg-curl.jpg","./assets/exercises/hip-thrust.jpg","./assets/exercises/calf-raises.jpg","./assets/exercises/cable-crunch.jpg","./assets/exercises/reverse-crunch.jpg","./assets/exercises/barbell-bench-press.jpg","./assets/exercises/incline-dumbbell-press.jpg","./assets/exercises/pec-deck-fly.jpg","./assets/exercises/rope-triceps-pushdown.jpg","./assets/exercises/overhead-cable-extension.jpg"];

self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.allSettled(FILES.map(f=>c.add(f)))).then(()=>self.skipWaiting()));
});
self.addEventListener("activate",e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET")return;                       /* AI requests are POST -> never cached */
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;             /* never touch other sites / your AI service */
  /* stale-while-revalidate: instant offline start, silently refreshed in the background */
  e.respondWith(caches.open(CACHE).then(async cache=>{
    const cached=await cache.match(req,{ignoreSearch:true});
    const net=fetch(req).then(resp=>{if(resp&&resp.ok)cache.put(req,resp.clone());return resp}).catch(()=>null);
    if(cached){e.waitUntil(net);return cached}
    const resp=await net;
    return resp||(req.mode==="navigate"?cache.match("./index.html"):Response.error());
  }));
});
