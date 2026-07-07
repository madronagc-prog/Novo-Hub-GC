const fs = require('fs');
let content = fs.readFileSync('firestore.rules', 'utf8');

const regex = /match \/services\/\{serviceId\} \{\s*allow read:  if isAuthenticated\(\);\s*allow write: if isAdmin\(\);\s*\}/;
const replacement = `match /services/{serviceId} {
      allow read:  if isAuthenticated();
      allow write: if isAdmin();
    }
    match /madronaLab/{itemId} {
      allow read:  if isAuthenticated();
      allow write: if isAdmin();
    }`;

if (content.includes('match /madronaLab')) {
    console.log('Already has madronaLab');
} else {
    content = content.replace(regex, replacement);
    fs.writeFileSync('firestore.rules', content);
    console.log('Updated firestore.rules');
}
