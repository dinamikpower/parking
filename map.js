/* Χάρτης / κάτοψη παρκινγκ
   - Ανεβάζεις φωτογραφία ή σχέδιο του χώρου και βάζεις τις θέσεις με πάτημα.
   - Η ζώνη προκύπτει από τα γράμματα της ονομασίας (Α12 → ζώνη Α).
   - Ένα όχημα «κάθεται» σε θέση όταν το πεδίο Θέση της καταχώρησής του είναι ίδιο με την ονομασία της θέσης. */

const CSS = `
#mapDlg{width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;border-radius:0;padding:0;background:var(--bg);color:var(--text);overflow:hidden}
#mapDlg[open]{display:flex;flex-direction:column}
#mapDlg::backdrop{background:#000}
.mp-head{background:#0f172a;color:#fff;padding:10px 12px;flex:none}
.mp-top{display:flex;align-items:center;gap:10px}
.mp-x{background:#334155;color:#fff;border:0;border-radius:10px;width:40px;height:40px;font-size:18px}
.mp-title{font-weight:700;font-size:16px;flex:1}
.mp-title small{display:block;font-weight:500;font-size:12px;color:#cbd5e1}
.mp-zones,.mp-maps{display:flex;gap:6px;overflow-x:auto;padding-top:8px;scrollbar-width:none}
.mp-zones::-webkit-scrollbar,.mp-maps::-webkit-scrollbar{display:none}
.mp-maps[hidden]{display:none}
.mp-m{flex:none;padding:7px 14px;border-radius:10px;border:1px solid #64748b;background:#1e293b;color:#e2e8f0;font-size:14px;font-weight:700}
.mp-m.on{background:#0ea5e9;border-color:#0ea5e9;color:#fff}
.mp-m.add{border-style:dashed;background:transparent}
.mp-z{flex:none;padding:6px 12px;border-radius:99px;border:1px solid #475569;background:transparent;color:#e2e8f0;font-size:14px;font-weight:600}
.mp-z.on{background:#2563eb;border-color:#2563eb;color:#fff}
.mp-vp{position:relative;flex:1;overflow:hidden;background:#1e293b;touch-action:none;user-select:none;-webkit-user-select:none}
.mp-stage{position:absolute;left:0;top:0;transform-origin:0 0}
.mp-img{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;-webkit-user-drag:none}
.mp-spots{position:absolute;inset:0;pointer-events:none}
.mp-spots .spot{pointer-events:auto}
.spot{position:absolute;transform:translate(-50%,-50%);width:calc(var(--sp));aspect-ratio:1.35/1;border-radius:calc(var(--sp)*.18);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:calc(var(--sp)*.36);line-height:1;color:#fff;border:max(1px,calc(var(--sp)*.05)) solid rgba(255,255,255,.9);box-shadow:0 1px 4px rgba(0,0,0,.5);cursor:pointer;overflow:hidden}
.spot.free{background:rgba(22,163,74,.82)}
.spot.occ{background:rgba(220,38,38,.88)}
.spot.ed{background:rgba(37,99,235,.85)}
.spot.dim{opacity:.25}
.spot.focus{outline:calc(var(--sp)*.1) solid #facc15;animation:mp-pulse 1s infinite}
@keyframes mp-pulse{50%{outline-color:transparent;transform:translate(-50%,-50%) scale(1.25)}}
.mp-empty{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:30px;text-align:center;color:#cbd5e1}
.mp-shapes{position:absolute;inset:0;pointer-events:none}
.mp-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}
.mp-svg polyline{fill:none;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke;stroke-width:4px}
.mp-svg polyline.hit{stroke:transparent;stroke-width:24px}
.mp-svg polygon{stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke;stroke-width:4px}
.mp-svg polygon.hit{fill:transparent;stroke:transparent;stroke-width:24px}
.shp-l{position:absolute;transform:translate(-50%,-50%);font-size:max(11px,calc(var(--sp)*.5));font-weight:700;color:#fff;background:rgba(0,0,0,.62);padding:1px 8px;border-radius:6px;line-height:1.3;white-space:nowrap;pointer-events:none}
.shp{position:absolute;box-sizing:border-box;border:3px solid;border-radius:4px;pointer-events:none}
.shp b{display:inline-block;font-size:max(11px,calc(var(--sp)*.5));color:#fff;background:rgba(0,0,0,.6);padding:1px 7px;border-radius:0 0 6px 0;line-height:1.3;white-space:nowrap;overflow:hidden;max-width:100%}
.shp.prev{border-style:dashed}
#mapDlg.erase .shp{pointer-events:auto}
#mapDlg.erase .mp-svg polyline.hit{pointer-events:stroke}
#mapDlg.erase .mp-svg polygon.hit{pointer-events:all}
.mp-tools{display:flex;gap:6px;flex-wrap:wrap;width:100%;align-items:center}
.mp-tool{padding:8px 12px;border-radius:10px;border:2px solid var(--line);background:var(--bg);color:var(--text);font-size:15px;font-weight:600}
.mp-tool.on{border-color:var(--accent);background:var(--accent);color:#fff}
.mp-sw{width:34px;height:34px;border-radius:50%;border:3px solid transparent;padding:0;box-shadow:0 0 0 1px var(--line)}
.mp-sw.on{border-color:var(--text)}
.mp-empty[hidden]{display:none}
.mp-sheet{flex:none;background:var(--card);border-top:1px solid var(--line);padding:12px 14px;max-height:45%;overflow:auto}
.mp-sheet[hidden]{display:none}
.mp-sheet .plate{font-size:20px}
.mp-sheet .m{color:var(--muted);font-size:14px;margin-top:6px}
.mp-foot{flex:none;background:var(--card);border-top:1px solid var(--line);padding:10px 12px calc(10px + env(safe-area-inset-bottom));display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.mp-foot .hint{flex:1 1 100%;font-size:13px;color:var(--muted)}
.mp-foot label{font-size:13px;color:var(--muted);display:flex;align-items:center;gap:6px}
.mp-foot input[type=range]{width:120px;padding:0}
.mp-sheet input{font-size:18px;font-weight:700;padding:10px;width:120px}
.mp-row{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}
#cropDlg{width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;border-radius:0;padding:0;background:#0b1220;color:#fff;overflow:hidden}
#cropDlg[open]{display:flex;flex-direction:column}
#cropDlg::backdrop{background:#000}
.cr-head{padding:12px 14px;font-weight:700;font-size:16px;flex:none}
.cr-head small{display:block;font-weight:500;font-size:12px;color:#94a3b8;margin-top:2px}
.cr-area{flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:8px}
.cr-box{position:relative;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none}
.cr-img{display:block;width:100%;height:100%;pointer-events:none;-webkit-user-drag:none}
.cr-rect{position:absolute;border:2px solid #fff;box-shadow:0 0 0 9999px rgba(0,0,0,.6);cursor:move;touch-action:none}
.cr-rect i{position:absolute;width:30px;height:30px;background:#0ea5e9;border:3px solid #fff;border-radius:50%;box-sizing:border-box}
.cr-rect i[data-h=nw]{left:-15px;top:-15px}.cr-rect i[data-h=ne]{right:-15px;top:-15px}
.cr-rect i[data-h=sw]{left:-15px;bottom:-15px}.cr-rect i[data-h=se]{right:-15px;bottom:-15px}
.cr-foot{flex:none;display:flex;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:var(--card);border-top:1px solid var(--line)}
.cr-foot .btn{flex:1}
#geoDlg{width:100vw;height:100dvh;max-width:none;max-height:none;margin:0;border-radius:0;padding:0;background:#0b1220;color:#fff;overflow:hidden}
#geoDlg[open]{display:flex;flex-direction:column}
#geoDlg::backdrop{background:#000}
.geo-head{flex:none;padding:10px 12px;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.geo-head b{flex:1 1 100%;font-size:15px}
.geo-head small{flex:1 1 100%;color:#94a3b8;font-size:12px}
.geo-head input{flex:1;min-width:0;font-size:16px;padding:10px;border-radius:10px;border:0}
.geo-head button{padding:10px 12px;border-radius:10px;border:0;background:#334155;color:#fff;font-size:15px;font-weight:600}
.geo-map{flex:1;min-height:0;background:#1e293b}
.geo-foot{flex:none;display:flex;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:var(--card);border-top:1px solid var(--line)}
.geo-foot .btn{flex:1}
`;

