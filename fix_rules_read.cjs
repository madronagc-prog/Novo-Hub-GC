const fs = require('fs');
let content = fs.readFileSync('firestore.rules', 'utf8');

content = content.replace(
  /match \/services\/\{serviceId\} \{\s*allow read:\s*if isAuthenticated\(\);\s*allow write: if isAdmin\(\);\s*\}/,
  `match /services/{serviceId} {
      allow read:  if true;
      allow write: if isAdmin();
    }`
);

content = content.replace(
  /match \/madronaLab\/\{itemId\} \{\s*allow read:\s*if isAuthenticated\(\);\s*allow write: if isAdmin\(\);\s*\}/,
  `match /madronaLab/{itemId} {
      allow read:  if true;
      allow write: if isAdmin();
    }`
);

fs.writeFileSync('firestore.rules', content);
console.log('Fixed firestore.rules read rules');
