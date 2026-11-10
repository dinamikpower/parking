// Όταν ο επικεφαλής ζητά ένα όχημα (requests/{id}), στέλνει push σε όλους τους υπαλλήλους
// που έχουν ενεργοποιήσει ειδοποιήσεις (pushTokens), ακόμα κι αν το αππ είναι κλειστό.
const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
admin.initializeApp();

exports.notifyRequest = onDocumentCreated({ document: 'requests/{id}', region: 'us-central1' }, async event => {
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
  // καθάρισμα άκυρων tokens
  const dead = [];
  res.responses.forEach((x, i) => {
    const c = x.error && x.error.code;
    if (c === 'messaging/registration-token-not-registered' || c === 'messaging/invalid-registration-token') dead.push(tokens[i]);
  });
  await Promise.all(dead.map(t => admin.firestore().collection('pushTokens').doc(t).delete()));
});