const MAXCHARS = 880000;           // όριο μεγέθους εικόνας (το έγγραφο Firestore δέχεται ~1MB)

async function compressImage(file){
  const bmp = await createImageBitmap(file);
  let side = 1600, q = 0.78;
  for (let i=0;i<8;i++){
    const sc = Math.min(1, side/Math.max(bmp.width,bmp.height));
    const c = document.createElement('canvas'); c.width = Math.round(bmp.width*sc); c.height = Math.round(bmp.height*sc);
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height);
    const url = c.toDataURL('image/jpeg', q);
    if (url.length <= MAXCHARS) return { image:url, w:c.width, h:c.height };
    side = Math.round(side*0.8); q = Math.max(0.5, q-0.06);
  }
  throw new Error('Η εικόνα είναι πολύ μεγάλη, δοκίμασε μικρότερη.');
}

/* ---------- Περικοπή εικόνας μέσα στην εφαρμογή ---------- */
// Επιστρέφει {x,y,w,h} ως κλάσματα (0..1) της εικόνας ή null αν ακυρωθεί.
function cropDialog(url){
  return new Promise(res => {
    const d = document.createElement('dialog'); d.id = 'cropDlg';
    d.innerHTML = `<div class="cr-head">Περικοπή εικόνας<small>Σύρε τις γωνίες ή μετακίνησε το πλαίσιο. Ό,τι είναι έξω από το πλαίσιο κόβεται.</small></div>
      <div class="cr-area"><div class="cr-box"><img class="cr-img" alt=""><div class="cr-rect"><i data-h="nw"></i><i data-h="ne"></i><i data-h="sw"></i><i data-h="se"></i></div></div></div>
      <div class="cr-foot"><button class="btn" data-c="cancel">Άκυρο</button><button class="btn" data-c="all">Όλη η εικόνα</button><button class="btn primary" data-c="ok">Περικοπή ✓</button></div>`;
    document.body.append(d);
    const area = d.querySelector('.cr-area'), box = d.querySelector('.cr-box'), im = d.querySelector('.cr-img'), rc = d.querySelector('.cr-rect');
    let r = { x:.08, y:.08, w:.84, h:.84 }, drag = null, nat = null;
    const MIN = .08, clamp = (v,a,b) => Math.max(a, Math.min(b, v));
    const paint = () => { rc.style.left = r.x*100+'%'; rc.style.top = r.y*100+'%'; rc.style.width = r.w*100+'%'; rc.style.height = r.h*100+'%'; };
    const fit = () => {
      if (!nat) return; const aw = area.clientWidth-16, ah = area.clientHeight-16, sc = Math.min(aw/nat.w, ah/nat.h);
      box.style.width = Math.round(nat.w*sc)+'px'; box.style.height = Math.round(nat.h*sc)+'px';
    };
    const done = v => { window.removeEventListener('resize', fit); d.close(); d.remove(); res(v); };
    im.onload = () => { nat = { w:im.naturalWidth, h:im.naturalHeight }; fit(); paint(); };
    im.src = url;
    window.addEventListener('resize', fit);
    d.addEventListener('cancel', e => { e.preventDefault(); done(null); });
    d.addEventListener('click', e => { const c = e.target.closest('[data-c]')?.dataset.c; if (!c) return; done(c==='cancel' ? null : c==='all' ? { x:0, y:0, w:1, h:1 } : { ...r }); });
    rc.addEventListener('pointerdown', e => {
      rc.setPointerCapture(e.pointerId); const b = box.getBoundingClientRect();
      drag = { h: e.target.dataset?.h || 'move', sx:e.clientX, sy:e.clientY, r:{ ...r }, bw:b.width, bh:b.height };
    });
    rc.addEventListener('pointermove', e => {
      if (!drag) return;
      const dx = (e.clientX-drag.sx)/drag.bw, dy = (e.clientY-drag.sy)/drag.bh, o = drag.r;
      if (drag.h==='move'){ r.x = clamp(o.x+dx, 0, 1-o.w); r.y = clamp(o.y+dy, 0, 1-o.h); }
      else {
        let x0 = o.x, y0 = o.y, x1 = o.x+o.w, y1 = o.y+o.h;
        if (drag.h.includes('w')) x0 = clamp(o.x+dx, 0, x1-MIN); else x1 = clamp(o.x+o.w+dx, x0+MIN, 1);
        if (drag.h.includes('n')) y0 = clamp(o.y+dy, 0, y1-MIN); else y1 = clamp(o.y+o.h+dy, y0+MIN, 1);
        r = { x:x0, y:y0, w:x1-x0, h:y1-y0 };
      }
      paint();
    });
    const end = () => { drag = null; }; rc.addEventListener('pointerup', end); rc.addEventListener('pointercancel', end);
    d.showModal();
  });
}
// Κόβει μια εικόνα (Blob ή data URL) στο πλαίσιο r και επιστρέφει canvas
async function cropToCanvas(src, r){
  const blob = typeof src==='string' ? await (await fetch(src)).blob() : src;
  const bmp = await createImageBitmap(blob);
  const sx = Math.round(r.x*bmp.width), sy = Math.round(r.y*bmp.height);
  const sw = Math.max(1, Math.round(r.w*bmp.width)), sh = Math.max(1, Math.round(r.h*bmp.height));
  const c = document.createElement('canvas'); c.width = sw; c.height = sh;
  c.getContext('2d').drawImage(bmp, sx, sy, sw, sh, 0, 0, sw, sh);
  return c;
}

