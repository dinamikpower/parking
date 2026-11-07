// Ζωντανός δορυφορικός χάρτης (Leaflet + Esri World Imagery) για το παρκινγκ.
// Οι θέσεις/σχήματα αποθηκεύονται με συντεταγμένες: x = γεωγρ. μήκος (lng), y = γεωγρ. πλάτος (lat).
const TILE = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const ATTR = 'Tiles © Esri — Maxar, Earthstar Geographics, GIS User Community';

const CSS = `
.mp-live{position:absolute;inset:0;z-index:1;background:#0b1220}
.mp-live[hidden]{display:none}
.mp-live .leaflet-container{background:#0b1220;font:inherit}
.lv-ic{background:none;border:0}
.lv-spot{transform:translate(-50%,-50%);display:inline-block;white-space:nowrap;font-size:var(--lvs,12px);font-weight:800;line-height:1;padding:5px 8px;border-radius:9px;border:2px solid #fff;color:#fff;box-shadow:0 2px 8px rgba(0,0,0,.55);letter-spacing:.2px}
.lv-spot.free{background:linear-gradient(135deg,#15803d,#22c55e)}.lv-spot.occ{background:linear-gradient(135deg,#b91c1c,#ef4444)}
.lv-spot.dim{opacity:.35}
.lv-spot.focus{outline:3px solid #facc15;outline-offset:2px}
.lv-lab{background:rgba(11,27,58,.8);backdrop-filter:blur(3px);border:0;color:#fff;font-weight:700;font-size:var(--lvl,13px);padding:2px 8px;border-radius:7px;box-shadow:none}
.lv-lab:before{display:none}
.lv-dist{background:linear-gradient(135deg,#ea580c,#fb923c);box-shadow:0 2px 8px rgba(0,0,0,.4);color:#fff;border:0;font-weight:700;font-size:13px;padding:2px 8px;border-radius:7px}
.lv-dist:before{display:none}
.lv-vtx{width:14px;height:14px;border-radius:50%;background:#fff;border:3px solid #888;box-sizing:border-box;transform:translate(-50%,-50%)}
.lv-me{width:18px;height:18px;border-radius:50%;background:#888;border:3px solid #fff;box-shadow:0 0 0 2px rgba(136,136,136,.5),0 1px 6px rgba(0,0,0,.6);transform:translate(-50%,-50%)}
.lv-btns{display:flex;flex-direction:column;gap:8px}
.lv-btns button{width:44px;height:44px;border-radius:12px;border:0;background:#fff;color:#111;font-size:20px;box-shadow:0 2px 8px rgba(0,0,0,.4)}
.lv-btns button.on{background:#888;color:#fff}
.mp-live .leaflet-control-attribution{font-size:10px;border-radius:8px 0 0 0}
.mp-live .leaflet-bar{border:0!important;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(0,0,0,.4)}
.mp-live .leaflet-bar a{width:42px;height:42px;line-height:42px;font-size:19px;border-bottom:1px solid #e2e8f0}
`;

let LP = null;
function loadLeaflet(){
  if (window.L) return Promise.resolve(window.L);
  if (LP) return LP;
  LP = new Promise((res, rej) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = './vendor/leaflet/leaflet.css'; document.head.append(css);
    const sc = document.createElement('script'); sc.src = './vendor/leaflet/leaflet.js';
    sc.onload = () => res(window.L); sc.onerror = () => { LP = null; rej(new Error('Δεν φορτώθηκε ο χάρτης')); };
    document.head.append(sc);
    const st = document.createElement('style'); st.textContent = CSS; document.head.append(st);
  });
  return LP;
}

const fmtDist = m => m < 1000 ? Math.round(m)+' m' : (m/1000).toFixed(m < 10000 ? 2 : 1)+' km';
export { fmtDist };

