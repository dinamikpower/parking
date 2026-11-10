// Είσοδος προσωπικού (Firebase Authentication, email + κωδικός) και διαχείριση υπαλλήλων.
// Η πρόσβαση στα δεδομένα δίνεται από το έγγραφο staff/{uid} (βλ. firestore.rules).
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import * as A from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const ERR = {
  'auth/invalid-credential':'Λάθος email ή κωδικός.', 'auth/wrong-password':'Λάθος email ή κωδικός.', 'auth/user-not-found':'Λάθος email ή κωδικός.',
  'auth/invalid-email':'Το email δεν είναι σωστό.', 'auth/too-many-requests':'Πολλές προσπάθειες. Δοκίμασε ξανά σε λίγο.',
  'auth/network-request-failed':'Δεν υπάρχει σύνδεση στο ίντερνετ.', 'auth/user-disabled':'Ο λογαριασμός είναι απενεργοποιημένος.',
  'auth/email-already-in-use':'Υπάρχει ήδη λογαριασμός με αυτό το email.', 'auth/weak-password':'Ο κωδικός πρέπει να έχει τουλάχιστον 6 χαρακτήρες.',
  'auth/operation-not-allowed':'Η είσοδος με email δεν έχει ενεργοποιηθεί στο Firebase.',
};
const msg = e => ERR[e?.code] || (e?.code === 'permission-denied' ? 'Δεν έχεις δικαίωμα.' : (e?.message || 'Σφάλμα'));

const CSS = `
#lg{position:fixed;inset:0;z-index:100;background:radial-gradient(circle at 20% 10%,#2a2a2a 0,#111 55%,#000 100%);display:flex;align-items:center;justify-content:center;padding:20px;overflow:auto}
#lg .box{width:min(380px,100%);background:#fff;color:#0f172a;border-radius:22px;padding:30px 24px 24px;box-shadow:0 30px 70px rgba(0,0,0,.5);text-align:center}
#lg .logo{width:76px;height:76px;border-radius:20px;box-shadow:0 8px 22px rgba(29,78,216,.45);margin:-62px auto 14px;display:block;background:#fff}
#lg .box{margin-top:44px} #lg label,#lg input{text-align:left}
#lg h1{margin:0 0 4px;font-size:26px} #lg p{margin:0 0 16px;color:#64748b;font-size:15px}
#lg label{display:block;font-size:13px;font-weight:600;color:#64748b;margin:12px 0 4px}
#lg input{width:100%;box-sizing:border-box;padding:13px;border-radius:10px;border:1px solid #cbd5e1;font:inherit;font-size:17px}
#lg button{width:100%;margin-top:16px;padding:14px;border-radius:12px;border:0;background:#6e6e6e;box-shadow:0 6px 16px rgba(0,0,0,.4);color:#fff;font:inherit;font-weight:700;font-size:17px;cursor:pointer}
#lg button.link{background:none;box-shadow:none;color:#888;font-size:14px;font-weight:600;margin-top:10px;padding:8px}
#lg button:disabled{opacity:.6}
#lg .err{color:#b91c1c;font-size:14px;min-height:20px;margin-top:10px} #lg .ok{color:#166534}
#ud{border:0;border-radius:16px;padding:0;width:min(520px,94vw);background:var(--card,#fff);color:var(--text,#0f172a)}
#ud::backdrop{background:rgba(0,0,0,.55)}
#ud .in{padding:18px} #ud h2{margin:0 0 4px;font-size:19px} #ud .sub{color:#64748b;font-size:14px;margin-bottom:12px}
#ud .st{display:flex;align-items:center;gap:8px;padding:9px 0;border-top:1px solid var(--line,#e2e8f0)}
#ud .st b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap} #ud .st small{color:#64748b;display:block;font-weight:400;overflow:hidden;text-overflow:ellipsis}
#ud button{font:inherit;cursor:pointer;padding:9px 12px;border-radius:10px;border:1px solid var(--bt-bd,#cfcfcf);background:var(--bt-bg,#e8e8e8);color:var(--bt-fg,#222);font-weight:600}
#ud button.p{background:#2563eb;border-color:#888;color:#fff} #ud button.d{background:var(--rd-bg,#fee2e2);border-color:var(--rd-bd,#fca5a5);color:var(--rd-fg,#b91c1c)}
#ud input,#ud select{width:100%;box-sizing:border-box;padding:11px;border-radius:10px;border:1px solid var(--line,#cbd5e1);background:var(--bg,#fff);color:var(--text,#0f172a);font:inherit;font-size:16px;margin-top:6px}
#ud .row{display:flex;gap:8px;margin-top:12px} #ud .row>*{flex:1} #ud .m{min-height:20px;font-size:14px;margin-top:8px}
#userBtn{background:var(--badge,rgba(255,255,255,.16));color:var(--badge-fg,#fff);border:0;border-radius:99px;padding:4px 10px;font:inherit;font-size:13px;font-weight:600;cursor:pointer;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
`;