/* ---------- Ζωντανός δορυφορικός χάρτης (Esri World Imagery μέσω Leaflet) → εικόνα ---------- */
const TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const TILE_ATTR = 'Esri, Maxar, Earthstar Geographics, GIS User Community';
function loadLeaflet(){
  if (window.L) return Promise.resolve(window.L);
  return new Promise((ok, bad) => {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.append(css);
    const sc = document.createElement('script'); sc.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    sc.onload = () => ok(window.L); sc.onerror = () => bad(new Error('Δεν φορτώθηκε ο χάρτης (έλεγξε τη σύνδεση)'));
    document.head.append(sc);
  });
}
function loadTile(url){
  return new Promise(ok => { const im = new Image(); im.crossOrigin = 'anonymous'; im.onload = () => ok(im); im.onerror = () => ok(null); im.src = url; });
}
// Ανοίγει τον ζωντανό χάρτη· επιστρέφει canvas με την περιοχή που φαίνεται ή null αν ακυρωθεί.
async function pickFromMap(toast){
  const L = await loadLeaflet();
  return new Promise(res => {
    const d = document.createElement('dialog'); d.id = 'geoDlg';
    d.innerHTML = `<div class="geo-head"><b>Διάλεξε την περιοχή του παρκινγκ</b>
        <input class="geo-q" type="search" placeholder="Διεύθυνση ή περιοχή (π.χ. Πατησίων 10, Αθήνα)" enterkeyhint="search"><button data-g="search">🔍</button><button data-g="loc" aria-label="Η τοποθεσία μου">📍</button>
        <small>Μετακίνησε και κάνε zoom ώστε να φαίνεται όλο το παρκινγκ. Ό,τι βλέπεις στην οθόνη γίνεται η εικόνα του χάρτη.</small></div>
      <div class="geo-map"></div>
      <div class="geo-foot"><button class="btn" data-g="cancel">Άκυρο</button><button class="btn primary" data-g="shot">📸 Λήψη εικόνας</button></div>`;
    document.body.append(d);
    let view; try { view = JSON.parse(localStorage.getItem('parking-geo-view')); } catch {}
    const map = L.map(d.querySelector('.geo-map'), { zoomControl:true, attributionControl:true, maxZoom:19 }).setView(view ? [view.lat, view.lng] : [37.98, 23.73], view ? view.z : 12);
    L.tileLayer(TILE_URL, { maxNativeZoom:19, maxZoom:19, attribution:TILE_ATTR, crossOrigin:'anonymous' }).addTo(map);
    const done = v => { try { localStorage.setItem('parking-geo-view', JSON.stringify({ lat:map.getCenter().lat, lng:map.getCenter().lng, z:map.getZoom() })); } catch {} map.remove(); d.close(); d.remove(); res(v); };
    const search = async () => {
      const q = d.querySelector('.geo-q').value.trim(); if (!q) return;
      try {
        const r = await (await fetch('https://nominatim.openstreetmap.org/search?format=json&limit=1&q='+encodeURIComponent(q), { headers:{ 'Accept-Language':'el' } })).json();
        if (!r[0]) return toast('Δεν βρέθηκε η διεύθυνση');
        map.setView([+r[0].lat, +r[0].lon], 18);
      } catch { toast('Η αναζήτηση δεν δούλεψε, μετακίνησε τον χάρτη με το χέρι'); }
    };
    d.addEventListener('cancel', e => { e.preventDefault(); done(null); });
    d.querySelector('.geo-q').addEventListener('keydown', e => { if (e.key==='Enter'){ e.preventDefault(); search(); } });
    d.addEventListener('click', async e => {
      const g = e.target.closest('[data-g]')?.dataset.g; if (!g) return;
      if (g==='cancel') return done(null);
      if (g==='search') return search();
      if (g==='loc'){ if (!navigator.geolocation) return toast('Δεν υπάρχει GPS'); navigator.geolocation.getCurrentPosition(p => map.setView([p.coords.latitude, p.coords.longitude], 18), () => toast('Δεν δόθηκε άδεια τοποθεσίας')); return; }
      if (g==='shot'){
        const btn = e.target.closest('button'); btn.disabled = true; btn.textContent = 'Λήψη…';
        try { done(await captureView(L, map)); }
        catch(err){ btn.disabled = false; btn.textContent = '📸 Λήψη εικόνας'; toast(err.message || 'Η λήψη απέτυχε'); }
      }
    });
    d.showModal(); setTimeout(() => map.invalidateSize(), 50);
  });
}
// Ράβει τα πλακίδια της τρέχουσας προβολής σε ένα canvas (σε διπλάσια ανάλυση όταν γίνεται)
async function captureView(L, map){
  const b = map.getBounds();
  let z = Math.min(map.getZoom()+1, 19), p0, p1;
  for (;;){ p0 = map.project(b.getNorthWest(), z); p1 = map.project(b.getSouthEast(), z); if ((p1.x-p0.x) <= 2000 && (p1.y-p0.y) <= 2000 || z <= map.getZoom()) break; z--; }
  const W = Math.round(p1.x-p0.x), H = Math.round(p1.y-p0.y);
  const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
  const n = 2**z, jobs = [];
  for (let ty = Math.floor(p0.y/256); ty <= Math.floor(p1.y/256); ty++)
    for (let tx = Math.floor(p0.x/256); tx <= Math.floor(p1.x/256); tx++){
      if (ty<0 || ty>=n) continue; const wx = ((tx % n)+n) % n;
      jobs.push(loadTile(TILE_URL.replace('{z}',z).replace('{y}',ty).replace('{x}',wx)).then(im => { if (im) x.drawImage(im, Math.round(tx*256-p0.x), Math.round(ty*256-p0.y)); return !!im; }));
    }
  const ok = (await Promise.all(jobs)).filter(Boolean).length;
  if (!ok) throw new Error('Δεν κατέβηκαν εικόνες χάρτη, δοκίμασε ξανά');
  x.font = `${Math.max(11, Math.round(W/70))}px sans-serif`; x.textAlign = 'right'; x.fillStyle = '#fff'; x.shadowColor = '#000'; x.shadowBlur = 4;
  x.fillText('© '+TILE_ATTR, W-8, H-8);
  try { c.toDataURL('image/jpeg', .5); } catch { throw new Error('Ο browser δεν επιτρέπει την αποθήκευση αυτής της εικόνας'); }
  return c;
}

/* ---------- Ομορφιά ελεύθερου σχεδίου: ευθύγραμμα τμήματα, ίσιες γωνίες, κλειστά σχήματα ---------- */
function rdp(p, eps){
  if (p.length<3) return p;
  const a = p[0], b = p[p.length-1], dx = b[0]-a[0], dy = b[1]-a[1], L = Math.hypot(dx,dy) || 1e-9;
  let dm = 0, ix = 0;
  for (let i=1;i<p.length-1;i++){ const d = Math.abs(dy*(p[i][0]-a[0]) - dx*(p[i][1]-a[1]))/L; if (d>dm){ dm = d; ix = i; } }
  if (dm<=eps) return [a,b];
  return rdp(p.slice(0,ix+1), eps).slice(0,-1).concat(rdp(p.slice(ix), eps));
}
const polyArea = p => Math.abs(p.reduce((s,q,i)=>{ const r = p[(i+1)%p.length]; return s + q[0]*r[1] - r[0]*q[1]; }, 0))/2;
// pts σε % της εικόνας, W/H σε εικονοστοιχεία. Επιστρέφει {t:'p'|'g'|'r', ...}
function beautify(pts, W, H){
  const P = pts.map(q => [q[0]*W/100, q[1]*H/100]), S = Math.max(W,H);
  const xs = P.map(q=>q[0]), ys = P.map(q=>q[1]);
  const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), diag = Math.hypot(x1-x0, y1-y0);
  const closed = P.length>=8 && Math.hypot(P[0][0]-P[P.length-1][0], P[0][1]-P[P.length-1][1]) < Math.max(.03*S, diag*.2);
  let eps = Math.max(.018*S, diag*.05);
  const snap = (q, loop) => {
    for (let i=0;i<q.length-(loop?0:1);i++){
      const a = q[i], b = q[(i+1)%q.length], dx = b[0]-a[0], dy = b[1]-a[1];
      if (Math.abs(dy) <= Math.abs(dx)*.16) b[1] = a[1]; else if (Math.abs(dx) <= Math.abs(dy)*.16) b[0] = a[0];
    }
    return q;
  };
  const back = q => q.map(r => [ +(r[0]*100/W).toFixed(2), +(r[1]*100/H).toFixed(2) ]);
  if (closed){
    let s;
    // κλειστή διαδρομή: σπάμε στο πιο μακρινό σημείο από την αρχή (το rdp θέλει διαφορετικά άκρα)
    let far = 0, fd = -1; P.forEach((q,i) => { const d = Math.hypot(q[0]-P[0][0], q[1]-P[0][1]); if (d>fd){ fd = d; far = i; } });
    for (let k=0;k<6;k++){
      const A = rdp(P.slice(0,far+1), eps), B = rdp(P.slice(far).concat([P[0]]), eps);
      s = A.concat(B.slice(1)).slice(0,-1); if (s.length<=9) break; eps *= 1.4;
    }
    if (s.length>=3){
      if (s.length<=6 && polyArea(s) > .8*(x1-x0)*(y1-y0))
        return { t:'r', x:+(x0*100/W).toFixed(2), y:+(y0*100/H).toFixed(2), w:+((x1-x0)*100/W).toFixed(2), h:+((y1-y0)*100/H).toFixed(2) };
      return { t:'g', pts: back(snap(s.map(r=>[...r]), true)) };
    }
  }
  const s = rdp(P, eps);
  return { t:'p', pts: back(snap(s.map(r=>[...r]), false)) };
}

