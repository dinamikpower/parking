#!/usr/bin/env bash
# Εγκατάσταση + deploy του Parking app, όλα από το τερματικό.
# Χρήση:  ./setup.sh <μοναδικό-project-id>      π.χ.  ./setup.sh my-parking-2026
# Απαιτεί: node/npm. Το Firebase Spark (δωρεάν) plan αρκεί.
set -euo pipefail
PROJECT="${1:?Δώσε project id, π.χ. ./setup.sh my-parking-2026}"

command -v firebase >/dev/null || npm install -g firebase-tools
firebase login                       # ανοίγει browser μία φορά

# 1) Project + web app (αν υπάρχουν ήδη, τα προσπερνάει)
firebase projects:create "$PROJECT" --display-name "Parking" || echo "(το project υπάρχει ήδη)"
firebase use "$PROJECT" --add --alias default 2>/dev/null || firebase use "$PROJECT"
APP_ID=$(firebase apps:list WEB --project "$PROJECT" --json | node -e '
  let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{const r=(JSON.parse(s).result||[])[0];process.stdout.write(r?r.appId:"")})')
if [ -z "$APP_ID" ]; then
  firebase apps:create WEB "Parking Web" --project "$PROJECT"
  APP_ID=$(firebase apps:list WEB --project "$PROJECT" --json | node -e '
    let s="";process.stdin.on("data",d=>s+=d).on("end",()=>process.stdout.write(JSON.parse(s).result[0].appId))')
fi

# 2) Firestore βάση (Ευρώπη) + config για την εφαρμογή
firebase firestore:databases:create '(default)' --location=eur3 --project "$PROJECT" || echo "(η βάση υπάρχει ήδη)"
firebase apps:sdkconfig WEB "$APP_ID" --project "$PROJECT" --json | node -e '
  let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{
    const c=JSON.parse(s).result.sdkConfig;
    require("fs").writeFileSync("firebase-config.js","export default "+JSON.stringify(c,null,2)+";\n");
    console.log("γράφτηκε firebase-config.js");})'

# 3) Deploy κανόνες + hosting
firebase deploy --only firestore:rules,hosting --project "$PROJECT"
echo "Έτοιμο → https://$PROJECT.web.app"
