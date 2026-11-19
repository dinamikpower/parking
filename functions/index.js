// Όταν ο επικεφαλής ζητά ένα όχημα (requests/{id}), στέλνει push σε όλους τους υπαλλήλους
// που έχουν ενεργοποιήσει ειδοποιήσεις (pushTokens), ακόμα κι αν το αππ είναι κλειστό.
const { onDocumentCreated, onDocumentUpdated, onDocumentDeleted } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
admin.initializeApp();

exports.notifyRequest = onDocumentCreated({ document: 'requests/{id}', region: 'europe-west1' }, async event => {
  const r = event.data && event.data.data();
  if (!r) return;
  const snap = await admin.firestore().collection('pushTokens').where('head', '==', false).get();
  const tokens = snap.docs.map(d => d.id);
  if (!tokens.length) return;
  const res = await admin.messaging().sendEachForMulticast({
    tokens,
    data: {
      title: '🔔 Ζητείται το όχημα',
      body: `${r.plate || ''}${r.location ? ' · 📍 ' + r.location : ''}${r.by ? ' · από ' + r.by : ''}`,
      vehicleId: String(r.vehicleId || ''),
      tag: event.params.id,
    },
    webpush: { headers: { Urgency: 'high', TTL: '3600' } },
  });
  console.log(`push ${event.params.id}: tokens=${tokens.length} ok=${res.successCount} fail=${res.failureCount}`);
  res.responses.forEach((x, i) => { if (x.error) console.log('push error', tokens[i].slice(0, 12), x.error.code, x.error.message); });
  // καθάρισμα άκυρων tokens
  const dead = [];
  res.responses.forEach((x, i) => {
    const c = x.error && x.error.code;
    if (c === 'messaging/registration-token-not-registered' || c === 'messaging/invalid-registration-token') dead.push(tokens[i]);
  });
  await Promise.all(dead.map(t => admin.firestore().collection('pushTokens').doc(t).delete()));
});


/* ---------- Αιτήματα πελατών (σελίδα /r/<κωδικός>) ----------
   links/{κωδικός} = { vid, st: 'in' | 'asked' | 'taken' | 'out', askAt }
   Ο πελάτης (χωρίς λογαριασμό) μπορεί μόνο να γράψει askAt (οι κανόνες το επιτρέπουν, με όριο 2 λεπτών).
   Εδώ το μετατρέπουμε σε κανονικό αίτημα προς τους υπαλλήλους και κρατάμε την κατάσταση του link. */
const db = () => admin.firestore();
const ms = t => (t && t.toMillis ? t.toMillis() : (t || 0));

exports.customerAsk = onDocumentUpdated({ document: 'links/{ct}', region: 'europe-west1' }, async event => {
  const b = event.data.before.data() || {}, a = event.data.after.data() || {};
  if (!a.askAt || ms(a.askAt) === ms(b.askAt)) return;            // άλλαξε κάτι άλλο (π.χ. η κατάσταση)
  if (a.st === 'out' || !a.vid) return;
  const vref = db().collection('vehicles').doc(a.vid), vs = await vref.get();
  if (!vs.exists || vs.get('exitAt')) { await event.data.after.ref.set({ st: 'out' }, { merge: true }); return; }
  const v = vs.data();
  const old = await db().collection('requests').where('vehicleId', '==', a.vid).where('doneAt', '==', null).get();
  await Promise.all(old.docs.map(d => d.ref.delete()));         // ένα ενεργό αίτημα ανά όχημα
  await db().collection('requests').add({
    vehicleId: a.vid, plate: v.plate || '', country: v.country || '', location: v.location || '', mapId: v.mapId || null,
    brand: v.brand || '', by: 'Πελάτης', fromCustomer: true, lk: event.params.ct,
    at: admin.firestore.FieldValue.serverTimestamp(), doneAt: null,
  });
  await event.data.after.ref.set({ st: 'asked' }, { merge: true });
});

// όταν ένας υπάλληλος αναλαμβάνει το αίτημα → ο πελάτης βλέπει «το φέρνουν»
exports.customerTaken = onDocumentUpdated({ document: 'requests/{id}', region: 'europe-west1' }, async event => {
  const b = event.data.before.data() || {}, a = event.data.after.data() || {};
  if (!a.lk || !a.doneAt || b.doneAt) return;
  await db().collection('links').doc(a.lk).set({ st: 'taken' }, { merge: true });
});

// έξοδος ή διαγραφή οχήματος → το link κλείνει
exports.customerOut = onDocumentUpdated({ document: 'vehicles/{id}', region: 'europe-west1' }, async event => {
  const b = event.data.before.data() || {}, a = event.data.after.data() || {};
  if (!a.ct || !a.exitAt || b.exitAt) return;
  await db().collection('links').doc(a.ct).set({ st: 'out' }, { merge: true });
});
exports.customerGone = onDocumentDeleted({ document: 'vehicles/{id}', region: 'europe-west1' }, async event => {
  const v = event.data && event.data.data();
  if (v && v.ct) await db().collection('links').doc(v.ct).set({ st: 'out' }, { merge: true });
});
