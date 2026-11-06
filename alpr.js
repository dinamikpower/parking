// Αναγνώριση πινακίδας με AI μέσα στη συσκευή (onnxruntime-web):
// 1) YOLOv9 εντοπίζει την πινακίδα στο κάδρο, 2) το fast-plate-ocr διαβάζει τους χαρακτήρες.
// Μοντέλα: ankandrew/open-image-models και ankandrew/fast-plate-ocr (MIT).
const ORT = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.20.1/dist/';
const ALPHA = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ_';
let ready = null, det = null, ocr = null;

function loadOrt(){
  if (window.ort) return Promise.resolve();
  return new Promise((res, rej) => {
    const s = document.createElement('script');
    s.src = ORT + 'ort.min.js'; s.onload = res;
    s.onerror = () => rej(new Error('Χρειάζεται internet για την πρώτη φόρτωση της αναγνώρισης.'));
    document.head.append(s);
  });
}
export function loadAlpr(){
  if (ready) return ready;
  ready = (async () => {
    await loadOrt();
    ort.env.wasm.wasmPaths = ORT; ort.env.wasm.numThreads = 1; ort.env.logLevel = 'error';
    const opt = { executionProviders:['wasm'], graphOptimizationLevel:'all' };
    [det, ocr] = await Promise.all([
      ort.InferenceSession.create('./models/plate-detector.onnx', opt),
      ort.InferenceSession.create('./models/plate-ocr.onnx', opt),
    ]);
  })().catch(e => { ready = null; throw e; });
  return ready;
}

const S = 384, cv = document.createElement('canvas'); cv.width = cv.height = S;
const cx = cv.getContext('2d', { willReadFrequently:true });
const oc = document.createElement('canvas'); oc.width = 128; oc.height = 64;
const ox = oc.getContext('2d', { willReadFrequently:true });

// src: canvas/video/bitmap, (sx,sy,sw,sh): περιοχή της πηγής που θα εξεταστεί
export async function readPlates(src, sx, sy, sw, sh){
  await loadAlpr();
  const r = Math.min(S/sw, S/sh), nw = Math.round(sw*r), nh = Math.round(sh*r);
  const dw = (S-nw)/2, dh = (S-nh)/2;
  cx.fillStyle = 'rgb(114,114,114)'; cx.fillRect(0, 0, S, S);
  cx.imageSmoothingQuality = 'high';
  cx.drawImage(src, sx, sy, sw, sh, Math.round(dw-.1), Math.round(dh-.1), nw, nh);
  const px = cx.getImageData(0, 0, S, S).data, f = new Float32Array(3*S*S), n = S*S;
  for (let i=0;i<n;i++){ f[i] = px[4*i]/255; f[n+i] = px[4*i+1]/255; f[2*n+i] = px[4*i+2]/255; }
  const o = (await det.run({ images:new ort.Tensor('float32', f, [1,3,S,S]) }))[det.outputNames[0]];
  const rows = o.dims[0], d = o.data, res = [];
  for (let k=0;k<rows;k++){
    const b = k*7, score = d[b+6]; if (score < .35) continue;
    let x1 = sx + (d[b+1]-dw)/r, y1 = sy + (d[b+2]-dh)/r, x2 = sx + (d[b+3]-dw)/r, y2 = sy + (d[b+4]-dh)/r;
    const w = x2-x1, h = y2-y1; if (w < 10 || h < 5) continue;
    const px_ = w*.04, py_ = h*.08;                       // μικρό περιθώριο γύρω από την πινακίδα
    x1 = Math.max(0, x1-px_); y1 = Math.max(0, y1-py_); x2 += px_; y2 += py_;
    ox.drawImage(src, x1, y1, x2-x1, y2-y1, 0, 0, 128, 64);
    const im = ox.getImageData(0, 0, 128, 64).data, u = new Uint8Array(128*64*3);
    for (let i=0;i<128*64;i++){ u[3*i] = im[4*i]; u[3*i+1] = im[4*i+1]; u[3*i+2] = im[4*i+2]; }
    const out = await ocr.run({ input:new ort.Tensor('uint8', u, [1,64,128,3]) });
    const p = out.plate.data, L = ALPHA.length; let text = '', cs = [];
    for (let s=0;s<10;s++){
      let bi = 0, bv = -1; for (let a=0;a<L;a++){ const v = p[s*L+a]; if (v > bv){ bv = v; bi = a; } }
      if (ALPHA[bi] !== '_'){ text += ALPHA[bi]; cs.push(bv); }
    }
    if (!text) continue;
    res.push({ text, conf: Math.min(...cs), score, box:[x1,y1,x2,y2] });
  }
  return res.sort((a,b) => b.score - a.score);
}
