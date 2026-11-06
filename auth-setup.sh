#!/usr/bin/env bash
# Ενεργοποίηση εισόδου προσωπικού, όλα από το τερματικό.
# Βήμα 1:  ./auth-setup.sh enable                          → ενεργοποιεί την είσοδο με email/κωδικό στο Firebase
# Βήμα 2:  ./auth-setup.sh adduser το@email.σου ΚΩΔΙΚΟΣ     → δημιουργεί τον λογαριασμό του διαχειριστή (εσένα)
# Βήμα 3:  ./auth-setup.sh rules το@email.σου               → ανεβάζει τους κανόνες (κλειδώνει τη βάση) με διαχειριστή το email σου
set -euo pipefail
PROJECT="${PROJECT:-parking-gavriil-2026}"
command -v firebase >/dev/null || npm install -g firebase-tools
case "${1:-}" in
  enable)
    TOKEN=$(gcloud auth print-access-token 2>/dev/null || true)
    if [ -z "$TOKEN" ]; then
      echo "Χρειάζεται gcloud:  gcloud auth login   (ή άνοιξε: https://console.firebase.google.com/project/$PROJECT/authentication/providers → Email/Password → Ενεργοποίηση)"; exit 1
    fi
    # ξεκινά το Authentication (αν δεν έχει ξεκινήσει) και ενεργοποιεί email+κωδικό
    curl -sS -X POST -H "Authorization: Bearer $TOKEN" -H "X-Goog-User-Project: $PROJECT" -H "Content-Type: application/json" \
      "https://identitytoolkit.googleapis.com/v2/projects/$PROJECT/identityPlatform:initializeAuth" -d '{}' >/dev/null || true
    curl -sS -X PATCH -H "Authorization: Bearer $TOKEN" -H "X-Goog-User-Project: $PROJECT" -H "Content-Type: application/json" \
      "https://identitytoolkit.googleapis.com/admin/v2/projects/$PROJECT/config?updateMask=signIn.email" \
      -d '{"signIn":{"email":{"enabled":true,"passwordRequired":true}}}'
    echo; echo "✓ Ενεργοποιήθηκε η είσοδος με email/κωδικό"
    ;;
  adduser)
    EMAIL="$(echo "${2:?email}" | tr 'A-Z' 'a-z')"; PW="${3:?κωδικός (min 6)}"
    KEY=$(grep -o '"apiKey": *"[^"]*"' firebase-config.js | sed 's/.*: *"//;s/"$//')
    curl -sS -X POST "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=$KEY" -H "Content-Type: application/json" \
      -d "{\"email\":\"$EMAIL\",\"password\":\"$PW\",\"returnSecureToken\":false}" | grep -q '"localId"' \
      && echo "✓ Δημιουργήθηκε ο λογαριασμός $EMAIL" || { echo "✗ Απέτυχε (υπάρχει ήδη ή η είσοδος δεν είναι ενεργοποιημένη)"; exit 1; }
    ;;
  rules)
    EMAIL="$(echo "${2:?Δώσε το email του διαχειριστή}" | tr 'A-Z' 'a-z')"
    sed "s/ADMIN_EMAIL/$EMAIL/" firestore.rules > /tmp/firestore.rules.deploy
    cp firestore.rules /tmp/firestore.rules.orig
    cp /tmp/firestore.rules.deploy firestore.rules
    firebase deploy --only firestore:rules --project "$PROJECT" || { cp /tmp/firestore.rules.orig firestore.rules; exit 1; }
    cp /tmp/firestore.rules.orig firestore.rules
    echo "✓ Οι κανόνες ανέβηκαν. Μόνο το προσωπικό έχει πλέον πρόσβαση."
    ;;
  *) echo "Χρήση: ./auth-setup.sh enable | adduser email κωδικός | rules email"; exit 1;;
esac