export function zoneOf(label){ return String(label||'').replace(/\d+.*$/,'').replace(/[^A-Za-zΑ-Ωα-ω]/g,'').toUpperCase() || '—'; }
export function nextLabel(l){
  const m = /^(.*?)(\d+)$/.exec(String(l||''));
  return m ? m[1] + String(+m[2]+1).padStart(m[2].length,'0') : (l ? l+'2' : '1');
}

export function initMap(ctx){
  const { store, getCars, plateKey, esc, fmtT, fmtDur, toast, openNewCarAt, exitCar, onChange } = ctx;
  const st = document.createElement('style'); st.textContent = CSS; document.head.append(st);

  const dlg = document.createElement('dialog'); dlg.id = 'mapDlg';
  dlg.innerHTML = `
    <div class="mp-head"><div class="mp-top"><button class="mp-x" data-a="close" aria-label="Κλείσιμο">✕</button><div class="mp-title"></div></div><div class="mp-maps"></div><div class="mp-zones"></div></div>
    <div class="mp-vp"><div class="mp-stage"><img class="mp-img" alt=""><div class="mp-shapes"></div><div class="mp-spots"></div></div><div class="mp-empty" hidden></div></div>
    <div class="mp-sheet" hidden></div>
    <div class="mp-foot"></div>
    <input type="file" accept="image/*" hidden class="mp-file">`;
  document.body.append(dlg);
  const $ = s => dlg.querySelector(s);
  const vp = $('.mp-vp'), stage = $('.mp-stage'), img = $('.mp-img'), spotsEl = $('.mp-spots'), shapesEl = $('.mp-shapes');
  const sheet = $('.mp-sheet'), foot = $('.mp-foot'), titleEl = $('.mp-title'), zonesEl = $('.mp-zones'), mapsEl = $('.mp-maps'), emptyEl = $('.mp-empty'), fileEl = $('.mp-file');

  /* ---------- κατάσταση ---------- */
  let mapImg = null;                          // {image,w,h}
  let remote = { list:[], size:3.2, shapes:[] }; // τελευταία κατάσταση από τη βάση
  let doc = { list:[], size:3.2, shapes:[] }; // τοπική κατάσταση (αλλάζει στην επεξεργασία)
  const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#a855f7','#ffffff'];
  let tool = 'spot', color = COLORS[4], drawing = null;   // εργαλείο: pan | spot | rect | pen | erase
  let mode = 'browse', editing = false, pickCb = null;
  let zoneFilter = null, focusKey = null, selected = null, startLabel = null, lastLabel = '', undo = [];
  let s = 1, tx = 0, ty = 0, baseW = 0, baseH = 0, saveT = null;
  // πολλοί χάρτες
  let holdRemoteUntil = 0;   // μετά το «Τέλος» αγνοούμε για λίγο παλιές απαντήσεις της βάσης
  let maps = [], curId = null, subbedId, allSpots = {}, unsubMap = null, unsubSpots = {}, loaded = false, afterLoad = null;
  try { curId = localStorage.getItem('parking-map-cur') || null; } catch {}
  const curMap = () => maps.find(m => m.id===curId);

  const key = plateKey;
  const spotKeys = () => new Set(doc.list.map(p => key(p.l)));
  function occupancy(){
    const m = new Map();
    for (const v of getCars()) if (!v.exitAt && !(v.mapId && v.mapId!==curId)){ const k = key(v.location); if (!m.has(k)) m.set(k, []); m.get(k).push(v); }
    return m;
  }

  /* ---------- δεδομένα ---------- */
  const cloneRemote = () => ({ list: remote.list.map(p=>({...p})), size: remote.size, shapes: JSON.parse(JSON.stringify(remote.shapes)) });
  function useMap(id){
    subbedId = id; curId = id; try { id ? localStorage.setItem('parking-map-cur', id) : localStorage.removeItem('parking-map-cur'); } catch {}
    unsubMap?.(); unsubMap = null; loaded = !id;
    mapImg = null; remote = { list:[], size:3.2, shapes:[] }; doc = cloneRemote(); zoneFilter = null; selected = null;
    if (id) unsubMap = store.subscribeMap(id, ({ img:i, spots, shapes }) => {
      mapImg = i && i.image ? i : null;
      remote = { list: (spots?.list)||[], size: spots?.size||3.2, shapes: (shapes?.list)||[] };
      if (!editing && Date.now() > holdRemoteUntil) doc = cloneRemote();
      loaded = true;
      if (dlg.open){ render(); if (afterLoad){ const f = afterLoad; afterLoad = null; requestAnimationFrame(f); } }
      onChange?.();
    });
    if (dlg.open) render();
  }
  store.subscribeMaps(list => {
    maps = list || [];
    const want = maps.some(m => m.id===curId) ? curId : (maps[0]?.id || null);
    if (want !== subbedId) useMap(want);
    // οι θέσεις όλων των χαρτών (μικρά έγγραφα) για το κουμπί «Στον χάρτη»
    for (const m of maps) if (!unsubSpots[m.id]) unsubSpots[m.id] = store.subscribeSpots(m.id, l => { allSpots[m.id] = l; onChange?.(); });
    for (const id of Object.keys(unsubSpots)) if (!maps.some(m => m.id===id)){ unsubSpots[id](); delete unsubSpots[id]; delete allSpots[id]; }
    if (dlg.open) render();
    onChange?.();
  });
  // Παίρνει πρώτα φωτογραφία της κατάστασης και μετά στέλνει: αλλιώς μια απάντηση της βάσης ανάμεσα στις δύο αποθηκεύσεις μπορούσε να αντικαταστήσει τα σχέδια
  const saveAll = () => { if (!curId) return Promise.resolve(); const id = curId, list = doc.list, size = doc.size, shapes = doc.shapes;
    return Promise.all([ store.saveSpots(id, { list, size }), store.saveShapes(id, { list:shapes }) ]); };
  function scheduleSave(){
    clearTimeout(saveT);
    saveT = setTimeout(()=>saveAll().catch(e=>toast('Σφάλμα αποθήκευσης: '+e.message)), 500);
  }
  const snap = () => JSON.stringify({ list:doc.list, shapes:doc.shapes });
  function mutate(fn){ undo.push(snap()); if (undo.length>50) undo.shift(); fn(); scheduleSave(); render(); }

  /* ---------- προβολή / zoom ---------- */
  const apply = () => { stage.style.transform = `translate(${tx}px,${ty}px) scale(${s})`; };
  function layout(){
    if (!mapImg) return;
    const vw = vp.clientWidth, vh = vp.clientHeight, asp = mapImg.w/mapImg.h;
    baseW = Math.min(vw, vh*asp); baseH = baseW/asp;
    stage.style.width = baseW+'px'; stage.style.height = baseH+'px';
    stage.style.setProperty('--sp', (baseW*doc.size/100)+'px');
  }
  function fitAll(){ layout(); s = 1; tx = (vp.clientWidth-baseW)/2; ty = (vp.clientHeight-baseH)/2; apply(); }
  function fitBox(x0,y0,x1,y1,maxS=10){
    layout(); const vw = vp.clientWidth, vh = vp.clientHeight, pad = baseW*doc.size/100*1.5;
    const bw = (x1-x0)/100*baseW + 2*pad, bh = (y1-y0)/100*baseH + 2*pad;
    s = Math.max(1, Math.min(vw/bw, vh/bh, maxS));
    const cx = (x0+x1)/2/100*baseW, cy = (y0+y1)/2/100*baseH;
    tx = vw/2 - cx*s; ty = vh/2 - cy*s; apply();
  }
  function zoomAt(cx, cy, f){
    const ns = Math.max(0.6, Math.min(14, s*f)), r = ns/s;
    tx = cx - (cx-tx)*r; ty = cy - (cy-ty)*r; s = ns; apply();
  }
  const rel = (x,y) => { const r = vp.getBoundingClientRect(); return { x:x-r.left, y:y-r.top }; };
  vp.addEventListener('wheel', e => { e.preventDefault(); const p = rel(e.clientX,e.clientY); zoomAt(p.x,p.y,Math.exp(-e.deltaY*0.0015)); }, { passive:false });

  /* ---------- χειρισμός δαχτύλων / ποντικιού ---------- */
  const ptrs = new Map(); let moved = false, dragSpot = null, pinch = null;
  function pointPct(cx, cy){ const r = stage.getBoundingClientRect(); return { x:(cx-r.left)/r.width*100, y:(cy-r.top)/r.height*100 }; }
  const clampPct = v => Math.max(0, Math.min(100, v));
  const isDrawTool = () => editing && (tool==='rect' || tool==='pen');
  const svgEl = () => shapesEl.querySelector('svg');

  /* σχεδίαση ορθογωνίων και ελεύθερου σχεδίου */
  function drawStart(e){
    const q = pointPct(e.clientX, e.clientY);
    if (q.x<0 || q.x>100 || q.y<0 || q.y>100) return;
    drawing = { type:tool, x0:clampPct(q.x), y0:clampPct(q.y), x1:null, y1:null, pts:[[+clampPct(q.x).toFixed(2), +clampPct(q.y).toFixed(2)]], el:null };
  }
  function drawMove(e){
    const q = pointPct(e.clientX, e.clientY), x = clampPct(q.x), y = clampPct(q.y);
    if (drawing.type==='rect'){
      if (!drawing.el){
        drawing.el = document.createElement('div'); drawing.el.className = 'shp prev';
        drawing.el.style.borderColor = color; drawing.el.style.background = color+'33'; shapesEl.append(drawing.el);
      }
      Object.assign(drawing.el.style, { left:Math.min(drawing.x0,x)+'%', top:Math.min(drawing.y0,y)+'%', width:Math.abs(x-drawing.x0)+'%', height:Math.abs(y-drawing.y0)+'%' });
      drawing.x1 = x; drawing.y1 = y;
    } else {
      const last = drawing.pts[drawing.pts.length-1];
      if (Math.hypot(x-last[0], y-last[1]) < 0.3) return;
      drawing.pts.push([+x.toFixed(2), +y.toFixed(2)]);
      if (!drawing.el){ drawing.el = document.createElementNS('http://www.w3.org/2000/svg','polyline'); drawing.el.setAttribute('stroke', color); svgEl()?.append(drawing.el); }
      drawing.el.setAttribute('points', drawing.pts.map(p=>p.join(',')).join(' '));
    }
  }
  // Κάθε σχήμα παίρνει υποχρεωτικά όνομα (προτείνεται αυτόματα, αν ακυρώσεις δεν αποθηκεύεται)
  function askName(){
    const def = 'Ζώνη '+(doc.shapes.length+1);
    const n = prompt('Όνομα περιοχής (π.χ. Ζώνη Α · VIP · Είσοδος):', def);
    return n===null ? null : (n.trim() || def);
  }
  function drawEnd(){
    const d = drawing; drawing = null; d.el?.remove();
    if (d.type==='rect'){
      if (d.x1==null) return;
      const w = Math.abs(d.x1-d.x0), h = Math.abs(d.y1-d.y0);
      if (w<0.8 || h<0.8) return;
      const name = askName(); if (name===null) return;
      mutate(()=>doc.shapes.push({ t:'r', x:+Math.min(d.x0,d.x1).toFixed(2), y:+Math.min(d.y0,d.y1).toFixed(2), w:+w.toFixed(2), h:+h.toFixed(2), c:color, n:name }));
    } else {
      if (d.pts.length<2) return;
      const o = beautify(d.pts, mapImg?.w || 1000, mapImg?.h || 1000);
      if (o.t==='p' && o.pts.length<2) return;
      const name = askName(); if (name===null) return;
      mutate(()=>doc.shapes.push({ ...o, c:color, n:name }));
    }
  }

  vp.addEventListener('pointerdown', e => {
    if (e.target.closest('.mp-empty')) return;
    vp.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x:e.clientX, y:e.clientY, sx:e.clientX, sy:e.clientY, target:e.target });
    if (ptrs.size===1){
      moved = false; drawing = null; dragSpot = null;
      if (isDrawTool()) drawStart(e);
      else { const sp = e.target.closest?.('.spot'); if (editing && sp && (tool==='spot' || tool==='pan')) dragSpot = +sp.dataset.i; }
    }
    if (ptrs.size===2){ moved = true; dragSpot = null; pinch = null; if (drawing){ drawing.el?.remove(); drawing = null; } }   // δύο δάχτυλα = zoom/μετακίνηση
  });
  vp.addEventListener('pointermove', e => {
    const p = ptrs.get(e.pointerId); if (!p) return;
    const dx = e.clientX-p.x, dy = e.clientY-p.y; p.x = e.clientX; p.y = e.clientY;
    if (ptrs.size===2){
      const [a,b] = [...ptrs.values()], d = Math.hypot(a.x-b.x,a.y-b.y), c = rel((a.x+b.x)/2,(a.y+b.y)/2);
      if (pinch){ zoomAt(c.x, c.y, d/pinch.d); tx += c.x-pinch.c.x; ty += c.y-pinch.c.y; apply(); }
      pinch = { d, c }; return;
    }
    if (!moved && Math.hypot(e.clientX-p.sx, e.clientY-p.sy) <= 6) return;
    moved = true;
    if (drawing){ drawMove(e); return; }
    if (dragSpot!=null){
      const q = pointPct(e.clientX, e.clientY), sp = doc.list[dragSpot];
      if (sp){ sp.x = +Math.max(0,Math.min(100,q.x)).toFixed(2); sp.y = +Math.max(0,Math.min(100,q.y)).toFixed(2);
        const el = spotsEl.children[dragSpot]; if (el){ el.style.left = sp.x+'%'; el.style.top = sp.y+'%'; } }
    } else { tx += dx; ty += dy; apply(); }
  });
  function endPtr(e, cancelled){
    const p = ptrs.get(e.pointerId); ptrs.delete(e.pointerId); if (!p) return;
    if (ptrs.size>0){ moved = true; pinch = null; return; }
    pinch = null;
    if (cancelled) { dragSpot = null; if (drawing){ drawing.el?.remove(); drawing = null; } return; }
    if (drawing){ if (moved) drawEnd(); else drawing = null; dragSpot = null; return; }
    if (!moved) tap(p.target, e);
    else if (dragSpot!=null){ undo.push(null); scheduleSave(); }      // μετακίνηση θέσης
    dragSpot = null;
  }
  vp.addEventListener('pointerup', e => endPtr(e,false));
  vp.addEventListener('pointercancel', e => endPtr(e,true));

  function tap(target, e){
    const sp = target.closest?.('.spot');
    if (sp) return spotTap(+sp.dataset.i);
    if (editing){
      if (tool==='erase'){ const sh = target.closest?.('[data-si]'); if (sh){ const i = +sh.dataset.si; mutate(()=>doc.shapes.splice(i,1)); } return; }
      if (tool==='pan'){ const sh = target.closest?.('[data-si]'); if (sh){ const i = +sh.dataset.si, n = prompt('Όνομα περιοχής:', doc.shapes[i]?.n || ''); if (n!==null && n.trim()) mutate(()=>{ doc.shapes[i].n = n.trim(); }); } return; }
      if (tool==='spot'){
        const q = pointPct(e.clientX, e.clientY);
        if (q.x<0||q.x>100||q.y<0||q.y>100) return;
        return addSpot(+q.x.toFixed(2), +q.y.toFixed(2));
      }
      return;
    }
    closeSheet();
  }

  /* ---------- επεξεργασία ---------- */
  function addSpot(x,y){
    let label = startLabel;
    if (!label){
      label = lastLabel ? nextLabel(lastLabel) : (prompt('Όνομα πρώτης θέσης (π.χ. A1):','A1')||'').trim();
      if (!label) return;
    }
    const have = spotKeys(); while (have.has(key(label))) label = nextLabel(label);
    startLabel = null; lastLabel = label;
    mutate(()=>doc.list.push({ l:label, x, y }));
    toast('Θέση '+label);
  }
  function spotTap(i){
    const sp = doc.list[i]; if (!sp) return;
    selected = i;
    if (mode==='pick' && !editing){
      const cars = occupancy().get(key(sp.l));
      if (!cars?.length) return finishPick(sp.l);
    }
    renderSheet(); render();
  }
  function finishPick(label){ const cb = pickCb, id = curId; close(); cb?.(label, id); }
  function closeSheet(){ selected = null; sheet.hidden = true; render(); }

  function renderSheet(){
    const sp = doc.list[selected];
    if (!sp){ sheet.hidden = true; return; }
    sheet.hidden = false;
    if (editing){
      sheet.innerHTML = `<b>Θέση</b> <input id="mpLab" value="${esc(sp.l)}" autocapitalize="characters">
        <div class="mp-row"><button class="btn primary" data-a="rename">Αποθήκευση ονόματος</button><button class="btn danger" data-a="del">Διαγραφή θέσης</button><button class="btn" data-a="closesheet">Κλείσιμο</button></div>`;
      return;
    }
    const cars = occupancy().get(key(sp.l)) || [];
    if (!cars.length){
      sheet.innerHTML = `<b style="font-size:18px">Θέση ${esc(sp.l)}</b> <span class="m">· ελεύθερη</span>
        <div class="mp-row"><button class="btn primary" data-a="newhere">+ Νέο όχημα εδώ</button><button class="btn" data-a="closesheet">Κλείσιμο</button></div>`;
      return;
    }
    sheet.innerHTML = cars.map(v => `<div style="margin-bottom:10px"><span class="plate">${esc(v.plate)}</span>
      <div class="m">📍 ${esc(v.location)} · ⏱ ${fmtT(v.entryAt)} (${fmtDur(v.entryAt,Date.now())})${v.keyNo?` · 🔑 ${esc(v.keyNo)}`:''}${v.phone?` · <a href="tel:${esc(v.phone)}">📞 ${esc(v.phone)}</a>`:''}</div>
      <div class="mp-row"><button class="btn go" data-a="exit" data-id="${v.id}">Έφυγε ✓</button>${mode==='pick'?`<button class="btn" data-a="usepick">Χρήση της θέσης παρ' όλα αυτά</button>`:''}<button class="btn" data-a="closesheet">Κλείσιμο</button></div></div>`).join('');
  }

  dlg.addEventListener('click', async e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a;
    if (a==='close') return close();
    if (a==='closesheet') return closeSheet();
    if (a==='edit'){ editing = true; mode = 'browse'; closeSheet(); renderAll(); return; }
    if (a==='done'){
      startLabel = null; undo = []; clearTimeout(saveT);
      const final = JSON.parse(JSON.stringify({ list:doc.list, size:doc.size, shapes:doc.shapes }));
      holdRemoteUntil = Date.now() + 2500;          // κράτα την τοπική εικόνα όσο φτάνουν οι απαντήσεις της βάσης
      try { await saveAll(); toast('Ο χάρτης αποθηκεύτηκε'); }
      catch(err){ toast('Σφάλμα αποθήκευσης: '+err.message); }
      remote = final; doc = cloneRemote(); editing = false; closeSheet(); renderAll(); return;
    }
    if (a==='tool'){ tool = b.dataset.t; startLabel = null; closeSheet(); return; }
    if (a==='color'){ color = b.dataset.c; renderFoot(); return; }
    if (a==='pickimg' || a==='img') return fileEl.click();
    if (a==='geoimg'){
      if (!curId) return;
      if (mapImg && doc.list.length && !confirm('Αν αλλάξεις εικόνα, οι θέσεις μένουν στα ίδια σημεία. Συνέχεια;')) return;
      try {
        const canvas = await pickFromMap(toast); if (!canvas) return;
        const url = canvas.toDataURL('image/jpeg', .92); const r = await cropDialog(url); if (!r) return;
        toast('Επεξεργασία εικόνας…'); const full = r.x===0 && r.y===0 && r.w===1 && r.h===1;
        const o = await compressImage(full ? canvas : await cropToCanvas(url, r)); await store.saveImage(curId, o);
        editing = true; mode = 'browse'; toast('Η εικόνα αποθηκεύτηκε'); setTimeout(()=>{ renderAll(); fitAll(); }, 150);
      } catch(err){ toast('Σφάλμα: '+err.message); }
      return;
    }
    if (a==='cropimg'){
      if (!mapImg) return;
      const r = await cropDialog(mapImg.image); if (!r || (r.x===0 && r.y===0 && r.w===1 && r.h===1)) return;
      if (doc.list.length && !confirm('Οι θέσεις και τα σχέδια θα μετακινηθούν ώστε να μείνουν στα ίδια σημεία της εικόνας. Όσα μένουν έξω από την περικοπή θα σβηστούν. Συνέχεια;')) return;
      try {
        toast('Περικοπή…'); const o = await compressImage(await cropToCanvas(mapImg.image, r));
        const X = v => (v/100 - r.x)/r.w*100, Y = v => (v/100 - r.y)/r.h*100, inside = (x,y) => x>=0 && x<=100 && y>=0 && y<=100;
        const list = doc.list.map(p => ({ ...p, x:+X(p.x).toFixed(2), y:+Y(p.y).toFixed(2) })).filter(p => inside(p.x,p.y));
        const shapes = [];
        for (const sh of doc.shapes){
          if (sh.t==='r'){
            const x0 = Math.max(0, X(sh.x)), y0 = Math.max(0, Y(sh.y)), x1 = Math.min(100, X(sh.x+sh.w)), y1 = Math.min(100, Y(sh.y+sh.h));
            if (x1-x0 >= 0.8 && y1-y0 >= 0.8) shapes.push({ ...sh, x:+x0.toFixed(2), y:+y0.toFixed(2), w:+(x1-x0).toFixed(2), h:+(y1-y0).toFixed(2) });
          } else if ((sh.t==='p' || sh.t==='g') && Array.isArray(sh.pts)){
            const pts = sh.pts.map(q => [ +X(q[0]).toFixed(2), +Y(q[1]).toFixed(2) ]);
            if (pts.some(q => inside(q[0],q[1]))) shapes.push({ ...sh, pts });
          }
        }
        clearTimeout(saveT); doc.list = list; doc.shapes = shapes; undo = [];
        await Promise.all([ store.saveImage(curId, o), store.saveSpots(curId, { list, size:doc.size }), store.saveShapes(curId, { list:shapes }) ]);
        closeSheet(); toast('Η εικόνα περικόπηκε'); setTimeout(()=>{ renderAll(); fitAll(); }, 150);
      } catch(err){ toast('Σφάλμα περικοπής: '+err.message); }
      return;
    }
    if (a==='selmap'){ if (b.dataset.id===curId) return; if (editing) return toast('Πάτα πρώτα «Τέλος»'); closeSheet(); useMap(b.dataset.id); afterLoad = () => fitAll(); render(); return; }
    if (a==='newmap'){
      const name = (prompt('Όνομα νέου χάρτη (π.χ. Υπόγειο, Πάρκινγκ 2):', 'Χάρτης '+(maps.length+1))||'').trim(); if (!name) return;
      const id = 'm'+Date.now().toString(36); maps = [...maps, { id, name }];
      try { await store.setMaps(maps); } catch(err){ maps = maps.filter(m=>m.id!==id); return toast('Σφάλμα: '+err.message); }
      closeSheet(); useMap(id); afterLoad = () => fitAll(); toast('Ο χάρτης «'+name+'» δημιουργήθηκε — ανέβασε εικόνα'); render(); return;
    }
    if (a==='renamemap'){
      const m = curMap(); if (!m) return; const name = (prompt('Νέο όνομα χάρτη:', m.name)||'').trim(); if (!name) return;
      maps = maps.map(x => x.id===m.id ? { ...x, name } : x); try { await store.setMaps(maps); } catch(err){ return toast('Σφάλμα: '+err.message); } render(); return;
    }
    if (a==='clearmap'){
      const m = curMap(); if (!m) return;
      if (!confirm('Να διαγραφεί ο χάρτης «'+m.name+'» (φωτογραφία, θέσεις και σχέδια);\nΔεν αναιρείται και φεύγει για όλους τους υπαλλήλους.\nΤα οχήματα δεν επηρεάζονται.')) return;
      clearTimeout(saveT); const id = m.id;
      try { await store.deleteMapData(id); maps = maps.filter(x => x.id!==id); await store.setMaps(maps); } catch(err){ return toast('Σφάλμα διαγραφής: '+err.message); }
      editing = false; startLabel = null; undo = []; useMap(maps[0]?.id || null); afterLoad = () => fitAll();
      closeSheet(); renderAll(); onChange?.(); toast('Ο χάρτης διαγράφηκε'); return;
    }
    if (a==='zone'){ zoneFilter = b.dataset.z || null; fitZone(); render(); return; }
    if (a==='newzone'){ const l = (prompt('Πρώτη θέση της νέας ζώνης/σειράς (π.χ. B1):', lastLabel?nextLabel(lastLabel.replace(/\d+$/,'0')):'B1')||'').trim(); if (l){ startLabel = l; toast('Πάτα στον χάρτη για να μπει η '+l); renderFoot(); } return; }
    if (a==='undo'){ while (undo.length && undo[undo.length-1]===null) undo.pop(); const prev = undo.pop(); if (prev){ const o = JSON.parse(prev); doc.list = o.list; doc.shapes = o.shapes; scheduleSave(); closeSheet(); } return; }
    if (a==='rename'){ const v = $('#mpLab').value.trim(); if (!v) return; const dup = doc.list.some((p,i)=>i!==selected && key(p.l)===key(v)); if (dup) return toast('Υπάρχει ήδη θέση '+v); mutate(()=>{ doc.list[selected].l = v; }); lastLabel = v; closeSheet(); return; }
    if (a==='del'){ mutate(()=>{ doc.list.splice(selected,1); }); closeSheet(); return; }
    if (a==='newhere'){ const l = doc.list[selected].l, id = curId; close(); openNewCarAt(l, id); return; }
    if (a==='exit'){ await exitCar(b.dataset.id); renderSheet(); return; }
    if (a==='usepick'){ finishPick(doc.list[selected].l); return; }
  });
  dlg.addEventListener('input', e => {
    if (e.target.matches('.mp-size')){ doc.size = +e.target.value; layout(); scheduleSave(); }
  });
  fileEl.addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f || !curId) return;
    if (mapImg && doc.list.length && !confirm('Αν αλλάξεις εικόνα, οι θέσεις μένουν στα ίδια σημεία. Συνέχεια;')) return;
    const url = URL.createObjectURL(f); const r = await cropDialog(url); URL.revokeObjectURL(url); if (!r) return;
    try { toast('Επεξεργασία εικόνας…'); const full = r.x===0 && r.y===0 && r.w===1 && r.h===1; const o = await compressImage(full ? f : await cropToCanvas(f, r)); await store.saveImage(curId, o); editing = true; mode='browse'; toast('Η εικόνα αποθηκεύτηκε'); setTimeout(()=>{ renderAll(); fitAll(); }, 150); }
    catch(err){ toast('Σφάλμα εικόνας: '+err.message); }
  });
  img.addEventListener('load', () => { layout(); if (dlg.open) fitAll(); });
  window.addEventListener('resize', () => { if (dlg.open){ layout(); apply(); } });
  // όταν αλλάζει το μέγεθος του χώρου του χάρτη (π.χ. μεγαλώνει η μπάρα εργαλείων) ξαναπροσαρμόζεται
  if (window.ResizeObserver){
    let lw = 0, lh = 0, rt;
    new ResizeObserver(() => {
      if (!dlg.open || !vp.clientWidth) return;
      const w = vp.clientWidth, h = vp.clientHeight; if (w===lw && h===lh) return;
      const first = !lw; lw = w; lh = h;
      clearTimeout(rt); rt = setTimeout(() => { if (s===1 || first) fitAll(); else { layout(); apply(); } }, 60);
    }).observe(vp);
  }
  dlg.addEventListener('close', () => { editing = false; ptrs.clear(); });

  function fitZone(){
    const pts = doc.list.filter(p => !zoneFilter || zoneOf(p.l)===zoneFilter);
    if (!pts.length || !mapImg) return fitAll();
    if (!zoneFilter) return fitAll();
    fitBox(Math.min(...pts.map(p=>p.x)), Math.min(...pts.map(p=>p.y)), Math.max(...pts.map(p=>p.x)), Math.max(...pts.map(p=>p.y)), 6);
  }

  /* ---------- απόδοση ---------- */
  function renderFoot(){
    if (editing){
      const HINT = {
        pan:   'Σύρε για να κινήσεις τον χάρτη. Πάτα ένα σχήμα για να αλλάξεις το όνομά του. Με δύο δάχτυλα κάνεις zoom.',
        spot:  startLabel ? `Πάτα στον χάρτη για να μπει η θέση <b>${esc(startLabel)}</b>` : 'Πάτα στον χάρτη για να βάλεις θέση (παίρνουν αυτόματα το επόμενο νούμερο). Σύρε μια θέση για να τη μετακινήσεις, πάτα πάνω της για μετονομασία ή διαγραφή.',
        rect:  'Σύρε στον χάρτη για να ζωγραφίσεις ορθογώνιο (π.χ. μια ζώνη). Μετά μπορείς να του δώσεις όνομα. Με δύο δάχτυλα κάνεις zoom/μετακίνηση.',
        pen:   'Σύρε ελεύθερα: η γραμμή ισιώνει αυτόματα και αν κλείσεις το σχήμα γίνεται περιοχή. Μετά του δίνεις όνομα.',
        erase: 'Πάτα ένα σχήμα (ορθογώνιο, περιοχή ή γραμμή) για να το σβήσεις.',
      }[tool];
      const TOOLS = [['pan','✋','Κίνηση'],['spot','📍','Θέσεις'],['rect','▭','Ορθογώνιο'],['pen','✏️','Σχέδιο'],['erase','🗑','Σβήσιμο']];
      foot.innerHTML = `<div class="hint">${HINT}</div>
        <div class="mp-tools">${TOOLS.map(([t,i,n])=>`<button class="mp-tool ${tool===t?'on':''}" data-a="tool" data-t="${t}">${i} ${n}</button>`).join('')}</div>
        ${(tool==='rect'||tool==='pen') ? `<div class="mp-tools">${COLORS.map(c=>`<button class="mp-sw ${c===color?'on':''}" data-a="color" data-c="${c}" style="background:${c}" aria-label="χρώμα"></button>`).join('')}</div>` : ''}
        ${tool==='spot' ? '<button class="btn" data-a="newzone">＋ Νέα ζώνη/σειρά</button>' : ''}<button class="btn" data-a="undo">↶ Αναίρεση</button><button class="btn" data-a="img">🖼 Εικόνα</button><button class="btn" data-a="geoimg">🌍 Από χάρτη</button><button class="btn" data-a="cropimg">✂️ Περικοπή</button><button class="btn" data-a="renamemap">✏️ Όνομα χάρτη</button><button class="btn" data-a="clearmap">🗑 Διαγραφή χάρτη</button>
        <label>Μέγεθος θέσεων <input class="mp-size" type="range" min="1" max="8" step="0.1" value="${doc.size}"></label>
        <button class="btn primary" data-a="done" style="margin-left:auto">Τέλος</button>`;
    } else if (mode==='pick'){
      foot.innerHTML = `<div class="hint">Πάτα μια ελεύθερη (πράσινη) θέση για να την επιλέξεις.</div>`;
    } else {
      foot.innerHTML = `<div class="hint">Πράσινο: ελεύθερη · Κόκκινο: κατειλημμένη. Πάτα μια θέση για λεπτομέρειες.</div><button class="btn" data-a="edit">✏️ Επεξεργασία χάρτη</button>`;
    }
  }
  const safeColor = c => /^#[0-9a-f]{6}$/i.test(c) ? c : '#3b82f6';
  function renderShapes(){
    const rects = doc.shapes.map((sh,i) => sh.t!=='r' ? '' :
      `<div class="shp" data-si="${i}" style="left:${+sh.x}%;top:${+sh.y}%;width:${+sh.w}%;height:${+sh.h}%;border-color:${safeColor(sh.c)};background:${safeColor(sh.c)}2e">${sh.n?`<b>${esc(sh.n)}</b>`:''}</div>`).join('');
    let labels = '';
    const lines = doc.shapes.map((sh,i) => {
      if ((sh.t!=='p' && sh.t!=='g') || !Array.isArray(sh.pts) || !sh.pts.length) return '';
      const pts = sh.pts.map(p=>`${+p[0]},${+p[1]}`).join(' '), c = safeColor(sh.c);
      if (sh.n){
        const xs = sh.pts.map(p=>+p[0]), ys = sh.pts.map(p=>+p[1]);
        const m = sh.t==='g' ? [(Math.min(...xs)+Math.max(...xs))/2, (Math.min(...ys)+Math.max(...ys))/2] : sh.pts[Math.floor(sh.pts.length/2)];
        labels += `<div class="shp-l" style="left:${+m[0]}%;top:${+m[1]}%">${esc(sh.n)}</div>`;
      }
      return sh.t==='g'
        ? `<polygon points="${pts}" stroke="${c}" fill="${c}" fill-opacity=".18"/><polygon class="hit" data-si="${i}" points="${pts}"/>`
        : `<polyline points="${pts}" stroke="${c}"/><polyline class="hit" data-si="${i}" points="${pts}"/>`;
    }).join('');
    shapesEl.innerHTML = rects + `<svg class="mp-svg" viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>` + labels;
  }
  function render(){
    dlg.classList.toggle('erase', editing && (tool==='erase' || tool==='pan'));
    const occ = occupancy(), total = doc.list.length;
    let used = 0; for (const p of doc.list) if (occ.has(key(p.l))) used++;
    titleEl.innerHTML = `${esc(curMap()?.name || 'Χάρτης παρκινγκ')}<small>${total ? `${total-used} ελεύθερες από ${total}` : 'δεν έχουν οριστεί θέσεις'}</small>`;
    mapsEl.hidden = editing;
    mapsEl.innerHTML = editing ? '' : maps.map(m => `<button class="mp-m ${m.id===curId?'on':''}" data-a="selmap" data-id="${esc(m.id)}">${esc(m.name)}</button>`).join('') + (mode==='pick' ? '' : '<button class="mp-m add" data-a="newmap">＋ Νέος χάρτης</button>');
    const zs = [...new Set(doc.list.map(p=>zoneOf(p.l)))].sort();
    zonesEl.innerHTML = zs.length>1 ? [`<button class="mp-z ${!zoneFilter?'on':''}" data-a="zone" data-z="">Όλες</button>`, ...zs.map(z=>`<button class="mp-z ${zoneFilter===z?'on':''}" data-a="zone" data-z="${esc(z)}">${esc(z)}</button>`)].join('') : '';
    if (!mapImg){
      img.removeAttribute('src'); stage.style.display = 'none'; emptyEl.hidden = false;
      emptyEl.innerHTML = !curId
        ? `<div style="font-size:42px">🗺️</div><div>Δεν υπάρχει χάρτης ακόμα.<br>Φτιάξε έναν και ανέβασε φωτογραφία ή σχέδιο του παρκινγκ.</div><button class="btn primary" data-a="newmap">＋ Νέος χάρτης</button>`
        : !loaded ? `<div>Φόρτωση…</div>`
        : `<div style="font-size:42px">🗺️</div><div>Ο χάρτης «${esc(curMap()?.name||'')}» δεν έχει εικόνα ακόμα.<br>Ανέβασε μια φωτογραφία ή σχέδιο του παρκινγκ (π.χ. από ψηλά ή κάτοψη) και βάλε πάνω της τις θέσεις.</div><div class="mp-row"><button class="btn primary" data-a="geoimg">🌍 Από χάρτη</button><button class="btn" data-a="pickimg">📷 Ανέβασμα εικόνας</button></div>`;
    } else {
      emptyEl.hidden = true; stage.style.display = '';
      if (img.getAttribute('src') !== mapImg.image) img.src = mapImg.image;
      layout(); renderShapes();
      spotsEl.innerHTML = doc.list.map((p,i) => {
        const o = occ.has(key(p.l)), z = zoneOf(p.l);
        const cls = editing ? 'ed' : (o ? 'occ' : 'free');
        const dim = zoneFilter && z!==zoneFilter ? ' dim' : '';
        const foc = (focusKey && key(p.l)===focusKey) || selected===i ? ' focus' : '';
        return `<div class="spot ${cls}${dim}${foc}" data-i="${i}" style="left:${p.x}%;top:${p.y}%">${esc(p.l)}</div>`;
      }).join('');
    }
    renderFoot();
  }
  function renderAll(){ render(); if (selected!=null) renderSheet(); }

  /* ---------- δημόσιο API ---------- */
  function findMapFor(label, mapId){
    if (mapId && maps.some(m => m.id===mapId)) return mapId;
    if (label){
      const k = key(label), has = id => (allSpots[id]||[]).some(p => key(p.l)===k);
      if (curId && has(curId)) return curId;
      const m = maps.find(m => has(m.id)); if (m) return m.id;
    }
    return curId;
  }
  function open(o = {}){
    mode = o.mode || 'browse'; pickCb = o.onPick || null; editing = false; selected = null; zoneFilter = null; startLabel = null; undo = []; tool = 'spot'; drawing = null;
    focusKey = o.focus ? key(o.focus) : null;
    const target = o.focus ? findMapFor(o.focus, o.mapId) : (o.mapId && maps.some(m => m.id===o.mapId) ? o.mapId : curId);
    const switched = target && target!==curId;
    if (switched) useMap(target);
    doc = cloneRemote();
    sheet.hidden = true; if (!dlg.open) dlg.showModal();
    render();
    const settle = () => {
      fitAll();
      if (focusKey){
        const i = doc.list.findIndex(p => key(p.l)===focusKey);
        if (i>=0){ const p = doc.list[i]; fitBox(p.x,p.y,p.x,p.y,3.5); selected = i; renderSheet(); render(); }
        else toast('Η θέση δεν υπάρχει στον χάρτη');
      }
    };
    if (switched && !loaded) afterLoad = settle; else requestAnimationFrame(settle);
  }
  function close(){ if (dlg.open) dlg.close(); }
  function refresh(){ if (dlg.open){ renderAll(); } }
  return { open, close, refresh, hasSpot: (label, mapId) => { if (!label) return false; const k = key(label), ids = mapId && allSpots[mapId] ? [mapId] : Object.keys(allSpots); return ids.some(id => allSpots[id].some(p => key(p.l)===k)); }, spotCount: () => remote.list.length };
}
