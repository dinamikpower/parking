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
.mp-zones{display:flex;gap:6px;overflow-x:auto;padding-top:8px;scrollbar-width:none}
.mp-zones::-webkit-scrollbar{display:none}
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
.shp{position:absolute;box-sizing:border-box;border:3px solid;border-radius:4px;pointer-events:none}
.shp b{display:inline-block;font-size:max(11px,calc(var(--sp)*.5));color:#fff;background:rgba(0,0,0,.6);padding:1px 7px;border-radius:0 0 6px 0;line-height:1.3;white-space:nowrap;overflow:hidden;max-width:100%}
.shp.prev{border-style:dashed}
#mapDlg.erase .shp{pointer-events:auto}
#mapDlg.erase .mp-svg polyline.hit{pointer-events:stroke}
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
    <div class="mp-head"><div class="mp-top"><button class="mp-x" data-a="close" aria-label="Κλείσιμο">✕</button><div class="mp-title"></div></div><div class="mp-zones"></div></div>
    <div class="mp-vp"><div class="mp-stage"><img class="mp-img" alt=""><div class="mp-shapes"></div><div class="mp-spots"></div></div><div class="mp-empty" hidden></div></div>
    <div class="mp-sheet" hidden></div>
    <div class="mp-foot"></div>
    <input type="file" accept="image/*" hidden class="mp-file">`;
  document.body.append(dlg);
  const $ = s => dlg.querySelector(s);
  const vp = $('.mp-vp'), stage = $('.mp-stage'), img = $('.mp-img'), spotsEl = $('.mp-spots'), shapesEl = $('.mp-shapes');
  const sheet = $('.mp-sheet'), foot = $('.mp-foot'), titleEl = $('.mp-title'), zonesEl = $('.mp-zones'), emptyEl = $('.mp-empty'), fileEl = $('.mp-file');

  /* ---------- κατάσταση ---------- */
  let mapImg = null;                          // {image,w,h}
  let remote = { list:[], size:3.2, shapes:[] }; // τελευταία κατάσταση από τη βάση
  let doc = { list:[], size:3.2, shapes:[] }; // τοπική κατάσταση (αλλάζει στην επεξεργασία)
  const COLORS = ['#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#a855f7','#ffffff'];
  let tool = 'spot', color = COLORS[4], drawing = null;   // εργαλείο: pan | spot | rect | pen | erase
  let mode = 'browse', editing = false, pickCb = null;
  let zoneFilter = null, focusKey = null, selected = null, startLabel = null, lastLabel = '', undo = [];
  let s = 1, tx = 0, ty = 0, baseW = 0, baseH = 0, saveT = null;

  const key = plateKey;
  const spotKeys = () => new Set(doc.list.map(p => key(p.l)));
  function occupancy(){
    const m = new Map();
    for (const v of getCars()) if (!v.exitAt){ const k = key(v.location); if (!m.has(k)) m.set(k, []); m.get(k).push(v); }
    return m;
  }

  /* ---------- δεδομένα ---------- */
  const cloneRemote = () => ({ list: remote.list.map(p=>({...p})), size: remote.size, shapes: JSON.parse(JSON.stringify(remote.shapes)) });
  store.subscribeMap(({ img:i, spots, shapes }) => {
    mapImg = i && i.image ? i : null;
    remote = { list: (spots?.list)||[], size: spots?.size||3.2, shapes: (shapes?.list)||[] };
    if (!editing) doc = cloneRemote();
    if (dlg.open) render();
    onChange?.();
  });
  const saveAll = () => Promise.all([ store.saveSpots({ list:doc.list, size:doc.size }), store.saveShapes({ list:doc.shapes }) ]);
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
  function drawEnd(){
    const d = drawing; drawing = null; d.el?.remove();
    if (d.type==='rect'){
      if (d.x1==null) return;
      const w = Math.abs(d.x1-d.x0), h = Math.abs(d.y1-d.y0);
      if (w<0.8 || h<0.8) return;
      const name = (prompt('Όνομα περιοχής (προαιρετικό, π.χ. Ζώνη Α · VIP):','')||'').trim();
      mutate(()=>doc.shapes.push({ t:'r', x:+Math.min(d.x0,d.x1).toFixed(2), y:+Math.min(d.y0,d.y1).toFixed(2), w:+w.toFixed(2), h:+h.toFixed(2), c:color, n:name }));
    } else {
      if (d.pts.length<2) return;
      mutate(()=>doc.shapes.push({ t:'p', pts:d.pts, c:color }));
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
  function finishPick(label){ const cb = pickCb; close(); cb?.(label); }
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
      editing = false; startLabel = null; undo = []; clearTimeout(saveT);
      try { await saveAll(); remote = JSON.parse(JSON.stringify({ list:doc.list, size:doc.size, shapes:doc.shapes })); toast('Ο χάρτης αποθηκεύτηκε'); }
      catch(err){ toast('Σφάλμα αποθήκευσης: '+err.message); }
      doc = cloneRemote(); closeSheet(); renderAll(); return;
    }
    if (a==='tool'){ tool = b.dataset.t; startLabel = null; closeSheet(); return; }
    if (a==='color'){ color = b.dataset.c; renderFoot(); return; }
    if (a==='pickimg' || a==='img') return fileEl.click();
    if (a==='clearmap'){
      if (!confirm('Να διαγραφεί ΟΛΟΣ ο χάρτης (φωτογραφία, θέσεις και σχέδια);\nΔεν αναιρείται και φεύγει για όλους τους υπαλλήλους.')) return;
      clearTimeout(saveT);
      try { await store.clearMap(); } catch(err){ return toast('Σφάλμα διαγραφής: '+err.message); }
      editing = false; startLabel = null; undo = []; selected = null; mapImg = null; remote = { list:[], size:3.2, shapes:[] }; doc = cloneRemote();
      closeSheet(); renderAll(); onChange?.(); toast('Ο χάρτης διαγράφηκε'); return;
    }
    if (a==='zone'){ zoneFilter = b.dataset.z || null; fitZone(); render(); return; }
    if (a==='newzone'){ const l = (prompt('Πρώτη θέση της νέας ζώνης/σειράς (π.χ. B1):', lastLabel?nextLabel(lastLabel.replace(/\d+$/,'0')):'B1')||'').trim(); if (l){ startLabel = l; toast('Πάτα στον χάρτη για να μπει η '+l); renderFoot(); } return; }
    if (a==='undo'){ while (undo.length && undo[undo.length-1]===null) undo.pop(); const prev = undo.pop(); if (prev){ const o = JSON.parse(prev); doc.list = o.list; doc.shapes = o.shapes; scheduleSave(); closeSheet(); } return; }
    if (a==='rename'){ const v = $('#mpLab').value.trim(); if (!v) return; const dup = doc.list.some((p,i)=>i!==selected && key(p.l)===key(v)); if (dup) return toast('Υπάρχει ήδη θέση '+v); mutate(()=>{ doc.list[selected].l = v; }); lastLabel = v; closeSheet(); return; }
    if (a==='del'){ mutate(()=>{ doc.list.splice(selected,1); }); closeSheet(); return; }
    if (a==='newhere'){ const l = doc.list[selected].l; close(); openNewCarAt(l); return; }
    if (a==='exit'){ await exitCar(b.dataset.id); renderSheet(); return; }
    if (a==='usepick'){ finishPick(doc.list[selected].l); return; }
  });
  dlg.addEventListener('input', e => {
    if (e.target.matches('.mp-size')){ doc.size = +e.target.value; layout(); scheduleSave(); }
  });
  fileEl.addEventListener('change', async e => {
    const f = e.target.files[0]; e.target.value = ''; if (!f) return;
    if (mapImg && doc.list.length && !confirm('Αν αλλάξεις εικόνα, οι θέσεις μένουν στα ίδια σημεία. Συνέχεια;')) return;
    try { toast('Επεξεργασία εικόνας…'); const o = await compressImage(f); await store.saveImage(o); editing = true; mode='browse'; toast('Η εικόνα αποθηκεύτηκε'); setTimeout(()=>{ renderAll(); fitAll(); }, 150); }
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
        pan:   'Σύρε για να κινήσεις τον χάρτη. Με δύο δάχτυλα κάνεις zoom σε οποιοδήποτε εργαλείο.',
        spot:  startLabel ? `Πάτα στον χάρτη για να μπει η θέση <b>${esc(startLabel)}</b>` : 'Πάτα στον χάρτη για να βάλεις θέση (παίρνουν αυτόματα το επόμενο νούμερο). Σύρε μια θέση για να τη μετακινήσεις, πάτα πάνω της για μετονομασία ή διαγραφή.',
        rect:  'Σύρε στον χάρτη για να ζωγραφίσεις ορθογώνιο (π.χ. μια ζώνη). Μετά μπορείς να του δώσεις όνομα. Με δύο δάχτυλα κάνεις zoom/μετακίνηση.',
        pen:   'Σύρε για ελεύθερο σχέδιο (γραμμές, βέλη, περιγράμματα). Με δύο δάχτυλα κάνεις zoom/μετακίνηση.',
        erase: 'Πάτα ένα ορθογώνιο ή μια γραμμή για να τη σβήσεις.',
      }[tool];
      const TOOLS = [['pan','✋','Κίνηση'],['spot','📍','Θέσεις'],['rect','▭','Ορθογώνιο'],['pen','✏️','Σχέδιο'],['erase','🗑','Σβήσιμο']];
      foot.innerHTML = `<div class="hint">${HINT}</div>
        <div class="mp-tools">${TOOLS.map(([t,i,n])=>`<button class="mp-tool ${tool===t?'on':''}" data-a="tool" data-t="${t}">${i} ${n}</button>`).join('')}</div>
        ${(tool==='rect'||tool==='pen') ? `<div class="mp-tools">${COLORS.map(c=>`<button class="mp-sw ${c===color?'on':''}" data-a="color" data-c="${c}" style="background:${c}" aria-label="χρώμα"></button>`).join('')}</div>` : ''}
        ${tool==='spot' ? '<button class="btn" data-a="newzone">＋ Νέα ζώνη/σειρά</button>' : ''}<button class="btn" data-a="undo">↶ Αναίρεση</button><button class="btn" data-a="img">🖼 Εικόνα</button><button class="btn" data-a="clearmap">🗑 Διαγραφή χάρτη</button>
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
    const lines = doc.shapes.map((sh,i) => {
      if (sh.t!=='p' || !Array.isArray(sh.pts)) return '';
      const pts = sh.pts.map(p=>`${+p[0]},${+p[1]}`).join(' ');
      return `<polyline points="${pts}" stroke="${safeColor(sh.c)}"/><polyline class="hit" data-si="${i}" points="${pts}"/>`;
    }).join('');
    shapesEl.innerHTML = rects + `<svg class="mp-svg" viewBox="0 0 100 100" preserveAspectRatio="none">${lines}</svg>`;
  }
  function render(){
    dlg.classList.toggle('erase', editing && tool==='erase');
    const occ = occupancy(), total = doc.list.length;
    let used = 0; for (const p of doc.list) if (occ.has(key(p.l))) used++;
    titleEl.innerHTML = `Χάρτης παρκινγκ<small>${total ? `${total-used} ελεύθερες από ${total}` : 'δεν έχουν οριστεί θέσεις'}</small>`;
    const zs = [...new Set(doc.list.map(p=>zoneOf(p.l)))].sort();
    zonesEl.innerHTML = zs.length>1 ? [`<button class="mp-z ${!zoneFilter?'on':''}" data-a="zone" data-z="">Όλες</button>`, ...zs.map(z=>`<button class="mp-z ${zoneFilter===z?'on':''}" data-a="zone" data-z="${esc(z)}">${esc(z)}</button>`)].join('') : '';
    if (!mapImg){
      img.removeAttribute('src'); stage.style.display = 'none'; emptyEl.hidden = false;
      emptyEl.innerHTML = `<div style="font-size:42px">🗺️</div><div>Δεν υπάρχει χάρτης ακόμα.<br>Ανέβασε μια φωτογραφία ή σχέδιο του παρκινγκ (π.χ. από ψηλά ή κάτοψη) και βάλε πάνω της τις θέσεις.</div><button class="btn primary" data-a="pickimg">📷 Ανέβασμα εικόνας</button>`;
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
  function open(o = {}){
    mode = o.mode || 'browse'; pickCb = o.onPick || null; editing = false; selected = null; zoneFilter = null; startLabel = null; undo = []; tool = 'spot'; drawing = null;
    focusKey = o.focus ? key(o.focus) : null;
    doc = cloneRemote();
    sheet.hidden = true; if (!dlg.open) dlg.showModal();
    render();
    requestAnimationFrame(() => {
      fitAll();
      if (focusKey){
        const i = doc.list.findIndex(p => key(p.l)===focusKey);
        if (i>=0){ const p = doc.list[i]; fitBox(p.x,p.y,p.x,p.y,3.5); selected = i; renderSheet(); render(); }
        else toast('Η θέση δεν υπάρχει στον χάρτη');
      }
    });
  }
  function close(){ if (dlg.open) dlg.close(); }
  function refresh(){ if (dlg.open){ renderAll(); } }
  return { open, close, refresh, hasSpot: label => !!label && remote.list.some(p => key(p.l)===key(label)), spotCount: () => remote.list.length };
}
