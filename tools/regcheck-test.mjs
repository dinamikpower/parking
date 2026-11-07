// Δοκιμή αναγνώρισης μάρκας/μοντέλου από ελληνική πινακίδα (RegCheck API).
// Χρήση:  REGCHECK_USER=το_username_σου node tools/regcheck-test.mjs POT1309 ΙΑΒ4093 ...
// Το username το παίρνεις δωρεάν-δοκιμαστικά από https://www.regcheck.org.uk (εγγραφή, μετά API).
const user = process.env.REGCHECK_USER;
const plates = process.argv.slice(2);
if (!user || !plates.length){ console.log('Χρήση: REGCHECK_USER=username node tools/regcheck-test.mjs ΠΙΝΑΚΙΔΑ [ΠΙΝΑΚΙΔΑ ...]'); process.exit(1); }

// Ελληνικά γράμματα -> λατινικά ίδιας εμφάνισης (η υπηρεσία θέλει λατινικά)
const MAP = {Α:'A',Β:'B',Ε:'E',Ζ:'Z',Η:'H',Ι:'I',Κ:'K',Μ:'M',Ν:'N',Ο:'O',Ρ:'P',Τ:'T',Υ:'Y',Χ:'X'};
const norm = s => [...s.toUpperCase().replace(/[^0-9A-ZΑ-Ω]/g,'')].map(c => MAP[c] || c).join('');

for (const raw of plates){
  const p = norm(raw);
  const url = `https://www.regcheck.org.uk/api/reg.asmx/CheckGreece?RegistrationNumber=${encodeURIComponent(p)}&username=${encodeURIComponent(user)}`;
  try {
    const r = await fetch(url);
    const t = await r.text();
    const json = (t.match(/<vehicleJson>([\s\S]*?)<\/vehicleJson>/) || [])[1];
    if (json){
      const d = JSON.parse(json.replace(/&quot;/g,'"').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>'));
      console.log(`${p}: ${d.Description || '-'} | μάρκα: ${d.CarMake?.CurrentTextValue || '-'} | μοντέλο: ${d.CarModel?.CurrentTextValue || d.Description || '-'} | έτος/ημ.: ${d.RegistrationDate || d.RegistrationYear || '-'} | κυβικά: ${d.EngineSize?.CurrentTextValue || d.EngineSize || '-'}`);
    } else {
      console.log(`${p}: δεν βρέθηκε  (${r.status}) ${t.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0,160)}`);
    }
  } catch (e){ console.log(`${p}: σφάλμα ${e.message}`); }
}
