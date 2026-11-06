/* Χάρτης / κάτοψη παρκινγκ
   - Ανεβάζεις φωτογραφία ή σχέδιο του χώρου και βάζεις τις θέσεις με πάτημα.
   - Η ζώνη προκύπτει από τα γράμματα της ονομασίας (Α12 → ζώνη Α).
   - Ένα όχημα «κάθεται» σε θέση όταν το πεδίο Θέση της καταχώρησής του είναι ίδιο με την ονομασία της θέσης. */
import { createLive, walkRoute, geocode, fmtDist } from './live.js?v=5';

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
.mp-svg polyline{fill:none;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke;stroke-width:2px}
.mp-svg polyline.hit{stroke:transparent;stroke-width:24px}
.mp-svg polygon{stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke;stroke-width:2px}
.mp-svg polygon.hit{fill:transparent;stroke:transparent;stroke-width:24px}
.shp-l{position:absolute;transform:translate(-50%,-50%);font-size:var(--lbe,var(--lb,12px));font-weight:700;color:#fff;background:rgba(0,0,0,.62);padding:.06em .5em;border-radius:.4em;line-height:1.3;white-space:nowrap;pointer-events:none}
.shp{position:absolute;box-sizing:border-box;border:2px solid;border-radius:3px;pointer-events:none}
.shp b{display:inline-block;font-size:var(--lbe,var(--lb,12px));color:#fff;background:rgba(0,0,0,.6);padding:.06em .5em;border-radius:0 0 .4em 0;line-height:1.3;white-space:nowrap;overflow:hidden;max-width:100%}
.shp.prev{border-style:dashed}
#mapDlg.erase .shp{pointer-events:auto}
#mapDlg.erase .mp-svg polyline.hit{pointer-events:stroke}
#mapDlg.erase .mp-svg polygon.hit{pointer-events:all}
#mapDlg.edt .shp b,#mapDlg.edt .shp-l{pointer-events:auto;cursor:text}
#mapDlg.pickz .shp{pointer-events:auto;cursor:pointer}
#mapDlg.pickz .mp-svg polyline.hit{pointer-events:stroke}
#mapDlg.pickz .mp-svg polygon.hit{pointer-events:all}
.mp-tools{display:flex;gap:6px;flex-wrap:wrap;width:100%;align-items:center}
.mp-hint{font-size:13px;color:var(--muted,#888);margin:0 0 6px}
.mp-tool{padding:8px 12px;border-radius:10px;border:2px solid var(--line);background:var(--bg);color:var(--text);font-size:15px;font-weight:600}
.mp-tool.on{border-color:var(--accent);background:var(--accent);color:#fff}
.mp-sw{width:34px;height:34px;border-radius:50%;border:3px solid transparent;padding:0;box-shadow:0 0 0 1px var(--line)}
.mp-sw.on{border-color:var(--text)}
.mp-empty[hidden]{display:none}
.mp-sheet{flex:none;background:var(--card);border-top:1px solid var(--line);padding:12px 14px;max-height:45%;overflow:auto}
.mp-sheet[hidden]{display:none}
.mp-sheet:not([hidden]) ~ .mp-foot{display:none}
.mp-sheet .btn{padding:9px 12px;font-size:14px}
.mp-sheet .mp-row{gap:6px;flex-wrap:wrap}
.mp-sheet .plate{font-size:20px}
.mp-sheet .m{color:var(--muted);font-size:14px;margin-top:6px}
.mp-foot{flex:none;background:var(--card);border-top:1px solid var(--line);padding:10px 12px calc(10px + env(safe-area-inset-bottom));display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.mp-foot{transition:opacity .12s}
#mapDlg.editing .mp-foot{min-height:136px;align-content:flex-start}
.mp-ask{position:fixed;inset:0;z-index:40;background:rgba(0,0,0,.55);display:flex;align-items:flex-start;justify-content:center;padding-top:18vh}
.mp-ask form{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px;width:min(92vw,380px);display:flex;flex-direction:column;gap:12px}
.mp-ask .t{font-size:15px;color:var(--muted)}
.mp-ask input{font-size:18px;padding:12px;border-radius:10px;border:1px solid var(--line);background:var(--bg);color:var(--text)}
.mp-ask .r{display:flex;gap:8px;justify-content:flex-end}
.mp-more{flex:1 1 100%;display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.mp-ctx{position:fixed;z-index:20;background:var(--card);border:1px solid var(--line);border-radius:14px;box-shadow:0 8px 28px rgba(0,0,0,.45);padding:6px;display:flex;flex-direction:column;gap:2px;min-width:190px}
.mp-ctx[hidden]{display:none}
.mp-ctx>button{background:none;border:0;color:var(--text);font-size:16px;text-align:left;padding:11px 12px;border-radius:10px}
.mp-ctx>button:active{background:var(--line)}
.mp-ctx .cx-t{font-size:13px;color:var(--muted);padding:6px 12px 2px;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.mp-ctx .cx-sw{display:flex;gap:6px;flex-wrap:wrap;padding:6px 10px}
.vtx{position:absolute;width:12px;height:12px;border:3px solid;border-radius:50%;background:#fff;transform:translate(-50%,-50%);pointer-events:none;box-sizing:border-box}
.mp-fab{display:none;position:absolute;right:12px;bottom:calc(14px + env(safe-area-inset-bottom));z-index:6;border:0;border-radius:999px;padding:12px 16px;font-size:15px;font-weight:700;background:var(--accent);color:#fff;box-shadow:0 4px 14px rgba(0,0,0,.35)}
#mapDlg.menuoff.editing .mp-fab{display:block}
#mapDlg.drw .mp-foot{opacity:0;pointer-events:none}
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

/* ===== Ανανεωμένη εμφάνιση χάρτη ===== */
.mp-head{background:linear-gradient(135deg,#0b1b3a,#123a7a);padding:calc(30px + env(safe-area-inset-top)) 12px 12px;box-shadow:0 6px 18px rgba(2,8,23,.35);position:relative;z-index:5}
.mp-x{background:rgba(255,255,255,.14);border-radius:12px}
.mp-title{font-size:17px;font-weight:800}
.mp-m{border:0;background:rgba(255,255,255,.12);border-radius:99px;color:#e6eeff}
.mp-m.on{background:linear-gradient(135deg,#0284c7,#38bdf8);color:#fff;box-shadow:0 2px 8px rgba(2,132,199,.5)}
.mp-m.add{border:1px dashed rgba(255,255,255,.5);background:transparent}
.mp-z{border:0;background:rgba(255,255,255,.1);color:#dbe7ff}
.mp-z.on{background:linear-gradient(135deg,#1d4ed8,#3b82f6);box-shadow:0 2px 8px rgba(37,99,235,.5)}
.mp-sheet,.mp-foot{border-top:0;border-radius:20px 20px 0 0;box-shadow:0 -8px 24px rgba(2,8,23,.22);position:relative;z-index:4}
.mp-tool{border-radius:12px;border-width:1.5px}
.mp-tool.on{background:linear-gradient(135deg,#1d4ed8,#3b82f6);border-color:transparent}
.spot{border:1.5px solid rgba(255,255,255,.92);box-shadow:0 1px 5px rgba(0,0,0,.45)}
.shp-l,.shp b{background:rgba(11,27,58,.8)}
.mp-ctx{border:0;border-radius:18px;box-shadow:0 14px 40px rgba(2,8,23,.5)}
.mp-ask form{border:0;border-radius:20px;box-shadow:0 24px 60px rgba(2,8,23,.5)}
.mp-fab{background:linear-gradient(135deg,#1d4ed8,#3b82f6)}
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

// Ομορφάδεμα ελεύθερου σχεδίου πάνω σε live χάρτη: μετατροπή lng/lat σε μέτρα, κοινός αλγόριθμος beautify, επιστροφή σε lng/lat
function beautifyGeo(pts){
  if (!pts || pts.length < 4) return null;
  const lat0 = pts.reduce((a,p)=>a+p[1],0)/pts.length, kx = Math.cos(lat0*Math.PI/180)*111320, ky = 110540;
  const M = pts.map(p => [p[0]*kx, p[1]*ky]), xs = M.map(q=>q[0]), ys = M.map(q=>q[1]);
  const x0 = Math.min(...xs), y0 = Math.min(...ys), ext = Math.max(Math.max(...xs)-x0, Math.max(...ys)-y0) || 1, sc = 100/ext;
  const o = beautify(M.map(q => [(q[0]-x0)*sc, (q[1]-y0)*sc]), 100, 100);
  const ll = q => [ +((q[0]/sc + x0)/kx).toFixed(7), +((q[1]/sc + y0)/ky).toFixed(7) ];
  if (o.t==='r') return { t:'g', pts:[[o.x,o.y],[o.x+o.w,o.y],[o.x+o.w,o.y+o.h],[o.x,o.y+o.h]].map(ll) };
  return { t:o.t, pts:o.pts.map(ll) };
}

/* Το Firestore δεν δέχεται πίνακες μέσα σε πίνακες, οπότε οι γραμμές/περιοχές (pts) αποθηκεύονται επίπεδα [x0,y0,x1,y1,…] */
const encShapes = list => list.map(sh => Array.isArray(sh.pts) ? { ...sh, pts: sh.pts.flat() } : sh);
const decShapes = list => (list||[]).map(sh => {
  if (!Array.isArray(sh.pts) || !sh.pts.length || Array.isArray(sh.pts[0])) return sh;      // παλιά μορφή ή τίποτα
  const q = []; for (let i=0;i+1<sh.pts.length;i+=2) q.push([sh.pts[i], sh.pts[i+1]]);
  return { ...sh, pts: q };
});

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
    <div class="mp-vp"><div class="mp-live" hidden></div><div class="mp-stage"><img class="mp-img" alt=""><div class="mp-shapes"></div><div class="mp-spots"></div></div><div class="mp-empty" hidden></div></div>
    <div class="mp-sheet" hidden></div>
    <div class="mp-foot"></div>
    <div class="mp-ctx" hidden></div>
    <button class="mp-fab" data-a="menu">☰ Μενού</button>
    <input type="file" accept="image/*" hidden class="mp-file">`;
  document.body.append(dlg);
  const $ = s => dlg.querySelector(s);
  const liveEl = $('.mp-live'), vp = $('.mp-vp'), stage = $('.mp-stage'), img = $('.mp-img'), spotsEl = $('.mp-spots'), shapesEl = $('.mp-shapes');
  const sheet = $('.mp-sheet'), foot = $('.mp-foot'), titleEl = $('.mp-title'), zonesEl = $('.mp-zones'), mapsEl = $('.mp-maps'), emptyEl = $('.mp-empty'), fileEl = $('.mp-file');

  /* ---------- κατάσταση ---------- */
  let mapImg = null;                          // {image,w,h}
  let remote = { list:[], size:3.2, lsize:2.4, shapes:[] }; // τελευταία κατάσταση από τη βάση
  let doc = { list:[], size:3.2, lsize:2.4, shapes:[] }; // τοπική κατάσταση (αλλάζει στην επεξεργασία)
  const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#a855f7','#ffffff'];
  let tool = 'pan', color = COLORS[4], drawing = null, pend = null;   // tool: pan (κίνηση, προεπιλογή) | pen (ελεύθερο σχέδιο)· pend: σχήμα σε εξέλιξη {k:'rect'|'poly', pts}
  let mode = 'browse', editing = false, pickCb = null, menuOff = false, fmore = false;
  let zoneFilter = null, focusKey = null, selected = null, startLabel = null, lastLabel = '', undo = [];
  let s = 1, tx = 0, ty = 0, baseW = 0, baseH = 0, saveT = null;
  // πολλοί χάρτες
  let holdRemoteUntil = 0;   // μετά το «Τέλος» αγνοούμε για λίγο παλιές απαντήσεις της βάσης
  let maps = [], curId = null, subbedId, allSpots = {}, allShapes = {}, unsubShapes = {}, unsubMap = null, unsubSpots = {}, loaded = false, afterLoad = null;
  try { curId = localStorage.getItem('parking-map-cur') || null; } catch {}
  const curMap = () => maps.find(m => m.id===curId);
  const isLive = () => curMap()?.type==='live';
  let live = null, liveBusy = null, moving = null;
  function ensureLive(){
    if (live) return Promise.resolve(live);
    if (!liveBusy) liveBusy = createLive(liveEl, liveH).then(l => (live = l)).catch(e => { liveBusy = null; toast(e.message || 'Σφάλμα χάρτη'); throw e; });
    return liveBusy;
  }
  function pushLive(){
    if (!live) return;
    const occ = occupancy();
    live.setData({
      spots: doc.list.map((p,i) => ({ x:p.x, y:p.y, l:p.l, cls: occ.has(key(p.l)) ? 'occ' : 'free', dim: !!(zoneFilter && zoneOf(p.l)!==zoneFilter), focus: (focusKey && key(p.l)===focusKey) || selected===i })),
      shapes: doc.shapes, pend, color,
    });
  }
  function fitView(){
    if (!isLive()) return fitAll();
    ensureLive().then(l => { l.invalidate(); if (!l.fit(doc.list, doc.shapes)) l.centerOnceWhenKnown(18); }).catch(()=>{});
  }
  function moveTo(ll){ const i = moving; moving = null; if (doc.list[i]) mutate(()=>{ doc.list[i].x = +ll.lng.toFixed(7); doc.list[i].y = +ll.lat.toFixed(7); }); closeSheet(); }
  const liveH = {
    onSpot: i => spotTap(i),
    onShape: (i, ev) => { const sh = doc.shapes[i]; if (mode==='pick' && !editing){ if (sh?.n) return finishPick(sh.n); return toast('Αυτή η περιοχή δεν έχει όνομα'); } if (editing) shapeMenu(i, ev); },
    onMap: ll => { closeCtx(); if (moving!=null) return moveTo(ll); if (editing && pend) return pendAdd(ll.lng, ll.lat); if (selected!=null) closeSheet(); },
    onLongPress: (o, ev) => { if (!editing || pend || tool==='pen' || moving!=null) return; if (o.shape!=null) return shapeMenu(o.shape, ev); emptyMenu(+o.lng.toFixed(7), +o.lat.toFixed(7), ev); },
    onDraw: on => dlg.classList.toggle('drw', on),
    onFreehand: async raw => {
      const o = beautifyGeo(raw);                                       // ίδιο «ομορφάδεμα» με τον χάρτη εικόνας: ισιώνει, κλείνει, βρίσκει ορθογώνια
      tool = 'pan'; live?.setTool('pan');
      if (!o || (o.t==='p' && o.pts.length<2)) return render();
      const name = await askName(); if (name===null) return render();
      mutate(()=>doc.shapes.push({ ...o, c:color, n:name }));
    },
    onSearch: async () => { const q = ((await ask('Αναζήτηση διεύθυνσης ή τόπου',''))||'').trim(); if (!q) return; const r = await geocode(q); if (!r) return toast('Δεν βρέθηκε'); live?.flyTo(r.lat, r.lng, 18); },
    onGeoWait: () => toast('Αναμονή για τη θέση σου… (δώσε άδεια τοποθεσίας στον browser)'),
    onGeoError: e => toast('Η τοποθεσία δεν είναι διαθέσιμη' + (e && e.code===1 ? ' (δεν δόθηκε άδεια)' : '')),
    onDistance: m => { const d = sheet.querySelector('.mp-dist'); if (d && !d.dataset.route) d.textContent = '📏 ' + fmtDist(m) + ' ευθεία από εσένα'; },
  };

  const key = plateKey;
  const spotKeys = () => new Set(doc.list.map(p => key(p.l)));
  function occupancy(){
    const m = new Map();
    for (const v of getCars()) if (!v.exitAt && !(v.mapId && v.mapId!==curId)){ const k = key(v.location); if (!m.has(k)) m.set(k, []); m.get(k).push(v); }
    return m;
  }

  /* ---------- δεδομένα ---------- */
  const cloneRemote = () => ({ list: remote.list.map(p=>({...p})), size: remote.size, lsize: remote.lsize, shapes: JSON.parse(JSON.stringify(remote.shapes)) });
  function useMap(id){
    subbedId = id; curId = id; try { id ? localStorage.setItem('parking-map-cur', id) : localStorage.removeItem('parking-map-cur'); } catch {}
    unsubMap?.(); unsubMap = null; loaded = !id;
    mapImg = null; remote = { list:[], size:3.2, lsize:2.4, shapes:[] }; doc = cloneRemote(); zoneFilter = null; selected = null;
    if (id) unsubMap = store.subscribeMap(id, ({ img:i, spots, shapes }) => {
      mapImg = i && i.image ? i : null;
      remote = { list: (spots?.list)||[], size: spots?.size||3.2, lsize: spots?.lsize||2.4, shapes: decShapes(shapes?.list) };
      if ((!editing || !dirty) && Date.now() > holdRemoteUntil) doc = cloneRemote();
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
    for (const m of maps) if (!unsubShapes[m.id]) unsubShapes[m.id] = store.subscribeShapes(m.id, l => { allShapes[m.id] = decShapes(l); onChange?.(); });
    for (const id of Object.keys(unsubSpots)) if (!maps.some(m => m.id===id)){ unsubSpots[id](); delete unsubSpots[id]; delete allSpots[id]; }
    for (const id of Object.keys(unsubShapes)) if (!maps.some(m => m.id===id)){ unsubShapes[id](); delete unsubShapes[id]; delete allShapes[id]; }
    if (dlg.open) render();
    onChange?.();
  });
  // Παίρνει πρώτα φωτογραφία της κατάστασης και μετά στέλνει: αλλιώς μια απάντηση της βάσης ανάμεσα στις δύο αποθηκεύσεις μπορούσε να αντικαταστήσει τα σχέδια
  const saveAll = () => { if (!curId) return Promise.resolve(); const id = curId, list = doc.list, size = doc.size, lsize = doc.lsize, shapes = doc.shapes;
    return Promise.all([ store.saveSpots(id, { list, size, lsize }), store.saveShapes(id, { list:encShapes(shapes) }) ]); };
  let dirty = false;
  function scheduleSave(){
    clearTimeout(saveT); dirty = true;
    saveT = setTimeout(()=>{ saveT = null; holdRemoteUntil = Date.now() + 2500; saveAll().then(()=>{ if (!saveT) dirty = false; }).catch(e=>toast('Σφάλμα αποθήκευσης: '+e.message)); }, 500);
  }
  const snap = () => JSON.stringify({ list:doc.list, shapes:doc.shapes });
  function mutate(fn){ undo.push(snap()); if (undo.length>50) undo.shift(); fn(); scheduleSave(); render(); }

  /* ---------- προβολή / zoom ---------- */
  const apply = () => {
    stage.style.transform = `translate(${tx}px,${ty}px) scale(${s})`;
    // ονόματα: ελαφριά αντιστάθμιση του zoom (μακριά → σχετικά μεγαλύτερα) και ελάχιστο μέγεθος 14px στην οθόνη ώστε να διαβάζονται πάντα
    const base = baseW*(doc.lsize||2.4)/100, f = Math.max(.3, Math.min(3, Math.pow(s, -.6)));
    stage.style.setProperty('--lbe', Math.max(base*f, 14/s).toFixed(2)+'px');
  };
  function liveSizes(){ if (isLive() && live) live.setSizes(+(7+(doc.size||3.2)*1.8).toFixed(1), +(8+(doc.lsize||2.4)*2.2).toFixed(1)); }
  function layout(){
    if (!mapImg) return;
    const vw = vp.clientWidth, vh = vp.clientHeight, asp = mapImg.w/mapImg.h;
    baseW = Math.min(vw, vh*asp); baseH = baseW/asp;
    stage.style.width = baseW+'px'; stage.style.height = baseH+'px';
    stage.style.setProperty('--sp', (baseW*doc.size/100)+'px');
    stage.style.setProperty('--lb', (baseW*(doc.lsize||2.4)/100)+'px');   // μέγεθος ονομάτων: ανάλογο του πλάτους του χάρτη
    apply();
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
  vp.addEventListener('wheel', e => { if (isLive()) return; e.preventDefault(); const p = rel(e.clientX,e.clientY); zoomAt(p.x,p.y,Math.exp(-e.deltaY*0.0015)); }, { passive:false });

  /* ---------- χειρισμός δαχτύλων / ποντικιού ---------- */
  const ptrs = new Map(); let moved = false, dragSpot = null, pinch = null;
  function pointPct(cx, cy){ const r = stage.getBoundingClientRect(); return { x:(cx-r.left)/r.width*100, y:(cy-r.top)/r.height*100 }; }
  const clampPct = v => Math.max(0, Math.min(100, v));
  const isDrawTool = () => editing && tool==='pen';
  const svgEl = () => shapesEl.querySelector('svg');

  /* σχεδίαση ορθογωνίων και ελεύθερου σχεδίου */
  function drawStart(e){
    const q = pointPct(e.clientX, e.clientY);
    if (q.x<0 || q.x>100 || q.y<0 || q.y>100) return;
    dlg.classList.add('drw');
    drawing = { type:tool, x0:clampPct(q.x), y0:clampPct(q.y), x1:null, y1:null, pts:[[+clampPct(q.x).toFixed(2), +clampPct(q.y).toFixed(2)]], el:null };
  }
  function drawMove(e){
    const q = pointPct(e.clientX, e.clientY), x = clampPct(q.x), y = clampPct(q.y);
    if (drawing.type==='rect'){
      if (!drawing.el){
        drawing.el = document.createElement('div'); drawing.el.className = 'shp prev';
        drawing.el.style.borderColor = color; drawing.el.style.background = color+"38"; shapesEl.append(drawing.el);
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
  // Παράθυρο ονόματος μέσα στην εφαρμογή (το prompt() του browser δεν ανοίγει πάντα το πληκτρολόγιο στο κινητό)
  function ask(title, def=''){
    return new Promise(res => {
      const o = document.createElement('div'); o.className = 'mp-ask';
      o.innerHTML = '<form><div class="t"></div><input type="text" autocomplete="off" autocapitalize="sentences" enterkeyhint="done"><div class="r"><button type="button" class="btn" data-x="c">Άκυρο</button><button class="btn primary">OK</button></div></form>';
      o.querySelector('.t').textContent = title;
      const inp = o.querySelector('input'); inp.value = def;
      dlg.append(o); inp.focus(); inp.select();
      const done = v => { o.remove(); res(v); };
      o.querySelector('form').onsubmit = e => { e.preventDefault(); done(inp.value); };
      o.querySelector('[data-x=c]').onclick = () => done(null);
    });
  }
  async function askName(){
    const def = 'Ζώνη '+(doc.shapes.length+1);
    const n = await ask('Όνομα περιοχής (π.χ. Ζώνη Α · VIP · Είσοδος)', def);
    return n===null ? null : (n.trim() || def);
  }
  async function drawEnd(){
    const d = drawing; drawing = null; d.el?.remove(); tool = 'pan';
    if (d.type==='rect'){
      if (d.x1==null) return;
      const w = Math.abs(d.x1-d.x0), h = Math.abs(d.y1-d.y0);
      if (w<0.8 || h<0.8) return;
      const name = await askName(); if (name===null) return;
      mutate(()=>doc.shapes.push({ t:'r', x:+Math.min(d.x0,d.x1).toFixed(2), y:+Math.min(d.y0,d.y1).toFixed(2), w:+w.toFixed(2), h:+h.toFixed(2), c:color, n:name }));
    } else {
      if (d.pts.length<2) return;
      const o = beautify(d.pts, mapImg?.w || 1000, mapImg?.h || 1000);
      if (o.t==='p' && o.pts.length<2) return;
      const name = await askName(); if (name===null) return;
      mutate(()=>doc.shapes.push({ ...o, c:color, n:name }));
    }
  }

  // Παρατεταμένο πάτημα (~0,45 δευτ.) σε σημείο του χάρτη → γρήγορες επιλογές (θέση, σχέδιο ή επεξεργασία σχήματος)
  let lpTimer = null, lp = false;
  const clearLp = () => { clearTimeout(lpTimer); lpTimer = null; };
  vp.addEventListener('pointerdown', e => {
    if (!cmenu.hidden) closeCtx();
    if (isLive()) return;
    clearLp(); lp = false;
    if (e.target.closest('.mp-empty')) return;
    vp.setPointerCapture(e.pointerId);
    ptrs.set(e.pointerId, { x:e.clientX, y:e.clientY, sx:e.clientX, sy:e.clientY, target:e.target });
    if (ptrs.size===1){
      moved = false; drawing = null; dragSpot = null;
      if (isDrawTool()) drawStart(e);
      else if (editing && !pend && !e.target.closest?.('.spot')){
        const cx0 = e.clientX, cy0 = e.clientY, tg = e.target;
        lpTimer = setTimeout(() => {
          lpTimer = null; if (moved || ptrs.size!==1) return;
          lp = true; navigator.vibrate?.(30);
          const shEl = tg.closest?.('[data-si]'), q = pointPct(cx0, cy0), fe = { clientX:cx0, clientY:cy0 };
          if (shEl) shapeMenu(+shEl.dataset.si, fe);
          else if (q.x>=0 && q.x<=100 && q.y>=0 && q.y<=100) emptyMenu(+q.x.toFixed(2), +q.y.toFixed(2), fe);
        }, 450);
      }
      else { const sp = e.target.closest?.('.spot');
        if (editing && sp && !pend){ const i = +sp.dataset.i; lpTimer = setTimeout(() => { lpTimer = null; if (!moved && ptrs.size===1){ dragSpot = i; navigator.vibrate?.(30); toast('Σύρε για να μετακινήσεις τη θέση'); } }, 450); } }
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
    moved = true; clearLp();
    if (drawing){ drawMove(e); return; }
    if (dragSpot!=null){
      const q = pointPct(e.clientX, e.clientY), sp = doc.list[dragSpot];
      if (sp){ sp.x = +Math.max(0,Math.min(100,q.x)).toFixed(2); sp.y = +Math.max(0,Math.min(100,q.y)).toFixed(2);
        const el = spotsEl.children[dragSpot]; if (el){ el.style.left = sp.x+'%'; el.style.top = sp.y+'%'; } }
    } else { tx += dx; ty += dy; apply(); }
  });
  function endPtr(e, cancelled){
    const p = ptrs.get(e.pointerId); ptrs.delete(e.pointerId); if (!p) return;
    clearLp();
    if (ptrs.size>0){ moved = true; pinch = null; return; }
    pinch = null;
    dlg.classList.remove('drw');
    if (cancelled) { dragSpot = null; if (drawing){ drawing.el?.remove(); drawing = null; } return; }
    dlg.classList.remove('drw');
    if (drawing){ if (moved) drawEnd(); else drawing = null; dragSpot = null; return; }
    if (lp){ lp = false; dragSpot = null; return; }
    if (!moved) tap(p.target, e);
    else if (dragSpot!=null){ undo.push(null); scheduleSave(); }      // μετακίνηση θέσης
    dragSpot = null;
  }
  vp.addEventListener('pointerup', e => endPtr(e,false));
  vp.addEventListener('pointercancel', e => endPtr(e,true));

  function tap(target, e){
    const sp = target.closest?.('.spot');
    if (sp) return spotTap(+sp.dataset.i);
    if (mode==='pick' && !editing){            // επιλογή περιοχής που έχει σχεδιαστεί (π.χ. «Ζώνη Α»)
      const sh = target.closest?.('[data-si]');
      if (sh){ const s = doc.shapes[+sh.dataset.si]; if (s?.n) return finishPick(s.n); return toast('Αυτή η περιοχή δεν έχει όνομα — δώσε της όνομα από την επεξεργασία χάρτη'); }
    }
    if (editing){
      if (pend){ pendTap(e); return; }
      const shEl = target.closest?.('[data-si]');
      if (shEl) return shapeMenu(+shEl.dataset.si, e);
      const q = pointPct(e.clientX, e.clientY);
      return closeCtx();
    }
    closeSheet();
  }


  /* ---------- μενού πάνω στον χάρτη (όπως στο ATAK): πάτημα σε σημείο → επιλογές ---------- */
  const cmenu = dlg.querySelector('.mp-ctx');
  function closeCtx(){ cmenu.hidden = true; cmenu.innerHTML = ''; }
  function showCtx(html, e){
    cmenu.innerHTML = html; cmenu.hidden = false;
    const W = cmenu.offsetWidth, H = cmenu.offsetHeight, vw = innerWidth, vh = innerHeight;
    cmenu.style.left = Math.max(8, Math.min(vw-W-8, e.clientX-W/2))+'px';
    cmenu.style.top = Math.max(8, Math.min(vh-H-8, e.clientY+14 > vh-H-8 ? e.clientY-H-14 : e.clientY+14))+'px';
  }
  function emptyMenu(x, y, e){
    cmenu.dataset.x = x; cmenu.dataset.y = y;
    showCtx(`<button data-a="cx" data-k="spot">📍 Θέση εδώ</button><button data-a="cx" data-k="rect">▭ Ορθογώνιο</button><button data-a="cx" data-k="poly">⬠ Πολύγωνο / γραμμή</button><button data-a="cx" data-k="pen">✏️ Ελεύθερο σχέδιο</button>`, e);
  }
  function shapeMenu(i, e){
    const sh = doc.shapes[i]; if (!sh) return;
    cmenu.dataset.i = i;
    showCtx(`<div class="cx-t">${esc(sh.n || 'Χωρίς όνομα')}</div><button data-a="cx" data-k="name">✎ Όνομα</button><div class="mp-tools cx-sw">${COLORS.map(c=>`<button class="mp-sw ${c===sh.c?'on':''}" data-a="cxcol" data-c="${c}" style="background:${c}" aria-label="χρώμα"></button>`).join('')}</div><button data-a="cx" data-k="del">🗑 Διαγραφή</button>`, e);
  }
  function startPend(k, x, y){
    closeCtx(); pend = { k, pts:[[x,y]] };
    toast(k==='rect' ? 'Πάτα την απέναντι γωνία' : 'Πάτα τις επόμενες κορυφές'); render();
  }
  function pendTap(e){ const q = pointPct(e.clientX, e.clientY); return pendAdd(+clampPct(q.x).toFixed(2), +clampPct(q.y).toFixed(2)); }
  async function pendAdd(x, y){
    if (pend.k==='rect'){
      const [x0,y0] = pend.pts[0], w = Math.abs(x-x0), h = Math.abs(y-y0), lv = isLive();
      if (lv ? (w<1e-7 || h<1e-7) : (w<0.8 || h<0.8)) return toast('Διάλεξε πιο μακρινό σημείο');
      const name = await askName(); if (name===null) return;
      pend = null;
      if (lv) mutate(()=>doc.shapes.push({ t:'g', pts:[[x0,y0],[x,y0],[x,y],[x0,y]], c:color, n:name }));
      else mutate(()=>doc.shapes.push({ t:'r', x:+Math.min(x0,x).toFixed(2), y:+Math.min(y0,y).toFixed(2), w:+w.toFixed(2), h:+h.toFixed(2), c:color, n:name }));
      return;
    }
    pend.pts.push([x,y]); render();
  }
  async function finishPoly(closed){
    if (!pend || pend.pts.length < (closed ? 3 : 2)) return toast(closed ? 'Χρειάζονται τουλάχιστον 3 κορυφές' : 'Χρειάζονται τουλάχιστον 2 σημεία');
    const name = await askName(); if (name===null) return;
    const pts = pend.pts; pend = null;
    mutate(()=>doc.shapes.push({ t:closed?'g':'p', pts, c:color, n:name }));
  }

  /* ---------- επεξεργασία ---------- */
  async function addSpot(x,y){
    let label = startLabel;
    if (!label){
      label = lastLabel ? nextLabel(lastLabel) : ((await ask('Όνομα πρώτης θέσης (π.χ. A1)','A1'))||'').trim();
      if (!label) return;
    }
    const have = spotKeys(); while (have.has(key(label))) label = nextLabel(label);
    startLabel = null; lastLabel = label;
    mutate(()=>doc.list.push({ l:label, x, y }));
    toast('Θέση '+label);
  }
  function spotTap(i){
    const sp = doc.list[i]; if (!sp) return;
    selected = i; live?.setTarget(isLive() ? { lat:sp.y, lng:sp.x } : null);
    if (mode==='pick' && !editing){
      const cars = occupancy().get(key(sp.l));
      if (!cars?.length) return finishPick(sp.l);
    }
    renderSheet(); render();
  }
  function finishPick(label){ const cb = pickCb, id = curId; close(); cb?.(label, id); }
  function closeSheet(){ selected = null; moving = null; sheet.hidden = true; live?.setTarget(null); live?.setRoute(null); render(); }

  function renderSheet(){
    const sp = doc.list[selected];
    if (!sp){ sheet.hidden = true; return; }
    sheet.hidden = false;
    const lvBtns = () => isLive() ? `<div class="mp-row" style="margin-top:8px"><button class="btn primary" data-a="route">🧭 Διαδρομή</button><button class="btn" data-a="gmaps">↗ Άνοιγμα στους Χάρτες</button>${editing ? '<button class="btn" data-a="movespot">✋ Μετακίνηση</button>' : ''}</div><div class="m mp-dist"></div>` : '';
    const spEdit = () => lvBtns() + (editing ? `<div class="mp-row" style="margin-top:8px"><button class="btn" data-a="rename">✎ Όνομα θέσης</button><button class="btn danger" data-a="del">🗑 Διαγραφή θέσης</button></div>` : '');
    const cars = occupancy().get(key(sp.l)) || [];
    if (!cars.length){
      sheet.innerHTML = `<b style="font-size:18px">Θέση ${esc(sp.l)}</b> <span class="m">· ελεύθερη</span>
        <div class="mp-row"><button class="btn primary" data-a="newhere">+ Νέο όχημα εδώ</button><button class="btn" data-a="closesheet">Κλείσιμο</button></div>${spEdit()}`;
      return;
    }
    sheet.innerHTML = cars.map(v => `<div style="margin-bottom:10px"><span class="plate">${esc(v.plate)}</span>
      <div class="m">📍 ${esc(v.location)} · ⏱ ${fmtT(v.entryAt)} (${fmtDur(v.entryAt,Date.now())})${v.keyNo?` · 🔑 ${esc(v.keyNo)}`:''}${v.phone?` · <a href="tel:${esc(v.phone)}">📞 ${esc(v.phone)}</a>`:''}</div>
      <div class="mp-row"><button class="btn go" data-a="exit" data-id="${v.id}">Έφυγε ✓</button>${mode==='pick'?`<button class="btn" data-a="usepick">Χρήση της θέσης παρ' όλα αυτά</button>`:''}<button class="btn" data-a="closesheet">Κλείσιμο</button></div></div>`).join('') + spEdit();
  }

  dlg.addEventListener('click', async e => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a;
    if (a==='close') return close();
    if (a==='closesheet') return closeSheet();
    if (a==='edit'){ editing = true; mode = 'browse'; closeSheet(); renderAll(); return; }
    if (a==='done'){
      startLabel = null; undo = []; clearTimeout(saveT);
      const final = JSON.parse(JSON.stringify({ list:doc.list, size:doc.size, lsize:doc.lsize, shapes:doc.shapes }));
      holdRemoteUntil = Date.now() + 2500;          // κράτα την τοπική εικόνα όσο φτάνουν οι απαντήσεις της βάσης
      try { await saveAll(); toast('Ο χάρτης αποθηκεύτηκε'); }
      catch(err){ toast('Σφάλμα αποθήκευσης: '+err.message); }
      remote = final; doc = cloneRemote(); editing = false; closeSheet(); renderAll(); return;
    }
    if (a==='route'){
      const sp = doc.list[selected]; if (!sp || !live) return;
      const me = live.getMe(); if (!me){ live.centerOnMe(); return toast('Δώσε άδεια τοποθεσίας και ξαναπάτα «Διαδρομή»'); }
      toast('Υπολογισμός διαδρομής…');
      const r = await walkRoute(me, { lat:sp.y, lng:sp.x });
      const d = sheet.querySelector('.mp-dist');
      if (!r){ if (d) d.textContent = 'Δεν βρέθηκε διαδρομή περπατήματος — ακολούθησε την ευθεία γραμμή.'; return; }
      live.setRoute(r.coords); if (d){ d.dataset.route = '1'; d.textContent = `🚶 ${fmtDist(r.dist)} · περίπου ${Math.max(1, Math.round(r.dur/60))} λεπτά`; }
      return;
    }
    if (a==='gmaps'){ const sp = doc.list[selected]; if (sp) window.open(`https://www.google.com/maps/dir/?api=1&destination=${sp.y},${sp.x}&travelmode=walking`, '_blank'); return; }
    if (a==='movespot'){ moving = selected; sheet.hidden = true; toast('Πάτα στον χάρτη το νέο σημείο της θέσης'); return; }
    if (a==='fmore'){ fmore = !fmore; renderFoot(); return; }
    if (a==='cx'){
      const k = b.dataset.k, x = +cmenu.dataset.x, y = +cmenu.dataset.y, i = +cmenu.dataset.i;
      if (k==='spot'){ closeCtx(); return addSpot(x, y); }
      if (k==='rect' || k==='poly') return startPend(k, x, y);
      if (k==='pen'){ closeCtx(); tool = 'pen'; toast('Σύρε για να ζωγραφίσεις'); render(); return; }
      if (k==='name'){ closeCtx(); const n = await ask('Όνομα περιοχής (π.χ. Ζώνη Α · VIP · Είσοδος)', doc.shapes[i]?.n || ''); if (n!==null && n.trim()) mutate(()=>{ doc.shapes[i].n = n.trim(); }); return; }
      if (k==='del'){ closeCtx(); mutate(()=>doc.shapes.splice(i,1)); return; }
    }
    if (a==='cxcol'){ const i = +cmenu.dataset.i; color = b.dataset.c; closeCtx(); mutate(()=>{ doc.shapes[i].c = b.dataset.c; }); return; }
    if (a==='pclose') return finishPoly(true);
    if (a==='pline') return finishPoly(false);
    if (a==='pundo'){ if (pend && pend.pts.length>1){ pend.pts.pop(); render(); } else { pend = null; render(); } return; }
    if (a==='pcancel'){ pend = null; tool = 'pan'; render(); return; }
    if (a==='menu'){ menuOff = false; render(); return; }
    if (a==='tool'){ tool = b.dataset.t; startLabel = null; closeSheet(); menuOff = true; render(); return; }
    if (a==='color'){ color = b.dataset.c; renderFoot(); menuOff = true; render(); return; }
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
        await Promise.all([ store.saveImage(curId, o), store.saveSpots(curId, { list, size:doc.size, lsize:doc.lsize }), store.saveShapes(curId, { list:encShapes(shapes) }) ]);
        closeSheet(); toast('Η εικόνα περικόπηκε'); setTimeout(()=>{ renderAll(); fitAll(); }, 150);
      } catch(err){ toast('Σφάλμα περικοπής: '+err.message); }
      return;
    }
    if (a==='selmap'){ if (b.dataset.id===curId) return; closeSheet(); useMap(b.dataset.id); afterLoad = fitView; render(); return; }
    if (a==='newmap'){
      const lv = b.dataset.t!=='img';
      const name = ((await ask(lv ? 'Όνομα νέου live χάρτη (π.χ. Πάρκινγκ Α)' : 'Όνομα νέου χάρτη με εικόνα (π.χ. Υπόγειο)', (lv ? 'Live ' : 'Χάρτης ')+(maps.length+1)))||'').trim(); if (!name) return;
      const id = 'm'+Date.now().toString(36); maps = [...maps, lv ? { id, name, type:'live' } : { id, name }];
      try { await store.setMaps(maps); } catch(err){ maps = maps.filter(m=>m.id!==id); return toast('Σφάλμα: '+err.message); }
      closeSheet(); useMap(id); afterLoad = fitView; toast('Ο χάρτης «'+name+'» δημιουργήθηκε'+(lv ? ' — κράτα πατημένο σε σημείο για να βάλεις θέσεις' : ' — ανέβασε εικόνα')); render(); return;
    }
    if (a==='renamemap'){
      const m = curMap(); if (!m) return; const name = ((await ask('Νέο όνομα χάρτη', m.name))||'').trim(); if (!name) return;
      maps = maps.map(x => x.id===m.id ? { ...x, name } : x); try { await store.setMaps(maps); } catch(err){ return toast('Σφάλμα: '+err.message); } render(); return;
    }
    if (a==='clearmap'){
      const m = curMap(); if (!m) return;
      if (!confirm('Να διαγραφεί ο χάρτης «'+m.name+'» (φωτογραφία, θέσεις και σχέδια);\nΔεν αναιρείται και φεύγει για όλους τους υπαλλήλους.\nΤα οχήματα δεν επηρεάζονται.')) return;
      clearTimeout(saveT); const id = m.id;
      try { await store.deleteMapData(id); maps = maps.filter(x => x.id!==id); await store.setMaps(maps); } catch(err){ return toast('Σφάλμα διαγραφής: '+err.message); }
      editing = mode==='browse'; startLabel = null; undo = []; useMap(maps[0]?.id || null); afterLoad = fitView;
      closeSheet(); renderAll(); onChange?.(); toast('Ο χάρτης διαγράφηκε'); return;
    }
    if (a==='zone'){ zoneFilter = b.dataset.z || null; fitZone(); render(); return; }
    if (a==='newzone'){ const l = ((await ask('Πρώτη θέση της νέας ζώνης/σειράς (π.χ. B1)', lastLabel?nextLabel(lastLabel.replace(/\d+$/,'0')):'B1'))||'').trim(); if (l){ startLabel = l; toast('Πάτα στον χάρτη για να μπει η '+l); renderFoot(); } return; }
    if (a==='undo'){ while (undo.length && undo[undo.length-1]===null) undo.pop(); const prev = undo.pop(); if (prev){ const o = JSON.parse(prev); doc.list = o.list; doc.shapes = o.shapes; scheduleSave(); closeSheet(); } return; }
    if (a==='rename'){ const v = ((await ask('Όνομα θέσης', doc.list[selected]?.l || ''))||'').trim(); if (!v) return; const dup = doc.list.some((p,i)=>i!==selected && key(p.l)===key(v)); if (dup) return toast('Υπάρχει ήδη θέση '+v); mutate(()=>{ doc.list[selected].l = v; }); lastLabel = v; closeSheet(); return; }
    if (a==='del'){ mutate(()=>{ doc.list.splice(selected,1); }); closeSheet(); return; }
    if (a==='newhere'){ const l = doc.list[selected].l, id = curId; close(); openNewCarAt(l, id); return; }
    if (a==='exit'){ await exitCar(b.dataset.id); renderSheet(); return; }
    if (a==='usepick'){ finishPick(doc.list[selected].l); return; }
  });
  dlg.addEventListener('input', e => {
    if (e.target.matches('.mp-size')){ doc.size = +e.target.value; layout(); liveSizes(); scheduleSave(); }
    if (e.target.matches('.mp-lsize')){ doc.lsize = +e.target.value; layout(); liveSizes(); scheduleSave(); }
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
      if (isLive()){ live?.invalidate(); return; }
      clearTimeout(rt); rt = setTimeout(() => { if (s===1 || first) fitAll(); else { layout(); apply(); } }, 60);
    }).observe(vp);
  }
  dlg.addEventListener('close', () => { editing = false; ptrs.clear(); live?.stop(); });

  function fitZone(){
    if (isLive()){ const ps = doc.list.filter(p => !zoneFilter || zoneOf(p.l)===zoneFilter); ensureLive().then(l => l.fit(ps.length ? ps : doc.list, zoneFilter ? [] : doc.shapes)); return; }
    const pts = doc.list.filter(p => !zoneFilter || zoneOf(p.l)===zoneFilter);
    if (!pts.length || !mapImg) return fitAll();
    if (!zoneFilter) return fitAll();
    fitBox(Math.min(...pts.map(p=>p.x)), Math.min(...pts.map(p=>p.y)), Math.max(...pts.map(p=>p.x)), Math.max(...pts.map(p=>p.y)), 6);
  }

  /* ---------- απόδοση ---------- */
  function renderFoot(){
    if (editing){
      if (pend || tool==='pen'){
        const msg = tool==='pen' ? 'Σύρε στον χάρτη για να ζωγραφίσεις (η γραμμή ισιώνει μόνη της). Με δύο δάχτυλα κάνεις zoom.'
          : pend.k==='rect' ? 'Πάτα την απέναντι γωνία του ορθογωνίου.'
          : `Πάτα τις κορυφές (${pend.pts.length}). Κλείσε την περιοχή ή τελείωσε ως γραμμή.`;
        foot.innerHTML = `<div class="hint">${msg}</div>${pend?.k==='poly' ? '<button class="btn primary" data-a="pclose">⬠ Κλείσιμο περιοχής</button><button class="btn" data-a="pline">〰 Γραμμή</button>' : ''}${pend ? '<button class="btn" data-a="pundo">↶ Πίσω</button>' : ''}<button class="btn" data-a="pcancel">✕ Ακύρωση</button>`;
        return;
      }
      foot.innerHTML = `<div class="hint">Πράσινο: ελεύθερη · Κόκκινο: κατειλημμένη · Κράτα πατημένο σε σημείο: θέση ή σχέδιο · Κράτα πατημένη μια θέση για να τη μετακινήσεις</div>
        <button class="btn" data-a="undo">↶ Αναίρεση</button><button class="btn" data-a="fmore">⚙ ${fmore ? 'Λιγότερα' : 'Ρυθμίσεις'}</button>
        ${fmore ? `<div class="mp-more"><button class="btn" data-a="newzone">＋ Νέα ζώνη/σειρά</button>${isLive() ? '' : '<button class="btn" data-a="img">🖼 Εικόνα</button><button class="btn" data-a="geoimg">🌍 Από χάρτη</button><button class="btn" data-a="cropimg">✂️ Περικοπή</button>'}<button class="btn" data-a="renamemap">✏️ Όνομα χάρτη</button><button class="btn" data-a="clearmap">🗑 Διαγραφή χάρτη</button>
        <label>Μέγεθος θέσεων <input class="mp-size" type="range" min="1" max="8" step="0.1" value="${doc.size}"></label>
        ${`<label>Μέγεθος ονομάτων <input class="mp-lsize" type="range" min="0.8" max="8" step="0.1" value="${doc.lsize||2.4}"></label>`}</div>` : ''}`;
    } else if (mode==='pick'){
      foot.innerHTML = `<div class="hint">Πάτα μια ελεύθερη (πράσινη) θέση ή μια περιοχή που έχεις σχεδιάσει για να την επιλέξεις.</div>`;
    } else {
      foot.innerHTML = `<div class="hint">Πράσινο: ελεύθερη · Κόκκινο: κατειλημμένη. Πάτα μια θέση για λεπτομέρειες.</div>`;
    }
  }
  const safeColor = c => /^#[0-9a-f]{6}$/i.test(c) ? c : '#3b82f6';
  function renderShapes(){
    const rects = doc.shapes.map((sh,i) => sh.t!=='r' ? '' :
      `<div class="shp" data-si="${i}" style="left:${+sh.x}%;top:${+sh.y}%;width:${+sh.w}%;height:${+sh.h}%;border-color:${safeColor(sh.c)};background:${safeColor(sh.c)}38">${sh.n?`<b>${esc(sh.n)}</b>`:''}</div>`).join('');
    let labels = '';
    const lines = doc.shapes.map((sh,i) => {
      if ((sh.t!=='p' && sh.t!=='g') || !Array.isArray(sh.pts) || !sh.pts.length) return '';
      const pts = sh.pts.map(p=>`${+p[0]},${+p[1]}`).join(' '), c = safeColor(sh.c);
      if (sh.n){
        const xs = sh.pts.map(p=>+p[0]), ys = sh.pts.map(p=>+p[1]);
        const m = sh.t==='g' ? [(Math.min(...xs)+Math.max(...xs))/2, (Math.min(...ys)+Math.max(...ys))/2] : sh.pts[Math.floor(sh.pts.length/2)];
        labels += `<div class="shp-l" data-si="${i}" style="left:${+m[0]}%;top:${+m[1]}%">${esc(sh.n)}</div>`;
      }
      return sh.t==='g'
        ? `<polygon points="${pts}" stroke="${c}" fill="${c}" fill-opacity=".22"/><polygon class="hit" data-si="${i}" points="${pts}"/>`
        : `<polyline points="${pts}" stroke="${c}"/><polyline class="hit" data-si="${i}" points="${pts}"/>`;
    }).join('');
    let pv = '', dots = '';
    if (pend){
      if (pend.k==='poly' && pend.pts.length>1) pv = `<polyline points="${pend.pts.map(p=>p.join(',')).join(' ')}" stroke="${color}" stroke-dasharray="6 4"/>`;
      dots = pend.pts.map(p=>`<div class="vtx" style="left:${p[0]}%;top:${p[1]}%;border-color:${color}"></div>`).join('');
    }
    shapesEl.innerHTML = rects + `<svg class="mp-svg" viewBox="0 0 100 100" preserveAspectRatio="none">${lines}${pv}</svg>` + labels + dots;
  }
  function render(){
    if (!editing){ pend = null; tool = 'pan'; closeCtx(); }
    dlg.classList.toggle('erase', editing && tool==='pan' && !pend);
    dlg.classList.toggle('edt', editing && tool==='pan' && !pend);
    dlg.classList.toggle('editing', editing); if (!editing) menuOff = false; dlg.classList.toggle('menuoff', menuOff);
    dlg.classList.toggle('pickz', mode==='pick' && !editing);
    const occ = occupancy(), total = doc.list.length;
    let used = 0; for (const p of doc.list) if (occ.has(key(p.l))) used++;
    titleEl.innerHTML = `${esc(curMap()?.name || 'Χάρτης παρκινγκ')}<small>${total ? `${total-used} ελεύθερες από ${total}` : 'δεν έχουν οριστεί θέσεις'}</small>`;
    mapsEl.hidden = false;
    mapsEl.innerHTML = maps.map(m => `<button class="mp-m ${m.id===curId?'on':''}" data-a="selmap" data-id="${esc(m.id)}">${esc(m.name)}</button>`).join('') + (mode==='pick' ? '' : '<button class="mp-m add" data-a="newmap" data-t="live">＋ Live χάρτης</button><button class="mp-m add" data-a="newmap" data-t="img">＋ Εικόνα</button>');
    const zs = [...new Set(doc.list.map(p=>zoneOf(p.l)))].sort();
    zonesEl.innerHTML = zs.length>1 ? [`<button class="mp-z ${!zoneFilter?'on':''}" data-a="zone" data-z="">Όλες</button>`, ...zs.map(z=>`<button class="mp-z ${zoneFilter===z?'on':''}" data-a="zone" data-z="${esc(z)}">${esc(z)}</button>`)].join('') : '';
    liveEl.hidden = !isLive(); if (!isLive()) live?.stop();
    if (isLive()){
      stage.style.display = 'none'; emptyEl.hidden = true;
      ensureLive().then(l => { l.setTool(tool); l.setSizes(+(7+(doc.size||3.2)*1.8).toFixed(1), +(8+(doc.lsize||2.4)*2.2).toFixed(1)); pushLive(); l.start(); }).catch(()=>{});
    } else if (!mapImg){
      img.removeAttribute('src'); stage.style.display = 'none'; emptyEl.hidden = false;
      emptyEl.innerHTML = !curId
        ? `<div style="font-size:42px">🗺️</div><div>Δεν υπάρχει χάρτης ακόμα.<br>Φτιάξε έναν live δορυφορικό χάρτη ή έναν χάρτη με φωτογραφία/σχέδιο.</div><div class="mp-row"><button class="btn primary" data-a="newmap" data-t="live">＋ Live χάρτης (δορυφόρος)</button><button class="btn" data-a="newmap" data-t="img">＋ Χάρτης με εικόνα</button></div>`
        : !loaded ? `<div>Φόρτωση…</div>`
        : `<div style="font-size:42px">🗺️</div><div>Ο χάρτης «${esc(curMap()?.name||'')}» δεν έχει εικόνα ακόμα.<br>Ανέβασε μια φωτογραφία ή σχέδιο του παρκινγκ (π.χ. από ψηλά ή κάτοψη) και βάλε πάνω της τις θέσεις.</div><div class="mp-row"><button class="btn primary" data-a="geoimg">🌍 Από χάρτη</button><button class="btn" data-a="pickimg">📷 Ανέβασμα εικόνας</button></div>`;
    } else {
      emptyEl.hidden = true; stage.style.display = '';
      if (img.getAttribute('src') !== mapImg.image) img.src = mapImg.image;
      layout(); renderShapes();
      spotsEl.innerHTML = doc.list.map((p,i) => {
        const o = occ.has(key(p.l)), z = zoneOf(p.l);
        const cls = o ? 'occ' : 'free';
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
      const k = key(label), has = id => (allSpots[id]||[]).some(p => key(p.l)===k) || (allShapes[id]||[]).some(s => s.n && key(s.n)===k);
      if (curId && has(curId)) return curId;
      const m = maps.find(m => has(m.id)); if (m) return m.id;
    }
    return curId;
  }
  function open(o = {}){
    mode = o.mode || 'browse'; pickCb = o.onPick || null; editing = (o.mode||'browse')==='browse'; selected = null; zoneFilter = null; startLabel = null; undo = []; tool = 'pan'; pend = null; drawing = null;
    focusKey = o.focus ? key(o.focus) : null;
    const target = o.focus ? findMapFor(o.focus, o.mapId) : (o.mapId && maps.some(m => m.id===o.mapId) ? o.mapId : curId);
    const switched = target && target!==curId;
    if (switched) useMap(target);
    doc = cloneRemote();
    sheet.hidden = true; if (!dlg.open) dlg.showModal();
    render();
    const settle = async () => {
      if (isLive()){
        const l = await ensureLive().catch(()=>null); if (!l) return; l.invalidate(); render(); l.start();
        if (focusKey){
          const i = doc.list.findIndex(p => key(p.l)===focusKey);
          if (i>=0){ const p = doc.list[i]; l.flyTo(p.y, p.x, 20); selected = i; l.setTarget({ lat:p.y, lng:p.x }); renderSheet(); render(); }
          else { const sh = doc.shapes.find(s => s.n && key(s.n)===focusKey); if (sh){ l.fit([], [sh]); toast('📍 '+sh.n); } else toast('Η θέση δεν υπάρχει στον χάρτη'); }
        } else if (!l.fit(doc.list, doc.shapes)) l.centerOnceWhenKnown(18);
        return;
      }
      fitAll();
      if (focusKey){
        const i = doc.list.findIndex(p => key(p.l)===focusKey);
        if (i>=0){ const p = doc.list[i]; fitBox(p.x,p.y,p.x,p.y,3.5); selected = i; renderSheet(); render(); }
        else {
          const sh = doc.shapes.find(s => s.n && key(s.n)===focusKey);
          if (sh){ const q = sh.t==='r' ? [[sh.x,sh.y],[sh.x+sh.w,sh.y+sh.h]] : (sh.pts||[]); fitBox(Math.min(...q.map(p=>p[0])), Math.min(...q.map(p=>p[1])), Math.max(...q.map(p=>p[0])), Math.max(...q.map(p=>p[1])), 6); toast('📍 '+sh.n); }
          else toast('Η θέση δεν υπάρχει στον χάρτη');
        }
      }
    };
    if (switched && !loaded) afterLoad = settle; else requestAnimationFrame(settle);
  }
  function close(){ if (dlg.open) dlg.close(); }
  function refresh(){ if (dlg.open){ renderAll(); } }
  return { open, close, refresh, warm: () => { ensureLive().catch(()=>{}); },
    // συντεταγμένες (lat,lng) του οχήματος: θέση ή κέντρο ονομασμένης ζώνης, μόνο σε live χάρτες
    coords: (label, mapId) => {
      if (!label) return null; const k = key(label), ids = mapId && (allSpots[mapId]||allShapes[mapId]) ? [mapId] : Object.keys({ ...allSpots, ...allShapes });
      for (const id of ids){
        if (maps.find(x => x.id===id)?.type!=='live') continue;
        const sp = (allSpots[id]||[]).find(p => key(p.l)===k); if (sp) return { lat:+sp.y, lng:+sp.x };
        const sh = (allShapes[id]||[]).find(s => s.n && key(s.n)===k && Array.isArray(s.pts) && s.pts.length);
        if (sh){ const n = sh.pts.length; return { lat: sh.pts.reduce((a,p)=>a+(+p[1]),0)/n, lng: sh.pts.reduce((a,p)=>a+(+p[0]),0)/n }; }
      }
      return null;
    },
    hasSpot: (label, mapId) => { if (!label) return false; const k = key(label), ids = mapId && (allSpots[mapId]||allShapes[mapId]) ? [mapId] : Object.keys({...allSpots, ...allShapes}); return ids.some(id => (allSpots[id]||[]).some(p => key(p.l)===k) || (allShapes[id]||[]).some(s => s.n && key(s.n)===k)); }, spotCount: () => remote.list.length };
}