export async function requireLogin(app, db, fs, CFG, onReady){
  document.head.insertAdjacentHTML('beforeend', `<style>${CSS}</style>`);
  const auth = A.getAuth(app);
  await auth.authStateReady();

  const staffRef = uid => fs.doc(db, 'staff', uid);
  const readStaff = async uid => { try { const s = await fs.getDoc(staffRef(uid)); return s.exists() ? s.data() : null; } catch (e) { if (e.code === 'permission-denied') return null; throw e; } };

  // Πρώτη εγκατάσταση: ο πρώτος διαχειριστής (το email που όρισε το firestore.rules) δημιουργεί το δικό του έγγραφο
  async function bootstrap(user){
    try {
      const init = await fs.getDoc(fs.doc(db, 'meta', 'init')).then(s => s.exists()).catch(() => true);
      if (init) return null;
      const data = { name: user.displayName || (user.email || '').split('@')[0], email: user.email, admin: true, createdAt: Date.now() };
      const b = fs.writeBatch(db); b.set(staffRef(user.uid), data); b.set(fs.doc(db, 'meta', 'init'), { by: user.email, at: Date.now() });
      await b.commit(); return data;
    } catch { return null; }
  }

  function loginScreen(initialErr){
    return new Promise(resolve => {
      const el = document.createElement('div'); el.id = 'lg';
      el.innerHTML = `<form class="box" autocomplete="on"><img class="logo" alt="" src="icon-192.png"><h1>Παρκινγκ</h1><p>Είσοδος προσωπικού</p>
        <label>Email</label><input name="email" type="email" autocomplete="username" inputmode="email" autocapitalize="off" required>
        <label>Κωδικός</label><input name="password" type="password" autocomplete="current-password" required>
        <div class="err">${esc(initialErr || '')}</div>
        <button type="submit">Είσοδος</button><button type="button" class="link" data-a="reset">Ξέχασα τον κωδικό</button></form>`;
      document.body.append(el);
      const f = el.querySelector('form'), err = el.querySelector('.err'), btn = f.querySelector('[type=submit]');
      f.onsubmit = async e => {
        e.preventDefault(); err.className = 'err'; err.textContent = ''; btn.disabled = true;
        try { await A.signInWithEmailAndPassword(auth, f.email.value.trim(), f.password.value); el.remove(); resolve(); }
        catch (x) { err.textContent = msg(x); btn.disabled = false; }
      };
      f.querySelector('[data-a=reset]').onclick = async () => {
        const mail = f.email.value.trim(); if (!mail){ err.className = 'err'; err.textContent = 'Γράψε πρώτα το email σου.'; return; }
        try { await A.sendPasswordResetEmail(auth, mail); err.className = 'err ok'; err.textContent = 'Στάλθηκε email για νέο κωδικό (δες και τα ανεπιθύμητα).'; }
        catch (x) { err.className = 'err'; err.textContent = msg(x); }
      };
    });
  }

  function noAccess(user){
    return new Promise(() => {
      const el = document.createElement('div'); el.id = 'lg';
      el.innerHTML = `<div class="box"><img class="logo" alt="" src="icon-192.png"><h1>Χωρίς πρόσβαση</h1><p>Ο λογαριασμός <b>${esc(user.email)}</b> δεν έχει δικαίωμα χρήσης. Ζήτα από τον διαχειριστή να σε προσθέσει.</p>
        <button data-a="out">Αποσύνδεση</button></div>`;
      document.body.append(el); el.querySelector('[data-a=out]').onclick = async () => { await A.signOut(auth); location.reload(); };
    });
  }

  let profile = null;
  for (;;) {
    if (!auth.currentUser) await loginScreen();
    const user = auth.currentUser; if (!user) continue;
    profile = await readStaff(user.uid) || await bootstrap(user);
    if (profile) break;
    await noAccess(user);   // δεν επιστρέφει (η σελίδα ξαναφορτώνει μετά την αποσύνδεση)
  }

  const user = auth.currentUser;
  const me = { uid: user.uid, email: user.email, name: profile.name || (user.email || '').split('@')[0], admin: !!profile.admin, role: profile.role || (profile.admin ? 'head' : 'staff') };
  me.head = me.admin || me.role === 'head';   // επικεφαλής: μόνος που καταχωρεί/αλλάζει οχήματα

  /* ----- κουμπί χρήστη + παράθυρο προσωπικού ----- */
  const ud = document.createElement('dialog'); ud.id = 'ud'; document.body.append(ud);
  const btn = document.createElement('button'); btn.id = 'userBtn'; btn.textContent = '👤 ' + me.name; btn.title = me.email;
  const slot = document.getElementById('count')?.parentElement; slot?.prepend(btn);
  btn.onclick = () => { renderUd(); ud.showModal(); };

  function renderUd(list){
    ud.innerHTML = `<div class="in"><h2>👤 ${esc(me.name)}</h2><div class="sub">${esc(me.email)}${me.admin ? ' · διαχειριστής' : me.head ? ' · επικεφαλής' : ' · υπάλληλος'}</div>
      ${me.admin ? `<div id="stl"><div class="sub">Φόρτωση προσωπικού…</div></div>
        <form id="stf"><b>Νέο μέλος προσωπικού</b><input name="name" placeholder="Όνομα" required><input name="email" type="email" placeholder="Email" autocapitalize="off" required>
        <input name="pw" type="text" placeholder="Προσωρινός κωδικός (min 6)" minlength="6" required autocapitalize="off" autocomplete="off">
        <select name="role"><option value="staff">Υπάλληλος (μόνο προβολή)</option><option value="head">Επικεφαλής (καταχωρεί οχήματα)</option></select>
        <div class="row"><button class="p" type="submit">+ Προσθήκη</button></div><div class="m"></div></form>` : ''}
      <div class="row"><button data-a="pw">Αλλαγή κωδικού (email)</button><button data-a="out" class="d">Αποσύνδεση</button></div><div class="row"><button data-a="x">Κλείσιμο</button></div><div class="m" id="um"></div></div>`;
    ud.querySelector('[data-a=x]').onclick = () => ud.close();
    ud.querySelector('[data-a=out]').onclick = async () => { await A.signOut(auth); location.reload(); };
    ud.querySelector('[data-a=pw]').onclick = async () => { const m = ud.querySelector('#um'); try { await A.sendPasswordResetEmail(auth, me.email); m.textContent = 'Στάλθηκε email για νέο κωδικό.'; } catch (e) { m.textContent = msg(e); } };
    if (me.admin) loadStaff();
  }


  async function loadStaff(){
    const box = ud.querySelector('#stl'), form = ud.querySelector('#stf'), fm = form.querySelector('.m');
    const draw = async () => {
      const snap = await fs.getDocs(fs.collection(db, 'staff'));
      const rows = snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.admin ? 1 : 0) - (a.admin ? 1 : 0) || String(a.name).localeCompare(String(b.name), 'el'));
      box.innerHTML = `<div class="sub">Προσωπικό (${rows.length})</div>` + rows.map(r => { const head = r.admin || r.role === 'head'; return `<div class="st"><b>${esc(r.name)}${r.admin ? ' ★' : ''}<small>${esc(r.email)} · ${r.admin ? 'διαχειριστής' : head ? 'επικεφαλής' : 'υπάλληλος'}</small></b>
        ${r.id === me.uid || r.admin ? '' : `<button data-role="${r.id}" data-to="${head ? 'staff' : 'head'}">${head ? 'Κάν’ τον υπάλληλο' : 'Κάν’ τον επικεφαλής'}</button><button class="d" data-rm="${r.id}" data-n="${esc(r.name)}">Αφαίρεση</button>`}</div>`; }).join('');
      box.querySelectorAll('[data-role]').forEach(b => b.onclick = async () => { try { await fs.updateDoc(staffRef(b.dataset.role), { role: b.dataset.to }); await draw(); } catch (e) { fm.textContent = msg(e); } });
      box.querySelectorAll('[data-rm]').forEach(b => b.onclick = async () => {
        if (!confirm(`Να αφαιρεθεί η πρόσβαση του ${b.dataset.n};`)) return;
        try { await fs.deleteDoc(staffRef(b.dataset.rm)); await draw(); } catch (e) { fm.textContent = msg(e); }
      });
    };
    try { await draw(); } catch (e) { box.innerHTML = `<div class="sub">${esc(msg(e))}</div>`; }
    form.onsubmit = async e => {
      e.preventDefault(); const name = form.name.value.trim(), email = form.email.value.trim().toLowerCase(), pw = form.pw.value;
      const sb = form.querySelector('[type=submit]'); sb.disabled = true; fm.style.color = ''; fm.textContent = 'Δημιουργία…';
      let sec;
      try {
        sec = initializeApp(CFG, 'sec-' + Date.now()); const sa = A.getAuth(sec);
        let cred;
        try { cred = await A.createUserWithEmailAndPassword(sa, email, pw); }
        catch (x) { if (x.code === 'auth/email-already-in-use') cred = await A.signInWithEmailAndPassword(sa, email, pw); else throw x; }   // ήδη υπάρχων λογαριασμός: ξανά πρόσβαση αν ο κωδικός ταιριάζει
        await fs.setDoc(staffRef(cred.user.uid), { name, email, admin: false, role: form.role.value === 'head' ? 'head' : 'staff', createdAt: Date.now(), by: me.email });
        await A.signOut(sa);
        form.reset(); fm.style.color = '#166534'; fm.textContent = `✓ Προστέθηκε ο/η ${name}. Δώσ' του το email και τον προσωρινό κωδικό.`; await draw();
      } catch (x) { fm.style.color = '#b91c1c'; fm.textContent = x.code === 'auth/invalid-credential' ? 'Υπάρχει ήδη λογαριασμός με αυτό το email και ο κωδικός δεν ταιριάζει.' : msg(x); }
      finally { sb.disabled = false; }
    };
  }

  onReady?.(me);
  return me;
}