export async function createLive(host, h){
  const L = await loadLeaflet();
  const map = L.map(host, { zoomControl:false, attributionControl:true, maxZoom:21, zoomSnap:.5, zoomDelta:.5, doubleClickZoom:true });
  L.tileLayer(TILE, { maxZoom:21, maxNativeZoom:19, attribution:ATTR, crossOrigin:true, keepBuffer:3, updateWhenIdle:false }).addTo(map);
  // Θυμάται την τελευταία θέση/ζουμ ώστε ο χάρτης να ανοίγει αμέσως στο σωστό σημείο, χωρίς αναμονή για GPS
  let saved = null; try { saved = JSON.parse(localStorage.getItem('parking-live-view')); } catch {}
  map.setView(saved ? [saved.lat, saved.lng] : [37.9838, 23.7275], saved ? saved.z : 16);
  map.on('moveend', () => { try { const c = map.getCenter(); localStorage.setItem('parking-live-view', JSON.stringify({ lat:+c.lat.toFixed(6), lng:+c.lng.toFixed(6), z:map.getZoom() })); } catch {} });
  map.setView([37.98, 23.73], 17);
  const data = L.layerGroup().addTo(map), over = L.layerGroup().addTo(map);
  let tool = 'pan', me = null, meMarker = null, meCircle = null, watchId = null, target = null, line = null, route = null, lpHeld = false, lpUntil = 0, userMoved = false;
  map.on('dragstart', () => { userMoved = true; });
  const blockClick = () => lpHeld || Date.now() < lpUntil;

  /* ---- κουμπιά πάνω στον χάρτη ---- */
  const Ctl = L.Control.extend({ onAdd(){
    const d = L.DomUtil.create('div', 'lv-btns');
    d.innerHTML = '<button data-b="me" aria-label="Η θέση μου">🎯</button><button data-b="find" aria-label="Αναζήτηση">🔎</button><button data-b="in" aria-label="Zoom +">＋</button><button data-b="out" aria-label="Zoom −">－</button>';
    L.DomEvent.disableClickPropagation(d);
    d.addEventListener('click', e => {
      const b = e.target.closest('[data-b]')?.dataset.b;
      if (b==='me') api.centerOnMe(); else if (b==='find') h.onSearch?.(); else if (b==='in') map.zoomIn(); else if (b==='out') map.zoomOut();
    });
    return d;
  } });
  new Ctl({ position:'topright' }).addTo(map);

  /* ---- δεδομένα ---- */
  const evXY = e => ({ clientX:(e.originalEvent||e).clientX, clientY:(e.originalEvent||e).clientY });
  function setData(d){
    data.clearLayers(); over.clearLayers();
    (d.shapes||[]).forEach((sh, i) => {
      if (!Array.isArray(sh.pts) || sh.pts.length < 2) return;
      const ll = sh.pts.map(p => [+p[1], +p[0]]), c = /^#[0-9a-f]{6}$/i.test(sh.c) ? sh.c : '#888';
      const lay = sh.t==='g' ? L.polygon(ll, { color:c, weight:2, fillColor:c, fillOpacity:.22, bubblingMouseEvents:false })
                             : L.polyline(ll, { color:c, weight:2, bubblingMouseEvents:false });
      lay.on('click', e => { if (blockClick()) return; L.DomEvent.stop(e); h.onShape?.(i, evXY(e)); });
      if (sh.n) lay.bindTooltip(String(sh.n), { permanent:true, direction:'center', className:'lv-lab', interactive:false });
      lay.addTo(data); lay._si = i; setTimeout(() => { if (lay._path) lay._path.__si = i; }, 0);
      if (sh.t!=='g'){                      // αόρατη, πιο χοντρή γραμμή ώστε να πατιέται εύκολα η λεπτή γραμμή
        const hit = L.polyline(ll, { weight:22, opacity:0, bubblingMouseEvents:false }).addTo(data);
        hit.on('click', e => { if (blockClick()) return; L.DomEvent.stop(e); h.onShape?.(i, evXY(e)); });
        setTimeout(() => { if (hit._path) hit._path.__si = i; }, 0);
      }
    });
    (d.spots||[]).forEach((p, i) => {
      const mk = L.marker([+p.y, +p.x], { icon:L.divIcon({ className:'lv-ic', iconSize:[0,0], html:`<div class="lv-spot ${p.cls||'free'}${p.dim?' dim':''}${p.focus?' focus':''}">${String(p.l).replace(/</g,'&lt;')}</div>` }), keyboard:false, bubblingMouseEvents:false });
      mk.on('click', e => { if (blockClick()) return; L.DomEvent.stop(e); h.onSpot?.(i, evXY(e)); });
      mk.addTo(data);
    });
    if (d.pend){
      const ll = d.pend.pts.map(p => [+p[1], +p[0]]);
      if (ll.length > 1) L.polyline(ll, { color:d.color||'#888', weight:3, dashArray:'6 6', interactive:false }).addTo(over);
      ll.forEach(p => L.marker(p, { icon:L.divIcon({ className:'lv-ic', iconSize:[0,0], html:'<div class="lv-vtx"></div>' }), interactive:false }).addTo(over));
    }
    if (route) route.addTo(over);
    drawLine();
  }

  /* ---- πάτημα / παρατεταμένο πάτημα ---- */
  map.on('click', e => { if (blockClick()) return; h.onMap?.({ lat:e.latlng.lat, lng:e.latlng.lng }, evXY(e)); });
  const box = map.getContainer();
  let lp = null;
  const stopLp = () => { clearTimeout(lp); lp = null; };
  box.addEventListener('pointerdown', e => {
    stopLp();
    if (tool==='pen' || e.target.closest('.leaflet-control') || e.target.closest('.lv-spot')) return;
    const x0 = e.clientX, y0 = e.clientY, tg = e.target, id = e.pointerId;
    box._lp = { x0, y0 };
    lp = setTimeout(() => {
      lp = null; lpHeld = true; navigator.vibrate?.(30);
      const rc = box.getBoundingClientRect(), ll = map.containerPointToLatLng([x0-rc.left, y0-rc.top]);
      h.onLongPress?.({ lat:ll.lat, lng:ll.lng, shape: tg.__si ?? null }, { clientX:x0, clientY:y0 });
    }, 450);
  });
  box.addEventListener('pointermove', e => { if (lp && box._lp && Math.hypot(e.clientX-box._lp.x0, e.clientY-box._lp.y0) > 8) stopLp(); });
  ['pointerup','pointercancel'].forEach(ev => box.addEventListener(ev, () => { stopLp(); if (lpHeld){ lpHeld = false; lpUntil = Date.now() + 400; } }));
  box.addEventListener('contextmenu', e => e.preventDefault());

  /* ---- ελεύθερο σχέδιο ---- */
  let pts = null, pl = null;
  box.addEventListener('pointerdown', e => {
    if (tool!=='pen' || e.target.closest('.leaflet-control')) return;
    pts = [map.mouseEventToLatLng(e)]; box.setPointerCapture?.(e.pointerId); h.onDraw?.(true);
  });
  box.addEventListener('pointermove', e => {
    if (!pts) return;
    pts.push(map.mouseEventToLatLng(e));
    if (!pl) pl = L.polyline([], { color:'#fff', weight:3, interactive:false }).addTo(over);
    pl.setLatLngs(pts);
  });
  const endPen = () => {
    if (!pts) return;
    const p = pts; pts = null; if (pl){ over.removeLayer(pl); pl = null; } h.onDraw?.(false);
    if (p.length < 4) return;
    h.onFreehand?.(p.map(q => [q.lng, q.lat]));
  };
  box.addEventListener('pointerup', endPen); box.addEventListener('pointercancel', () => { if (pts) h.onDraw?.(false); pts = null; if (pl){ over.removeLayer(pl); pl = null; } });

  /* ---- η θέση μου και η απόσταση προς το όχημα ---- */
  function drawLine(){
    if (line){ over.removeLayer(line); line = null; }
    if (!me || !target) return;
    const a = L.latLng(me.lat, me.lng), b = L.latLng(target.lat, target.lng), m = a.distanceTo(b);
    line = L.polyline([a, b], { color:'#f97316', weight:3, dashArray:'8 8', opacity: route ? 0 : 1, interactive:false }).addTo(over);
    line.bindTooltip(fmtDist(m), { permanent:true, direction:'center', className:'lv-dist', interactive:false });
    h.onDistance?.(m);
  }
  function onPos(pos){
    const { latitude:lat, longitude:lng, accuracy } = pos.coords; me = { lat, lng, acc:accuracy };
    if (!meMarker){
      meMarker = L.marker([lat, lng], { icon:L.divIcon({ className:'lv-ic', iconSize:[0,0], html:'<div class="lv-me"></div>' }), interactive:false, zIndexOffset:1000 }).addTo(map);
      meCircle = L.circle([lat, lng], { radius:accuracy, color:'#888', weight:1, fillOpacity:.1, interactive:false }).addTo(map);
    } else { meMarker.setLatLng([lat, lng]); meCircle.setLatLng([lat, lng]).setRadius(accuracy); }
    drawLine(); h.onMe?.(me);
  }
  function startWatch(){
    if (watchId!=null || !navigator.geolocation) return;
    watchId = navigator.geolocation.watchPosition(onPos, err => { h.onGeoError?.(err); }, { enableHighAccuracy:true, maximumAge:3000, timeout:20000 });
  }
  function stopWatch(){ if (watchId!=null){ navigator.geolocation.clearWatch(watchId); watchId = null; } }

  const api = {
    map,
    setData,
    setSizes(spotPx, labelPx){ host.style.setProperty('--lvs', spotPx+'px'); host.style.setProperty('--lvl', labelPx+'px'); },
    setTool(t){ tool = t; if (t==='pen') map.dragging.disable(); else map.dragging.enable(); },
    setTarget(t){ target = t; drawLine(); },
    setRoute(coords){                     // coords: [[lat,lng],...] ή null
      if (route){ over.removeLayer(route); route = null; }
      if (coords && coords.length > 1) route = L.polyline(coords, { color:'#f97316', weight:5, opacity:.9, interactive:false }).addTo(over);
      drawLine();
    },
    getMe: () => me,
    start(){ startWatch(); setTimeout(() => map.invalidateSize(), 50); },
    stop(){ stopWatch(); },
    invalidate(){ map.invalidateSize(); },
    flyTo(lat, lng, z){ map.setView([lat, lng], z ?? Math.max(map.getZoom(), 19)); },
    fit(spots, shapes){
      const b = L.latLngBounds([]);
      (spots||[]).forEach(p => b.extend([+p.y, +p.x]));
      (shapes||[]).forEach(s => (s.pts||[]).forEach(p => b.extend([+p[1], +p[0]])));
      if (b.isValid()){ if (b.getNorthEast().equals(b.getSouthWest())) map.setView(b.getCenter(), 19); else map.fitBounds(b, { padding:[40,40], maxZoom:20 }); return true; }
      return false;
    },
    centerOnMe(){
      startWatch();
      if (me){ map.setView([me.lat, me.lng], Math.max(map.getZoom(), 18)); return; }
      h.onGeoWait?.();
    },
    centerOnceWhenKnown(z = 18){
      startWatch();
      if (me) { map.setView([me.lat, me.lng], z); return; }
      const f = m => { if (!userMoved) map.setView([m.lat, m.lng], z); };
      const prev = h.onMe; h.onMe = m => { h.onMe = prev; f(m); prev?.(m); };
    },
  };
  return api;
}

// Οδηγίες περπατήματος από τον δημόσιο διακομιστή OSRM (δωρεάν). Επιστρέφει {coords:[[lat,lng]...], dist, dur} ή null.
export async function walkRoute(a, b){
  try {
    const u = `https://router.project-osrm.org/route/v1/foot/${a.lng},${a.lat};${b.lng},${b.lat}?overview=full&geometries=geojson`;
    const r = await fetch(u); if (!r.ok) return null;
    const j = await r.json(); const rt = j.routes?.[0]; if (!rt) return null;
    return { coords: rt.geometry.coordinates.map(c => [c[1], c[0]]), dist: rt.distance, dur: rt.duration };
  } catch { return null; }
}

// Αναζήτηση διεύθυνσης (Nominatim)
export async function geocode(q){
  try {
    const r = await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q='+encodeURIComponent(q), { headers:{ 'Accept-Language':'el' } });
    const j = await r.json(); return j[0] ? { lat:+j[0].lat, lng:+j[0].lon, name:j[0].display_name } : null;
  } catch { return null; }
}
